import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, setupInterceptors } from '../api/axios';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = useCallback((userData, token) => {
    setUser(userData);
    setTokenState(token);
    setAccessToken(token);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setTokenState(null);
      setAccessToken(null);
      toast.success('Logged out successfully');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // Hit the refresh token endpoint
      // Our backend reads the httpOnly cookie and returns a new access token
      const response = await api.post('/auth/refresh-token');
      const newAccessToken = response.data.data.accessToken;
      
      setAccessToken(newAccessToken);
      
      // Now fetch the user data with the new token
      const userResponse = await authService.getMe();
      
      setUser(userResponse.data);
      setTokenState(newAccessToken);
      return newAccessToken;
    } catch (error) {
      // If refresh fails, we are not logged in
      setUser(null);
      setTokenState(null);
      setAccessToken(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    // Setup Axios interceptors
    setupInterceptors(refreshUser, logout);

    // On mount, try to refresh the user using the HTTP-only cookie
    const initAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        // Silent fail on mount (user just needs to login)
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshUser, logout]);

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
