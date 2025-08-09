
🔍 CORRECTED COMPREHENSIVE ENDPOINT TEST RESULTS
============================================================

📊 SUMMARY:
- Total ACTUAL Endpoints Tested: 35
- Successful: 14
- Failed: 21  
- Success Rate: 40.0%
- Rate Limited Responses: 0

🎯 STATUS: NEEDS_ATTENTION


❌ FAILED ENDPOINTS:
----------------------------------------
• POST /auth/logout
  Status: 404 - HTTP 404

• GET /user/profile
  Status: 404 - HTTP 404

• PUT /user/profile
  Status: 404 - HTTP 404

• POST /preferences
  Status: 405 - HTTP 405

• GET /foods/popular
  Status: 404 - HTTP 404

• POST /food-logs/
  Status: 400 - HTTP 400 - {'error': True, 'error_code': 'BAD_REQUEST', 'message': "'meal_breakdown'", 'timestamp': '2025-08-09

• GET /food-logs/today
  Status: 405 - HTTP 405

• GET /food-logs/recent
  Status: 405 - HTTP 405

• GET /food-logs/date-range
  Status: 405 - HTTP 405

• GET /analytics/nutrition-summary
  Status: 404 - HTTP 404

• GET /analytics/weekly-summary
  Status: 404 - HTTP 404

• POST /goals
  Status: 200 - HTTP 200 - {'id': '6897aaef7b816a0898c60455', 'title': 'Weight Loss Goal', 'goal_type': 'weight_loss', 'start_d

• POST /weight-logs
  Status: 400 - HTTP 400 - {'error': True, 'error_code': 'BAD_REQUEST', 'message': "'<' not supported between instances of 'str

• POST /water-logs
  Status: 200 - HTTP 200 - {'id': '6897aaf07b816a0898c60456', 'date': '2025-08-09', 'amount': 500.0, 'notes': '', 'logged_at': 

• GET /user-foods
  Status: 404 - HTTP 404

• GET /food-stats/popular
  Status: 404 - HTTP 404

• GET /dietary/restrictions
  Status: 404 - HTTP 404

• GET /ai-dashboard/summary
  Status: 404 - HTTP 404

• POST /ai-coaching/insights
  Status: 404 - HTTP 404

• POST /ai-health/enhanced-score
  Status: 404 - HTTP 404

• GET /vectors/search
  Status: 404 - HTTP 404


⏱️  RATE LIMITING SUMMARY:
- Standard delay used: 0.5s
- Rate-limited delay: 2.0s
- AI endpoint delay: 5.0s
- Total rate-limited responses: 0

✅ COOLDOWN EFFECTIVENESS:
- Perfect! No rate limiting encountered

🕐 Test completed at: 2025-08-09 16:09:50

## Detailed Results
- GET /health: ✅ Success
- GET /auth/me: ✅ Success
- POST /auth/logout: ❌ HTTP 404
- GET /user/profile: ❌ HTTP 404
- PUT /user/profile: ❌ HTTP 404
- GET /onboarding/status: ✅ Success
- POST /onboarding/complete: ✅ Success
- GET /preferences: ✅ Success
- POST /preferences: ❌ HTTP 405
- GET /foods/search: ✅ Success
- GET /foods/popular: ❌ HTTP 404
- POST /food-logs/: ❌ HTTP 400 - {'error': True, 'error_code': 'BAD_REQUEST', 'message': "'meal_breakdown'", 'timestamp': '2025-08-09
- GET /food-logs/today: ❌ HTTP 405
- GET /food-logs/recent: ❌ HTTP 405
- GET /food-logs/date-range: ❌ HTTP 405
- GET /analytics/nutrition-trends: ✅ Success
- GET /analytics/nutrition-summary: ❌ HTTP 404
- GET /analytics/weekly-summary: ❌ HTTP 404
- GET /analytics/nutrition-streak: ✅ Success
- GET /goals: ✅ Success
- POST /goals: ❌ HTTP 200 - {'id': '6897aaef7b816a0898c60455', 'title': 'Weight Loss Goal', 'goal_type': 'weight_loss', 'start_d
- GET /weight-logs: ✅ Success
- POST /weight-logs: ❌ HTTP 400 - {'error': True, 'error_code': 'BAD_REQUEST', 'message': "'<' not supported between instances of 'str
- GET /water-logs: ✅ Success
- POST /water-logs: ❌ HTTP 200 - {'id': '6897aaf07b816a0898c60456', 'date': '2025-08-09', 'amount': 500.0, 'notes': '', 'logged_at': 
- GET /favorites: ✅ Success
- GET /user-foods: ❌ HTTP 404
- GET /food-stats/popular: ❌ HTTP 404
- GET /dietary/restrictions: ❌ HTTP 404
- POST /ai/meal-suggestions: ✅ Success
- GET /ai-dashboard/summary: ❌ HTTP 404
- POST /ai-coaching/insights: ❌ HTTP 404
- POST /ai-health/enhanced-score: ❌ HTTP 404
- POST /meal-planning/generate-plan: ✅ Success
- GET /vectors/search: ❌ HTTP 404
