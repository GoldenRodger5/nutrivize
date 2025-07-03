import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Goal, WeightLogEntry, DailyNutritionSummary } from '../types'
import api from '../utils/api'
import { getCurrentDateInTimezone, getUserTimezone } from '../utils/timezone'

interface AppStateContextType {
  // Goals state
  activeGoal: Goal | null
  goals: Goal[]
  
  // Weight state
  currentWeight: number // in lbs
  weightLogs: WeightLogEntry[]
  
  // Daily nutrition state
  dailySummary: DailyNutritionSummary | null
  
  // Refresh functions
  refreshGoals: () => Promise<void>
  refreshWeightLogs: () => Promise<void>
  refreshDailySummary: (date?: string) => Promise<void>
  refreshAll: () => Promise<void>
  
  // Update functions
  updateCurrentWeight: (weight: number) => void
  
  // Loading states
  loading: boolean
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

interface AppStateProviderProps {
  children: ReactNode
}

// Weight conversion utilities
const kgToLbs = (kg: number) => kg * 2.20462

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [currentWeight, setCurrentWeight] = useState<number>(154) // Default in lbs
  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>([])
  const [dailySummary, setDailySummary] = useState<DailyNutritionSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshGoals = useCallback(async () => {
    try {
      console.log('🔍 Fetching goals...')
      
      // Fetch all goals
      const goalsResponse = await api.get('/goals/')
      console.log('✅ Goals response:', goalsResponse.data)
      setGoals(goalsResponse.data)
      
      // Fetch active goal
      try {
        const activeResponse = await api.get('/goals/active')
        console.log('✅ Active goal response:', activeResponse.data)
        setActiveGoal(activeResponse.data)
      } catch (error) {
        console.log('ℹ️ No active goal found (this is okay)')
        setActiveGoal(null)
      }
    } catch (error) {
      console.error('❌ Error fetching goals:', error)
    }
  }, [])

  const refreshWeightLogs = useCallback(async () => {
    try {
      const response = await api.get('/weight-logs/')
      setWeightLogs(response.data)
      
      // Update current weight from latest log
      if (response.data.length > 0) {
        const latestWeight = kgToLbs(response.data[0].weight) // Convert from kg to lbs
        setCurrentWeight(latestWeight)
      }
    } catch (error) {
      console.error('Error fetching weight logs:', error)
      // Weight logs are optional, don't throw error
    }
  }, [])

  const refreshDailySummary = useCallback(async (date?: string) => {
    try {
      // Use timezone-aware date when no date is provided
      const targetDate = date || getCurrentDateInTimezone(getUserTimezone())
      console.log('🔍 Fetching daily summary for date:', targetDate, 'using timezone:', getUserTimezone())
      
      const response = await api.get(`/food-logs/daily/${targetDate}/with-goals`)
      console.log('✅ Daily summary response:', response.data)
      console.log('🔍 Response keys:', Object.keys(response.data))
      console.log('🔍 Food logs count:', response.data.food_logs?.length || 0)
      console.log('🔍 Nutrition summary:', response.data.nutrition_summary)
      
      // Transform the response to match the expected format
      const transformedData = {
        date: targetDate,
        total_nutrition: {
          ...(response.data.nutrition_summary || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0
          }),
          water: response.data.water_summary || {
            current: 0,
            target: 64,
            percentage: 0
          }
        },
        meals: response.data.food_logs || [],
        meal_breakdown: {},
        goal_progress: response.data.goal_progress
      }
      
      setDailySummary(transformedData)
    } catch (error) {
      console.error('❌ Error fetching daily summary for date:', date, error)
      // Set empty summary if no logs exist for that date using timezone-aware date
      const fallbackDate = date || getCurrentDateInTimezone(getUserTimezone())
      setDailySummary({
        date: fallbackDate,
        total_nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          water: {
            current: 0,
            target: 64,
            percentage: 0
          }
        },
        meals: [],
        meal_breakdown: {}
      })
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        refreshGoals(),
        refreshWeightLogs(),
        refreshDailySummary()
      ])
    } catch (error) {
      console.error('Error refreshing app state:', error)
    }
    setLoading(false)
  }, [refreshGoals, refreshWeightLogs, refreshDailySummary])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const updateCurrentWeight = (weight: number) => {
    setCurrentWeight(weight)
  }

  const value = {
    activeGoal,
    goals,
    currentWeight,
    weightLogs,
    dailySummary,
    refreshGoals,
    refreshWeightLogs,
    refreshDailySummary,
    refreshAll,
    updateCurrentWeight,
    loading,
  }

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider')
  }
  return context
}
