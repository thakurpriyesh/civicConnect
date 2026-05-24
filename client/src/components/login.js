// File: client/src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/login`,
                { username, password }
            );
            onLogin(res.data.user);
        } catch (err) {
            setError('Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* ── Left panel: branding & features ── */}
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-brand-logo">🏙️</div>
                    <div className="login-brand-name">
                        Civic<span>Connect</span>
                    </div>
                </div>

                <h1 className="login-tagline">
                    Report issues.<br />
                    <em>Drive change.</em>
                </h1>

                <p className="login-sub">
                    A community platform for surfacing civic problems — potholes,
                    broken lights, and more — so the right people can fix them fast.
                </p>


            </div>

            {/* ── Right panel: form ── */}
            <div className="login-right">
                <div className="login-form-wrap">
                    <h2>Welcome back</h2>
                    <p>Sign in to your account to continue reporting</p>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading ? 'Signing in…' : 'Sign In →'}
                        </button>

                        {error && (
                            <p className="error-message">
                                ⚠️ {error}
                            </p>
                        )}
                    </form>

                    <div className="login-hint">
                        <strong>Demo credentials</strong><br />
                        user1 / pass123* &nbsp;·&nbsp; user2 / pass234*
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;