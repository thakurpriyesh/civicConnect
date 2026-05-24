// File: client/src/App.js
import React, { useState } from 'react';
import Home from './components/Home';
import Login from './components/login';
import './App.css'; // You'll want to add some new styles here

function App() {
    // If we find a user in sessionStorage, we assume they are logged in
    const [currentUser, setCurrentUser] = useState(
        JSON.parse(sessionStorage.getItem('civic-connect-user'))
    );

    const handleLogin = (user) => {
        setCurrentUser(user);
        // Store user in session storage to persist login across page refreshes
        sessionStorage.setItem('civic-connect-user', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        sessionStorage.removeItem('civic-connect-user');
    };

    return (
        <div className="App">
            <div className="app-header">
                <h1>CivicConnect</h1>
            </div>
            <main>
                {currentUser ? (
                    <Home currentUser={currentUser} onLogout={handleLogout} />
                ) : (
                    <Login onLogin={handleLogin} />
                )}
            </main>
        </div>
    );
}

export default App;