import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/imageApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await authApi.verify();
        setIsAuthenticated(true);
        setUser({ username: localStorage.getItem('admin_username') || 'Admin' });
      } catch (error) {
        console.error('Session verification failed, logging out:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authApi.login({ username, password });
      const { token } = response.data;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_username', username);
      setIsAuthenticated(true);
      setUser({ username });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid username or password'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout }}>
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
