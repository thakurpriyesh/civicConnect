// File: client/src/components/IssueForm.js
import React, { useState } from 'react';
import axios from 'axios';
import '../App.css'; // Import the stylesheet

function IssueForm({ currentUser, onNewIssue }) {
    const [file, setFile] = useState(null);
    const [location] = useState({ lat: 12.9716, lng: 77.5946 });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('image', file);
        formData.append('lat', location.lat);
        formData.append('lng', location.lng);
        formData.append('author', currentUser.username);

        try {
            await axios.post('http://localhost:5000/api/issues', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onNewIssue();
            setFile(null); // Reset the file state
            e.target.reset();
        } catch (error) {
            alert('Failed to report issue.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="issue-form">
            <h3>Report a New Civic Issue</h3>

            {/* This div now contains our custom file input elements */}
            <div className="form-content"> <div className='input-container'>
                {/* The actual file input is now hidden */}
                <input
                    type="file"
                    id="file-upload"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                    hidden
                />

                {/* This label acts as our custom button */}
                <label htmlFor="file-upload" className="custom-file-button">
                    Choose File
                </label>

                {/* This span displays the name of the chosen file */}
                <span className="file-name">
                    {file ? file.name : "No file chosen"}
                </span>
            </div>
                <button type="submit">Submit Report</button>
            </div>


        </form>
    );
}

export default IssueForm;