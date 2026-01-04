const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // For demo purposes, we will try to connect to a local DB or use an ENV var.
        // Ideally, the user should provide the MONGO_URI in a .env file.
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pulsegen');

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
