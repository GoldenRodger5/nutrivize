import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../utils/firebase'
import { User } from '../types'
import api from '../utils/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

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
  
  // Helper function to clear auth tokens
  const clearAuthTokens = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authTokenExpiry')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('authTokenExpiry')
    delete api.defaults.headers.common['Authorization']
  }
  
  // Function to refresh the token when needed
  const refreshTokenIfNeeded = async () => {
    if (auth.currentUser) {
      try {
        const freshToken = await auth.currentUser.getIdToken(true)
        storeAuthToken(freshToken)
        
        // Get user data from our API
        const response = await api.get('/auth/me')
        setUser(response.data)
        
        return true
      } catch (error) {
        console.error('Failed to refresh token:', error)
        return false
      }
    }
    return false
  }
  
  // Listen for PWA-specific events
  useEffect(() => {
    const handleAppResume = async () => {
      console.log('PWA resumed - checking authentication')
      await refreshTokenIfNeeded()
    }
    
    const handleTokenExpiring = async () => {
      console.log('Token expiring - refreshing')
      await refreshTokenIfNeeded()
    }
    
    window.addEventListener('pwa:resumed', handleAppResume)
    window.addEventListener('auth:tokenExpiring', handleTokenExpiring)
    
    return () => {
      window.removeEventListener('pwa:resumed', handleAppResume)
      window.removeEventListener('auth:tokenExpiring', handleTokenExpiring)
    }
  }, [])
  
  useEffect(() => {
    // On first load, try to restore from storage (don't clear)
    if (!hasCheckedAuth) {
      // Try to get token from storage
      const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      const tokenExpiry = localStorage.getItem('authTokenExpiry') || sessionStorage.getItem('authTokenExpiry')
      
      // If we have a valid non-expired token, use it
      if (storedToken && tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      }
      
      // Check if we're in iOS PWA mode
      const isPWA = window.matchMedia('(display-mode: standalone)').matches
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      
      if (isPWA && isIOS) {
        console.log('iOS PWA detected - restoring navigation state')
        // Restore last path if available (for iOS PWA)
        const lastPath = sessionStorage.getItem('pwa:lastPath')
        if (lastPath && lastPath !== '/' && lastPath !== '/login') {
          setTimeout(() => {
            window.history.pushState({}, '', lastPath)
          }, 100)
        }
      }
      
      setHasCheckedAuth(true)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase token
          const token = await firebaseUser.getIdToken(false) // First try without refresh
          storeAuthToken(token)
          
          // Get user data from our API
          const response = await api.get('/auth/me')
          setUser(response.data)
        } catch (error) {
          console.error('❌ Error fetching user data:', error)
          clearAuthTokens()
          setUser(null)
        }
      } else {
        clearAuthTokens()
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [hasCheckedAuth])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      // First, create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Wait for auth state to change and user to be auto-created
      // Then call our registration endpoint to update user profile
      const token = await userCredential.user.getIdToken()
      
      // Call our backend registration endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      })
      
      if (!response.ok) {
        throw new Error('Registration failed')
      }
      
      // The onAuthStateChanged will handle the rest
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
