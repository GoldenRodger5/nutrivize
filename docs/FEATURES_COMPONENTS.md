# 🎯 Nutrivize V2 - Component & Feature Documentation

## 📋 **Table of Contents**
- [Overview](#overview)
- [AI-Powered Features](#ai-powered-features)
- [Food Management System](#food-management-system)
- [Meal Planning & Analytics](#meal-planning--analytics)
- [User Interface Components](#user-interface-components)
- [Advanced Features](#advanced-features)
- [Data Management](#data-management)
- [Integration Patterns](#integration-patterns)

---

## 🌟 **Overview**

Nutrivize V2 is built with a **component-driven architecture** featuring 6 main component categories, 22 pages, and specialized functionality modules. Each component is designed for reusability, performance, and user experience.

### **Component Architecture**
```
frontend/src/components/
├── auth/              # Authentication & user management (2 components)
├── food/              # Food-related functionality (12 components)
├── nutrition/         # Nutrition analysis & coaching (4 components)
├── dashboard/         # AI dashboard & analytics (6 components)
├── ui/                # Reusable UI components (8 components)
└── analytics/         # Advanced analytics & reporting (3 components)
```

### **Page Architecture**
```
frontend/src/pages/
├── AIDashboard.tsx           # Main dashboard & home page
├── FoodLog.tsx              # Primary food logging interface
├── FoodIndex.tsx            # Food database & search
├── MealPlans.tsx            # AI-powered meal planning
├── Analytics.tsx            # Comprehensive analytics
├── AIChat.tsx               # AI assistant interface
├── RestaurantAI.tsx         # Restaurant menu analysis
└── ... (15 additional specialized pages)
```

---

## 🤖 **AI-Powered Features**

### **AI Dashboard** (`pages/AIDashboardNew.tsx`)
**Purpose**: Central hub with AI-powered insights and quick actions

#### **Key Features**:
- **Smart Nutrition Summary**: Real-time macro tracking with AI insights
- **Health Score Calculator**: ML-based health assessment (0-100 scale)
- **Quick Action Cards**: One-tap food logging, water intake, weight tracking
- **AI Coaching Panel**: Personalized recommendations and tips
- **Progress Visualization**: Interactive charts and goal tracking

#### **Technical Implementation**:
```typescript
// Core hooks for AI functionality
const { nutrition, loading: nutritionLoading } = useSmartNutrition()
const { healthScore, loading: basicLoading } = useHealthScore() 
const { enhancedHealthScore, loading: enhancedLoading } = useEnhancedHealthScore()
const { coaching, loading: coachingLoading } = useAICoaching()

// Smart nutrition calculation
const calculateNutritionInsights = (nutrition: NutritionData) => {
  return {
    calorieBalance: nutrition.calories - targets.calories,
    macroBalance: analyzeMacroDistribution(nutrition),
    recommendations: generateAIRecommendations(nutrition),
    healthImpact: calculateHealthImpact(nutrition)
  }
}
```

#### **AI Insights Panel**:
```typescript
interface AIInsight {
  type: 'success' | 'warning' | 'info' | 'recommendation'
  title: string
  message: string
  actionable: boolean
  action?: {
    label: string
    handler: () => void
  }
}
```

### **AI Chat Assistant** (`pages/AIChat.tsx`)
**Purpose**: Conversational AI for nutrition guidance and meal planning

#### **Features**:
- **Context-Aware Responses**: Includes user's nutrition history and preferences
- **Meal Suggestions**: Real-time food recommendations based on current intake
- **Nutrition Analysis**: Instant analysis of daily/weekly nutrition patterns
- **Goal Coaching**: Personalized advice for health and nutrition goals
- **Smart Follow-ups**: Proactive suggestions based on conversation context

#### **Implementation**:
```typescript
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  context?: {
    food_recommendations?: FoodItem[]
    nutrition_analysis?: NutritionSummary
    meal_suggestions?: MealSuggestion[]
  }
}

const sendMessage = async (message: string) => {
  const context = {
    include_nutrition_data: true,
    include_food_history: true,
    include_meal_suggestions: true,
    recent_foods: await getRecentFoods(),
    current_goals: await getUserGoals()
  }
  
  const response = await api.post('/ai/chat', { message, context })
  return response.data
}
```

### **AI Health Score** (`ai_health.py` backend)
**Purpose**: Comprehensive health assessment using multiple data points

#### **Calculation Methodology**:
```python
def calculate_health_score(user_data: UserHealthData) -> HealthScore:
    """
    Multi-factor health score calculation (0-100)
    """
    factors = {
        'nutrition_balance': calculate_nutrition_score(user_data.nutrition),
        'calorie_adherence': calculate_calorie_adherence(user_data.intake, user_data.goals),
        'hydration': calculate_hydration_score(user_data.water_intake),
        'meal_timing': calculate_meal_timing_score(user_data.meal_logs),
        'food_variety': calculate_variety_score(user_data.food_history),
        'goal_progress': calculate_goal_progress(user_data.goals)
    }
    
    # Weighted average with AI-determined weights
    weights = get_personalized_weights(user_data.profile)
    overall_score = sum(score * weight for score, weight in zip(factors.values(), weights))
    
    return HealthScore(
        overall_score=round(overall_score),
        category_scores=factors,
        insights=generate_insights(factors),
        recommendations=generate_recommendations(factors, user_data)
    )
```

### **Restaurant AI** (`pages/RestaurantAI.tsx`)
**Purpose**: Analyze restaurant menus and provide healthy recommendations

#### **Core Functionality**:
```typescript
interface MenuAnalysisRequest {
  source_type: 'url' | 'image' | 'pdf'
  source_data: string[]
  restaurant_name: string
  menu_name: string
}

const analyzeMenu = async (menuData: MenuAnalysisRequest) => {
  // OCR + AI analysis of menu items
  const response = await api.post('/restaurant-ai/analyze', menuData)
  return {
    menuItems: response.data.recommendations,
    nutritionEstimates: response.data.nutrition_analysis,
    healthyOptions: response.data.healthy_recommendations,
    dietaryFilters: response.data.dietary_compatibility
  }
}
```

#### **Smart Filtering**:
```typescript
interface RecommendationFilters {
  meal_types: string[]
  dietary_preferences: string[]
  max_calories?: number
  min_protein?: number
  allergen_exclusions: string[]
  price_range?: 'low' | 'medium' | 'high'
  include_modifications: boolean
}
```

---

## 🍎 **Food Management System**

### **Batch Food Logging** (`components/food/BatchFoodLogging.tsx`)
**Purpose**: Efficient multi-food logging with batch operations

#### **Key Features**:
- **Multi-Food Selection**: Add multiple foods to a batch before logging
- **Batch Operations**: Log all items, apply date/meal type changes to selection
- **Real-Time Nutrition**: Live calculation of total nutrition for batch
- **Smart Search**: Debounced food search with category filtering
- **Serving Size Management**: Individual serving sizes with unit conversion
- **Meal Type & Date Control**: Bulk editing capabilities

#### **Technical Implementation**:
```typescript
interface BatchFoodEntry {
  id: string
  food_item: FoodItem
  serving_size: number
  meal_type: string
  date: string
  notes?: string
  logged: boolean
}

const logSelectedEntries = async () => {
  const entriesToLog = entries.filter(entry => selectedEntries.includes(entry.id))
  
  const logPromises = entriesToLog.map(entry => {
    const logData = {
      food_item_id: entry.food_item.id,
      serving_size: entry.serving_size,
      meal_type: entry.meal_type,
      date: entry.date,
      notes: entry.notes
    }
    return api.post('/food/log', logData)
  })

  await Promise.all(logPromises)
  
  // Update UI state
  setEntries(prev => prev.map(entry => 
    selectedEntries.includes(entry.id) ? { ...entry, logged: true } : entry
  ))
}
```

#### **Nutrition Summary Component**:
```typescript
const calculateTotalNutrition = (selectedOnly: boolean = false): NutritionInfo => {
  const relevantEntries = selectedOnly 
    ? entries.filter(entry => selectedEntries.includes(entry.id))
    : entries
  
  return relevantEntries.reduce((total, entry) => {
    const multiplier = entry.serving_size
    return {
      calories: total.calories + (entry.food_item.nutrition.calories * multiplier),
      protein: total.protein + (entry.food_item.nutrition.protein * multiplier),
      carbs: total.carbs + (entry.food_item.nutrition.carbs * multiplier),
      fat: total.fat + (entry.food_item.nutrition.fat * multiplier),
      // ... additional nutrients
    }
  }, initialNutritionValues)
}
```

### **Food Index** (`pages/FoodIndex.tsx`)
**Purpose**: Comprehensive food database with advanced search and management

#### **Features**:
- **Smart Search**: Full-text search with category filtering and sorting
- **Favorites Integration**: Heart icons with instant favoriting capability
- **Food Categories**: Organized browsing by food type
- **Popularity Ranking**: Usage-based food recommendations
- **Custom Foods**: User-created food items
- **Detailed Views**: Comprehensive nutrition information modals

#### **Search Implementation**:
```typescript
const searchFoods = async (query: string, filters: SearchFilters) => {
  const params = {
    q: query,
    category: filters.category,
    sort: filters.sort, // 'name', 'popularity', 'calories'
    limit: filters.limit,
    dietary_filters: filters.dietaryRestrictions
  }
  
  const response = await api.get('/foods/search', { params })
  return response.data
}
```

### **Enhanced Food Logging** (`pages/FoodLogEnhanced.tsx`)
**Purpose**: Primary food logging interface with smart features

#### **Smart Features**:
- **Recent Foods**: Quick access to frequently logged items
- **Favorites Integration**: One-tap logging from favorites
- **Auto-Complete**: Intelligent search suggestions
- **Nutrition Preview**: Real-time nutrition calculation
- **Meal Type Detection**: Smart meal type suggestions based on time
- **Voice Input**: Speech-to-text food entry (future feature)

#### **Quick Logging Flow**:
```typescript
const quickLogFood = async (food: FoodItem, amount: number, mealType: string) => {
  const nutrition = calculateNutrition(food.nutrition, amount)
  
  const logData = {
    date: getCurrentDate(),
    meal_type: mealType,
    food_id: food.id,
    food_name: food.name,
    amount: amount,
    unit: food.serving_unit,
    nutrition: nutrition
  }
  
  await api.post('/food-logs/', logData)
  
  // Update recent foods cache
  await updateRecentFoods(food)
  
  // Trigger UI updates
  showSuccessToast(`${food.name} logged successfully!`)
}
```

### **Advanced Favorites System** (`user_favorites.py` backend)
**Purpose**: Sophisticated favorites management with analytics

#### **Data Model**:
```python
class UserFavorite(BaseModel):
    id: str
    user_id: str
    food_id: str
    food_name: str
    custom_name: Optional[str] = None
    category: FavoriteCategory  # breakfast, lunch, dinner, snack, general
    default_serving_size: Optional[float] = None
    default_serving_unit: Optional[str] = None
    tags: List[str] = []
    notes: Optional[str] = None
    usage_count: int = 0
    last_used: Optional[datetime] = None
    nutrition: Optional[NutritionInfo] = None
    dietary_attributes: Optional[DietaryAttributes] = None
    created_at: datetime
    updated_at: datetime
```

#### **Advanced Features**:
- **Custom Names**: Personalized food names ("My Post-Workout Shake")
- **Category Organization**: Organize by meal type for quick access
- **Usage Analytics**: Track frequency and recency of use
- **Smart Tags**: User-defined tags for flexible organization
- **Default Serving Sizes**: Remember preferred portions
- **Search & Filtering**: Advanced search by name, tags, category

---

## 🍽️ **Meal Planning & Analytics**

### **AI Meal Planning** (`pages/MealPlans.tsx`)
**Purpose**: Comprehensive meal planning with AI-powered generation

#### **Core Features**:
- **AI Plan Generation**: Claude-powered meal plan creation
- **Manual Plan Editing**: Full control over meal modifications
- **Nutrition Optimization**: Automatic macro balancing
- **Shopping List Generation**: Automated grocery lists from meal plans
- **Template System**: Save and reuse successful meal plans
- **Progress Tracking**: Monitor adherence to meal plans

#### **AI Generation Process**:
```typescript
const generateMealPlan = async (planData: MealPlanRequest) => {
  // Calculate macro targets from percentages
  const calories = planData.calories_per_day || 2000
  const proteinGrams = Math.round((calories * planData.protein_percent / 100) / 4)
  const carbsGrams = Math.round((calories * planData.carbs_percent / 100) / 4)
  const fatGrams = Math.round((calories * planData.fat_percent / 100) / 9)

  const requestData = {
    ...planData,
    protein_target: proteinGrams,
    carbs_target: carbsGrams,
    fat_target: fatGrams,
    dietary_preferences: await getUserDietaryPreferences(),
    food_preferences: await getUserFoodHistory(),
    allergens: await getUserAllergens()
  }

  const response = await api.post('/meal-planning/generate', requestData)
  return response.data
}
```

#### **Shopping List Generator**:
```typescript
interface ShoppingListItem {
  name: string
  category: string
  total_amount: number
  unit: string
  estimated_cost?: number
  notes?: string
}

const generateShoppingList = (mealPlan: MealPlan, selectedDays: number[]) => {
  const ingredientMap = new Map<string, ShoppingListItem>()
  
  selectedDays.forEach(dayNumber => {
    const day = mealPlan.days.find(d => d.day_number === dayNumber)
    day?.meals.forEach(meal => {
      // Aggregate ingredients by name and category
      meal.ingredients?.forEach(ingredient => {
        const key = `${ingredient.name}-${ingredient.unit}`
        if (ingredientMap.has(key)) {
          ingredientMap.get(key)!.total_amount += ingredient.amount
        } else {
          ingredientMap.set(key, {
            name: ingredient.name,
            category: categorizeIngredient(ingredient.name),
            total_amount: ingredient.amount,
            unit: ingredient.unit
          })
        }
      })
    })
  })
  
  return Array.from(ingredientMap.values())
}
```

### **Manual Meal Planner** (`pages/ManualMealPlanner.tsx`)
**Purpose**: Detailed manual meal planning with full customization

#### **Features**:
- **Day-by-Day Planning**: Individual meal management for each day
- **Drag & Drop Interface**: Intuitive meal arrangement
- **Copy Days**: Duplicate successful day plans
- **Template System**: Save custom templates
- **Nutrition Tracking**: Real-time nutrition calculations
- **Meal Plan Analytics**: Detailed nutritional analysis

### **Analytics Dashboard** (`pages/Analytics.tsx`)
**Purpose**: Comprehensive nutrition and health analytics

#### **Analytics Categories**:

**Nutrition Analytics**:
- Daily/weekly/monthly nutrition summaries
- Macro distribution trends
- Nutrient gap analysis
- Meal timing patterns
- Food variety scoring

**Progress Analytics**:
- Weight trends with BMI calculations
- Goal achievement tracking
- Health score progression
- Hydration patterns
- Exercise correlation (future)

**Behavioral Analytics**:
- Meal logging consistency
- Food choice patterns
- Restaurant vs. home cooking ratios
- Seasonal eating trends

#### **Data Visualization**:
```typescript
interface AnalyticsChart {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  data: ChartDataPoint[]
  config: ChartConfiguration
  insights: AnalyticsInsight[]
}

const generateNutritionTrends = (logs: FoodLog[], period: 'week' | 'month') => {
  const groupedData = groupLogsByPeriod(logs, period)
  
  return {
    calories: createTrendData(groupedData, 'calories'),
    macros: createMacroDistributionData(groupedData),
    goals: createGoalProgressData(groupedData),
    insights: generateTrendInsights(groupedData)
  }
}
```

---

## 🎨 **User Interface Components**

### **Navigation System**

#### **NavBar** (`components/ui/NavBar.tsx`)
**Features**:
- **Responsive Design**: Desktop sidebar, mobile drawer
- **Active State Management**: Visual indication of current page
- **User Profile Integration**: Avatar, name, logout functionality
- **Quick Actions**: Direct access to key features
- **Search Integration**: Global food search from navigation

#### **Mobile Bottom Navigation** (`components/ui/MobileBottomNav.tsx`)
**Features**:
- **Touch-Optimized**: Large touch targets for mobile use
- **Badge Notifications**: Unread counts and status indicators
- **Gesture Support**: Swipe navigation between tabs

### **Form Components**

#### **Day Selector** (`components/ui/DaySelector.tsx`)
**Purpose**: Unified date selection across the application
```typescript
interface DaySelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
  isDisabled?: boolean
  allowFuture?: boolean
  maxPastDays?: number
}
```

#### **Macro Distribution Slider** (`components/ui/MacroDistributionSlider.tsx`)
**Purpose**: Interactive macro percentage adjustment
```typescript
const MacroDistributionSlider = ({ 
  protein, carbs, fat, 
  onChange, 
  showLabels = true 
}) => {
  const handleProteinChange = (value: number) => {
    const remaining = 100 - value
    const carbsRatio = carbs / (carbs + fat)
    const newCarbs = Math.round(remaining * carbsRatio)
    const newFat = remaining - newCarbs
    
    onChange({ protein: value, carbs: newCarbs, fat: newFat })
  }
}
```

### **Data Display Components**

#### **Enhanced Shopping List** (`components/ui/EnhancedShoppingList.tsx`)
**Features**:
- **Category Organization**: Grouped by food category
- **Check-off Functionality**: Mark items as purchased
- **Cost Estimation**: Price predictions for budgeting
- **Store Optimization**: Organize by store layout
- **Share Functionality**: Export to shopping apps

#### **Progress Charts** (`components/analytics/ProgressCharts.tsx`)
**Purpose**: Reusable chart components for analytics
```typescript
interface ChartProps {
  data: ChartData
  type: 'line' | 'bar' | 'pie' | 'area'
  height?: number
  showLegend?: boolean
  responsive?: boolean
  onDataPointClick?: (point: DataPoint) => void
}
```

### **Modal System**

#### **Food Detail Modal** (`components/food/FoodDetailModal.tsx`)
**Features**:
- **Comprehensive Nutrition**: Full nutrition panel
- **Serving Size Calculator**: Interactive portion control
- **Favorites Integration**: Add/remove from favorites
- **Dietary Information**: Allergen and dietary attribute display
- **Action Buttons**: Quick log, add to meal plan, edit

---

## 🚀 **Advanced Features**

### **Progressive Web App (PWA)**

#### **PWA Configuration**:
```typescript
// PWA features
{
  "name": "Nutrivize V2",
  "short_name": "Nutrivize",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#4CAF50",
  "background_color": "#ffffff",
  "start_url": "/",
  "scope": "/",
  "categories": ["health", "lifestyle", "nutrition"]
}
```

#### **Offline Functionality**:
- **Service Worker**: Cache key resources for offline access
- **Data Sync**: Queue actions when offline, sync when online
- **Offline Indicators**: Visual feedback for connection status

### **Real-Time Features**

#### **Live Nutrition Tracking**:
```typescript
const useRealTimeNutrition = (date: string) => {
  const [nutrition, setNutrition] = useState<DailyNutrition>()
  
  useEffect(() => {
    const updateNutrition = async () => {
      const response = await api.get(`/food-logs/daily/${date}`)
      setNutrition(response.data)
    }
    
    // Initial load
    updateNutrition()
    
    // Set up real-time updates
    const interval = setInterval(updateNutrition, 30000) // Every 30 seconds
    
    return () => clearInterval(interval)
  }, [date])
  
  return nutrition
}
```

### **Smart Recommendations**

#### **AI-Powered Food Suggestions**:
```typescript
const getSmartRecommendations = async (context: RecommendationContext) => {
  const recommendations = await api.post('/ai/recommendations', {
    meal_type: context.mealType,
    current_nutrition: context.dailyNutrition,
    user_preferences: context.preferences,
    recent_foods: context.recentFoods,
    time_of_day: context.timeOfDay,
    weather: context.weather, // Future feature
    mood: context.mood // Future feature
  })
  
  return recommendations.data.suggestions
}
```

### **Data Export & Import**

#### **Export Functionality**:
```typescript
const exportUserData = async (format: 'json' | 'csv' | 'pdf', dateRange: DateRange) => {
  const response = await api.get('/analytics/export', {
    params: {
      format,
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    },
    responseType: format === 'pdf' ? 'blob' : 'json'
  })
  
  if (format === 'pdf') {
    // Handle PDF download
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nutrivize-report-${dateRange.startDate}-${dateRange.endDate}.pdf`
    link.click()
  } else {
    // Handle JSON/CSV download
    const dataStr = JSON.stringify(response.data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `nutrivize-data-${dateRange.startDate}-${dateRange.endDate}.${format}`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
}
```

---

## 📊 **Data Management**

### **State Management Architecture**

#### **Context Providers**:
```typescript
// AuthContext - Firebase authentication
interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: ProfileUpdate) => Promise<void>
}

// AppStateContext - Global application state
interface AppStateContextType {
  currentDate: string
  selectedMealType: string
  navigationHistory: string[]
  preferences: UserPreferences
  setCurrentDate: (date: string) => void
  setSelectedMealType: (type: string) => void
  updatePreferences: (prefs: Partial<UserPreferences>) => void
}

// FoodIndexContext - Food database management
interface FoodIndexContextType {
  foods: FoodItem[]
  favorites: UserFavorite[]
  recentFoods: FoodItem[]
  loading: boolean
  error: string | null
  searchFoods: (query: string) => Promise<FoodItem[]>
  addFavorite: (foodId: string) => Promise<void>
  removeFavorite: (foodId: string) => Promise<void>
  refreshIndex: () => Promise<void>
}
```

### **Caching Strategy**

#### **Local Storage Management**:
```typescript
class CacheManager {
  private static readonly CACHE_KEYS = {
    RECENT_FOODS: 'nutrivize_recent_foods',
    USER_PREFERENCES: 'nutrivize_preferences',
    FOOD_FAVORITES: 'nutrivize_favorites',
    NUTRITION_GOALS: 'nutrivize_goals'
  }
  
  static setCache<T>(key: string, data: T, expiryMinutes: number = 60): void {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (expiryMinutes * 60 * 1000)
    }
    localStorage.setItem(key, JSON.stringify(cacheData))
  }
  
  static getCache<T>(key: string): T | null {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    
    const cacheData = JSON.parse(cached)
    if (Date.now() > cacheData.expiry) {
      localStorage.removeItem(key)
      return null
    }
    
    return cacheData.data
  }
  
  static invalidateCache(key: string): void {
    localStorage.removeItem(key)
  }
}
```

### **Data Synchronization**

#### **Optimistic Updates**:
```typescript
const useOptimisticUpdate = <T>(
  apiCall: () => Promise<T>,
  updateLocalState: (data: T) => void,
  revertLocalState: () => void
) => {
  return async () => {
    try {
      // Apply optimistic update
      updateLocalState(expectedResult)
      
      // Make API call
      const result = await apiCall()
      
      // Confirm with actual result
      updateLocalState(result)
      
      return result
    } catch (error) {
      // Revert on error
      revertLocalState()
      throw error
    }
  }
}
```

---

## 🔗 **Integration Patterns**

### **API Integration**

#### **API Client Configuration**:
```typescript
class APIClient {
  private axiosInstance: AxiosInstance
  
  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    this.setupInterceptors()
  }
  
  private setupInterceptors() {
    // Request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await getFirebaseToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
    
    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token expiry
          await refreshFirebaseToken()
          return this.axiosInstance.request(error.config)
        }
        return Promise.reject(error)
      }
    )
  }
}
```

### **Component Communication**

#### **Event System**:
```typescript
class EventBus {
  private events: Map<string, Function[]> = new Map()
  
  on(event: string, callback: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }
  
  emit(event: string, data?: any) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }
  
  off(event: string, callback: Function) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
}

