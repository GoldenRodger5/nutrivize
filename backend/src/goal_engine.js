/**
 * Goal Engine Service
 * Centralizes all goal-related calculations and business logic
 */

// Constants for calorie calculations
const CALORIES_PER_KG_OF_FAT = 7700;  // Approximately 7700 calories per kg of body fat

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
 */
function calculateBMR(age, gender, heightCm, weightKg) {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

/**
 * Calculate Total Daily Energy Expenditure
 */
function calculateTDEE(bmr, activityLevel) {
  const activityMultipliers = {
    'sedentary': 1.2,      // Little to no exercise
    'light': 1.375,        // Light exercise 1-3 days/week
    'moderate': 1.55,      // Moderate exercise 3-5 days/week
    'active': 1.725,       // Hard exercise 6-7 days/week
    'very_active': 1.9     // Very hard exercise & physical job or 2x training
  };
  
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  return bmr * multiplier;
}

/**
 * Calculate daily calorie target based on weight goal
 */
function calculateCalorieTarget(tdee, goalType, weeklyRate) {
  if (goalType === 'maintain') {
    return tdee;
  }
  
  const dailyCalorieAdjustment = (weeklyRate * CALORIES_PER_KG_OF_FAT) / 7;
  
  if (goalType === 'lose') {
    // Ensure minimum healthy calorie intake (1200 for women, 1500 for men typically)
    return Math.max(1200, tdee - dailyCalorieAdjustment);
  } else if (goalType === 'gain') {
    return tdee + dailyCalorieAdjustment;
  }
  
  return tdee; // Default to maintenance if goal type is unknown
}

/**
 * Calculate macronutrient targets based on calorie goal
 * Returns grams of protein, carbs, and fat
 */
function calculateMacroTargets(calorieTarget, proteinPct = 30, carbsPct = 40, fatPct = 30) {
  // Ensure percentages add up to 100
  const totalPct = proteinPct + carbsPct + fatPct;
  if (totalPct !== 100) {
    const factor = 100 / totalPct;
    proteinPct *= factor;
    carbsPct *= factor;
    fatPct *= factor;
  }
  
  // Protein and carbs have 4 calories per gram, fat has 9 calories per gram
  const proteinGrams = (calorieTarget * (proteinPct / 100)) / 4;
  const carbsGrams = (calorieTarget * (carbsPct / 100)) / 4;
  const fatGrams = (calorieTarget * (fatPct / 100)) / 9;
  
  return {
    protein: Math.round(proteinGrams),
    carbs: Math.round(carbsGrams),
    fat: Math.round(fatGrams)
  };
}

/**
 * Calculate fiber recommendation based on calorie intake
 */
function calculateFiberTarget(calorieTarget) {
  // General recommendation: 14g of fiber per 1000 calories consumed
  return Math.round(calorieTarget * 0.014);
}

/**
 * Generate recommendations for a specific goal type
 */
function generateRecommendations(goalType, currentStats, progress) {
  if (goalType === 'lose') {
    if (progress < 0.2) {
      return "Focus on establishing consistent tracking habits. Aim to log all your meals and stay within your calorie target.";
    } else if (progress < 0.5) {
      return "You're making steady progress! Consider adding more protein-rich foods to help preserve muscle mass while losing fat.";
    } else {
      return "You're getting closer to your goal weight! This is when progress often slows. Stay consistent and consider adding more activity to your routine.";
    }
  } else if (goalType === 'gain') {
    if (progress < 0.2) {
      return "Focus on gradually increasing your calorie intake. Prioritize nutrient-dense foods to support muscle growth.";
    } else if (progress < 0.5) {
      return "You're making good progress! Ensure you're getting enough protein and consider progressive resistance training to optimize muscle gain.";
    } else {
      return "You're getting closer to your goal weight! Continue with your calorie surplus and consider adjusting your training to target any lagging muscle groups.";
    }
  } else { // maintain
    return "You're doing well maintaining your weight. Focus on consistency with both nutrition and exercise to support your long-term health goals.";
  }
}

/**
 * Calculate the progress percentage toward a weight goal
 */
function calculateWeightProgress(currentWeight, startingWeight, targetWeight) {
  if (startingWeight === targetWeight) return 1; // Already at goal
  
  const totalChange = Math.abs(targetWeight - startingWeight);
  const currentChange = Math.abs(currentWeight - startingWeight);
  
  return Math.min(1, Math.max(0, currentChange / totalChange));
}

/**
 * Get feedback on daily progress based on current consumption vs targets
 */
function getDailyProgressFeedback(consumedCalories, targetCalories, goalType) {
  const percentConsumed = (consumedCalories / targetCalories) * 100;
  
  // Different feedback based on goal type
  if (goalType === 'lose') {
    if (percentConsumed < 80) {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for weight loss.`,
        status: 'under',
        recommendation: "You're under your target. While a calorie deficit is good for weight loss, eating too little can slow metabolism. Consider a nutritious snack."
      };
    } else if (percentConsumed <= 100) {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for weight loss.`,
        status: 'on-track',
        recommendation: "You're on track with your weight loss calorie goal. Great job balancing nutrition and creating a healthy deficit."
      };
    } else {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for weight loss.`,
        status: 'over',
        recommendation: "You've exceeded your calorie target. Consider balancing with some light activity or adjusting tomorrow's intake."
      };
    }
  } else if (goalType === 'gain') {
    if (percentConsumed < 90) {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for weight gain.`,
        status: 'under',
        recommendation: "You're under your calorie target for muscle gain. Try adding calorie-dense foods like nuts, avocados, or a protein shake."
      };
    } else if (percentConsumed <= 110) {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for weight gain.`,
        status: 'on-track',
        recommendation: "You're right on track with your calorie surplus for muscle gain. Keep focusing on quality protein and nutrient-dense foods."
      };
    } else {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for weight gain.`,
        status: 'over',
        recommendation: "You've exceeded your calorie target. While a surplus is needed for weight gain, too much may lead to excess fat gain."
      };
    }
  } else { // maintain
    if (percentConsumed < 90) {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for maintenance.`,
        status: 'under',
        recommendation: "You're under your maintenance calories. Consider adding a balanced snack to meet your energy needs."
      };
    } else if (percentConsumed <= 110) {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for maintenance.`,
        status: 'on-track',
        recommendation: "You're right on track with your maintenance calories. This balance will help sustain your current weight."
      };
    } else {
      return {
        message: `You're at ${Math.round(percentConsumed)}% of your calorie target for maintenance.`,
        status: 'over',
        recommendation: "You've exceeded your maintenance calories. Consider balancing with some activity or adjusting tomorrow's intake."
      };
    }
  }
}

