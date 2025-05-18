import express from 'express';
import cors from 'cors';

// Create Express app
const app = express();
const PORT = 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3012', 'http://localhost:3013', 'http://localhost:3014'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS preflight requests
app.options('*', cors());

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Nutrivize API is running' });
});

// Food endpoints
app.get('/foods', (req, res) => {
  console.log('GET /foods requested');
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

// Logs endpoints
app.get('/logs', (req, res) => {
  console.log('GET /logs requested with query:', req.query);
  res.json({ 
    success: true,
    logs: []
  });
});

// Logs range endpoint
app.get('/logs/range', (req, res) => {
  console.log('GET /logs/range requested with query:', req.query);
  res.json({
    success: true,
    date_range: Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + i);
      return {
        date: date.toISOString().split('T')[0],
        log_count: 0
      };
    })
  });
});

// Meal plans endpoint
app.get('/meal-plans', (req, res) => {
  console.log('GET /meal-plans requested');
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 6);

  // This is a mock API endpoint - in production, get the user ID from authentication
  // FIXME: Replace with proper authentication to get the current user's ID
  const userId = req.headers.authorization ? 'user_from_auth_token' : 'guest_user';
  
  res.json([
    {
      id: `mp-${Date.now()}`,
      user_id: userId, // Use the authenticated user ID instead of hardcoded value
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
  console.log('GET /meal-plans/active requested with query:', req.query);
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
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
  console.log('GET /nutrition/aggregates requested with query:', req.query);
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
});

// Chatbot endpoint
app.post('/api/chat', (req, res) => {
  console.log('POST /api/chat requested with body:', req.body);
  
  // Extract the last user message
  const messages = req.body.messages || [];
  const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
  const userQuery = lastUserMessage ? lastUserMessage.content : '';
  
  // Generate a response based on the user query
  let response;
  if (userQuery.toLowerCase().includes('breakfast')) {
    response = "For a nutritious breakfast, I recommend:\n\n" +
      "* Greek yogurt with berries and honey\n" +
      "* Avocado toast on whole grain bread with a poached egg\n" +
      "* Oatmeal with nuts and sliced banana\n" +
      "* A spinach and feta omelette with whole grain toast\n\n" +
      "These options provide a good balance of protein, complex carbs, and healthy fats to start your day!";
  } 
  else if (userQuery.toLowerCase().includes('lunch') && userQuery.toLowerCase().includes('protein')) {
    response = "For a high-protein lunch, try:\n\n" +
      "* Grilled chicken salad with mixed greens and chickpeas\n" +
      "* Turkey and hummus wrap with plenty of veggies\n" +
      "* Quinoa bowl with black beans, grilled tofu, and roasted vegetables\n" +
      "* Tuna salad on whole grain bread with a side of raw vegetables\n\n" +
      "These meals all provide at least 25-30g of protein to help you meet your daily goals!";
  }
  else if (userQuery.toLowerCase().includes('dinner')) {
    response = "For a quick and nutritious dinner, I suggest:\n\n" +
      "* Sheet pan salmon with roasted Brussels sprouts and sweet potatoes\n" +
      "* Stir-fried tofu with vegetables and brown rice\n" +
      "* One-pot lentil pasta with spinach and feta\n" +
      "* Stuffed bell peppers with lean ground turkey and quinoa\n\n" +
      "All of these can be prepared in 30 minutes or less!";
  }
  else if (userQuery.toLowerCase().includes('snack') && (userQuery.toLowerCase().includes('calorie') || userQuery.toLowerCase().includes('calories'))) {
    response = "Some healthy snacks under 200 calories include:\n\n" +
      "* An apple with 1 tablespoon of almond butter (~150 calories)\n" +
      "* 2 hard-boiled eggs (~140 calories)\n" +
      "* 1 cup of Greek yogurt with berries (~150 calories)\n" +
      "* A small handful of mixed nuts (~170 calories)\n" +
      "* Carrot and cucumber sticks with 2 tablespoons of hummus (~100 calories)\n\n" +
      "These provide nutrients while keeping calories in check!";
  }
  else if (userQuery.toLowerCase().includes('hello') || userQuery.toLowerCase().includes('hi')) {
    response = "Hello! I'm your nutrition assistant. I can help with meal suggestions, nutrition information, and healthy eating tips. What questions do you have about food and nutrition today?";
  }
  else {
    response = "Thanks for your question! As your nutrition assistant, I can help with meal planning, nutrition information, and dietary advice. Could you provide more specific details about what you're looking for? For example, you might ask about specific foods, nutrients, or meal suggestions for particular health goals.";
  }
  
  // Send the response
  res.json({
    response: response,
    success: true
  });
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

// Insights & Trends AI endpoint
app.post('/api/insights-trends', async (req, res) => {
  console.log('POST /api/insights-trends requested with body:', req.body);
  
  const { user_id, days_to_analyze = 14, force_refresh = false } = req.body;
  
  if (!user_id) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required parameter: user_id' 
    });
  }
  
  try {
    // Check if we have cached results that we can return (if not forcing refresh)
    if (!force_refresh) {
      // In a real implementation, check a database for cached results
      // For demo, we'll just return the mock data directly
    }
    
    // 1. Get the user's food logs for the specified time period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days_to_analyze + 1);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // In a real implementation, fetch actual food logs here
    // For demo, we'll generate mock data similar to the nutrition endpoint
    
    // 2. Get the user's nutrition goals
    // In a real implementation, fetch from database
    // For demo, use mock goals data
    const userGoals = {
      daily_calories: 2000,
      proteins: 150,
      carbs: 200,
      fats: 65,
      fiber: 25
    };
    
    // 3. Generate mock food log data (in a real implementation, this would be from DB)
    const mockLogs = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < days_to_analyze; i++) {
      // Generate 2-4 food logs per day
      const logsPerDay = Math.floor(Math.random() * 3) + 2;
      
      for (let j = 0; j < logsPerDay; j++) {
        mockLogs.push({
          date: currentDate.toISOString().split('T')[0],
          meal_type: ['breakfast', 'lunch', 'dinner', 'snack'][Math.floor(Math.random() * 4)],
          food: ['Chicken Breast', 'Salmon', 'Brown Rice', 'Avocado', 'Greek Yogurt', 'Spinach', 'Sweet Potato', 'Almonds'][Math.floor(Math.random() * 8)],
          amount: Math.floor(Math.random() * 200) + 100,
          unit: 'g',
          calories: Math.floor(Math.random() * 500) + 100,
          proteins: Math.floor(Math.random() * 30) + 5,
          carbs: Math.floor(Math.random() * 50) + 10,
          fats: Math.floor(Math.random() * 20) + 2
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 4. In a real implementation, you would call an AI service with the logs and goals
    // Here, we'll generate mock AI insights

    // Mock AI-generated insights and trends
    const aiInsights = [
      {
        title: "Protein Intake Exceeding Goals",
        content: "You've consistently exceeded your daily protein goal by an average of 15g over the past 2 weeks. This is excellent for muscle recovery and satiety. Consider maintaining this level if your fitness goals include strength training.",
        type: "insight",
        importance: 9,
        category: "Macronutrients"
      },
      {
        title: "Missed Breakfast Pattern",
        content: "You've skipped breakfast on 5 out of the last 14 days. Research suggests that eating breakfast may help with energy levels and concentration throughout the day. Consider a quick protein-rich option on busy mornings.",
        type: "insight",
        importance: 7,
        category: "Meal Timing"
      },
      {
        title: "Carbohydrate Intake Trending Down",
        content: "Your carbohydrate intake has decreased by approximately 12% over the past two weeks. This could impact your energy levels during workouts. Consider adding more complex carbs if you've been feeling fatigued.",
        type: "trend",
        importance: 8,
        category: "Macronutrients"
      },
      {
        title: "Healthy Fat Consistency",
        content: "Your healthy fat intake has been very consistent, staying within 5g of your daily target. This balance is beneficial for hormone regulation and vitamin absorption.",
        type: "trend",
        importance: 6,
        category: "Macronutrients"
      },
      {
        title: "Weekday vs Weekend Patterns",
        content: "Your calorie intake increases by an average of 23% on weekends compared to weekdays. This is a common pattern and not concerning if it aligns with your social activities. Consider balancing with lighter meals before or after weekend gatherings.",
        type: "trend",
        importance: 7,
        category: "Eating Patterns"
      },
      {
        title: "Fiber Intake Below Target",
        content: "Your fiber intake is consistently below your daily target of 25g, averaging around 18g daily. Increasing fiber intake could improve digestive health and help with feeling full longer. Try adding more vegetables, fruits, and whole grains to your meals.",
        type: "insight",
        importance: 8,
        category: "Micronutrients"
      }
    ];
    
    // Generate chart data for visualizations
    // Daily calorie trend chart
    const calorieChartData = {
      chart_type: "line",
      title: "Daily Calorie Intake",
      data: {
        labels: Array.from({ length: days_to_analyze }, (_, i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [{
          label: 'Calories',
          data: Array.from({ length: days_to_analyze }, () => Math.floor(Math.random() * 500) + 1700),
          borderColor: '#e67e22',
          backgroundColor: 'rgba(230, 126, 34, 0.1)',
          tension: 0.4
        },
        {
          label: 'Target',
          data: Array(days_to_analyze).fill(userGoals.daily_calories),
          borderColor: '#3498db',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0
        }]
      }
    };
    
    // Macronutrient distribution chart
    const macroChartData = {
      chart_type: "pie",
      title: "Average Macronutrient Distribution",
      data: {
        labels: ['Protein', 'Carbs', 'Fat'],
        datasets: [{
          data: [27, 45, 28], // Percentages
          backgroundColor: ['#27ae60', '#3498db', '#f39c12'],
          borderWidth: 1,
          borderColor: '#fff'
        }]
      }
    };
    
    // Weekly protein trend
    const proteinChartData = {
      chart_type: "bar",
      title: "Weekly Protein Intake",
      data: {
        labels: ['Week 1', 'Week 2'],
        datasets: [{
          label: 'Average Daily Protein (g)',
          data: [132, 164],
          backgroundColor: '#27ae60',
          borderWidth: 1,
          borderColor: '#fff'
        },
        {
          label: 'Target (g)',
          data: [150, 150],
          type: 'line',
          backgroundColor: 'transparent',
          borderColor: '#3498db',
          borderDash: [5, 5],
          borderWidth: 2
        }]
      }
    };
    
    // Meal composition radar chart
    const mealCompositionChart = {
      chart_type: "radar",
      title: "Meal Nutritional Balance",
      data: {
        labels: ['Protein', 'Carbs', 'Fat', 'Fiber', 'Vitamins', 'Minerals'],
        datasets: [{
          label: 'Your Average',
          data: [85, 70, 90, 65, 75, 80],
          fill: true,
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderColor: '#3498db',
          pointBackgroundColor: '#3498db',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3498db'
        },
        {
          label: 'Recommended',
          data: [80, 80, 80, 80, 80, 80],
          fill: true,
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          borderColor: '#2ecc71',
          pointBackgroundColor: '#2ecc71',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#2ecc71'
        }]
      }
    };
    
    // Response data with AI insights and visualizations
    const responseData = {
      success: true,
      insights: aiInsights,
      charts: [calorieChartData, macroChartData, proteinChartData, mealCompositionChart],
      generated_at: new Date().toISOString(),
      is_cached: false
    };
    
    // In a real implementation, cache the results in a database
    
    res.json(responseData);
  } catch (error) {
    console.error('Error generating insights and trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating insights and trends',
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Write port to file for frontend to find
import fs from 'fs';
fs.writeFileSync('backend/port.txt', PORT.toString());
console.log(`Port ${PORT} written to backend/port.txt`); 