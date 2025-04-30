/**
 * Authentication utilities for Firebase Authentication
 */
import axios from 'axios';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';

// Add type declaration for import.meta.env
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
      [key: string]: any;
    };
  }
}

const TOKEN_KEY = 'nutrivize_auth_token';
const USER_KEY = 'nutrivize_user';

interface AuthResponse {
  uid: string;
  email: string;
  name: string;
  token: string;
}

/**
 * Store the authentication token in localStorage
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Store user data in localStorage
 */
export const setUserData = (userData: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
};

/**
 * Retrieve the authentication token from localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Retrieve user data from localStorage
 */
export const getUserData = (): any => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Remove the authentication token from localStorage
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Remove user data from localStorage
 */
export const removeUserData = (): void => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is authenticated (has a token)
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

/**
 * Register a new user with our backend (which will handle Firebase creation)
 */
export const registerUser = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    // Let the backend handle the Firebase user creation
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, {
      name,
      email,
      password
    });
    
    // Get data from response
    const { uid, email: userEmail, name: userName, token } = response.data;
    
    // Save token and user data
    setToken(token);
    setUserData({
      uid,
      email: userEmail,
      name: userName
    });
    
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user through our backend (which handles Firebase auth)
 */
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // Use backend login endpoint
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    
    // Get data from response
    const { uid, email: userEmail, name: userName, token } = response.data;
    
    // Save token and user data
    setToken(token);
    setUserData({
      uid,
      email: userEmail,
      name: userName
    });
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user by clearing local storage
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Just clear local storage - no need to call Firebase directly
    removeToken();
    removeUserData();
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<any> => {
  // Get token from localStorage instead of Firebase
  const token = getToken();
  if (!token) {
    return null;
  }
  
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const userData = {
      uid: response.data.uid,
      email: response.data.email,
      name: response.data.name,
      preferences: response.data.preferences
    };
    
    setUserData(userData);
    return userData;
  } catch (error) {
    console.error('Error getting current user:', error);
    // If unauthorized, clear token
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      removeToken();
      removeUserData();
    }
    return null;
  }
};

/**
 * Decode JWT token (simple implementation)
 * Note: This doesn't validate the token, just decodes it
 */
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}; 