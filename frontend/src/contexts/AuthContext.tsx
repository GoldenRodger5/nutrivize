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

  useEffect(() => {
    // On first load, clear any existing auth to force login
    if (!hasCheckedAuth) {
      localStorage.removeItem('authToken')
      delete api.defaults.headers.common['Authorization']
      signOut(auth).catch(() => {}) // Silent logout
      setLoading(false)
      setHasCheckedAuth(true)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase token
          const token = await firebaseUser.getIdToken(true) // Force refresh
          localStorage.setItem('authToken', token)
          
          // Set token in axios headers immediately
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Get user data from our API
          const response = await api.get('/auth/me')
          setUser(response.data)
        } catch (error) {
          console.error('❌ Error fetching user data:', error)
          localStorage.removeItem('authToken')
          delete api.defaults.headers.common['Authorization']
          setUser(null)
        }
      } else {
        localStorage.removeItem('authToken')
        delete api.defaults.headers.common['Authorization']
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
