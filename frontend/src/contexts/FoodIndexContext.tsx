import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { FoodItem } from '../types';
import { deduplicateRequest } from '../utils/requestDeduplication';
import { LocalStorageCache, CACHE_KEYS, CACHE_TTL, CACHE_VERSION } from '../utils/localStorage';

interface FoodIndexContextType {
  userFoods: FoodItem[];
  isLoading: boolean;
  error: string | null;
  refreshUserFoods: () => Promise<void>;
  searchUserFoods: (query: string) => Promise<FoodItem[]>;
  triggerRefresh: () => void;
  invalidateCache: () => void; // New method for cache invalidation
}

const FoodIndexContext = createContext<FoodIndexContextType | undefined>(undefined);

export function useFoodIndex() {
  const context = useContext(FoodIndexContext);
  if (!context) {
    throw new Error('useFoodIndex must be used within a FoodIndexProvider');
  }
  return context;
}

interface FoodIndexProviderProps {
  children: ReactNode;
}

export function FoodIndexProvider({ children }: FoodIndexProviderProps) {
  const [userFoods, setUserFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchUserFoods = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, try to get from localStorage cache if not forcing refresh
      if (!forceRefresh) {
        const cachedFoods = LocalStorageCache.get<FoodItem[]>(
          CACHE_KEYS.FOOD_INDEX, 
          CACHE_VERSION.CURRENT
        );
        
        if (cachedFoods) {
          setUserFoods(cachedFoods);
          setIsLoading(false);
          return;
        }
      }

      // Use the dedicated user-index endpoint which uses Redis caching for optimal performance
      const response = await deduplicateRequest('user-foods', 
        () => api.get('/foods/user-index')
      );
      
      const foodData = response.data || [];
      setUserFoods(foodData);
      
      // Cache the data in localStorage with 7-day TTL (matches backend cache)
      LocalStorageCache.set(
        CACHE_KEYS.FOOD_INDEX,
        foodData,
        CACHE_TTL.FOOD_INDEX,
        CACHE_VERSION.CURRENT
      );
    } catch (err) {
      console.error('Error fetching user foods:', err);
      setError('Failed to load your food index');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const invalidateCache = () => {
    // Clear localStorage cache and trigger refresh
    LocalStorageCache.remove(CACHE_KEYS.FOOD_INDEX);
    triggerRefresh();
  };

  const searchUserFoods = async (query: string): Promise<FoodItem[]> => {
    if (!query.trim()) return [];
    
    try {
      // Use the search endpoint which includes both user and general foods
      const response = await api.get(`/foods/search?q=${encodeURIComponent(query)}&limit=50`);
      return response.data || [];
    } catch (err) {
      console.error('Error searching foods:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchUserFoods();
  }, [refreshTrigger]);

  const value = {
    userFoods,
    isLoading,
    error,
    refreshUserFoods: fetchUserFoods,
    searchUserFoods,
    triggerRefresh,
    invalidateCache
  };

  return (
    <FoodIndexContext.Provider value={value}>
      {children}
    </FoodIndexContext.Provider>
  );
}
