import React, { createContext, useState, useEffect } from 'react';

// Create the Auth context that will be shared across the app
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // State to track if user is logged in
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // State to store user data
  const [user, setUser] = useState(null);
  
  // State to track if we've checked localStorage (prevents flash of login screen)
  const [isInitialized, setIsInitialized] = useState(false);

  // On component mount, check if user was previously logged in
  // This ensures session persists on page refresh
  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    
    if (storedUser) {
      try {
        // Parse the stored user data and restore the session
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        // If localStorage data is corrupted, clear it
        console.error('Failed to restore user from localStorage:', error);
        localStorage.removeItem('authUser');
      }
    }
    
    // Mark as initialized so the app can render the appropriate page
    setIsInitialized(true);
  }, []);

  // Handle user login
  // Validates credentials and stores user in both state and localStorage
  const login = (username, password) => {
    // Simple credential check - in production, this would be an API call
    if (username === 'testuser' && password === 'Test123') {
      const userData = { username, loginTime: new Date().toISOString() };
      
      // Store in localStorage for persistence across page refreshes
      localStorage.setItem('authUser', JSON.stringify(userData));
      
      // Update state to reflect logged-in status
      setUser(userData);
      setIsAuthenticated(true);
      
      return true;
    }
    
    return false;
  };

  // Handle user logout
  // Clears both state and localStorage
  const logout = () => {
    localStorage.removeItem('authUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Provide these values to all child components
  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isInitialized // Used to prevent UI flashing during initialization
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access to auth context
// Usage: const { isAuthenticated, user, login, logout } = useAuth();
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};
