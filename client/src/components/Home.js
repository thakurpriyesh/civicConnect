// File: client/src/components/Home.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import IssueForm from './IssueForm';

/* ── Skeleton loader card ── */
function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-img" />
            <div className="skeleton-body">
                <div className="skeleton-line medium" />
                <div className="skeleton-line full" />
                <div className="skeleton-line short" />
            </div>
        </div>
    );
}

/* ── Urgency badge ── */
function UrgencyBadge({ status }) {
    const map = {
        submitted:    { label: 'Submitted',   cls: 'submitted'  },
        'in progress':{ label: 'In Progress', cls: 'in-progress'},
        resolved:     { label: 'Resolved',    cls: 'resolved'   },
        urgent:       { label: 'Urgent',      cls: 'urgent'     },
    };
    const s = map[status?.toLowerCase()] || { label: status, cls: 'submitted' };
    return <span className={`urgency-badge ${s.cls}`}>{s.label}</span>;
}

/* ── Single issue card ── */
function IssueCard({ issue, currentUser, onVote }) {
    const [popping, setPopping] = useState(null);
    const initials = issue.author?.[0]?.toUpperCase() || '?';

    const handleVote = (type) => {
        setPopping(type);
        setTimeout(() => setPopping(null), 350);
        onVote(issue._id, type);
    };

    const upvoted   = issue.upvotedBy?.includes(currentUser.username);
    const downvoted = issue.downvotedBy?.includes(currentUser.username);

    return (
        <div className="issue-card">
            <div className="card-image-wrap">
                <img
                    src={issue.imageUrl}
                    alt={issue.category}
                    className="card-image"
                    loading="lazy"
                />
                <UrgencyBadge status={issue.status} />
            </div>
            <div className="card-body">
                <div className="card-category">{issue.category}</div>
                <p className="card-description">{issue.description}</p>
                <div className="card-meta">
                    <div className="card-avatar">{initials}</div>
                    <span className="author-tag">{issue.author}</span>
                </div>
            </div>
            <div className="voting">
                <button
                    className={`vote-btn up${upvoted ? ' voted' : ''}${popping === 'upvote' ? ' vote-pop' : ''}`}
                    onClick={() => handleVote('upvote')}
                >
                    👍 {issue.upvotes}
                </button>
                <button
                    className={`vote-btn down${downvoted ? ' voted' : ''}${popping === 'downvote' ? ' vote-pop' : ''}`}
                    onClick={() => handleVote('downvote')}
                >
                    👎 {issue.downvotes}
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   HOME
══════════════════════════════════════ */
function Home({ currentUser, onLogout }) {
    const [allIssues, setAllIssues] = useState([]);
    const [myIssues, setMyIssues]   = useState([]);
    const [activeTab, setActiveTab] = useState('feed');
    const [loading, setLoading]     = useState(true);

    const fetchAllIssues = useCallback(async () => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/issues`);
        setAllIssues(res.data);
    }, []);

    const fetchMyIssues = useCallback(async () => {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/issues/by/${currentUser.username}`);
        setMyIssues(res.data);
    }, [currentUser.username]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchAllIssues(), fetchMyIssues()])
            .finally(() => setLoading(false));
    }, [fetchAllIssues, fetchMyIssues]);

    const handleNewIssue = () => {
        fetchAllIssues();
        fetchMyIssues();
    };

    const handleVote = async (id, voteType) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/issues/${id}/vote`, {
                userId: currentUser.username,
                voteType,
            });
            fetchAllIssues();
            fetchMyIssues();
        } catch {
            alert('Voting failed. Please try again.');
        }
    };

    const issuesToDisplay = activeTab === 'feed' ? allIssues : myIssues;
    const initials        = currentUser.username?.[0]?.toUpperCase() || '?';

    const totalIssues = allIssues.length;
    const resolved    = allIssues.filter(i => i.status?.toLowerCase() === 'resolved').length;
    const myCount     = myIssues.length;

    return (
        <div className="App">
            {/* ── Navbar ── */}
            <nav className="top-navbar">
                <div className="navbar-brand">
                    <div className="navbar-logo">🏙️</div>
                    <span className="navbar-title">Civic<span>Connect</span></span>
                </div>
                <div className="navbar-right">
                    <div className="navbar-user">
                        <div className="navbar-avatar">{initials}</div>
                        <span className="navbar-username">{currentUser.username}</span>
                    </div>
                    <button onClick={onLogout} className="logout-button">Sign out</button>
                </div>
            </nav>

            {/* ── Dashboard ── */}
            <div className="dashboard-layout">
                {/* Sidebar — navigation only, no filters */}
                <aside className="sidebar">
                    <span className="sidebar-section-label">Views</span>
                    <button
                        className={`sidebar-tab${activeTab === 'feed' ? ' active' : ''}`}
                        onClick={() => setActiveTab('feed')}
                    >
                        <span className="tab-icon">📡</span>
                        Live Feed
                        <span className="tab-count">{allIssues.length}</span>
                    </button>
                    <button
                        className={`sidebar-tab${activeTab === 'my-issues' ? ' active' : ''}`}
                        onClick={() => setActiveTab('my-issues')}
                    >
                        <span className="tab-icon">📌</span>
                        My Reports
                        <span className="tab-count">{myIssues.length}</span>
                    </button>
                </aside>

                {/* Main content */}
                <main className="main-content">
                    {/* Stats */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-icon blue">📋</div>
                            <div className="stat-info">
                                <div className="stat-value">{totalIssues}</div>
                                <div className="stat-label">Total Issues</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon green">✅</div>
                            <div className="stat-info">
                                <div className="stat-value">{resolved}</div>
                                <div className="stat-label">Resolved</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple">📌</div>
                            <div className="stat-info">
                                <div className="stat-value">{myCount}</div>
                                <div className="stat-label">My Reports</div>
                            </div>
                        </div>
                    </div>

                    {/* Upload form */}
                    <IssueForm currentUser={currentUser} onNewIssue={handleNewIssue} />

                    {/* Feed heading */}
                    <div className="section-heading">
                        <div>
                            <h2>{activeTab === 'feed' ? '📡 Live Feed' : '📌 My Reports'}</h2>
                            <p>
                                {activeTab === 'feed'
                                    ? `${allIssues.length} issues reported by the community`
                                    : `${myIssues.length} issues you've submitted`}
                            </p>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="issue-feed">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                        ) : issuesToDisplay.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🏙️</div>
                                <p>
                                    {activeTab === 'feed'
                                        ? 'No issues reported yet. Be the first!'
                                        : "You haven't reported any issues yet."}
                                </p>
                            </div>
                        ) : (
                            issuesToDisplay.map(issue => (
                                <IssueCard
                                    key={issue._id}
                                    issue={issue}
                                    currentUser={currentUser}
                                    onVote={handleVote}
                                />
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Home;