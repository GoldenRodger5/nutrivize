import { useState, useEffect, useCallback } from 'react'

interface UserPreferences {
  timezone: string
  units: string
  theme: string
  notifications_enabled: boolean
  weekly_reports: boolean
  water_goal_fl_oz: number
}

const defaultPreferences: UserPreferences = {
  timezone: 'America/New_York',
  units: 'metric',
  theme: 'light',
  notifications_enabled: true,
  weekly_reports: true,
  water_goal_fl_oz: 64 // 8 glasses of 8 fl oz each
}

/**
 * Hook to manage user preferences
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)

  const loadPreferences = useCallback(() => {
    try {
      const savedPrefs = localStorage.getItem('nutritionPrefs')
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs)
        setPreferences(prev => ({ ...prev, ...parsed }))
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPreferences()
  }, [loadPreferences])

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs }
    setPreferences(updated)
    
    try {
      localStorage.setItem('nutritionPrefs', JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving user preferences:', error)
    }
  }

  return {
    preferences,
    updatePreferences,
    loading
  }
}

/**
 * Get user's timezone preference
 */
export const getUserTimezone = (): string => {
  try {
    const savedPrefs = localStorage.getItem('nutritionPrefs')
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      if (prefs.timezone) {
        return prefs.timezone
      }
    }
  } catch (error) {
    console.error('Error reading timezone from preferences:', error)
  }
  
  // Fallback to browser timezone detection
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.error('Error detecting browser timezone:', error)
    return 'America/New_York' // Ultimate fallback
  }
}
