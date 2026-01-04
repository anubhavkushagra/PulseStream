const Video = require('../models/Video');
const { RekognitionClient, StartContentModerationCommand, GetContentModerationCommand } = require("@aws-sdk/client-rekognition");
const { clearCache } = require('../middleware/cache');

// Initialize Rekognition Client
const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const processVideo = async (videoId, io) => {
    console.log(`Starting processing for video ${videoId}`);

    try {
        const video = await Video.findById(videoId);
        if (!video) return;

        // Extract S3 Key from URL
        // video.originalFilePath is like "https://bucket.s3.region.amazonaws.com/videos/filename.mp4"
        // We need just "videos/filename.mp4"
        // Or if it's local path (legacy), we must skip Rekognition or mock it.
        // Assuming cloud deployment now, so URL should be S3.

        // Simple extraction logic:
        let s3Key = "";
        try {
            const urlObj = new URL(video.originalFilePath);
            s3Key = urlObj.pathname.substring(1); // Remove leading slash
            s3Key = decodeURIComponent(s3Key);
        } catch (e) {
            console.log("Not a valid URL, assuming local file or legacy.");
            // Determine fallback if needed, but for now let's assume valid S3 URL
        }

        if (!s3Key) {
            console.error("Could not extract S3 Key for Rekognition");
            video.processingStatus = 'failed';
            await video.save();
            return;
        }

        // 1. Start Content Moderation Job
        io.to(video.user.toString()).emit('video_processing', { videoId, status: 'processing', progress: 10, msg: 'Sending to AI for analysis...' });

        const startCommand = new StartContentModerationCommand({
            Video: {
                S3Object: {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Name: s3Key
                }
            },
            MinConfidence: 60 // Flag if 60% sure it's unsafe
        });

        const startResponse = await rekognition.send(startCommand);
        const jobId = startResponse.JobId;
        console.log(`Rekognition Job Started: ${jobId}`);

        // 2. Poll for Completion
        let jobStatus = 'IN_PROGRESS';
        let resultResponse;

        io.to(video.user.toString()).emit('video_processing', { videoId, status: 'processing', progress: 30, msg: 'Analyzing content...' });

        // Polling Loop
        while (jobStatus === 'IN_PROGRESS') {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const getCommand = new GetContentModerationCommand({ JobId: jobId });
            resultResponse = await rekognition.send(getCommand);
            jobStatus = resultResponse.JobStatus;

            console.log(`Job Status: ${jobStatus}`);
            // Report generic progress
            io.to(video.user.toString()).emit('video_processing', { videoId, status: 'processing', progress: 50, msg: 'AI Analysis in progress...' });
        }

        if (jobStatus === 'SUCCEEDED') {
            io.to(video.user.toString()).emit('video_processing', { videoId, status: 'processing', progress: 90, msg: 'Finalizing results...' });

            const labels = resultResponse.ModerationLabels;
            console.log(`Unsafe Labels Found: ${labels.length}`);

            const isSafe = labels.length === 0;
            const reasons = labels.map(l => l.Name).join(', ');

            video.processingStatus = 'completed';
            video.sensitivityStatus = isSafe ? 'safe' : 'flagged';
            video.flaggedReason = reasons; // Save specific reasons
            // Placeholder thumbnail for now as before
            video.thumbnailPath = 'https://via.placeholder.com/640x360.png?text=Video+Preview';

            await video.save();
            clearCache();

            io.to(video.user.toString()).emit('video_processing', {
                videoId,
                status: 'completed',
                progress: 100,
                msg: isSafe ? 'Processing Complete. Content is Safe.' : `Caution: Content Flagged (${labels.length} issues detected: ${reasons})`,
                sensitivity: video.sensitivityStatus,
                reason: reasons
            });
            console.log(`Processing Complete. Status: ${video.sensitivityStatus}`);

        } else {
            console.error("Rekognition Job Failed");
            video.processingStatus = 'failed';
            await video.save();
            clearCache();
            io.to(video.user.toString()).emit('video_processing', { videoId, status: 'failed', msg: 'AI Analysis Failed.' });
        }

    } catch (error) {
        console.error(`Processing Error: ${error.message}`);

        // FAIL-SAFE: If AI fails, we still want the video to be viewable.
        // Mark as 'completed' but 'flagged' with the error reason.
        if (video) {
            video.processingStatus = 'completed';
            video.sensitivityStatus = 'flagged';
            video.flaggedReason = `AI Processing Error: ${error.message}`;

            // Set Placeholder if thumbnail failed
            if (!video.thumbnailPath) {
                video.thumbnailPath = 'https://via.placeholder.com/640x360.png?text=Processing+Error';
            }

            await video.save();
            clearCache();

            io.to(video.user.toString()).emit('video_processing', {
                videoId,
                status: 'completed',
                sensitivity: 'flagged',
                reason: video.flaggedReason,
                msg: `AI Analysis Failed (Video is viewable): ${error.message}`
            });
        }
    }
};

module.exports = { processVideo };
