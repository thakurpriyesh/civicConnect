// File: client/src/components/IssueForm.js
import React, { useState, useRef } from 'react';
import axios from 'axios';
import '../App.css';

const API_BASE = process.env.REACT_APP_API_URL || '';

function IssueForm({ currentUser, onNewIssue, onClose }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [description, setDescription] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location] = useState({ lat: 12.9716, lng: 77.5946 });
    const inputRef = useRef(null);

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.type.startsWith('image/')) handleFile(dropped);
    };

    const handleRemove = () => {
        setFile(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('lat', location.lat);
        formData.append('lng', location.lng);
        formData.append('author', currentUser.username);
        formData.append('description', description.trim());

        try {
            await axios.post(
                `${API_BASE}/api/issues`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            handleRemove();
            setDescription('');
            onNewIssue();
            onClose?.();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to report issue. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="issue-form-card">
                <div className="issue-form-header">
                    <h3>Report a New Civic Issue</h3>
                    {onClose && (
                        <button
                            type="button"
                            className="modal-close-button"
                            onClick={onClose}
                            aria-label="Close report form"
                        >
                            X
                        </button>
                    )}
                </div>

                {/* Drag-drop zone */}
                {!preview ? (
                    <div
                        className={`dropzone${dragOver ? ' drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFile(e.target.files[0])}
                            style={{ display: 'none' }}
                        />
                        <span className="dropzone-icon">
                            {dragOver ? '📂' : '📷'}
                        </span>
                        <div className="dropzone-text">
                            {dragOver ? 'Drop to upload' : 'Drag & drop your photo here'}
                        </div>
                        <div className="dropzone-sub">
                            or <span>browse files</span> · JPG, PNG, WEBP
                        </div>
                    </div>
                ) : (
                    /* Image preview */
                    <div className="image-preview-wrap">
                        <img src={preview} alt="Preview" />
                        <div className="image-preview-label">{file?.name}</div>
                        <button
                            type="button"
                            className="preview-remove"
                            onClick={handleRemove}
                            title="Remove image"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="form-group issue-description-field">
                    <label className="form-label" htmlFor="issue-description">Description</label>
                    <textarea
                        id="issue-description"
                        className="form-input issue-description-input"
                        placeholder="Describe what is wrong, where it is, and what needs attention."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        maxLength={300}
                        required
                    />
                    <span className="description-count">{description.length}/300</span>
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={!file || !description.trim() || loading}
                >
                    {loading ? (
                        <>
                            <div className="spinner" />
                            Analyzing with AI...
                        </>
                    ) : (
                        <>Submit Report</>
                    )}
                </button>
            </div>
        </form>
    );
}

export default IssueForm;
