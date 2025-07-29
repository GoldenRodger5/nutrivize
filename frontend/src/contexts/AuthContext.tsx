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

  // On component mount, immediately clear all auth state to force fresh login
  useEffect(() => {
    console.log('🔄 AuthProvider mounted - clearing all existing auth state')
    
    // Immediately sign out from Firebase if there's an existing session
    if (auth.currentUser) {
      signOut(auth).catch(e => console.error('Error clearing Firebase auth:', e))
    }
    
    // Clear all storage
    localStorage.removeItem('authToken')
    localStorage.removeItem('authTokenExpiry')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('authTokenExpiry')
    localStorage.removeItem('firebase:authUser')
    sessionStorage.removeItem('firebase:authUser')
    sessionStorage.removeItem('allow-auto-login')
    
    // Clear API headers
    delete api.defaults.headers.common['Authorization']
    
    console.log('✅ All existing auth state cleared on app load')
  }, []) // Run once on mount

  // Helper function to clear auth tokens
  const clearAuthTokens = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authTokenExpiry')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('authTokenExpiry')
    delete api.defaults.headers.common['Authorization']
  }
  
  // Listen for PWA-specific events - modified for force login
  useEffect(() => {
    const handleAppResume = async () => {
      console.log('📱 PWA resumed - enforcing fresh login requirement')
      
      // Always clear auth and force login on PWA resume
      clearAuthTokens()
      setUser(null)
      
      // Sign out from Firebase if there's a session
      if (auth.currentUser) {
        try {
          await signOut(auth)
          console.log('🚪 Signed out from Firebase on PWA resume')
        } catch (error) {
          console.error('Error signing out on PWA resume:', error)
        }
      }
      
      // Force redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        console.log('🔄 Forcing redirect to login after PWA resume')
        window.location.replace('/login')
      }
    }
    
    // Remove token expiring handler since we don't want any auto-refresh
    const handleTokenExpiring = async () => {
      console.log('🔓 Token expiring - forcing logout and fresh login')
      await logout()
    }
    
    window.addEventListener('pwa:resumed', handleAppResume)
    window.addEventListener('auth:tokenExpiring', handleTokenExpiring)
    
    return () => {
      window.removeEventListener('pwa:resumed', handleAppResume)
      window.removeEventListener('auth:tokenExpiring', handleTokenExpiring)
    }
  }, [])
  
  useEffect(() => {
    // Always force fresh login - no token restoration allowed
    if (!hasCheckedAuth) {
      console.log('🔐 Forcing fresh login - clearing all stored authentication tokens');
      
      // Always clear all stored authentication data to force fresh login
      clearAuthTokens()
      
      // Clear Firebase auth persistence to ensure clean slate
      localStorage.removeItem('firebase:authUser')
      sessionStorage.removeItem('firebase:authUser')
      
      // Clear any auto-login flags
      sessionStorage.removeItem('allow-auto-login')
      
      // Clear any additional auth-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('firebase') || key.includes('auth') || key.includes('token')) {
          localStorage.removeItem(key)
        }
      })
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('firebase') || key.includes('auth') || key.includes('token')) {
          sessionStorage.removeItem(key)
        }
      })
      
      // Force user to be null and require fresh login
      setUser(null)
      setHasCheckedAuth(true)
      setLoading(false)
      
      console.log('✅ All authentication state cleared - user must login')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // FORCE FRESH LOGIN: Never auto-login from persisted Firebase state
      if (firebaseUser) {
        console.log('🚫 Firebase user detected but forcing logout - no auto-login allowed')
        try {
          await signOut(auth)
          console.log('✅ Forced logout from Firebase to require fresh login')
        } catch (error) {
          console.error('Error forcing logout:', error)
        }
        clearAuthTokens()
        setUser(null)
      } else {
        console.log('No Firebase user - login required')
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
      console.log('🔐 Logging in user - explicit login required every time')
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Manually handle authentication since onAuthStateChanged no longer auto-logins
      const token = await userCredential.user.getIdToken(true)
      
      // Store the token
      localStorage.setItem('authToken', token)
      sessionStorage.setItem('authToken', token)
      
      // Set expiry time - 50 minutes from now (Firebase tokens last 1 hour)
      const expiryTime = Date.now() + (50 * 60 * 1000)
      localStorage.setItem('authTokenExpiry', expiryTime.toString())
      sessionStorage.setItem('authTokenExpiry', expiryTime.toString())
      
      // Set in API headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Get user data from our API
      const response = await api.get('/auth/me')
      setUser(response.data)
      console.log('✅ User authenticated successfully')
      
    } catch (error) {
      setLoading(false)
      throw error
    } finally {
      setLoading(false)
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.nutrivize.app'}/auth/register`, {
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
    console.log('🚪 Logging out - clearing all authentication state')
    
    // Clear all tokens first
    clearAuthTokens()
    
    // Remove explicit login flag
    window.sessionStorage.removeItem('allow-auto-login')
    
    // Clear all Firebase-related storage
    localStorage.removeItem('firebase:authUser')
    sessionStorage.removeItem('firebase:authUser')
    
    // Clear any additional auth-related storage items more thoroughly
    Object.keys(localStorage).forEach(key => {
      if (key.includes('firebase') || key.includes('auth') || key.includes('token') || key.includes('user')) {
        localStorage.removeItem(key)
      }
    })
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('firebase') || key.includes('auth') || key.includes('token') || key.includes('user')) {
        sessionStorage.removeItem(key)
      }
    })
    
    // Force clear user data
    setUser(null)
    
    // Force clear auth state in the API
    delete api.defaults.headers.common['Authorization']
    
    // Sign out from Firebase
    try {
      await signOut(auth)
      console.log('✅ Signed out from Firebase successfully')
    } catch (error) {
      console.error('Error during Firebase sign out:', error)
    }
    
    // Force reload the page to ensure complete state reset
    console.log('🔄 Force reloading page to ensure clean state')
    window.location.replace('/login')
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
