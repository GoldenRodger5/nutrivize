import api from '../utils/api'
import { LocalStorageCache, CACHE_KEYS, CACHE_TTL, CACHE_VERSION } from '../utils/localStorage'

export interface VectorStats {
  total_vectors: number
  data_types: string[]
  last_updated?: string
  vectorization_enabled: boolean
}

export interface VectorQueryResult {
  query: string
  results_count: number
  results: Array<{
    id: string
    score: number
    metadata: {
      data_type: string
      content: string
      timestamp?: string
      [key: string]: any
    }
  }>
  user_id: string
}

export interface VectorizedFoodLog {
  id: string
  food_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string
  logged_at: string
  servings: number
  serving_unit: string
  context_score?: number
}

export interface VectorizedInsights {
  insights: Array<{
    id: string
    title: string
    content: string
    category: string
    importance: number
    relevance_score: number
  }>
  related_context: string[]
  generated_at: string
}

class VectorService {
  /**
   * Get vector statistics for the current user
   */
  async getVectorStats(): Promise<VectorStats> {
    try {
      const cacheKey = CACHE_KEYS.VECTOR_STATS
      const cached = LocalStorageCache.get<VectorStats>(cacheKey, CACHE_VERSION.CURRENT)
      
      if (cached) {
        return cached
      }

      const response = await api.get('/vectors/stats')
      const data = response.data
      
      // Cache for 30 minutes
      LocalStorageCache.set(cacheKey, data, CACHE_TTL.MEDIUM, CACHE_VERSION.CURRENT)
      
      return data
    } catch (error) {
      console.error('Error getting vector stats:', error)
      throw error
    }
  }

  /**
   * Query user's vectorized data for relevant context
   */
  async queryUserContext(
    query: string, 
    dataTypes?: string[], 
    topK: number = 10
  ): Promise<VectorQueryResult> {
    try {
      const response = await api.post('/vectors/query', {
        query,
        data_types: dataTypes,
        top_k: topK
      })
      
      return response.data
    } catch (error) {
      console.error('Error querying vectors:', error)
      throw error
    }
  }

  /**
   * Get vectorized food logs with smart relevance scoring
   */
  async getSmartFoodLogs(
    date: string
  ): Promise<VectorizedFoodLog[]> {
    try {
      const cacheKey = `${CACHE_KEYS.FOOD_LOGS}_vector_${date}`
      const cached = LocalStorageCache.get<VectorizedFoodLog[]>(cacheKey, CACHE_VERSION.CURRENT)
      
      if (cached) {
        return cached
      }

      // Use vector query to get contextually relevant food logs for the date
      const contextQuery = `food logs for ${date} meal history nutrition data`
      const vectorResults = await this.queryUserContext(contextQuery, ['food_log'], 20)
      
      // Also get traditional food logs as fallback
      const traditionalResponse = await api.get(`/food-logs/date/${date}`)
      const traditionalLogs = traditionalResponse.data
      
      // Enhance traditional logs with vector context scores
      const enhancedLogs: VectorizedFoodLog[] = traditionalLogs.map((log: any) => {
        const vectorMatch = vectorResults.results.find(result => 
          result.metadata.content.includes(log.food_name) ||
          result.metadata.timestamp?.includes(date)
        )
        
        return {
          ...log,
          context_score: vectorMatch?.score || 0
        }
      })
      
      // Sort by relevance (vector score) then by time
      const sortedLogs = enhancedLogs.sort((a, b) => {
        if (a.context_score !== b.context_score) {
          return (b.context_score || 0) - (a.context_score || 0)
        }
        return new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
      })
      
      // Cache for 1 hour
      LocalStorageCache.set(cacheKey, sortedLogs, CACHE_TTL.MEDIUM, CACHE_VERSION.CURRENT)
      
      return sortedLogs
    } catch (error) {
      console.error('Error getting smart food logs:', error)
      // Fallback to traditional endpoint
      const response = await api.get(`/food-logs/date/${date}`)
      return response.data.map((log: any) => ({ ...log, context_score: 0 }))
    }
  }

  /**
   * Get vectorized insights with enhanced context
   */
  async getSmartInsights(
    timeframe: 'day' | 'week' | 'month' = 'week',
    forceRefresh: boolean = false
  ): Promise<VectorizedInsights> {
    try {
      const cacheKey = `${CACHE_KEYS.AI_INSIGHTS}_vector_${timeframe}`
      
      if (!forceRefresh) {
        const cached = LocalStorageCache.get<VectorizedInsights>(cacheKey, CACHE_VERSION.CURRENT)
        if (cached) {
          return cached
        }
      }

      // Get vector context for insights
      const contextQuery = `nutrition insights patterns habits recommendations ${timeframe}`
      const vectorContext = await this.queryUserContext(contextQuery, ['food_log', 'meal_plan', 'favorites'], 15)
      
      // Get traditional insights
      const insightsResponse = await api.get('/analytics/insights', {
        params: { timeframe, force_refresh: forceRefresh }
      })
      
      // Enhance insights with vector relevance
      const enhancedInsights = {
        insights: insightsResponse.data.insights.map((insight: any) => ({
          ...insight,
          relevance_score: this.calculateRelevanceScore(insight, vectorContext.results)
        })),
        related_context: vectorContext.results.slice(0, 5).map(r => r.metadata.content),
        generated_at: new Date().toISOString()
      }
      
      // Cache for 2 hours
      LocalStorageCache.set(cacheKey, enhancedInsights, CACHE_TTL.AI_INSIGHTS, CACHE_VERSION.CURRENT)
      
      return enhancedInsights
    } catch (error) {
      console.error('Error getting smart insights:', error)
      throw error
    }
  }

