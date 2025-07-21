import React, { createContext, useContext, useEffect } from 'react'
import { useColorMode } from '@chakra-ui/react'
import { useAuth } from './AuthContext'
import api from '../utils/api'

interface ColorModeContextType {
  colorMode: string
  toggleColorMode: () => void
  setColorMode: (mode: 'light' | 'dark') => void
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined)

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colorMode, toggleColorMode, setColorMode } = useColorMode()
  const { user } = useAuth()

  // Load user's theme preference on login
  useEffect(() => {
    const loadThemePreference = async () => {
      if (user) {
        try {
          const response = await api.get('/preferences')
          const userTheme = response.data.preferences?.theme || 'light'
          if (userTheme !== colorMode) {
            setColorMode(userTheme as 'light' | 'dark')
          }
        } catch (error) {
          console.error('Failed to load theme preference:', error)
        }
      }
    }

    loadThemePreference()
  }, [user, colorMode, setColorMode])

  // Save theme preference when it changes
  const handleToggleColorMode = async () => {
    const newMode = colorMode === 'light' ? 'dark' : 'light'
    
    if (user) {
      try {
        await api.put('/preferences', {
          preferences: {
            theme: newMode
          }
        })
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    }
    
    toggleColorMode()
  }

  const handleSetColorMode = async (mode: 'light' | 'dark') => {
    if (user) {
      try {
        await api.put('/preferences', {
          preferences: {
            theme: mode
          }
        })
      } catch (error) {
        console.error('Failed to save theme preference:', error)
      }
    }
    
    setColorMode(mode)
  }

  return (
    <ColorModeContext.Provider 
      value={{ 
        colorMode, 
        toggleColorMode: handleToggleColorMode,
        setColorMode: handleSetColorMode
      }}
    >
      {children}
    </ColorModeContext.Provider>
  )
}

export const useColorModeContext = () => {
  const context = useContext(ColorModeContext)
  if (context === undefined) {
    throw new Error('useColorModeContext must be used within a ColorModeProvider')
  }
  return context
}
