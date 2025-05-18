/**
 * Authentication utilities for Firebase Authentication
 */
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from './firebase';
import { User as FirebaseUser } from 'firebase/auth';
import api from './api';

// Type declaration for VITE_API_URL
interface ImportMetaEnv {
  VITE_API_URL?: string;
  [key: string]: any;
}

// Augment the ImportMeta interface
interface ImportMeta {
  readonly env: ImportMetaEnv;
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
  try {
    // Log token being set (for debugging)
    console.debug(`Setting token: ${token.substring(0, 10)}...`);
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

/**
 * Store user data in localStorage
 */
export const setUserData = (userData: any): void => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

/**
 * Retrieve the authentication token from localStorage
 */
export const getToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      // Log token details for debugging
      console.debug(`Retrieved token: ${token.substring(0, 10)}...`);
      return token;
    }
    console.debug('No token found in localStorage');
    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Retrieve user data from localStorage
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
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
    console.log('Registering new user:', email);
    
    // Use our backend API which handles Firebase registration
    const response = await api.post('/auth/register', {
      name,
      email,
      password
    });
    
    console.log('Registration successful, received response:', response.status);
    
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
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * Login user through our backend (which handles Firebase auth)
 */
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('Attempting to login with email:', email);
    
    // Use direct API call to our backend which handles Firebase auth
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    console.log('Login successful, received response:', response.status);
    
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
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * Logout user by clearing local storage and signing out of Firebase
 */
export const logoutUser = async (): Promise<void> => {
  try {
    // Sign out from Firebase
    await signOut(auth);
    
    // Try to call logout endpoint
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Error calling logout endpoint:', e);
    }
    
    // Clear local storage
    removeToken();
    removeUserData();
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, make sure we clear local storage
    removeToken();
    removeUserData();
  }
};

/**
 * Get current user profile from backend
 */
export const getCurrentUser = async (): Promise<any> => {
  // Get token from localStorage
  const token = getToken();
  if (!token) {
    console.debug('getCurrentUser: No token available');
    return null;
  }
  
  console.debug('getCurrentUser: Attempting to fetch user data with token');
  try {
    // Add a timeout to the request to prevent hanging
    const response = await api.get('/auth/me', { 
      timeout: 15000,
      headers: { 
        'Cache-Control': 'no-cache',
        'Authorization': `Bearer ${token}`
      } 
    });
    
    console.debug('getCurrentUser: Successfully retrieved user data:', response.data);
    const userData = {
      uid: response.data.uid,
      email: response.data.email,
      name: response.data.name,
      preferences: response.data.preferences
    };
    
    setUserData(userData);
    return userData;
  } catch (error: any) {
    console.error('Error getting current user:', error);
    console.debug('getCurrentUser error details:', 
      error.response ? `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}` : 'No response');
    
    // Only clear token for specific authentication errors
    // Don't clear token for server errors or network issues
    if (error.response?.status === 401) {
      // Look for specific invalid token messages
      const errorDetail = error.response?.data?.detail || '';
      console.log('Auth error detail:', errorDetail);
      
      if (errorDetail.includes('Invalid token') || 
          errorDetail.includes('Token has expired') ||
          errorDetail.includes('Token verification failed') ||
          errorDetail.includes('Wrong number of segments')) {
        console.log('Invalid token detected, clearing authentication data');
        removeToken();
        removeUserData();
      } else {
        console.log('Auth error but not clearing token:', errorDetail);
      }
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

/**
 * Login user directly with Firebase, bypassing backend
 * This is a temporary solution for when the backend auth endpoints are having issues
 */
export const directFirebaseLogin = async (email: string, password: string): Promise<any> => {
  try {
    console.log('Attempting direct Firebase login for:', email);
    
    // Use Firebase SDK directly to authenticate
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Get the ID token
    const token = await firebaseUser.getIdToken();
    
    // Save the token and basic user data
    setToken(token);
    setUserData({
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      name: firebaseUser.displayName || email.split('@')[0]
    });
    
    console.log('Direct Firebase login successful');
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || email.split('@')[0],
      token
    };
  } catch (error: any) {
    console.error('Direct Firebase login error:', error);
    throw error;
  }
}; 