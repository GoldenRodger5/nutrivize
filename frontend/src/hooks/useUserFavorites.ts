// React hook for managing user favorites with localStorage persistence
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@chakra-ui/react'
import userFavoritesService, { UserFavorite, UserFavoriteCreate, UserFavoriteUpdate, UserFavoriteStats } from '../services/userFavoritesService'
import { LocalStorageCache, CACHE_KEYS, CACHE_TTL, CACHE_VERSION } from '../utils/localStorage'

export const useUserFavorites = () => {
  const [favorites, setFavorites] = useState<UserFavorite[]>([])
  const [stats, setStats] = useState<UserFavoriteStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  // Load all favorites
  const loadFavorites = useCallback(async (category?: string, forceRefresh = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // First, try to get from localStorage cache if not forcing refresh
      if (!forceRefresh) {
        const cacheKey = category ? `${CACHE_KEYS.USER_FAVORITES}_${category}` : CACHE_KEYS.USER_FAVORITES;
        const cachedFavorites = LocalStorageCache.get<UserFavorite[]>(
          cacheKey, 
          CACHE_VERSION.CURRENT
        );
        
        if (cachedFavorites) {
          setFavorites(cachedFavorites);
          setLoading(false);
          return;
        }
      }

      const data = await userFavoritesService.getFavorites(category)
      setFavorites(data)
      
      // Cache the data in localStorage with 4-hour TTL (matches backend cache)
      const cacheKey = category ? `${CACHE_KEYS.USER_FAVORITES}_${category}` : CACHE_KEYS.USER_FAVORITES;
      LocalStorageCache.set(
        cacheKey,
        data,
        CACHE_TTL.USER_FAVORITES,
        CACHE_VERSION.CURRENT
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load favorites'
      setError(errorMessage)
      toast({
        title: 'Error loading favorites',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Load favorites stats
  const loadStats = useCallback(async () => {
    try {
      const data = await userFavoritesService.getFavoriteStats()
      setStats(data)
    } catch (err: any) {
      console.error('Error loading favorites stats:', err)
    }
  }, [])

  // Add a new favorite
  const addFavorite = useCallback(async (data: UserFavoriteCreate) => {
    try {
      const newFavorite = await userFavoritesService.addFavorite(data)
      const updatedFavorites = [newFavorite, ...favorites];
      setFavorites(updatedFavorites)
      
      // Update localStorage cache immediately (write-through pattern)
      LocalStorageCache.set(
        CACHE_KEYS.USER_FAVORITES,
        updatedFavorites,
        CACHE_TTL.USER_FAVORITES,
        CACHE_VERSION.CURRENT
      );
      
      toast({
        title: 'Added to favorites',
        description: `${data.custom_name || newFavorite.food_name} has been added to your favorites`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      return newFavorite
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to add favorite'
      toast({
        title: 'Error adding favorite',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      throw err
    }
  }, [toast, favorites])

  // Update a favorite
  const updateFavorite = useCallback(async (foodId: string, data: UserFavoriteUpdate) => {
    try {
      const updatedFavorite = await userFavoritesService.updateFavorite(foodId, data)
      setFavorites(prev => 
        prev.map(fav => fav.food_id === foodId ? updatedFavorite : fav)
      )
      toast({
        title: 'Favorite updated',
        description: 'Your favorite has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      return updatedFavorite
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to update favorite'
      toast({
        title: 'Error updating favorite',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      throw err
    }
  }, [toast])

  // Remove a favorite
  const removeFavorite = useCallback(async (foodId: string) => {
    try {
      await userFavoritesService.removeFavorite(foodId)
      setFavorites(prev => prev.filter(fav => fav.food_id !== foodId))
      toast({
        title: 'Removed from favorites',
        description: 'The food has been removed from your favorites',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to remove favorite'
      toast({
        title: 'Error removing favorite',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      throw err
    }
  }, [toast])

  // Check if a food is favorited
  const isFavorited = useCallback((foodId: string) => {
    return favorites.some(fav => fav.food_id === foodId)
  }, [favorites])

  // Get favorite by food ID
  const getFavoriteByFoodId = useCallback((foodId: string) => {
    return favorites.find(fav => fav.food_id === foodId)
  }, [favorites])

  // Search favorites
  const searchFavorites = useCallback((query: string) => {
    const searchLower = query.toLowerCase()
    return favorites.filter(fav => 
      fav.food_name.toLowerCase().includes(searchLower) ||
      (fav.custom_name && fav.custom_name.toLowerCase().includes(searchLower)) ||
      fav.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }, [favorites])

  // Get favorites by category
  const getFavoritesByCategory = useCallback((category: UserFavorite['category']) => {
    return favorites.filter(fav => fav.category === category)
  }, [favorites])

  // Get favorites by tags
  const getFavoritesByTags = useCallback((tags: string[]) => {
    return favorites.filter(fav => 
      tags.some(tag => fav.tags.includes(tag))
    )
  }, [favorites])

  // Get most used favorites
  const getMostUsedFavorites = useCallback((limit: number = 10) => {
    return [...favorites]
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
  }, [favorites])

  // Get recent favorites
  const getRecentFavorites = useCallback((limit: number = 10) => {
    return [...favorites]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }, [favorites])

  // Toggle favorite status
  const toggleFavorite = useCallback(async (foodId: string, foodName: string, category: UserFavorite['category'] = 'general') => {
    if (isFavorited(foodId)) {
      await removeFavorite(foodId)
    } else {
      await addFavorite({
        food_id: foodId,
        custom_name: foodName,
        category,
        tags: []
      })
    }
  }, [isFavorited, removeFavorite, addFavorite])

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      loadFavorites(),
      loadStats()
    ])
  }, [loadFavorites, loadStats])

  // Load data on mount
  useEffect(() => {
    loadFavorites()
    loadStats()
  }, [loadFavorites, loadStats])

  return {
    favorites,
    stats,
    loading,
    error,
    
    // Actions
    loadFavorites,
    loadStats,
    addFavorite,
    updateFavorite,
    removeFavorite,
    toggleFavorite,
    refresh,
    
    // Utility functions
    isFavorited,
    getFavoriteByFoodId,
    searchFavorites,
    getFavoritesByCategory,
    getFavoritesByTags,
    getMostUsedFavorites,
    getRecentFavorites,
  }
}

export default useUserFavorites
