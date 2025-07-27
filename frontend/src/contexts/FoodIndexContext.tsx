import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';
import { FoodItem } from '../types';
import { deduplicateRequest } from '../utils/requestDeduplication';

interface FoodIndexContextType {
  userFoods: FoodItem[];
  isLoading: boolean;
  error: string | null;
  refreshUserFoods: () => Promise<void>;
  searchUserFoods: (query: string) => Promise<FoodItem[]>;
  triggerRefresh: () => void;
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

  const fetchUserFoods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the search endpoint with empty query to get the user's food index
      const response = await deduplicateRequest('user-foods', 
        () => api.get('/foods/search?q=&limit=100')
      );
      setUserFoods(response.data || []);
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
    triggerRefresh
  };

  return (
    <FoodIndexContext.Provider value={value}>
      {children}
    </FoodIndexContext.Provider>
  );
}
