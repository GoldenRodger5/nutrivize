import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useUserPreferences } from './useUserPreferences'

// Type definitions
interface CoachingData {
  personalizedInsight: string
  urgentAction?: string
  weeklyTrend: string
  nextOptimization?: string
  aiConfidence: number
}

interface NutritionData {
  [key: string]: {
    current: number
    target: number
    percentage: number
  }
}

interface PredictionData {
  weightTrend: { direction: string; rate: string; confidence: number }
  healthScore: { current: number; predicted: number; timeframe: string }
  goals: { [key: string]: { progress: number; daysRemaining: number } }
}

interface OptimizationData {
  currentMeal?: string
  nextMeal?: string
  todayTweaks?: string[]
  urgentFix?: string
}

interface HealthScoreData {
  overall_score: number
  nutrition_score: number
  consistency_score: number
  trend: string
  insights: string[]
}

export const useAICoaching = () => {
  const [coaching, setCoaching] = useState<CoachingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCoaching = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/coaching')
      setCoaching(response.data)
    } catch (err: any) {
      console.error('Error fetching AI coaching:', err)
      setError(err.message)
      setCoaching(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoaching()
  }, [])

  return { coaching, loading, error, refetch: fetchCoaching }
}

export const useSmartNutrition = () => {
  const [nutrition, setNutrition] = useState<NutritionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { preferences } = useUserPreferences()

  const fetchNutrition = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch actual nutrition data from the backend
      const response = await api.get(`/food-logs/daily/${today}`)
      const dailyData = response.data
      
      // Get user's nutrition goals from preferences
      const calorieGoal = preferences?.nutrition?.calorie_goal || 2000
      const proteinGoal = preferences?.nutrition?.protein_goal || Math.round(calorieGoal * 0.2 / 4) // 20% of calories
      const carbGoal = preferences?.nutrition?.carb_goal || Math.round(calorieGoal * 0.5 / 4) // 50% of calories  
      const fatGoal = preferences?.nutrition?.fat_goal || Math.round(calorieGoal * 0.3 / 9) // 30% of calories
      const fiberGoal = preferences?.nutrition?.fiber_goal || 25
      const waterGoal = preferences?.app?.water_goal_fl_oz || 64
      
      // Calculate current totals from daily data
      const currentCalories = dailyData.totals?.calories || 0
      const currentProtein = dailyData.totals?.protein || 0
      const currentCarbs = dailyData.totals?.carbohydrates || 0
      const currentFat = dailyData.totals?.fat || 0
      const currentFiber = dailyData.totals?.fiber || 0
      
      // Get water logs for today
      const waterResponse = await api.get(`/water-logs/?date=${today}`)
      const waterLogs = waterResponse.data || []
      const currentWater = waterLogs.reduce((total: number, log: any) => total + (log.amount_fl_oz || 0), 0)
      
      // Calculate percentages
      const nutritionData: NutritionData = {
        calories: {
          current: currentCalories,
          target: calorieGoal,
          percentage: Math.min((currentCalories / calorieGoal) * 100, 100)
        },
        protein: {
          current: currentProtein,
          target: proteinGoal,
          percentage: Math.min((currentProtein / proteinGoal) * 100, 100)
        },
        carbs: {
          current: currentCarbs,
          target: carbGoal,
          percentage: Math.min((currentCarbs / carbGoal) * 100, 100)
        },
        fat: {
          current: currentFat,
          target: fatGoal,
          percentage: Math.min((currentFat / fatGoal) * 100, 100)
        },
        fiber: {
          current: currentFiber,
          target: fiberGoal,
          percentage: Math.min((currentFiber / fiberGoal) * 100, 100)
        },
        water: {
          current: currentWater,
          target: waterGoal,
          percentage: Math.min((currentWater / waterGoal) * 100, 100)
        }
      }
      
      setNutrition(nutritionData)
    } catch (err: any) {
      console.error('Error fetching nutrition data:', err)
      setError(err.message)
      
      // Set default/fallback values if API fails
      const calorieGoal = preferences?.nutrition?.calorie_goal || 2000
      setNutrition({
        calories: { current: 0, target: calorieGoal, percentage: 0 },
        protein: { current: 0, target: Math.round(calorieGoal * 0.2 / 4), percentage: 0 },
        carbs: { current: 0, target: Math.round(calorieGoal * 0.5 / 4), percentage: 0 },
        fat: { current: 0, target: Math.round(calorieGoal * 0.3 / 9), percentage: 0 },
        fiber: { current: 0, target: 25, percentage: 0 },
        water: { current: 0, target: preferences?.app?.water_goal_fl_oz || 64, percentage: 0 }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (preferences) {
      fetchNutrition()
    }
  }, [preferences])

  return { nutrition, loading, error, refetch: fetchNutrition }
}

export const usePredictiveAnalytics = () => {
  const [predictions, setPredictions] = useState<PredictionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/predictions')
      setPredictions(response.data)
    } catch (err: any) {
      console.error('Error fetching predictions:', err)
      setError(err.message)
      setPredictions(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
  }, [])

  return { predictions, loading, error, refetch: fetchPredictions }
}

export const useLiveOptimizations = () => {
  const [optimizations, setOptimizations] = useState<OptimizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOptimizations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/optimizations')
      setOptimizations(response.data)
    } catch (err: any) {
      console.error('Error fetching optimizations:', err)
      setError(err.message)
      setOptimizations(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptimizations()
  }, [])

  return { optimizations, loading, error, refetch: fetchOptimizations }
}

export const useHealthScore = () => {
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealthScore = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/health-score')
      setHealthScore(response.data)
    } catch (err: any) {
      console.error('Error fetching health score:', err)
      setError(err.message)
      setHealthScore(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthScore()
  }, [])

  return { healthScore, loading, error, refetch: fetchHealthScore }
}
