import { useState, useEffect } from 'react'
import api from '../utils/api'

interface NutritionStreakData {
  current_streak: number
  best_streak: number
  next_milestone: number
  progress_to_milestone: number
  milestone_name: string
  streak_status: 'on_fire' | 'building' | 'starting'
}

export const useNutritionStreak = () => {
  const [nutritionStreak, setNutritionStreak] = useState<NutritionStreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNutritionStreak = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/nutrition-streak')
      setNutritionStreak(response.data)
    } catch (err: any) {
      console.error('Error fetching nutrition streak:', err)
      setError(err.message || 'Failed to load nutrition streak')
      setNutritionStreak(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNutritionStreak()
  }, [])

  return { nutritionStreak, loading, error, refetch: fetchNutritionStreak }
}
