# 🤖 AI-Powered Features - Comprehensive Documentation

## 📋 **Table of Contents**
- [Overview](#overview)
- [AI Dashboard](#ai-dashboard)
- [AI Chat Assistant](#ai-chat-assistant)
- [AI Health Score](#ai-health-score)
- [Restaurant AI](#restaurant-ai)
- [AI Meal Planning](#ai-meal-planning)
- [Smart Insights](#smart-insights)
- [Technical Implementation](#technical-implementation)

---

## 🎯 **Overview**

Nutrivize V2 leverages **Anthropic Claude AI** to provide intelligent, personalized nutrition guidance throughout the user experience. The AI features are designed to understand user context, provide actionable insights, and continuously learn from user behavior.

### **Core AI Capabilities**
- 🧠 **Contextual Understanding**: AI considers user history, preferences, and goals
- 📊 **Real-time Analysis**: Instant nutrition insights and recommendations
- 🎯 **Personalized Coaching**: Tailored advice based on individual needs
- 🍽️ **Meal Planning**: AI-generated meal plans with optimization
- 📱 **Conversational Interface**: Natural language interaction for guidance
- 📈 **Health Assessment**: Multi-factor health scoring and tracking

---

## 🏠 **AI Dashboard**

### **Purpose**
The AI Dashboard serves as the central hub where users get an intelligent overview of their nutrition, health metrics, and personalized recommendations in a single, intuitive interface.

### **Core Use Cases**
1. **Quick Health Assessment**: Instant view of current nutrition status
2. **Smart Recommendations**: AI-powered suggestions for improving health
3. **Goal Progress Monitoring**: Intelligent tracking of nutrition and health goals
4. **Action Planning**: AI-suggested next steps for better nutrition

### **How It Works**

#### **Smart Nutrition Summary**
```typescript
interface SmartNutritionSummary {
  calories: {
    consumed: number
    target: number
    remaining: number
    aiInsight: string // e.g., "Great progress! Consider a protein-rich snack"
  }
  macros: {
    protein: MacroAnalysis
    carbs: MacroAnalysis
    fat: MacroAnalysis
    aiBalance: string // AI assessment of macro balance
  }
  micronutrients: {
    deficiencies: string[]
    recommendations: string[]
  }
  healthScore: number // 0-100 AI-calculated score
}
```

#### **AI Insights Generation**
The dashboard analyzes multiple data points:
- Current day nutrition intake
- Historical patterns (last 7-30 days)
- User goals and preferences
- Meal timing and frequency
- Hydration levels
- Weight trends

#### **Real-World Example**
```typescript
// Morning Dashboard View
const morningInsights = {
  message: "Good morning! You're starting the day strong with 82% of yesterday's goals met.",
  recommendations: [
    "Consider a protein-rich breakfast to maintain muscle synthesis",
    "Your iron levels have been low this week - try spinach or lean red meat",
    "Hydration was excellent yesterday - keep it up!"
  ],
  quickActions: [
    { type: "log_breakfast", suggestion: "Greek yogurt with berries (based on your preferences)" },
    { type: "water_reminder", target: "16oz in the next hour" },
    { type: "meal_plan", message: "Your meal plan suggests overnight oats today" }
  ]
}
```

### **Technical Implementation**

#### **Health Score Calculator**
```python
class HealthScoreCalculator:
    def calculate_comprehensive_score(self, user_data: UserHealthData) -> HealthScore:
        """
        Multi-dimensional health assessment
        """
        # Nutrition Balance (40% weight)
        nutrition_score = self._analyze_nutrition_balance(user_data.nutrition_logs)
        
        # Goal Adherence (25% weight)
        goal_score = self._calculate_goal_adherence(user_data.goals, user_data.progress)
        
        # Consistency (20% weight)
        consistency_score = self._analyze_logging_consistency(user_data.activity_logs)
        
        # Variety (15% weight)
        variety_score = self._analyze_food_variety(user_data.food_history)
        
        overall_score = (
            nutrition_score * 0.4 +
            goal_score * 0.25 +
            consistency_score * 0.2 +
            variety_score * 0.15
        )
        
        return HealthScore(
            overall=round(overall_score),
            breakdown={
                "nutrition": nutrition_score,
                "goals": goal_score,
                "consistency": consistency_score,
                "variety": variety_score
            },
            insights=self._generate_insights(overall_score, user_data),
            recommendations=self._generate_recommendations(overall_score, user_data)
        )
```

---

## 💬 **AI Chat Assistant**

### **Purpose**
The AI Chat Assistant provides conversational nutrition guidance, answering questions, analyzing food choices, and offering personalized meal suggestions through natural language interaction.

### **Core Use Cases**
1. **Nutrition Questions**: "Is this meal healthy for my goals?"
2. **Meal Planning Help**: "What should I eat for dinner tonight?"
3. **Goal Guidance**: "How can I increase my protein intake?"
4. **Food Analysis**: "Analyze my nutrition for this week"
5. **Recipe Suggestions**: "Give me a high-protein breakfast recipe"

### **How It Works**

#### **Context-Aware Responses**
```typescript
interface ChatContext {
  user_profile: {
    goals: string[]
    dietary_preferences: string[]
    allergens: string[]
    activity_level: string
  }
  current_nutrition: {
    today_intake: NutritionSummary
    weekly_average: NutritionSummary
    goal_progress: GoalProgress[]
  }
  recent_foods: FoodItem[]
  meal_history: MealLog[]
  active_meal_plan?: MealPlan
}
```

#### **Response Types**
```typescript
interface ChatResponse {
  message: string
  response_type: 'advice' | 'recommendation' | 'analysis' | 'recipe' | 'meal_plan'
  attachments?: {
    food_recommendations?: FoodItem[]
    meal_suggestions?: MealSuggestion[]
    nutrition_analysis?: NutritionBreakdown
    recipes?: Recipe[]
  }
  follow_up_questions?: string[]
  action_buttons?: ActionButton[]
}
```

### **Real-World Examples**

#### **Nutrition Analysis Request**
```
User: "How did I do with nutrition yesterday?"

AI Response: "Yesterday was a solid day! Here's your breakdown:

✅ Calories: 1,847/1,800 (103% - right on target!)
✅ Protein: 142g/120g (118% - excellent for muscle maintenance)
⚠️ Fiber: 18g/25g (72% - room for improvement)
❌ Sodium: 2,890mg/2,300mg (126% - a bit high)

Highlights:
- Great protein distribution throughout the day
- Loved that you had salmon for dinner - omega-3s were on point!
- Vegetables could use a boost - try adding spinach to your morning smoothie

Quick improvement: Swap your afternoon crackers for an apple. You'll get 4g more fiber and reduce sodium by 200mg!"

Attachments: [Detailed nutrition chart, fiber-rich snack suggestions]
```

#### **Meal Planning Request**
```
User: "I need a quick dinner idea. I have chicken breast and not much time."

AI Response: "Perfect! Based on your preferences and the fact that you're 15g short on protein today, here's a 20-minute winner:

🍗 Garlic Herb Chicken with Quick Quinoa

Why it's perfect for you:
- 35g protein (gets you to your daily goal!)
- Uses your chicken breast
- Ready in 18 minutes
- Fits your Mediterranean preferences

Would you like the full recipe, or should I suggest sides to complete your macros?"

Action Buttons: [Get Recipe] [Find Sides] [Log This Meal]
```

### **Technical Implementation**

#### **Claude Integration**
```python
async def generate_ai_response(message: str, context: ChatContext) -> ChatResponse:
    """
    Generate contextual AI response using Claude
    """
    # Build comprehensive prompt with user context
    prompt = f"""
    You are a nutrition expert helping {context.user_profile.name}.
    
    User Context:
    - Goals: {', '.join(context.user_profile.goals)}
    - Dietary preferences: {', '.join(context.user_profile.dietary_preferences)}
    - Today's nutrition: {context.current_nutrition.today_intake}
    - Recent foods: {[food.name for food in context.recent_foods[-5:]]}
    
    User message: "{message}"
    
    Provide helpful, personalized nutrition advice. Include specific recommendations based on their current intake and goals.
    """
    
    response = await anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    # Parse response and add structured data
    return ChatResponse(
        message=response.content[0].text,
        response_type=determine_response_type(response.content[0].text),
        attachments=generate_attachments(message, context),
        follow_up_questions=generate_follow_ups(context)
    )
```

---

## 🏥 **AI Health Score**

### **Purpose**
The AI Health Score provides a comprehensive, data-driven assessment of overall nutritional health, combining multiple factors into a single, actionable score from 0-100.

### **Core Use Cases**
1. **Health Monitoring**: Track overall nutrition health over time
2. **Goal Setting**: Understand which areas need improvement
3. **Progress Tracking**: See how lifestyle changes impact health
4. **Motivation**: Gamified health improvement with clear metrics

### **How It Works**

#### **Multi-Factor Analysis**
The health score considers six key dimensions:

1. **Nutrition Balance (40% weight)**
   - Macro distribution vs. recommendations
   - Micronutrient adequacy
   - Calorie balance

2. **Goal Adherence (25% weight)**
   - Consistency with set nutrition goals
   - Progress toward weight/fitness targets
   - Meal timing adherence

3. **Food Quality (15% weight)**
   - Whole food vs. processed food ratio
   - Dietary diversity
   - Nutrient density of choices

4. **Consistency (10% weight)**
   - Regular logging habits
   - Meal frequency patterns
   - Sleep-nutrition timing

5. **Hydration (5% weight)**
   - Daily water intake vs. needs
   - Timing of hydration

6. **Lifestyle Integration (5% weight)**
   - Meal timing with activity
   - Social eating patterns
   - Stress eating indicators

### **Real-World Examples**

#### **High Score (85-100): "Excellent"**
```typescript
const excellentHealthProfile = {
  score: 92,
  message: "Outstanding nutrition habits! You're in the top 10% of users.",
  strengths: [
    "Consistent macro balance for 14 days straight",
    "Excellent micronutrient diversity",
    "Perfect meal timing with your workout schedule",
    "Great hydration habits"
  ],
  improvements: [
    "Consider adding more omega-3 rich foods 2x per week",
    "Your weekend fiber intake dips slightly - plan ahead"
  ],
  motivation: "You're setting an amazing example! Keep this momentum."
}
```

#### **Moderate Score (60-84): "Good Progress"**
```typescript
const goodHealthProfile = {
  score: 74,
  message: "You're making solid progress with room for optimization.",
  strengths: [
    "Protein goals consistently met",
    "Good food logging consistency",
    "Improved vegetable intake this month"
  ],
  improvements: [
    "Sodium intake is 40% above recommended levels",
    "Try to add 2 more servings of fruits daily",
    "Consider meal prep to improve weekend nutrition"
  ],
  actionPlan: [
    "Week 1: Focus on reducing processed foods",
    "Week 2: Add a fruit to breakfast and lunch",
    "Week 3: Prep healthy weekend meals"
  ]
}
```

### **Technical Implementation**

#### **Score Calculation Algorithm**
```python
class EnhancedHealthScoreCalculator:
    def __init__(self):
        self.weights = {
            'nutrition_balance': 0.40,
            'goal_adherence': 0.25,
            'food_quality': 0.15,
            'consistency': 0.10,
            'hydration': 0.05,
            'lifestyle': 0.05
        }
    
    def calculate_nutrition_balance(self, logs: List[FoodLog]) -> float:
        """Calculate nutrition balance score (0-100)"""
        recent_logs = logs[-7:]  # Last 7 days
        
        # Macro balance analysis
        macro_score = self._analyze_macro_distribution(recent_logs)
        
        # Micronutrient adequacy
        micro_score = self._analyze_micronutrients(recent_logs)
        
        # Calorie consistency
        calorie_score = self._analyze_calorie_consistency(recent_logs)
        
        return (macro_score * 0.4 + micro_score * 0.4 + calorie_score * 0.2)
    
    def calculate_food_quality(self, logs: List[FoodLog]) -> float:
        """Assess food quality and diversity"""
        # Processed vs whole food ratio
        processing_score = self._analyze_food_processing(logs)
        
        # Food diversity (unique foods per week)
        diversity_score = self._analyze_food_diversity(logs)
        
        # Nutrient density
        density_score = self._analyze_nutrient_density(logs)
        
        return (processing_score + diversity_score + density_score) / 3
```

---

## 🍽️ **Restaurant AI**

### **Purpose**
Restaurant AI analyzes restaurant menus and provides intelligent recommendations based on user preferences, dietary restrictions, and nutrition goals, making dining out healthier and more aligned with user objectives.

### **Core Use Cases**
1. **Menu Analysis**: Upload/scan restaurant menus for AI analysis
2. **Healthy Recommendations**: Get personalized suggestions from any menu
3. **Nutrition Estimation**: Estimate calories and macros for restaurant items
4. **Dietary Filtering**: Find options that match dietary restrictions
5. **Goal Alignment**: Choose meals that support nutrition goals

### **How It Works**

#### **Menu Input Methods**
```typescript
interface MenuAnalysisInput {
  source_type: 'url' | 'image' | 'pdf' | 'text'
  source_data: string | File[]
  restaurant_info: {
    name: string
    cuisine_type?: string
    location?: string
  }
  user_context: {
    dietary_preferences: string[]
    allergens: string[]
    current_goals: string[]
    daily_nutrition_status: NutritionSummary
  }
}
```

#### **AI Analysis Process**
1. **Content Extraction**: OCR/text parsing of menu items
2. **Item Classification**: Categorize foods by type and cooking method
3. **Nutrition Estimation**: AI-powered calorie and macro estimation
4. **Preference Matching**: Score items against user preferences
5. **Recommendation Ranking**: Prioritize options by health and preference alignment

### **Real-World Examples**

#### **Italian Restaurant Analysis**
```
User uploads menu from "Tony's Italian Kitchen"

AI Analysis Results:
📊 Menu Overview: 47 items analyzed
🥗 Healthy Options: 12 items match your goals
⚠️ Caution Items: 8 items exceed daily sodium targets
🚫 Avoid: 3 items contain shellfish (your allergen)

Top Recommendations for your goals (muscle gain, 1,800 cal/day):

1. ⭐ Grilled Chicken Parmigiana (Modified)
   📊 Est: 420 cal, 45g protein, 12g carbs, 18g fat
   💡 Ask for: Sauce on side, extra vegetables
   ✅ Perfect protein boost for your evening workout

2. ⭐ Zucchini Noodles with Meat Sauce
   📊 Est: 350 cal, 28g protein, 15g carbs, 16g fat
   💡 Why it's great: Low-carb option, fits your macro targets
   ✅ High protein, lots of veggies

3. ⭐ Caesar Salad + Grilled Salmon (Add-on)
   📊 Est: 580 cal, 40g protein, 8g carbs, 42g fat
   💡 Modification: Light dressing, no croutons
   ✅ Omega-3s + your daily protein goal
```

#### **Technical Implementation**
```python
class RestaurantAIAnalyzer:
    async def analyze_menu(self, input_data: MenuAnalysisInput) -> MenuAnalysis:
        # Extract menu items
        items = await self._extract_menu_items(input_data)
        
        # AI nutrition estimation
        estimated_nutrition = await self._estimate_nutrition(items)
        
        # Score against user preferences
        recommendations = await self._generate_recommendations(
            items, 
            estimated_nutrition, 
            input_data.user_context
        )
        
        return MenuAnalysis(
            restaurant_name=input_data.restaurant_info.name,
            total_items=len(items),
            healthy_options=len([r for r in recommendations if r.score >= 80]),
            recommendations=recommendations[:10],  # Top 10
            warnings=self._generate_warnings(items, input_data.user_context)
        )
```

---

## 🍽️ **AI Meal Planning**

### **Purpose**
AI Meal Planning creates personalized, nutrition-optimized meal plans that consider user preferences, goals, dietary restrictions, and lifestyle factors while ensuring variety and practicality.

### **Core Use Cases**
1. **Automated Planning**: Generate complete meal plans for 1-30 days
2. **Goal Optimization**: Plans tailored to specific nutrition/fitness goals
3. **Preference Integration**: Respect food likes/dislikes and restrictions
4. **Shopping Lists**: Auto-generate grocery lists from meal plans
5. **Adaptive Planning**: Adjust plans based on user feedback and adherence

### **How It Works**

#### **AI Planning Process**
```typescript
interface MealPlanGenerationRequest {
  duration_days: number // 1-30
  daily_calories: number
  macro_distribution: {
    protein_percent: number
    carbs_percent: number
    fat_percent: number
  }
  dietary_preferences: string[]
  allergens: string[]
  meal_preferences: {
    breakfast_style: string // "quick" | "hearty" | "light"
    lunch_style: string
    dinner_style: string
    snacks_per_day: number
  }
  lifestyle_factors: {
    cooking_time_available: number // minutes per day
    skill_level: "beginner" | "intermediate" | "advanced"
    budget_range: "low" | "medium" | "high"
  }
}
```

### **Real-World Examples**

#### **7-Day Muscle Building Plan**
```
User: 25-year-old male, 180lb, goal: muscle gain
Daily targets: 2,400 calories, 180g protein, 300g carbs, 80g fat

AI Generated Plan Highlights:

Day 1 - Monday (Prep Day):
🍳 Breakfast: Protein pancakes with berries (520 cal, 35g protein)
🥙 Lunch: Chicken quinoa bowl with roasted vegetables (580 cal, 42g protein)
🍽️ Dinner: Lean beef stir-fry with brown rice (680 cal, 45g protein)
🥜 Snacks: Greek yogurt + almonds, protein smoothie (620 cal, 58g protein)

Why this plan works for you:
✅ Protein distributed evenly (30-45g per meal)
✅ Pre/post-workout nutrition optimized
✅ 2-3 hours meal prep on Sunday covers 70% of week
✅ Shopping list focuses on 15 core ingredients

Adaptations made:
- No fish (per your preferences)
- High-protein breakfast before 7am workouts
- Quick lunch options for work days
- One-pot dinners to minimize cleanup time
```

#### **Technical Implementation**
```python
class AIMealPlanGenerator:
    async def generate_meal_plan(self, request: MealPlanRequest) -> MealPlan:
        # Calculate macro targets
        daily_protein = (request.daily_calories * request.macro_distribution.protein_percent / 100) / 4
        daily_carbs = (request.daily_calories * request.macro_distribution.carbs_percent / 100) / 4
        daily_fat = (request.daily_calories * request.macro_distribution.fat_percent / 100) / 9
        
        # Get user food preferences and history
        user_foods = await self._get_user_food_preferences(request.user_id)
        
        # Generate AI prompt with constraints
        prompt = self._build_meal_plan_prompt(
            request, daily_protein, daily_carbs, daily_fat, user_foods
        )
        
        # AI generation
        raw_plan = await self._call_claude_for_meal_plan(prompt)
        
        # Validate and optimize
        validated_plan = await self._validate_nutrition_targets(raw_plan, request)
        
        # Generate shopping list
        shopping_list = await self._generate_shopping_list(validated_plan)
        
        return MealPlan(
            plan_id=generate_plan_id(),
            days=validated_plan.days,
            shopping_list=shopping_list,
            nutrition_summary=self._calculate_plan_nutrition(validated_plan),
            adherence_tips=await self._generate_adherence_tips(validated_plan, request)
        )
```

---

## 🧠 **Smart Insights**

### **Purpose**
Smart Insights provide proactive, data-driven observations and recommendations based on user patterns, helping users understand their nutrition habits and optimize their health journey.

### **Types of Insights**

#### **Pattern Recognition**
```typescript
interface NutritionPattern {
  pattern_type: 'weekday_vs_weekend' | 'meal_timing' | 'stress_eating' | 'seasonal'
  description: string
  confidence: number // 0-100
  impact: 'positive' | 'negative' | 'neutral'
  recommendation: string
  data_points: number
}

// Example: Weekend Pattern Detection
const weekendPattern = {
  pattern_type: 'weekday_vs_weekend',
  description: 'Your weekend calorie intake averages 400 calories higher than weekdays',
  confidence: 87,
  impact: 'negative',
  recommendation: 'Plan weekend meals in advance or allow flexibility in weekday calories',
  data_points: 12 // weeks of data
}
```

#### **Predictive Insights**
```typescript
interface PredictiveInsight {
  prediction_type: 'goal_timeline' | 'nutrient_deficiency' | 'habit_formation'
  message: string
  probability: number
  timeline: string
  prevention_actions: string[]
}

// Example: Nutrient Deficiency Prediction
const ironDeficiencyRisk = {
  prediction_type: 'nutrient_deficiency',
  message: 'Based on current intake patterns, you may develop iron deficiency in 3-4 weeks',
  probability: 78,
  timeline: '3-4 weeks',
  prevention_actions: [
    'Add lean red meat 2x per week',
    'Include spinach or kale in daily meals',
    'Consider iron supplements after consulting healthcare provider'
  ]
}
```

### **Technical Implementation**

#### **Pattern Analysis Engine**
```python
class SmartInsightsEngine:
    def __init__(self):
        self.analyzers = [
            WeekdayWeekendAnalyzer(),
            MealTimingAnalyzer(), 
            MacroBalanceAnalyzer(),
            StreakAnalyzer(),
            SeasonalAnalyzer()
        ]
    
    async def generate_insights(self, user_data: UserNutritionData) -> List[Insight]:
        insights = []
        
        for analyzer in self.analyzers:
            if analyzer.has_sufficient_data(user_data):
                pattern = await analyzer.analyze(user_data)
                if pattern.confidence >= 70:  # High confidence threshold
                    insight = await self._convert_to_insight(pattern, user_data)
                    insights.append(insight)
        
        return sorted(insights, key=lambda x: x.priority, reverse=True)
    
    async def _convert_to_insight(self, pattern: Pattern, user_data: UserNutritionData) -> Insight:
        # Use AI to generate human-readable insights
        prompt = f"""
        Convert this nutrition pattern into a helpful insight for the user:
        Pattern: {pattern.description}
        User Goals: {user_data.goals}
        Confidence: {pattern.confidence}%
        
        Provide a clear, actionable insight that helps them improve their nutrition.
        """
        
        ai_response = await self.claude_client.generate(prompt)
        
        return Insight(
            title=pattern.title,
            message=ai_response.insight,
            recommendations=ai_response.recommendations,
            confidence=pattern.confidence,
            category=pattern.category
        )
```

---

## 🔧 **Technical Implementation**

### **AI Service Architecture**
```python
class AIServiceManager:
    def __init__(self):
        self.claude_client = AnthropicClient()
        self.context_manager = UserContextManager()
        self.cache = AIResponseCache()
    
    async def get_contextualized_response(
        self, 
        query: str, 
        user_id: str, 
        response_type: str
    ) -> AIResponse:
        # Build comprehensive user context
        context = await self.context_manager.build_context(user_id)
        
        # Check cache for similar queries
        cached_response = await self.cache.get_cached_response(query, context.hash())
        if cached_response and cached_response.is_valid():
            return cached_response
        
        # Generate new AI response
        response = await self._generate_ai_response(query, context, response_type)
        
        # Cache for future use
        await self.cache.store_response(query, context.hash(), response)
        
        return response
```

### **Performance Optimization**
- **Response Caching**: Cache similar queries to reduce API calls
- **Context Compression**: Efficient user context summarization
- **Batch Processing**: Group multiple AI requests when possible
- **Streaming Responses**: Real-time response delivery for chat interface
- **Fallback Handling**: Graceful degradation when AI service is unavailable

### **Quality Assurance**
- **Response Validation**: Ensure AI responses are accurate and helpful
- **Safety Filters**: Remove potentially harmful or incorrect nutrition advice
- **Consistency Checks**: Maintain consistent recommendations across features
- **User Feedback Integration**: Learn from user ratings and corrections

---

This comprehensive AI documentation covers all AI-powered features in Nutrivize V2, providing clear use cases, technical implementation details, and real-world examples for each functionality.
