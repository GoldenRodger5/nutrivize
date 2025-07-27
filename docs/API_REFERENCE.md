# 🔗 Nutrivize V2 - Complete API Reference

## 📋 **Table of Contents**
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Core Food System](#core-food-system)
- [Nutrition Logging](#nutrition-logging)
- [AI Services](#ai-services)
- [Meal Planning](#meal-planning)
- [User Management](#user-management)
- [Analytics & Reporting](#analytics--reporting)
- [Specialized Features](#specialized-features)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🌐 **API Overview**

### **Base Configuration**
```
Production URL: https://nutrivize-backend.onrender.com
Development URL: http://localhost:8000
API Documentation: /docs (Swagger UI)
OpenAPI Schema: /openapi.json
Health Check: /health
```

### **API Standards**
- **Protocol**: REST over HTTPS
- **Authentication**: JWT Bearer tokens (Firebase)
- **Content Type**: `application/json`
- **Response Format**: JSON with consistent structure
- **Error Format**: Enhanced error handling with request tracking
- **Rate Limiting**: 120 requests/minute with 20 burst allowance
- **Security**: Multi-layer security headers and validation
- **Monitoring**: Health checks with service status reporting
- **Caching**: Smart Redis caching with AI-first freshness priority

### **🚀 Smart Caching Strategy (2025)**
- **AI Insights**: 2 hours maximum (fresh recommendations)
- **Computational Analytics**: 6-12 hours (performance balance)
- **User Data**: 5-10 days (stable profiles/preferences)
- **Food Data**: 2-7 days (database content stability)
- **Historical Data**: Graduated TTL by age (6h-7d)
- **Write-Through**: Immediate cache updates on data changes

### **Enhanced Response Structure**
```typescript
// Success Response
interface APIResponse<T> {
  data: T
  message?: string
  timestamp: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    has_more?: boolean
  }
}

// Enhanced Error Response (Production v2.0)
interface ErrorResponse {
  error: true
  error_code: string          // VALIDATION_ERROR, UNAUTHORIZED, etc.
  message: string             // User-friendly error message
  timestamp: string           // ISO timestamp
  details: object             // Additional error context
  request_id: string          // Unique request identifier for tracking
}
```

### **Security Headers**
All API responses include enhanced security headers:
```
X-Request-ID: <unique-request-id>
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'none'; frame-ancestors 'none';
```

// Error Response
interface APIError {
  detail: string | ValidationError[]
  status_code: number
  timestamp: string
  path: string
  error_type: string
}
```

---

## 🔐 **Authentication**

### **Authentication Flow**
All API endpoints (except `/auth/`) require a valid JWT token in the Authorization header:
```http
Authorization: Bearer <firebase_jwt_token>
```

### **System Endpoints**

#### **Enhanced Health Check (Production v2.0)**
```http
GET /health
```
**Description**: Comprehensive system health monitoring with service status  
**Authentication**: None required  
**Response**:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-07-27T01:25:16.411173",
  "services": {
    "api": "up",
    "database": "up", 
    "redis": "up"
  }
}
```

**Error Response (Service Unavailable)**:
```json
{
  "error": true,
  "error_code": "SERVICE_UNAVAILABLE",
  "message": "Service temporarily unavailable",
  "timestamp": "2025-07-27T01:25:16.411173",
  "details": {},
  "request_id": "13ebeae7-7f38-4df3-8cde-fc52989fa142"
}
```

**Features**:
- Real-time database connectivity check
- Redis cache status monitoring
- Service dependency verification
- Monitoring tool integration ready
- Request ID tracking for debugging

### **Authentication Endpoints**

#### **Token Validation**
```http
POST /auth/validate
Authorization: Bearer <jwt_token>
```
**Description**: Validate JWT token and get user info  
**Response**:
```json
{
  "data": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "verified": true,
    "created_at": "2024-01-15T09:00:00Z"
  }
}
```

#### **User Registration Data**
```http
POST /auth/register-data
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "profile": {
    "age": 28,
    "gender": "male",
    "height_cm": 175,
    "weight_kg": 70,
    "activity_level": "moderate",
    "dietary_preferences": ["vegetarian"],
    "health_goals": ["weight_loss", "muscle_gain"]
  },
  "preferences": {
    "units": "metric",
    "timezone": "America/New_York"
  }
}
```

---

## 🍎 **Core Food System**

### **Food Search & Discovery**

#### **Search Foods**
```http
GET /foods/search?q={query}&limit={limit}&category={category}
Authorization: Bearer <jwt_token>
```
**Parameters**:
- `q` (string): Search query
- `limit` (int, optional): Results limit (default: 20, max: 100)
- `category` (string, optional): Filter by food category

**Response**:
```json
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Chicken Breast, Grilled",
      "brand": "Generic",
      "category": "protein",
      "serving_size": 100,
      "serving_unit": "gram",
      "nutrition": {
        "calories": 165,
        "protein": 31.0,
        "carbs": 0.0,
        "fat": 3.6,
        "fiber": 0.0,
        "sugar": 0.0,
        "sodium": 74,
        "cholesterol": 85,
        "saturated_fat": 1.0,
        "trans_fat": 0.0
      },
      "dietary_attributes": {
        "vegetarian": false,
        "vegan": false,
        "gluten_free": true,
        "dairy_free": true,
        "nut_free": true,
        "kosher": false,
        "halal": true
      },
      "source": "USDA",
      "popularity_score": 95
    }
  ],
  "meta": {
    "total": 1247,
    "limit": 20,
    "has_more": true
  }
}
```

#### **Get Food Details**
```http
GET /foods/{food_id}
Authorization: Bearer <jwt_token>
```
**Response**: Single food object with complete details

#### **Get Popular Foods**
```http
GET /foods/popular?limit={limit}
Authorization: Bearer <jwt_token>
```
**Description**: Get most popular foods based on usage statistics

#### **Get Recent Foods**
```http
GET /foods/recent?limit={limit}
Authorization: Bearer <jwt_token>
```
**Description**: Get user's recently accessed foods

#### **Food Categories**
```http
GET /foods/categories
Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "data": [
    {
      "category": "protein",
      "name": "Proteins",
      "food_count": 1247,
      "emoji": "🥩"
    },
    {
      "category": "vegetables",
      "name": "Vegetables",
      "food_count": 892,
      "emoji": "🥬"
    }
  ]
}
```

### **User Food Management**

#### **Create Custom Food**
```http
POST /user-foods/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Homemade Protein Shake",
  "category": "beverages",
  "serving_size": 250,
  "serving_unit": "ml",
  "nutrition": {
    "calories": 320,
    "protein": 25.0,
    "carbs": 15.0,
    "fat": 8.0,
    "fiber": 2.0,
    "sugar": 12.0,
    "sodium": 150
  },
  "ingredients": ["whey protein", "banana", "almond milk", "peanut butter"],
  "preparation_notes": "Blend all ingredients for 30 seconds"
}
```

#### **Get User Foods**
```http
GET /user-foods/
Authorization: Bearer <jwt_token>
```
**Description**: Get all custom foods created by the user

#### **Update User Food**
```http
PUT /user-foods/{food_id}
Authorization: Bearer <jwt_token>
```

#### **Delete User Food**
```http
DELETE /user-foods/{food_id}
Authorization: Bearer <jwt_token>
```

---

## 📊 **Nutrition Logging**

### **Food Logging Operations**

#### **Log Food Entry**
```http
POST /food-logs/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "date": "2025-01-20",
  "meal_type": "lunch",
  "food_id": "507f1f77bcf86cd799439011",
  "food_name": "Chicken Breast, Grilled",
  "amount": 150,
  "unit": "gram",
  "nutrition": {
    "calories": 247.5,
    "protein": 46.5,
    "carbs": 0.0,
    "fat": 5.4,
    "fiber": 0.0,
    "sodium": 111
  },
  "notes": "Post-workout meal"
}
```

**Response**:
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "logged_at": "2025-01-20T18:30:00Z",
    "nutrition": {
      "calories": 247.5,
      "protein": 46.5,
      "carbs": 0.0,
      "fat": 5.4
    }
  },
  "message": "Food logged successfully"
}
```

#### **Get Food Logs**
```http
GET /food-logs/?date={date}&meal_type={meal_type}&limit={limit}
Authorization: Bearer <jwt_token>
```
**Parameters**:
- `date` (string, optional): Date in YYYY-MM-DD format
- `meal_type` (string, optional): Filter by meal type
- `limit` (int, optional): Number of results

#### **Get Daily Nutrition**
```http
GET /food-logs/daily/{date}
Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "data": {
    "date": "2025-01-20",
    "meals": {
      "breakfast": {
        "foods": [...],
        "nutrition": {
          "calories": 420,
          "protein": 15.0,
          "carbs": 65.0,
          "fat": 12.0
        }
      },
      "lunch": {
        "foods": [...],
        "nutrition": {
          "calories": 580,
          "protein": 45.0,
          "carbs": 35.0,
          "fat": 18.0
        }
      }
    },
    "daily_totals": {
      "calories": 1650,
      "protein": 125.0,
      "carbs": 180.0,
      "fat": 65.0,
      "fiber": 28.0,
      "sodium": 2100
    },
    "goals_progress": {
      "calories": {
        "target": 2000,
        "consumed": 1650,
        "percentage": 82.5
      },
      "protein": {
        "target": 150,
        "consumed": 125,
        "percentage": 83.3
      }
    }
  }
}
```

#### **Update Food Log Entry**
```http
PUT /food-logs/{log_id}
Authorization: Bearer <jwt_token>
```

#### **Delete Food Log Entry**
```http
DELETE /food-logs/{log_id}
Authorization: Bearer <jwt_token>
```

#### **Batch Food Logging**
```http
POST /food-logs/batch
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "entries": [
    {
      "date": "2025-01-20",
      "meal_type": "breakfast",
      "food_id": "...",
      "amount": 1,
      "unit": "serving"
    },
    {
      "date": "2025-01-20", 
      "meal_type": "breakfast",
      "food_id": "...",
      "amount": 200,
      "unit": "ml"
    }
  ]
}
```

### **Recent Foods & Recommendations**

#### **Get Recent Foods**
```http
GET /food-logs/recent?limit={limit}
Authorization: Bearer <jwt_token>
```
**Description**: Get user's recently logged foods for quick access

#### **Get Food Recommendations**
```http
GET /foods/recommendations/recent?limit={limit}
Authorization: Bearer <jwt_token>
```
**Description**: Get smart food recommendations based on user history

---

## 🤖 **AI Services**

### **AI Chat Assistant**

#### **Chat with AI**
```http
POST /ai/chat
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "message": "What should I eat for dinner tonight?",
  "context": {
    "include_nutrition_data": true,
    "include_food_history": true,
    "include_meal_suggestions": true
  }
}
```

**Response**:
```json
{
  "data": {
    "response": "Based on your recent meals and nutrition goals, I'd recommend a balanced dinner with lean protein and vegetables. Here are some suggestions:",
    "suggestions": [
      {
        "food_name": "Grilled Salmon with Quinoa",
        "nutrition": {...},
        "reasons": ["High in omega-3", "Complete protein", "Fiber-rich"]
      }
    ],
    "context_used": {
      "recent_foods": [...],
      "nutrition_gaps": {...},
      "dietary_preferences": [...]
    }
  }
}
```

#### **Get AI Meal Suggestions**
```http
POST /ai/meal-suggestions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "meal_type": "dinner",
  "dietary_preferences": ["vegetarian"],
  "target_calories": 600,
  "macro_preferences": {
    "protein_percent": 25,
    "carbs_percent": 45,
    "fat_percent": 30
  },
  "exclude_ingredients": ["mushrooms", "bell_peppers"]
}
```

#### **Analyze Nutrition Goals**
```http
POST /ai/analyze-nutrition
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "date_range": {
    "start_date": "2025-01-15",
    "end_date": "2025-01-20"
  },
  "analysis_type": "weekly_summary"
}
```

### **AI Health & Coaching**

#### **Get Health Score**
```http
GET /ai-health/user-health-score
Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "data": {
    "overall_score": 78,
    "category_scores": {
      "nutrition_balance": 82,
      "calorie_adherence": 75,
      "hydration": 65,
      "meal_timing": 80,
      "variety": 85
    },
    "insights": [
      "Your protein intake is excellent",
      "Consider increasing water consumption",
      "Meal timing is consistent and healthy"
    ],
    "recommendations": [
      "Add more leafy greens to increase fiber",
      "Try to drink water before each meal"
    ],
    "trend": "improving",
    "last_updated": "2025-01-20T10:30:00Z"
  }
}
```

#### **Get AI Coaching**
```http
GET /ai/coaching?focus={focus_area}
Authorization: Bearer <jwt_token>
```
**Parameters**:
- `focus` (string, optional): "weight_loss", "muscle_gain", "general_health"

#### **Get Smart Nutrition Insights**
```http
GET /ai-dashboard/smart-nutrition
Authorization: Bearer <jwt_token>
```

---

## 🍽️ **Meal Planning**

### **AI-Generated Meal Plans**

#### **Generate Meal Plan**
```http
POST /meal-planning/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Weight Loss Week 1",
  "days": 7,
  "calories_per_day": 1800,
  "protein_percent": 30,
  "carbs_percent": 40,
  "fat_percent": 30,
  "dietary_preferences": ["vegetarian", "gluten_free"],
  "exclude_ingredients": ["nuts", "shellfish"],
  "meal_types": ["breakfast", "lunch", "dinner", "snack"],
  "include_prep_time": true,
  "budget_preference": "moderate"
}
```

**Response**:
```json
{
  "data": {
    "plan_id": "mp_507f1f77bcf86cd799439013",
    "name": "Weight Loss Week 1",
    "days": 7,
    "daily_targets": {
      "calories": 1800,
      "protein": 135,
      "carbs": 180,
      "fat": 60
    },
    "days": [
      {
        "day_number": 1,
        "date": "2025-01-21",
        "meals": [
          {
            "meal_type": "breakfast",
            "food_name": "Overnight Oats with Berries",
            "food_id": "...",
            "amount": 1,
            "unit": "serving",
            "nutrition": {
              "calories": 320,
              "protein": 12,
              "carbs": 58,
              "fat": 6
            },
            "prep_time": 5,
            "instructions": "Mix oats with almond milk, add berries and chia seeds"
          }
        ],
        "daily_nutrition": {
          "calories": 1795,
          "protein": 134,
          "carbs": 182,
          "fat": 58
        }
      }
    ],
    "shopping_list": [...],
    "generated_by": "ai",
    "created_at": "2025-01-20T10:30:00Z"
  }
}
```

#### **Get Meal Plans**
```http
GET /meal-planning/plans?is_active={boolean}&limit={limit}
Authorization: Bearer <jwt_token>
```

#### **Get Meal Plan Details**
```http
GET /meal-planning/plans/{plan_id}
Authorization: Bearer <jwt_token>
```

#### **Update Meal Plan**
```http
PUT /meal-planning/plans/{plan_id}
Authorization: Bearer <jwt_token>
```

#### **Delete Meal Plan**
```http
DELETE /meal-planning/plans/{plan_id}
Authorization: Bearer <jwt_token>
```

#### **Activate Meal Plan**
```http
POST /meal-planning/plans/{plan_id}/activate
Authorization: Bearer <jwt_token>
```

### **Manual Meal Planning**

#### **Create Manual Plan**
```http
POST /meal-planning/manual/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Custom Weekly Plan",
  "days": 7,
  "target_calories": 2000,
  "description": "My personal meal plan"
}
```

#### **Add Food to Meal Plan**
```http
POST /meal-planning/manual/plans/{plan_id}/add-food
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "day_number": 1,
  "meal_type": "breakfast",
  "food_id": "507f1f77bcf86cd799439011",
  "amount": 150,
  "unit": "gram"
}
```

#### **Remove Food from Meal Plan**
```http
DELETE /meal-planning/manual/plans/{plan_id}/remove-food
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "day_number": 1,
  "meal_type": "breakfast",
  "food_id": "507f1f77bcf86cd799439011"
}
```

#### **Copy Day in Plan**
```http
POST /meal-planning/manual/plans/{plan_id}/copy-day
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "source_day": 1,
  "target_day": 2
}
```

#### **Log Day to Food Diary**
```http
POST /meal-planning/manual/plans/{plan_id}/log-day
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "day_number": 1,
  "log_date": "2025-01-21"
}
```

### **Meal Plan Templates**

#### **Get Templates**
```http
GET /meal-planning/manual/templates
Authorization: Bearer <jwt_token>
```

#### **Save as Template**
```http
POST /meal-planning/manual/plans/{plan_id}/save-template
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "template_name": "Vegetarian Weight Loss",
  "description": "7-day vegetarian meal plan for weight loss",
  "is_public": false
}
```

#### **Create from Template**
```http
POST /meal-planning/manual/create-from-template
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "template_id": "template_507f1f77bcf86cd799439014",
  "plan_name": "My Vegetarian Week",
  "start_date": "2025-01-21"
}
```

### **Shopping Lists**

#### **Generate Shopping List**
```http
GET /meal-planning/manual/plans/{plan_id}/export/grocery-list?days={day_numbers}
Authorization: Bearer <jwt_token>
```
**Parameters**:
- `days` (string, optional): Comma-separated day numbers (e.g., "1,2,3")

**Response**:
```json
{
  "data": {
    "plan_name": "Weight Loss Week 1",
    "date_generated": "2025-01-20T10:30:00Z",
    "categories": {
      "proteins": [
        {
          "name": "Chicken Breast",
          "total_amount": 600,
          "unit": "gram",
          "estimated_cost": 8.50
        }
      ],
      "vegetables": [...],
      "grains": [...],
      "dairy": [...]
    },
    "total_estimated_cost": 67.50,
    "total_items": 24
  }
}
```

---

## 👤 **User Management**

### **User Preferences**

#### **Get User Preferences**
```http
GET /preferences/
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "data": {
    "dietary_preferences": ["vegetarian", "gluten_free"],
    "allergens": ["nuts", "shellfish"],
    "units": "metric",
    "timezone": "America/New_York",
    "daily_calorie_goal": 2000,
    "macro_targets": {
      "protein_percent": 25,
      "carbs_percent": 45,
      "fat_percent": 30
    },
    "meal_reminder_times": {
      "breakfast": "08:00",
      "lunch": "12:30",
      "dinner": "18:30"
    },
    "privacy_settings": {
      "profile_visibility": "private",
      "data_sharing": false
    }
  }
}
```

#### **Update User Preferences**
```http
PUT /preferences/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "dietary_preferences": ["vegetarian", "organic"],
  "daily_calorie_goal": 1800,
  "macro_targets": {
    "protein_percent": 30,
    "carbs_percent": 40,
    "fat_percent": 30
  }
}
```

### **Goals Management**

#### **Get User Goals**
```http
GET /goals/
Authorization: Bearer <jwt_token>
```

#### **Create Goal**
```http
POST /goals/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "weight_loss",
  "target_value": 65,
  "current_value": 72,
  "target_date": "2025-06-01",
  "description": "Lose 7kg for summer",
  "milestones": [
    {
      "date": "2025-03-01",
      "target": 69,
      "description": "First milestone"
    }
  ]
}
```

#### **Update Goal Progress**
```http
PUT /goals/{goal_id}/progress
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "current_value": 70,
  "notes": "Lost 2kg this month!"
}
```

### **User Favorites**

#### **Get Favorites**
```http
GET /favorites/?category={category}&limit={limit}
Authorization: Bearer <jwt_token>
```

#### **Add to Favorites**
```http
POST /favorites/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "food_id": "507f1f77bcf86cd799439011",
  "custom_name": "My Go-To Protein",
  "category": "lunch",
  "default_serving_size": 150,
  "default_serving_unit": "gram",
  "tags": ["post-workout", "high-protein"],
  "notes": "Perfect after gym sessions"
}
```

#### **Update Favorite**
```http
PUT /favorites/{food_id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "custom_name": "Updated Favorite Name",
  "tags": ["updated", "tags"]
}
```

#### **Remove from Favorites**
```http
DELETE /favorites/{food_id}
Authorization: Bearer <jwt_token>
```

#### **Get Favorite Statistics**
```http
GET /favorites/stats
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "data": {
    "total_favorites": 23,
    "categories": {
      "breakfast": 5,
      "lunch": 8,
      "dinner": 7,
      "snack": 3
    },
    "most_used": [
      {
        "food_name": "Greek Yogurt",
        "usage_count": 45,
        "last_used": "2025-01-19T08:30:00Z"
      }
    ],
    "recent_additions": [...],
    "popular_tags": ["high-protein", "quick", "healthy"]
  }
}
```

---

## 📈 **Analytics & Reporting**

### **🚀 Smart Cached Analytics (2025)**
All analytics endpoints use intelligent caching for optimal performance:
- **AI Insights**: 2 hours (fresh recommendations)
- **Weekly Summaries**: 6 hours (same-day updates)
- **Monthly Summaries**: 1 day (historical stability)
- **Trends/Breakdowns**: 8 hours (computational balance)
- **Goal Progress**: 12 hours (default analytics)

### **AI-Powered Analytics**

#### **Generate AI Insights**
```http
GET /analytics/insights?timeframe={period}&force_refresh={bool}
Authorization: Bearer <jwt_token>
```
**Parameters**:
- `timeframe` (string): "day", "week", "month"
- `force_refresh` (boolean): Skip cache for fresh insights

**Response**:
```json
{
  "data": {
    "insights": [
      {
        "type": "nutrition",
        "title": "Protein Consistency Improving",
        "content": "Your protein intake has been more consistent this week...",
        "importance": 2,
        "category": "progress"
      }
    ],
    "statistics": {
      "calories": {"value": 1847, "trend": 5, "trend_direction": "up"},
      "protein": {"value": 128, "target": 120, "target_unit": "g"}
    },
    "generated_at": "2025-07-27T12:00:00Z",
    "is_cached": false,
    "summary": "You're making great progress with consistent nutrition tracking..."
  }
}
```

#### **Get Nutrition Trends**
```http
GET /analytics/nutrition-trends?days={number}
Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "data": {
    "period": "2025-07-01 to 2025-07-27",
    "days_analyzed": 27,
    "trends": [
      {
        "date": "2025-07-27",
        "daily": {"calories": 1920, "protein": 135, "carbs": 180, "fat": 68},
        "3_day_average": {"calories": 1847, "protein": 128, "carbs": 167, "fat": 62}
      }
    ],
    "is_cached": true
  }
}
```

#### **Get Goal Progress**
```http
GET /analytics/goal-progress
Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "data": {
    "period": "2025-07-20 to 2025-07-27",
    "progress": {
      "calories": {
        "target": 1800,
        "actual": 1847,
        "percentage": 102.6,
        "status": "above"
      }
    },
    "recommendations": [
      "You're consuming 47 more calories than your target. Consider portion control."
    ],
    "is_cached": true
  }
}
```

#### **Get Macro Breakdown**
```http
GET /analytics/macro-breakdown?timeframe={period}
Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "data": {
    "timeframe": "week",
    "totals": {"protein": 896, "carbs": 1169, "fat": 434, "calories": 12929},
    "daily_averages": {"protein": 128, "carbs": 167, "fat": 62, "calories": 1847},
    "macro_percentages": {"protein": 28, "carbs": 47, "fat": 25},
    "charts": [
      {
        "chart_type": "pie",
        "title": "Macronutrient Distribution (%)",
        "data": {"labels": ["Protein", "Carbohydrates", "Fat"], "values": [28, 47, 25]}
      }
    ],
    "is_cached": false
  }
}
```

### **Traditional Analytics**

#### **Get Nutrition Summary**
```http
GET /analytics/nutrition-summary?start_date={date}&end_date={date}&granularity={period}
Authorization: Bearer <jwt_token>
```
**Parameters**:
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)  
- `granularity` (string): "daily", "weekly", "monthly"

**Response**:
```json
{
  "data": {
    "period": {
      "start_date": "2025-01-15",
      "end_date": "2025-01-21",
      "granularity": "daily"
    },
    "summary": {
      "avg_calories": 1847,
      "avg_protein": 128,
      "avg_carbs": 167,
      "avg_fat": 62,
      "total_days": 7
    },
    "daily_data": [
      {
        "date": "2025-01-15",
        "calories": 1920,
        "protein": 135,
        "carbs": 180,
        "fat": 65,
        "meals_logged": 4,
        "goal_adherence": 96
      }
    ],
    "trends": {
      "calories": "stable",
      "protein": "increasing",
      "carbs": "decreasing",
      "fat": "stable"
    },
    "goal_progress": {
      "calories": {
        "target": 1800,
        "achievement_rate": 97.4
      }
    }
  }
}
```

#### **Get Macro Distribution**
```http
GET /analytics/macro-distribution?period={days}
Authorization: Bearer <jwt_token>
```

#### **Get Meal Timing Analysis**
```http
GET /analytics/meal-timing?period={days}
Authorization: Bearer <jwt_token>
```

#### **Get Food Frequency Report**
```http
GET /analytics/food-frequency?period={days}&limit={limit}
Authorization: Bearer <jwt_token>
```

### **Progress Tracking**

#### **Get Weight Progress**
```http
GET /analytics/weight-progress?period={days}
Authorization: Bearer <jwt_token>
```

#### **Get Hydration Tracking**
```http
GET /analytics/hydration?period={days}
Authorization: Bearer <jwt_token>
```

#### **Get Goal Achievement**
```http
GET /analytics/goal-achievement
Authorization: Bearer <jwt_token>
```

### **Advanced Analytics**

#### **Get Nutrition Patterns**
```http
GET /analytics/patterns?analysis_type={type}
Authorization: Bearer <jwt_token>
```
**Parameters**:
- `analysis_type` (string): "weekly_patterns", "meal_consistency", "nutrient_gaps"

#### **Get Health Insights**
```http
GET /analytics/health-insights
Authorization: Bearer <jwt_token>
```

#### **Export Analytics Data**
```http
GET /analytics/export?format={format}&period={days}
Authorization: Bearer <jwt_token>
```
**Parameters**:
- `format` (string): "csv", "json", "pdf"
- `period` (int): Number of days to include

---

## 🍽️ **Specialized Features**

### **Restaurant AI**

#### **Analyze Menu**
```http
POST /restaurant-ai/analyze
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "source_type": "url",
  "source_data": ["https://restaurant.com/menu"],
  "restaurant_name": "Healthy Bistro",
  "menu_name": "Dinner Menu"
}
```

#### **Analyze Menu Image**
```http
POST /restaurant-ai/analyze-upload
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

