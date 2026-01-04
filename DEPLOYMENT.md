# Deployment Guide 🚀

This guide outlines how to deploy **PulseStream** as a live, production-ready application.

**Strategy:**
*   **Backend**: Deployed on **Railway** (Supports Node.js, Socket.io, and long-running processes).
*   **Frontend**: Deployed on **Vercel** (Fastest for React/Vite apps).

---

## Part 1: Backend Deployment (Railway)

1.  **Sign Up/Login**: Go to [Railway.app](https://railway.app/) and login with GitHub.
2.  **New Project**: Click **"New Project"** -> **"Deploy from GitHub repo"**.
3.  **Select Repository**: Choose your `PulseStream` repository.
4.  **Configure Service**:
    *   Click on the newly created service card.
    *   Go to **Settings** -> **Root Directory**.
    *   Enter `/backend` and save. (This tells Railway where your clean `package.json` is).
5.  **Environment Variables**:
    *   Go to the **Variables** tab.
    *   Click **Raw Editor** (top right of variables list) and paste the contents of your local `backend/.env` file.
    *   **Important Updates**:
        *   `PORT`: You can remove this; Railway sets it automatically.
        *   `MONGO_URI`: Ensure this is your **Production** Atlas Connection String (with username/password), not `localhost`.
6.  **Deploy**: Railway will automatically build and deploy. Wait for "Active".
7.  **Get URL**:
    *   Go to **Settings** -> **Networking**.
    *   Click **Generate Domain**.
    *   Copy this URL (e.g., `https://pulsestream-production.up.railway.app`). **This is your BACKEND_URL.**

---

## Part 2: Frontend Deployment (Vercel)

1.  **Sign Up/Login**: Go to [Vercel.com](https://vercel.com/) and login with GitHub.
2.  **Add New**: on Dashboard, click **"Add New..."** -> **"Project"**.
3.  **Import Git Repository**: Find `PulseStream` and click **Import**.
4.  **Project Configuration**:
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Root Directory**: Click **Edit** and select `frontend`.
5.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   **Name**: `VITE_API_URL`
    *   **Value**: Paste your **BACKEND_URL** from Part 1.
        *   *Example*: `https://pulsestream-production.up.railway.app`
        *   *Note*: Do **NOT** add a trailing slash `/` or `/api`. The code handles that.
6.  **Deploy**: Click **Deploy**.
7.  **Success**: Vercel will build the site and give you a live URL (e.g., `https://pulsestream.vercel.app`).

---

## 🔍 Verification

1.  Open your **Vercel URL**.
2.  **Test Registration**: Create a new account.
    *   *If it fails*, check the Browser Console (F12) -> Network Tab to see if the request is going to the correct Railway URL.
3.  **Test Upload**: Upload a small video.
4.  **Test Streaming**: Play the video.

**Done! Your app is live.** 🎉
