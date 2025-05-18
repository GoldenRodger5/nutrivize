/// <reference types="node" />
import React, { useState, useEffect, useCallback } from 'react';
import '../styles/MealPlanner.css';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { getToken } from '../utils/auth';
import { useUserContext } from '../context/UserContext';
import { Spinner } from './ui/Spinner';

// Modern SVG Icons
const icons = {
  mealPlan: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 10V7M8 10V13M8 10H16M16 10V7M16 10V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  add: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.1334 5.64C17.8749 4.30583 16.2051 3.42 14.3799 3.1262C12.5546 2.83239 10.6835 3.14229 9.04432 4.01147C7.40518 4.88064 6.09086 6.26784 5.28515 7.95452C4.47943 9.6412 4.22429 11.5364 4.56026 13.3743C4.89624 15.2121 5.80519 16.8958 7.15703 18.1853C8.50887 19.4748 10.2321 20.3024 12.0775 20.5453C13.9229 20.7882 15.8061 20.4342 17.4458 19.5336C19.0855 18.633 20.3883 17.2186 21.1734 15.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.1667 8.38V3.88H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  generate: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 21L14 3M17.5 14.5L22 10L17.5 5.5M6.5 5.5L2 10L6.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  feature: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 12L11 14L15 10M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  grocery: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 11H6C5.44772 11 5 10.5523 5 10V5C5 4.44772 5.44772 4 6 4H18C18.5523 4 19 4.44772 19 5V10C19 10.5523 18.5523 11 18 11H15M9 11V21C9 21.5523 9.44772 22 10 22H14C14.5523 22 15 21.5523 15 21V11M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  total: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 3H13M11 21H13M4 13H2M4 11H2M22 13H20M22 11H20M19.0784 18.9282L18.3784 17.8282M19.0784 5.0718L18.3784 6.1718M5.6569 19.7567L6.7569 18.6567M5.6569 4.2433L6.7569 5.3433" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  protein: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 11C5.11929 11 4 9.88071 4 8.5C4 7.11929 5.11929 6 6.5 6C7.88071 6 9 7.11929 9 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 8C18.8807 8 20 6.88071 20 5.5C20 4.11929 18.8807 3 17.5 3C16.1193 3 15 4.11929 15 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 15.5C20 19.0899 16.9706 22 12 22C7.02944 22 4 19.0899 4 15.5C4 11.9101 7.02944 9 12 9C16.9706 9 20 11.9101 20 15.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  carbs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9C3 7.89543 3.89543 7 5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 21V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 4H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  fat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 7C14 9.76142 11.7614 12 9 12C6.23858 12 4 9.76142 4 7C4 4.23858 6.23858 2 9 2C11.7614 2 14 4.23858 14 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M20 17.5C20 19.433 18.433 21 16.5 21C14.567 21 13 19.433 13 17.5C13 15.567 14.567 14 16.5 14C18.433 14 20 15.567 20 17.5Z" stroke="currentColor" strokeWidth="2" />
      <path d="M13.5 7.5L16.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  meal: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 15C20 18.866 16.866 22 13 22H11C7.13401 22 4 18.866 4 15V9C4 5.13401 7.13401 2 11 2H13C16.866 2 20 5.13401 20 9V15Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M9 10L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 7L12 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  time: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 10H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

interface MacroBreakdown {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  in_food_index: boolean;
}

interface MealPlanMeal {
  name: string;
  macros: MacroBreakdown;
  description: string;
  serving_info: string;
  ingredients: Ingredient[];
  instructions: string[];
  cooking_time: number;
  meal_type: string;
  is_logged: boolean;
  day: number;
  is_leftover?: boolean;
  original_meal_day?: number;
  repeat_of_meal_id?: string;
}

interface DailyPlan {
  date: string;
  meals: { [key: string]: MealPlanMeal };
  daily_totals: MacroBreakdown;
  is_complete: boolean;
}

interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  days: DailyPlan[];
  plan_totals: MacroBreakdown;
  grocery_list: Array<{
    item: string;
    amount: number;
    unit: string;
    estimated_cost: number | null;
    category?: string;
    in_food_index?: boolean;
  }>;
}