/**
 * Get feedback on macro consumption
 */
function getMacroFeedback(consumed, target, macroType) {
  const percentage = (consumed / target) * 100;
  
  let status, message;
  
  if (percentage < 80) {
    status = 'under';
    message = `You're under your ${macroType} target.`;
  } else if (percentage <= 120) {
    status = 'on-track';
    message = `You're on track with your ${macroType} intake.`;
  } else {
    status = 'over';
    message = `You've exceeded your ${macroType} target.`;
  }
  
  return { status, message, percentage: Math.round(percentage) };
}

/**
 * Generate meal suggestions based on remaining macros and goal type
 */
function suggestMeals(remainingMacros, goalType, foodIndex) {
  let suggestions = [];
  
  // Filter foods based on the goal type and remaining macros
  if (goalType === 'lose') {
    if (remainingMacros.calories < 300) {
      // Low calorie, high protein options for weight loss when near limit
      suggestions = foodIndex.filter(food => 
        food.calories <= remainingMacros.calories && 
        food.proteins >= 10 && 
        food.calories / food.proteins < 15 // Good protein-to-calorie ratio
      );
    } else {
      // Balanced, nutrient-dense options for weight loss
      suggestions = foodIndex.filter(food => 
        food.calories <= remainingMacros.calories * 0.6 &&
        food.proteins >= 15
      );
    }
  } else if (goalType === 'gain') {
    // Calorie and protein-rich options for weight gain
    suggestions = foodIndex.filter(food => 
      food.calories >= 200 && 
      food.proteins >= 15 && 
      food.calories <= remainingMacros.calories
    );
  } else { // maintain
    // Balanced options for maintenance
    suggestions = foodIndex.filter(food => 
      food.calories <= remainingMacros.calories * 0.7 &&
      food.proteins + food.carbs + food.fats > 15
    );
  }
  
  // Sort by best match for the goal
  if (goalType === 'lose') {
    suggestions.sort((a, b) => (b.proteins / b.calories) - (a.proteins / a.calories)); // Highest protein-to-calorie ratio
  } else if (goalType === 'gain') {
    suggestions.sort((a, b) => b.calories - a.calories); // Highest calories
  } else {
    suggestions.sort((a, b) => Math.abs(0.3 - a.proteins / a.calories) - Math.abs(0.3 - b.proteins / a.calories)); // Most balanced
  }
  
  return suggestions.slice(0, 5); // Return top 5 suggestions
}

