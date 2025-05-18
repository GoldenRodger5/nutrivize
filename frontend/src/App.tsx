import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import './styles/widgets.css' // Import widgets CSS
import './styles/dark-mode-fixes.css' // Import dark mode fixes
import Chatbot from './components/Chatbot'
import MealSuggestions from './components/MealSuggestions'
import MealPlanner from './components/MealPlanner'
import InsightsTrends from './components/InsightsTrends'
import { useUserContext } from './context/UserContext'
import api from './utils/api'
// Import components using the right names to avoid conflicts
import FoodLog from './pages/FoodLog'
import FoodIndex from './pages/FoodIndex'
import FoodIndexTab from './components/FoodIndexTab'
import Goals from './pages/Goals'
import Profile from './pages/Profile'
import LogFoodModal from './components/modals/LogFoodModal'
import AddFoodModal from './components/modals/AddFoodModal'
import GoalModal from './components/modals/GoalModal'
import Home from './pages/Home'
import Visuals from './pages/Visuals'
import { WidgetProvider } from './context/WidgetContext'
import { getCurrentUser } from './utils/auth'
import { FoodLogEntry, FoodItem, Goal, User } from './types'
import Sidebar from './components/Sidebar'
import DailyProgressFeedback from './components/DailyProgressFeedback'
import GoalBasedMealSuggestions from './components/GoalBasedMealSuggestions'
import WeeklyGoalInsights from './components/WeeklyGoalInsights'
import GoalProgressTracker from './components/GoalProgressTracker'
import Login from './components/auth/Login'
import { useHistory, useLocation } from 'react-router-dom'
import AppleHealthTab from './components/AppleHealthTab'

// Simple test modal component to verify modal functionality
const TestModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '100%',
        zIndex: 10000
      }}>
        <h2>Test Modal</h2>
        <p>This is a test modal to verify that modals work properly.</p>
        <button 
          style={{
            padding: '10px',
            backgroundColor: 'blue',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={onClose}
        >
          Close Modal
        </button>
      </div>
    </div>
  );
};

// Types
interface NutritionTarget {
  name: string;
  daily_calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
}

// Common food units
const FOOD_UNITS = [
  "g", "ml", "oz", "fl oz", "cup", "tbsp", "tsp", "piece", "slice", "serving", "scoop", "packet"
];

