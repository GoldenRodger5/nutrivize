import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { getToken, getUserData, getCurrentUser, logoutUser } from '../utils/auth';

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

  // Fetch user on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to fetch user data');
      } finally {
        setIsLoading(false);
      }
    };

    if (getToken()) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const updateUser = async (userData: Partial<User>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await axios.patch(
        `${API_BASE_URL}/users/me`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
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
    logoutUser();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, error, updateUser, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}; 