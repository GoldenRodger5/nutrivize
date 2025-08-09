
🔍 COMPREHENSIVE ENDPOINT TEST RESULTS WITH COOLDOWNS
============================================================

📊 SUMMARY:
- Total Endpoints Tested: 31
- Successful: 5
- Failed: 26  
- Success Rate: 16.1%
- Rate Limited Responses: 0

🎯 STATUS: NEEDS_ATTENTION


❌ FAILED ENDPOINTS:
----------------------------------------
• POST /auth/refresh
  Status: 404 - HTTP 404

• POST /auth/logout
  Status: 404 - HTTP 404

• GET /users/profile
  Status: 404 - HTTP 404

• PUT /users/profile
  Status: 404 - HTTP 404

• GET /users/preferences
  Status: 404 - HTTP 404

• PUT /users/preferences
  Status: 404 - HTTP 404

• GET /foods/search-with-vectors
  Status: 404 - HTTP 404

• GET /foods/categories
  Status: 404 - HTTP 404

• GET /foods/popular
  Status: 404 - HTTP 404

• GET /food-logs
  Status: 405 - HTTP 405 - {'detail': 'Method Not Allowed'}

• POST /food-logs
  Status: 422 - HTTP 422 - {'detail': [{'type': 'missing', 'loc': ['body', 'date'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'food_id'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'amount'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'unit'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'nutrition'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}]}

• GET /food-logs/recent
  Status: 405 - HTTP 405 - {'detail': 'Method Not Allowed'}

• GET /food-logs/today
  Status: 405 - HTTP 405 - {'detail': 'Method Not Allowed'}

• GET /analytics/nutrition-summary
  Status: 404 - HTTP 404

• GET /analytics/progress
  Status: 404 - HTTP 404

• GET /analytics/trends
  Status: 404 - HTTP 404

• GET /analytics/weekly-summary
  Status: 404 - HTTP 404

• POST /goals
  Status: 422 - HTTP 422 - {'detail': [{'type': 'missing', 'loc': ['body', 'title'], 'msg': 'Field required', 'input': {'goal_type': 'calories', 'target_value': 2000, 'timeframe': 'daily'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'enum', 'loc': ['body', 'goal_type'], 'msg': "Input should be 'weight_loss', 'weight_gain', 'maintenance' or 'muscle_gain'", 'input': 'calories', 'ctx': {'expected': "'weight_loss', 'weight_gain', 'maintenance' or 'muscle_gain'"}, 'url': 'https://errors.pydantic.dev/2.10/v/enum'}, {'type': 'missing', 'loc': ['body', 'start_date'], 'msg': 'Field required', 'input': {'goal_type': 'calories', 'target_value': 2000, 'timeframe': 'daily'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'nutrition_targets'], 'msg': 'Field required', 'input': {'goal_type': 'calories', 'target_value': 2000, 'timeframe': 'daily'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}]}

• GET /goals/progress
  Status: 405 - HTTP 405 - {'detail': 'Method Not Allowed'}

• POST /ai/meal-suggestions
  Status: 422 - HTTP 422 - {'detail': [{'type': 'missing', 'loc': ['body', 'meal_type'], 'msg': 'Field required', 'input': {'preferences': {'dietary_restrictions': []}, 'context': 'lunch'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}]}

• POST /ai/health-score
  Status: 404 - HTTP 404

• POST /ai/nutrition-analysis
  Status: 404 - HTTP 404

• POST /ai/meal-plan
  Status: 404 - HTTP 404

• POST /ai/health-insights
  Status: 500 - HTTP 500 - {'error': True, 'error_code': 'INTERNAL_SERVER_ERROR', 'message': "Health insights error: 'UnifiedAIService' object has no attribute '_create_fallback_insights'", 'timestamp': '2025-08-09T20:06:56.293505', 'details': {}, 'request_id': 'f6df11cb-68b9-4693-8d90-6d60a40d6a37'}

• GET /vectors/search
  Status: 404 - HTTP 404

• POST /ocr/analyze-nutrition-label
  Status: 404 - HTTP 404


⏱️  RATE LIMITING SUMMARY:
- Standard delay used: 0.5s
- Rate-limited delay: 2.0s
- AI endpoint delay: 5.0s
- Total rate-limited responses: 0

✅ COOLDOWN EFFECTIVENESS:
- Perfect! No rate limiting encountered

🕐 Test completed at: 2025-08-09 16:07:01

## Detailed Results
- GET /auth/me: ✅ Success
- POST /auth/refresh: ❌ HTTP 404
- POST /auth/logout: ❌ HTTP 404
- GET /users/profile: ❌ HTTP 404
- PUT /users/profile: ❌ HTTP 404
- GET /users/preferences: ❌ HTTP 404
- PUT /users/preferences: ❌ HTTP 404
- GET /foods/search: ✅ Success
- GET /foods/search-with-vectors: ❌ HTTP 404
- GET /foods/categories: ❌ HTTP 404
- GET /foods/popular: ❌ HTTP 404
- GET /food-logs: ❌ HTTP 405 - {'detail': 'Method Not Allowed'}
- POST /food-logs: ❌ HTTP 422 - {'detail': [{'type': 'missing', 'loc': ['body', 'date'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'food_id'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'amount'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'unit'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'nutrition'], 'msg': 'Field required', 'input': {'food_name': 'Apple', 'quantity': 1, 'meal_type': 'snack'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}]}
- GET /food-logs/recent: ❌ HTTP 405 - {'detail': 'Method Not Allowed'}
- GET /food-logs/today: ❌ HTTP 405 - {'detail': 'Method Not Allowed'}
- GET /analytics/nutrition-summary: ❌ HTTP 404
- GET /analytics/progress: ❌ HTTP 404
- GET /analytics/trends: ❌ HTTP 404
- GET /analytics/weekly-summary: ❌ HTTP 404
- GET /analytics/nutrition-streak: ✅ Success
- GET /goals: ✅ Success
- POST /goals: ❌ HTTP 422 - {'detail': [{'type': 'missing', 'loc': ['body', 'title'], 'msg': 'Field required', 'input': {'goal_type': 'calories', 'target_value': 2000, 'timeframe': 'daily'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'enum', 'loc': ['body', 'goal_type'], 'msg': "Input should be 'weight_loss', 'weight_gain', 'maintenance' or 'muscle_gain'", 'input': 'calories', 'ctx': {'expected': "'weight_loss', 'weight_gain', 'maintenance' or 'muscle_gain'"}, 'url': 'https://errors.pydantic.dev/2.10/v/enum'}, {'type': 'missing', 'loc': ['body', 'start_date'], 'msg': 'Field required', 'input': {'goal_type': 'calories', 'target_value': 2000, 'timeframe': 'daily'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}, {'type': 'missing', 'loc': ['body', 'nutrition_targets'], 'msg': 'Field required', 'input': {'goal_type': 'calories', 'target_value': 2000, 'timeframe': 'daily'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}]}
- GET /goals/progress: ❌ HTTP 405 - {'detail': 'Method Not Allowed'}
- POST /ai/meal-suggestions: ❌ HTTP 422 - {'detail': [{'type': 'missing', 'loc': ['body', 'meal_type'], 'msg': 'Field required', 'input': {'preferences': {'dietary_restrictions': []}, 'context': 'lunch'}, 'url': 'https://errors.pydantic.dev/2.10/v/missing'}]}
- POST /ai/health-score: ❌ HTTP 404
- POST /ai/nutrition-analysis: ❌ HTTP 404
- POST /ai/meal-plan: ❌ HTTP 404
- POST /ai/health-insights: ❌ HTTP 500 - {'error': True, 'error_code': 'INTERNAL_SERVER_ERROR', 'message': "Health insights error: 'UnifiedAIService' object has no attribute '_create_fallback_insights'", 'timestamp': '2025-08-09T20:06:56.293505', 'details': {}, 'request_id': 'f6df11cb-68b9-4693-8d90-6d60a40d6a37'}
- GET /vectors/search: ❌ HTTP 404
- GET /vectors/similar: ✅ Success
- POST /ocr/analyze-nutrition-label: ❌ HTTP 404
