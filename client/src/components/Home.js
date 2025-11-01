// File: client/src/components/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import IssueForm from './IssueForm';

function Home({ currentUser, onLogout }) {
    const [allIssues, setAllIssues] = useState([]);
    const [myIssues, setMyIssues] = useState([]);
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'my-issues'

    const fetchAllIssues = async () => {
        const res = await axios.get('http://localhost:5000/api/issues');
        setAllIssues(res.data);
    };

    const fetchMyIssues = async () => {
        const res = await axios.get(`http://localhost:5000/api/issues/by/${currentUser.username}`);
        setMyIssues(res.data);
    };

    useEffect(() => {
        fetchAllIssues();
        fetchMyIssues();
    }, [currentUser]);

    const handleNewIssue = () => {
        // After posting a new issue, refresh both lists
        fetchAllIssues();
        fetchMyIssues();
    };

    // In Home.js, replace handleUpvote with this:
    const handleVote = async (id, voteType) => {
        try {
            // Call the new unified endpoint
            await axios.put(`http://localhost:5000/api/issues/${id}/vote`, {
                userId: currentUser.username,
                voteType: voteType
            });
            fetchAllIssues(); // Refresh the feed to show new vote counts
            fetchMyIssues(); // Also refresh my issues in case the user voted on their own post
        } catch (error) {
            alert('Voting failed. Please try again.');
        }
    }

    const issuesToDisplay = activeTab === 'feed' ? allIssues : myIssues;

    return (
        <div>
            <div className="welcome-banner">
                <span>Welcome, {currentUser.username}!</span>
                <button onClick={onLogout} className="logout-button">Logout</button>
            </div>
            <IssueForm currentUser={currentUser} onNewIssue={handleNewIssue} />
            {/* <hr /> */}
            <div className="feed-tabs">
                <button onClick={() => setActiveTab('feed')} className={activeTab === 'feed' ? 'active' : ''}>Live Feed</button>
                <button onClick={() => setActiveTab('my-issues')} className={activeTab === 'my-issues' ? 'active' : ''}>My Issues</button>
            </div>
            <div className="issue-feed">
                {issuesToDisplay.map(issue => (
                    <div key={issue._id} className="issue-card">
                        <img src={issue.imageUrl} alt={issue.category} className="card-image" />
                        <h4>{issue.category}</h4>
                        <p>{issue.description}</p>
                        <p className="author-tag">Reported by: {issue.author}</p>
                        <span className={`status status-${issue.status.toLowerCase()}`}>Status: {issue.status}</span>
{/* // In Home.js, find and replace the voting div with this: */}
                        <div className="voting">
                            <button
                                onClick={() => handleVote(issue._id, 'upvote')}
                                className={issue.upvotedBy.includes(currentUser.username) ? 'voted' : ''}
                            >
                                👍 {issue.upvotes}
                            </button>
                            <button
                                onClick={() => handleVote(issue._id, 'downvote')}
                                className={issue.downvotedBy.includes(currentUser.username) ? 'voted' : ''}
                            >
                                👎 {issue.downvotes}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;