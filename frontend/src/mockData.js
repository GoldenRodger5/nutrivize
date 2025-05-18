// Mock data for testing UI components

// Food Items for FoodIndexTab
export const mockFoods = [
  {
    _id: "food1",
    name: "Grilled Chicken Breast",
    serving_size: 100,
    serving_unit: "g",
    calories: 165,
    proteins: 31,
    carbs: 0,
    fats: 3.6,
    fiber: 0,
    source: "User Added",
    meal_compatibility: ["lunch", "dinner"]
  },
  {
    _id: "food2",
    name: "Brown Rice",
    serving_size: 100,
    serving_unit: "g",
    calories: 112,
    proteins: 2.6,
    carbs: 23.5,
    fats: 0.9,
    fiber: 1.8,
    source: "Database",
    meal_compatibility: ["lunch", "dinner"]
  },
  {
    _id: "food3",
    name: "Avocado",
    serving_size: 100,
    serving_unit: "g",
    calories: 160,
    proteins: 2,
    carbs: 8.5,
    fats: 14.7,
    fiber: 6.7,
    source: "User Added",
    meal_compatibility: ["breakfast", "lunch", "snack"]
  },
  {
    _id: "food4",
    name: "Greek Yogurt",
    serving_size: 170,
    serving_unit: "g",
    calories: 100,
    proteins: 17,
    carbs: 6,
    fats: 0.7,
    fiber: 0,
    source: "Database",
    meal_compatibility: ["breakfast", "snack"]
  },
  {
    _id: "food5",
    name: "Salmon Fillet",
    serving_size: 100,
    serving_unit: "g",
    calories: 208,
    proteins: 20.4,
    carbs: 0,
    fats: 13.4,
    fiber: 0,
    source: "User Added",
    meal_compatibility: ["lunch", "dinner"]
  },
  {
    _id: "food6",
    name: "Sweet Potato",
    serving_size: 100,
    serving_unit: "g",
    calories: 86,
    proteins: 1.6,
    carbs: 20.1,
    fats: 0.1,
    fiber: 3,
    source: "Database",
    meal_compatibility: ["lunch", "dinner"]
  },
  {
    _id: "food7",
    name: "Almonds",
    serving_size: 28,
    serving_unit: "g",
    calories: 164,
    proteins: 6,
    carbs: 6.1,
    fats: 14.2,
    fiber: 3.5,
    source: "User Added",
    meal_compatibility: ["snack"]
  },
  {
    _id: "food8",
    name: "Banana",
    serving_size: 118,
    serving_unit: "g",
    calories: 105,
    proteins: 1.3,
    carbs: 27,
    fats: 0.4,
    fiber: 3.1,
    source: "Database",
    meal_compatibility: ["breakfast", "snack"]
  },
  {
    _id: "food9",
    name: "Spinach",
    serving_size: 100,
    serving_unit: "g",
    calories: 23,
    proteins: 2.9,
    carbs: 3.6,
    fats: 0.4,
    fiber: 2.2,
    source: "User Added",
    meal_compatibility: ["lunch", "dinner"]
  },
  {
    _id: "food10",
    name: "Protein Shake",
    serving_size: 1,
    serving_unit: "scoop",
    calories: 120,
    proteins: 24,
    carbs: 3,
    fats: 1.5,
    fiber: 0,
    source: "User Added",
    meal_compatibility: ["breakfast", "snack", "post-workout"]
  },
  {
    _id: "food11",
    name: "Quinoa",
    serving_size: 100,
    serving_unit: "g",
    calories: 120,
    proteins: 4.4,
    carbs: 21.3,
    fats: 1.9,
    fiber: 2.8,
    source: "Database",
    meal_compatibility: ["lunch", "dinner"]
  },
  {
    _id: "food12",
    name: "Eggs",
    serving_size: 50,
    serving_unit: "g",
    calories: 72,
    proteins: 6.3,
    carbs: 0.4,
    fats: 5,
    fiber: 0,
    source: "User Added",
    meal_compatibility: ["breakfast", "lunch"]
  }
];

