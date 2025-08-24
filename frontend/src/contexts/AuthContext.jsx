import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Create Auth Context
const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
};

// API Configuration
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim() || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const response = await api.post('/auth/refresh');
            const newToken = response.data.data.accessToken;
            
            dispatch({
              type: AUTH_ACTIONS.AUTH_SUCCESS,
              payload: {
                user: state.user,
                token: newToken
              }
            });

            // Update localStorage
            localStorage.setItem('token', newToken);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);

          } catch (refreshError) {
            // Refresh failed, logout user
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [state.token, state.user]);

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from token
  const loadUser = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      // Verify token and get user data
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: {
          user: response.data.data.user,
          token: token
        }
      });

    } catch (error) {
      console.error('Load user error:', error);
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE, payload: 'Session expired' });
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });

      const response = await api.post('/auth/register', userData);
      
      toast.success('Registration successful! Please check your email to verify your account.');
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      return { success: true, data: response.data };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });

      const response = await api.post('/auth/login', credentials);
      const { accessToken, user } = response.data.data;

      // Store token
      localStorage.setItem('token', accessToken);

      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: {
          user: user,
          token: accessToken
        }
      });

      toast.success(`Welcome back, ${user.name}!`);
      if(user.name === 'admin'){
        location.href='/admin/dashboard'; // Redirect to admin dashboard
      }else{
        location.href = '/dashboard'; // Redirect to user dashboard
      }
      return { success: true, data: response.data };

    } catch (error) {   
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.AUTH_FAILURE, payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Verify email function
  const verifyEmail = async (token) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      toast.success('Email verified successfully! You can now log in.');
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Email verification failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Resend verification email
  const resendVerification = async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      toast.success('Verification email sent successfully!');
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      toast.success('Password reset link sent to your email!');
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send password reset email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token: token,
        password: newPassword
      });
      toast.success('Password reset successfully! You can now log in.');
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.data.data.user
      });

      toast.success('Profile updated successfully!');
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    register,
    login,
    logout,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    updateProfile,
    loadUser,
    clearError,
    
    // API instance for other components to use
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export API instance for use in other services
export { api };

export default AuthContext;