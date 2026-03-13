import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../css/Login.css';

export const LoginPage = () => {
  // Form state - tracks username and password inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // UI state - tracks error messages and loading state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get auth functions from context
  const { login } = useAuth();
  
  // Navigation hook to redirect after successful login
  const navigate = useNavigate();

  // Handle form submission
  // This validates credentials and redirects to list page on success
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous error messages
    setError('');
    
    // Validate that both fields are filled
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    // Show loading state
    setIsLoading(true);

    try {
      // Attempt to login with provided credentials
      const success = login(username, password);

      if (success) {
        // Clear form on successful login
        setUsername('');
        setPassword('');
        
        // Redirect to list page
        navigate('/list');
      } else {
        // Show error if credentials are invalid
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      // Always clear loading state
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Employee Insights Dashboard</h1>
        <p className="login-subtitle">Secure Login</p>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Username input field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="testuser"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="form-input"
            />
          </div>

          {/* Password input field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Test123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="form-input"
            />
          </div>

          {/* Error message display */}
          {error && <div className="error-message">{error}</div>}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="login-button"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="credentials-hint">
          <p><strong>Demo Credentials:</strong></p>
          <p>Username: <code>testuser</code></p>
          <p>Password: <code>Test123</code></p>
        </div>
      </div>
    </div>
  );
};
