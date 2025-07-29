/**
 * AI Health Analysis Service
 * This service provides advanced health insights and analytics by processing
 * user data with machine learning models.
 */

const axios = require('axios');
const { OpenAI } = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generates an enhanced health score analysis with detailed breakdowns
 * and personalized recommendations based on user data.
 * 
 * @param {Object} userData User's health and nutrition data
 * @returns {Object} Enhanced health score analysis
 */
async function getEnhancedHealthScoreAnalysis(userData) {
  // Process basic health metrics
  const baseAnalysis = generateBaseHealthScore(userData);
  
  // Generate AI-powered insights
  const aiInsights = await generateAIHealthInsights(userData, baseAnalysis);
  
  return {
    ...baseAnalysis,
    ai_insights: aiInsights,
    last_updated: new Date().toISOString()
  };
}

/**
 * Generates a base health score from user metrics
 * @param {Object} userData User's health data
 * @returns {Object} Base health score analysis
 */
function generateBaseHealthScore(userData) {
  // Calculate component scores based on user data
  const nutritionScore = calculateNutritionScore(userData);
  const activityScore = calculateActivityScore(userData);
  const sleepScore = calculateSleepScore(userData);
  const hydrationScore = calculateHydrationScore(userData);
  const metabolicHealthScore = calculateMetabolicHealthScore(userData);
  
  // Calculate overall score (weighted average)
  const weights = {
    nutrition: 0.3,
    activity: 0.25,
    sleep: 0.2,
    hydration: 0.1,
    metabolic_health: 0.15
  };
  
  const overallScore = Math.round(
    nutritionScore * weights.nutrition +
    activityScore * weights.activity +
    sleepScore * weights.sleep +
    hydrationScore * weights.hydration +
    metabolicHealthScore * weights.metabolic_health
  );
  
  // Determine trend
  const trend = determineTrend(userData.historical_scores || []);
  
  return {
    overall_score: overallScore,
    trend,
    component_scores: {
      nutrition: nutritionScore,
      activity: activityScore,
      sleep: sleepScore,
      hydration: hydrationScore,
      metabolic_health: metabolicHealthScore
    },
    improvement_areas: identifyImprovementAreas({
      nutrition: nutritionScore,
      activity: activityScore,
      sleep: sleepScore,
      hydration: hydrationScore,
      metabolic_health: metabolicHealthScore
    })
  };
}

/**
 * Generate AI-powered health insights using user data and LLM
 * @param {Object} userData User's health data
 * @param {Object} baseAnalysis Base health score analysis
 * @returns {Object} AI-powered health insights
 */