const App: React.FC = () => {
  const { user, setUser } = useUserContext();
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const location = useLocation();
  
  // Track window size for responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Modal states
  const [showLogFoodModal, setShowLogFoodModal] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // State for tracking whether data is loading
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize state for foods, logs, goals, etc.
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  
  // Edit mode states
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  
  // New food form state
  const [newFood, setNewFood] = useState<FoodItem>({
    name: '',
    serving_size: 100,
    serving_unit: 'g',
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    fiber: 0
  });
  
  // New log form state
  const [newLog, setNewLog] = useState<FoodLogEntry>({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    food_id: '',
    name: '',
    amount: 1,
    unit: 'serving',
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    fiber: 0
  });
  
  // New goal form state
  const [newGoal, setNewGoal] = useState<Goal>({
    type: 'weight loss',
    weight_target: {
      current: 70,
      goal: 65,
      weekly_rate: 0.5
    },
    nutrition_targets: [{
      name: 'Default',
      daily_calories: 2000,
      proteins: 150,
      carbs: 200,
      fats: 65,
      fiber: 25
    }]
  });

  // Add this state variable for date navigation
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  // Add a new state for the header text
  const [logHeaderText, setLogHeaderText] = useState("Today's Food Log");

  // Add this after the selectedDate state
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [weekLogs, setWeekLogs] = useState<{[date: string]: FoodLogEntry[]}>({});
  const [weekRange, setWeekRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });

  // Add new state for trends period
  const [trendPeriod, setTrendPeriod] = useState<7 | 14 | 30>(7);
  
  // Import constants from backend
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'; // Set to point to backend port 5001
  const USER_ID = user?.uid || ''; // Use the logged-in user's ID
  const authToken = localStorage.getItem('nutrivize_auth_token'); // Get auth token

  // Helper function to create headers with auth token
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  };

  // Add test modal state
  const [showTestModal, setShowTestModal] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getCurrentUser();
      setUser(userData);
      setIsLoading(false);
      
      if (userData) {
        // Fetch user's active goal
        fetchGoal();
        // Fetch today's logs
        fetchTodaysLogs();
      }
    };
    
    fetchUser();
  }, []);
  
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchFoods(),
        fetchTodaysLogs(),
        fetchGoal(),
        fetchAllGoals()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fix API response handling for fetchUserData
  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/profile');
      if (response.status === 200) {
        setUser(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };
  
  // Fix API response handling for fetchFoods
  const fetchFoods = async () => {
    try {
      console.log('Fetching foods from API...');
      const response = await api.get('/foods');
      console.log('Foods API response status:', response.status);
      console.log('Foods API response data type:', typeof response.data);
      console.log('Foods API response data length:', Array.isArray(response.data) ? response.data.length : 'not an array');
      console.log('Foods first few items:', Array.isArray(response.data) ? response.data.slice(0, 2) : response.data);
      
      if (response.status === 200) {
        // Ensure we're handling the response correctly
        if (Array.isArray(response.data)) {
          console.log(`Setting ${response.data.length} foods to state`);
          setFoods(response.data);
          return response.data;
        } else {
          console.error('API returned non-array data for foods:', response.data);
          setFoods([]);
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching foods:', error);
      setFoods([]);
      return [];
    }
  };
  
  // Fix API response handling for fetchLogs
  const fetchTodaysLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const formattedDate = `${today}T12:00:00Z`;
      
      const response = await api.get(`/logs?date=${formattedDate}`);
      if (response.status === 200) {
        // Ensure we're getting an array even if the API structure changes
        const logsData = response.data.logs || response.data || [];
        // Make sure logs is always an array
        setLogs(Array.isArray(logsData) ? logsData : []);
        return Array.isArray(logsData) ? logsData : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
      return [];
    }
  };
  
  // Fix API response handling for fetchGoals
  const fetchGoal = async () => {
    try {
      const response = await api.get('/goals/active');
      if (!response.data.message) {
        setGoal(response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching goal:', error);
      return null;
    }
  };
  
  const fetchAllGoals = async () => {
    try {
      console.log('Fetching all goals...');
      const response = await api.get('/goals');
      console.log('Goals response:', response.data);
      if (response.status === 200) {
        // Ensure response.data is always an array
        const goalsData = Array.isArray(response.data) ? response.data : [];
        console.log(`Setting ${goalsData.length} goals to state`);
        setAllGoals(goalsData);
        return goalsData;
      }
      return [];
    } catch (error) {
      console.error('Error fetching all goals:', error);
      setAllGoals([]);
      return [];
    }
  };
  
  // Fix API response handling for addFood
  const addFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/foods/', newFood);
      if (response.status === 201 || response.status === 200) {
        setNewFood({
          name: '',
          serving_size: 100,
          serving_unit: 'g',
          calories: 0,
          proteins: 0,
          carbs: 0,
          fats: 0,
          fiber: 0
        });
        fetchFoods();
      }
    } catch (error) {
      console.error('Error adding food:', error);
    }
  };
  
  // Fix API response handling for editFood
  const updateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFoodId) return;
    
    try {
      const response = await api.put(`/foods/${editingFoodId}`, newFood);
      
      if (response.status === 200) {
        setNewFood({
          name: '',
          serving_size: 100,
          serving_unit: 'g',
          calories: 0,
          proteins: 0,
          carbs: 0,
          fats: 0,
          fiber: 0
        });
        setEditingFoodId(null);
        fetchFoods();
      }
    } catch (error) {
      console.error('Error updating food:', error);
    }
  };
  
  const startEditingFood = (food: FoodItem) => {
    setNewFood({ ...food });
    setEditingFoodId(food._id as string);
  };
  
  const cancelEditingFood = () => {
    setNewFood({
      name: '',
      serving_size: 100,
      serving_unit: 'g',
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
      fiber: 0
    });
    setEditingFoodId(null);
  };
  
  // Fix API response handling for deleteFood
  const deleteFood = async (id: string) => {
    try {
      const response = await api.delete(`/foods/${id}`);
      
      if (response.status === 200) {
        fetchFoods();
      }
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };
  
  // Add a function to calculate nutrition based on food and amount with unit conversion
  const calculateNutrition = (food: FoodItem, amount: number, unit: string) => {
    // If using the same unit as the food's serving unit, simple proportion calculation
    if (unit === food.serving_unit) {
      const ratio = amount / food.serving_size;
      return {
        calories: Number(food.calories) * ratio,
        proteins: Number(food.proteins) * ratio,
        carbs: Number(food.carbs) * ratio,
        fats: Number(food.fats) * ratio,
        fiber: Number(food.fiber || 0) * ratio
      };
    }
    
    // For different units, we need conversions (simplified for MVP)
    // In a full app, you'd need a more comprehensive unit conversion system
    
    // Example basic conversion for common weight units
    let standardizedAmount = amount;
    let standardizedFoodServing = food.serving_size;
    
    // Convert food serving to grams for comparison (basic conversions)
    if (food.serving_unit === 'oz') {
      standardizedFoodServing = food.serving_size * 28.35; // oz to g
    } else if (food.serving_unit === 'lb') {
      standardizedFoodServing = food.serving_size * 453.59; // lb to g
    }
    
    // Convert logged amount to grams for comparison
    if (unit === 'oz') {
      standardizedAmount = amount * 28.35; // oz to g
    } else if (unit === 'lb') {
      standardizedAmount = amount * 453.59; // lb to g
    }
    
    // Calculate ratio based on standardized amounts
    const ratio = standardizedAmount / standardizedFoodServing;
    
    return {
      calories: Number(food.calories) * ratio,
      proteins: Number(food.proteins) * ratio,
      carbs: Number(food.carbs) * ratio,
      fats: Number(food.fats) * ratio,
      fiber: Number(food.fiber || 0) * ratio
    };
  };

  // Add this debugging function
  const logResponse = async (response: any) => {
    try {
      const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      console.log("Response status:", response.status);
      console.log("Response body:", text);
      return text;
    } catch (e) {
      console.log("Error reading response:", e);
      return "";
    }
  };

  // Fix API response handling for addLog
  const addLog = async (log: Omit<FoodLogEntry, 'id'>) => {
    try {
      const response = await api.post('/logs', log);
      if (response.status === 201 || response.status === 200) {
        // After adding log, refresh the logs for current date/view
        if (viewMode === 'day') {
          await fetchLogs(selectedDate);
        } else {
          await fetchWeekLogs(weekRange.start, weekRange.end);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding log:', error);
      return false;
    }
  };
  
  const startEditingLog = (log: FoodLogEntry) => {
    setNewLog({ ...log });
    setEditingLogId(log._id as string);
  };
  
  const cancelEditingLog = () => {
    setNewLog({
      date: new Date().toISOString().split('T')[0],
      meal_type: 'breakfast',
      food_id: '',
      name: '',
      amount: 1,
      unit: 'serving',
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
      fiber: 0
    });
    setEditingLogId(null);
  };
  
  // Fix API response handling for updateLog
  const updateLog = async (log: FoodLogEntry) => {
    try {
      const response = await api.put(`/logs/${log._id}`, log);
      if (response.status === 200) {
        const newLogs = logs.map(l => l._id === log._id ? response.data : l);
        setLogs(newLogs);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating log:', error);
      return false;
    }
  };
  
  // Fix API response handling for deleteLog
  const deleteLog = async (id: string) => {
    try {
      const response = await api.delete(`/logs/${id}`);
      
      if (response.status === 200) {
        // Remove from local state
        setLogs(logs.filter(log => log._id !== id));
        
        // Refresh the logs to ensure UI is in sync with server
        if (viewMode === 'day') {
          await fetchLogs(selectedDate);
        } else {
          await fetchWeekLogs(weekRange.start, weekRange.end);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting log:', error);
      return false;
    }
  };
  
  // Fix API response handling for updateGoals
  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/goals/', newGoal);
      
      if (response.status === 200 || response.status === 201) {
        // Reset form
        setNewGoal({
          type: 'weight loss',
          weight_target: {
            current: 70,
            goal: 65,
            weekly_rate: 0.5
          },
          nutrition_targets: [{
            name: 'Default',
            daily_calories: 2000,
            proteins: 150,
            carbs: 200,
            fats: 65,
            fiber: 25
          }]
        });
        // Refresh goals
        fetchAllGoals();
      }
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };
  
  const updateGoal = async (goalId: string, goalData: Partial<Goal>) => {
    try {
      console.log(`Updating goal ${goalId} with data:`, goalData);
      const response = await api.put(`/goals/${goalId}`, goalData);
      
      if (response.status === 200) {
        console.log("Goal updated successfully");
        // Refresh goals
        await fetchAllGoals();
        await fetchGoal();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating goal:', error);
      return false;
    }
  };
  
  const deleteGoal = async (goalId: string) => {
    try {
      console.log(`Deleting goal ${goalId}`);
      const response = await api.delete(`/goals/${goalId}`);
      
      if (response.status === 200) {
        console.log("Goal deleted successfully");
        // Refresh goals
        await fetchAllGoals();
        await fetchGoal();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting goal:', error);
      return false;
    }
  };
  
  const activateGoal = async (goalId: string) => {
    try {
      console.log(`Activating goal ${goalId}`);
      const response = await api.post(`/goals/${goalId}/activate`);
      
      if (response.status === 200) {
        console.log("Goal activated successfully");
        // Refresh both the active goal and all goals to ensure UI is in sync
        await fetchAllGoals();
        await fetchGoal();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error activating goal:', error);
      return false;
    }
  };

  // Update the handleFoodSelect function
  const handleFoodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const foodId = e.target.value;
    
    if (!foodId) {
      setNewLog({
        ...newLog,
        food_id: '',
        name: '',
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
        fiber: 0
      });
      return;
    }
    
    const selectedFood = foods.find(food => food._id === foodId);
    
    if (selectedFood) {
      // Set the food info
      setNewLog({
        ...newLog,
        food_id: foodId,
        name: selectedFood.name,
        unit: selectedFood.serving_unit,
        // Store reference values
        calories: selectedFood.calories,
        proteins: selectedFood.proteins,
        carbs: selectedFood.carbs,
        fats: selectedFood.fats,
        fiber: selectedFood.fiber || 0
      });
      
      // Then update calculated values based on current amount
      setTimeout(() => {
        updateNutritionCalculation(selectedFood, newLog.amount, selectedFood.serving_unit);
      }, 0);
    }
  };

  // Add a function to update nutrition calculation
  const updateNutritionCalculation = (food: FoodItem, amount: number, unit: string) => {
    if (!food) return;
    
    const nutrition = calculateNutrition(food, amount, unit);
    
    setNewLog(prev => ({
      ...prev,
      calories: nutrition.calories,
      proteins: nutrition.proteins,
      carbs: nutrition.carbs,
      fats: nutrition.fats,
      fiber: nutrition.fiber
    }));
  };

  // Update the handleAmountChange function
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    
    // Update amount first
    setNewLog(prev => ({
      ...prev,
      amount: amount
    }));
    
    // Then recalculate nutrition if a food is selected
    if (newLog.food_id) {
      const selectedFood = foods.find(food => food._id === newLog.food_id);
      if (selectedFood) {
        updateNutritionCalculation(selectedFood, amount, newLog.unit);
      }
    }
  };

  // Also update the unit change handler
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unit = e.target.value;
    
    // Update unit first
    setNewLog(prev => ({
      ...prev,
      unit: unit
    }));
    
    // Then recalculate nutrition if a food is selected
    if (newLog.food_id) {
      const selectedFood = foods.find(food => food._id === newLog.food_id);
      if (selectedFood) {
        updateNutritionCalculation(selectedFood, newLog.amount, unit);
      }
    }
  };

  // Add these functions for date navigation
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    // Use getDate() to get the day of the month and then subtract 1
    currentDate.setDate(currentDate.getDate() - 1);
    // Format properly to prevent timezone issues
    const newDate = currentDate.toISOString().split('T')[0];
    console.log("Going to previous day:", newDate);
    setSelectedDate(newDate);
    fetchTodaysLogs();
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    // Use getDate() to get the day of the month and then add 1
    currentDate.setDate(currentDate.getDate() + 1);
    // Format properly to prevent timezone issues
    const newDate = currentDate.toISOString().split('T')[0];
    console.log("Going to next day:", newDate);
    setSelectedDate(newDate);
    fetchTodaysLogs();
  };

  // Update useEffect to watch for selectedDate changes
  useEffect(() => {
    fetchTodaysLogs();
  }, [selectedDate]);

  // Update useEffect to refresh today's date
  useEffect(() => {
    // Check if the app just loaded or if it's a new day
    const currentDate = getTodayDateString();
    if (selectedDate === getTodayDateString()) {
      // If we're viewing today's logs, refresh when the date changes
      setSelectedDate(currentDate);
      fetchTodaysLogs();
    }
    
    // Set up the title based on whether selected date is today
    updateLogTitle(currentDate);
  }, [selectedDate]);

  // Update the log title function
  const updateLogTitle = (dateStr: string) => {
    const today = getTodayDateString();
    const isToday = dateStr === today;
    
    // Update the header text correctly
    setLogHeaderText(isToday 
      ? "Today's Food Log" 
      : `Food Log: ${new Date(dateStr).toLocaleDateString()}`
    );
  };

  // Add a daily check for date refresh
  useEffect(() => {
    // Check if the date has changed periodically
    const interval = setInterval(() => {
      const newToday = getTodayDateString();
      if (selectedDate === getTodayDateString() && newToday !== selectedDate) {
        console.log("Date changed, updating to new today:", newToday);
        setSelectedDate(newToday);
        fetchTodaysLogs();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Make sure the initial load gets today's date properly
  useEffect(() => {
    const today = getTodayDateString();
    console.log("Setting initial today's date:", today);
    setSelectedDate(today);
    fetchTodaysLogs();
  }, []);

  // Add a useEffect to explicitly fetch foods when component mounts
  useEffect(() => {
    console.log("Fetching foods on app initialization");
    fetchFoods();
  }, []);

  // Function to fetch logs for today or selected date
  const fetchLogs = async (date: string) => {
    try {
      // Format the date correctly to ensure API compatibility
      const formattedDate = `${date}T12:00:00Z`;
      
      console.log(`Fetching logs for date: ${date} (formatted: ${formattedDate})`);
      
      const response = await api.get(`/logs?date=${formattedDate}`);
      
      console.log("Logs API response status:", response.status);
      console.log("Logs API response structure:", typeof response.data, 
                  Object.keys(response.data || {}));
      
      if (response.status === 200) {
        // Handle different API response structures for compatibility
        let logsData: FoodLogEntry[] = [];
        
        if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data)) {
            logsData = response.data;
          } else if (response.data.logs && Array.isArray(response.data.logs)) {
            logsData = response.data.logs;
          }
        }
        
        console.log(`Fetched ${logsData.length} logs for ${date}`);
        setLogs(logsData);
        return logsData;
      }
      return [];
    } catch (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
  };

  // Function to fetch logs for a week
  const fetchWeekLogs = async (start: string, end: string) => {
    try {
      console.log(`Fetching week logs from ${start} to ${end}`);
      
      // Format dates for API compatibility
      const formattedStart = `${start}T00:00:00Z`;
      const formattedEnd = `${end}T23:59:59Z`;
      
      const response = await api.get(`/logs/range?start_date=${formattedStart}&end_date=${formattedEnd}`);
      
      console.log("Week logs API response status:", response.status);
      
      if (response.status === 200) {
        // Handle different API response structures
        const groupedLogs: {[date: string]: FoodLogEntry[]} = {};
        
        if (response.data && typeof response.data === 'object') {
          let dateRangeData = [];
          
          if (Array.isArray(response.data)) {
            dateRangeData = response.data;
          } else if (response.data.date_range && Array.isArray(response.data.date_range)) {
            dateRangeData = response.data.date_range;
          }
          
          // Add each date's logs to the groupedLogs object
          dateRangeData.forEach((dayData: {date: string, logs: FoodLogEntry[]}) => {
            if (dayData && dayData.date) {
              groupedLogs[dayData.date] = Array.isArray(dayData.logs) ? dayData.logs : [];
            }
          });
        }
        
        console.log(`Fetched logs for ${Object.keys(groupedLogs).length} days in the week`);
        setWeekLogs(groupedLogs);
        return groupedLogs;
      }
      return {};
    } catch (error) {
      console.error("Error fetching week logs:", error);
      return {};
    }
  };

  // Week navigation functions
  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // Calculate start of week (Sunday)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    
    // Calculate end of week (Saturday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Format dates
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    setSelectedDate(startStr);
    setWeekRange({start: startStr, end: endStr});
    
    // Update view mode
    setViewMode('week');
  };

  const goToPreviousWeek = () => {
    if (!weekRange.start) return;
    
    // Get current start date and move back 7 days
    const startDate = new Date(weekRange.start);
    startDate.setDate(startDate.getDate() - 7);
    
    // Calculate new end date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Format dates
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    setSelectedDate(startStr);
    setWeekRange({start: startStr, end: endStr});
  };

  const goToNextWeek = () => {
    if (!weekRange.end) return;
    
    // Get current end date and move forward 1 day
    const endDate = new Date(weekRange.end);
    endDate.setDate(endDate.getDate() + 1);
    
    // Calculate new start date
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    
    // Format dates
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    setSelectedDate(startStr);
    setWeekRange({start: startStr, end: endStr});
  };

  const switchToDay = () => {
    setViewMode('day');
    if (selectedDate) {
      fetchLogs(selectedDate);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      fetchLogs(today);
    }
  };

  // Fetch logs for the selected date when it changes
  useEffect(() => {
    if (selectedDate) {
      if (viewMode === 'day') {
        fetchLogs(selectedDate);
      } else if (viewMode === 'week') {
        // Calculate start and end date based on the selected date
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
        
        const end = new Date(start);
        end.setDate(end.getDate() + 6); // End of week (Saturday)
        
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        
        setWeekRange({start: startStr, end: endStr});
        fetchWeekLogs(startStr, endStr);
      }
    }
  }, [selectedDate, viewMode]);

  // Function to determine what to show in the FAB based on active tab
  const handleFabClick = () => {
    setEditingItemId(null);
    
    switch (activeTab) {
      case 'foods':
        setShowAddFoodModal(true);
        break;
      case 'logs':
        setShowLogFoodModal(true);
        break;
      case 'goals':
        setShowGoalModal(true);
        break;
      default:
        break;
    }
  };
  
  // Function to handle editing items
  const handleEditItem = (id: string, type: 'food' | 'log' | 'goal') => {
    setEditingItemId(id);
    
    switch (type) {
      case 'food':
        setShowAddFoodModal(true);
        break;
      case 'log':
        setShowLogFoodModal(true);
        break;
      case 'goal':
        setShowGoalModal(true);
        break;
      default:
        break;
    }
  };
  
  // Add useEffect to monitor modal state changes
  useEffect(() => {
    console.log("Modal state changed - showAddFoodModal:", showAddFoodModal);
  }, [showAddFoodModal]);
  
  // Get active screen content
  const getActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <WidgetProvider>
            <Home 
              user={user as User}
              goal={goal} 
              todaysLogs={logs} 
              onRefresh={fetchInitialData} 
            />
          </WidgetProvider>
        );
      case 'logs':
        return (
          <FoodLog 
            logs={logs} 
            foods={foods}
            onEdit={(id) => handleEditItem(id, 'log')}
            onDelete={deleteLog}
            onAddLog={() => {
              setEditingItemId(null);
              setShowLogFoodModal(true);
            }}
            onRefresh={fetchTodaysLogs}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onPrevDay={goToPreviousDay}
            onNextDay={goToNextDay}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            weekLogs={weekLogs}
            weekRange={weekRange}
            onPrevWeek={goToPreviousWeek}
            onNextWeek={goToNextWeek}
            onCurrentWeek={goToCurrentWeek}
            onSwitchToDay={switchToDay}
          />
        );
      case 'foods':
        console.log("Rendering FoodIndexTab component");
        return <FoodIndexTab 
                 foods={foods}
                 onAddFood={() => {
                   console.log("onAddFood called from FoodIndexTab");
                   console.log("Setting editingItemId to null");
                   setEditingItemId(null);
                   console.log("About to set showAddFoodModal to true");
                   setShowAddFoodModal(true);
                   console.log("showAddFoodModal state set to:", true);
                   // Force a re-render
                   setTimeout(() => {
                     console.log("Checking modal state after timeout:", showAddFoodModal);
                   }, 100);
                 }}
                 onEditFood={(id) => handleEditItem(id, 'food')}
                 onRefresh={async () => {
                   console.log("Refreshing food index data...");
                   const refreshedFoods = await fetchFoods();
                   return refreshedFoods;
                 }}
               />;
      case 'goals':
        return <Goals 
                 goal={goal}
                 onAddGoal={() => {
                   setEditingItemId(null);
                   setShowGoalModal(true);
                 }}
                 onEditGoal={(id) => handleEditItem(id, 'goal')}
                 onRefresh={fetchGoal}
               />;
      case 'health':
        return <AppleHealthTab userId={user?.uid || ''} />;
      case 'insights-trends':
        return <InsightsTrends userId={user?.uid || ''} />;
      case 'visuals':
        return <Visuals
                 userId={user?.uid || ''}
                 logs={logs}
                 goal={goal}
               />;
      case 'meal-plans':
        return <MealPlanner 
                 userId={user?.uid || ''}
                 dailyTargets={{
                   calories: goal?.nutrition_targets?.[0]?.daily_calories ?? 2000,
                   protein: goal?.nutrition_targets?.[0]?.proteins ?? 100,
                   carbs: goal?.nutrition_targets?.[0]?.carbs ?? 200,
                   fat: goal?.nutrition_targets?.[0]?.fats ?? 70
                 }}
                 onMealLogged={fetchTodaysLogs}
               />;
      case 'meal-suggestions':
        return <MealSuggestions 
                 userId={user?.uid || ''}
                 remainingMacros={{
                   calories: goal?.nutrition_targets[0]?.daily_calories ?? 2000,
                   protein: goal?.nutrition_targets[0]?.proteins ?? 100,
                   carbs: goal?.nutrition_targets[0]?.carbs ?? 200,
                   fat: goal?.nutrition_targets[0]?.fats ?? 70
                 }}
                 onMealLogged={fetchTodaysLogs}
               />;
      case 'chat':
        return <Chatbot />;
      case 'profile':
        return <Profile user={user} />;
      case 'dashboard':
        return (
          <div className="dashboard-container">
            <h1>Dashboard</h1>
            <DailyProgressFeedback 
              userId={user?.uid || ''}
              goalType={((goal?.type as 'lose' | 'maintain' | 'gain') || 'maintain')}
              onRefresh={() => calculateRemainingMacros(2000, { protein: 30, carbs: 40, fat: 30 })}
            />
            <GoalBasedMealSuggestions 
              userId={user?.uid || ''}
              goalType={((goal?.type as 'lose' | 'maintain' | 'gain') || 'maintain')}
              remainingMacros={remainingMacros}
              mealType="snack"
            />
          </div>
        );
      case 'insights':
        return (
          <div className="insights-container">
            <h1>Insights</h1>
            <WeeklyGoalInsights 
              userId={user?.uid || ''}
              goalType={((goal?.type as 'lose' | 'maintain' | 'gain') || 'maintain')}
              days={7}
            />
          </div>
        );
      case 'goals':
        return (
          <div className="goals-container">
            <h1>Goals</h1>
            <GoalProgressTracker
              userId={user?.uid || ''}
              goalType={((goal?.type as 'lose' | 'maintain' | 'gain') || 'maintain')}
              targetWeight={goal?.weight_target.goal || 65}
              startWeight={goal?.weight_target.current || 70}
              startDate={userGoalStartDate}
              weeklyRate={goal?.weight_target.weekly_rate || 0.5}
            />
          </div>
        );
      default:
        return <div>Screen not found</div>;
    }
  };
  
  // Handle tab changes from sidebar
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  
  // Add effect to handle URL query parameters
  useEffect(() => {
    // Parse query parameters from the URL
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    const actionParam = queryParams.get('action');
    
    console.log('URL query params:', { tab: tabParam, action: actionParam });
    
    // Set active tab based on query parameter if present
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    // Trigger actions based on action parameter
    if (actionParam) {
      switch (actionParam) {
        case 'logFood':
          setShowLogFoodModal(true);
          break;
        case 'addFood':
          setShowAddFoodModal(true);
          break;
        case 'addGoal':
          setShowGoalModal(true);
          break;
        // Add more actions as needed
      }
      
      // Clear the action parameter from the URL to prevent re-triggering on refresh
      // This maintains the tab parameter but removes the action
      const newUrl = location.pathname + 
        (tabParam ? `?tab=${tabParam}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [location, setShowLogFoodModal, setShowAddFoodModal, setShowGoalModal]);
  
  // Add new state for user goals
  const [userGoalType, setUserGoalType] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [userStartWeight, setUserStartWeight] = useState(70);
  const [userTargetWeight, setUserTargetWeight] = useState(65);
  const [userGoalStartDate, setUserGoalStartDate] = useState('2023-01-01');
  const [userWeeklyRate, setUserWeeklyRate] = useState(0.5);
  const [remainingMacros, setRemainingMacros] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  });
  
  // Add a useEffect to fetch user's goal data
  useEffect(() => {
    const fetchUserGoal = async () => {
      try {
        const response = await fetch('/profile');
        const userData = await response.json();
        
        if (userData.weightGoal) {
          setUserGoalType((userData.weightGoal.goalType as 'lose' | 'maintain' | 'gain') || 'maintain');
          setUserStartWeight(userData.basicInfo.weight || 70);
          setUserTargetWeight(userData.weightGoal.targetWeight || 65);
          setUserWeeklyRate(userData.weightGoal.weeklyRate || 0.5);
          
          // Calculate remaining macros for the day
          calculateRemainingMacros(
            userData.nutritionGoal.dailyCalories || 2000, 
            userData.nutritionGoal.macroDistribution || { protein: 30, carbs: 40, fat: 30 }
          );
        }
      } catch (error) {
        console.error('Error fetching user goal data:', error);
      }
    };
    
    fetchUserGoal();
  }, []);
  
  // Calculate remaining macros for the day
  const calculateRemainingMacros = async (totalCalories: number, macroDistribution: { protein: number, carbs: number, fat: number }) => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's food logs
      const response = await fetch(`/logs?date=${today}`);
      const logs = await response.json();
      
      // Calculate consumed macros
      const consumed = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
      
      logs.forEach((log: any) => {
        consumed.calories += log.calories || 0;
        consumed.protein += log.proteins || 0;
        consumed.carbs += log.carbs || 0;
        consumed.fat += log.fats || 0;
      });
      
      // Calculate target macros
      const targetProtein = (macroDistribution.protein / 100) * totalCalories / 4;
      const targetCarbs = (macroDistribution.carbs / 100) * totalCalories / 4;
      const targetFat = (macroDistribution.fat / 100) * totalCalories / 9;
      
      // Calculate remaining macros
      setRemainingMacros({
        calories: Math.max(0, totalCalories - consumed.calories),
        protein: Math.max(0, targetProtein - consumed.protein),
        carbs: Math.max(0, targetCarbs - consumed.carbs),
        fat: Math.max(0, targetFat - consumed.fat)
      });
    } catch (error) {
      console.error('Error calculating remaining macros:', error);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return (
    <div className="app">
      {/* Sidebar for navigation */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />
      
      <div className="app-content">
        {/* Mobile header with menu toggle */}
        {isMobile && (
          <header className="app-header mobile">
            <button 
              className="menu-toggle" 
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? '✕' : '☰'}
            </button>
            <h1>Nutrivize</h1>
            {user && <p className="user-welcome">Hi, {user.name}</p>}
          </header>
        )}
        
        {/* Desktop header */}
        {!isMobile && (
          <header className="app-header desktop">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}</h1>
            {user && <p className="user-welcome">Welcome, {user.name}</p>}
          </header>
        )}
        
        {/* Debug button - temporary */}
        {activeTab === 'foods' && (
          <div style={{ padding: '10px', textAlign: 'center' }}>
            <button 
              style={{ 
                padding: '8px 16px', 
                background: 'red', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                marginRight: '10px'
              }}
              onClick={() => {
                console.log("Debug button clicked");
                setShowAddFoodModal(true);
              }}
            >
              DEBUG: Open Add Food Modal
            </button>

            <button 
              style={{ 
                padding: '8px 16px', 
                background: 'green', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px' 
              }}
              onClick={() => {
                console.log("Test modal button clicked");
                setShowTestModal(true);
              }}
            >
              TEST: Open Test Modal
            </button>
            
            <div>{showAddFoodModal ? 'Modal should be open' : 'Modal is closed'}</div>
            <div>{showTestModal ? 'Test modal should be open' : 'Test modal is closed'}</div>
          </div>
        )}
        
        <main className="main-content">
          {getActiveScreen()}
        </main>
      </div>

      {/* Modals - moved outside app-content for better z-index handling */}
      {showAddFoodModal && (
        <AddFoodModal
          isOpen={showAddFoodModal}
          onClose={() => setShowAddFoodModal(false)}
          onFoodAdded={() => {
            fetchFoods();
            setShowAddFoodModal(false);
          }}
          editFoodId={editingItemId}
          foods={foods}
        />
      )}

      {/* Log Food Modal */}
      <LogFoodModal
        isOpen={showLogFoodModal}
        onClose={() => setShowLogFoodModal(false)}
        onLogAdded={() => {
          fetchTodaysLogs();
          setShowLogFoodModal(false);
        }}
        foods={foods}
        editLogId={editingItemId}
      />

      {/* Goal Modal */}
      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onGoalAdded={async () => {
          await fetchGoal();
          await fetchAllGoals();
          setShowGoalModal(false);
        }}
        editGoalId={editingItemId}
        currentGoal={goal}
      />

      {/* Test Modal */}
      <TestModal 
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
      />
    </div>
  );
};

export default App;
