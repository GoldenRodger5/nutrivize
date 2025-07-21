# 🍽️ Food Logging & Management - Comprehensive Documentation

## 📋 **Table of Contents**
- [Overview](#overview)
- [Food Search & Discovery](#food-search--discovery)
- [Manual Food Logging](#manual-food-logging)
- [Batch Food Logging](#batch-food-logging)
- [Food Favorites](#food-favorites)
- [Barcode Scanning](#barcode-scanning)
- [Custom Food Creation](#custom-food-creation)
- [Meal Tracking](#meal-tracking)
- [Technical Implementation](#technical-implementation)

---

## 🎯 **Overview**

Food logging is the foundation of Nutrivize V2, enabling users to accurately track their nutrition intake through multiple input methods. The system is designed for speed, accuracy, and flexibility while maintaining comprehensive nutritional data.

### **Core Capabilities**
- 🔍 **Intelligent Food Search**: AI-powered search across 100,000+ foods
- 📱 **Barcode Scanning**: Instant product identification and logging
- ⚡ **Quick Logging**: Streamlined interface for rapid food entry
- 🔄 **Batch Operations**: Log multiple foods simultaneously
- ⭐ **Smart Favorites**: Learn from user patterns for quick access
- 🍽️ **Meal Organization**: Group foods by meals (breakfast, lunch, dinner, snacks)
- 📊 **Real-time Nutrition**: Instant macro and micronutrient calculations
- 🎯 **Portion Intelligence**: Smart portion size suggestions and conversions

---

## 🔍 **Food Search & Discovery**

### **Purpose**
The food search system provides intelligent, fast access to nutritional information for foods, recipes, and restaurant items through advanced search algorithms and AI-powered recommendations.

### **Core Use Cases**
1. **Quick Food Lookup**: Find common foods instantly
2. **Brand-Specific Search**: Locate exact product matches
3. **Recipe Discovery**: Search for complete meals and recipes
4. **Restaurant Menu Items**: Find nutrition for dining out
5. **Ingredient Search**: Lookup individual cooking ingredients

### **How It Works**

#### **Multi-Tier Search Algorithm**
```typescript
interface FoodSearchRequest {
  query: string
  search_type: 'general' | 'branded' | 'restaurant' | 'recipe'
  filters?: {
    max_calories?: number
    dietary_preferences?: string[]
    allergen_free?: string[]
  }
  user_context?: {
    recent_foods: string[]
    favorites: string[]
    dietary_profile: DietaryProfile
  }
}

interface FoodSearchResult {
  foods: FoodItem[]
  search_metadata: {
    total_results: number
    search_time_ms: number
    result_sources: string[] // ['database', 'ai_enhanced', 'user_custom']
  }
  suggestions: {
    alternative_queries: string[]
    related_foods: FoodItem[]
    popular_combinations: FoodCombination[]
  }
}
```

#### **Search Ranking System**
1. **Exact Matches**: Direct name matches get highest priority
2. **User History**: Previously logged foods ranked higher
3. **Popularity**: Commonly logged foods by all users
4. **Relevance**: AI-powered semantic matching
5. **Freshness**: Recently added foods get slight boost

### **Real-World Examples**

#### **Basic Food Search**
```
User types: "chicken breast"

Search Results (ranked):
1. 🥇 Chicken Breast, Skinless (Raw) - 165 cal/100g
   ⭐ You logged this 8 times this month
   📊 23g protein, 0g carbs, 3.6g fat

2. 🥈 Chicken Breast, Grilled - 195 cal/100g
   🔥 Popular choice for your goals
   📊 29g protein, 0g carbs, 7.7g fat

3. 🥉 Perdue Chicken Breast Fillets - 110 cal/100g
   🏷️ Brand specific
   📊 23g protein, 0g carbs, 1.5g fat

Quick Actions:
[Log 150g] [Add to Favorites] [See Recipes] [Nutrition Facts]
```

#### **Smart Search Suggestions**
```typescript
const searchSuggestions = {
  typo_corrections: [
    { typed: "brocoli", suggested: "broccoli", confidence: 95 }
  ],
  contextual_additions: [
    "grilled chicken breast" // if user often logs grilled foods
  ],
  meal_completions: [
    "chicken breast + rice + vegetables" // popular combinations
  ],
  portion_hints: [
    "150g" // based on user's typical portions
  ]
}
```

### **Technical Implementation**

#### **Enhanced Search Engine**
```python
class FoodSearchEngine:
    def __init__(self):
        self.elasticsearch_client = ElasticsearchClient()
        self.ai_enhancer = AISearchEnhancer()
        self.user_context = UserContextService()
    
    async def search_foods(self, request: FoodSearchRequest) -> FoodSearchResult:
        # Multi-phase search approach
        results = []
        
        # Phase 1: Exact database matches
        exact_matches = await self._exact_search(request.query)
        results.extend(exact_matches)
        
        # Phase 2: Fuzzy matching with user context
        if len(results) < 10:
            fuzzy_matches = await self._fuzzy_search_with_context(request)
            results.extend(fuzzy_matches)
        
        # Phase 3: AI-enhanced search for complex queries
        if len(results) < 5:
            ai_matches = await self.ai_enhancer.enhance_search(request)
            results.extend(ai_matches)
        
        # Rank and personalize results
        ranked_results = await self._rank_results(results, request.user_context)
        
        return FoodSearchResult(
            foods=ranked_results[:20],
            search_metadata=self._build_metadata(results),
            suggestions=await self._generate_suggestions(request, results)
        )
    
    async def _rank_results(self, results: List[FoodItem], context: UserContext) -> List[FoodItem]:
        """Personalized ranking based on user history and preferences"""
        for food in results:
            score = 0
            
            # User history bonus
            if food.name in context.recently_logged:
                score += 50
            
            # Favorites bonus
            if food.id in context.favorites:
                score += 30
            
            # Goal alignment bonus
            if self._aligns_with_goals(food, context.goals):
                score += 20
            
            # Dietary preference bonus
            if self._matches_dietary_prefs(food, context.dietary_preferences):
                score += 15
            
            food.relevance_score = score
        
        return sorted(results, key=lambda x: x.relevance_score, reverse=True)
```

---

## ✏️ **Manual Food Logging**

### **Purpose**
Manual food logging provides users with complete control over their nutrition tracking, allowing precise portion control and detailed meal composition with real-time nutritional feedback.

### **Core Use Cases**
1. **Precise Tracking**: Enter exact portions and measurements
2. **Custom Portions**: Define serving sizes that match actual consumption
3. **Meal Building**: Create complete meals by adding multiple foods
4. **Quick Logging**: Rapid entry for frequently consumed foods
5. **Nutrition Monitoring**: Real-time macro and micronutrient tracking

### **How It Works**

#### **Logging Interface Flow**
```typescript
interface FoodLoggingSession {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foods: LoggedFood[]
  total_nutrition: NutritionSummary
  logging_start_time: Date
  auto_save_enabled: boolean
}

interface LoggedFood {
  food_id: string
  food_name: string
  portion: {
    amount: number
    unit: string // 'g', 'oz', 'cup', 'tbsp', 'pieces'
    measurement_type: 'weight' | 'volume' | 'count'
  }
  nutrition_per_serving: NutritionInfo
  total_nutrition: NutritionInfo // calculated from portion
  logged_at: Date
  confidence_level: number // how accurate the logging is
}
```

#### **Unit Conversion System**
```typescript
class PortionConverter {
  static conversions = {
    'chicken_breast': {
      'piece': { weight_g: 150, description: 'medium breast' },
      'cup_diced': { weight_g: 125, description: '1 cup diced' },
      'serving': { weight_g: 100, description: 'standard serving' }
    },
    'rice_cooked': {
      'cup': { weight_g: 150, description: '1 cup cooked' },
      'serving': { weight_g: 75, description: 'half cup serving' }
    }
  }
  
  static convert_to_grams(food: FoodItem, amount: number, unit: string): number {
    const food_conversions = this.conversions[food.conversion_key]
    if (food_conversions && food_conversions[unit]) {
      return amount * food_conversions[unit].weight_g
    }
    return amount // assume already in grams
  }
}
```

### **Real-World Examples**

#### **Building a Complete Meal**
```
User is logging lunch:

Step 1: Search and Add Main Dish
🔍 Search: "grilled salmon"
➕ Added: Grilled Salmon Fillet
   📏 Portion: 180g (6 oz)
   📊 395 cal, 56g protein, 0g carbs, 18g fat

Step 2: Add Side Items
🔍 Search: "quinoa cooked"
➕ Added: Quinoa, Cooked
   📏 Portion: 100g (2/3 cup)
   📊 120 cal, 4g protein, 22g carbs, 2g fat

🔍 Search: "steamed broccoli"
➕ Added: Broccoli, Steamed
   📏 Portion: 150g (1 cup)
   📊 35 cal, 3g protein, 7g carbs, 0g fat

Current Meal Total:
📊 550 calories, 63g protein, 29g carbs, 20g fat

Real-time Goal Progress:
✅ Protein: 63g/40g per meal (158% - excellent!)
✅ Calories: 550/600 per meal (92% - perfect portion)
⚠️ Fiber: 5g/8g per meal (63% - could add more veggies)

Suggestions:
💡 Add 1 tbsp olive oil to hit your healthy fat target (+120 cal, +14g fat)
💡 This meal provides 35% of your daily protein goal!
```

#### **Quick Logging for Frequent Foods**
```
User's Frequent Foods Dashboard:

⚡ Quick Log (1-tap logging):
🥚 Eggs, Large (2 pieces) → 140 cal, 12g protein
🥛 Whole Milk (1 cup) → 150 cal, 8g protein  
🍌 Banana, Medium (1 piece) → 105 cal, 1g protein
🥜 Almonds (1 oz) → 164 cal, 6g protein

Recent Meals (restore entire meal):
🍽️ Yesterday's Lunch → 485 cal, 42g protein, 28g carbs
🍽️ Monday's Breakfast → 320 cal, 18g protein, 35g carbs
```

### **Technical Implementation**

#### **Real-time Nutrition Calculator**
```python
class NutritionCalculator:
    @staticmethod
    def calculate_food_nutrition(food: FoodItem, portion_grams: float) -> NutritionInfo:
        """Calculate nutrition for specific portion size"""
        base_nutrition = food.nutrition_per_100g
        multiplier = portion_grams / 100.0
        
        return NutritionInfo(
            calories=round(base_nutrition.calories * multiplier),
            protein=round(base_nutrition.protein * multiplier, 1),
            carbs=round(base_nutrition.carbs * multiplier, 1),
            fat=round(base_nutrition.fat * multiplier, 1),
            fiber=round(base_nutrition.fiber * multiplier, 1),
            sugar=round(base_nutrition.sugar * multiplier, 1),
            sodium=round(base_nutrition.sodium * multiplier),
            # Include all vitamins and minerals
            vitamins=self._calculate_vitamins(base_nutrition.vitamins, multiplier),
            minerals=self._calculate_minerals(base_nutrition.minerals, multiplier)
        )
    
    async def calculate_meal_totals(self, logged_foods: List[LoggedFood]) -> MealNutrition:
        """Sum nutrition across all foods in a meal"""
        totals = NutritionInfo.empty()
        
        for logged_food in logged_foods:
            food_nutrition = self.calculate_food_nutrition(
                logged_food.food_item, 
                logged_food.portion_grams
            )
            totals = totals.add(food_nutrition)
        
        return MealNutrition(
            foods=logged_foods,
            total_nutrition=totals,
            goal_progress=await self._calculate_goal_progress(totals),
            recommendations=await self._generate_meal_recommendations(totals)
        )
```

---

## ⚡ **Batch Food Logging**

### **Purpose**
Batch food logging allows users to log multiple foods simultaneously, making meal planning, recipe logging, and bulk food entry efficient and accurate.

### **Core Use Cases**
1. **Recipe Logging**: Add all ingredients from a recipe at once
2. **Meal Prep**: Log entire meal prep batches for the week
3. **Restaurant Meals**: Add multiple items from dining out
4. **Shopping List Conversion**: Convert planned meals to logged foods
5. **Historical Import**: Bulk import previous meal data

### **How It Works**

#### **Batch Input Methods**
```typescript
interface BatchLoggingRequest {
  batch_type: 'recipe' | 'meal_prep' | 'shopping_list' | 'manual'
  foods: BatchFoodInput[]
  meal_info: {
    meal_type: string
    date: Date
    total_servings?: number // for recipes
    prep_date?: Date // for meal prep
  }
  auto_distribute?: boolean // split across multiple days
}

interface BatchFoodInput {
  food_query: string // "2 cups cooked rice" or "chicken breast 200g"
  amount?: number
  unit?: string
  meal_assignment?: string // which meal if distributing
}
```

#### **Smart Parsing Engine**
```typescript
class BatchFoodParser {
  static parseNaturalLanguage(input: string): ParsedFoodInput {
    // Examples of parsing:
    // "2 cups cooked rice" → { amount: 2, unit: "cups", food: "rice, cooked" }
    // "chicken breast 300g" → { amount: 300, unit: "g", food: "chicken breast" }
    // "1 large banana" → { amount: 1, unit: "large", food: "banana" }
    
    const patterns = [
      /(\d+(?:\.\d+)?)\s*(cups?|tbsp|tsp|oz|g|kg|lbs?)\s+(.+)/i,
      /(.+?)\s+(\d+(?:\.\d+)?)\s*(g|oz|lbs?|kg)/i,
      /(\d+)\s+(small|medium|large|pieces?)\s+(.+)/i
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) {
        return this.extractComponents(match)
      }
    }
    
    // Fallback to AI parsing for complex inputs
    return this.aiEnhancedParsing(input)
  }
}
```

### **Real-World Examples**

#### **Recipe Batch Logging**
```
User wants to log homemade chicken stir-fry recipe (serves 4):

Batch Input:
🍗 300g chicken breast, diced
🥦 200g broccoli florets  
🥕 100g carrots, sliced
🌶️ 1 bell pepper, diced
🍚 2 cups cooked brown rice
🥄 2 tbsp olive oil
🥄 1 tbsp soy sauce

Processing Results:
✅ Found all 7 ingredients in database
✅ Calculated per-serving nutrition (dividing by 4)
📊 Per serving: 385 calories, 28g protein, 35g carbs, 12g fat

Options:
1. 📱 Log 1 serving now to today's dinner
2. 📅 Log 4 servings across next 4 days  
3. 💾 Save as custom recipe "Isaac's Chicken Stir-Fry"
4. 🍽️ Log 2 servings now, save 2 for meal prep

User selects option 4:
✅ Added 2 servings to today's dinner
✅ Added 2 servings to tomorrow's lunch
💾 Recipe saved for future use
```

#### **Meal Prep Batch Logging**
```
User prepared 5 identical meal prep containers:

Each container contains:
- 150g grilled chicken breast
- 200g roasted sweet potato
- 100g steamed green beans
- 1 tbsp almond butter

Batch Processing:
📊 Per container: 520 cal, 42g protein, 45g carbs, 16g fat

Distribution Options:
📅 5 lunches for the work week
📅 3 lunches + 2 dinners
📅 Custom distribution across days

Auto-scheduling Result:
✅ Monday lunch: Container 1
✅ Tuesday lunch: Container 2  
✅ Wednesday lunch: Container 3
✅ Thursday lunch: Container 4
✅ Friday lunch: Container 5

🔔 Reminder: Meal prep containers logged for next 5 work days!
```

### **Technical Implementation**

#### **Batch Processing Pipeline**
```python
class BatchFoodProcessor:
    async def process_batch_request(self, request: BatchLoggingRequest) -> BatchLoggingResult:
        parsed_foods = []
        failed_parses = []
        
        # Parse each food input
        for food_input in request.foods:
            try:
                parsed = await self._parse_food_input(food_input)
                validated = await self._validate_and_search(parsed)
                parsed_foods.append(validated)
            except ParsingError as e:
                failed_parses.append({"input": food_input, "error": str(e)})
        
        if len(failed_parses) > 0:
            # Return partial success for user review
            return BatchLoggingResult(
                status="partial_success",
                processed_foods=parsed_foods,
                failed_foods=failed_parses,
                requires_user_review=True
            )
        
        # Process successful batch
        if request.auto_distribute:
            return await self._distribute_across_days(parsed_foods, request.meal_info)
        else:
            return await self._log_to_single_meal(parsed_foods, request.meal_info)
    
    async def _parse_food_input(self, food_input: BatchFoodInput) -> ParsedFood:
        """Use NLP and AI to parse natural language food inputs"""
        if food_input.food_query.startswith(tuple('0123456789')):
            # Likely starts with quantity
            parsed = BatchFoodParser.parseNaturalLanguage(food_input.food_query)
        else:
            # Use AI for complex parsing
            parsed = await self._ai_parse_food(food_input.food_query)
        
        return ParsedFood(
            food_name=parsed.food_name,
            amount=parsed.amount or food_input.amount,
            unit=parsed.unit or food_input.unit or 'g',
            confidence=parsed.confidence
        )
```

---

## ⭐ **Food Favorites**

### **Purpose**
Food Favorites creates a personalized, intelligent collection of frequently consumed foods that learns from user behavior and provides quick access to preferred foods with smart suggestions.

### **Core Use Cases**
1. **Quick Access**: One-tap logging of frequently eaten foods
2. **Pattern Learning**: Automatic favorite detection based on logging frequency
3. **Contextual Suggestions**: Show relevant favorites based on meal type and time
4. **Favorite Categories**: Organize favorites by type (proteins, snacks, breakfast items)
5. **Synchronized Favorites**: Maintain favorites across devices and sessions

### **How It Works**

#### **Smart Favorite Detection**
```typescript
interface FavoriteAnalysis {
  food_id: string
  frequency_score: number // 0-100 based on logging frequency
  recency_score: number // 0-100 based on recent usage
  consistency_score: number // 0-100 based on regular consumption
  context_patterns: {
    preferred_meal_types: string[]
    typical_portions: PortionInfo[]
    time_patterns: TimePattern[]
  }
  auto_suggest_threshold: number // when to auto-suggest as favorite
}

interface SmartFavorite {
  food_item: FoodItem
  usage_stats: {
    total_logs: number
    last_logged: Date
    typical_portion: PortionInfo
    preferred_meal_type: string
  }
  quick_log_options: QuickLogOption[]
  contextual_relevance: number // current relevance score
}
```

#### **Contextual Favorite Ranking**
```typescript
class FavoriteRankingEngine {
  calculateContextualRelevance(favorite: SmartFavorite, context: LoggingContext): number {
    let relevance = 0
    
    // Time-of-day bonus
    if (this.isTypicalTime(favorite, context.current_time)) {
      relevance += 30
    }
    
    // Meal type bonus
    if (favorite.usage_stats.preferred_meal_type === context.meal_type) {
      relevance += 25
    }
    
    // Recent usage bonus
    const days_since_last = this.daysSince(favorite.usage_stats.last_logged)
    if (days_since_last <= 3) {
      relevance += 20
    }
    
    // Goal alignment bonus
    if (this.alignsWithCurrentGoals(favorite, context.user_goals)) {
      relevance += 15
    }
    
    // Frequency bonus
    relevance += Math.min(favorite.usage_stats.total_logs, 10)
    
    return Math.min(relevance, 100)
  }
}
```

### **Real-World Examples**

#### **Morning Breakfast Favorites**
```
Time: 7:30 AM, Meal: Breakfast

Smart Favorites (contextually ranked):

1. ⭐ Greek Yogurt, Plain (2/3 cup) - 100 cal, 17g protein
   🔥 Logged 23 times this month, usually at 7:45 AM
   ⚡ [Quick Log] [+Berries] [+Granola]

2. ⭐ Eggs, Scrambled (2 large) - 140 cal, 12g protein  
   🔥 Your go-to protein, 18 logs this month
   ⚡ [Quick Log] [+Toast] [+Avocado]

3. ⭐ Overnight Oats (1 cup) - 280 cal, 8g protein
   🔥 Weekend favorite, 8 logs (mostly Sat/Sun)
   ⚡ [Quick Log] [+Protein Powder] [Custom Recipe]

4. ⭐ Protein Smoothie (your recipe) - 320 cal, 25g protein
   🔥 Post-workout favorite, 15 logs after gym days
   ⚡ [Quick Log] [Modify Recipe] [View Ingredients]

Quick Actions:
🍽️ [Log Full Breakfast Combo: Eggs + Toast + Fruit]
📱 [Yesterday's Breakfast] (Greek yogurt + berries)
```

#### **Smart Favorite Suggestions**
```
AI Detected New Favorite Candidate:

🥑 Avocado Toast with Hemp Seeds
📊 You've logged this 8 times in the past 2 weeks
⏰ Always between 11 AM - 1 PM (lunch pattern detected)
📈 Consistent portion: 1 slice bread + 1/2 avocado + 1 tbsp hemp seeds

Add to Favorites?
✅ Yes - Add with current portion as default
⚙️ Yes - Let me customize the portion first  
❌ Not now - Ask me again in a week
🚫 Never suggest this food as a favorite
```

### **Technical Implementation**

#### **Favorite Detection Algorithm**
```python
class SmartFavoriteDetector:
    def __init__(self):
        self.min_logs_threshold = 5
        self.frequency_weight = 0.4
        self.recency_weight = 0.3
        self.consistency_weight = 0.3
    
    async def analyze_potential_favorites(self, user_id: str) -> List[FavoriteCandidate]:
        # Get user's food logs from last 60 days
        logs = await self.get_user_logs(user_id, days=60)
        
        # Group by food and calculate stats
        food_stats = self._calculate_food_statistics(logs)
        
        candidates = []
        for food_id, stats in food_stats.items():
            if stats.total_logs >= self.min_logs_threshold:
                score = self._calculate_favorite_score(stats)
                if score >= 70:  # Threshold for auto-suggestion
                    candidates.append(FavoriteCandidate(
                        food_id=food_id,
                        score=score,
                        stats=stats,
                        suggestion_reason=self._generate_suggestion_reason(stats)
                    ))
        
        return sorted(candidates, key=lambda x: x.score, reverse=True)
    
    def _calculate_favorite_score(self, stats: FoodStats) -> float:
        # Frequency component (0-100)
        frequency_score = min(stats.total_logs * 5, 100)
        
        # Recency component (0-100)
        days_since_last = (datetime.now() - stats.last_logged).days
        recency_score = max(0, 100 - (days_since_last * 3))
        
        # Consistency component (0-100)
        consistency_score = self._calculate_consistency(stats.log_dates)
        
        return (
            frequency_score * self.frequency_weight +
            recency_score * self.recency_weight +
            consistency_score * self.consistency_weight
        )
    
    def _calculate_consistency(self, log_dates: List[datetime]) -> float:
        """Calculate how consistently the food is consumed"""
        if len(log_dates) < 2:
            return 0
        
        # Calculate gaps between consumption
        gaps = []
        for i in range(1, len(log_dates)):
            gap = (log_dates[i] - log_dates[i-1]).days
            gaps.append(gap)
        
        # Lower variance in gaps = higher consistency
        if len(gaps) == 0:
            return 0
        
        avg_gap = sum(gaps) / len(gaps)
        variance = sum((gap - avg_gap) ** 2 for gap in gaps) / len(gaps)
        
        # Convert to 0-100 score (lower variance = higher score)
        consistency = max(0, 100 - (variance * 2))
        return consistency
```

---

## 📱 **Barcode Scanning**

### **Purpose**
Barcode scanning provides instant food identification and logging by scanning product UPC/EAN codes, connecting to comprehensive product databases for accurate nutritional information.

### **Core Use Cases**
1. **Grocery Shopping**: Scan items while shopping to plan meals
2. **Pantry Management**: Quick inventory of food items at home
3. **Instant Logging**: Scan and log packaged foods immediately
4. **Product Verification**: Ensure accurate nutrition data for branded items
5. **Meal Prep Planning**: Scan ingredients before cooking

### **How It Works**

#### **Barcode Recognition Pipeline**
```typescript
interface BarcodeScannRequest {
  barcode_data: string // UPC/EAN code
  scan_context: {
    purpose: 'logging' | 'shopping' | 'inventory'
    meal_type?: string
    user_location?: GeoLocation
  }
  user_preferences: {
    dietary_restrictions: string[]
    allergens: string[]
    preferred_brands: string[]
  }
}

interface BarcodeScannResult {
  product_found: boolean
  product_info: ProductInfo
  nutrition_data: NutritionInfo
  alternatives?: ProductInfo[] // similar products
  warnings?: string[] // allergen/dietary conflicts
  quick_log_options: QuickLogOption[]
}
```

#### **Product Database Integration**
```typescript
class BarcodeResolver {
  async resolveBarcode(barcode: string): Promise<ProductInfo> {
    // Try multiple data sources in order
    const sources = [
      this.internalDatabase,
      this.openFoodFactsAPI,
      this.usda_api,
      this.brandDatabase
    ]
    
    for (const source of sources) {
      try {
        const product = await source.lookup(barcode)
        if (product && product.nutrition_complete) {
          return product
        }
      } catch (error) {
        console.warn(`Source ${source.name} failed:`, error)
      }
    }
    
    // If not found, prompt user to contribute data
    throw new ProductNotFoundError(barcode)
  }
}
```

### **Real-World Examples**

#### **Successful Product Scan**
```
User scans barcode: 038000845031

🎯 Product Found!
📦 Honey Nut Cheerios - General Mills
📏 Serving Size: 3/4 cup (28g)
📊 Per serving: 110 calories, 2g protein, 22g carbs, 1.5g fat

⚠️ Allergen Alert: Contains gluten (you marked gluten-free preference)

Nutrition Highlights:
✅ 45% Daily Value Iron
✅ 25% Daily Value Vitamin D  
⚠️ 8g sugar (moderate)
❌ 140mg sodium (6% DV)

Quick Actions:
🍽️ [Log 3/4 cup to breakfast]
🍽️ [Log 1 cup to breakfast] 
📱 [Add to shopping list]
⭐ [Add to favorites]
🔍 [View full nutrition facts]

Alternative Suggestions:
💡 Cheerios Original (30% less sugar)
💡 Your favorite: Oatmeal + berries (more fiber, less sugar)
```

#### **Product Not Found Flow**
```
User scans barcode: 123456789012

❌ Product Not Found
📱 This barcode isn't in our database yet

Help us add it:
📸 [Take photo of nutrition label]
✏️ [Enter product name manually]
🔍 [Search for similar product]

Quick alternatives:
🔍 Search for product name if you know it
📱 Use camera to scan nutrition label instead
💾 Save barcode to try again later (we're always adding new products)

Recent additions by users like you:
• Quest Protein Bar - Cookies & Cream
• Local Store Brand Almond Milk  
• New Flavor Kit-Kat bars
```

### **Technical Implementation**

#### **Barcode Scanning Service**
```python
class BarcodeService:
    def __init__(self):
        self.product_databases = [
            OpenFoodFactsClient(),
            USDAClient(),
            InternalProductDB(),
            BrandPartnershipsDB()
        ]
        self.cache = BarcodeCache()
    
    async def scan_barcode(self, barcode: str, user_context: UserContext) -> ScanResult:
        # Check cache first
        cached_result = await self.cache.get(barcode)
        if cached_result and cached_result.is_fresh():
            return self._personalize_result(cached_result, user_context)
        
        # Try each database
        for db in self.product_databases:
            try:
                product = await db.lookup_barcode(barcode)
                if product:
                    # Validate nutrition data completeness
                    if self._validate_nutrition_data(product):
                        # Cache the result
                        await self.cache.store(barcode, product)
                        
                        # Personalize for user
                        return self._personalize_result(product, user_context)
            except Exception as e:
                logger.warning(f"Database {db.name} lookup failed: {e}")
        
        # Product not found
        return ScanResult(
            found=False,
            suggestions=await self._generate_not_found_suggestions(barcode),
            contribution_request=self._create_contribution_request(barcode)
        )
    
    def _personalize_result(self, product: ProductInfo, context: UserContext) -> ScanResult:
        warnings = []
        
        # Check allergens
        for allergen in context.allergens:
            if allergen.lower() in product.ingredients.lower():
                warnings.append(f"Contains {allergen} (marked as allergen)")
        
        # Check dietary preferences
        if 'vegetarian' in context.dietary_preferences:
            if not product.is_vegetarian:
                warnings.append("Not suitable for vegetarian diet")
        
        # Generate alternatives if warnings exist
        alternatives = []
        if warnings:
            alternatives = await self._find_suitable_alternatives(product, context)
        
        return ScanResult(
            found=True,
            product=product,
            warnings=warnings,
            alternatives=alternatives,
            quick_actions=self._generate_quick_actions(product, context)
        )
```

---

## 🍽️ **Meal Tracking**

### **Purpose**
Meal tracking organizes food logs into meaningful meal categories, providing insights into eating patterns, meal timing, and nutritional distribution throughout the day.

### **Core Use Cases**
1. **Meal Organization**: Group foods by breakfast, lunch, dinner, snacks
2. **Timing Analysis**: Track when meals are consumed for optimization
3. **Meal Balance**: Analyze macro distribution across meals
4. **Pattern Recognition**: Identify eating habits and timing patterns
5. **Meal Planning**: Plan future meals based on preferences and goals

### **How It Works**

#### **Meal Classification System**
```typescript
interface MealTracker {
  meal_definitions: {
    breakfast: TimeWindow
    lunch: TimeWindow  
    dinner: TimeWindow
    snacks: TimeWindow[]
  }
  user_customizations: {
    preferred_meal_times: UserMealTimes
    meal_size_preferences: MealSizeDistribution
    cultural_meal_patterns: string // "american" | "mediterranean" | "asian" | etc.
  }
}

interface TimeWindow {
  start_time: string // "06:00"
  end_time: string   // "10:00"
  flexible: boolean  // can extend outside window
}

interface MealAnalysis {
  meal_type: string
  foods: LoggedFood[]
  nutrition_summary: NutritionInfo
  timing_info: {
    logged_at: Date
    time_from_previous_meal: number // hours
    optimal_timing: boolean
  }
  balance_score: number // how well balanced the meal is
  satiety_prediction: number // predicted fullness 1-10
}
```

### **Real-World Examples**

#### **Daily Meal Overview**
```
📅 Today's Meals - March 15, 2024

🌅 Breakfast (7:45 AM) - 385 calories
🥚 Scrambled eggs (2 large) - 140 cal, 12g protein
🍞 Whole grain toast (2 slices) - 160 cal, 6g protein  
🥑 Avocado (1/2 medium) - 120 cal, 2g protein
☕ Coffee with almond milk - 25 cal, 1g protein
📊 Totals: 385 cal, 21g protein, 28g carbs, 22g fat
⚡ Balance Score: 85/100 (excellent protein, good fats)

🌞 Lunch (12:30 PM) - 520 calories  
🥗 Grilled chicken salad - 520 cal, 42g protein, 18g carbs, 24g fat
📊 Balance Score: 92/100 (perfect protein, great nutrients)
⏰ 4h 45m since breakfast (optimal spacing)

🌙 Dinner (7:15 PM) - 680 calories
🍗 Baked salmon (6 oz) - 350 cal, 49g protein
🍚 Brown rice (3/4 cup) - 170 cal, 4g protein
🥦 Steamed broccoli (1 cup) - 55 cal, 4g protein
🫒 Olive oil (1 tbsp) - 120 cal, 0g protein
📊 Totals: 680 cal, 57g protein, 45g carbs, 28g fat
⚡ Balance Score: 88/100 (excellent protein, good carbs)

🍎 Snacks (3:30 PM & 9:30 PM) - 240 calories
🍎 Apple with almond butter - 190 cal, 4g protein
🥜 Mixed nuts (small handful) - 90 cal, 3g protein

📊 Daily Summary: 1,825 calories, 127g protein, 91g carbs, 74g fat
🎯 Goal Progress: Calories 101%, Protein 127%, Carbs 91%, Fat 93%
⭐ Overall Balance Score: 88/100
```

#### **Meal Timing Analysis**
```
📈 Your Meal Timing Insights (Last 30 Days)

⏰ Breakfast Timing:
Average: 7:32 AM (Range: 6:45 AM - 8:15 AM)
✅ 87% consistency (within 1-hour window)
💡 Tip: You feel most energetic when you eat before 7:45 AM

⏰ Lunch Timing:  
Average: 12:45 PM (Range: 11:30 AM - 2:00 PM)
⚠️ 65% consistency (somewhat irregular)
💡 Tip: Try to eat lunch closer to 12:30 PM for better afternoon energy

⏰ Dinner Timing:
Average: 7:20 PM (Range: 6:00 PM - 9:30 PM)  
⚠️ 58% consistency (varies significantly)
💡 Tip: Earlier dinners (before 7 PM) correlate with better sleep scores

🍽️ Meal Spacing:
Breakfast → Lunch: 5h 15m average (optimal: 4-6 hours) ✅
Lunch → Dinner: 6h 35m average (optimal: 4-6 hours) ⚠️
Last meal → Bed: 3h 10m average (optimal: 2-3 hours) ✅

Recommendations:
🎯 Move lunch 30 minutes earlier for better spacing
🎯 Consistent dinner time will improve sleep quality
🎯 Add afternoon snack if lunch-dinner gap exceeds 6 hours
```

### **Technical Implementation**

#### **Meal Analysis Engine**
```python
class MealAnalysisEngine:
    def __init__(self):
        self.meal_definitions = self._load_default_meal_windows()
        self.balance_calculator = MealBalanceCalculator()
        self.timing_analyzer = MealTimingAnalyzer()
    
    async def analyze_daily_meals(self, user_id: str, date: datetime) -> DailyMealAnalysis:
        # Get all food logs for the day
        food_logs = await self.get_food_logs_for_date(user_id, date)
        
        # Group foods into meals based on timing
        meals = self._group_foods_into_meals(food_logs)
        
        # Analyze each meal
        meal_analyses = []
        for meal_type, foods in meals.items():
            analysis = await self._analyze_single_meal(meal_type, foods)
            meal_analyses.append(analysis)
        
        # Calculate daily insights
        daily_insights = await self._calculate_daily_insights(meal_analyses)
        
        return DailyMealAnalysis(
            date=date,
            meals=meal_analyses,
            daily_nutrition=self._sum_daily_nutrition(meal_analyses),
            timing_insights=daily_insights.timing,
            balance_insights=daily_insights.balance,
            recommendations=daily_insights.recommendations
        )
    
    def _group_foods_into_meals(self, food_logs: List[FoodLog]) -> Dict[str, List[FoodLog]]:
        meals = {"breakfast": [], "lunch": [], "dinner": [], "snacks": []}
        
        for log in food_logs:
            meal_type = self._determine_meal_type(log.logged_at.time())
            meals[meal_type].append(log)
        
        return meals
    
    def _determine_meal_type(self, log_time: time) -> str:
        """Determine meal type based on time of day"""
        hour = log_time.hour
        
        if 5 <= hour < 11:
            return "breakfast"
        elif 11 <= hour < 16:
            return "lunch"  
        elif 16 <= hour < 22:
            return "dinner"
        else:
            return "snacks"
    
    async def _analyze_single_meal(self, meal_type: str, foods: List[FoodLog]) -> MealAnalysis:
        if not foods:
            return MealAnalysis.empty(meal_type)
        
        # Calculate nutrition totals
        nutrition = self._sum_nutrition(foods)
        
        # Calculate balance score
        balance_score = self.balance_calculator.calculate_balance(nutrition, meal_type)
        
        # Analyze timing
        timing_info = self.timing_analyzer.analyze_meal_timing(foods, meal_type)
        
        return MealAnalysis(
            meal_type=meal_type,
            foods=foods,
            nutrition_summary=nutrition,
            timing_info=timing_info,
            balance_score=balance_score,
            recommendations=await self._generate_meal_recommendations(nutrition, meal_type)
        )
```

---

## 🔧 **Technical Implementation**

### **Core Food Management Architecture**
```python
class FoodManagementService:
    def __init__(self):
        self.database = FoodDatabase()
        self.search_engine = FoodSearchEngine()
        self.nutrition_calculator = NutritionCalculator()
        self.favorites_manager = FavoritesManager()
        self.barcode_service = BarcodeService()
        self.cache = FoodCache()
    
    async def log_food(self, request: FoodLoggingRequest) -> FoodLoggingResult:
        """Main entry point for all food logging"""
        # Validate input
        validated_request = await self._validate_logging_request(request)
        
        # Calculate nutrition
        nutrition = await self.nutrition_calculator.calculate(
            validated_request.food_id,
            validated_request.portion
        )
        
        # Create food log entry
        food_log = FoodLog(
            user_id=request.user_id,
            food_id=validated_request.food_id,
            portion=validated_request.portion,
            nutrition=nutrition,
            meal_type=request.meal_type,
            logged_at=request.logged_at or datetime.now()
        )
        
        # Save to database
        saved_log = await self.database.save_food_log(food_log)
        
        # Update user statistics
        await self._update_user_stats(request.user_id, saved_log)
        
        # Check for favorite candidacy
        await self.favorites_manager.check_favorite_candidacy(
            request.user_id, 
            validated_request.food_id
        )
        
        return FoodLoggingResult(
            log_id=saved_log.id,
            nutrition=nutrition,
            updated_daily_totals=await self._get_daily_totals(request.user_id),
            recommendations=await self._generate_post_log_recommendations(saved_log)
        )
```

### **Database Schema**
```typescript
// MongoDB Collections for Food Management

interface FoodLog {
  _id: ObjectId
  user_id: string
  food_id: string
  food_name: string
  portion: {
    amount: number
    unit: string
    grams: number
  }
  nutrition: NutritionInfo
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  logged_at: Date
  created_at: Date
  updated_at: Date
}

interface UserFavorites {
  _id: ObjectId
  user_id: string
  food_id: string
  food_name: string
  added_at: Date
  usage_stats: {
    total_logs: number
    last_logged: Date
    typical_portion: PortionInfo
    preferred_meal_types: string[]
  }
  quick_log_enabled: boolean
  custom_portion?: PortionInfo
}

interface FoodDatabase {
  _id: ObjectId
  food_id: string
  name: string
  brand?: string
  barcode?: string
  category: string
  nutrition_per_100g: NutritionInfo
  serving_suggestions: ServingInfo[]
  allergens: string[]
  dietary_tags: string[] // vegetarian, vegan, gluten-free, etc.
  created_at: Date
  data_source: string // usda, open_food_facts, user_contributed
}
```

This comprehensive food logging documentation covers all aspects of food management in Nutrivize V2, providing detailed use cases, real-world examples, and technical implementation for each functionality.
