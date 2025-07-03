import axios from 'axios'
import { auth } from './firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for AI endpoints
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // If user is logged in, try to refresh token if needed
  if (auth.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken(false) // Don't force refresh unless needed
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

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && auth.currentUser) {
      try {
        // Try to refresh token once
        const freshToken = await auth.currentUser.getIdToken(true) // Force refresh
        localStorage.setItem('authToken', freshToken)
        
        // Retry the original request with new token
        error.config.headers.Authorization = `Bearer ${freshToken}`
        return api(error.config)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        localStorage.removeItem('authToken')
        window.location.href = '/login'
      }
    } else if (error.response?.status === 401) {
      // No current user, redirect to login
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
