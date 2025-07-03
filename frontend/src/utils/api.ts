import axios from 'axios'
import { auth } from './firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nutrivize.onrender.com'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 second timeout for AI endpoints
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track token refresh to prevent multiple simultaneous refreshes
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

// Helper function to store token securely across contexts
const storeAuthToken = (token: string) => {
  // Store in localStorage
  localStorage.setItem('authToken', token)
  
  // Store in sessionStorage as backup for iOS PWA
  sessionStorage.setItem('authToken', token)
  
  // Set expiry time - 50 minutes from now (Firebase tokens last 1 hour)
  const expiryTime = Date.now() + (50 * 60 * 1000)
  localStorage.setItem('authTokenExpiry', expiryTime.toString())
  sessionStorage.setItem('authTokenExpiry', expiryTime.toString())
  
  // Set in API headers
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Helper function to get token from storage
const getStoredToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
}

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // If user is logged in, try to refresh token if needed
  if (auth.currentUser) {
    try {
      // Check if we're approaching token expiry (within 5 minutes)
      const tokenExpiry = localStorage.getItem('authTokenExpiry') || sessionStorage.getItem('authTokenExpiry')
      const shouldRefresh = !tokenExpiry || parseInt(tokenExpiry) < (Date.now() + (5 * 60 * 1000))
      
      if (shouldRefresh) {
        // Force refresh the token
        const freshToken = await auth.currentUser.getIdToken(true)
        storeAuthToken(freshToken)
        config.headers.Authorization = `Bearer ${freshToken}`
        console.log('Token refreshed proactively')
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    }
  }
  
  return config
})

// Clear all auth tokens across storage mechanisms
const clearAuthTokens = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authTokenExpiry')
  sessionStorage.removeItem('authToken')
  sessionStorage.removeItem('authTokenExpiry')
  delete api.defaults.headers.common['Authorization']
}

// Check if running as iOS PWA
const isIOSPWA = () => {
  return window.navigator.userAgent.match(/iPhone|iPad|iPod/) && 
         window.matchMedia('(display-mode: standalone)').matches;
}

// Handle auth errors with better token refresh logic for PWA
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If request failed or unauthorized and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // If we have a token but the request still failed with 401, we need a fresh token
      if (auth.currentUser) {
        try {
          // Use shared refresh promise to prevent multiple simultaneous refreshes
          if (isRefreshing && refreshPromise) {
            const freshToken = await refreshPromise
            originalRequest.headers.Authorization = `Bearer ${freshToken}`
            return api(originalRequest)
          }

          if (!isRefreshing) {
            console.log('Token expired or invalid. Refreshing...')
            isRefreshing = true
            refreshPromise = auth.currentUser.getIdToken(true) // Force refresh
            
            const freshToken = await refreshPromise
            storeAuthToken(freshToken)
            
            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${freshToken}`
            
            isRefreshing = false
            refreshPromise = null
            
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          clearAuthTokens()
          isRefreshing = false
          refreshPromise = null
          
          // Special handling for iOS PWA - try to reauthenticate by returning to login
          if (isIOSPWA()) {
            console.log('iOS PWA detected, directing to login')
            // Only redirect if we're not already on the login page
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login'
            }
          } else if (!window.location.pathname.includes('/login')) {
            // Normal redirect for non-PWA
            window.location.href = '/login'
          }
        }
      } else {
        // No current user, redirect to login but handle PWA special case
        clearAuthTokens()
        // Only force login if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
