import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, getUserData, getCurrentUser, logoutUser, removeToken, removeUserData } from '../utils/auth';
import api from '../utils/api';

// Define user interface
interface User {
  uid: string;
  name: string;
  email: string;
  preferences?: {
    units?: string;
    theme?: string;
    dietaryPreferences?: string[];
    dailyTargets?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    allergies?: string[];
  };
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getUserData());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAuthCheck, setLastAuthCheck] = useState<number>(0);

  // Fetch user on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('UserContext: Fetching current user');
        setIsLoading(true);
        
        const userData = await getCurrentUser();
        if (userData) {
          console.log('UserContext: User data received from API');
          setUser(userData);
        } else {
          // If getCurrentUser returns null but we have token and user data in localStorage,
          // don't clear the user context - this helps prevent logout during server errors
          const tokenExists = !!getToken();
          const storedUser = getUserData();
          if (tokenExists && storedUser && !userData) {
            console.log('UserContext: Using cached user data due to auth API error');
            setUser(storedUser);
          } else {
            console.log('UserContext: No user data available');
            setUser(null);
          }
        }
      } catch (err) {
        console.error('UserContext: Error fetching user:', err);
        setError('Failed to fetch user data');
        
        // Even on error, if we have cached user data, use it
        const storedUser = getUserData();
        if (storedUser) {
          console.log('UserContext: Using cached user data after error');
          setUser(storedUser);
        }
      } finally {
        setIsLoading(false);
        setLastAuthCheck(Date.now());
      }
    };

    const token = getToken();
    if (token) {
      console.log('UserContext: Token found, fetching user');
      fetchUser();
    } else {
      console.log('UserContext: No token found, skipping user fetch');
      // Clear any existing user data if no token
      removeUserData();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  // Function to refresh the user data
  const refreshUser = async () => {
    // Throttle to prevent excessive refreshes
    const now = Date.now();
    if (now - lastAuthCheck < 5000) { // Don't refresh more than once every 5 seconds
      console.log('UserContext: Refresh throttled');
      return;
    }
    
    try {
      console.log('UserContext: Refreshing user data');
      setIsLoading(true);
      
      const userData = await getCurrentUser();
      if (userData) {
        console.log('UserContext: User data refreshed');
        setUser(userData);
      } else {
        // If token exists but failed to get user, keep existing user
        const tokenExists = !!getToken();
        if (tokenExists && user) {
          console.log('UserContext: Using existing user data after refresh error');
        } else {
          console.log('UserContext: No user data available after refresh');
          setUser(null);
        }
      }
    } catch (err) {
      console.error('UserContext: Error refreshing user:', err);
      // Don't set error on refresh to avoid UI disruption
    } finally {
      setIsLoading(false);
      setLastAuthCheck(Date.now());
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await api.patch('/users/me', userData);
      
      if (response.data) {
        setUser(prev => prev ? { ...prev, ...response.data } : response.data);
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('UserContext: Logging out user');
    logoutUser();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      updateUser, 
      setUser, 
      logout,
      refreshUser 
    }}>
      {children}
    </UserContext.Provider>
  );
}; 