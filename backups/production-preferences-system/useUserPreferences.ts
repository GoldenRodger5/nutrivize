import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import { useToast } from '@chakra-ui/react'

export interface DietaryPreferences {
  dietary_restrictions: string[]
  allergens: string[]
  disliked_foods: string[]
  preferred_cuisines: string[]
  cooking_skill_level: string
  max_prep_time?: number
  budget_preference: string
  strictness_level: string
}

export interface NutritionPreferences {
  calorie_goal?: number
  protein_goal?: number
  carb_goal?: number
  fat_goal?: number
  fiber_goal?: number
  sodium_limit?: number
  sugar_limit?: number
  meal_frequency: number
  snack_frequency: number
}

export interface AppPreferences {
  units: string
  language: string
  timezone?: string
  theme: string
  notifications_enabled: boolean
  meal_reminders: boolean
  weekly_insights: boolean
  default_meal_type: string
  dashboard_widgets: string[]
  water_goal_fl_oz?: number
  weekly_reports?: boolean
}

export interface UserPreferences {
  dietary?: DietaryPreferences
  nutrition?: NutritionPreferences
  app?: AppPreferences
  updated_at?: string
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null
  loading: boolean
  error: string | null
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<boolean>
  updateDietaryPreferences: (prefs: Partial<DietaryPreferences>) => Promise<boolean>
  updateNutritionPreferences: (prefs: Partial<NutritionPreferences>) => Promise<boolean>
  updateAppPreferences: (prefs: Partial<AppPreferences>) => Promise<boolean>
  resetPreferences: () => Promise<boolean>
  addDislikedFood: (foodName: string) => Promise<boolean>
  removeDislikedFood: (foodName: string) => Promise<boolean>
  refreshPreferences: () => Promise<void>
}

