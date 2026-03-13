import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './contexts/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ListPage } from './pages/ListPage';
import { DetailsPage } from './pages/DetailsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import './App.css';

/**
 * Root App Component
 * 
 * This is the main entry point that sets up:
 * 1. Authentication context - manages user session
 * 2. Routing - handles navigation between pages
 * 3. Protected routes - ensures only logged-in users can see certain pages
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Login page - public route */}
          <Route path="/" element={<LoginPage />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/list"
            element={
              <ProtectedRoute>
                <ListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/details/:id"
            element={
              <ProtectedRoute>
                <DetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics/:id"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback - redirect to login if route doesn't exist */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
