/**
 * React hook for managing cache invalidation patterns
 * Provides centralized cache management across the application
 */

import { useCallback } from 'react';
import { LocalStorageCache, CACHE_KEYS } from '../utils/localStorage';

export const useCacheInvalidation = () => {
  
  /**
   * Invalidate all caches (useful for logout or major updates)
   */
  const invalidateAll = useCallback(() => {
    LocalStorageCache.clearAll();
  }, []);

  /**
   * Invalidate food-related caches when user adds/edits/deletes foods
   */
  const invalidateFoodCaches = useCallback(() => {
    LocalStorageCache.remove(CACHE_KEYS.FOOD_INDEX);
    // Note: Don't invalidate USER_FAVORITES here as it's food-agnostic
  }, []);

  /**
   * Invalidate user data caches when profile is updated
   */
  const invalidateUserCaches = useCallback(() => {
    LocalStorageCache.remove(CACHE_KEYS.USER_DATA);
    LocalStorageCache.remove(CACHE_KEYS.PREFERENCES);
  }, []);

  /**
   * Invalidate analytics caches when new data is logged
   */
  const invalidateAnalyticsCaches = useCallback(() => {
    LocalStorageCache.remove(CACHE_KEYS.ANALYTICS_DATA);
    // Also invalidate AI insights as they depend on analytics data
    LocalStorageCache.remove(CACHE_KEYS.AI_INSIGHTS);
  }, []);

  /**
   * Invalidate favorites cache when favorites are modified
   */
  const invalidateFavoritesCaches = useCallback(() => {
    // Remove all favorite-related cache entries
    Object.keys(localStorage).forEach(key => {
      if (key.includes('nutrivize_user_favorites')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  /**
   * Invalidate water logs cache
   */
  const invalidateWaterLogsCaches = useCallback(() => {
    LocalStorageCache.remove(CACHE_KEYS.WATER_LOGS);
  }, []);

  /**
   * Force refresh AI insights (respects 2-hour backend cache)
   */
  const invalidateAIInsights = useCallback(() => {
    LocalStorageCache.remove(CACHE_KEYS.AI_INSIGHTS);
  }, []);

  /**
   * Check cache status for debugging
   */
  const getCacheStatus = useCallback(() => {
    const status: Record<string, any> = {};
    
    Object.values(CACHE_KEYS).forEach(key => {
      const info = LocalStorageCache.getCacheInfo(key);
      status[key] = info ? {
        isValid: true,
        ageMinutes: Math.round(info.age / (1000 * 60)),
        ttlRemainingMinutes: Math.round(info.ttlRemaining / (1000 * 60)),
        version: info.version
      } : { isValid: false };
    });

    return status;
  }, []);

  /**
   * Smart cache refresh based on data type
   */
  const smartRefresh = useCallback((dataType: 'food' | 'user' | 'analytics' | 'favorites' | 'water' | 'ai') => {
    switch (dataType) {
      case 'food':
        invalidateFoodCaches();
        break;
      case 'user':
        invalidateUserCaches();
        break;
      case 'analytics':
        invalidateAnalyticsCaches();
        break;
      case 'favorites':
        invalidateFavoritesCaches();
        break;
      case 'water':
        invalidateWaterLogsCaches();
        break;
      case 'ai':
        invalidateAIInsights();
        break;
    }
  }, [
    invalidateFoodCaches,
    invalidateUserCaches,
    invalidateAnalyticsCaches,
    invalidateFavoritesCaches,
    invalidateWaterLogsCaches,
    invalidateAIInsights
  ]);

  return {
    invalidateAll,
    invalidateFoodCaches,
    invalidateUserCaches,
    invalidateAnalyticsCaches,
    invalidateFavoritesCaches,
    invalidateWaterLogsCaches,
    invalidateAIInsights,
    getCacheStatus,
    smartRefresh
  };
};
