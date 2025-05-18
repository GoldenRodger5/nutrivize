// Mock foods data
const mockFoods = [
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
  }
];

// Food Logs
const mockFoodLogs = [
  {
    _id: "log1",
    date: new Date().toISOString().split("T")[0],
    meal_type: "breakfast",
    food_id: "food1",
    name: "Greek Yogurt",
    amount: 1,
    unit: "serving",
    calories: 100,
    proteins: 17,
    carbs: 6,
    fats: 0.7,
    fiber: 0
  }
];

// Week logs organized by date
const mockWeekLogs = {
  [new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0]]: mockFoodLogs.map(log => ({...log, date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0]})),
  [new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0]]: mockFoodLogs.map(log => ({...log, date: new Date(Date.now() - 86400000 * 1).toISOString().split("T")[0]})),
  [new Date().toISOString().split("T")[0]]: mockFoodLogs,
};

// Goal data
const mockGoal = {
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
const mockMealPlan = {
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
          ingredients: []
        }
      },
      daily_totals: {
        calories: 1065.5,
        protein: 96.2,
        carbs: 89.75,
        fat: 35.15
      },
      is_complete: false
    }
  ]
};

// Insights Data
const mockInsights = {
  insights: [
    {
      title: "Increasing Protein Intake",
      content: "Your protein intake has been below your target for 5 out of the last 7 days.",
      category: "Nutrition",
      importance: 3
    }
  ],
  statistics: [
    {
      name: "Average Daily Calories",
      value: 1890,
      unit: "kcal",
      trend: 5.2,
      trend_direction: "up"
    }
  ]
};

// Create a registry of mock responses for different URL patterns
const mockRegistry = [
  { pattern: '/foods', response: mockFoods },
  { pattern: '/logs?date=', response: { logs: mockFoodLogs } },
  { pattern: '/logs/range', response: { date_range: Object.entries(mockWeekLogs).map(([date, logs]) => ({ date, logs })) } },
  { pattern: '/meal-plans/active', response: mockMealPlan },
  { pattern: '/api/insights', response: mockInsights },
  { pattern: '/goals/active', response: mockGoal },
  { pattern: '/goals', excludePattern: '/active', response: [mockGoal] },
  { pattern: '/auth/login', response: { user: { _id: 'mock-user-id', name: 'Mock User', email: 'user@example.com', uid: 'mock-user-id' }, token: 'mock-jwt-token' } },
  { pattern: '/auth/register', response: { user: { _id: 'mock-user-id', name: 'Mock User', email: 'user@example.com', uid: 'mock-user-id' }, token: 'mock-jwt-token' } },
  { pattern: '/auth/token', response: { token: 'mock-jwt-token' } },
  { pattern: '/users/profile', response: { _id: 'mock-user-id', name: 'Mock User', email: 'user@example.com', uid: 'mock-user-id' } },
  { pattern: '/api', response: {} }
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

// Helper function to use mock data
function useMockData(isEnabled = true) {
  if (!isEnabled) return;
  
  console.log('[MOCK] Setting up standalone mock data system');

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
  
  // Expose the mock system globally for debugging
  window.__NUTRIVIZE_MOCK_SYSTEM__ = {
    findMockForUrl,
    mockRegistry
  };
  
  console.log('[MOCK] Mock data system initialized successfully');
  
  return () => {
    window.fetch = originalFetch;
    console.log('[MOCK] Mock data disabled - restored original fetch');
  };
}

// Make the function available globally
window.useMockData = useMockData; 