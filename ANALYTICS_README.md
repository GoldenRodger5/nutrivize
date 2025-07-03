# Analytics & Trends - AI-Powered Nutrition Insights

## Overview

The Analytics & Trends tab provides users with AI-generated insights about their nutrition patterns, goal progress, and eating habits. This innovative MyFitnessPal-style feature automatically refreshes daily to provide fresh, personalized insights.

## Features

### 🤖 AI-Powered Insights
- **Personalized Analysis**: Claude AI analyzes user's food logs, goals, and patterns to generate specific, actionable insights
- **Multiple Categories**: Insights are categorized as nutrition, habits, progress, or recommendations
- **Priority Levels**: Each insight has an importance level (1-3) to help users focus on what matters most
- **Data-Driven**: All insights reference actual user data with specific numbers and percentages

### 📊 Nutrition Trends
- **Macro Tracking**: Average daily calories, protein, carbs, and fat with trend indicators
- **Goal Progress**: Visual progress bars showing progress toward nutrition targets
- **Pattern Recognition**: AI identifies eating patterns, timing habits, and food preferences

### 🔄 Automatic Daily Refresh
- **Background Service**: Automatically refreshes insights daily at 6:00 AM
- **Smart Caching**: Caches insights for 24 hours to improve performance
- **Active Users Only**: Only refreshes insights for users who logged food in the last 7 days

### 💡 Insight Types

#### Progress Insights
- Goal achievement tracking
- Weight progress analysis
- Consistency metrics
- Trend comparisons

#### Nutrition Insights
- Macro/micronutrient analysis
- Calorie distribution patterns
- Nutrient adequacy assessment
- Balance recommendations

#### Habit Insights
- Eating timing patterns
- Meal frequency analysis
- Food variety assessment
- Logging consistency

#### Recommendations
- Specific improvement suggestions
- Goal adjustment recommendations
- Food swap suggestions
- Habit optimization tips

## Technical Architecture

### Backend Components

#### AI Service (`ai_service.py`)
- `generate_comprehensive_insights()`: Main AI analysis function
- Uses Claude Opus with enhanced prompts for nutrition analysis
- Processes user data and generates structured insights

#### Analytics Service (`analytics_service.py`)
- `generate_ai_insights()`: Main endpoint for insights generation
- Integrates with caching system for performance
- Calculates nutrition statistics and trends

#### Analytics Refresh Service (`analytics_refresh_service.py`)
- Background service for daily insights refresh
- Manages insight caching and expiration
- Handles bulk refresh for active users

### Frontend Components

#### AnalyticsInsights Component
- Main insights display component
- Handles loading states and error handling
- Provides refresh and timeframe controls

#### InsightCard Component
- Individual insight display
- Category-based styling and icons
- Priority-based visual indicators

#### TrendsCard Component
- Nutrition trends visualization
- Progress bars and trend indicators
- Target comparison displays

### API Endpoints

```
GET /analytics/ai-insights
- timeframe: 'week' | 'month'
- force_refresh: boolean

GET /analytics/nutrition-trends
- days: number (default: 30)

GET /analytics/goal-progress
GET /analytics/food-patterns
GET /analytics/macro-breakdown
```

## Setup Instructions

### 1. Backend Setup

The analytics features are integrated into the existing FastAPI backend. No additional setup is required for the main functionality.

### 2. Background Service (Optional)

To enable automatic daily refresh:

```bash
# Start the background refresh service
python start_analytics_refresh.py
```

This service should run alongside your main FastAPI server.

### 3. Environment Variables

Ensure your `.env` file includes:
```
ANTHROPIC_API_KEY=your_claude_api_key
```

### 4. Database Collections

The system will automatically create these MongoDB collections:
- `insights_cache`: Stores cached AI insights
- `food_logs`: User meal data (existing)
- `goals`: User nutrition goals (existing)

## Usage

### For Users

1. **View Insights**: Navigate to the Analytics tab to see AI-generated insights
2. **Refresh Insights**: Click the refresh button to generate new insights
3. **Switch Timeframes**: Toggle between weekly and monthly analysis
4. **Priority Actions**: Focus on high-priority insights marked with red badges

### For Developers

#### Testing the AI Insights

```bash
# Test AI insights generation
python test_analytics_ai.py
```

#### Manual Insight Generation

```python
from backend.app.services.analytics_service import analytics_service

# Generate insights for a user
insights = await analytics_service.generate_ai_insights(
    user_id="user123",
    timeframe="week",
    force_refresh=True
)
```

#### Clearing Cache

```python
from backend.app.services.analytics_refresh_service import analytics_refresh_service

# Clear expired cache entries
await analytics_refresh_service.cleanup_expired_cache()
```

## Customization

### AI Prompt Customization

The AI insights can be customized by modifying the prompt in `ai_service.py`:

```python
async def generate_comprehensive_insights(self, user_data: Dict[str, Any]):
    # Modify the prompt here to change insight style and focus
    prompt = f"""
    Your custom prompt here...
    """
```

### Insight Categories

Add new insight categories by updating:
- `InsightCard.tsx`: Add new category styling
- `ai_service.py`: Include new categories in the prompt
- `analyticsService.ts`: Update TypeScript types

### Refresh Schedule

Modify the refresh schedule in `analytics_refresh_service.py`:

```python
def schedule_daily_refresh(self):
    # Change the time here
    schedule.every().day.at("06:00").do(self._run_daily_refresh)
```

## Performance Considerations

### Caching Strategy
- Insights are cached for 24 hours
- Only active users get daily refreshes
- Background service prevents UI blocking

### AI Usage Optimization
- Uses batch processing for multiple users
- Includes delays between AI calls to respect rate limits
- Falls back to basic insights if AI is unavailable

### Database Optimization
- Indexes on user_id and timestamps
- Automatic cleanup of expired cache entries
- Efficient queries for active user detection

## Monitoring

### Logs
The system provides detailed logging for:
- AI insight generation
- Cache operations
- Background refresh status
- Error handling

### Success Metrics
- Insight generation success rate
- Cache hit rate
- Daily refresh completion rate
- User engagement with insights

## Troubleshooting

### Common Issues

#### AI Insights Not Generating
1. Check ANTHROPIC_API_KEY is set correctly
2. Verify user has sufficient food log data
3. Check API rate limits and quotas

#### Background Service Not Running
1. Ensure the service script has proper permissions
2. Check database connectivity
3. Verify no port conflicts

#### Cache Issues
1. Check MongoDB connection
2. Verify collection permissions
3. Run cleanup for expired entries

### Debug Mode

Enable debug mode by setting environment variable:
```
DEBUG_ANALYTICS=true
```

This will provide detailed logging for troubleshooting.

## Future Enhancements

### Planned Features
- **Comparative Analysis**: Compare with similar users
- **Seasonal Insights**: Analyze eating patterns by season
- **Advanced Visualizations**: Charts and graphs for trends
- **Export Functionality**: Download insights as PDF
- **Push Notifications**: Daily insight summaries

### Integration Opportunities
- **Wearable Data**: Incorporate activity data for better insights
- **Social Features**: Share insights with friends or trainers
- **Healthcare Integration**: Connect with healthcare providers
- **Meal Planning**: Use insights to improve meal suggestions

## Contributing

When contributing to the Analytics & Trends feature:

1. **Test thoroughly**: Always test with various user data scenarios
2. **Update documentation**: Keep this README current with changes
3. **Consider performance**: AI calls are expensive, optimize where possible
4. **Maintain privacy**: Ensure user data is handled securely
5. **Follow patterns**: Use established patterns for new insight types
