const mongoose = require('mongoose');

const videoSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        assignedViewers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        originalFilePath: {
            type: String,
            required: true,
        },
        thumbnailPath: {
            type: String,
        },
        duration: {
            type: Number, // in seconds
        },
        size: {
            type: Number, // in bytes
        },
        processingStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        sensitivityStatus: {
            type: String,
            enum: ['pending', 'safe', 'flagged'],
            default: 'pending',
        },
        flaggedReason: {
            type: String,
            default: ''
        },
        categories: [
            {
                type: String,
            }
        ],
        qualityVariants: [
            {
                quality: { type: String }, // e.g., '720p', '480p'
                path: { type: String },
            }
        ],
        views: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
    }
);

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
