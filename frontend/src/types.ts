// Type definitions for the application

export interface User {
  uid: string
  email: string
  name: string
  preferences: {
    units: string
    theme: string
    timezone: string
  }
}

export interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  water?: {
    current: number
    target: number
    percentage: number
  }
}

export interface DietaryAttributes {
  dietary_restrictions: string[]  // ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'halal', 'kosher']
  allergens: string[]            // ['nuts', 'dairy', 'eggs', 'soy', 'shellfish', 'fish', 'wheat', 'sesame']
  food_categories: string[]      // ['fruit', 'vegetable', 'meat', 'dairy', 'grain', 'legume', 'processed']
}

export interface FoodItem {
  id: string
  name: string
  brand?: string  // Added brand field
  serving_size: number
  serving_unit: string
  nutrition: NutritionInfo
  source: string
  barcode?: string
  dietary_attributes?: DietaryAttributes
}

export interface FoodLogEntry {
  id: string
  date: string
  meal_type: string
  food_id: string
  food_name: string
  brand?: string  // Added brand field
  amount: number
  unit: string
  nutrition: NutritionInfo
  notes: string
  logged_at: string
}

export interface DailyNutritionSummary {
  date: string
  total_nutrition: NutritionInfo
  meals: FoodLogEntry[]
  meal_breakdown: Record<string, NutritionInfo>
  goal_progress?: {
    target_calories: number
    target_protein: number
    target_carbs: number
    target_fat: number
    progress_calories: number
    progress_protein: number
    progress_carbs: number
    progress_fat: number
  }
}

export interface Goal {
  id: string
  title: string
  goal_type: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain'
  start_date: string
  end_date?: string
  active: boolean
  weight_target?: {
    current_weight: number
    target_weight: number
    weekly_rate: number
  }
  nutrition_targets: NutritionInfo
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface MealSuggestion {
  name: string
  description: string
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    in_food_index?: boolean
  }>
  instructions: string[]
  prep_time?: number
  cooking_time?: number
  difficulty_level?: 'Easy' | 'Medium' | 'Hard'
  nutrition: Record<string, number>
}

export interface MealPlan {
  id: string
  name: string
  description: string
  active: boolean
  created_at: string
  meals: {
    breakfast: MealSuggestion[]
    lunch: MealSuggestion[]
    dinner: MealSuggestion[]
    snack: MealSuggestion[]
  }
  version: number
  is_current: boolean
}

export interface ShoppingList {
  id?: string
  shopping_list_id?: string
  user_id?: string
  meal_plan_id?: string
  items: Array<{
    item_id?: string
    name: string
    amount: number
    unit: string
    estimated_price?: number
    store_package_size?: string
    store_package_price?: number
    category?: string
    used_in_meals?: string[]
    is_checked?: boolean
    food_id?: string
    notes?: string
    in_food_index?: boolean
    nutrition?: {
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
      fiber?: number
      sugar?: number
      sodium?: number
    }
  }>
  total_estimated_cost?: number
  generated_at?: string
  updated_at?: string
  store_location?: string
  notes?: string
}

export interface UserPreferences {
  dietary_restrictions: string[]
  allergies: string[]
  cuisine_preferences: string[]
  disliked_foods: string[]
  units: 'metric' | 'imperial'
  theme: 'light' | 'dark'
  timezone: string
}

export interface WeightLogEntry {
  id: string
  date: string
  weight: number // in kg (backend storage)
  notes?: string
  logged_at: string
}
