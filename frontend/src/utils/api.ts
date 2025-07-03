import axios from 'axios'
import { auth } from './firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nutrivize.onrender.com'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for AI endpoints
  headers: {
    'Content-Type': 'application/json',
  },
})

// Track token refresh to prevent multiple simultaneous refreshes
let isRefreshing = false
let refreshPromise: Promise<string> | null = null

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // If user is logged in, try to refresh token if needed
  if (auth.currentUser) {
    try {
      // Check if token is about to expire (refresh 5 minutes before expiry)
      const freshToken = await auth.currentUser.getIdToken(false)
      if (freshToken !== token) {
        localStorage.setItem('authToken', freshToken)
        config.headers.Authorization = `Bearer ${freshToken}`
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
    }
  }
  
  return config
})

// Handle auth errors with better token refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (auth.currentUser) {
        try {
          // Use shared refresh promise to prevent multiple simultaneous refreshes
          if (isRefreshing && refreshPromise) {
            const freshToken = await refreshPromise
            originalRequest.headers.Authorization = `Bearer ${freshToken}`
            return api(originalRequest)
          }

          if (!isRefreshing) {
            isRefreshing = true
            refreshPromise = auth.currentUser.getIdToken(true) // Force refresh
            
            const freshToken = await refreshPromise
            localStorage.setItem('authToken', freshToken)
            
            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${freshToken}`
            
            isRefreshing = false
            refreshPromise = null
            
            return api(originalRequest)
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          localStorage.removeItem('authToken')
          isRefreshing = false
          refreshPromise = null
          
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }
      } else {
        // No current user, redirect to login
        localStorage.removeItem('authToken')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
