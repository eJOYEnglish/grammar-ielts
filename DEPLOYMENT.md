# Deployment Guide for Diagnostic Grammar Test

This guide covers how to deploy the application to make it live for users. The application consists of two parts:
1.  **Frontend**: The React user interface (Vite).
2.  **Backend**: The Node.js server that handles quiz logic.
(Note: The Email/Analytics flow is handled separately by Google Apps Script and is already valid).

## Prerequisites
*   A GitHub account (you have this).
*   Accounts on **Vercel** (for Frontend) and **Render** (for Backend). Both have excellent free tiers.

---

## Part 1: Deploy Backend (Render.com)

We deploy the backend first because the frontend needs the backend's URL.

1.  **Sign up/Login** to [Render.com](https://render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository: `Diagnostic_Grammar_Test`.
4.  Configure the service:
    *   **Name**: `grammar-test-backend` (or similar).
    *   **Root Directory**: `backend` (Important!).
    *   **Environment**: `Node`.
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
    *   **Plan**: Free.
5.  Click **Create Web Service**.
6.  Wait for the deployment to finish.
7.  **Copy the Service URL** from the top left (e.g., `https://grammar-test-backend.onrender.com`).
    *   *Note: The free tier spins down after inactivity. The first request might take 50s.*

---

## Part 2: Deploy Frontend (Vercel)

1.  **Sign up/Login** to [Vercel.com](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your `Diagnostic_Grammar_Test` repository.
4.  Configure the project:
    *   **Framework Preset**: `Vite` (should be auto-detected).
    *   **Root Directory**: Click `Edit` and select `frontend`.
    *   **Build Command**: `npm run build` (Default).
    *   **Environment Variables**:
        *   Key: `VITE_API_BASE_URL`
        *   Value: `https://your-backend-url.onrender.com/api` (Paste the URL from Part 1 and append `/api`).
5.  Click **Deploy**.

---

## Part 3: Verify

1.  Open the **Frontend Deployment URL** provided by Vercel.
2.  Click "Start Quiz".
3.  If the backend is sleeping, it might take a moment to load the first question.
4.  Complete a quick test path to verify integration.
