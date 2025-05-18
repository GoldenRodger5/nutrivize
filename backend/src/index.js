import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PREFERRED_PORT = process.env.PORT || 8000;
const PORT_RANGE = [8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007, 8008, 8009];

// Function to find an available port
const findAvailablePort = async (portRange, preferredPort) => {
  // Try the preferred port first
  try {
    await checkPort(preferredPort);
    return preferredPort;
  } catch (err) {
    console.log(`Preferred port ${preferredPort} is in use, trying alternatives...`);
  }

  // Try ports in the range
  for (const port of portRange) {
    try {
      await checkPort(port);
      return port;
    } catch (err) {
      console.log(`Port ${port} is in use, trying next...`);
    }
  }
  
  throw new Error('No available ports found in the range');
};

// Function to check if a port is available
const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is in use`));
      } else {
        reject(err);
      }
      server.close();
    });
    
    server.once('listening', () => {
      server.close();
      resolve(port);
    });
    
    server.listen(port);
  });
};

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 
           'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5175', 'http://127.0.0.1:5175',
           'http://localhost:5176', 'http://127.0.0.1:5176', 'http://localhost:5177', 'http://127.0.0.1:5177',
           'http://localhost:5178', 'http://127.0.0.1:5178', 'http://localhost:5179', 'http://127.0.0.1:5179'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS preflight requests
app.options('*', cors());

app.use(express.json());

// Authentication middleware
const auth = (req, res, next) => {
  console.log('Auth middleware called');
  
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided in request');
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }
  
  // Extract the token
  const token = authHeader.split(' ')[1];
  
  try {
    // For development purposes, we'll provide minimal token validation
    // In a real production app, you would verify the token with JWT or Firebase Admin SDK
    if (token) {
      // In a real application, we'd decode the token and extract user info
      // For now, extract a user ID from the query or use a default
      req.user = {
        id: req.query.userId || 'user-id-from-token',
        email: req.query.email || 'user@example.com'
      };
      next();
    } else {
      return res.status(401).json({ message: 'Invalid token, authorization denied' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Invalid token, authorization denied' });
  }
};

// Mock data storage
let mealPlans = [];
let activeMealPlans = {};
const USER_ID = 'isaac_mineo';

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Nutrivize API' });
});

// Meal Plans API
app.post('/generate-meal-plan', (req, res) => {
  try {
    const { user_id, name, days, meal_types, daily_targets } = req.body;
    
    // Create a mock meal plan
    const mealPlan = createMockMealPlan(user_id, name, days, meal_types, daily_targets);
    
    // Save to our mock database
    mealPlans.push(mealPlan);
    
    // Set as active plan for this user
    activeMealPlans[user_id] = mealPlan;
    
    res.status(201).json(mealPlan);
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

app.get('/meal-plans', (req, res) => {
  res.json(mealPlans);
});

app.get('/meal-plans/active', (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  const activePlan = activeMealPlans[user_id];
  
  if (!activePlan) {
    return res.status(404).json({ message: 'No active meal plan found' });
  }
  
  res.json(activePlan);
});

app.post('/meal-plans/:id/log-meal', (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, day_index, meal_type } = req.query;
    
    // Find the meal plan
    const mealPlan = mealPlans.find(plan => plan.id === id);
    
    if (!mealPlan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }
    
    // Update the meal's logged status
    if (mealPlan.days[day_index] && mealPlan.days[day_index].meals[meal_type]) {
      mealPlan.days[day_index].meals[meal_type].is_logged = true;
      
      // Check if all meals for the day are logged
      const allMealsLogged = Object.values(mealPlan.days[day_index].meals)
        .every(meal => meal.is_logged);
      
      if (allMealsLogged) {
        mealPlan.days[day_index].is_complete = true;
      }
      
      res.json({ 
        success: true, 
        message: `${meal_type} logged successfully for day ${parseInt(day_index) + 1}` 
      });
    } else {
      res.status(404).json({ 
        message: `Meal ${meal_type} not found for day ${parseInt(day_index) + 1}` 
      });
    }
  } catch (error) {
    console.error('Error logging meal:', error);
    res.status(500).json({ error: 'Failed to log meal' });
  }
});

// Mock function to create a meal plan
function createMockMealPlan(userId, name, numDays, mealTypes, dailyTargets) {
  const plan = {
    id: `mp-${Date.now()}`,
    user_id: userId,
    name: name || 'Weekly Meal Plan',
    created_at: new Date().toISOString(),
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + (numDays - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days: [],
    plan_totals: {
      calories: dailyTargets.calories * numDays,
      protein: dailyTargets.protein * numDays,
      carbs: dailyTargets.carbs * numDays,
      fat: dailyTargets.fat * numDays
    },
    grocery_list: []
  };
  
  // Generate days
  for (let i = 0; i < numDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const day = {
      date: date.toISOString().split('T')[0],
      meals: {},
      daily_totals: {
        calories: dailyTargets.calories,
        protein: dailyTargets.protein,
        carbs: dailyTargets.carbs,
        fat: dailyTargets.fat
      },
      is_complete: false
    };
    
    // Generate meals for each meal type
    for (const mealType of mealTypes) {
      // Calculate macro distribution based on meal type
      let macroDistribution = 0.33; // default distribution
      if (mealType === 'breakfast') macroDistribution = 0.25;
      if (mealType === 'lunch') macroDistribution = 0.35;
      if (mealType === 'dinner') macroDistribution = 0.4;
      if (mealType === 'snack') macroDistribution = 0.1;
      
      day.meals[mealType] = generateMockMeal(
        mealType, 
        i + 1, 
        {
          calories: dailyTargets.calories * macroDistribution,
          protein: dailyTargets.protein * macroDistribution,
          carbs: dailyTargets.carbs * macroDistribution,
          fat: dailyTargets.fat * macroDistribution
        }
      );
    }
    
    plan.days.push(day);
  }
  
  // Generate grocery list
  plan.grocery_list = generateMockGroceryList(plan.days);
  
  return plan;
}

// Generate a mock meal
function generateMockMeal(mealType, day, macros) {
  const mealNames = {
    breakfast: ['Protein Oatmeal', 'Greek Yogurt Parfait', 'Veggie Omelette', 'Avocado Toast'],
    lunch: ['Chicken Salad', 'Quinoa Bowl', 'Turkey Wrap', 'Bean Soup'],
    dinner: ['Salmon with Roasted Vegetables', 'Beef Stir Fry', 'Veggie Pasta', 'Chicken Curry'],
    snack: ['Protein Shake', 'Apple with Almond Butter', 'Greek Yogurt', 'Protein Bar']
  };
  
  const randomIndex = Math.floor(Math.random() * mealNames[mealType].length);
  const name = mealNames[mealType][randomIndex];
  
  return {
    name,
    macros: {
      calories: Math.round(macros.calories),
      protein: Math.round(macros.protein),
      carbs: Math.round(macros.carbs),
      fat: Math.round(macros.fat)
    },
    description: `Delicious ${name.toLowerCase()} with balanced nutrition.`,
    serving_info: 'Serves 1',
    ingredients: generateMockIngredients(mealType),
    instructions: generateMockInstructions(),
    cooking_time: Math.floor(Math.random() * 30) + 10,
    meal_type: mealType,
    is_logged: false,
    day,
    is_leftover: false
  };
}

// Generate mock ingredients
function generateMockIngredients(mealType) {
  const ingredientsMap = {
    breakfast: [
      { name: 'Oats', amount: 50, unit: 'g', in_food_index: true },
      { name: 'Protein Powder', amount: 30, unit: 'g', in_food_index: true },
      { name: 'Banana', amount: 1, unit: 'medium', in_food_index: true },
      { name: 'Eggs', amount: 2, unit: 'large', in_food_index: true },
      { name: 'Spinach', amount: 30, unit: 'g', in_food_index: true }
    ],
    lunch: [
      { name: 'Chicken Breast', amount: 120, unit: 'g', in_food_index: true },
      { name: 'Quinoa', amount: 80, unit: 'g', in_food_index: true },
      { name: 'Mixed Vegetables', amount: 100, unit: 'g', in_food_index: true },
      { name: 'Olive Oil', amount: 10, unit: 'ml', in_food_index: true },
      { name: 'Lemon', amount: 0.5, unit: 'medium', in_food_index: false }
    ],
    dinner: [
      { name: 'Salmon Fillet', amount: 150, unit: 'g', in_food_index: true },
      { name: 'Brown Rice', amount: 80, unit: 'g', in_food_index: true },
      { name: 'Broccoli', amount: 100, unit: 'g', in_food_index: true },
      { name: 'Sweet Potato', amount: 120, unit: 'g', in_food_index: true },
      { name: 'Garlic', amount: 2, unit: 'cloves', in_food_index: false }
    ],
    snack: [
      { name: 'Protein Powder', amount: 30, unit: 'g', in_food_index: true },
      { name: 'Almond Milk', amount: 250, unit: 'ml', in_food_index: true },
      { name: 'Apple', amount: 1, unit: 'medium', in_food_index: true },
      { name: 'Almond Butter', amount: 15, unit: 'g', in_food_index: true }
    ]
  };
  
  return ingredientsMap[mealType] || ingredientsMap.snack;
}

// Generate mock instructions
function generateMockInstructions() {
  return [
    'Prepare all ingredients.',
    'Cook main ingredients over medium heat.',
    'Combine and mix all ingredients together.',
    'Season to taste.',
    'Serve hot and enjoy!'
  ];
}

// Generate mock grocery list
function generateMockGroceryList(days) {
  const groceryItems = [];
  
  // Collect all ingredients from all meals
  days.forEach(day => {
    Object.values(day.meals).forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        // Check if item already exists in the list
        const existingItem = groceryItems.find(item => 
          item.item.toLowerCase() === ingredient.name.toLowerCase() && 
          item.unit === ingredient.unit);
        
        if (existingItem) {
          existingItem.amount += ingredient.amount;
        } else {
          groceryItems.push({
            item: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            estimated_cost: Math.round((Math.random() * 5 + 1) * 100) / 100,
            category: getIngredientCategory(ingredient.name),
            in_food_index: ingredient.in_food_index
          });
        }
      });
    });
  });
  
  return groceryItems;
}

// Helper to categorize grocery items
function getIngredientCategory(name) {
  const nameLower = name.toLowerCase();
  
  if (/chicken|beef|pork|meat|turkey/.test(nameLower)) return 'meat';
  if (/salmon|fish|tuna|shrimp/.test(nameLower)) return 'seafood';
  if (/spinach|lettuce|broccoli|carrot|vegetable/.test(nameLower)) return 'produce';
  if (/apple|banana|fruit|berry|orange/.test(nameLower)) return 'fruits';
  if (/milk|yogurt|cheese|cream/.test(nameLower)) return 'dairy';
  if (/bread|bun|roll|bagel/.test(nameLower)) return 'bakery';
  if (/rice|pasta|quinoa|oats|flour/.test(nameLower)) return 'grains';
  if (/oil|butter|ghee/.test(nameLower)) return 'oils';
  if (/protein powder|supplement/.test(nameLower)) return 'supplements';
  if (/spice|salt|pepper|herb/.test(nameLower)) return 'spices';
  
  return 'other';
}

// Food Log mock endpoints
app.get('/foods', (req, res) => {
  res.json([
    {
      _id: 'f1',
      name: 'Chicken Breast',
      serving_size: 100,
      serving_unit: 'g',
      calories: 165,
      proteins: 31,
      carbs: 0,
      fats: 3.6,
      fiber: 0
    },
    {
      _id: 'f2',
      name: 'Brown Rice',
      serving_size: 100,
      serving_unit: 'g',
      calories: 112,
      proteins: 2.6,
      carbs: 24,
      fats: 0.9,
      fiber: 1.8
    }
  ]);
});

// Handle logs endpoints
app.get('/logs', (req, res) => {
  // Check for date parameter to filter logs
  const { date } = req.query;
  
  // Return a mock response with empty logs array
  res.json({ 
    success: true,
    logs: [],
    date: date || new Date().toISOString().split('T')[0]
  });
});

// Handle date range for logs
app.get('/logs/range', (req, res) => {
  const { start_date, end_date } = req.query;
  
  // Return mock date range response
  res.json({
    success: true,
    date_range: [
      // Generate array of dates in range with empty log counts
      ...Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        return {
          date: date.toISOString().split('T')[0],
          log_count: 0
        };
      })
    ]
  });
});

// Create a mock meal plan endpoint
app.get('/meal-plans', (req, res) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 6);

  res.json([
    {
      id: `mp-${Date.now()}`,
      user_id: 'isaac_mineo',
      name: 'Weekly Meal Plan',
      created_at: new Date().toISOString(),
      is_active: true,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      days: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString().split('T')[0],
          meals: {
            breakfast: {
              name: 'Oatmeal with Berries',
              macros: {
                calories: 300,
                protein: 15,
                carbs: 45,
                fat: 8
              },
              description: 'Hearty oatmeal with fresh berries',
              serving_info: 'Serves 1',
              ingredients: [
                { name: 'Oats', amount: 50, unit: 'g', in_food_index: true },
                { name: 'Berries', amount: 100, unit: 'g', in_food_index: true }
              ],
              instructions: [
                'Cook oats with water',
                'Add berries on top'
              ],
              cooking_time: 10,
              meal_type: 'breakfast',
              is_logged: false,
              day: i + 1
            },
            lunch: {
              name: 'Chicken Salad',
              macros: {
                calories: 450,
                protein: 35,
                carbs: 25,
                fat: 20
              },
              description: 'Healthy chicken salad with mixed greens',
              serving_info: 'Serves 1',
              ingredients: [
                { name: 'Chicken Breast', amount: 120, unit: 'g', in_food_index: true },
                { name: 'Mixed Greens', amount: 100, unit: 'g', in_food_index: true }
              ],
              instructions: [
                'Cook chicken',
                'Mix with salad'
              ],
              cooking_time: 20,
              meal_type: 'lunch',
              is_logged: false,
              day: i + 1
            },
            dinner: {
              name: 'Salmon with Rice',
              macros: {
                calories: 550,
                protein: 30,
                carbs: 45,
                fat: 25
              },
              description: 'Grilled salmon with brown rice',
              serving_info: 'Serves 1',
              ingredients: [
                { name: 'Salmon', amount: 150, unit: 'g', in_food_index: true },
                { name: 'Brown Rice', amount: 100, unit: 'g', in_food_index: true }
              ],
              instructions: [
                'Grill salmon',
                'Serve with cooked brown rice'
              ],
              cooking_time: 25,
              meal_type: 'dinner',
              is_logged: false,
              day: i + 1
            }
          },
          daily_totals: {
            calories: 1300,
            protein: 80,
            carbs: 115,
            fat: 53
          },
          is_complete: false
        };
      }),
      plan_totals: {
        calories: 9100,
        protein: 560,
        carbs: 805,
        fat: 371
      },
      grocery_list: [
        {
          item: 'Oats',
          amount: 350,
          unit: 'g',
          estimated_cost: 2.50,
          category: 'grains',
          in_food_index: true
        },
        {
          item: 'Berries',
          amount: 700,
          unit: 'g',
          estimated_cost: 5.99,
          category: 'fruits',
          in_food_index: true
        },
        {
          item: 'Chicken Breast',
          amount: 840,
          unit: 'g',
          estimated_cost: 7.99,
          category: 'meat',
          in_food_index: true
        },
        {
          item: 'Mixed Greens',
          amount: 700,
          unit: 'g',
          estimated_cost: 3.50,
          category: 'produce',
          in_food_index: true
        },
        {
          item: 'Salmon',
          amount: 1050,
          unit: 'g',
          estimated_cost: 15.99,
          category: 'seafood',
          in_food_index: true
        },
        {
          item: 'Brown Rice',
          amount: 700,
          unit: 'g',
          estimated_cost: 2.99,
          category: 'grains',
          in_food_index: true
        }
      ]
    }
  ]);
});

// Active meal plan endpoint
app.get('/meal-plans/active', (req, res) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ 
      success: false,
      message: 'User ID is required' 
    });
  }
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 6);

  res.json({
    id: `mp-${Date.now()}`,
    user_id,
    name: 'Weekly Meal Plan',
    created_at: new Date().toISOString(),
    is_active: true,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    days: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        meals: {
          breakfast: {
            name: 'Oatmeal with Berries',
            macros: {
              calories: 300,
              protein: 15,
              carbs: 45,
              fat: 8
            },
            description: 'Hearty oatmeal with fresh berries',
            serving_info: 'Serves 1',
            ingredients: [
              { name: 'Oats', amount: 50, unit: 'g', in_food_index: true },
              { name: 'Berries', amount: 100, unit: 'g', in_food_index: true }
            ],
            instructions: [
              'Cook oats with water',
              'Add berries on top'
            ],
            cooking_time: 10,
            meal_type: 'breakfast',
            is_logged: false,
            day: i + 1
          },
          lunch: {
            name: 'Chicken Salad',
            macros: {
              calories: 450,
              protein: 35,
              carbs: 25,
              fat: 20
            },
            description: 'Healthy chicken salad with mixed greens',
            serving_info: 'Serves 1',
            ingredients: [
              { name: 'Chicken Breast', amount: 120, unit: 'g', in_food_index: true },
              { name: 'Mixed Greens', amount: 100, unit: 'g', in_food_index: true }
            ],
            instructions: [
              'Cook chicken',
              'Mix with salad'
            ],
            cooking_time: 20,
            meal_type: 'lunch',
            is_logged: false,
            day: i + 1
          },
          dinner: {
            name: 'Salmon with Rice',
            macros: {
              calories: 550,
              protein: 30,
              carbs: 45,
              fat: 25
            },
            description: 'Grilled salmon with brown rice',
            serving_info: 'Serves 1',
            ingredients: [
              { name: 'Salmon', amount: 150, unit: 'g', in_food_index: true },
              { name: 'Brown Rice', amount: 100, unit: 'g', in_food_index: true }
            ],
            instructions: [
              'Grill salmon',
              'Serve with cooked brown rice'
            ],
            cooking_time: 25,
            meal_type: 'dinner',
            is_logged: false,
            day: i + 1
          }
        },
        daily_totals: {
          calories: 1300,
          protein: 80,
          carbs: 115,
          fat: 53
        },
        is_complete: false
      };
    }),
    plan_totals: {
      calories: 9100,
      protein: 560,
      carbs: 805,
      fat: 371
    },
    grocery_list: [
      {
        item: 'Oats',
        amount: 350,
        unit: 'g',
        estimated_cost: 2.50,
        category: 'grains',
        in_food_index: true
      },
      {
        item: 'Berries',
        amount: 700,
        unit: 'g',
        estimated_cost: 5.99,
        category: 'fruits',
        in_food_index: true
      },
      {
        item: 'Chicken Breast',
        amount: 840,
        unit: 'g',
        estimated_cost: 7.99,
        category: 'meat',
        in_food_index: true
      },
      {
        item: 'Mixed Greens',
        amount: 700,
        unit: 'g',
        estimated_cost: 3.50,
        category: 'produce',
        in_food_index: true
      },
      {
        item: 'Salmon',
        amount: 1050,
        unit: 'g',
        estimated_cost: 15.99,
        category: 'seafood',
        in_food_index: true
      },
      {
        item: 'Brown Rice',
        amount: 700,
        unit: 'g',
        estimated_cost: 2.99,
        category: 'grains',
        in_food_index: true
      }
    ]
  });
});

// Nutrition trends endpoint
app.get('/nutrition/aggregates', (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;
    
    if (!user_id || !start_date || !end_date) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required parameters: user_id, start_date, and end_date are required' 
      });
    }
    
    // Generate mock data
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const data = [];
    const currentDate = new Date(start);
    
    for (let i = 0; i < days; i++) {
      // Generate random but realistic nutrition data
      const calories = 1800 + Math.floor(Math.random() * 500);
      const protein = 80 + Math.floor(Math.random() * 40);
      const carbs = 180 + Math.floor(Math.random() * 70);
      const fat = 60 + Math.floor(Math.random() * 30);
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        fiber: Math.floor(carbs * 0.15),
        completed_meals: Math.floor(Math.random() * 4) + 1,
        water_intake: Math.floor(Math.random() * 8) + 2,
        activity_level: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate averages for summary
    const avgCalories = Math.floor(data.reduce((sum, day) => sum + day.calories, 0) / data.length);
    const avgProtein = Math.floor(data.reduce((sum, day) => sum + day.protein, 0) / data.length);
    const avgCarbs = Math.floor(data.reduce((sum, day) => sum + day.carbs, 0) / data.length);
    const avgFat = Math.floor(data.reduce((sum, day) => sum + day.fat, 0) / data.length);
    const avgFiber = Math.floor(data.reduce((sum, day) => sum + day.fiber, 0) / data.length);
    
    res.json({
      success: true,
      data: data,
      summary: {
        average_calories: avgCalories,
        average_protein: avgProtein,
        average_carbs: avgCarbs,
        average_fat: avgFat,
        average_fiber: avgFiber,
        total_days: days
      }
    });
  } catch (error) {
    console.error('Error generating nutrition data:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate nutrition data',
      message: error.message
    });
  }
});

// Goals endpoint
app.get('/goals/active', (req, res) => {
  console.log('GET /goals/active requested');
  res.json({
    _id: 'g1',
    type: 'weight loss',
    weight_target: {
      current: 75,
      goal: 70,
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
});

// Weight tracking endpoints
app.get('/weights', (req, res) => {
  console.log('GET /weights requested with query:', req.query);
  
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  // Return mock weight entries
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 30); // 30 days ago
  
  const weightEntries = [];
  for (let i = 0; i < 10; i++) {
    const entryDate = new Date(startDate);
    entryDate.setDate(startDate.getDate() + (i * 3)); // Every 3 days
    
    // Generate weight data slightly trending down
    const weight = 75 - (i * 0.2) + (Math.random() * 0.4 - 0.2);
    
    weightEntries.push({
      date: entryDate.toISOString().split('T')[0],
      weight: parseFloat(weight.toFixed(1))
    });
  }
  
  res.json(weightEntries);
});

app.post('/weights', (req, res) => {
  console.log('POST /weights requested with body:', req.body);
  
  const { userId, date, weight } = req.body;
  
  if (!userId || !date || !weight) {
    return res.status(400).json({ message: 'User ID, date, and weight are required' });
  }
  
  // In a real app, we'd save this to a database
  res.status(201).json({
    id: `weight-${Date.now()}`,
    userId,
    date,
    weight
  });
});

// User profile endpoints
app.get('/user/profile', auth, (req, res) => {
  console.log('GET /user/profile requested');
  // Return 404 if first time, otherwise return mock profile
  res.status(404).json({ msg: 'Profile not found' });
});

app.post('/user/profile', auth, (req, res) => {
  console.log('POST /user/profile requested with body:', req.body);
  // Mock create user profile
  res.status(201).json({
    id: 'mock-profile-1',
    userId: req.user.id,
    ...req.body,
    setupCompleted: true,
    date: new Date().toISOString()
  });
});

// Create the port.txt file directory if it doesn't exist
const portFilePath = path.join(__dirname, '..', 'port.txt');

// Add nutrition endpoints for trends
app.get('/api/nutrition/aggregates', (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.query;
    
    if (!user_id || !start_date || !end_date) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required parameters: user_id, start_date, and end_date are required' 
      });
    }
    
    // Generate mock nutritional trend data
    const trendData = generateMockNutritionTrends(start_date, end_date);
    
    res.json(trendData);
  } catch (error) {
    console.error('Error generating nutrition aggregates:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate nutrition aggregates',
      message: error.message 
    });
  }
});

// Function to generate mock nutrition trend data
function generateMockNutritionTrends(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data = [];
  
  // Generate data for each day in the range
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Generate random data with some variance but generally consistent
    const baseCalories = 1800 + Math.floor(Math.random() * 600); // 1800-2400 calories
    const baseProtein = 100 + Math.floor(Math.random() * 50);    // 100-150g protein
    const baseCarbs = 180 + Math.floor(Math.random() * 70);      // 180-250g carbs
    const baseFat = 60 + Math.floor(Math.random() * 25);         // 60-85g fat
    
    data.push({
      date: dateStr,
      calories: baseCalories,
      protein: baseProtein,
      carbs: baseCarbs,
      fat: baseFat,
      fiber: Math.floor(baseCarbs * 0.1),  // ~10% of carbs as fiber
      completed_meals: Math.floor(Math.random() * 4) + 1, // 1-4 meals
      water_intake: Math.floor(Math.random() * 8) + 4,    // 4-12 glasses
      activity_level: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    data,
    summary: {
      average_calories: Math.floor(data.reduce((sum, day) => sum + day.calories, 0) / data.length),
      average_protein: Math.floor(data.reduce((sum, day) => sum + day.protein, 0) / data.length),
      average_carbs: Math.floor(data.reduce((sum, day) => sum + day.carbs, 0) / data.length),
      average_fat: Math.floor(data.reduce((sum, day) => sum + day.fat, 0) / data.length),
      average_fiber: Math.floor(data.reduce((sum, day) => sum + day.fiber, 0) / data.length),
      total_days: data.length
    }
  };
}

// Try ports sequentially until one works
const tryPort = (port, maxAttempts = 5) => {
  let currentPort = port;
  let attempts = 0;

  const server = app.listen(currentPort, () => {
    console.log(`Server is running on port ${currentPort}`);
    
    // Write the port to a file so the frontend can find it
    fs.writeFileSync(portFilePath, currentPort.toString());
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempts < maxAttempts) {
      console.log(`Port ${currentPort} is in use, trying port ${currentPort + 1}`);
      attempts++;
      currentPort++;
      server.close();
      tryPort(currentPort, maxAttempts);
    } else {
      console.error('Server failed to start:', err);
    }
  });
};

// Start with preferred port, but try others if needed
const PORT = process.env.PORT || 8000;
tryPort(PORT); 