export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { user } = useAuth()
  const toast = useToast()
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch preferences from API
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/preferences')
      setPreferences(response.data)
      
    } catch (err: any) {
      console.error('Failed to fetch preferences:', err)
      setError(err.response?.data?.detail || 'Failed to load preferences')
      
      // Set default preferences on error
      setPreferences({
        dietary: {
          dietary_restrictions: [],
          allergens: [],
          disliked_foods: [],
          preferred_cuisines: [],
          cooking_skill_level: 'intermediate',
          budget_preference: 'moderate',
          strictness_level: 'moderate'
        },
        nutrition: {
          meal_frequency: 3,
          snack_frequency: 1
        },
        app: {
          units: 'metric',
          language: 'en',
          theme: 'light',
          notifications_enabled: true,
          meal_reminders: true,
          weekly_insights: true,
          default_meal_type: 'lunch',
          dashboard_widgets: [],
          water_goal_fl_oz: 64,
          weekly_reports: true
        }
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load preferences on component mount and user change
  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  // Update all preferences
  const updatePreferences = useCallback(async (prefs: Partial<UserPreferences>): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)
      
      const response = await api.put('/preferences', prefs)
      
      // Update local state with response
      setPreferences(response.data.preferences || response.data)
      
      toast({
        title: 'Preferences Updated',
        description: 'Your preferences have been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      return true
      
    } catch (err: any) {
      console.error('Failed to update preferences:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to update preferences'
      setError(errorMessage)
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
      return false
    }
  }, [user, toast])

  // Update dietary preferences only
  const updateDietaryPreferences = useCallback(async (prefs: Partial<DietaryPreferences>): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)
      
      const response = await api.put('/preferences/dietary', prefs)
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        dietary: response.data.dietary || response.data
      }))
      
      toast({
        title: 'Dietary Preferences Updated',
        description: 'Your dietary preferences have been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      return true
      
    } catch (err: any) {
      console.error('Failed to update dietary preferences:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to update dietary preferences'
      setError(errorMessage)
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
      return false
    }
  }, [user, toast])

  // Update nutrition preferences only
  const updateNutritionPreferences = useCallback(async (prefs: Partial<NutritionPreferences>): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)
      
      const response = await api.put('/preferences/nutrition', prefs)
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        nutrition: response.data.nutrition || response.data
      }))
      
      toast({
        title: 'Nutrition Preferences Updated',
        description: 'Your nutrition goals have been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      return true
      
    } catch (err: any) {
      console.error('Failed to update nutrition preferences:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to update nutrition preferences'
      setError(errorMessage)
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
      return false
    }
  }, [user, toast])

  // Update app preferences only
  const updateAppPreferences = useCallback(async (prefs: Partial<AppPreferences>): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)
      
      const response = await api.put('/preferences/app', prefs)
      
      // Update local state
      setPreferences(prev => ({
        ...prev,
        app: response.data.app || response.data
      }))
      
      toast({
        title: 'App Settings Updated',
        description: 'Your app settings have been saved.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      return true
      
    } catch (err: any) {
      console.error('Failed to update app preferences:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to update app preferences'
      setError(errorMessage)
      
      toast({
        title: 'Update Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
      return false
    }
  }, [user, toast])

  // Reset all preferences to defaults
  const resetPreferences = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)
      
      const response = await api.delete('/preferences')
      
      // Update local state with defaults
      setPreferences(response.data.preferences)
      
      toast({
        title: 'Preferences Reset',
        description: 'All preferences have been reset to defaults.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      
      return true
      
    } catch (err: any) {
      console.error('Failed to reset preferences:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to reset preferences'
      setError(errorMessage)
      
      toast({
        title: 'Reset Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      
      return false
    }
  }, [user, toast])

  // Add disliked food
  const addDislikedFood = useCallback(async (foodName: string): Promise<boolean> => {
    if (!user || !foodName.trim()) return false

    try {
      setError(null)
      
      const response = await api.post('/preferences/disliked-foods/add', {
        food_name: foodName.trim()
      })
      
      // Update local state
      setPreferences(prev => {
        if (!prev) return prev
        return {
          ...prev,
          dietary: {
            dietary_restrictions: [],
            allergens: [],
            disliked_foods: response.data.disliked_foods,
            preferred_cuisines: [],
            cooking_skill_level: 'intermediate',
            budget_preference: 'moderate',
            strictness_level: 'moderate',
            ...prev.dietary
          }
        }
      })
      
      toast({
        title: 'Food Added',
        description: `Added "${foodName}" to your disliked foods.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      return true
      
    } catch (err: any) {
      console.error('Failed to add disliked food:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to add disliked food'
      setError(errorMessage)
      
      return false
    }
  }, [user, toast])

  // Remove disliked food
  const removeDislikedFood = useCallback(async (foodName: string): Promise<boolean> => {
    if (!user || !foodName.trim()) return false

    try {
      setError(null)
      
      const response = await api.post('/preferences/disliked-foods/remove', {
        food_name: foodName.trim()
      })
      
      // Update local state
      setPreferences(prev => {
        if (!prev) return prev
        return {
          ...prev,
          dietary: {
            dietary_restrictions: [],
            allergens: [],
            disliked_foods: response.data.disliked_foods,
            preferred_cuisines: [],
            cooking_skill_level: 'intermediate',
            budget_preference: 'moderate',
            strictness_level: 'moderate',
            ...prev.dietary
          }
        }
      })
      
      toast({
        title: 'Food Removed',
        description: `Removed "${foodName}" from your disliked foods.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      return true
      
    } catch (err: any) {
      console.error('Failed to remove disliked food:', err)
      const errorMessage = err.response?.data?.detail || 'Failed to remove disliked food'
      setError(errorMessage)
      
      return false
    }
  }, [user, toast])

  // Refresh preferences manually
  const refreshPreferences = useCallback(async (): Promise<void> => {
    await fetchPreferences()
  }, [fetchPreferences])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    updateDietaryPreferences,
    updateNutritionPreferences,
    updateAppPreferences,
    resetPreferences,
    addDislikedFood,
    removeDislikedFood,
    refreshPreferences
  }
}

/**
 * Get user's timezone preference
 */
export const getUserTimezone = (preferences?: UserPreferences | null): string => {
  // Try to get from provided preferences first
  if (preferences?.app?.timezone) {
    return preferences.app.timezone
  }
  
  // Try to get from localStorage as fallback
  try {
    const savedPrefs = localStorage.getItem('nutritionPrefs')
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      if (prefs.timezone || prefs.app?.timezone) {
        return prefs.timezone || prefs.app.timezone
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