// Food Logs
export const mockFoodLogs = [
  {
    _id: "log1",
    date: new Date().toISOString().split("T")[0],
    meal_type: "breakfast",
    food_id: "food4",
    name: "Greek Yogurt",
    amount: 1,
    unit: "serving",
    calories: 100,
    proteins: 17,
    carbs: 6,
    fats: 0.7,
    fiber: 0
  },
  {
    _id: "log2",
    date: new Date().toISOString().split("T")[0],
    meal_type: "breakfast",
    food_id: "food8",
    name: "Banana",
    amount: 1,
    unit: "serving",
    calories: 105,
    proteins: 1.3,
    carbs: 27,
    fats: 0.4,
    fiber: 3.1
  },
  {
    _id: "log3",
    date: new Date().toISOString().split("T")[0],
    meal_type: "lunch",
    food_id: "food1",
    name: "Grilled Chicken Breast",
    amount: 1.5,
    unit: "serving",
    calories: 247.5,
    proteins: 46.5,
    carbs: 0,
    fats: 5.4,
    fiber: 0
  },
  {
    _id: "log4",
    date: new Date().toISOString().split("T")[0],
    meal_type: "lunch",
    food_id: "food2",
    name: "Brown Rice",
    amount: 1,
    unit: "serving",
    calories: 112,
    proteins: 2.6,
    carbs: 23.5,
    fats: 0.9,
    fiber: 1.8
  },
  {
    _id: "log5",
    date: new Date().toISOString().split("T")[0],
    meal_type: "dinner",
    food_id: "food5",
    name: "Salmon Fillet",
    amount: 1,
    unit: "serving",
    calories: 208,
    proteins: 20.4,
    carbs: 0,
    fats: 13.4,
    fiber: 0
  },
  {
    _id: "log6",
    date: new Date().toISOString().split("T")[0],
    meal_type: "dinner",
    food_id: "food6",
    name: "Sweet Potato",
    amount: 1.5,
    unit: "serving",
    calories: 129,
    proteins: 2.4,
    carbs: 30.15,
    fats: 0.15,
    fiber: 4.5
  }
];

// Week logs organized by date
export const mockWeekLogs = {
  [new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0]]: mockFoodLogs.map(log => ({...log, date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0]})),
  [new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0]]: mockFoodLogs.map(log => ({...log, date: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0]})),
  [new Date().toISOString().split("T")[0]]: mockFoodLogs,
};

// Goal data
export const mockGoal = {
  _id: "goal1",
  type: "weight loss",
  weight_target: {
    current: 80,
    goal: 70,
    weekly_rate: 0.5
  },
  nutrition_targets: [{
    name: "Default",
    daily_calories: 2000,
    proteins: 150,
    carbs: 200,
    fats: 65,
    fiber: 25
  }]
};

