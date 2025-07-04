import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

interface FoodItem {
  id: string;
  name: string;
  serving_size: number;
  serving_unit: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    [key: string]: number;
  };
  source: string;
}

interface FoodIndexContextType {
  foods: FoodItem[];
  loading: boolean;
  error: string | null;
  refreshFoods: () => Promise<void>;
}

const FoodIndexContext = createContext<FoodIndexContextType | undefined>(undefined);

export const FoodIndexProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFoods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/foods/user-index');
      setFoods(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching food index:', err);
      setError('Failed to load your food index');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFoods();
  }, []);

  return (
    <FoodIndexContext.Provider value={{ foods, loading, error, refreshFoods }}>
      {children}
    </FoodIndexContext.Provider>
  );
};

export const useFoodIndex = (): FoodIndexContextType => {
  const context = useContext(FoodIndexContext);
  if (context === undefined) {
    throw new Error('useFoodIndex must be used within a FoodIndexProvider');
  }
  return context;
};