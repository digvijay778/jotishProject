import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// This component protects routes that require authentication
// If user is not authenticated, they get redirected to login page
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();

  // Don't render anything until we've checked localStorage
  // This prevents flickering between login and list page
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <p>Loading your session...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the protected component
  return children;
};