  /**
   * Get smart food recommendations based on vector similarity
   */
  async getSmartFoodRecommendations(
    mealType: string,
    preferences?: string[]
  ): Promise<Array<{
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    similarity_score: number
    recommendation_reason: string
  }>> {
    try {
      const cacheKey = `${CACHE_KEYS.FOOD_RECOMMENDATIONS}_${mealType}_${preferences?.join(',') || 'none'}`
      const cached = LocalStorageCache.get<any[]>(cacheKey, CACHE_VERSION.CURRENT)
      
      if (cached) {
        return cached
      }

      // Query vector context for similar meals and preferences
      const contextQuery = `${mealType} meal preferences ${preferences?.join(' ') || ''} similar foods nutrition`
      const vectorResults = await this.queryUserContext(contextQuery, ['food_log', 'favorites'], 10)
      
      // Get traditional foods endpoint
      const foodsResponse = await api.get('/foods')
      const allFoods = foodsResponse.data
      
      // Score foods based on vector similarity and preferences
      const scoredFoods = allFoods.map((food: any) => {
        const vectorMatch = vectorResults.results.find(result =>
          result.metadata.content.toLowerCase().includes(food.name.toLowerCase())
        )
        
        return {
          ...food,
          similarity_score: vectorMatch?.score || 0,
          recommendation_reason: this.generateRecommendationReason(food, vectorMatch, mealType)
        }
      })
      
      // Sort by similarity score and filter top recommendations
      const recommendations = scoredFoods
        .sort((a: any, b: any) => b.similarity_score - a.similarity_score)
        .slice(0, 20)
      
      // Cache for 1 hour
      LocalStorageCache.set(cacheKey, recommendations, CACHE_TTL.MEDIUM, CACHE_VERSION.CURRENT)
      
      return recommendations
    } catch (error) {
      console.error('Error getting smart food recommendations:', error)
      throw error
    }
  }

  /**
   * Trigger bulk vectorization of user data
   */
  async triggerVectorization(dataTypes?: string[], forceRebuild: boolean = false): Promise<void> {
    try {
      await api.post('/vectors/bulk-vectorize', {
        data_types: dataTypes,
        force_rebuild: forceRebuild
      })
      
      // Clear related caches since data will be re-vectorized
      this.clearVectorCaches()
    } catch (error) {
      console.error('Error triggering vectorization:', error)
      throw error
    }
  }

  /**
   * Clear vector-related caches
   */
  clearVectorCaches(): void {
    const vectorCacheKeys = [
      CACHE_KEYS.VECTOR_STATS,
      CACHE_KEYS.FOOD_LOGS,
      CACHE_KEYS.AI_INSIGHTS,
      CACHE_KEYS.FOOD_RECOMMENDATIONS
    ]
    
    vectorCacheKeys.forEach(key => {
      // Clear all variations of these cache keys
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.includes(key)) {
          localStorage.removeItem(storageKey)
        }
      })
    })
  }

  /**
   * Calculate relevance score for insights based on vector context
   */
  private calculateRelevanceScore(insight: any, vectorResults: any[]): number {
    const insightText = `${insight.title} ${insight.content}`.toLowerCase()
    
    let maxScore = 0
    vectorResults.forEach(result => {
      const contextText = result.metadata.content.toLowerCase()
      const commonWords = insightText.split(' ').filter(word => 
        contextText.includes(word) && word.length > 3
      )
      const score = (commonWords.length / insightText.split(' ').length) * result.score
      maxScore = Math.max(maxScore, score)
    })
    
    return maxScore
  }

  /**
   * Generate recommendation reason based on vector context
   */
  private generateRecommendationReason(_food: any, vectorMatch: any, mealType: string): string {
    if (!vectorMatch) {
      return `Popular choice for ${mealType}`
    }
    
    if (vectorMatch.score > 0.8) {
      return `Frequently enjoyed for ${mealType} - high similarity to your preferences`
    } else if (vectorMatch.score > 0.6) {
      return `Similar to foods you've logged before`
    } else if (vectorMatch.score > 0.4) {
      return `Matches your nutritional patterns`
    } else {
      return `Recommended based on your food history`
    }
  }
}

export const vectorService = new VectorService()
export default vectorService