async function generateAIHealthInsights(userData, baseAnalysis) {
  try {
    // Prepare context for the AI model
    const userContext = {
      age: userData.age,
      gender: userData.gender,
      height: userData.height,
      weight: userData.weight,
      activity_level: userData.activity_level,
      dietary_preferences: userData.dietary_preferences,
      health_goals: userData.health_goals,
      recent_nutrition: userData.recent_nutrition_logs,
      recent_activity: userData.recent_activity_logs,
      sleep_data: userData.sleep_data,
      water_intake: userData.water_intake,
      health_metrics: userData.health_metrics,
      component_scores: baseAnalysis.component_scores
    };
    
    // Generate insights using OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a highly knowledgeable nutrition and health analysis AI. Provide concise, evidence-based insights and recommendations based on health data. Focus on actionable advice and be specific."
        },
        {
          role: "user",
          content: `Analyze this health data and provide insights and personalized recommendations: ${JSON.stringify(userContext)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });
    
    // Parse AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);
    
    return {
      short_term_insights: aiResponse.short_term_insights || "Based on your recent data, focus on increasing water intake and protein consumption.",
      long_term_recommendations: aiResponse.long_term_recommendations || "For sustainable progress, gradually increase weekly activity and incorporate more plant-based foods.",
      nutrition_insights: aiResponse.nutrition_insights || "Your macronutrient balance is improving. Consider adding more fiber-rich foods.",
      lifestyle_insights: aiResponse.lifestyle_insights || "Your sleep patterns suggest improved recovery. Maintain consistent sleep schedule.",
      next_steps: aiResponse.next_steps || ["Increase water intake by 20%", "Add 10 minutes of daily activity", "Include one additional serving of vegetables"]
    };
  } catch (error) {
    console.error("Error generating AI health insights:", error);
    
    // Return default insights if AI generation fails
    return {
      short_term_insights: "Focus on maintaining consistent meal timing and adequate hydration.",
      long_term_recommendations: "Build sustainable habits around nutrition, sleep, and physical activity.",
      nutrition_insights: "Balance your macronutrients according to your activity levels and goals.",
      lifestyle_insights: "Consider sleep quality as an essential component of your health routine.",
      next_steps: ["Stay hydrated", "Get adequate protein", "Prioritize sleep", "Move regularly"]
    };
  }
}

/**
 * Calculate nutrition score based on user's dietary data
 * @param {Object} userData User data
 * @returns {Number} Nutrition score (0-100)
 */
function calculateNutritionScore(userData) {
  // Implementation would use actual user nutrition data
  // This is a placeholder implementation
  
  const nutrition = userData.recent_nutrition_logs || [];
  if (nutrition.length === 0) return 70; // Default score
  
  // Factors to consider:
  // - Protein adequacy
  // - Macronutrient balance
  // - Micronutrient density
  // - Fiber intake
  // - Meal timing
  // - Hydration
  // - Processed food ratio
  
  // Simplified scoring for demonstration
  let score = 70; // Base score
  
  // Adjust based on available data
  if (userData.health_metrics) {
    if (userData.health_metrics.protein_adequacy > 0.8) score += 5;
    if (userData.health_metrics.fiber_intake > 25) score += 5;
    if (userData.health_metrics.vegetable_servings > 3) score += 5;
    if (userData.health_metrics.processed_food_ratio < 0.2) score += 5;
    if (userData.health_metrics.meal_consistency > 0.8) score += 5;
    if (userData.health_metrics.water_adequacy > 0.9) score += 5;
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Calculate activity score based on user's physical activity data
 * @param {Object} userData User data
 * @returns {Number} Activity score (0-100)
 */
function calculateActivityScore(userData) {
  // Implementation would use actual user activity data
  return userData.health_metrics?.activity_score || 65;
}

/**
 * Calculate sleep score based on user's sleep data
 * @param {Object} userData User data
 * @returns {Number} Sleep score (0-100)
 */
function calculateSleepScore(userData) {
  // Implementation would use actual user sleep data
  return userData.health_metrics?.sleep_score || 75;
}

/**
 * Calculate hydration score based on user's water intake
 * @param {Object} userData User data
 * @returns {Number} Hydration score (0-100)
 */
function calculateHydrationScore(userData) {
  // Implementation would use actual user hydration data
  return userData.health_metrics?.hydration_score || 80;
}

/**
 * Calculate metabolic health score based on user's biomarkers
 * @param {Object} userData User data
 * @returns {Number} Metabolic health score (0-100)
 */
function calculateMetabolicHealthScore(userData) {
  // Implementation would use actual user metabolic health data
  return userData.health_metrics?.metabolic_score || 70;
}

/**
 * Determine health trend by analyzing historical scores
 * @param {Array} historicalScores Array of historical health scores
 * @returns {String} Trend description ("improving", "declining", "stable")
 */
function determineTrend(historicalScores) {
  if (!historicalScores || historicalScores.length < 2) {
    return "stable";
  }
  
  // Calculate the average change in the last few data points
  const recentScores = historicalScores.slice(-5); // Last 5 scores
  let totalChange = 0;
  
  for (let i = 1; i < recentScores.length; i++) {
    totalChange += recentScores[i] - recentScores[i-1];
  }
  
  const averageChange = totalChange / (recentScores.length - 1);
  
  if (averageChange > 1) return "improving";
  if (averageChange < -1) return "declining";
  return "stable";
}

/**
 * Identify areas for improvement based on component scores
 * @param {Object} componentScores Component health scores
 * @returns {Array} Areas for improvement
 */
function identifyImprovementAreas(componentScores) {
  const areas = [];
  const threshold = 75; // Score threshold for identifying improvement areas
  
  if (componentScores.nutrition < threshold) {
    areas.push({
      area: "nutrition",
      score: componentScores.nutrition,
      recommendations: [
        "Increase protein intake and reduce processed carbohydrates",
        "Add more fiber-rich fruits and vegetables",
        "Consider meal timing for optimal energy"
      ]
    });
  }
  
  if (componentScores.activity < threshold) {
    areas.push({
      area: "activity",
      score: componentScores.activity,
      recommendations: [
        "Add 15-30 minutes of moderate exercise 3-4 times per week",
        "Incorporate strength training twice weekly",
        "Reduce sedentary time with hourly movement breaks"
      ]
    });
  }
  
  if (componentScores.sleep < threshold) {
    areas.push({
      area: "sleep",
      score: componentScores.sleep,
      recommendations: [
        "Improve sleep quality by maintaining a consistent sleep schedule",
        "Create a relaxing pre-sleep routine",
        "Limit screen time 1 hour before bed"
      ]
    });
  }
  
  if (componentScores.hydration < threshold) {
    areas.push({
      area: "hydration",
      score: componentScores.hydration,
      recommendations: [
        "Increase daily water intake to at least 8 glasses",
        "Use a water tracking app or bottle",
        "Drink a glass of water before each meal"
      ]
    });
  }
  
  if (componentScores.metabolic_health < threshold) {
    areas.push({
      area: "metabolic_health",
      score: componentScores.metabolic_health,
      recommendations: [
        "Focus on balanced meals with protein, healthy fats, and fiber",
        "Consider intermittent fasting after consulting a healthcare provider",
        "Limit added sugars and refined carbohydrates"
      ]
    });
  }
  
  return areas;
}

/**
 * Generates progress analytics with goal estimation and personalized insights
 * @param {Object} userData User's health and progress data
 * @returns {Object} Enhanced progress analytics
 */
async function getProgressAnalytics(userData) {
  // Calculate basic progress metrics
  const baseProgress = calculateBaseProgress(userData);
  
  // Generate AI-powered insights
  const aiInsights = await generateAIProgressInsights(userData, baseProgress);
  
  return {
    ...baseProgress,
    ai_insights: aiInsights,
    last_updated: new Date().toISOString()
  };
}

/**
 * Calculate base progress metrics from user data
 * @param {Object} userData User's health and progress data
 * @returns {Object} Base progress metrics
 */
function calculateBaseProgress(userData) {
  const {
    start_weight,
    current_weight,
    target_weight,
    start_date,
    goal_date,
    weekly_goal
  } = userData.weight_goal || {};
  
  if (!start_weight || !current_weight || !target_weight) {
    return {
      weight_progress: {
        percent_complete: 0,
        current_rate: 0,
        estimated_completion: null
      },
      achievement_rate: 0,
      streak_days: 0,
      consistency_score: 0
    };
  }
  
  // Calculate weight progress
  const totalWeightToLose = start_weight - target_weight;
  const weightLostSoFar = start_weight - current_weight;
  const percentComplete = Math.min(100, Math.max(0, (weightLostSoFar / totalWeightToLose) * 100));
  
  // Calculate current rate (lbs per week)
  const startDateObj = new Date(start_date);
  const currentDate = new Date();
  const weeksElapsed = Math.max(1, (currentDate - startDateObj) / (7 * 24 * 60 * 60 * 1000));
  const currentRate = weightLostSoFar / weeksElapsed;
  
  // Estimate completion date
  const remainingWeight = current_weight - target_weight;
  const estimatedWeeksRemaining = remainingWeight / (weekly_goal || currentRate);
  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setDate(currentDate.getDate() + Math.round(estimatedWeeksRemaining * 7));
  
  // Calculate achievement rate (how well the user is meeting their weekly goals)
  const achievementRate = Math.min(100, Math.max(0, (currentRate / weekly_goal) * 100));
  
  return {
    weight_progress: {
      start_weight,
      current_weight,
      target_weight,
      percent_complete: Math.round(percentComplete),
      weight_lost_so_far: weightLostSoFar.toFixed(1),
      remaining_weight: remainingWeight.toFixed(1),
      current_rate: currentRate.toFixed(2),
      weekly_goal: weekly_goal || 0,
      estimated_completion: estimatedCompletionDate.toISOString()
    },
    achievement_rate: Math.round(achievementRate),
    streak_days: userData.streak_days || 0,
    consistency_score: userData.consistency_score || 0
  };
}

/**
 * Generate AI-powered progress insights using user data and LLM
 * @param {Object} userData User's health data
 * @param {Object} baseProgress Base progress calculations
 * @returns {Object} AI-powered progress insights
 */
async function generateAIProgressInsights(userData, baseProgress) {
  try {
    // Prepare context for the AI model
    const userContext = {
      weight_progress: baseProgress.weight_progress,
      achievement_rate: baseProgress.achievement_rate,
      streak_days: baseProgress.streak_days,
      consistency_score: baseProgress.consistency_score,
      health_goals: userData.health_goals,
      recent_nutrition: userData.recent_nutrition_logs,
      recent_activity: userData.recent_activity_logs,
      challenges: userData.reported_challenges
    };
    
    // Generate insights using OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a supportive health coach AI. Provide encouraging, personalized progress insights based on user data. Focus on progress, not perfection, and offer specific, actionable advice for continued improvement."
        },
        {
          role: "user",
          content: `Analyze this progress data and provide insights and personalized recommendations: ${JSON.stringify(userContext)}`
        }
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });
    
    // Parse AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content);
    
    return {
      progress_summary: aiResponse.progress_summary || "You're making steady progress toward your goals. Keep focusing on consistency.",
      achievement_insights: aiResponse.achievement_insights || "You've been consistent with your tracking, which is a key factor in long-term success.",
      milestone_projections: aiResponse.milestone_projections || [
        {milestone: "25% complete", estimated_date: "2025-07-20"},
        {milestone: "50% complete", estimated_date: "2025-08-15"},
        {milestone: "75% complete", estimated_date: "2025-09-10"},
        {milestone: "100% complete", estimated_date: "2025-10-05"}
      ],
      focus_areas: aiResponse.focus_areas || ["Maintain consistent protein intake", "Gradually increase daily steps", "Prioritize sleep quality"]
    };
  } catch (error) {
    console.error("Error generating AI progress insights:", error);
    
    // Return default insights if AI generation fails
    return {
      progress_summary: "You're making progress toward your goals. Stay consistent with your habits.",
      achievement_insights: "Your consistency is key to long-term success.",
      milestone_projections: [
        {milestone: "25% complete", estimated_date: baseProgress.weight_progress.estimated_completion},
        {milestone: "50% complete", estimated_date: baseProgress.weight_progress.estimated_completion},
        {milestone: "75% complete", estimated_date: baseProgress.weight_progress.estimated_completion},
        {milestone: "100% complete", estimated_date: baseProgress.weight_progress.estimated_completion}
      ],
      focus_areas: ["Maintain consistent habits", "Stay hydrated", "Keep tracking your progress"]
    };
  }
}

module.exports = {
  getEnhancedHealthScoreAnalysis,
  getProgressAnalytics
};
