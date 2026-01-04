const path = require('path');
const dotenv = require('dotenv');
// Ensure .env is loaded from the backend directory regardless of where node is run
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const multer = require('multer'); // Import multer for error handling
const connectDB = require('./config/db');

// Debuging Env
console.log(`JWT_SECRET Loaded: ${process.env.JWT_SECRET ? 'Yes' : 'No'}`);

// Connect to Database
connectDB();

const app = express();

const fs = require('fs');

// Ensure uploads directory exists on startup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log(`Created uploads directory at ${uploadDir}`);
}

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for debugging
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));

app.get('/', (req, res) => {
    res.send('PulseStream API is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Multer Error Handling
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload Error: ${err.message}` });
    }
    // Custom Errors
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

const PORT = process.env.PORT || 5000;

let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
} else {
    // For testing, we might need a dummy server for socket.io if we want to test it, 
    // or just let supertest handle the http part and mock socket.io
    server = require('http').createServer(app);
}


// Socket.io Setup
const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*", // Allow all for debugging
        methods: ["GET", "POST"]
    },
});

io.on('connection', (socket) => {
    console.log('Connected to socket.io');

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        socket.emit('connected');
    });

    socket.on('disconnect', () => {
        console.log('USER DISCONNECTED');
    });
});

// Make io accessible to our router/controllers
app.set('io', io);

// Only export if testing, but the socket.io setup depends on `server` which depends on `app.listen`.
// Refactoring for strict testing is complex with the current socket setup attached to the http server.
// Alternative: Export the app, but check environment.
module.exports = app;