files: [menu_image.jpg]
restaurant_name: "Local Cafe"
menu_name: "Breakfast Menu"
```

#### **Get Menu Analyses**
```http
GET /restaurant-ai/analyses?limit={limit}
Authorization: Bearer <jwt_token>
```

#### **Get Menu Recommendations**
```http
GET /restaurant-ai/analyses/{analysis_id}/recommendations?dietary_preferences={prefs}
Authorization: Bearer <jwt_token>
```

### **Water Logging**

#### **🚀 Smart Cached Water Logs (2025)**
Water log endpoints use intelligent 1-hour caching for real-time balance with performance.

#### **Log Water Intake**
```http
POST /water-logs/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 500,
  "unit": "ml",
  "timestamp": "2025-01-20T14:30:00Z",
  "drink_type": "water"
}
```

#### **Get Water Logs**
```http
GET /water-logs/?date={date}
Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "data": [
    {
      "id": "log_id",
      "amount": 500,
      "unit": "ml",
      "timestamp": "2025-01-20T14:30:00Z",
      "drink_type": "water"
    }
  ],
  "is_cached": true,
  "total_today": 1750
}
```

#### **Get Daily Water Summary**
```http
GET /water-logs/daily/{date}
Authorization: Bearer <jwt_token>
```
**Response**:
```json
{
  "data": {
    "date": "2025-01-20",
    "total_ml": 1750,
    "goal_ml": 2000,
    "percentage_of_goal": 87.5,
    "logs_count": 7,
    "is_goal_met": false
  },
  "is_cached": false
}
```

### **Weight Tracking**

#### **Log Weight**
```http
POST /weight-logs/
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "weight": 72.5,
  "unit": "kg",
  "timestamp": "2025-01-20T07:00:00Z",
  "notes": "Morning weight after workout"
}
```

#### **Get Weight History**
```http
GET /weight-logs/?limit={limit}
Authorization: Bearer <jwt_token>
```

#### **Get Weight Trends**
```http
GET /weight-logs/trends?period={days}
Authorization: Bearer <jwt_token>
```

### **Nutrition Label OCR**

#### **Process Nutrition Label**
```http
POST /nutrition-labels/process
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

