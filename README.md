# PulseStream - Intelligent Video Management & Streaming Platform

PulseStream is a full-stack MERN application designed for secure video uploading, AI-powered content sensitivity analysis, and seamless streaming. It features a multi-tenant architecture with robust Role-Based Access Control (RBAC).

## 🚀 Features

### Core Functionality
*   **Secure Video Upload**: Direct upload to AWS S3 with metadata management.
*   **AI Content Analysis**: Integration with **AWS Rekognition** to automatically flag unsafe content (Nudity, Violence, etc.) with detailed reasons.
*   **Real-Time Updates**: Live processing progress alerts via **Socket.io**.
*   **Smart Streaming**: Optimized video playback with range requests and Presigned URLs.
*   **Analytics Dashboard**: Admin-only visual analytics (Pie & Bar charts) for content safety monitoring.

### Access Control (RBAC)
*   **Viewer**: Read-only access to assigned videos.
*   **Editor**: Can upload and manage their own videos.
*   **Admin**: Full system access, Analytics, and User Management. 
    *   *Note: Admin registration requires a Secret Key (`pulseStreamSecret2026`).*

## 🛠️ Tech Stack

**Backend**
*   **Runtime**: Node.js, Express.js
*   **Database**: MongoDB Atlas (Mongoose ODM)
*   **Storage**: AWS S3 (via `@aws-sdk/client-s3`)
*   **AI Processing**: AWS Rekognition
*   **Real-Time**: Socket.io
*   **Auth**: JWT (JSON Web Tokens)

**Frontend**
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS
*   **Charts**: Recharts
*   **Notifications**: React Toastify

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas URI
*   AWS Account (S3 Bucket & IAM User with Rekognition access)

### 1. Clone the Repository
```bash
git clone <repository_url>
cd PulseStream
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region (e.g., us-east-1)
AWS_BUCKET_NAME=your_bucket_name
```

Start the Server:
```bash
npm run dev
# Server will run on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Start the Client:
```bash
npm run dev
# Application will run on http://localhost:5173
```

---

## 📖 API Documentation

### Authentication
*   `POST /api/auth/register`: Register new user. (Admin requires `adminSecret`).
*   `POST /api/auth/login`: Authenticate user and get Token.

### Videos
*   `POST /api/videos/upload`: Upload video (Admin/Editor).
*   `GET /api/videos`: List videos (Filtered by Role & Search).
*   `GET /api/videos/:id/stream`: Stream video content.
*   `DELETE /api/videos/:id`: Delete video.
*   `GET /api/videos/analytics`: Get safety stats (Admin only).

---

## 🧪 Testing

To run backend tests (if implemented):
```bash
cd backend
npm test
```

## 🔒 Security Features
*   **Signed URLs**: Video links are time-limited and standard users cannot access S3 directly.
*   **Password Hashing**: Bcrypt for secure password storage.
*   **Input Validation**: Strict Role checks on registration.

---

**Developed for Advanced Full-Stack Assignment.**
