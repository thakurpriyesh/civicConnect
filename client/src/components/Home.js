// File: client/src/components/Home.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import IssueForm from './IssueForm';

const API_BASE = process.env.REACT_APP_API_URL || '';

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

function getIssueDate(issue) {
    if (issue.createdAt) return new Date(issue.createdAt);

    if (issue._id?.length >= 8) {
        return new Date(parseInt(issue._id.substring(0, 8), 16) * 1000);
    }

    return null;
}

function getIssueAge(issue) {
    const date = getIssueDate(issue);
    if (!date || Number.isNaN(date.getTime())) return 'Unknown age';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes}m old`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h old`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d old`;

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo old`;
}

function getDurationLabel(ms) {
    const diffMinutes = Math.max(1, Math.floor(ms / 60000));

    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d`;

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo`;
}

function getResolutionTime(issue) {
    if (issue.status !== 'Resolved' || !issue.createdAt || !issue.updatedAt) return null;

    const createdAt = new Date(issue.createdAt);
    const resolvedAt = new Date(issue.updatedAt);

    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(resolvedAt.getTime())) {
        return null;
    }

    return getDurationLabel(resolvedAt.getTime() - createdAt.getTime());
}

/* ── Single issue card ── */
function IssueCard({ issue, currentUser, onVote, onDelete, onResolve, showAdminActions = false }) {
    const [popping, setPopping] = useState(null);
    const initials = issue.author?.[0]?.toUpperCase() || '?';
    const isAdmin = currentUser.role === 'admin';
    const isOwner = issue.author === currentUser.username;
    const resolutionTime = getResolutionTime(issue);

    const handleVote = (type) => {
        if (isAdmin || !onVote) return;
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
                {resolutionTime && (
                    <div className="resolved-time">Resolved in {resolutionTime}</div>
                )}
                <div className="card-meta">
                    <div className="card-avatar">{initials}</div>
                    <span className="author-tag">{issue.author}</span>
                    <span className="age-tag">{getIssueAge(issue)}</span>
                </div>
            </div>
            {showAdminActions ? (
                <div className="card-actions">
                    <div className="admin-score">
                        <strong>{issue.upvotes}</strong> upvotes
                        <span>{issue.downvotes} downvotes</span>
                    </div>
                    <button
                        type="button"
                        className="resolve-button"
                        onClick={() => onResolve(issue._id)}
                    >
                        Mark resolved
                    </button>
                </div>
            ) : (
                <div className="voting">
                    <button
                        className={`vote-btn up${upvoted ? ' voted' : ''}${popping === 'upvote' ? ' vote-pop' : ''}`}
                        onClick={() => handleVote('upvote')}
                        disabled={issue.status === 'Resolved'}
                        title="Upvote"
                        aria-label={`Upvote issue with ${issue.upvotes} upvotes`}
                    >
                        <span aria-hidden="true">▲</span>
                        <span>{issue.upvotes}</span>
                    </button>
                    <button
                        className={`vote-btn down${downvoted ? ' voted' : ''}${popping === 'downvote' ? ' vote-pop' : ''}`}
                        onClick={() => handleVote('downvote')}
                        disabled={issue.status === 'Resolved'}
                        title="Downvote"
                        aria-label={`Downvote issue with ${issue.downvotes} downvotes`}
                    >
                        <span aria-hidden="true">▼</span>
                        <span>{issue.downvotes}</span>
                    </button>
                    {isOwner && (
                        <button
                            type="button"
                            className="delete-issue-button"
                            onClick={() => onDelete(issue._id)}
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════
   HOME
══════════════════════════════════════ */
function Home({ currentUser, onLogout }) {
    const [allIssues, setAllIssues] = useState([]);
    const [myIssues, setMyIssues]   = useState([]);
    const [resolvedIssues, setResolvedIssues] = useState([]);
    const [adminIssues, setAdminIssues] = useState([]);
    const [activeTab, setActiveTab] = useState('feed');
    const [loading, setLoading]     = useState(true);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isAdmin = currentUser.role === 'admin';

    const fetchAllIssues = useCallback(async () => {
        const res = await axios.get(`${API_BASE}/api/issues`);
        setAllIssues(res.data);
    }, []);

    const fetchMyIssues = useCallback(async () => {
        const res = await axios.get(`${API_BASE}/api/issues/by/${currentUser.username}?status=live`);
        setMyIssues(res.data);
    }, [currentUser.username]);

    const fetchResolvedIssues = useCallback(async () => {
        const res = await axios.get(`${API_BASE}/api/issues/by/${currentUser.username}?status=resolved`);
        setResolvedIssues(res.data);
    }, [currentUser.username]);

    const fetchAdminIssues = useCallback(async () => {
        const res = await axios.get(`${API_BASE}/api/admin/issues`);
        setAdminIssues(res.data);
    }, []);

    useEffect(() => {
        setLoading(true);
        const requests = isAdmin
            ? [fetchAdminIssues()]
            : [fetchAllIssues(), fetchMyIssues(), fetchResolvedIssues()];

        Promise.all(requests)
            .finally(() => setLoading(false));
    }, [fetchAllIssues, fetchMyIssues, fetchResolvedIssues, fetchAdminIssues, isAdmin]);

    const handleNewIssue = () => {
        fetchAllIssues();
        fetchMyIssues();
        fetchResolvedIssues();
        setActiveTab('feed');
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSidebarOpen(false);
    };

    const refreshUserIssues = () => {
        fetchAllIssues();
        fetchMyIssues();
        fetchResolvedIssues();
    };

    const handleVote = async (id, voteType) => {
        try {
            await axios.put(`${API_BASE}/api/issues/${id}/vote`, {
                userId: currentUser.username,
                voteType,
            });
            refreshUserIssues();
        } catch {
            alert('Voting failed. Please try again.');
        }
    };

    const handleDeleteIssue = async (id) => {
        if (!window.confirm('Delete this issue?')) return;

        try {
            await axios.delete(`${API_BASE}/api/issues/${id}`, {
                data: { username: currentUser.username }
            });
            refreshUserIssues();
        } catch {
            alert('Deleting failed. Please try again.');
        }
    };

    const handleResolveIssue = async (id) => {
        try {
            await axios.put(`${API_BASE}/api/admin/issues/${id}/resolve`, {
                adminUsername: currentUser.username
            });
            fetchAdminIssues();
        } catch {
            alert('Resolving failed. Please try again.');
        }
    };

    const issuesToDisplay = isAdmin
        ? adminIssues
        : activeTab === 'feed'
            ? allIssues
            : activeTab === 'resolved'
                ? resolvedIssues
                : myIssues;
    const initials        = currentUser.username?.[0]?.toUpperCase() || '?';

    const totalIssues = isAdmin ? adminIssues.length : allIssues.length;
    const resolved    = resolvedIssues.length;
    const myCount     = myIssues.length;
    const topUpvotes = adminIssues[0]?.upvotes || 0;
    const oldestIssueAge = adminIssues.length
        ? getIssueAge([...adminIssues].sort((a, b) => getIssueDate(a) - getIssueDate(b))[0])
        : '0';
    const sidebarStats = [
        {
            icon: '□',
            value: totalIssues,
            label: isAdmin ? 'Open Queue' : 'Live Issues',
            cls: 'blue'
        },
        {
            icon: '✓',
            value: isAdmin ? topUpvotes : resolved,
            label: isAdmin ? 'Top Upvotes' : 'My Resolved',
            cls: 'green'
        },
        {
            icon: '•',
            value: isAdmin ? oldestIssueAge : myCount,
            label: isAdmin ? 'Oldest Open' : 'My Reports',
            cls: 'purple'
        }
    ];

    return (
        <div className="App">
            {/* ── Navbar ── */}
            <nav className="top-navbar">
                <div className="navbar-brand">
                    <button
                        type="button"
                        className="menu-button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                    >
                        ☰
                    </button>
                    <div className="navbar-logo">🏙️</div>
                    <span className="navbar-title">Civic<span>Connect</span></span>
                </div>
                <div className="navbar-right">
                    <div className="navbar-user">
                        <div className="navbar-avatar">{initials}</div>
                        <span className="navbar-username">
                            {currentUser.username}
                            {isAdmin ? ' · Admin' : ''}
                        </span>
                    </div>
                    <button onClick={onLogout} className="logout-button">Sign out</button>
                </div>
            </nav>

            {/* ── Dashboard ── */}
            <div className="dashboard-layout">
                <button
                    type="button"
                    className={`sidebar-backdrop${sidebarOpen ? ' active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close menu"
                />

                <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
                    <div className="sidebar-mobile-header">
                        <span>Menu</span>
                        <button
                            type="button"
                            className="modal-close-button"
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Close menu"
                        >
                            X
                        </button>
                    </div>

                    <div className="mobile-sidebar-user">
                        <div className="navbar-user">
                            <div className="navbar-avatar">{initials}</div>
                            <span className="navbar-username">
                                {currentUser.username}
                                {isAdmin ? ' · Admin' : ''}
                            </span>
                        </div>
                        <button onClick={onLogout} className="logout-button">Sign out</button>
                    </div>

                    {!isAdmin && (
                        <button
                            type="button"
                            className="raise-issue-button"
                            onClick={() => {
                                setReportModalOpen(true);
                                setSidebarOpen(false);
                            }}
                        >
                            <span aria-hidden="true">+</span>
                            Raise Issue
                        </button>
                    )}

                    <span className="sidebar-section-label">Views</span>
                    {isAdmin ? (
                        <button className="sidebar-tab active">
                            <span className="tab-icon">Admin</span>
                            Issue Queue
                            <span className="tab-count">{adminIssues.length}</span>
                        </button>
                    ) : (
                        <>
                            <button
                                className={`sidebar-tab${activeTab === 'feed' ? ' active' : ''}`}
                                onClick={() => handleTabChange('feed')}
                            >
                                <span className="tab-icon">Live</span>
                                Live Feed
                                <span className="tab-count">{allIssues.length}</span>
                            </button>
                            <button
                                className={`sidebar-tab${activeTab === 'my-issues' ? ' active' : ''}`}
                                onClick={() => handleTabChange('my-issues')}
                            >
                                <span className="tab-icon">Mine</span>
                                My Reports
                                <span className="tab-count">{myIssues.length}</span>
                            </button>
                            <button
                                className={`sidebar-tab${activeTab === 'resolved' ? ' active' : ''}`}
                                onClick={() => handleTabChange('resolved')}
                            >
                                <span className="tab-icon">Done</span>
                                Resolved
                                <span className="tab-count">{resolvedIssues.length}</span>
                            </button>
                        </>
                    )}

                    <span className="sidebar-section-label stats-label">Stats</span>
                    <div className="sidebar-stats">
                        {sidebarStats.map(stat => (
                            <div className="sidebar-stat" key={stat.label}>
                                <div className={`stat-icon ${stat.cls}`}>{stat.icon}</div>
                                <div className="stat-info">
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main content */}
                <main className="main-content">
                    {/* Feed heading */}
                    <div className="section-heading">
                        <div>
                            <h2>
                                {isAdmin
                                    ? 'Issue Queue'
                                    : activeTab === 'feed'
                                        ? 'Live Feed'
                                        : activeTab === 'resolved'
                                            ? 'Resolved Reports'
                                            : 'My Reports'}
                            </h2>
                            <p>
                                {isAdmin
                                    ? `${adminIssues.length} open issues sorted by upvotes and age`
                                    : activeTab === 'feed'
                                        ? `${allIssues.length} live issues reported by the community`
                                        : activeTab === 'resolved'
                                            ? `${resolvedIssues.length} resolved issues you submitted`
                                            : `${myIssues.length} live issues you've submitted`}
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
                                        : activeTab === 'resolved'
                                            ? "None of your reports have been resolved yet."
                                            : "You haven't reported any live issues yet."}
                                </p>
                            </div>
                        ) : (
                            issuesToDisplay.map(issue => (
                                <IssueCard
                                    key={issue._id}
                                    issue={issue}
                                    currentUser={currentUser}
                                    onVote={handleVote}
                                    onDelete={handleDeleteIssue}
                                    onResolve={handleResolveIssue}
                                    showAdminActions={isAdmin}
                                />
                            ))
                        )}
                    </div>
                </main>
            </div>

            {!isAdmin && (
                <button
                    type="button"
                    className="floating-raise-button"
                    onClick={() => setReportModalOpen(true)}
                    aria-label="Raise issue"
                    title="Raise issue"
                >
                    +
                </button>
            )}

            {reportModalOpen && (
                <div className="modal-backdrop" role="presentation">
                    <div className="report-modal" role="dialog" aria-modal="true" aria-label="Raise issue">
                        <IssueForm
                            currentUser={currentUser}
                            onNewIssue={handleNewIssue}
                            onClose={() => setReportModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
