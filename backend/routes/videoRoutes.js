const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const Video = require('../models/Video');
const { processVideo } = require('../services/processingService');

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multerS3 = require('multer-s3');

// S3 Config
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// Multer S3 Storage
const storage = multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: 'public-read', // Removed as modern S3 buckets disable ACLs by default
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        cb(null, `videos/${Date.now().toString()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

function checkFileType(file, cb) {
    const filetypes = /mp4|mov|avi|mkv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /video/.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Video files only!');
    }
}

// @desc    Upload a video
// @route   POST /api/videos/upload
// @access  Private
router.post('/upload', protect, authorize('admin', 'editor'), upload.single('videoFile'), async (req, res) => {
    console.log("Upload route hit");
    console.log("File:", req.file);
    console.log("Body:", req.body);

    if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, categories } = req.body;

    try {
        const video = await Video.create({
            user: req.user._id,
            title,
            description,
            // req.file.location is the S3 URL | req.file.path is for local
            originalFilePath: req.file.location || req.file.path,
            size: req.file.size,
            categories: categories ? categories.split(',') : [],
            processingStatus: 'pending',
        });

        // Start Async Processing (Simulated + Transcoding)
        processVideo(video._id, req.app.get('io'));

        // Clear Cache so new video appears
        clearCache();

        res.status(201).json(video);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all videos (with search/filter)
// @route   GET /api/videos
// @access  Private
const { cacheMiddleware, clearCache } = require('../middleware/cache');
router.get('/', protect, cacheMiddleware, async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    // Base query logic based on Role
    let query = {};

    if (req.user.role === 'admin') {
        // Admin sees ALL videos
        query = {};
    } else if (req.user.role === 'editor') {
        // Editor sees ONLY their own vidoes
        query = { user: req.user._id };
    } else {
        // Viewer sees ONLY videos assigned to them
        query = { assignedViewers: req.user._id };
    }

    if (req.query.keyword) {
        query.title = { $regex: req.query.keyword, $options: 'i' };
    }

    // Status Filter
    if (req.query.status) {
        query.sensitivityStatus = req.query.status;
    }

    // Category Filter
    if (req.query.category) {
        query.categories = req.query.category;
    }

    try {
        const count = await Video.countDocuments(query);
        const videos = await Video.find(query)
            .populate('user', 'name email')
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ createdAt: -1 });

        res.json({ videos, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get video analytics
// @route   GET /api/videos/analytics
// @access  Private (Admin only)
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
    try {
        const totalVideos = await Video.countDocuments({});
        const flaggedVideos = await Video.countDocuments({ sensitivityStatus: 'flagged' });

        // Fetch all flagged videos to process reasons
        const flaggedList = await Video.find({ sensitivityStatus: 'flagged' }).select('flaggedReason');

        const reasons = {};
        flaggedList.forEach(v => {
            if (v.flaggedReason) {
                // Split assuming comma-separated reasons
                const parts = v.flaggedReason.split(',').map(s => s.trim());
                parts.forEach(p => {
                    // Only count valid text (skip empty strings from trailing commas)
                    if (p && p.replace(/[^a-zA-Z]/g, '').length > 0) {
                        reasons[p] = (reasons[p] || 0) + 1;
                    }
                });
            }
        });

        // Convert reasons object to array for chart
        const reasonData = Object.keys(reasons).map(key => ({
            name: key,
            count: reasons[key]
        }));

        res.json({
            totalVideos,
            flaggedVideos,
            safeVideos: totalVideos - flaggedVideos,
            reasonData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get video by ID
// @route   GET /api/videos/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
    // Check if it's a stream request (ignore if so, usually stream calls this if regex matches, but we have specific stream route below)
    // Actually the stream route is /:id/stream, so this /:id won't conflict if placed correctly.
    // However, if I place this ABOVE /:id/stream, /:id/stream might be caught by /:id if not careful with ordering or regex. 
    // "stream" is not an ID usually.
    if (req.params.id === 'upload') return next(); // Should be handled by upload route but just in case

    try {
        const video = await Video.findById(req.params.id).populate('user', 'name email');
        if (video) {
            res.json(video);
        } else {
            res.status(404).json({ message: 'Video not found' });
        }
    } catch (error) {
        // If ID is invalid objectId, it throws
        res.status(404).json({ message: 'Video not found' });
    }
});

// @desc    Stream Video
// @route   GET /api/videos/:id/stream
// @access  Public
router.get('/:id/stream', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: "Video not found" });

        // CASE 1: S3 Video (Remote)
        if (video.originalFilePath && video.originalFilePath.match(/^https?:\/\//)) {
            try {
                // Extract Key from URL
                // Format: https://bucket.s3.region.amazonaws.com/KEY
                // OR: https://s3.region.amazonaws.com/bucket/KEY
                const urlParts = new URL(video.originalFilePath);
                // Simple hack: parts after the first slash if pathname includes bucket, 
                // but usually multer-s3 returns standard location. 
                // Let's rely on the fact that the Key is the last part(s). 
                // Actually, multer-s3 "location" is the full URL. 
                // The "key" is usually just the pathname minus the leading slash.
                // NOTE: If bucket is in host (bucket.s3...), path is key.

                let key = urlParts.pathname.substring(1); // Remove leading '/'
                // Decode URI component in case of spaces
                key = decodeURIComponent(key);

                const command = new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key,
                });

                // Generate Signed URL (valid for 1 hour)
                const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

                return res.redirect(signedUrl);

            } catch (s3Error) {
                console.error("S3 Signing Error:", s3Error);
                // Fallback: Try redirecting to original URL (if public)
                return res.redirect(video.originalFilePath);
            }
        }

        // CASE 2: Local File (Legacy/Dev)
        const fs = require('fs');
        const videoPath = video.originalFilePath;
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ message: "File not found locally" });
        }

        // ... (Keep existing local stream logic if needed, or simplify)
        const videoSize = fs.statSync(videoPath).size;
        const range = req.headers.range;
        // If no range, send whole file
        if (!range) {
            const head = { 'Content-Length': videoSize, 'Content-Type': 'video/mp4' };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
            return;
        }

        const CHUNK_SIZE = 10 ** 6; // 1MB
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
        const contentLength = end - start + 1;
        const headers = {
            "Content-Range": `bytes ${start}-${end}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        };
        res.writeHead(206, headers);
        fs.createReadStream(videoPath, { start, end }).pipe(res);

    } catch (error) {
        console.error("Stream Error:", error);
        if (!res.headersSent) res.status(500).send("Stream Error");
    }
});



// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private
router.delete('/:id', protect, authorize('admin', 'editor'), async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        // Check ownership or admin
        if (video.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this video' });
        }

        // TODO: Delete from S3/Storage as well
        // For now, removing from DB
        await video.deleteOne();

        clearCache();

        res.json({ message: 'Video removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Assign video to viewers
// @route   PUT /api/videos/:id/assign
// @access  Private (Admin only)
router.put('/:id/assign', protect, authorize('admin'), async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ message: 'Video not found' });

        const { viewerIds } = req.body; // Array of User IDs

        video.assignedViewers = viewerIds;
        await video.save();

        res.json(video);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
