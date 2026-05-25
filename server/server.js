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
}, {
    timestamps: true
});

const Issue = mongoose.model('Issue', IssueSchema);

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', UserSchema);

const adminUser = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123*',
    role: 'admin'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

function issueAgeSort() {
    return {
        upvotes: -1,
        _id: 1
    };
}

app.get("/", (req, res) => {
    res.send("Backend running");
});

app.post("/api/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const normalizedUsername = username?.trim();

        if (!normalizedUsername || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        if (normalizedUsername === adminUser.username) {
            return res.status(409).json({
                message: "Username is already taken"
            });
        }

        const existingUser = await User.findOne({
            username: normalizedUsername
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Username is already taken"
            });
        }

        const user = await User.create({
            username: normalizedUsername,
            password
        });

        return res.status(201).json({
            message: "Registration successful",
            user: {
                username: user.username,
                role: "user"
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Registration failed"
        });
    }
});

app.post("/api/login", (req, res) => {
    console.log(req.body);

    const { username, password, role = 'user' } = req.body;

    if (role === 'admin') {
        if (username === adminUser.username && password === adminUser.password) {
            return res.json({
                message: "Login successful",
                user: {
                    username: adminUser.username,
                    role: adminUser.role
                }
            });
        }

        return res.status(401).json({
            message: "Invalid credentials"
        });
    }

    User.findOne({ username, password }).then(user => {
        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        return res.json({
            message: "Login successful",
            user: {
                username: user.username,
                role: "user"
            }
        });
    }).catch(error => {
        console.error(error);
        return res.status(500).json({
            message: "Login failed"
        });
    });
});
app.post('/api/issues', upload.single('image'), async (req, res) => {
    try {
        const { author, description, lat, lng } = req.body;
        const submittedDescription = description?.trim();

        if (!req.file) {
            return res.status(400).json({
                message: 'Please attach an image before submitting'
            });
        }

        const formData = new FormData();

        formData.append(
            'file',
            fs.createReadStream(req.file.path)
        );

        let aiResponse;

        try {
            aiResponse = await axios.post(
                `${process.env.AI_SERVICE_URL}/analyze-image/`,
                formData,
                {
                    headers: formData.getHeaders()
                }
            );
        } catch (aiError) {
            console.error('AI service request failed:', aiError.message);
            return res.status(503).json({
                message: 'AI image analysis service is unavailable. Please start the AI service and try again.'
            });
        }

        const newIssue = new Issue({
            description: submittedDescription || aiResponse.data.autoCaption,
            category: aiResponse.data.issueType,
            urgency: aiResponse.data.urgency,
            location: {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            },
            imageUrl: `/uploads/${req.file.filename}`,
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
        const { status } = req.query;
        const filter = status === 'resolved'
            ? { status: 'Resolved' }
            : { status: { $ne: 'Resolved' } };
        const issues = await Issue.find(filter).sort({ _id: -1 });
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
        const filter = {
            author: req.params.author
        };

        if (req.query.status === 'resolved') {
            filter.status = 'Resolved';
        } else if (req.query.status === 'live') {
            filter.status = { $ne: 'Resolved' };
        }

        const issues = await Issue.find(filter).sort({ _id: -1 });

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

app.get('/api/admin/issues', async (req, res) => {
    try {
        const issues = await Issue.find({
            status: { $ne: 'Resolved' }
        }).sort(issueAgeSort());

        res.json(issues);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Failed to fetch admin issues'
        });
    }
});

app.put('/api/admin/issues/:id/resolve', async (req, res) => {
    try {
        const { adminUsername } = req.body;

        if (adminUsername !== adminUser.username) {
            return res.status(403).json({
                message: 'Admin access required'
            });
        }

        const issue = await Issue.findByIdAndUpdate(
            req.params.id,
            { status: 'Resolved' },
            { new: true }
        );

        if (!issue) {
            return res.status(404).json({
                message: 'Issue not found'
            });
        }

        res.json(issue);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Failed to resolve issue'
        });
    }
});

app.delete('/api/issues/:id', async (req, res) => {
    try {
        const { username } = req.body;
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({
                message: 'Issue not found'
            });
        }

        if (issue.author !== username) {
            return res.status(403).json({
                message: 'You can only delete your own issues'
            });
        }

        await Issue.findByIdAndDelete(req.params.id);
        res.json({
            message: 'Issue deleted'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Issue deletion failed'
        });
    }
});
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
