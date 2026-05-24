require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));
const IssueSchema = new mongoose.Schema({
    description: String,
    category: String,
    urgency: String,
    location: {
        lat: Number,
        lng: Number
    },
    imageUrl: String,
    status: {
        type: String,
        default: 'Submitted'
    },
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    author: String,
    upvotedBy: [String],
    downvotedBy: [String]
});

const Issue = mongoose.model('Issue', IssueSchema);
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });
const users = [
    { username: 'user1', password: 'pass123*' },
    { username: 'user2', password: 'pass234*' }
];

app.get("/", (req, res) => {
    res.send("Backend running");
});

app.post("/api/login", (req, res) => {
    console.log(req.body);

    const { username, password } = req.body;

    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (user) {
        return res.json({
            message: "Login successful",
            user: { username: user.username }
        });
    }

    return res.status(401).json({
        message: "Invalid credentials"
    });
});
app.post('/api/issues', upload.single('image'), async (req, res) => {
    try {
        const { author, lat, lng } = req.body;

        const formData = new FormData();

        formData.append(
            'file',
            fs.createReadStream(req.file.path)
        );

        const aiResponse = await axios.post(
            `${process.env.AI_SERVICE_URL}/analyze-image/`,
            formData,
            {
                headers: formData.getHeaders()
            }
        );

        const newIssue = new Issue({
            description: aiResponse.data.autoCaption,
            category: aiResponse.data.issueType,
            urgency: aiResponse.data.urgency,
            location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            },
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
            author
        });

        await newIssue.save();

        res.status(201).json(newIssue);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Issue creation failed'
        });
    }
});
app.get('/api/issues', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ _id: -1 });
        res.json(issues);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Failed to fetch issues'
        });
    }
});

app.get('/api/issues/by/:author', async (req, res) => {
    try {
        const issues = await Issue.find({
            author: req.params.author
        }).sort({ _id: -1 });

        res.json(issues);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Failed to fetch user issues'
        });
    }
});
app.put('/api/issues/:id/vote', async (req, res) => {
    try {
        const { userId, voteType } = req.body;

        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({
                message: 'Issue not found'
            });
        }

        const hasUpvoted = issue.upvotedBy.includes(userId);
        const hasDownvoted = issue.downvotedBy.includes(userId);

        let update = {};

        if (voteType === 'upvote') {

            if (hasUpvoted) {

                update = {
                    $inc: { upvotes: -1 },
                    $pull: { upvotedBy: userId }
                };

            } else if (hasDownvoted) {

                update = {
                    $inc: {
                        upvotes: 1,
                        downvotes: -1
                    },
                    $pull: {
                        downvotedBy: userId
                    },
                    $addToSet: {
                        upvotedBy: userId
                    }
                };

            } else {

                update = {
                    $inc: { upvotes: 1 },
                    $addToSet: {
                        upvotedBy: userId
                    }
                };
            }

        } else if (voteType === 'downvote') {

            if (hasDownvoted) {

                update = {
                    $inc: { downvotes: -1 },
                    $pull: {
                        downvotedBy: userId
                    }
                };

            } else if (hasUpvoted) {

                update = {
                    $inc: {
                        upvotes: -1,
                        downvotes: 1
                    },
                    $pull: {
                        upvotedBy: userId
                    },
                    $addToSet: {
                        downvotedBy: userId
                    }
                };

            } else {

                update = {
                    $inc: { downvotes: 1 },
                    $addToSet: {
                        downvotedBy: userId
                    }
                };
            }
        }

        const updatedIssue = await Issue.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        res.json(updatedIssue);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Voting failed'
        });
    }
});
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});