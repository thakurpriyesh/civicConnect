# 🏙️ CivicConnect

CivicConnect is a full-stack web application designed to empower citizens to report local civic issues. Users can log in, submit a photo of an issue (like a pothole or graffiti), and the system's AI backend will automatically analyze the image, categorize the problem, and assign an urgency level. All reports are displayed on a central dashboard where users can vote to help prioritize a response.

This project is a complete monorepo containing three separate services:
* `/client`: A React frontend for user interaction.
* `/server`: A Node.js/Express backend API for handling data, users, and uploads.
* `/ai-service`: A Python/FastAPI microservice that provides AI image analysis.

## 🚀 Core Features

* **AI-Powered Issue Classification**: Uploaded images are sent to a Python microservice using a `google/vit-base-patch16-224` (Vision Transformer) model to automatically determine the issue type and urgency.
* **Full-Stack Architecture**: Demonstrates a modern web architecture with a React SPA, a Node.js REST API, and a separate Python AI service.
* **User & Issue Management**: The Express server handles user login (demo only) and full CRUD (Create, Read, Update) operations for civic issues.
* **Image Uploads**: Uses `multer` on the backend to accept and store image files submitted by users.
* **Voting System**: Users can upvote or downvote issues, with logic to prevent duplicate votes and allow changing votes.

## 🛠️ Tech Stack

| Service | Category | Technology |
| :--- | :--- | :--- |
| **Frontend** | (`/client`) | React, Axios, `react-scripts` |
| **Backend** | (`/server`) | Node.js, Express, Mongoose, Multer, Axios |
| **AI Service**| (`/ai-service`) | Python, FastAPI, Transformers (Hugging Face), PyTorch, Pillow |
| **Database** | | MongoDB |

## ⚙️ How It Works

1.  A user logs in on the React frontend (credentials are hardcoded in the server for demo purposes, e.g., `user1` / `pass123*`).
2.  The user selects an image and submits it via the "Report Issue" form.
3.  The React app sends the image file and user data to the Node.js **`/server`** at `POST /api/issues`.
4.  The Node.js server saves the image to the `/uploads` directory using `multer`.
5.  The Node.js server then forwards the image to the Python **`/ai-service`** at `POST /analyze-image/`.
6.  The FastAPI AI service loads the image, processes it with the Vision Transformer model, and determines the `issueType`, `urgency`, and an `autoCaption`.
7.  The AI service returns this JSON data to the Node.js server.
8.  The Node.js server combines the user's data (author, location) with the AI's analysis and saves the complete `Issue` document to the MongoDB database.
9.  The React app's main dashboard fetches all issues from `GET /api/issues` and displays them, allowing users to vote.

## 🚀 Setup and Installation

This project contains three separate services that must be run simultaneously.

**Prerequisites:**
* Node.js and npm
* Python and pip
* A running MongoDB instance (expects `mongodb://127.0.0.1:27017/civic-connect`)

### 1. Backend Server (`/server`)

The Node.js/Express server handles the main API and database logic.

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Run the server
# It will run on http://localhost:5000
node server.js
```
### 2. AI Service ('/ai-service')

The Python/FastAPI server handles the image analysis.

```bash
# Navigate to the AI service directory
cd ai-service

# Install Python dependencies
# (You may need to create a requirements.txt file)
pip install fastapi "uvicorn[standard]" transformers torch pillow python-multipart

# Run the AI service
# It will run on [http://127.0.0.1:8000](http://127.0.0.1:8000)
uvicorn main:app --host 127.0.0.1 --port 8000
```
### 3. Frontend Client ('/client')

The React application is the user interface.

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Run the client
# It will run on http://localhost:3000
npm start
```
Once all three services are running, you can access the application at http://localhost:3000.
