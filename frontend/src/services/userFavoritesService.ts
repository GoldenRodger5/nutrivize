// User Favorites Service - Frontend API integration
import api from '../utils/api'

export interface UserFavorite {
  id: string
  food_id: string
  food_name: string
  custom_name?: string
  default_serving_size?: number
  default_serving_unit?: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink' | 'ingredient' | 'general'
  notes?: string
  tags: string[]
  usage_count: number
  last_used?: string
  created_at: string
  updated_at: string
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }
  dietary_attributes?: {
    dietary_restrictions: string[]
    allergens: string[]
    food_categories: string[]
  }
}

export interface UserFavoriteCreate {
  food_id: string
  custom_name?: string
  default_serving_size?: number
  default_serving_unit?: string
  category?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink' | 'ingredient' | 'general'
  notes?: string
  tags?: string[]
}

export interface UserFavoriteUpdate {
  custom_name?: string
  default_serving_size?: number
  default_serving_unit?: string
  category?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink' | 'ingredient' | 'general'
  notes?: string
  tags?: string[]
}

export interface UserFavoriteStats {
  total_favorites: number
  categories_breakdown: Record<string, number>
  most_used_favorites: UserFavorite[]
  recent_additions: UserFavorite[]
  tags_summary: Record<string, number>
}

class UserFavoritesService {
  private baseUrl = '/favorites'

  /**
   * Add a food to user's favorites
   */
  async addFavorite(data: UserFavoriteCreate): Promise<UserFavorite> {
    const response = await api.post(`${this.baseUrl}/`, data)
    return response.data
  }

  /**
   * Get user's favorites with optional category filtering
   */
  async getFavorites(category?: string): Promise<UserFavorite[]> {
    const params = category ? { category } : {}
    const response = await api.get(`${this.baseUrl}/`, { params })
    return response.data
  }

  /**
   * Update a favorite food
   */
  async updateFavorite(foodId: string, data: UserFavoriteUpdate): Promise<UserFavorite> {
    const response = await api.put(`${this.baseUrl}/${foodId}`, data)
    return response.data
  }

  /**
   * Remove a favorite food
   */
  async removeFavorite(foodId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${foodId}`)
  }

  /**
   * Get user's favorite statistics
   */
  async getFavoriteStats(): Promise<UserFavoriteStats> {
    const response = await api.get(`${this.baseUrl}/stats`)
    return response.data
  }

  /**
   * Check if a food is favorited by the user
   */
  async isFavorited(foodId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites()
      return favorites.some(fav => fav.food_id === foodId)
    } catch (error) {
      console.error('Error checking if food is favorited:', error)
      return false
    }
  }

  /**
   * Get favorites by category
   */
  async getFavoritesByCategory(category: UserFavorite['category']): Promise<UserFavorite[]> {
    return this.getFavorites(category)
  }

  /**
   * Get favorites by tags
   */
  async getFavoritesByTags(tags: string[]): Promise<UserFavorite[]> {
    const allFavorites = await this.getFavorites()
    return allFavorites.filter(fav => 
      tags.some(tag => fav.tags.includes(tag))
    )
  }

  /**
   * Get most used favorites
   */
  async getMostUsedFavorites(limit: number = 10): Promise<UserFavorite[]> {
    const allFavorites = await this.getFavorites()
    return allFavorites
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
  }

  /**
   * Get recent favorites
   */
  async getRecentFavorites(limit: number = 10): Promise<UserFavorite[]> {
    const allFavorites = await this.getFavorites()
    return allFavorites
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  /**
   * Search favorites by name or custom name
   */
  async searchFavorites(query: string): Promise<UserFavorite[]> {
    const allFavorites = await this.getFavorites()
    const searchLower = query.toLowerCase()
    return allFavorites.filter(fav => 
      fav.food_name.toLowerCase().includes(searchLower) ||
      (fav.custom_name && fav.custom_name.toLowerCase().includes(searchLower)) ||
      fav.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  /**
   * Get favorite with default serving information
   */
  async getFavoriteWithDefaults(foodId: string): Promise<UserFavorite | null> {
    const favorites = await this.getFavorites()
    return favorites.find(fav => fav.food_id === foodId) || null
  }

  /**
   * Bulk add favorites
   */
  async bulkAddFavorites(favorites: UserFavoriteCreate[]): Promise<UserFavorite[]> {
    const results = await Promise.allSettled(
      favorites.map(fav => this.addFavorite(fav))
    )
    
    return results
      .filter((result): result is PromiseFulfilledResult<UserFavorite> => result.status === 'fulfilled')
      .map(result => result.value)
  }

  /**
   * Update favorite usage (called when a favorite is logged)
   */
  async updateFavoriteUsage(foodId: string): Promise<void> {
    try {
      // This would typically be handled by the backend when a food is logged
      // For now, we'll just update the usage count
      const favorite = await this.getFavoriteWithDefaults(foodId)
      if (favorite) {
        await this.updateFavorite(foodId, {
          // Usage count would be updated by the backend
        })
      }
    } catch (error) {
      console.error('Error updating favorite usage:', error)
    }
  }
}

export const userFavoritesService = new UserFavoritesService()
export default userFavoritesService
