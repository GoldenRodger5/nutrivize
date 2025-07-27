/**
 * User Data Context with localStorage persistence
 * Manages user profile data, preferences, and session state
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalStorageCache, CACHE_KEYS, CACHE_TTL, CACHE_VERSION } from '../utils/localStorage';
import { useCacheInvalidation } from '../hooks/useCacheInvalidation';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  nutritionGoals?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  preferences?: {
    units: 'metric' | 'imperial';
    privacy: 'public' | 'private';
    notifications: boolean;
  };
  lastUpdated?: string;
}

interface UserDataContextType {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  refreshUserData: (forceRefresh?: boolean) => Promise<void>;
  clearUserData: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}

interface UserDataProviderProps {
  children: ReactNode;
}

export function UserDataProvider({ children }: UserDataProviderProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { invalidateUserCaches } = useCacheInvalidation();

  const fetchUserData = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, try to get from localStorage cache if not forcing refresh
      if (!forceRefresh) {
        const cachedUserData = LocalStorageCache.get<UserData>(
          CACHE_KEYS.USER_DATA, 
          CACHE_VERSION.CURRENT
        );
        
        if (cachedUserData) {
          setUserData(cachedUserData);
          setIsLoading(false);
          return;
        }
      }

      // Note: Replace with actual API call when available
      // const response = await api.get('/users/profile');
      // For now, we'll simulate with localStorage-based user data
      
      // This would be replaced with actual API call:
      // const data = response.data;
      // setUserData(data);
      
      // Cache the data in localStorage with 7-day TTL (matches backend cache)
      // LocalStorageCache.set(
      //   CACHE_KEYS.USER_DATA,
      //   data,
      //   CACHE_TTL.USER_DATA,
      //   CACHE_VERSION.CURRENT
      // );
      
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = async (dataUpdate: Partial<UserData>) => {
    try {
      // Update local state immediately (optimistic update)
      const updatedData = { ...userData, ...dataUpdate, lastUpdated: new Date().toISOString() } as UserData;
      setUserData(updatedData);
      
      // Update localStorage cache immediately (write-through pattern)
      LocalStorageCache.set(
        CACHE_KEYS.USER_DATA,
        updatedData,
        CACHE_TTL.USER_DATA,
        CACHE_VERSION.CURRENT
      );

      // Note: Replace with actual API call when available
      // await api.put('/users/profile', dataUpdate);
      
      // Invalidate related caches
      invalidateUserCaches();
      
    } catch (err) {
      console.error('Error updating user data:', err);
      setError('Failed to update user data');
      // Revert optimistic update on error
      fetchUserData(true);
      throw err;
    }
  };

  const clearUserData = () => {
    setUserData(null);
    LocalStorageCache.remove(CACHE_KEYS.USER_DATA);
    LocalStorageCache.remove(CACHE_KEYS.PREFERENCES);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const value = {
    userData,
    isLoading,
    error,
    updateUserData,
    refreshUserData: fetchUserData,
    clearUserData
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}