/**
 * Generate weekly insights based on tracked data and goal
 */
function generateWeeklyInsights(weeklyData, goal) {
  const goalType = goal.goalType;
  const targetCalories = goal.nutritionGoal.dailyCalories;
  
  // Calculate average macros
  const avgCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0) / weeklyData.length;
  const avgProtein = weeklyData.reduce((sum, day) => sum + day.protein, 0) / weeklyData.length;
  const avgCarbs = weeklyData.reduce((sum, day) => sum + day.carbs, 0) / weeklyData.length;
  const avgFat = weeklyData.reduce((sum, day) => sum + day.fat, 0) / weeklyData.length;
  
  // Calculate adherence to calorie goal
  const calorieAdherence = weeklyData.filter(day => {
    if (goalType === 'lose') return day.calories <= targetCalories * 1.05;
    if (goalType === 'gain') return day.calories >= targetCalories * 0.95;
    return day.calories >= targetCalories * 0.9 && day.calories <= targetCalories * 1.1;
  }).length / weeklyData.length;
  
  // Generate motivational message
  let message;
  if (goalType === 'lose') {
    if (avgProtein >= goal.nutritionGoal.macroDistribution.protein * targetCalories / 400) { // Convert % to grams
      message = "You're consistently hitting your protein goal—this supports fat loss while maintaining muscle.";
    } else if (calorieAdherence >= 0.8) {
      message = "Great job staying within your calorie targets! Consistency is key for sustainable weight loss.";
    } else {
      message = "Focus on hitting your calorie targets more consistently to accelerate progress toward your weight loss goal.";
    }
  } else if (goalType === 'gain') {
    if (avgCalories >= targetCalories * 0.95) {
      message = "You're consistently hitting your calorie surplus, which is essential for muscle gain and weight gain.";
    } else if (avgProtein >= goal.nutritionGoal.macroDistribution.protein * targetCalories / 400) {
      message = "Your protein intake is good, but try to increase your overall calories to support your weight gain goal.";
    } else {
      message = "Aim to increase both calories and protein to maximize your progress toward your weight gain goal.";
    }
  } else { // maintain
    if (calorieAdherence >= 0.8) {
      message = "You're doing a great job maintaining balance in your diet, which supports your weight maintenance goal.";
    } else if (Math.abs(avgCalories - targetCalories) <= 200) {
      message = "Your weekly calorie average is close to your maintenance target. Keep up the consistent tracking!";
    } else {
      message = "Try to keep your daily calories closer to your maintenance target for more stable weight maintenance.";
    }
  }
  
  return {
    adherencePercentage: Math.round(calorieAdherence * 100),
    averages: {
      calories: Math.round(avgCalories),
      protein: Math.round(avgProtein),
      carbs: Math.round(avgCarbs),
      fat: Math.round(avgFat)
    },
    message,
    daysOnTrack: Math.round(calorieAdherence * weeklyData.length)
  };
}

// Export all functions
module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacroTargets,
  calculateFiberTarget,
  generateRecommendations,
  calculateWeightProgress,
  getDailyProgressFeedback,
  getMacroFeedback,
  suggestMeals,
  generateWeeklyInsights
}; 