interface MealPlannerProps {
  userId: string;
  dailyTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onMealLogged?: () => void;
}

const MealPlanner: React.FC<MealPlannerProps> = ({ userId, dailyTargets, onMealLogged }) => {
  // Ensure we have valid daily targets
  const validDailyTargets = {
    calories: typeof dailyTargets?.calories === 'number' ? dailyTargets.calories : 2000,
    protein: typeof dailyTargets?.protein === 'number' ? dailyTargets.protein : 150,
    carbs: typeof dailyTargets?.carbs === 'number' ? dailyTargets.carbs : 200,
    fat: typeof dailyTargets?.fat === 'number' ? dailyTargets.fat : 65
  };

  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{meal: MealPlanMeal, dayIndex: number} | null>(null);
  const [showMealDetails, setShowMealDetails] = useState(false);
  
  // New plan form state
  const [newPlanFormData, setNewPlanFormData] = useState<{
    name: string;
    num_days: number;
    daily_calories: number;
    meal_types: string[];
    dietary_restrictions: string[];
    include_leftovers: boolean;
    repeat_meals: boolean;
    protein_percent: number;
    carbs_percent: number;
    fat_percent: number;
  }>({
    name: '',
    num_days: 3,
    daily_calories: 2000,
    meal_types: ['breakfast', 'lunch', 'dinner'],
    dietary_restrictions: [],
    include_leftovers: true,
    repeat_meals: false,
    protein_percent: 30,
    carbs_percent: 40, 
    fat_percent: 30
  });

  // Add state for feature banner visibility
  const [showFeatureBanner, setShowFeatureBanner] = useState(true);

  // Add these missing state variables
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Add this state variable before setActivePlanId function
  const [allMealPlans, setAllMealPlans] = useState<MealPlan[]>([]);

  // Replace setActivePlanId with setActivePlan when used with a specific ID
  const setActivePlanId = (id: string) => {
    setActivePlan(allMealPlans.find(plan => plan.id === id) || null);
  };

  // Add fetchMealPlans function
  const fetchMealPlans = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const token = getToken();
      const response = await fetch(`/api/meal-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setAllMealPlans(data);
      return data;
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      setError('Failed to fetch meal plans');
    } finally {
      setIsLoading(false);
    }
  };

  const [activeView, setActiveView] = useState<'view-plan' | 'create-plan'>('view-plan');
  const { showToast } = useToast();

  // Fetch the active meal plan on component mount
  useEffect(() => {
    fetchActivePlan();
  }, [userId]);

  const fetchActivePlan = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const token = getToken();
      const response = await fetch(`/api/meal-plans/active?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404 || (await response.json()).message === "No active meal plan found") {
          setActivePlan(null);
          setIsLoading(false);
          return;
        }
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setActivePlan(data);
    } catch (err) {
      console.error('Error fetching active meal plan:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createMealPlan = async () => {
    let isMounted = true;
    setIsCreatingPlan(true);
    setError("");
    
    try {
      const token = getToken();
      const requestData = {
        user_id: userId,
        name: newPlanFormData.name || 'My Meal Plan',
        days: Number(newPlanFormData.num_days),
        meal_types: newPlanFormData.meal_types,
        meal_distribution: {
          breakfast: newPlanFormData.meal_types.includes('breakfast') ? 0.25 : 0,
          lunch: newPlanFormData.meal_types.includes('lunch') ? 0.35 : 0,
          dinner: newPlanFormData.meal_types.includes('dinner') ? 0.30 : 0,
          snack: newPlanFormData.meal_types.includes('snack') ? 0.10 : 0
        },
        daily_targets: {
          calories: Number(newPlanFormData.daily_calories),
          protein: Number(newPlanFormData.daily_calories * (newPlanFormData.protein_percent / 100) / 4),
          carbs: Number(newPlanFormData.daily_calories * (newPlanFormData.carbs_percent / 100) / 4),
          fat: Number(newPlanFormData.daily_calories * (newPlanFormData.fat_percent / 100) / 9)
        },
        preferences: {
          diet_type: newPlanFormData.dietary_restrictions.length > 0 ? newPlanFormData.dietary_restrictions[0] : null,
          dietary_restrictions: newPlanFormData.dietary_restrictions
        },
        use_leftovers: newPlanFormData.include_leftovers,
        allow_meal_repetition: false,
        repeat_meals: {}
      };
      
      console.log("Sending meal plan request:", requestData);
      
      const response = await axios.post(
        `/api/generate-meal-plan`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      
      console.log("Meal plan response received:", response.data);
      
      if (response.data && isMounted) {
        // Close modal and switch to view mode
        setShowCreateModal(false);
        
        // Reset form data
        setNewPlanFormData({
          name: '',
          num_days: 7,
          daily_calories: 2000,
          meal_types: ['breakfast', 'lunch', 'dinner'],
          dietary_restrictions: [],
          protein_percent: 30,
          carbs_percent: 40,
          fat_percent: 30,
          include_leftovers: true,
          repeat_meals: false
        });
        
        // Refresh meal plans and select the new one
        await fetchMealPlans();
        await fetchActivePlan();
        
        // Only show success messages if component is still mounted
        if (isMounted) {
          showToast('Meal plan created successfully!', 'success');
          setSuccess('Meal plan created successfully!');
        }
      }
    } catch (error) {
      console.error('Error creating meal plan:', error);
      let errorMessage = 'Failed to create meal plan';
      
      // Handle different error response formats
      if (error.response) {
        // If the error has a response object
        if (error.response.data) {
          if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
        }
        // Include HTTP status for debugging
        console.error(`HTTP Error: ${error.response.status} - ${errorMessage}`);
      } else if (error.message) {
        // If error has a message property but no response (e.g. network error)
        errorMessage = error.message;
      }
      
      if (isMounted) {
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      if (isMounted) {
        setIsCreatingPlan(false);
      }
    }
    
    // Return a cleanup function
    return () => {
      isMounted = false;
    };
  };

  const logMealFromPlan = async (mealPlanId: string, dayIndex: number, mealType: string) => {
    let isMounted = true;
    try {
      setError("");
      const token = getToken();
      const response = await fetch(
        `/api/meal-plans/${mealPlanId}/log-meal?user_id=${userId}&day_index=${dayIndex}&meal_type=${mealType}`,
        { 
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        // Keep current UI state and display error
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update the UI to show meal as logged, only if component is still mounted
      if (activePlan && isMounted) {
        const updatedPlan = { ...activePlan };
        updatedPlan.days[dayIndex].meals[mealType].is_logged = true;
        
        // Check if all meals for the day are logged
        const allDayMealsLogged = Object.values(updatedPlan.days[dayIndex].meals)
          .every(meal => meal.is_logged);
        
        if (allDayMealsLogged) {
          updatedPlan.days[dayIndex].is_complete = true;
        }
        
        // Important: preserve the selected day when updating the plan
        setActivePlan(updatedPlan);
      }
      
      if (isMounted) {
        setSuccess(`Successfully logged ${mealType}`);
        showToast(`${mealType} has been logged successfully`, 'success');
      }
      
      // Call the callback if provided and component is still mounted
      if (onMealLogged && isMounted) {
        onMealLogged();
      }
    } catch (err) {
      console.error('Error logging meal:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      if (isMounted) {
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    }
    
    // Return cleanup function
    return () => {
      isMounted = false;
    };
  };

  const handleMealClick = (meal: MealPlanMeal, dayIndex: number) => {
    setSelectedMeal({ meal, dayIndex });
    setShowMealDetails(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date available';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'Invalid date format';
    }
  };

  // Helper function to get icons for grocery categories
  const getCategoryIcon = (category: string) => {
    const icons: {[key: string]: string} = {
      'produce': '🥬',
      'fruits': '🍎',
      'vegetables': '🥕',
      'dairy': '🥛',
      'meat': '🥩',
      'seafood': '🐟',
      'bakery': '🍞',
      'grains': '🌾',
      'canned': '🥫',
      'frozen': '❄️',
      'spices': '🌶️',
      'beverages': '🥤',
      'snacks': '🍿',
      'other': '🛒'
    };
    
    return icons[category.toLowerCase()] || '🛒';
  };

  const renderMealPlanDay = (day: DailyPlan | undefined, index: number) => {
    if (!day) return <div className="no-day-data">No data available for this day</div>;
    if (!day.daily_totals) {
      console.warn('Missing daily_totals for day:', day);
      return <div className="no-day-data">Incomplete data for this day</div>;
    }
    if (!day.meals) {
      console.warn('Missing meals for day:', day);
      return <div className="no-day-data">Incomplete meal data for this day</div>;
    }
    
    return (
      <div className={`meal-plan-day ${day.is_complete ? 'completed-day' : ''}`} key={index}>
        <h3 className="day-header">
          {formatDate(day.date)}
          {day.is_complete && <span className="day-status">✓ Completed</span>}
        </h3>
        
        <div className="day-macros">
          <div className="macro-item">
            <span className="macro-value">{Math.round(day.daily_totals.calories)}</span>
            <span className="macro-label">cal</span>
          </div>
          <div className="macro-item">
            <span className="macro-value">{Math.round(day.daily_totals.protein)}g</span>
            <span className="macro-label">protein</span>
          </div>
          <div className="macro-item">
            <span className="macro-value">{Math.round(day.daily_totals.carbs)}g</span>
            <span className="macro-label">carbs</span>
          </div>
          <div className="macro-item">
            <span className="macro-value">{Math.round(day.daily_totals.fat)}g</span>
            <span className="macro-label">fat</span>
          </div>
        </div>
        
        <div className="day-meals">
          {Object.entries(day.meals).map(([mealType, meal]) => (
            <div 
              className={`meal-card ${meal.is_logged ? 'logged-meal' : ''} ${meal.is_leftover ? 'leftover-meal' : ''} ${meal.repeat_of_meal_id ? 'repeat-meal' : ''}`} 
              key={mealType}
              onClick={() => handleMealClick(meal, index)}
            >
              <div className="meal-header">
                <h4>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h4>
                <div className="meal-status-badges">
                  {meal.is_logged && <span className="meal-logged-status">Logged</span>}
                  {meal.is_leftover && <span className="meal-leftover-status">Leftover</span>}
                  {meal.repeat_of_meal_id && <span className="meal-repeat-status">Repeat</span>}
                </div>
              </div>
              <h5 className="meal-name">{meal.name}</h5>
              <p className="meal-description">{meal.description}</p>
              <div className="meal-macros">
                <span>{Math.round(meal.macros.calories)} cal</span>
                <span>{Math.round(meal.macros.protein)}g protein</span>
              </div>
              <div className="meal-footer">
                <span>⏱️ {meal.cooking_time} min</span>
                {!meal.is_logged && (
                  <button 
                    className="log-meal-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening the details
                      if (activePlan) {
                        logMealFromPlan(activePlan.id, index, mealType);
                      }
                    }}
                  >
                    Log Meal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMealDetailsModal = () => {
    if (!selectedMeal) return null;
    
    const { meal, dayIndex } = selectedMeal;
    
    return (
      <div className="meal-details-modal-overlay" onClick={() => setShowMealDetails(false)}>
        <div className="meal-details-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{meal.name}</h3>
            <button className="close-button" onClick={() => setShowMealDetails(false)}>×</button>
          </div>
          
          <div className="modal-content">
            {/* Special status indicators for leftovers and repeated meals */}
            {(meal.is_leftover || meal.repeat_of_meal_id) && (
              <div className={`meal-special-status ${meal.is_leftover ? 'leftover-status' : 'repeat-status'}`}>
                {meal.is_leftover && (
                  <p>
                    <span className="status-badge">♻️ Leftover</span> 
                    from Day {meal.original_meal_day} {meal.original_meal_day && meal.day > meal.original_meal_day ? `(${formatDate(activePlan?.days[meal.original_meal_day-1]?.date || '')})` : ''}
                  </p>
                )}
                {meal.repeat_of_meal_id && !meal.is_leftover && (
                  <p><span className="status-badge">🔄 Repeat</span> from an earlier day</p>
                )}
              </div>
            )}
            
            <div className="meal-details-section">
              <h4>Description</h4>
              <p>{meal.description}</p>
              <p className="serving-info"><strong>Serving:</strong> {meal.serving_info}</p>
              <p className="cooking-time"><strong>Cooking Time:</strong> {meal.cooking_time} minutes</p>
            </div>
            
            <div className="meal-details-section">
              <h4>Macros</h4>
              <div className="macros-grid">
                <div className="macro-item">
                  <span className="macro-value">{Math.round(meal.macros.calories)}</span>
                  <span className="macro-label">calories</span>
                </div>
                <div className="macro-item">
                  <span className="macro-value">{Math.round(meal.macros.protein)}g</span>
                  <span className="macro-label">protein</span>
                </div>
                <div className="macro-item">
                  <span className="macro-value">{Math.round(meal.macros.carbs)}g</span>
                  <span className="macro-label">carbs</span>
                </div>
                <div className="macro-item">
                  <span className="macro-value">{Math.round(meal.macros.fat)}g</span>
                  <span className="macro-label">fat</span>
                </div>
              </div>
            </div>
            
            <div className="meal-details-section">
              <h4>Ingredients</h4>
              <ul className="ingredients-list">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index}>
                    <span className="ingredient-name">{ingredient.name}</span>
                    <span className="ingredient-amount">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                    {ingredient.in_food_index && (
                      <span className="in-food-index">In your food index</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="meal-details-section">
              <h4>Instructions</h4>
              {meal.is_leftover ? (
                <p className="leftover-instructions">
                  Simply reheat this leftover meal. Make sure to heat thoroughly to an internal temperature of 165°F for food safety.
                </p>
              ) : (
                <ol className="instructions-list">
                  {meal.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            {!meal.is_logged && activePlan && (
              <button 
                className="log-meal-btn"
                onClick={() => {
                  logMealFromPlan(activePlan.id, dayIndex, meal.meal_type);
                  setShowMealDetails(false);
                }}
              >
                Log This Meal
              </button>
            )}
            <button 
              className="close-btn"
              onClick={() => setShowMealDetails(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreatePlanModal = () => {
    return (
      <div className="create-plan-modal-overlay" onClick={(e) => {
        e.stopPropagation();
        setShowCreateModal(false);
      }}>
        <div className="create-plan-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Create New Meal Plan</h3>
            <button 
              className="close-button" 
              onClick={() => setShowCreateModal(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-content">
            <div className="form-group">
              <label htmlFor="planName">Plan Name</label>
              <input
                id="planName"
                type="text"
                value={newPlanFormData.name}
                onChange={(e) => setNewPlanFormData({...newPlanFormData, name: e.target.value})}
                placeholder="My Weekly Meal Plan"
              />
              <p className="field-hint">Give your meal plan a descriptive name</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="numDays">Number of Days</label>
              <input
                id="numDays"
                type="number"
                min="1"
                max="7"
                value={newPlanFormData.num_days}
                onChange={(e) => setNewPlanFormData({...newPlanFormData, num_days: parseInt(e.target.value)})}
              />
              <p className="field-hint">Plan between 1-7 days</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="dailyCalories">Daily Calories</label>
              <input
                id="dailyCalories"
                type="number"
                min="1200"
                max="4000"
                value={newPlanFormData.daily_calories}
                onChange={(e) => setNewPlanFormData({...newPlanFormData, daily_calories: parseInt(e.target.value)})}
              />
              <p className="field-hint">Recommended range: 1200-4000 calories</p>
            </div>
            
            <div className="form-group">
              <label>Meal Types</label>
              <div className="checkbox-group">
                {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                  <div key={type} className="checkbox-label">
                    <input
                      id={`mealType-${type}`}
                      type="checkbox"
                      checked={newPlanFormData.meal_types.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPlanFormData({
                            ...newPlanFormData, 
                            meal_types: [...newPlanFormData.meal_types, type]
                          });
                        } else {
                          setNewPlanFormData({
                            ...newPlanFormData, 
                            meal_types: newPlanFormData.meal_types.filter(t => t !== type)
                          });
                        }
                      }}
                    />
                    <label htmlFor={`mealType-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</label>
                  </div>
                ))}
              </div>
              <p className="field-hint">Select at least one meal type</p>
            </div>
            
            <div className="form-group">
              <label>Dietary Restrictions</label>
              <div className="checkbox-group">
                {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'].map(restriction => (
                  <div key={restriction} className="checkbox-label">
                    <input
                      id={`restriction-${restriction}`}
                      type="checkbox"
                      name="dietaryRestrictions"
                      value={restriction}
                      checked={newPlanFormData.dietary_restrictions.includes(restriction)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPlanFormData({
                            ...newPlanFormData, 
                            dietary_restrictions: [...newPlanFormData.dietary_restrictions, restriction]
                          });
                        } else {
                          setNewPlanFormData({
                            ...newPlanFormData, 
                            dietary_restrictions: newPlanFormData.dietary_restrictions.filter(r => r !== restriction)
                          });
                        }
                      }}
                    />
                    <label htmlFor={`restriction-${restriction}`}>{restriction.charAt(0).toUpperCase() + restriction.slice(1)}</label>
                  </div>
                ))}
              </div>
              <p className="field-hint">Optional: Select any dietary restrictions</p>
            </div>
            
            <div className="advanced-options">
              <h4 className="section-title" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
                Advanced Options {showAdvancedOptions ? '▼' : '►'}
                <span className="optional-badge">Optional</span>
              </h4>
              
              {showAdvancedOptions && (
                <>
                  <div className="form-group">
                    <label>Macronutrient Split</label>
                    <div className="macro-sliders">
                      <div className="macro-slider">
                        <label htmlFor="proteinPercent">Protein: {newPlanFormData.protein_percent}%</label>
                        <input
                          id="proteinPercent"
                          type="range"
                          min="10"
                          max="60"
                          value={newPlanFormData.protein_percent}
                          onChange={(e) => setNewPlanFormData({
                            ...newPlanFormData, 
                            protein_percent: parseInt(e.target.value)
                          })}
                        />
                      </div>
                      <div className="macro-slider">
                        <label htmlFor="carbsPercent">Carbs: {newPlanFormData.carbs_percent}%</label>
                        <input
                          id="carbsPercent"
                          type="range"
                          min="10"
                          max="60"
                          value={newPlanFormData.carbs_percent}
                          onChange={(e) => setNewPlanFormData({
                            ...newPlanFormData, 
                            carbs_percent: parseInt(e.target.value)
                          })}
                        />
                      </div>
                      <div className="macro-slider">
                        <label htmlFor="fatPercent">Fat: {newPlanFormData.fat_percent}%</label>
                        <input
                          id="fatPercent"
                          type="range"
                          min="10"
                          max="60"
                          value={newPlanFormData.fat_percent}
                          onChange={(e) => setNewPlanFormData({
                            ...newPlanFormData, 
                            fat_percent: parseInt(e.target.value)
                          })}
                        />
                      </div>
                    </div>
                    <p className="field-hint">Total should be close to 100% (currently: {newPlanFormData.protein_percent + newPlanFormData.carbs_percent + newPlanFormData.fat_percent}%)</p>
                  </div>
                  
                  <div className="form-group">
                    <div className="checkbox-label">
                      <input
                        id="includeLeftovers"
                        type="checkbox"
                        checked={newPlanFormData.include_leftovers}
                        onChange={(e) => setNewPlanFormData({...newPlanFormData, include_leftovers: e.target.checked})}
                      />
                      <label htmlFor="includeLeftovers">
                        Include Leftovers
                        <span className="info-tooltip" title="Reuse some meals as leftovers to reduce cooking time and food waste">?</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <div className="checkbox-label">
                      <input
                        id="repeatMeals"
                        type="checkbox"
                        checked={newPlanFormData.repeat_meals}
                        onChange={(e) => setNewPlanFormData({...newPlanFormData, repeat_meals: e.target.checked})}
                      />
                      <label htmlFor="repeatMeals">
                        Repeat Meals
                        <span className="info-tooltip" title="Allow the same meal to appear multiple times in your plan (e.g., same breakfast daily)">?</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button 
              className="cancel-btn"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button 
              className={`generate-plan-btn ${isCreatingPlan ? 'loading' : ''}`}
              disabled={isCreatingPlan || newPlanFormData.meal_types.length === 0 || !newPlanFormData.name}
              onClick={() => {
                console.log("Create meal plan button clicked");
                console.log("isCreatingPlan:", isCreatingPlan);
                console.log("meal_types:", newPlanFormData.meal_types);
                console.log("name:", newPlanFormData.name);
                
                if (!isCreatingPlan && newPlanFormData.meal_types.length > 0 && newPlanFormData.name) {
                  createMealPlan();
                }
              }}
            >
              {isCreatingPlan ? (
                <>
                  <span className="spinner"></span>
                  <span>Generating Plan...</span>
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  <span>Generate Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Only fetch meal plans on component mount
  useEffect(() => {
    // Add guards to prevent unwanted side-effects
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        if (isMounted) setIsLoading(true);
        await fetchMealPlans();
        await fetchActivePlan();
      } catch (err) {
        console.error('Error in initial data loading:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    // Clear any success/error messages on day change
    setError('');
    setSuccess('');
  }, [selectedDay]);

  // Add debugging for modal state changes
  useEffect(() => {
    console.log('Modal visibility changed:', showCreateModal);
  }, [showCreateModal]);

  // Properly handle loading state changes
  useEffect(() => {
    if (success && isCreatingPlan) {
      // If we got a success message, disable the loading state
      setIsCreatingPlan(false);
    }
  }, [success]);

  return (
    <div className="meal-planner">
      <div className="meal-planner-header">
        <h2>
          <span className="header-icon">{icons.mealPlan}</span>
          Meal Planner
        </h2>
        {activePlan ? (
          <h3 className="active-plan-title">{activePlan.name}</h3>
        ) : (
          <p className="no-plan-message">You don't have an active meal plan</p>
        )}
        <button 
          className="create-plan-btn"
          onClick={(e) => {
            e.preventDefault();
            setShowCreateModal(true);
          }}
        >
          <span className="btn-icon">{icons.add}</span>
          {activePlan ? 'Create New Plan' : 'Create Your First Plan'}
        </button>
      </div>
      
      {/* New Feature Highlight Banner */}
      {showFeatureBanner && (
        <div className="feature-highlight">
          <button 
            className="dismiss-banner" 
            onClick={() => setShowFeatureBanner(false)}
            aria-label="Dismiss"
          >
            {icons.close}
          </button>
          <h3>
            <span className="feature-icon" style={{marginRight: '0.5rem'}}>{icons.feature}</span>
            New AI-Powered Meal Planning!
          </h3>
          <p>Create custom meal plans for up to 7 days with smart features:</p>
          <ul className="feature-list">
            <li><span className="feature-icon">🔄</span> Repeat favorite meals across days</li>
            <li><span className="feature-icon">♻️</span> Use leftovers to reduce food waste</li>
            <li><span className="feature-icon">🛒</span> Auto-generated grocery lists with cost estimates</li>
            <li><span className="feature-icon">🥗</span> Diet-specific meal suggestions (keto, vegan, etc.)</li>
          </ul>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {isLoading ? (
        <div className="loading-spinner">Loading meal plan...</div>
      ) : (
        <div className="meal-plan-content">
          {activePlan ? (
            <div className="meal-plan">
              <div className="plan-details">
                <div className="plan-macros">
                  <h4>
                    <span className="header-icon" style={{width: '20px', height: '20px'}}>{icons.total}</span>
                    Plan Totals
                  </h4>
                  <div className="macro-grid">
                    <div className="macro-item">
                      <span className="macro-value">{Math.round(activePlan?.plan_totals?.calories || 0)}</span>
                      <span className="macro-label">cal</span>
                    </div>
                    <div className="macro-item">
                      <span className="macro-value">{Math.round(activePlan?.plan_totals?.protein || 0)}g</span>
                      <span className="macro-label">protein</span>
                    </div>
                    <div className="macro-item">
                      <span className="macro-value">{Math.round(activePlan?.plan_totals?.carbs || 0)}g</span>
                      <span className="macro-label">carbs</span>
                    </div>
                    <div className="macro-item">
                      <span className="macro-value">{Math.round(activePlan?.plan_totals?.fat || 0)}g</span>
                      <span className="macro-label">fat</span>
                    </div>
                  </div>
                </div>
                
                <div className="plan-dates">
                  <p>
                    <span className="header-icon" style={{width: '18px', height: '18px', marginRight: '0.5rem'}}>{icons.calendar}</span>
                    <strong>Start Date:</strong> {activePlan?.start_date ? formatDate(activePlan.start_date) : 'No date available'}
                  </p>
                  <p>
                    <span className="header-icon" style={{width: '18px', height: '18px', marginRight: '0.5rem'}}>{icons.calendar}</span>
                    <strong>End Date:</strong> {activePlan?.end_date ? formatDate(activePlan.end_date) : 'No date available'}
                  </p>
                </div>
              </div>
              
              <div className="days-tabs">
                {activePlan && activePlan.days && activePlan.days.map((day, i) => (
                  <button 
                    key={i}
                    className={`day-tab ${selectedDay === i ? 'active-day' : ''}`}
                    onClick={() => setSelectedDay(i)}
                  >
                    Day {i + 1}
                    {day.is_complete && <span className="day-complete-indicator">✓</span>}
                  </button>
                ))}
              </div>
              
              <div className="day-content">
                {activePlan && activePlan.days && Array.isArray(activePlan.days) && selectedDay < activePlan.days.length 
                  ? renderMealPlanDay(activePlan.days[selectedDay], selectedDay)
                  : <div className="no-day-data">No data available for this day</div>
                }
              </div>
              
              <div className="grocery-list">
                <h4>
                  <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <span className="header-icon">{icons.grocery}</span>
                    <span>Grocery List</span>
                  </span>
                  {activePlan && activePlan.grocery_list && activePlan.grocery_list.length > 0 && (
                    <span className="grocery-count">{activePlan.grocery_list.length} items</span>
                  )}
                </h4>
                
                {/* Calculate total estimated cost */}
                {activePlan && activePlan.grocery_list && activePlan.grocery_list.length > 0 && (
                  <div className="grocery-summary">
                    <p className="total-cost">
                      <strong>Estimated Total:</strong> ${activePlan.grocery_list.reduce((total, item) => 
                        total + (item.estimated_cost || 0), 0).toFixed(2)}
                    </p>
                    <p className="grocery-tip">
                      <span className="tip-icon">💡</span> Items in your food index are highlighted in green
                    </p>
                  </div>
                )}
                
                {/* Group items by category */}
                {activePlan && activePlan.grocery_list && (
                  <div className="grocery-categories">
                    {Object.entries(
                      activePlan.grocery_list.reduce((categories, item) => {
                        const category = item.category || 'other';
                        if (!categories[category]) {
                          categories[category] = [];
                        }
                        categories[category].push(item);
                        return categories;
                      }, {} as {[key: string]: any[]})
                    ).map(([category, items]) => (
                      <div key={category} className="grocery-category">
                        <div className="category-header">
                          <h5 className="category-name">
                            {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                            <span className="item-count">{items.length}</span>
                          </h5>
                        </div>
                        <ul>
                          {items.map((item, i) => (
                            <li key={i} className={item.in_food_index ? 'in-food-index' : ''}>
                              <div className="grocery-item-details">
                                <span className="item-name">{item.item}</span>
                                <span className="item-amount">{item.amount} {item.unit}</span>
                              </div>
                              {(item.estimated_cost !== null && item.estimated_cost !== undefined) && (
                                <span className="item-cost">${item.estimated_cost.toFixed(2)}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
                
                {(!activePlan || !activePlan.grocery_list || activePlan.grocery_list.length === 0) && (
                  <div className="empty-grocery-list">
                    <p>Your grocery list will appear here once you create a meal plan.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">{icons.mealPlan}</div>
              <h3>Get started with AI-powered meal planning</h3>
              <p>Create a personalized meal plan to organize your nutrition, save time, and reduce food waste.</p>
              <div className="empty-state-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">{icons.time}</span>
                  <span>Save time planning meals</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">💰</span>
                  <span>Reduce grocery spending</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">{icons.protein}</span>
                  <span>Improve nutrition balance</span>
                </div>
              </div>
              <button 
                className="create-plan-btn pulsing"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
              >
                <span className="btn-icon">{icons.add}</span>
                Create Your First Plan
              </button>
            </div>
          )}
        </div>
      )}
      
      {showMealDetails && renderMealDetailsModal()}
      {showCreateModal && renderCreatePlanModal()}
    </div>
  );
};

export default MealPlanner;