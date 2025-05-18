export interface FoodItem {
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

export interface FoodLogEntry {
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

export interface NutritionTarget {
  name: string;
  daily_calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface Goal {
  _id?: string;
  type: string;
  weight_target: {
    current: number;
    goal: number;
    weekly_rate: number;
  };
  nutrition_targets: NutritionTarget[];
  daily_calories?: number;
  daily_proteins?: number;
  daily_carbs?: number;
  daily_fats?: number;
  target_weight?: number;
  current_weight?: number;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
  goal?: Goal;
} 