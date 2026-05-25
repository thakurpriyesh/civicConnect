// File: client/src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config/api';

function Login({ onLogin }) {
    const [mode, setMode] = useState('signin');
    const [role, setRole] = useState('user');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const endpoint = mode === 'register' ? '/api/register' : '/api/login';
            const payload = mode === 'register'
                ? { username, password }
                : { username, password, role };

            const res = await axios.post(`${API_BASE}${endpoint}`, payload);
            onLogin(res.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
                    <div className="auth-tabs">
                        <button
                            type="button"
                            className={mode === 'signin' ? 'active' : ''}
                            onClick={() => {
                                setMode('signin');
                                setError('');
                            }}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            className={mode === 'register' ? 'active' : ''}
                            onClick={() => {
                                setMode('register');
                                setRole('user');
                                setError('');
                            }}
                        >
                            Register
                        </button>
                    </div>

                    <h2>{mode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
                    <p>
                        {mode === 'signin'
                            ? 'Sign in to continue reporting or managing issues'
                            : 'Register to start reporting civic issues'}
                    </p>

                    {mode === 'signin' && (
                        <div className="role-toggle" aria-label="Sign in role">
                            <button
                                type="button"
                                className={role === 'user' ? 'active' : ''}
                                onClick={() => setRole('user')}
                            >
                                User
                            </button>
                            <button
                                type="button"
                                className={role === 'admin' ? 'active' : ''}
                                onClick={() => setRole('admin')}
                            >
                                Admin
                            </button>
                        </div>
                    )}

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
                            {loading
                                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                                : (mode === 'signin' ? 'Sign In' : 'Register')}
                        </button>

                        {error && (
                            <p className="error-message">
                                {error}
                            </p>
                        )}
                    </form>

                    <div className="login-hint">
                        <strong>Admin credentials</strong><br />
                        admin / admin123*
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
