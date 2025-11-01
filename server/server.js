// File: server/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect('mongodb://127.0.0.1:27017/civic-connect', { useNewUrlParser: true, useUnifiedTopology: true });

// --- UPDATED: IssueSchema with author and upvotedBy fields ---
// Find and update your IssueSchema
const IssueSchema = new mongoose.Schema({
    description: String,
    category: String,
    urgency: String,
    location: { lat: Number, lng: Number },
    imageUrl: String,
    status: { type: String, default: 'Submitted' },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 }, // ADDED
    author: { type: String, required: true },
    upvotedBy: [{ type: String }],
    downvotedBy: [{ type: String }] // ADDED
});
const Issue = mongoose.model('Issue', IssueSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- NEW: Hardcoded users for demonstration ---
const users = [
    { username: 'user1', password: 'pass123*' },
    { username: 'user2', password: 'pass234*' }
];

// --- NEW: Login endpoint ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ message: 'Login successful', user: { username: user.username } });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// --- UPDATED: Create issue endpoint to include author ---
// File: server/server.js

// --- Replace the old app.post('/api/issues') function with this corrected one ---
app.post('/api/issues', upload.single('image'), async (req, res) => {
    try {
        const { author, lat, lng } = req.body;
        if (!author) {
            return res.status(400).json({ message: 'Author is required.' });
        }

        const formData = new FormData();
        const imageBuffer = fs.readFileSync(req.file.path);
        formData.append('file', imageBuffer, { filename: req.file.originalname });

        // --- THIS IS THE FIX ---
        // The formData object should be the second argument directly, not nested inside a data property.
        const aiResponse = await axios.post(
            'http://127.0.0.1:8000/analyze-image/',
            formData, // Corrected structure
            { headers: formData.getHeaders() }
        );

        const newIssue = new Issue({
            description: aiResponse.data.autoCaption,
            category: aiResponse.data.issueType,
            urgency: aiResponse.data.urgency,
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            imageUrl: `http://localhost:5000/uploads/${req.file.filename}`,
            author: author
        });

        await newIssue.save();
        res.status(201).json(newIssue);
    } catch (error) {
        // This is where the 422 error was being caught
        console.error("Error creating issue:", error.message);
        res.status(500).send('Server Error');
    }
});

// --- UPDATED: Upvote endpoint to prevent multiple votes ---
// Add this new, unified vote endpoint
app.put('/api/issues/:id/vote', async (req, res) => {
    try {
        const { userId, voteType } = req.body; // voteType will be 'upvote' or 'downvote'
        const issue = await Issue.findById(req.params.id);

        const hasUpvoted = issue.upvotedBy.includes(userId);
        const hasDownvoted = issue.downvotedBy.includes(userId);

        let update = {};

        if (voteType === 'upvote') {
            if (hasUpvoted) {
                // User is clicking upvote again to remove their vote
                update = { $inc: { upvotes: -1 }, $pull: { upvotedBy: userId } };
            } else if (hasDownvoted) {
                // User is changing their vote from downvote to upvote
                update = { 
                    $inc: { upvotes: 1, downvotes: -1 }, 
                    $addToSet: { upvotedBy: userId },
                    $pull: { downvotedBy: userId } 
                };
            } else {
                // User is casting a new upvote
                update = { $inc: { upvotes: 1 }, $addToSet: { upvotedBy: userId } };
            }
        } else if (voteType === 'downvote') {
            if (hasDownvoted) {
                // User is clicking downvote again to remove their vote
                update = { $inc: { downvotes: -1 }, $pull: { downvotedBy: userId } };
            } else if (hasUpvoted) {
                // User is changing their vote from upvote to downvote
                update = { 
                    $inc: { downvotes: 1, upvotes: -1 }, 
                    $addToSet: { downvotedBy: userId },
                    $pull: { upvotedBy: userId } 
                };
            } else {
                // User is casting a new downvote
                update = { $inc: { downvotes: 1 }, $addToSet: { downvotedBy: userId } };
            }
        }

        const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(updatedIssue);

    } catch (error) {
        console.error("Vote error:", error);
        res.status(500).send('Server Error');
    }
});

// --- NEW: Endpoint to get issues by a specific author ---
app.get('/api/issues/by/:author', async (req, res) => {
    try {
        const issues = await Issue.find({ author: req.params.author }).sort({ _id: -1 });
        res.json(issues);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// --- (The other routes like GET /api/issues and PUT /api/issues/:id/status remain the same) ---
app.get('/api/issues', async (req, res) => {
    const issues = await Issue.find().sort({ upvotes: -1, _id: -1 });
    res.json(issues);
});

app.put('/api/issues/:id/status', async (req, res) => {
    const { status } = req.body;
    const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(updatedIssue);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));