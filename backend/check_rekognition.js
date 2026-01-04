const { RekognitionClient, ListCollectionsCommand } = require("@aws-sdk/client-rekognition");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const rekognition = new RekognitionClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const checkRekognition = async () => {
    try {
        console.log("Checking AWS Rekognition Access...");
        const command = new ListCollectionsCommand({});
        await rekognition.send(command);
        console.log("✅ Rekognition Access Confirmed (ListCollections successful)");
    } catch (err) {
        console.error("❌ Rekognition Access Failed:", err.message);
        console.error("Detailed Error:", err);
    }
};

checkRekognition();