// Usage example
const eventBus = new EventBus()

// Component A emits food logged event
eventBus.emit('food_logged', { foodId: '123', nutrition: {...} })

// Component B listens for food logged events
useEffect(() => {
  const handleFoodLogged = (data: FoodLoggedEvent) => {
    updateNutritionSummary(data.nutrition)
  }
  
  eventBus.on('food_logged', handleFoodLogged)
  
  return () => eventBus.off('food_logged', handleFoodLogged)
}, [])
```

### **Performance Optimization**

#### **React Optimization Patterns**:
```typescript
// Memoized components for expensive renders
const ExpensiveNutritionChart = React.memo(({ data, period }: ChartProps) => {
  const chartData = useMemo(() => 
    processNutritionData(data, period), 
    [data, period]
  )
  
  return <Chart data={chartData} />
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return prevProps.data.length === nextProps.data.length &&
         prevProps.period === nextProps.period
})

// Debounced search
const useDebounced = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

// Usage in search component
const SearchComponent = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounced(searchQuery, 300)
  
  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      searchFoods(debouncedQuery)
    }
  }, [debouncedQuery])
}
```

---

This comprehensive component and feature documentation covers the architecture, implementation details, and integration patterns of all major Nutrivize V2 components. Each feature is built with modularity, performance, and user experience in mind, creating a cohesive and powerful nutrition tracking application.
