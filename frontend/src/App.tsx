import React, { useState, useEffect } from 'react'
import './App.css'
import Chatbot from './components/Chatbot'
import NutritionTrends from './components/NutritionTrends'
import MealSuggestions from './components/MealSuggestions'
import MealPlanner from './components/MealPlanner'
import Insights from './components/Insights'
import { useUserContext } from './context/UserContext'

// Types
interface FoodItem {
  _id?: string;
  name: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface FoodLog {
  _id?: string;
  date: string;
  meal_type: string;
  food_id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface Goal {
  _id?: string;
  type: string;
  weight_target: {
    current: number;
    goal: number;
    weekly_rate: number;
  };
  nutrition_targets: NutritionTarget[];
}

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

function App() {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState('foods');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [logs, setLogs] = useState<FoodLog[]>([]);
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
  const [newLog, setNewLog] = useState<FoodLog>({
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
  const [weekLogs, setWeekLogs] = useState<{[date: string]: FoodLog[]}>({});
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

  // Fetch data on component mount
  useEffect(() => {
    if (USER_ID) {
      fetchFoods();
      fetchLogs();
      fetchGoal();
      fetchAllGoals();
    }
  }, [USER_ID]); // Re-fetch when the user ID changes

  // API calls
  
  const fetchFoods = async () => {
    try {
      const response = await fetch(`${API_URL}/foods/`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setFoods(data);
    } catch (error) {
      console.error('Error fetching foods:', error);
    }
  };
  
  const fetchLogs = async (dateStr = selectedDate) => {
    try {
      // Ensure consistent date format with time to avoid timezone issues
      console.log("Fetching logs for date:", dateStr);
      
      // Format the date with time component to ensure proper UTC handling
      const formattedDate = `${dateStr}T12:00:00Z`;
      
      const response = await fetch(`${API_URL}/logs?user_id=${USER_ID}&date=${formattedDate}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        console.error("Error fetching logs:", response.status);
        return;
      }
      
      const data = await response.json();
      console.log("Fetched logs:", data);
      
      // Update UI - use data.logs instead of data
      setLogs(data.logs || []);
      updateLogTitle(dateStr);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };
  
  const fetchGoal = async () => {
    try {
      const response = await fetch(`${API_URL}/goals/active`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!data.message) {
        setGoal(data);
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
    }
  };
  
  const fetchAllGoals = async () => {
    try {
      const response = await fetch(`${API_URL}/goals/`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setAllGoals(data);
    } catch (error) {
      console.error('Error fetching all goals:', error);
    }
  };
  
  // Food CRUD operations
  const addFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/foods/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newFood)
      });
      
      if (response.ok) {
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
  
  const updateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFoodId) return;
    
    try {
      const response = await fetch(`${API_URL}/foods/${editingFoodId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(newFood)
      });
      
      if (response.ok) {
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
  
  const deleteFood = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/foods/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
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
  const logResponse = async (response) => {
    try {
      const text = await response.text();
      console.log("Response status:", response.status);
      console.log("Response body:", text);
      return text;
    } catch (e) {
      console.log("Error reading response:", e);
      return "";
    }
  };

  // Updated addLog function with better error handling and debugging
  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a copy with the user ID added
      const logData = {
        ...newLog,
        user_id: USER_ID
      };
      
      const response = await fetch(`${API_URL}/logs/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(logData)
      });
      
      if (response.ok) {
        // Reset form
        cancelEditingLog();
        // Refresh logs
        fetchLogs();
      }
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };
  
  const startEditingLog = (log: FoodLog) => {
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
  
  // Updated updateLog function
  const updateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogId) return;
    
    try {
      const response = await fetch(`${API_URL}/logs/${editingLogId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(newLog)
      });
      
      if (response.ok) {
        // Reset form
        cancelEditingLog();
        // Refresh logs
        fetchLogs();
      }
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };
  
  const deleteLog = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/logs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchLogs();
      }
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };
  
  // Goal CRUD operations
  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/goals/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newGoal)
      });
      
      if (response.ok) {
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
      const response = await fetch(`${API_URL}/goals/${goalId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(goalData)
      });
      
      if (response.ok) {
        // Refresh goals
        fetchAllGoals();
        fetchGoal();
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };
  
  const deleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`${API_URL}/goals/${goalId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchAllGoals();
        fetchGoal();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };
  
  const activateGoal = async (goalId: string) => {
    try {
      const response = await fetch(`${API_URL}/goals/${goalId}/activate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchAllGoals();
        fetchGoal();
      }
    } catch (error) {
      console.error('Error activating goal:', error);
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
    fetchLogs(newDate);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    // Use getDate() to get the day of the month and then add 1
    currentDate.setDate(currentDate.getDate() + 1);
    // Format properly to prevent timezone issues
    const newDate = currentDate.toISOString().split('T')[0];
    console.log("Going to next day:", newDate);
    setSelectedDate(newDate);
    fetchLogs(newDate);
  };

  // Update useEffect to watch for selectedDate changes
  useEffect(() => {
    fetchLogs();
  }, [selectedDate]);

  // Update useEffect to refresh today's date
  useEffect(() => {
    // Check if the app just loaded or if it's a new day
    const currentDate = getTodayDateString();
    if (selectedDate === getTodayDateString()) {
      // If we're viewing today's logs, refresh when the date changes
      setSelectedDate(currentDate);
      fetchLogs(currentDate);
    }
    
    // Set up the title based on whether selected date is today
    updateLogTitle(currentDate);
  }, [selectedDate]);

  // Update the log title function
  const updateLogTitle = (dateStr) => {
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
        fetchLogs(newToday);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Make sure the initial load gets today's date properly
  useEffect(() => {
    const today = getTodayDateString();
    console.log("Setting initial today's date:", today);
    setSelectedDate(today);
    fetchLogs(today);
  }, []);

  // Add this function after fetchLogs
  const fetchLogsRange = async (startDate: string, endDate: string) => {
    try {
      console.log("Fetching logs for range:", startDate, "to", endDate);
      
      const response = await fetch(`${API_URL}/logs/range?user_id=${USER_ID}&start_date=${startDate}&end_date=${endDate}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        console.error("Error fetching logs range:", response.status);
        return;
      }
      
      const data = await response.json();
      
      // Update the week logs state
      if (data.date_range) {
        const weekLogsObj: {[date: string]: FoodLog[]} = {};
        data.date_range.forEach((day: any) => {
          weekLogsObj[day.date] = day.logs || [];
        });
        setWeekLogs(weekLogsObj);
      }
    } catch (error) {
      console.error('Error fetching logs range:', error);
    }
  };

  // Add this function after goToNextDay
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
    
    // Fetch logs for the week
    fetchLogsRange(startStr, endStr);
    
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
    
    // Fetch logs for the previous week
    fetchLogsRange(startStr, endStr);
  };

  const goToNextWeek = () => {
    if (!weekRange.end) return;
    
    // Get current end date and move forward 1 day
    const endDate = new Date(weekRange.end);
    endDate.setDate(endDate.getDate() + 7);
    
    // Calculate new start date
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    
    // Format dates
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    // Fetch logs for the next week
    fetchLogsRange(startStr, endStr);
  };

  const switchToDay = () => {
    setViewMode('day');
    fetchLogs(selectedDate);
  };

  // Update useEffect to fetch initial data
  useEffect(() => {
    const today = getTodayDateString();
    console.log("Setting initial today's date:", today);
    setSelectedDate(today);
    fetchLogs(today);
    
    // Also fetch the current week data
    const currentDate = new Date(today);
    const dayOfWeek = currentDate.getDay();
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - dayOfWeek);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Format dates
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    // Pre-fetch week data but don't switch view
    fetchLogsRange(startStr, endStr);
  }, []);

  return (
    <div className="app">
      <h1>Nutrivize MVP</h1>
      
      {user && (
        <div className="welcome-message">
          Welcome, {user.email}!
        </div>
      )}
      
      <div className="tabs">
        <button 
          className={activeTab === 'foods' ? 'active' : ''} 
          onClick={() => setActiveTab('foods')}
        >
          Food Index
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''} 
          onClick={() => setActiveTab('logs')}
        >
          Food Log
        </button>
        <button 
          className={activeTab === 'goals' ? 'active' : ''} 
          onClick={() => setActiveTab('goals')}
        >
          Goals
        </button>
        <button 
          className={activeTab === 'suggestions' ? 'active' : ''} 
          onClick={() => setActiveTab('suggestions')}
        >
          AI-Enhanced Meal Suggestions
        </button>
        <button 
          className={activeTab === 'meal-plans' ? 'active' : ''} 
          onClick={() => setActiveTab('meal-plans')}
        >
          Meal Plans
        </button>
        <button 
          className={activeTab === 'trends' ? 'active' : ''} 
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button 
          className={activeTab === 'insights' ? 'active' : ''} 
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button 
          className={activeTab === 'chat' ? 'active' : ''} 
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'foods' && (
          <div>
            <h2>Food Index</h2>
            
            <form onSubmit={editingFoodId ? updateFood : addFood} className="form">
              <h3>{editingFoodId ? 'Edit Food' : 'Add New Food'}</h3>
              <div className="form-group">
                <label>Name:</label>
                <input 
                  type="text" 
                  value={newFood.name} 
                  onChange={(e) => setNewFood({...newFood, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Serving Size:</label>
                  <input 
                    type="number" 
                    value={newFood.serving_size} 
                    onChange={(e) => setNewFood({...newFood, serving_size: parseFloat(e.target.value)})}
                    required
                    min="0.1"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit:</label>
                  <select
                    value={newFood.serving_unit}
                    onChange={(e) => setNewFood({...newFood, serving_unit: e.target.value})}
                    required
                  >
                    {FOOD_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Calories:</label>
                  <input 
                    type="number" 
                    value={newFood.calories} 
                    onChange={(e) => setNewFood({...newFood, calories: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Protein (g):</label>
                  <input 
                    type="number" 
                    value={newFood.proteins} 
                    onChange={(e) => setNewFood({...newFood, proteins: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Carbs (g):</label>
                  <input 
                    type="number" 
                    value={newFood.carbs} 
                    onChange={(e) => setNewFood({...newFood, carbs: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Fats (g):</label>
                  <input 
                    type="number" 
                    value={newFood.fats} 
                    onChange={(e) => setNewFood({...newFood, fats: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Fiber (g):</label>
                <input 
                  type="number" 
                  value={newFood.fiber} 
                  onChange={(e) => setNewFood({...newFood, fiber: parseFloat(e.target.value)})}
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div className="form-buttons">
                <button type="submit">{editingFoodId ? 'Update Food' : 'Add Food'}</button>
                {editingFoodId && (
                  <button type="button" onClick={cancelEditingFood} className="cancel-btn">
                    Cancel
                  </button>
                )}
              </div>
            </form>
            
            <div className="list">
              <h3>Food List</h3>
              {foods.length === 0 ? (
                <p>No foods added yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Serving</th>
                      <th>Calories</th>
                      <th>Protein</th>
                      <th>Carbs</th>
                      <th>Fats</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foods.map(food => (
                      <tr key={food._id}>
                        <td>{food.name}</td>
                        <td>{food.serving_size} {food.serving_unit}</td>
                        <td>{food.calories}</td>
                        <td>{food.proteins}g</td>
                        <td>{food.carbs}g</td>
                        <td>{food.fats}g</td>
                        <td className="action-buttons">
                          <button 
                            onClick={() => startEditingFood(food)}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteFood(food._id as string)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div>
            <h2>Food Log</h2>
            
            <form onSubmit={editingLogId ? updateLog : addLog} className="form">
              <h3>{editingLogId ? 'Edit Food Log' : 'Log Food'}</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date:</label>
                  <input 
                    type="date" 
                    value={newLog.date} 
                    onChange={(e) => {
                      // Update the form date
                      setNewLog({...newLog, date: e.target.value});
                      
                      // Optionally, also navigate to that date to show logs for the same day
                      if (e.target.value !== selectedDate) {
                        setSelectedDate(e.target.value);
                        fetchLogs(e.target.value);
                      }
                    }}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Meal:</label>
                  <select 
                    value={newLog.meal_type} 
                    onChange={(e) => setNewLog({...newLog, meal_type: e.target.value})}
                    required
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Food:</label>
                <select 
                  value={newLog.food_id} 
                  onChange={handleFoodSelect}
                  required
                  disabled={editingLogId !== null}
                >
                  <option value="">Select a food</option>
                  {foods.map(food => (
                    <option key={food._id} value={food._id}>
                      {food.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Amount:</label>
                  <input 
                    type="number" 
                    value={newLog.amount} 
                    onChange={handleAmountChange}
                    min="0.1"
                    step="0.1"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Unit:</label>
                  <select
                    value={newLog.unit}
                    onChange={handleUnitChange}
                    required
                  >
                    {FOOD_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-buttons">
                <button type="submit">
                  {editingLogId ? 'Update Log' : 'Log Food'}
                </button>
                {editingLogId && (
                  <button type="button" onClick={cancelEditingLog} className="cancel-btn">
                    Cancel
                  </button>
                )}
              </div>
            </form>
            
            <div className="list">
              <div className="view-controls">
                <button 
                  className={viewMode === 'day' ? 'active-view' : ''}
                  onClick={switchToDay}
                >
                  Day View
                </button>
                <button 
                  className={viewMode === 'week' ? 'active-view' : ''}
                  onClick={goToCurrentWeek}
                >
                  Week View
                </button>
              </div>
              
              {viewMode === 'day' ? (
                <div className="day-view">
                  <div className="log-header">
                    <button 
                      className="nav-button"
                      onClick={goToPreviousDay}
                      aria-label="Previous day"
                    >
                      &lt;
                    </button>
                    <h3>{logHeaderText}</h3>
                    <button 
                      className="nav-button"
                      onClick={goToNextDay}
                      aria-label="Next day"
                    >
                      &gt;
                    </button>
                  </div>
                  
                  {logs.length === 0 ? (
                    <div className="no-data-message">
                      <p>No foods logged for this day.</p>
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Meal</th>
                          <th>Food</th>
                          <th>Amount</th>
                          <th>Calories</th>
                          <th>Protein</th>
                          <th>Carbs</th>
                          <th>Fats</th>
                          <th>Fiber</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map(log => (
                          <tr key={log._id}>
                            <td>{new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
                            <td>{log.meal_type}</td>
                            <td>{log.name}</td>
                            <td>{log.amount} {log.unit}</td>
                            <td>{Math.round(log.calories)}</td>
                            <td>{log.proteins?.toFixed(1)}g</td>
                            <td>{log.carbs?.toFixed(1)}g</td>
                            <td>{log.fats?.toFixed(1)}g</td>
                            <td>{log.fiber?.toFixed(1)}g</td>
                            <td className="action-buttons">
                              <button 
                                onClick={() => startEditingLog(log)}
                                className="edit-btn"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => deleteLog(log._id as string)}
                                className="delete-btn"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="week-view">
                  <div className="log-header">
                    <button 
                      className="nav-button"
                      onClick={goToPreviousWeek}
                      aria-label="Previous week"
                    >
                      &lt;
                    </button>
                    <h3>Week of {weekRange.start} to {weekRange.end}</h3>
                    <button 
                      className="nav-button"
                      onClick={goToNextWeek}
                      aria-label="Next week"
                    >
                      &gt;
                    </button>
                  </div>
                  
                  {Object.keys(weekLogs).length === 0 ? (
                    <div className="no-data-message">
                      <p>No foods logged for this week. Start logging meals to see your weekly summary.</p>
                    </div>
                  ) : (
                    <div className="week-logs">
                      {Object.entries(weekLogs).map(([date, dayLogs]) => (
                        <div key={date} className="day-log-card">
                          <h4>{new Date(date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}</h4>
                          {dayLogs.length === 0 ? (
                            <p className="no-logs-message">No food logged</p>
                          ) : (
                            <>
                              <p>{dayLogs.length} food items</p>
                              <p className="day-total">
                                {dayLogs.reduce((sum, log) => sum + (log.calories || 0), 0).toFixed(0)} cal
                              </p>
                            </>
                          )}
                          <button onClick={() => {
                            setSelectedDate(date);
                            switchToDay();
                          }}>View</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'goals' && (
          <div>
            <h2>Goals</h2>
            
            <div className="current-goal">
              <h3>Current Active Goal</h3>
              {goal ? (
                <div className="goal-card active-goal">
                  <p><strong>Type:</strong> {goal.type}</p>
                  <p><strong>Current Weight:</strong> {goal.weight_target.current} kg</p>
                  <p><strong>Goal Weight:</strong> {goal.weight_target.goal} kg</p>
                  <p><strong>Weekly Rate:</strong> {goal.weight_target.weekly_rate} kg/week</p>
                  
                  <h4>Nutrition Targets:</h4>
                  {goal.nutrition_targets.map((target, index) => (
                    <div key={index} className="target-card">
                      <p><strong>{target.name}</strong></p>
                      <p>Calories: {target.daily_calories} kcal</p>
                      <p>Protein: {target.proteins}g</p>
                      <p>Carbs: {target.carbs}g</p>
                      <p>Fats: {target.fats}g</p>
                      {target.fiber > 0 && <p>Fiber: {target.fiber}g</p>}
                    </div>
                  ))}
                  
                  <div className="goal-actions">
                    <button 
                      onClick={() => {
                        setEditingGoalId(goal._id || null);
                        setNewGoal({...goal});
                      }}
                    >
                      Edit Goal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-data-message">
                  <p>No active goal set. Create a new goal below to get started!</p>
                </div>
              )}
            </div>

            <div className="goal-list">
              <h3>All Goals</h3>
              {allGoals.length === 0 ? (
                <div className="no-data-message">
                  <p>You haven't created any goals yet. Use the form below to create your first goal.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Weight</th>
                      <th>Calories</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allGoals.map(g => (
                      <tr key={g._id}>
                        <td>{g.type}</td>
                        <td>{g.weight_target.current} kg → {g.weight_target.goal} kg</td>
                        <td>{g.nutrition_targets[0]?.daily_calories || 0} kcal</td>
                        <td className="action-buttons">
                          <button 
                            onClick={() => {
                              setEditingGoalId(g._id || null);
                              setNewGoal({...g});
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteGoal(g._id || '')}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            {(editingGoalId !== null || !goal) && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingGoalId) {
                  updateGoal(editingGoalId, newGoal);
                } else {
                  createGoal(e);
                }
              }} className="form">
                <h3>{editingGoalId ? 'Edit Goal' : 'Create New Goal'}</h3>
                
                <div className="form-group">
                  <label>Goal Type:</label>
                  <select 
                    value={newGoal.type} 
                    onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
                    required
                  >
                    <option value="weight loss">Weight Loss</option>
                    <option value="weight gain">Weight Gain</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Current Weight (kg):</label>
                    <input 
                      type="number" 
                      value={newGoal.weight_target.current} 
                      onChange={(e) => setNewGoal({
                        ...newGoal, 
                        weight_target: {
                          ...newGoal.weight_target,
                          current: parseFloat(e.target.value)
                        }
                      })}
                      required
                      step="0.1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Goal Weight (kg):</label>
                    <input 
                      type="number" 
                      value={newGoal.weight_target.goal} 
                      onChange={(e) => setNewGoal({
                        ...newGoal, 
                        weight_target: {
                          ...newGoal.weight_target,
                          goal: parseFloat(e.target.value)
                        }
                      })}
                      required
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Weekly Rate (kg/week):</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={newGoal.weight_target.weekly_rate} 
                    onChange={(e) => setNewGoal({
                      ...newGoal, 
                      weight_target: {
                        ...newGoal.weight_target,
                        weekly_rate: parseFloat(e.target.value)
                      }
                    })}
                    required
                  />
                </div>
                
                <h4>Nutrition Target</h4>
                
                <div className="form-group">
                  <label>Daily Calories:</label>
                  <input 
                    type="number" 
                    value={newGoal.nutrition_targets[0]?.daily_calories || 0} 
                    onChange={(e) => {
                      const targets = [...(newGoal.nutrition_targets || [])];
                      if (targets.length === 0) {
                        targets.push({
                          name: 'Default',
                          daily_calories: 0,
                          proteins: 0,
                          carbs: 0,
                          fats: 0,
                          fiber: 0
                        });
                      }
                      targets[0] = {...targets[0], daily_calories: parseFloat(e.target.value)};
                      setNewGoal({...newGoal, nutrition_targets: targets});
                    }}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Protein (g):</label>
                    <input 
                      type="number" 
                      value={newGoal.nutrition_targets[0]?.proteins || 0} 
                      onChange={(e) => {
                        const targets = [...(newGoal.nutrition_targets || [])];
                        if (targets.length === 0) {
                          targets.push({
                            name: 'Default',
                            daily_calories: 0,
                            proteins: 0,
                            carbs: 0,
                            fats: 0,
                            fiber: 0
                          });
                        }
                        targets[0] = {...targets[0], proteins: parseFloat(e.target.value)};
                        setNewGoal({...newGoal, nutrition_targets: targets});
                      }}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Carbs (g):</label>
                    <input 
                      type="number" 
                      value={newGoal.nutrition_targets[0]?.carbs || 0} 
                      onChange={(e) => {
                        const targets = [...(newGoal.nutrition_targets || [])];
                        if (targets.length === 0) {
                          targets.push({
                            name: 'Default',
                            daily_calories: 0,
                            proteins: 0,
                            carbs: 0,
                            fats: 0,
                            fiber: 0
                          });
                        }
                        targets[0] = {...targets[0], carbs: parseFloat(e.target.value)};
                        setNewGoal({...newGoal, nutrition_targets: targets});
                      }}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Fats (g):</label>
                    <input 
                      type="number" 
                      value={newGoal.nutrition_targets[0]?.fats || 0} 
                      onChange={(e) => {
                        const targets = [...(newGoal.nutrition_targets || [])];
                        if (targets.length === 0) {
                          targets.push({
                            name: 'Default',
                            daily_calories: 0,
                            proteins: 0,
                            carbs: 0,
                            fats: 0,
                            fiber: 0
                          });
                        }
                        targets[0] = {...targets[0], fats: parseFloat(e.target.value)};
                        setNewGoal({...newGoal, nutrition_targets: targets});
                      }}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Fiber (g):</label>
                    <input 
                      type="number" 
                      value={newGoal.nutrition_targets[0]?.fiber || 0} 
                      onChange={(e) => {
                        const targets = [...(newGoal.nutrition_targets || [])];
                        if (targets.length === 0) {
                          targets.push({
                            name: 'Default',
                            daily_calories: 0,
                            proteins: 0,
                            carbs: 0,
                            fats: 0,
                            fiber: 0
                          });
                        }
                        targets[0] = {...targets[0], fiber: parseFloat(e.target.value)};
                        setNewGoal({...newGoal, nutrition_targets: targets});
                      }}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit">{editingGoalId ? 'Update Goal' : 'Create Goal'}</button>
                  {editingGoalId && (
                    <button 
                      type="button" 
                      onClick={() => setEditingGoalId(null)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
        
        {activeTab === 'suggestions' && (
          <div>
            <h2>AI-Enhanced Meal Suggestions</h2>
            {foods.length === 0 ? (
              <div className="no-data-message">
                <p>You need to add some foods to your food index first. Head over to the Food Index tab to add some foods!</p>
              </div>
            ) : (
              <MealSuggestions 
                userId={USER_ID} 
                remainingMacros={{
                  calories: goal?.nutrition_targets[0]?.daily_calories ?? 2000,
                  protein: goal?.nutrition_targets[0]?.proteins ?? 100,
                  carbs: goal?.nutrition_targets[0]?.carbs ?? 200,
                  fat: goal?.nutrition_targets[0]?.fats ?? 70
                }}
                onMealLogged={() => fetchLogs()}
              />
            )}
          </div>
        )}
        
        {activeTab === 'meal-plans' && (
          <div>
            <h2>Meal Plans</h2>
            {foods.length === 0 ? (
              <div className="no-data-message">
                <p>You need to add some foods to your food index first. Head over to the Food Index tab to add some foods!</p>
              </div>
            ) : (
              <MealPlanner 
                userId={USER_ID} 
                dailyTargets={{
                  calories: goal?.nutrition_targets?.[0]?.daily_calories ?? 2000,
                  protein: goal?.nutrition_targets?.[0]?.proteins ?? 100,
                  carbs: goal?.nutrition_targets?.[0]?.carbs ?? 200,
                  fat: goal?.nutrition_targets?.[0]?.fats ?? 70
                }}
                onMealLogged={() => fetchLogs()} 
              />
            )}
          </div>
        )}
        
        {activeTab === 'trends' && (
          <div>
            <h2>Nutrition Trends</h2>
            {logs.length === 0 ? (
              <div className="no-data-message">
                <p>No food data available yet. Log some meals to see your nutrition trends!</p>
              </div>
            ) : (
              <NutritionTrends 
                userId={USER_ID}
                days={trendPeriod}
              />
            )}
          </div>
        )}
        
        {activeTab === 'insights' && (
          <div>
            <h2>Nutrition Insights</h2>
            {logs.length < 3 ? (
              <div className="no-data-message">
                <p>Not enough data to generate insights. Log at least 3 days of meals to see personalized nutrition insights!</p>
              </div>
            ) : (
              <Insights userId={USER_ID} />
            )}
          </div>
        )}
        
        {activeTab === 'chat' && (
          <div>
            <h2>NutriBot Assistant</h2>
            <p>Ask me any nutrition-related questions or tell me to share a joke!</p>
            <Chatbot />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
