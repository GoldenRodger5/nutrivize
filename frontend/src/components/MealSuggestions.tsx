import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/MealSuggestions.css';

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

interface IngredientWithMacros extends Ingredient {
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  needs_indexing?: boolean;
  baseServingSize?: number;  // Standard reference amount
  baseMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  servings?: number;  // Number of servings consumed
}

interface MealSuggestion {
  name: string;
  macros: MacroBreakdown;
  description: string;
  serving_info: string;
  ingredients: IngredientWithMacros[];
  instructions: string[];
  cooking_time: number;
}

export interface MealSuggestionRequest {
  user_id: string;
  meal_type: string;
  time_of_day: string;
  preference?: string | null;
  remaining_macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  use_food_index_only: boolean;
  specific_ingredients?: string[];
  calorie_range?: { min: number; max: number };
  diet_type?: string;
  cooking_time?: number;
}

interface MealSuggestionResponse {
  suggestions: MealSuggestion[];
}

interface FoodItem {
  _id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  serving_size: number;
  serving_unit: string;
}

interface MealSuggestionsProps {
  userId: string;
  remainingMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onMealLogged?: () => void;
}

const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
const preferenceTypes = [
  { value: null, label: "No preference" },
  { value: "healthy", label: "Healthy" },
  { value: "quick", label: "Quick & Easy" },
  { value: "high-protein", label: "High Protein" },
  { value: "low-carb", label: "Low Carb" },
  { value: "keto", label: "Keto-friendly" },
  { value: "vegetarian", label: "Vegetarian" },
];

