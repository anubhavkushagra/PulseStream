const { S3Client, GetBucketCorsCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

const checkAndFixCors = async () => {
    try {
        console.log(`Checking CORS for bucket: ${BUCKET_NAME}`);

        try {
            const data = await s3.send(new GetBucketCorsCommand({ Bucket: BUCKET_NAME }));
            console.log("Current CORS Configuration:", JSON.stringify(data.CORSRules, null, 2));
        } catch (err) {
            console.log("No CORS configuration found or error retrieving it:", err.message);
        }

        console.log("\nApplying Permissive CORS Policy...");

        const corsParams = {
            Bucket: BUCKET_NAME,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "HEAD"], // S3 only needs GET for playback
                        AllowedOrigins: ["*"], // Allow Vercel, Localhost, etc.
                        ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
                        MaxAgeSeconds: 3000
                    }
                ]
            }
        };

        await s3.send(new PutBucketCorsCommand(corsParams));
        console.log("✅ Successfully updated S3 CORS to allow all origins.");

    } catch (err) {
        console.error("Error:", err);
    }
};

checkAndFixCors();