// Meal Plan data
export const mockMealPlan = {
  id: "plan1",
  user_id: "user123",
  name: "Weight Loss Plan",
  created_at: new Date().toISOString(),
  is_active: true,
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 86400000 * 7).toISOString(),
  days: [
    {
      date: new Date().toISOString(),
      meals: {
        breakfast: {
          name: "Greek Yogurt with Banana and Almonds",
          macros: {
            protein: 24.3,
            carbs: 36.1,
            fat: 15.3,
            calories: 369
          },
          description: "A protein-packed breakfast with creamy yogurt and crunchy almonds",
          serving_info: "1 serving",
          ingredients: [
            { name: "Greek Yogurt", amount: 170, unit: "g", in_food_index: true },
            { name: "Banana", amount: 1, unit: "medium", in_food_index: true },
            { name: "Almonds", amount: 15, unit: "g", in_food_index: true }
          ],
          instructions: [
            "Add Greek yogurt to a bowl",
            "Slice banana and place on top",
            "Sprinkle almonds over the yogurt and banana"
          ],
          cooking_time: 5,
          meal_type: "breakfast",
          is_logged: false,
          day: 1
        },
        lunch: {
          name: "Grilled Chicken and Brown Rice Bowl",
          macros: {
            protein: 49.1,
            carbs: 23.5,
            fat: 6.3,
            calories: 359.5
          },
          description: "High-protein lunch with lean chicken and complex carbs",
          serving_info: "1 serving",
          ingredients: [
            { name: "Grilled Chicken Breast", amount: 150, unit: "g", in_food_index: true },
            { name: "Brown Rice", amount: 100, unit: "g", in_food_index: true },
            { name: "Mixed Vegetables", amount: 100, unit: "g", in_food_index: false }
          ],
          instructions: [
            "Cook brown rice according to package instructions",
            "Season chicken breast with salt and pepper",
            "Grill chicken for 6-8 minutes per side until cooked through",
            "Steam mixed vegetables",
            "Combine all ingredients in a bowl"
          ],
          cooking_time: 25,
          meal_type: "lunch",
          is_logged: false,
          day: 1
        },
        dinner: {
          name: "Baked Salmon with Sweet Potato",
          macros: {
            protein: 22.8,
            carbs: 30.15,
            fat: 13.55,
            calories: 337
          },
          description: "Omega-3 rich salmon with complex carbs from sweet potato",
          serving_info: "1 serving",
          ingredients: [
            { name: "Salmon Fillet", amount: 100, unit: "g", in_food_index: true },
            { name: "Sweet Potato", amount: 150, unit: "g", in_food_index: true },
            { name: "Olive Oil", amount: 1, unit: "tsp", in_food_index: false }
          ],
          instructions: [
            "Preheat oven to 400°F (200°C)",
            "Season salmon with salt, pepper, and herbs",
            "Cube sweet potato and toss with olive oil",
            "Bake salmon for 12-15 minutes",
            "Roast sweet potato for 20-25 minutes until tender"
          ],
          cooking_time: 30,
          meal_type: "dinner",
          is_logged: false,
          day: 1
        }
      },
      daily_totals: {
        calories: 1065.5,
        protein: 96.2,
        carbs: 89.75,
        fat: 35.15
      },
      is_complete: false
    },
    // Second day with leftover meal
    {
      date: new Date(Date.now() + 86400000).toISOString(),
      meals: {
        breakfast: {
          name: "Protein Shake with Banana",
          macros: {
            protein: 25.3,
            carbs: 30,
            fat: 1.9,
            calories: 225
          },
          description: "Quick and easy protein-packed breakfast",
          serving_info: "1 serving",
          ingredients: [
            { name: "Protein Powder", amount: 1, unit: "scoop", in_food_index: true },
            { name: "Banana", amount: 1, unit: "medium", in_food_index: true },
            { name: "Water", amount: 250, unit: "ml", in_food_index: false }
          ],
          instructions: [
            "Add protein powder to shaker bottle",
            "Add water and shake well",
            "Enjoy with a banana on the side"
          ],
          cooking_time: 3,
          meal_type: "breakfast",
          is_logged: false,
          day: 2
        },
        lunch: {
          name: "Leftover Grilled Chicken and Brown Rice Bowl",
          macros: {
            protein: 49.1,
            carbs: 23.5,
            fat: 6.3,
            calories: 359.5
          },
          description: "High-protein lunch with lean chicken and complex carbs",
          serving_info: "1 serving",
          ingredients: [
            { name: "Grilled Chicken Breast", amount: 150, unit: "g", in_food_index: true },
            { name: "Brown Rice", amount: 100, unit: "g", in_food_index: true },
            { name: "Mixed Vegetables", amount: 100, unit: "g", in_food_index: false }
          ],
          instructions: [
            "Reheat leftover chicken and rice",
            "Add fresh vegetables if desired"
          ],
          cooking_time: 5,
          meal_type: "lunch",
          is_logged: false,
          day: 2,
          is_leftover: true,
          original_meal_day: 1
        },
        dinner: {
          name: "Quinoa Bowl with Avocado",
          macros: {
            protein: 6.4,
            carbs: 29.8,
            fat: 16.6,
            calories: 280
          },
          description: "Plant-based dinner rich in healthy fats",
          serving_info: "1 serving",
          ingredients: [
            { name: "Quinoa", amount: 100, unit: "g", in_food_index: true },
            { name: "Avocado", amount: 0.5, unit: "medium", in_food_index: true },
            { name: "Spinach", amount: 50, unit: "g", in_food_index: true }
          ],
          instructions: [
            "Cook quinoa according to package instructions",
            "Slice avocado",
            "Wilt spinach lightly",
            "Combine all ingredients in a bowl"
          ],
          cooking_time: 20,
          meal_type: "dinner",
          is_logged: false,
          day: 2
        }
      },
      daily_totals: {
        calories: 864.5,
        protein: 80.8,
        carbs: 83.3,
        fat: 24.8
      },
      is_complete: false
    }
  ],
  plan_totals: {
    calories: 1930,
    protein: 177,
    carbs: 173.05,
    fat: 59.95
  },
  grocery_list: [
    { item: "Greek Yogurt", amount: 170, unit: "g", estimated_cost: 1.50, category: "dairy", in_food_index: true },
    { item: "Banana", amount: 2, unit: "medium", estimated_cost: 0.60, category: "fruits", in_food_index: true },
    { item: "Almonds", amount: 15, unit: "g", estimated_cost: 0.75, category: "nuts", in_food_index: true },
    { item: "Chicken Breast", amount: 150, unit: "g", estimated_cost: 2.25, category: "meat", in_food_index: true },
    { item: "Brown Rice", amount: 100, unit: "g", estimated_cost: 0.65, category: "grains", in_food_index: true },
    { item: "Mixed Vegetables", amount: 100, unit: "g", estimated_cost: 1.20, category: "produce", in_food_index: false },
    { item: "Salmon Fillet", amount: 100, unit: "g", estimated_cost: 3.50, category: "seafood", in_food_index: true },
    { item: "Sweet Potato", amount: 150, unit: "g", estimated_cost: 0.90, category: "produce", in_food_index: true },
    { item: "Olive Oil", amount: 1, unit: "tsp", estimated_cost: 0.20, category: "oils", in_food_index: false },
    { item: "Protein Powder", amount: 1, unit: "scoop", estimated_cost: 1.50, category: "supplements", in_food_index: true },
    { item: "Quinoa", amount: 100, unit: "g", estimated_cost: 1.30, category: "grains", in_food_index: true },
    { item: "Avocado", amount: 0.5, unit: "medium", estimated_cost: 1.00, category: "produce", in_food_index: true },
    { item: "Spinach", amount: 50, unit: "g", estimated_cost: 0.80, category: "produce", in_food_index: true }
  ]
};