image: [nutrition_label.jpg]
```

**Response**:
```json
{
  "data": {
    "extracted_nutrition": {
      "serving_size": "30g",
      "calories": 150,
      "protein": 3.0,
      "carbs": 24.0,
      "fat": 6.0,
      "fiber": 2.0,
      "sugar": 8.0,
      "sodium": 120
    },
    "confidence_score": 0.94,
    "product_name": "Granola Cereal",
    "brand": "Healthy Choice",
    "ingredients": ["Oats", "Honey", "Almonds", "Dried Fruit"],
    "processing_time": 2.3
  }
}
```

### **Food Statistics**

#### **Get Food Usage Stats**
```http
GET /food-stats/usage?period={days}
Authorization: Bearer <jwt_token>
```

#### **Get Popular Foods by Category**
```http
GET /food-stats/popular-by-category?category={category}
Authorization: Bearer <jwt_token>
```

#### **Get Nutrition Trends**
```http
GET /food-stats/nutrition-trends?nutrient={nutrient}&period={days}
Authorization: Bearer <jwt_token>
```

---

## ⚠️ **Error Handling**

### **Enhanced Error Handling (Production v2.0)**

The API now features comprehensive error handling with structured responses and request tracking for better debugging and monitoring.

### **Standard HTTP Status Codes**
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `422` - Unprocessable entity (validation failed)
- `429` - Too many requests (rate limited)
- `500` - Internal server error
- `503` - Service unavailable (health check failure)

### **Enhanced Error Response Format**
```json
{
  "error": true,
  "error_code": "VALIDATION_ERROR",
  "message": "Validation failed for food item creation",
  "timestamp": "2025-07-27T01:27:49.136460",
  "details": {
    "field_errors": [
      {
        "field": "nutrition.calories",
        "message": "Calories must be between 0 and 10000",
        "value": -100
      }
    ]
  },
  "request_id": "81ac49de-2c1c-438b-a650-58dbbdc5b384"
}
```

### **Error Code Classifications**
- `VALIDATION_ERROR` - Input validation failures
- `UNAUTHORIZED` - Authentication failures
- `FORBIDDEN` - Authorization/permission failures
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Rate limiting violations
- `DATABASE_ERROR` - Database operation failures
- `EXTERNAL_SERVICE_ERROR` - Third-party service failures
- `BUSINESS_LOGIC_ERROR` - Business rule violations
- `SERVICE_UNAVAILABLE` - Health check failures

### **Authentication Error Example**
```json
{
  "error": true,
  "error_code": "UNAUTHORIZED",
  "message": "Authorization header required",
  "timestamp": "2025-07-27T01:28:44.456184",
  "details": {},
  "request_id": "ac1d6fc9-95b1-4ca8-9398-ab595888598d"
}
```

### **Request Tracking**
Every API response includes a unique `request_id` for:
- **Error debugging**: Track specific failed requests
- **Performance monitoring**: Correlate logs across services
- **Support requests**: Reference specific API calls

### **Common Error Scenarios**
1. **Authentication Errors**: Invalid or expired JWT tokens
2. **Validation Errors**: Enhanced field validation with detailed messages
3. **Resource Not Found**: Requesting non-existent resources
4. **Permission Errors**: Attempting to access other users' data
5. **Rate Limiting**: Exceeding API request limits (with burst allowance)
6. **External Service Errors**: AI API or database connection issues
7. **Service Health**: Health check failures for monitoring

---

## 🚦 **Rate Limiting**

### **Enhanced Rate Limiting (Production v2.0)**

The API now features intelligent rate limiting with burst allowance and proper HTTP headers.

### **Current Limits**
- **General Endpoints**: 120 requests per minute with 20 burst allowance
- **AI Endpoints**: 30 requests per minute per user
- **Upload Endpoints**: 15 requests per minute per user
- **Analytics Endpoints**: 60 requests per minute per user

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642680000
```