const dietTypes = [
  { value: null, label: "No specific diet" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Ketogenic" },
  { value: "paleo", label: "Paleo" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" }
];

const calorieRangePresets = [
  { label: "Any calories", min: 0, max: 1500, value: "any" },
  { label: "Low calorie (200-400)", min: 200, max: 400, value: "low" },
  { label: "Medium calorie (400-600)", min: 400, max: 600, value: "medium" },
  { label: "High calorie (600-800)", min: 600, max: 800, value: "high" },
  { label: "Custom", min: 0, max: 1000, value: "custom" }
];

const cookingTimeOptions = [
  { value: null, label: "Any time" },
  { value: 15, label: "Quick (15 min or less)" },
  { value: 30, label: "Medium (30 min or less)" },
  { value: 60, label: "Long (60 min or less)" }
];

// Add this unit conversion data
const UNIT_CONVERSIONS = {
  g: {
    oz: 0.035274, // 1g = 0.035274oz
    cup: 0.004227, // 1g ≈ 0.004227 cups (approximate)
    tbsp: 0.067628, // 1g ≈ 0.067628 tbsp (approximate)
    tsp: 0.202884, // 1g ≈ 0.202884 tsp (approximate)
  },
  oz: {
    g: 28.3495, // 1oz = 28.3495g
    cup: 0.125, // 1oz = 1/8 cup (approximate)
    tbsp: 2, // 1oz ≈ 2 tbsp (approximate)
    tsp: 6, // 1oz ≈ 6 tsp (approximate)
  },
  cup: {
    g: 236.588, // 1 cup ≈ 236.588g (approximate)
    oz: 8, // 1 cup = 8oz (approximate)
    tbsp: 16, // 1 cup = 16 tbsp
    tsp: 48, // 1 cup = 48 tsp
  },
  tbsp: {
    g: 14.7868, // 1 tbsp ≈ 14.7868g (approximate)
    oz: 0.5, // 1 tbsp = 0.5oz (approximate)
    cup: 0.0625, // 1 tbsp = 1/16 cup
    tsp: 3, // 1 tbsp = 3 tsp
  },
  tsp: {
    g: 4.92892, // 1 tsp ≈ 4.92892g (approximate)
    oz: 0.166667, // 1 tsp ≈ 1/6oz (approximate)
    cup: 0.0208333, // 1 tsp = 1/48 cup
    tbsp: 0.333333, // 1 tsp = 1/3 tbsp
  },
};

// Common unit options
const UNIT_OPTIONS = ["g", "oz", "cup", "tbsp", "tsp"];

// Add this cache helper outside the component
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Generate a cache key from a request
const generateCacheKey = (request: MealSuggestionRequest): string => {
  const { meal_type, preference, specific_ingredients, diet_type, cooking_time } = request;
  return `${meal_type}-${preference || 'none'}-${specific_ingredients?.join(',') || 'none'}-${diet_type || 'none'}-${cooking_time || 'none'}`;
};

// Define the cache structure
interface CachedMealSuggestion {
  key: string;
  timestamp: number;
  suggestions: MealSuggestion[];
}

const MealSuggestions: React.FC<MealSuggestionsProps> = ({ userId, remainingMacros, onMealLogged }) => {
  const [mealType, setMealType] = useState<string>("snack");
  const [preference, setPreference] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loggingMeal, setLoggingMeal] = useState<boolean>(false);
  const [useFoodIndexOnly, setUseFoodIndexOnly] = useState<boolean>(true);
  
  // State for additional filters
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [calorieRange, setCalorieRange] = useState<{ min: number; max: number }>({ min: 0, max: 1500 });
  const [caloriePreset, setCaloriePreset] = useState<string>("any");
  const [showCustomCalories, setShowCustomCalories] = useState<boolean>(false);
  const [dietType, setDietType] = useState<string | null>(null);
  const [cookingTime, setCookingTime] = useState<number | null>(null);
  const [searchIngredientQuery, setSearchIngredientQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // State for selected meal info modal
  const [selectedMeal, setSelectedMeal] = useState<MealSuggestion | null>(null);
  const [showModal, setShowModal] = useState(false);

  // State for editing ingredients
  const [editingIngredients, setEditingIngredients] = useState<boolean>(false);
  const [editedMeal, setEditedMeal] = useState<MealSuggestion | null>(null);
  const [availableIngredientsForEdit, setAvailableIngredientsForEdit] = useState<FoodItem[]>([]);
  const [searchEditIngredientQuery, setSearchEditIngredientQuery] = useState<string>("");
  const [showAddIngredientPanel, setShowAddIngredientPanel] = useState<boolean>(false);

  // Add this state variable inside the component
  const [showEditingSuccessMessage, setShowEditingSuccessMessage] = useState<boolean>(false);

  // Add cache-related state
  const [useCache, setUseCache] = useState<boolean>(true);
  const [cacheStatus, setCacheStatus] = useState<string>("");
  const suggestionCacheRef = useRef<CachedMealSuggestion[]>([]);
  
  // Load cache from localStorage when component mounts
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('mealSuggestionCache');
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData) as CachedMealSuggestion[];
        // Filter out expired cache entries
        const now = Date.now();
        const validCache = parsedCache.filter(
          entry => now - entry.timestamp < CACHE_EXPIRATION_TIME
        );
        suggestionCacheRef.current = validCache;
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
      // If loading fails, just use an empty cache
      suggestionCacheRef.current = [];
    }
  }, []);
  
  // Save cache to localStorage when it changes
  const updateCache = useCallback((newCache: CachedMealSuggestion[]) => {
    suggestionCacheRef.current = newCache;
    try {
      localStorage.setItem('mealSuggestionCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }, []);
  
  // Add to cache
  const addToCache = useCallback((key: string, suggestions: MealSuggestion[]) => {
    const now = Date.now();
    const newCache = [...suggestionCacheRef.current];
    
    // Remove existing entry with the same key if it exists
    const existingIndex = newCache.findIndex(entry => entry.key === key);
    if (existingIndex >= 0) {
      newCache.splice(existingIndex, 1);
    }
    
    // Add new entry
    newCache.push({
      key,
      timestamp: now,
      suggestions
    });
    
    // Limit cache size to 20 entries
    if (newCache.length > 20) {
      newCache.sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp (oldest first)
      newCache.shift(); // Remove the oldest entry
    }
    
    updateCache(newCache);
  }, [updateCache]);
  
  // Check cache for matching suggestions
  const checkCache = useCallback((requestKey: string): MealSuggestion[] | null => {
    const cacheEntry = suggestionCacheRef.current.find(entry => entry.key === requestKey);
    
    if (!cacheEntry) {
      return null; // Not found in cache
    }
    
    // Check if entry is expired
    const now = Date.now();
    if (now - cacheEntry.timestamp > CACHE_EXPIRATION_TIME) {
      // Remove expired entry
      const newCache = suggestionCacheRef.current.filter(entry => entry.key !== requestKey);
      updateCache(newCache);
      return null;
    }
    
    return cacheEntry.suggestions;
  }, [updateCache]);
  
  // Fetch available foods for ingredient selection
  useEffect(() => {
    fetchAvailableFoods();
  }, []);

  const fetchAvailableFoods = async () => {
    try {
      const response = await fetch('/foods/');
      if (!response.ok) {
        throw new Error('Failed to fetch foods');
      }
      const data = await response.json();
      setAvailableFoods(data);
    } catch (err) {
      console.error('Error fetching foods:', err);
    }
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Modify the fetchSuggestions function to use cache
  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError("");
    setSuggestions([]);
    setCacheStatus("");
    
    try {
      const requestBody: MealSuggestionRequest = {
        user_id: userId,
        meal_type: mealType,
        time_of_day: getCurrentTime(),
        preference: preference,
        remaining_macros: remainingMacros,
        use_food_index_only: useFoodIndexOnly,
        specific_ingredients: selectedIngredients.length > 0 ? selectedIngredients : undefined,
        diet_type: dietType || undefined,
        cooking_time: cookingTime || undefined,
      };
      
      // Only add calorieRange if it's valid
      if (calorieRange && (calorieRange.min > 0 || calorieRange.max < 1500)) {
        requestBody.calorie_range = calorieRange;
      }
      
      // Generate cache key for this request
      const cacheKey = generateCacheKey(requestBody);
      
      // Check cache first if enabled
      if (useCache) {
        const cachedSuggestions = checkCache(cacheKey);
        if (cachedSuggestions) {
          setSuggestions(cachedSuggestions);
          setCacheStatus("Using cached suggestions");
          setIsLoading(false);
          return;
        }
      }
      
      console.log("Generating new meal suggestions...");
      
      const response = await fetch("/suggest-meal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error from server: ${response.status} - ${errorText}`);
      }
      
      const data: MealSuggestionResponse = await response.json();
      
      // Check if we got an error message in the first suggestion
      if (data.suggestions && 
          data.suggestions.length > 0 && 
          data.suggestions[0].name.includes("Error")) {
        throw new Error(data.suggestions[0].description || "Failed to generate meal suggestions");
      }
      
      setSuggestions(data.suggestions);
      
      // Save to cache
      addToCache(cacheKey, data.suggestions);
      setCacheStatus("New suggestions generated and cached");
    } catch (err) {
      console.error("Error fetching meal suggestions:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a function to clear the cache
  const clearCache = () => {
    updateCache([]);
    setCacheStatus("Cache cleared");
  };
  
  // Add a function to refresh suggestions (bypass cache)
  const refreshSuggestions = () => {
    setUseCache(false);
    fetchSuggestions();
    setUseCache(true); // Re-enable cache for future requests
  };

  // Function to log a suggested meal
  const logMeal = async (suggestion: MealSuggestion) => {
    setLoggingMeal(true);
    setSuccess("");
    
    try {
      // Create a food log entry from the suggestion
      const now = new Date().toISOString();
      
      // Extract any quantity from the serving info if possible
      const quantityMatch = suggestion.serving_info.match(/(\d+(\.\d+)?)/);
      const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1;
      
      const logEntry = {
        date: now,
        meal_type: mealType,
        food_id: "generated", // This will be a generated entry
        name: suggestion.name,
        amount: quantity, // Use quantity from serving info if available
        unit: "serving",
        // Append serving info to the name if it contains relevant information
        notes: `Serving info: ${suggestion.serving_info}`,
        calories: suggestion.macros.calories,
        proteins: suggestion.macros.protein,
        carbs: suggestion.macros.carbs,
        fats: suggestion.macros.fat,
        fiber: 0 // Default value
      };
      
      // Send the log entry to the API
      const response = await fetch('/logs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      // Show success message
      setSuccess(`"${suggestion.name}" has been added to your food log.`);
      
      // Call the callback if provided
      if (onMealLogged) {
        onMealLogged();
      }
    } catch (err) {
      console.error('Error logging meal:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoggingMeal(false);
    }
  };

  // Handler for toggling ingredient selection
  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient) 
        ? prev.filter(item => item !== ingredient)
        : [...prev, ingredient]
    );
  };

  // Open the meal info modal for a specific meal
  const showMealInfo = (meal: MealSuggestion) => {
    setSelectedMeal(meal);
    setShowModal(true);
  };

  // Handle calorie preset selection
  const handleCaloriePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCaloriePreset(value);
    
    if (value === "custom") {
      setShowCustomCalories(true);
    } else {
      setShowCustomCalories(false);
      const preset = calorieRangePresets.find(preset => preset.value === value);
      if (preset) {
        setCalorieRange({ min: preset.min, max: preset.max });
      }
    }
  };

  // Handle custom calorie range selection
  const handleCalorieRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    
    setCalorieRange(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  // Filter ingredients by search query
  const filteredIngredients = searchIngredientQuery.length > 0
    ? availableFoods.filter(food => 
        food.name.toLowerCase().includes(searchIngredientQuery.toLowerCase()))
    : availableFoods;

  // Calculate remaining calories and macros after logging a meal
  const calculateRemainingMacros = (meal: MealSuggestion) => {
    return {
      calories: Math.max(0, remainingMacros.calories - meal.macros.calories),
      protein: Math.max(0, remainingMacros.protein - meal.macros.protein),
      carbs: Math.max(0, remainingMacros.carbs - meal.macros.carbs),
      fat: Math.max(0, remainingMacros.fat - meal.macros.fat)
    };
  };

  // Initialize editing mode
  const startEditingIngredients = () => {
    if (!selectedMeal) return;
    
    // Create a deep copy of the meal to edit
    setEditedMeal(JSON.parse(JSON.stringify(selectedMeal)));
    setEditingIngredients(true);
    setShowEditingSuccessMessage(false);
    
    // Load available foods for adding new ingredients
    if (availableFoods.length === 0) {
      fetchAvailableFoods();
    }
    setAvailableIngredientsForEdit(availableFoods);
  };

  // Handle editing an ingredient amount - This is the number of servings the user consumes
  const handleIngredientAmountChange = (index: number, amount: number) => {
    if (!editedMeal) return;
    
    const updatedMeal = { ...editedMeal };
    const ingredient = updatedMeal.ingredients[index];
    
    // Store the original serving size and macros if not already stored
    if (!ingredient.baseServingSize) {
      ingredient.baseServingSize = ingredient.amount;
      if (ingredient.macros) {
        ingredient.baseMacros = {
          calories: ingredient.macros.calories,
          protein: ingredient.macros.protein,
          carbs: ingredient.macros.carbs,
          fat: ingredient.macros.fat
        };
      }
    }
    
    // Update the servings (amount consumed)
    ingredient.servings = amount;
    ingredient.amount = amount;  // Keep amount synced for backwards compatibility
    
    // Calculate scaling ratio based on original values
    if (ingredient.baseServingSize && ingredient.baseMacros) {
      const ratio = amount / ingredient.baseServingSize;
      
      // Create scaled macros based on the original values 
      ingredient.macros = {
        calories: Math.round(ingredient.baseMacros.calories * ratio),
        protein: parseFloat((ingredient.baseMacros.protein * ratio).toFixed(1)),
        carbs: parseFloat((ingredient.baseMacros.carbs * ratio).toFixed(1)),
        fat: parseFloat((ingredient.baseMacros.fat * ratio).toFixed(1))
      };
    }
    
    // Recalculate total meal macros
    updateMealMacros(updatedMeal);
    setEditedMeal(updatedMeal);
  };

  // Handle changing the unit for an ingredient
  const handleIngredientUnitChange = (index: number, newUnit: string) => {
    if (!editedMeal) return;
    
    const updatedMeal = { ...editedMeal };
    const ingredient = updatedMeal.ingredients[index];
    const oldUnit = ingredient.unit;
    
    // Don't do anything if unit didn't change
    if (oldUnit === newUnit) return;
    
    // Convert amount based on the unit change
    let newAmount = ingredient.amount;
    
    // If we have a conversion factor for this unit pair
    if (UNIT_CONVERSIONS[oldUnit] && UNIT_CONVERSIONS[oldUnit][newUnit]) {
      // Direct conversion
      newAmount = ingredient.amount * UNIT_CONVERSIONS[oldUnit][newUnit];
    } else if (UNIT_CONVERSIONS[oldUnit] && UNIT_CONVERSIONS[newUnit]) {
      // Indirect conversion via grams
      const amountInGrams = oldUnit === 'g' ? 
        ingredient.amount : 
        ingredient.amount * UNIT_CONVERSIONS[oldUnit]['g'];
        
      newAmount = newUnit === 'g' ? 
        amountInGrams : 
        amountInGrams * UNIT_CONVERSIONS['g'][newUnit];
    }
    
    // Update the ingredient with new unit and converted amount
    updatedMeal.ingredients[index].unit = newUnit;
    updatedMeal.ingredients[index].amount = parseFloat(newAmount.toFixed(1));
    
    // If the ingredient has macros, they remain the same since total ingredient quantity hasn't changed
    // No need to update macros for the entire meal since total nutritional content is the same
    
    setEditedMeal(updatedMeal);
  };

  // Handle removing an ingredient
  const removeIngredient = (index: number) => {
    if (!editedMeal) return;
    
    const updatedMeal = { ...editedMeal };
    updatedMeal.ingredients = updatedMeal.ingredients.filter((_, i) => i !== index);
    
    // Recalculate macros
    updateMealMacros(updatedMeal);
    setEditedMeal(updatedMeal);
  };

  // Handle adding a new ingredient
  const addIngredient = (food: FoodItem) => {
    if (!editedMeal) return;
    
    const newIngredient: IngredientWithMacros = {
      name: food.name,
      amount: food.serving_size,
      unit: food.serving_unit,
      in_food_index: true,
      macros: {
        calories: food.calories,
        protein: food.proteins,
        carbs: food.carbs,
        fat: food.fats
      }
    };
    
    const updatedMeal = { ...editedMeal };
    updatedMeal.ingredients.push(newIngredient);
    
    // Recalculate macros
    updateMealMacros(updatedMeal);
    setEditedMeal(updatedMeal);
    setShowAddIngredientPanel(false);
    setSearchEditIngredientQuery("");
  };

  // Update meal macros based on ingredients
  const updateMealMacros = (meal: MealSuggestion) => {
    // For an edited meal, we need to recalculate the macros
    // from the ingredient contributions
    const totalMacros = meal.ingredients.reduce((acc, ingredient) => {
      // If ingredient has macros, use them directly (they are already pre-calculated for the amount)
      if (ingredient.macros) {
        return {
          calories: acc.calories + ingredient.macros.calories,
          protein: acc.protein + ingredient.macros.protein,
          carbs: acc.carbs + ingredient.macros.carbs,
          fat: acc.fat + ingredient.macros.fat
        };
      }
      // Otherwise make a rough estimate
      return {
        calories: acc.calories + (ingredient.amount * 100), // Rough estimate of 100 cal per unit
        protein: acc.protein + (ingredient.amount * 5),     // 5g protein per unit
        carbs: acc.carbs + (ingredient.amount * 10),        // 10g carbs per unit
        fat: acc.fat + (ingredient.amount * 2)              // 2g fat per unit
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    // Round values for display
    meal.macros = {
      calories: Math.round(totalMacros.calories),
      protein: Math.round(totalMacros.protein),
      carbs: Math.round(totalMacros.carbs),
      fat: Math.round(totalMacros.fat)
    };
  };

  // Save the edited meal
  const saveEditedMeal = () => {
    if (!editedMeal) return;
    
    // Update the displayed meal with edited version
    setSuggestions(suggestions.map(meal => 
      meal.name === editedMeal.name ? editedMeal : meal
    ));
    
    // Update the selected meal to show the changes
    setSelectedMeal(editedMeal);
    setEditingIngredients(false);
    setEditedMeal(null);
    setShowEditingSuccessMessage(true);
    setTimeout(() => setShowEditingSuccessMessage(false), 3000);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingIngredients(false);
    setEditedMeal(null);
    setShowAddIngredientPanel(false);
  };

  // Filter ingredients when adding new ones
  const filteredEditIngredients = searchEditIngredientQuery.length > 0
    ? availableFoods.filter(food => 
        food.name.toLowerCase().includes(searchEditIngredientQuery.toLowerCase()))
    : availableFoods;

  return (
    <div className="meal-suggestions">
      <h3>Meal Suggestions</h3>
      
      <div className="suggestion-form">
        <div className="basic-options">
          <div className="form-row">
            <div className="form-group">
              <label>Meal Type:</label>
              <select 
                value={mealType} 
                onChange={(e) => setMealType(e.target.value)}
              >
                {mealTypes.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Preference:</label>
              <select 
                value={preference || ''} 
                onChange={(e) => setPreference(e.target.value || null)}
              >
                {preferenceTypes.map(type => (
                  <option key={type.label} value={type.value || ''}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={useFoodIndexOnly} 
                onChange={(e) => setUseFoodIndexOnly(e.target.checked)}
              />
              Use only my food items
            </label>
            <div className="checkbox-description">
              {useFoodIndexOnly 
                ? "Suggestions will only use foods from your database" 
                : "Suggestions can include any nutritious foods"}
            </div>
          </div>
          
          <button 
            className="toggle-filters-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
        </div>
        
        {showFilters && (
          <div className="advanced-filters">
            <h4>Advanced Filters</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Diet Type:</label>
                <select
                  value={dietType || ''}
                  onChange={(e) => setDietType(e.target.value || null)}
                >
                  {dietTypes.map(type => (
                    <option key={type.label} value={type.value || ''}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Cooking Time:</label>
                <select
                  value={cookingTime?.toString() || ''}
                  onChange={(e) => setCookingTime(e.target.value ? parseInt(e.target.value) : null)}
                >
                  {cookingTimeOptions.map(option => (
                    <option key={option.label} value={option.value?.toString() || ''}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Calorie Range:</label>
                <select
                  value={caloriePreset}
                  onChange={handleCaloriePresetChange}
                  className="calorie-preset-select"
                >
                  {calorieRangePresets.map(preset => (
                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                  ))}
                </select>
                
                {showCustomCalories && (
                  <div className="calorie-range-inputs">
                    <input
                      type="number"
                      name="min"
                      value={calorieRange.min}
                      onChange={handleCalorieRangeChange}
                      min="0"
                      max={calorieRange.max}
                      placeholder="Min"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      name="max"
                      value={calorieRange.max}
                      onChange={handleCalorieRangeChange}
                      min={calorieRange.min}
                      max="3000"
                      placeholder="Max"
                    />
                    <span>calories</span>
                  </div>
                )}
              </div>
            </div>
            
            {useFoodIndexOnly && (
              <div className="form-group ingredient-selector">
                <label>Main Ingredients:</label>
                <div className="ingredient-search">
                  <input
                    type="text"
                    placeholder="Search ingredients..."
                    value={searchIngredientQuery}
                    onChange={(e) => setSearchIngredientQuery(e.target.value)}
                    className="ingredient-search-input"
                  />
                </div>
                
                <div className="ingredients-list">
                  {filteredIngredients.length === 0 ? (
                    <p>No matching foods found in your database</p>
                  ) : (
                    <div className="ingredient-chips">
                      {filteredIngredients.slice(0, 20).map((food) => (
                        <div 
                          key={food._id} 
                          className={`ingredient-chip ${selectedIngredients.includes(food.name) ? 'selected' : ''}`}
                          onClick={() => toggleIngredient(food.name)}
                        >
                          {food.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedIngredients.length > 0 && (
                  <div className="selected-ingredients">
                    <div className="selected-ingredients-label">Selected ingredients:</div>
                    <div className="selected-chips">
                      {selectedIngredients.map(ingredient => (
                        <div key={ingredient} className="selected-chip">
                          <span>{ingredient}</span>
                          <button onClick={() => toggleIngredient(ingredient)} className="remove-ingredient">×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="suggestion-options">
          <div className="cache-controls">
            <label className="cache-toggle">
              <input 
                type="checkbox" 
                checked={useCache} 
                onChange={(e) => setUseCache(e.target.checked)} 
              />
              Use cached suggestions when available
            </label>
            {cacheStatus && <div className="cache-status">{cacheStatus}</div>}
            <div className="cache-buttons">
              <button 
                className="refresh-button" 
                onClick={refreshSuggestions}
                disabled={isLoading}
              >
                🔄 Fresh Suggestions
              </button>
              <button 
                className="clear-cache-button" 
                onClick={clearCache}
              >
                🗑️ Clear Cache
              </button>
            </div>
          </div>
        </div>
        
        <button 
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="suggestion-button"
        >
          {isLoading ? (
            <span className="loader-container">
              <span className="loader"></span>
              <span>Generating suggestions...</span>
            </span>
          ) : (
            'Get Meal Suggestions'
          )}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          <h4>Error</h4>
          <p>{error}</p>
          <div className="error-help">
            <p>Tips for getting successful meal suggestions:</p>
            <ul>
              <li>Try using fewer filters at once</li>
              <li>Make sure you have foods in your food index</li>
              <li>Select ingredients that are commonly paired together</li>
              <li>Use broader meal types like "dinner" instead of specific cuisines</li>
            </ul>
            <button className="try-again-button" onClick={() => setError("")}>Try Again</button>
          </div>
        </div>
      )}
      {success && <div className="success-message">{success}</div>}
      
      <div className="remaining-macros-display">
        <h4>Remaining Daily Macros</h4>
        <div className="remaining-macros-grid">
          <div className="remaining-macro-item">
            <span className="macro-value">{remainingMacros.calories}</span>
            <span className="macro-label">calories</span>
          </div>
          <div className="remaining-macro-item">
            <span className="macro-value">{remainingMacros.protein}g</span>
            <span className="macro-label">protein</span>
          </div>
          <div className="remaining-macro-item">
            <span className="macro-value">{remainingMacros.carbs}g</span>
            <span className="macro-label">carbs</span>
          </div>
          <div className="remaining-macro-item">
            <span className="macro-value">{remainingMacros.fat}g</span>
            <span className="macro-label">fat</span>
          </div>
        </div>
      </div>
      
      {suggestions.length > 0 && (
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-card">
              <h4>{suggestion.name}</h4>
              <p className="serving-info"><strong>Serving:</strong> {suggestion.serving_info}</p>
              <p className="description">{suggestion.description}</p>
              <div className="macros">
                <div className="macro-item">
                  <span className="macro-value">{suggestion.macros.calories}</span>
                  <span className="macro-label">cal</span>
                </div>
                <div className="macro-item">
                  <span className="macro-value">{suggestion.macros.protein}g</span>
                  <span className="macro-label">protein</span>
                </div>
                <div className="macro-item">
                  <span className="macro-value">{suggestion.macros.carbs}g</span>
                  <span className="macro-label">carbs</span>
                </div>
                <div className="macro-item">
                  <span className="macro-value">{suggestion.macros.fat}g</span>
                  <span className="macro-label">fat</span>
                </div>
              </div>
              <div className="ingredient-preview">
                <span className="ingredient-preview-label">Main ingredients: </span>
                <span className="ingredient-preview-text">
                  {suggestion.ingredients.slice(0, 3).map(ing => ing.name).join(', ')}
                  {suggestion.ingredients.length > 3 && '...'}
                </span>
              </div>
              <div className="cooking-time">
                <span className="cooking-time-icon">⏱️</span>
                <span className="cooking-time-text">{suggestion.cooking_time} min</span>
              </div>
              <div className="card-actions">
                <button 
                  className="log-button"
                  onClick={() => logMeal(suggestion)}
                  disabled={loggingMeal}
                >
                  {loggingMeal ? 'Logging...' : 'Log This Meal'}
                </button>
                <button 
                  className="info-button"
                  onClick={() => showMealInfo(suggestion)}
                >
                  More Info
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isLoading && suggestions.length === 0 && (
        <div className="no-suggestions">
          <p>No suggestions yet. Adjust your preferences and click "Get Meal Suggestions".</p>
        </div>
      )}
      
      {/* Meal Info Modal with editing capability */}
      {showModal && (selectedMeal || editedMeal) && (
        <div className="meal-info-modal-overlay">
          <div className="meal-info-modal modal-large">
            <div className="modal-header">
              <h3>{editingIngredients ? "Edit Ingredients: " : ""}{editedMeal?.name || selectedMeal?.name}</h3>
              <button className="close-button" onClick={() => {
                if (editingIngredients) {
                  // Confirm before closing if in edit mode
                  if (window.confirm("Discard your changes?")) {
                    cancelEditing();
                    setShowModal(false);
                  }
                } else {
                  setShowModal(false);
                }
              }}>×</button>
            </div>
            <div className="modal-content">
              {!editingIngredients ? (
                // Regular view mode
                <>
                  <div className="meal-info-section">
                    <h4>Overview</h4>
                    <p><strong>Serving Size:</strong> {selectedMeal?.serving_info}</p>
                    <p><strong>Cooking Time:</strong> {selectedMeal?.cooking_time} minutes</p>
                    <p>{selectedMeal?.description}</p>
                  </div>
                  
                  <div className="meal-info-section">
                    <h4>Nutritional Information</h4>
                    <div className="macros-table">
                      <div><strong>Calories:</strong> {selectedMeal?.macros.calories}</div>
                      <div><strong>Protein:</strong> {selectedMeal?.macros.protein}g</div>
                      <div><strong>Carbs:</strong> {selectedMeal?.macros.carbs}g</div>
                      <div><strong>Fat:</strong> {selectedMeal?.macros.fat}g</div>
                    </div>
                    
                    <div className="remaining-macros">
                      <h5>Remaining After Logging:</h5>
                      <div className="macros-table remaining">
                        {selectedMeal && Object.entries(calculateRemainingMacros(selectedMeal)).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {Math.round(value)}{key === 'calories' ? '' : 'g'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="meal-info-section">
                    <div className="ingredients-header">
                      <h4>Ingredients</h4>
                      <button 
                        className="edit-ingredients-button"
                        onClick={startEditingIngredients}
                        aria-label="Edit ingredients"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                    
                    <div className="ingredients-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Ingredient</th>
                            <th>Servings</th>
                            <th>In Your Food Index</th>
                            <th>Calories</th>
                            <th>Protein</th>
                            <th>Carbs</th>
                            <th>Fat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMeal?.ingredients.map((ingredient, idx) => (
                            <tr key={idx}>
                              <td>{ingredient.name}</td>
                              <td>
                                <input
                                  type="number"
                                  value={ingredient.amount}
                                  onChange={(e) => handleIngredientAmountChange(idx, parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.1"
                                  className="ingredient-amount-input"
                                />
                                <select 
                                  value={ingredient.unit}
                                  onChange={(e) => handleIngredientUnitChange(idx, e.target.value)}
                                  className="ingredient-unit-select"
                                >
                                  <option value={ingredient.unit}>{ingredient.unit}</option>
                                  {UNIT_OPTIONS.filter(unit => unit !== ingredient.unit).map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                {ingredient.in_food_index ? (
                                  <span className="available">✓</span>
                                ) : (
                                  <span className="not-available">✗</span>
                                )}
                              </td>
                              <td>{ingredient.macros?.calories || 0}</td>
                              <td>{(ingredient.macros?.protein || 0) + 'g'}</td>
                              <td>{(ingredient.macros?.carbs || 0) + 'g'}</td>
                              <td>{(ingredient.macros?.fat || 0) + 'g'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="meal-info-section">
                    <h4>Preparation Instructions</h4>
                    <ol className="instructions-list">
                      {selectedMeal?.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </>
              ) : (
                // Edit mode
                <>
                  <div className="meal-info-section">
                    <div className="macros-table">
                      <h4>Updated Nutritional Information</h4>
                      <div><strong>Calories:</strong> {editedMeal?.macros.calories}</div>
                      <div><strong>Protein:</strong> {editedMeal?.macros.protein}g</div>
                      <div><strong>Carbs:</strong> {editedMeal?.macros.carbs}g</div>
                      <div><strong>Fat:</strong> {editedMeal?.macros.fat}g</div>
                    </div>
                  </div>
                  
                  <div className="meal-info-section">
                    <div className="edit-ingredients-header">
                      <h4>Edit Ingredients</h4>
                      <button 
                        className="add-ingredient-button"
                        onClick={() => setShowAddIngredientPanel(!showAddIngredientPanel)}
                      >
                        {showAddIngredientPanel ? "Cancel" : "+ Add Ingredient"}
                      </button>
                    </div>
                    
                    {showAddIngredientPanel && (
                      <div className="add-ingredient-panel">
                        <h5>Add a new ingredient</h5>
                        <input
                          type="text"
                          placeholder="Search for ingredient..."
                          value={searchEditIngredientQuery}
                          onChange={(e) => setSearchEditIngredientQuery(e.target.value)}
                          className="ingredient-search-input"
                        />
                        <div className="add-ingredient-list">
                          {filteredEditIngredients.slice(0, 10).map(food => (
                            <div 
                              key={food._id} 
                              className="add-ingredient-item"
                              onClick={() => addIngredient(food)}
                            >
                              <span>{food.name}</span>
                              <span className="add-ingredient-macros">
                                {food.calories} cal | {food.proteins}p | {food.carbs}c | {food.fats}f
                              </span>
                            </div>
                          ))}
                          {filteredEditIngredients.length === 0 && (
                            <div className="no-ingredients-found">No matching ingredients found</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="edit-ingredients-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Ingredient</th>
                            <th>Servings</th>
                            <th>Calories</th>
                            <th>Protein</th>
                            <th>Carbs</th>
                            <th>Fat</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {editedMeal?.ingredients.map((ingredient, idx) => (
                            <tr key={idx}>
                              <td>{ingredient.name}</td>
                              <td>
                                <input
                                  type="number"
                                  value={ingredient.amount}
                                  onChange={(e) => handleIngredientAmountChange(idx, parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.1"
                                  className="ingredient-amount-input"
                                />
                                <select 
                                  value={ingredient.unit}
                                  onChange={(e) => handleIngredientUnitChange(idx, e.target.value)}
                                  className="ingredient-unit-select"
                                >
                                  <option value={ingredient.unit}>{ingredient.unit}</option>
                                  {UNIT_OPTIONS.filter(unit => unit !== ingredient.unit).map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                  ))}
                                </select>
                              </td>
                              <td>{ingredient.macros?.calories || 0}</td>
                              <td>{(ingredient.macros?.protein || 0) + 'g'}</td>
                              <td>{(ingredient.macros?.carbs || 0) + 'g'}</td>
                              <td>{(ingredient.macros?.fat || 0) + 'g'}</td>
                              <td>
                                <button
                                  className="remove-ingredient-button"
                                  onClick={() => removeIngredient(idx)}
                                  aria-label="Remove ingredient"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {editingIngredients ? (
                <>
                  <button className="save-button" onClick={saveEditedMeal}>
                    Save Changes
                  </button>
                  <button className="cancel-button" onClick={cancelEditing}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="log-button" onClick={() => {
                    logMeal(selectedMeal!);
                    setShowModal(false);
                  }}>
                    Log This Meal
                  </button>
                  <button className="close-button" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {showEditingSuccessMessage && (
        <div className="edit-success-message">
          Changes saved! Nutritional values have been updated based on your servings.
        </div>
      )}
    </div>
  );
};

export default MealSuggestions; 