// Insights Data
export const mockInsights = {
  insights: [
    {
      title: "Increasing Protein Intake",
      content: "Your protein intake has been below your target for 5 out of the last 7 days. Consider adding more lean protein sources like chicken, fish, or plant-based options to meet your muscle building goals.",
      category: "Nutrition",
      importance: 3
    },
    {
      title: "Meal Timing Improvement",
      content: "You've been consistently eating meals at regular intervals, which is great for metabolic health and energy levels.",
      category: "Habit",
      importance: 2
    },
    {
      title: "Hydration Reminder",
      content: "Based on your activity level, aim to consume at least 2.5-3 liters of water daily for optimal performance and recovery.",
      category: "Hydration",
      importance: 2
    },
    {
      title: "Fiber Intake Trend",
      content: "Your fiber intake has been increasing steadily over the past week, which supports digestive health. Keep including high-fiber foods like vegetables, fruits, and whole grains.",
      category: "Nutrition",
      importance: 1
    },
    {
      title: "Calorie Consistency",
      content: "Your calorie intake has been consistent within 100-200 calories of your target, which is excellent for predictable weight loss progress.",
      category: "Nutrition",
      importance: 3
    },
    {
      title: "Pre-Workout Nutrition",
      content: "Try consuming a combination of carbs and protein 1-2 hours before your workouts to improve performance and recovery.",
      category: "Performance",
      importance: 2
    }
  ],
  statistics: [
    {
      name: "Average Daily Calories",
      value: 1890,
      unit: "kcal",
      trend: 5.2,
      trend_direction: "up"
    },
    {
      name: "Protein Intake",
      value: 125.4,
      unit: "g",
      trend: 8.3,
      trend_direction: "up"
    },
    {
      name: "Carb Intake",
      value: 175.6,
      unit: "g",
      trend: -3.1,
      trend_direction: "down"
    },
    {
      name: "Fat Intake",
      value: 52.8,
      unit: "g",
      trend: 0.5,
      trend_direction: "same"
    },
    {
      name: "Fiber Intake",
      value: 22.7,
      unit: "g",
      trend: 12.4,
      trend_direction: "up"
    },
    {
      name: "Meal Consistency",
      value: 87.5,
      unit: "%",
      trend: 4.5,
      trend_direction: "up"
    },
    {
      name: "Weekly Deficit",
      value: 2730,
      unit: "kcal",
      trend: 8.2,
      trend_direction: "up"
    },
    {
      name: "Protein/Weight Ratio",
      value: 1.7,
      unit: "g/kg",
      trend: 3.5,
      trend_direction: "up"
    }
  ],
  charts: [
    {
      chart_type: "line",
      title: "Daily Calorie Intake",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Calories",
            data: [1950, 1850, 1920, 1870, 1900, 1780, 1960],
            fill: true
          },
          {
            label: "Target",
            data: [2000, 2000, 2000, 2000, 2000, 2000, 2000],
            borderDash: [5, 5]
          }
        ]
      }
    },
    {
      chart_type: "bar",
      title: "Macronutrient Distribution",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Protein (g)",
            data: [120, 135, 118, 142, 125, 130, 108]
          },
          {
            label: "Carbs (g)",
            data: [180, 165, 190, 172, 168, 175, 180]
          },
          {
            label: "Fat (g)",
            data: [55, 48, 53, 50, 57, 49, 58]
          }
        ]
      }
    },
    {
      chart_type: "pie",
      title: "Average Macronutrient Ratio",
      data: {
        labels: ["Protein", "Carbs", "Fat"],
        datasets: [
          {
            data: [26, 44, 30],
            backgroundColor: ["#06B6D4", "#8E2DE2", "#F87171"]
          }
        ]
      }
    },
    {
      chart_type: "line",
      title: "Weight Trend",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [
          {
            label: "Weight (kg)",
            data: [80, 79.2, 78.5, 77.8],
            fill: false
          }
        ]
      }
    }
  ],
  generated_at: new Date().toISOString(),
  is_cached: false
};