### **Rate Limit Exceeded Response**
```json
{
  "detail": "Rate limit exceeded. Maximum 100 requests per minute.",
  "status_code": 429,
  "timestamp": "2025-01-20T10:30:00Z",
  "retry_after": 45
}
```

---

## 🔗 **API Integration Examples**

### **JavaScript/TypeScript (Frontend)**
```typescript
// API client configuration
const api = axios.create({
  baseURL: 'https://nutrivize-backend.onrender.com',
  headers: {
    'Authorization': `Bearer ${getFirebaseToken()}`,
    'Content-Type': 'application/json'
  }
})

// Search foods
const searchFoods = async (query: string) => {
  const response = await api.get(`/foods/search?q=${encodeURIComponent(query)}`)
  return response.data
}

// Log food
const logFood = async (foodData: FoodLogEntry) => {
  const response = await api.post('/food-logs/', foodData)
  return response.data
}

// Get nutrition summary
const getNutritionSummary = async (startDate: string, endDate: string) => {
  const response = await api.get(`/analytics/nutrition-summary?start_date=${startDate}&end_date=${endDate}`)
  return response.data
}
```

### **Python (Backend Integration)**
```python
import requests
import json

class NutrivizeAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def search_foods(self, query: str, limit: int = 20):
        response = requests.get(
            f"{self.base_url}/foods/search",
            params={'q': query, 'limit': limit},
            headers=self.headers
        )
        return response.json()
    
    def log_food(self, food_data: dict):
        response = requests.post(
            f"{self.base_url}/food-logs/",
            json=food_data,
            headers=self.headers
        )
        return response.json()
```

### **cURL Examples**
```bash
# Search for foods
curl -X GET "https://nutrivize-backend.onrender.com/foods/search?q=chicken&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Log a food entry
curl -X POST "https://nutrivize-backend.onrender.com/food-logs/" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-20",
    "meal_type": "lunch", 
    "food_id": "507f1f77bcf86cd799439011",
    "amount": 150,
    "unit": "gram"
  }'

# Get daily nutrition
curl -X GET "https://nutrivize-backend.onrender.com/food-logs/daily/2025-01-20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

This comprehensive API reference covers all 80+ endpoints across 17 route modules, providing detailed examples, request/response formats, and integration guidance for the complete Nutrivize V2 API.
