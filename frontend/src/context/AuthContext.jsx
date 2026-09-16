import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('apex_hostel_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on start
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getProfile();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid token');
        localStorage.removeItem('apex_hostel_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('apex_hostel_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await api.register(userData);
      localStorage.setItem('apex_hostel_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('apex_hostel_token');
    setToken(null);
    setUser(null);
  };

  // Viva demo rapid role switch helper
  const quickSwitchRole = async (targetRole) => {
    let email = 'student@hostel.com';
    let password = 'student123';

    if (targetRole === 'warden') {
      email = 'warden@hostel.com';
      password = 'warden123';
    } else if (targetRole === 'admin') {
      email = 'admin@hostel.com';
      password = 'admin123';
    }

    return await login(email, password);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const data = await api.getProfile();
      setUser(data.user);
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    quickSwitchRole,
    refreshProfile,
    isAuthenticated: Boolean(user),
    isStudent: user?.role === 'student',
    isWarden: user?.role === 'warden',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
