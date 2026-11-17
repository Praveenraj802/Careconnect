import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('careconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('careconnect_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token and load fresh profile on mount
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authService.getProfile();
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('careconnect_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session expired or profile failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('auth_logout', handleAuthLogout);
    return () => window.removeEventListener('auth_logout', handleAuthLogout);
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token: newToken, user: userData } = res.data;

    setToken(newToken);
    setUser(userData);
    localStorage.setItem('careconnect_token', newToken);
    localStorage.setItem('careconnect_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { token: newToken, user: newUser } = res.data;

    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('careconnect_token', newToken);
    localStorage.setItem('careconnect_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('careconnect_token');
    localStorage.removeItem('careconnect_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('careconnect_user', JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    try {
      const res = await authService.getProfile();
      if (res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('careconnect_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Could not refresh profile:', err);
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
