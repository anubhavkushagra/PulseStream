const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Video = require('./models/Video');

dotenv.config({ path: path.join(__dirname, '.env') });

const fixStuckVideos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find videos stuck in 'processing' or 'pending' for more than 5 minutes
        // For simplicity, just update ALL 'processing' status videos to 'completed'
        // so the user can see them.

        const result = await Video.updateMany(
            { processingStatus: { $in: ['processing', 'pending'] } },
            {
                $set: {
                    processingStatus: 'completed',
                    sensitivityStatus: 'flagged', // Flag them just in case
                    flaggedReason: 'Force Completed by Debug Script',
                    thumbnailPath: 'https://via.placeholder.com/640x360.png?text=Forced+Recovery'
                }
            }
        );

        console.log(`✅ Fixed Stuck Videos: ${result.modifiedCount} videos updated.`);
        console.log("These videos should now be visible/playable (if the files exist).");

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixStuckVideos();
