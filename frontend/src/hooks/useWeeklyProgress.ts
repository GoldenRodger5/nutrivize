import { useState, useEffect } from 'react'
import api from '../utils/api'

interface WeeklyProgressData {
  streak_days: number
  goal_achievement: number
  meals_logged: number
  water_intake: string
  trend: 'improving' | 'stable' | 'declining'
  weekly_calories: number
  consistency_score: number
}

export const useWeeklyProgress = () => {
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWeeklyProgress = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/weekly-progress')
      setWeeklyProgress(response.data)
    } catch (err: any) {
      console.error('Error fetching weekly progress:', err)
      setError(err.message || 'Failed to load weekly progress')
      setWeeklyProgress(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeeklyProgress()
  }, [])

  return { weeklyProgress, loading, error, refetch: fetchWeeklyProgress }
}