// Helper function to use mock data
export const useMockData = (isEnabled = true) => {
  if (!isEnabled) return;
  
  console.log('[MOCK] Setting up mock data system');

  // Create a registry of mock responses for different URL patterns
  const mockRegistry = [
    {
      pattern: '/foods',
      response: mockFoods
    },
    {
      pattern: '/logs?date=',
      response: { logs: mockFoodLogs }
    },
    {
      pattern: '/logs/range',
      response: { date_range: Object.entries(mockWeekLogs).map(([date, logs]) => ({ date, logs })) }
    },
    {
      pattern: '/meal-plans/active',
      response: mockMealPlan
    },
    {
      pattern: '/api/insights',
      response: mockInsights
    },
    {
      pattern: '/goals/active',
      response: mockGoal
    },
    {
      pattern: '/goals',
      excludePattern: '/active',
      response: [mockGoal]
    },
    {
      pattern: '/auth/login',
      response: {
        user: {
          _id: 'mock-user-id',
          name: 'Mock User',
          email: 'user@example.com',
          uid: 'mock-user-id'
        },
        token: 'mock-jwt-token'
      }
    },
    {
      pattern: '/auth/register',
      response: {
        user: {
          _id: 'mock-user-id',
          name: 'Mock User',
          email: 'user@example.com',
          uid: 'mock-user-id'
        },
        token: 'mock-jwt-token'
      }
    },
    {
      pattern: '/auth/token',
      response: {
        token: 'mock-jwt-token'
      }
    },
    {
      pattern: '/users/profile',
      response: {
        _id: 'mock-user-id',
        name: 'Mock User',
        email: 'user@example.com',
        uid: 'mock-user-id'
      }
    },
    {
      pattern: '/api',
      response: {}
    }
  ];
  
  // Function to find a matching mock for a URL
  const findMockForUrl = (url) => {
    console.log(`[MOCK] Looking for a mock for: ${url}`);
    
    for (const mock of mockRegistry) {
      if (url.includes(mock.pattern)) {
        if (mock.excludePattern && url.includes(mock.excludePattern)) {
          continue;
        }
        console.log(`[MOCK] Found mock for ${url}: ${mock.pattern}`);
        return mock.response;
      }
    }
    
    // Default empty response for any API endpoint
    if (url.includes('/api/') || url.includes('/users/') || url.match(/\/[a-zA-Z0-9-_]+\//)) {
      console.log(`[MOCK] No specific handler for ${url}, returning empty response`);
      return {};
    }
    
    return null;
  };
  
  // Mock API requests - for fetch API
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    console.log(`[MOCK] Intercepted fetch to: ${url}`);
    
    const mockResponse = findMockForUrl(url);
    
    if (mockResponse !== null) {
      console.log(`[MOCK] Returning mock data for: ${url}`);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });
    }
    
    // For any other requests, use the original fetch
    console.log(`[MOCK] Passing through to original fetch: ${url}`);
    return originalFetch(url, options);
  };

  // For Axios - Try importing directly
  console.log('[MOCK] Setting up axios mock adapter');
  
  // Inject into any API file that's already been loaded
  try {
    if (window.__NUTRIVIZE_API__) {
      const api = window.__NUTRIVIZE_API__;
      console.log('[MOCK] Found global API reference, patching directly');
      
      // Patch the api instance directly
      const originalRequest = api.request;
      api.request = function(config) {
        const url = config.url || '';
        console.log(`[MOCK] Intercepted axios request: ${config.method} ${url}`);
        
        const mockResponse = findMockForUrl(url);
        
        if (mockResponse !== null) {
          console.log(`[MOCK] Returning mock data for axios request: ${url}`);
          return Promise.resolve({
            data: mockResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          });
        }
        
        console.log(`[MOCK] Passing through to original axios: ${url}`);
        return originalRequest.call(this, config);
      };
    } else {
      console.log('[MOCK] No global API reference found, will try to patch axios defaults');
    }
  } catch (err) {
    console.error('[MOCK] Error patching global API:', err);
  }
  
  // Try to patch axios defaults
  try {
    // Set up a global adapter that will be picked up by any new axios instance
    console.log('[MOCK] Setting up axios global patch');
    
    // Save original adapter getter
    const originalGetAdapter = Object.getOwnPropertyDescriptor(
      require('axios').defaults,
      'adapter'
    )?.get;
    
    // Define our custom adapter getter
    Object.defineProperty(require('axios').defaults, 'adapter', {
      get: function() {
        const originalAdapter = originalGetAdapter ? originalGetAdapter.call(this) : undefined;
        
        return function(config) {
          const url = config.url || '';
          console.log(`[MOCK] Axios adapter intercepted: ${config.method} ${url}`);
          
          const mockResponse = findMockForUrl(url);
          
          if (mockResponse !== null) {
            console.log(`[MOCK] Returning mock data for axios adapter: ${url}`);
            return Promise.resolve({
              data: mockResponse,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
              request: {}
            });
          }
          
          console.log(`[MOCK] Passing through to original axios adapter: ${url}`);
          return originalAdapter(config);
        };
      },
      configurable: true
    });
    
    console.log('[MOCK] Axios global patch complete');
  } catch (err) {
    console.error('[MOCK] Error setting up axios global patch:', err);
  }
  
  // Directly patch utility/api.ts
  try {
    console.log('[MOCK] Attempting to patch api.ts module directly');
    // This is a backup approach - find the module in the cache
    const modules = Object.keys(window);
    for (const key of modules) {
      if (key.includes('api_ts') || key.includes('api.ts')) {
        console.log(`[MOCK] Found possible API module: ${key}`);
        const mod = window[key];
        if (mod && mod.default && typeof mod.default.request === 'function') {
          console.log('[MOCK] Patching API module directly');
          
          // Save original request method
          const originalRequest = mod.default.request;
          
          // Replace with our mock
          mod.default.request = function(config) {
            const url = config.url || '';
            console.log(`[MOCK] API module intercepted: ${config.method} ${url}`);
            
            const mockResponse = findMockForUrl(url);
            
            if (mockResponse !== null) {
              console.log(`[MOCK] Returning mock data for API module: ${url}`);
              return Promise.resolve({
                data: mockResponse,
                status: 200,
                statusText: 'OK',
                headers: {},
                config,
                request: {}
              });
            }
            
            console.log(`[MOCK] Passing through to original API module: ${url}`);
            return originalRequest.call(this, config);
          };
          
          console.log('[MOCK] API module patched successfully');
        }
      }
    }
  } catch (err) {
    console.error('[MOCK] Error patching API module directly:', err);
  }
  
  // Expose the mock system globally for emergency fixes
  window.__NUTRIVIZE_MOCK_SYSTEM__ = {
    findMockForUrl,
    mockRegistry
  };
  
  console.log('[MOCK] Mock data system initialized successfully');
  
  return () => {
    window.fetch = originalFetch;
    console.log('[MOCK] Mock data disabled - restored original fetch');
    // Note: We don't restore the axios adapter as it's more complex
  };
}; 