import api from '../utils/api'

export interface Insight {
  id: string
  title: string
  content: string
  category: 'nutrition' | 'habits' | 'progress' | 'recommendation'
  importance: 1 | 2 | 3
}

export interface TrendData {
  name: string
  value: number
  unit: string
  trend?: number
  trend_direction?: 'up' | 'down' | 'same'
  target?: number
  target_unit?: string
}

export interface AnalyticsResponse {
  insights: Insight[]
  statistics: TrendData[]
  charts: any[]
  generated_at: string
  timeframe: string
  is_cached: boolean
  summary?: string
  key_achievement?: string
  main_opportunity?: string
}

export interface NutritionTrendsResponse {
  period: string
  days_analyzed: number
  trends: TrendData[]
  message?: string
}

export interface GoalProgressResponse {
  [key: string]: any
}

export interface FoodPatternsResponse {
  period: string
  days_analyzed: number
  patterns: any[]
  message?: string
}

class AnalyticsService {
  /**
   * Generate AI-powered insights about user's nutrition patterns
   */
  async generateInsights(timeframe: 'week' | 'month' = 'week', forceRefresh: boolean = false): Promise<AnalyticsResponse> {
    try {
      const response = await api.get('/analytics/insights', {
        params: {
          timeframe,
          force_refresh: forceRefresh
        }
      })
      return response.data
    } catch (error) {
      console.error('Error generating insights:', error)
      throw error
    }
  }

  /**
   * Get nutrition trends over specified number of days
   */
  async getNutritionTrends(days: number = 30): Promise<NutritionTrendsResponse> {
    try {
      const response = await api.get('/analytics/nutrition-trends', {
        params: { days }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching nutrition trends:', error)
      throw error
    }
  }

  /**
   * Get progress towards user's nutrition and health goals
   */
  async getGoalProgress(): Promise<GoalProgressResponse> {
    try {
      const response = await api.get('/analytics/goal-progress')
      return response.data
    } catch (error) {
      console.error('Error fetching goal progress:', error)
      throw error
    }
  }

  /**
   * Analyze food consumption patterns and habits
   */
  async getFoodPatterns(days: number = 30): Promise<FoodPatternsResponse> {
    try {
      const response = await api.get('/analytics/food-patterns', {
        params: { days }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching food patterns:', error)
      throw error
    }
  }

  /**
   * Get detailed macronutrient breakdown with visualizations
   */
  async getMacroBreakdown(timeframe: 'week' | 'month' = 'week'): Promise<any> {
    try {
      const response = await api.get('/analytics/macro-breakdown', {
        params: { timeframe }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching macro breakdown:', error)
      throw error
    }
  }

  /**
   * Clear cached insights for the current user
   */
  async clearInsightsCache(): Promise<{ message: string }> {
    try {
      const response = await api.delete('/analytics/insights/cache')
      return response.data
    } catch (error) {
      console.error('Error clearing insights cache:', error)
      throw error
    }
  }

  /**
   * Get weekly nutrition summary
   */
  async getWeeklySummary(endDate?: string): Promise<any> {
    try {
      const response = await api.get('/analytics/weekly-summary', {
        params: endDate ? { end_date: endDate } : {}
      })
      return response.data
    } catch (error) {
      console.error('Error fetching weekly summary:', error)
      throw error
    }
  }

  /**
   * Get comprehensive analytics data in one call with error resilience
   */
  async getComprehensiveAnalytics(timeframe: 'week' | 'month' = 'week'): Promise<{
    insights: AnalyticsResponse | null
    trends: NutritionTrendsResponse | null
    goalProgress: GoalProgressResponse | null
    patterns: FoodPatternsResponse | null
    macroBreakdown: any | null
  }> {
    const days = timeframe === 'week' ? 7 : 30
    
    // Make requests individually and handle errors gracefully
    const results = await Promise.allSettled([
      this.generateInsights(timeframe),
      this.getNutritionTrends(days),
      this.getGoalProgress(),
      this.getFoodPatterns(days),
      this.getMacroBreakdown(timeframe)
    ])

    return {
      insights: results[0].status === 'fulfilled' ? results[0].value : null,
      trends: results[1].status === 'fulfilled' ? results[1].value : null,
      goalProgress: results[2].status === 'fulfilled' ? results[2].value : null,
      patterns: results[3].status === 'fulfilled' ? results[3].value : null,
      macroBreakdown: results[4].status === 'fulfilled' ? results[4].value : null
    }
  }
}

export const analyticsService = new AnalyticsService()
