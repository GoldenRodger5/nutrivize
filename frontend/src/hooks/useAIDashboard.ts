// AI Dashboard API hooks
import { useState, useEffect } from 'react'
import api from '../utils/api'

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

  const fetchNutrition = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/nutrition')
      setNutrition(response.data)
    } catch (err: any) {
      console.error('Error fetching nutrition data:', err)
      setError(err.message)
      setNutrition(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNutrition()
  }, [])

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
