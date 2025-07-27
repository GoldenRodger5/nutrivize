import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import api from '../utils/api'

interface OnboardingData {
  basicProfile?: {
    age?: number
    gender?: string
    height?: number
    current_weight?: number
    activity_level?: string
  }
  healthGoals?: {
    health_goals?: string[]
    target_weight?: number
    timeline?: string
  }
  dietaryPreferences?: {
    dietary_restrictions?: string[]
    allergens?: string[]
    disliked_foods?: string[]
    preferred_cuisines?: string[]
    cooking_skill_level?: string
    max_prep_time?: number
    budget_preference?: string
    strictness_level?: string
  }
  nutritionTargets?: {
    daily_calorie_goal?: number
    protein_percent?: number
    carbs_percent?: number
    fat_percent?: number
    meal_frequency?: number
  }
  appPreferences?: {
    units?: string
    notifications_enabled?: boolean
    meal_reminders?: boolean
    weekly_insights?: boolean
    theme?: string
  }
}

interface OnboardingStatus {
  onboarding_completed: boolean
  current_step?: number
  profile_completeness_score: number
  completed_steps: number[]
  next_step?: number
}

interface OnboardingContextType {
  onboardingStatus: OnboardingStatus | null
  onboardingData: OnboardingData
  currentStep: number
  loading: boolean
  error: string | null
  
  // Actions
  startOnboarding: () => Promise<void>
  saveStepData: (step: number, data: any) => Promise<void>
  completeOnboarding: () => Promise<void>
  skipOnboarding: () => Promise<void>
  updateStepData: (stepData: Partial<OnboardingData>) => void
  setCurrentStep: (step: number) => void
  getRecommendations: () => Promise<any>
  calculateCalories: (basicProfile: any, healthGoals: any) => Promise<any>
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({})
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load onboarding status when user changes
  useEffect(() => {
    if (user) {
      loadOnboardingStatus()
    }
  }, [user])

  const loadOnboardingStatus = async () => {
    try {
      setLoading(true)
      const response = await api.get('/onboarding/status')
      setOnboardingStatus(response.data)
      setCurrentStep(response.data.next_step || response.data.current_step || 1)
    } catch (error: any) {
      console.error('Failed to load onboarding status:', error)
      setError(error.response?.data?.detail || 'Failed to load onboarding status')
    } finally {
      setLoading(false)
    }
  }

  const startOnboarding = async () => {
    try {
      setLoading(true)
      setError(null)
      await api.post('/onboarding/start')
      await loadOnboardingStatus()
    } catch (error: any) {
      console.error('Failed to start onboarding:', error)
      setError(error.response?.data?.detail || 'Failed to start onboarding')
    } finally {
      setLoading(false)
    }
  }

  const saveStepData = async (step: number, data: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.post(`/onboarding/step/${step}`, data)
      
      // Update local state
      updateStepData(data)
      
      // Update onboarding status
      await loadOnboardingStatus()
      
      return response.data
    } catch (error: any) {
      console.error('Failed to save step data:', error)
      setError(error.response?.data?.detail || 'Failed to save step data')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const completeOnboarding = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const requestData = {
        basic_profile: onboardingData.basicProfile,
        health_goals: onboardingData.healthGoals,
        nutrition_targets: onboardingData.nutritionTargets,
        app_preferences: onboardingData.appPreferences
      }
      
      const response = await api.post('/onboarding/complete', requestData)
      await loadOnboardingStatus()
      
      return response.data
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error)
      setError(error.response?.data?.detail || 'Failed to complete onboarding')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const skipOnboarding = async () => {
    try {
      setLoading(true)
      setError(null)
      
      await api.post('/onboarding/skip')
      await loadOnboardingStatus()
    } catch (error: any) {
      console.error('Failed to skip onboarding:', error)
      setError(error.response?.data?.detail || 'Failed to skip onboarding')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateStepData = (stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...stepData }))
  }

  const getRecommendations = async () => {
    try {
      const response = await api.get('/onboarding/recommendations')
      return response.data
    } catch (error: any) {
      console.error('Failed to get recommendations:', error)
      throw error
    }
  }

  const calculateCalories = async (basicProfile: any, healthGoals: any) => {
    try {
      const response = await api.post('/onboarding/calculate-calories', {
        basic_profile: basicProfile,
        health_goals: healthGoals
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to calculate calories:', error)
      throw error
    }
  }

  const value = {
    onboardingStatus,
    onboardingData,
    currentStep,
    loading,
    error,
    startOnboarding,
    saveStepData,
    completeOnboarding,
    skipOnboarding,
    updateStepData,
    setCurrentStep,
    getRecommendations,
    calculateCalories
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}
