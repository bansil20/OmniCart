import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL as BASE } from '../config/api.js';

const API_BASE_URL = `${BASE}/auth`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('omnicart_token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Load user profile on mount if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
        } else {
          // Token invalid or expired
          localStorage.removeItem('omnicart_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        // Verification error handling
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      localStorage.setItem('omnicart_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      localStorage.setItem('omnicart_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Google Login / Register handler
  const googleLogin = async (googleUserData) => {
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleUserData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google Authentication failed.');
      }

      localStorage.setItem('omnicart_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Helper to directly set token & user (e.g. after OTP reset)
  const setDirectAuthData = (tokenVal, userVal) => {
    localStorage.setItem('omnicart_token', tokenVal);
    setToken(tokenVal);
    setUser(userVal);
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('omnicart_token');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        setAuthError,
        login,
        register,
        googleLogin,
        setDirectAuthData,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
