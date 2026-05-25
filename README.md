# 🚦 CivicConnect — AI-Powered Civic Issue Reporting Platform

🌐 **Live Demo:** https://civic-connect-lilac.vercel.app  
🛠️ **Backend API:** https://civicconnect-backend-svvb.onrender.com  
🤖 **AI Microservice:** https://civicconnect-ai-ruoo.onrender.com  
📂 **GitHub Repository:** https://github.com/thakurpriyesh/civicConnect  

---

## 📌 Overview

CivicConnect is a full-stack AI-powered civic issue reporting platform that allows users to report real-world civic problems such as:

- 🕳️ Potholes  
- 🚮 Garbage Dumps  
- 🚧 Blocked Roads  
- 🚗 Abandoned Vehicles  
- 💧 Water Logging  
- 💡 Broken Streetlights  
- 🎨 Graffiti / Vandalism  

Users can upload images of issues, and the platform automatically analyzes them using AI to classify the issue type and estimate urgency.

---

# ✨ Features

## 🤖 AI-Powered Issue Detection
- Automatic image-based issue categorization
- AI-assisted issue caption generation
- Urgency prediction system
- Lightweight PyTorch inference pipeline

---

## 📸 Issue Reporting
- Upload issue images
- Add descriptions
- Live civic issue feed
- Real-time community reporting

---

## 👥 Community Interaction
- 👍 Upvote / 👎 Downvote issues
- Track reported issues
- View resolved reports
- Personalized user dashboard

---

## ☁️ Cloud Deployment
- Frontend deployed on **Vercel**
- Backend deployed on **Render**
- AI Microservice deployed separately on **Render**
- MongoDB Atlas cloud database integration

---

# 🏗️ Tech Stack

| Category | Technologies |
|---|---|
| 🎨 Frontend | React.js, Axios, CSS |
| ⚙️ Backend | Node.js, Express.js |
| 🤖 AI Service | FastAPI, PyTorch, Torchvision |
| 🗄️ Database | MongoDB Atlas |
| ☁️ Deployment | Vercel, Render |
| 🔧 Tools | Git, GitHub |

---

# 🧠 System Architecture

```text
React Frontend (Vercel)
        ↓
Express Backend (Render)
        ↓
FastAPI AI Service (Render)
        ↓
MongoDB Atlas
```

---

# 🚀 Technical Highlights

✅ Distributed microservice architecture  
✅ AI-powered image classification pipeline  
✅ Production deployment across multiple cloud platforms  
✅ Cross-service API communication  
✅ Environment variable configuration  
✅ CORS handling for production deployment  
✅ Optimized AI inference for low-memory infrastructure  
✅ Responsive modern UI/UX  

---

# 🛠️ Challenges Solved

### 🔥 AI Deployment Memory Limits
Initially used Transformer-based models which exceeded Render free-tier memory limits. Optimized deployment using Torchvision MobileNetV2 for lightweight inference.

### 🌍 Cross-Origin API Communication
Resolved production-level CORS and environment configuration issues between Vercel frontend and Render backend services.

### ⚡ Free-Tier Cold Starts
Handled AI service cold-start delays and deployment limitations on Render free tier infrastructure.

### 🔗 Multi-Service Integration
Successfully integrated:
- Frontend
- Backend
- AI service
- MongoDB Atlas
- Cloud deployments

---

# 📷 Screenshots

## 🏠 Dashboard
_Add screenshot here_

## 📸 AI Issue Detection
_Add screenshot here_

## 📰 Live Feed
_Add screenshot here_

## 📱 Responsive UI
_Add screenshot here_

---

# 📈 Future Improvements

- 🔐 JWT Authentication
- 🗺️ Google Maps Integration
- 📍 Geolocation-based issue reporting
- ☁️ Cloudinary image hosting
- 👨‍💼 Admin dashboard
- 🔔 Real-time notifications
- 🧠 Custom-trained civic issue detection model

---

# 👨‍💻 Author

**Priyesh Kumar Thakur**  
🎓 B.Tech CSE Student — Galgotias University