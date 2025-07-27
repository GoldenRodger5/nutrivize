/**
 * Enhanced localStorage utility with cache expiration and validation
 * Supports the smart caching system with proper invalidation patterns
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version?: string; // For cache invalidation
}

export class LocalStorageCache {
  private static readonly PREFIX = 'nutrivize_';
  
  /**
   * Set item in localStorage with TTL and versioning
   */
  static set<T>(key: string, data: T, ttlMinutes: number = 60, version?: string): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
        version
      };
      
      localStorage.setItem(
        this.PREFIX + key, 
        JSON.stringify(item)
      );
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Get item from localStorage with expiration check
   */
  static get<T>(key: string, currentVersion?: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const cached: CacheItem<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() - cached.timestamp > cached.ttl) {
        this.remove(key);
        return null;
      }

      // Check version for cache invalidation
      if (currentVersion && cached.version && cached.version !== currentVersion) {
        this.remove(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  /**
   * Clear all nutrivize cache items
   */
  static clearAll(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  /**
   * Check if item exists and is not expired
   */
  static isValid(key: string, currentVersion?: string): boolean {
    return this.get(key, currentVersion) !== null;
  }

  /**
   * Get cache info (timestamp, ttl remaining)
   */
  static getCacheInfo(key: string): { age: number; ttlRemaining: number; version?: string } | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const cached: CacheItem<any> = JSON.parse(item);
      const age = Date.now() - cached.timestamp;
      const ttlRemaining = cached.ttl - age;

      return {
        age,
        ttlRemaining: Math.max(0, ttlRemaining),
        version: cached.version
      };
    } catch (error) {
      return null;
    }
  }
}

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  FOOD_INDEX: 'food_index',
  USER_FAVORITES: 'user_favorites',
  USER_DATA: 'user_data',
  AI_INSIGHTS: 'ai_insights',
  ANALYTICS_DATA: 'analytics_data',
  WATER_LOGS: 'water_logs',
  PREFERENCES: 'user_preferences'
} as const;

/**
 * Cache TTL values (in minutes) aligned with backend caching
 */
export const CACHE_TTL = {
  FOOD_INDEX: 7 * 24 * 60, // 7 days (matches backend)
  USER_FAVORITES: 4 * 60, // 4 hours (matches backend)
  USER_DATA: 7 * 24 * 60, // 7 days (matches backend)
  AI_INSIGHTS: 2 * 60, // 2 hours (matches backend fresh insights)
  ANALYTICS_DATA: 6 * 60, // 6 hours (conservative for analytics)
  WATER_LOGS: 60, // 1 hour (matches backend)
  PREFERENCES: 10 * 24 * 60 // 10 days (matches backend)
} as const;

/**
 * Cache version for invalidation
 */
export const CACHE_VERSION = {
  CURRENT: '2025.07.27-v1' // Update when data structure changes
} as const;
