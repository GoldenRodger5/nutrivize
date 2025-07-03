// Quick test for fitness goals compatibility
import { FoodItem } from './types'

// Test fitness goals scenarios
const testFitnessGoalsCompatibility = () => {
  // Mock foods with different nutritional profiles
  const highProteinFood: FoodItem = {
    id: 'test-protein',
    name: 'Chicken Breast',
    source: 'test',
    serving_size: 100,
    serving_unit: 'g',
    nutrition: {
      calories: 165,
      protein: 31, // High protein
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74
    },
    dietary_attributes: {
      dietary_restrictions: ['high-protein'],
      allergens: [],
      food_categories: ['meat', 'protein']
    }
  }

  const highCarbFood: FoodItem = {
    id: 'test-carb',
    name: 'White Rice',
    source: 'test',
    serving_size: 100,
    serving_unit: 'g',
    nutrition: {
      calories: 130,
      protein: 2.7,
      carbs: 28, // High carbs
      fat: 0.3,
      fiber: 0.4,
      sugar: 0.1,
      sodium: 5
    },
    dietary_attributes: {
      dietary_restrictions: [],
      allergens: [],
      food_categories: ['grains', 'carbohydrates']
    }
  }

  const highSugarFood: FoodItem = {
    id: 'test-sugar',
    name: 'Candy Bar',
    source: 'test',
    serving_size: 50,
    serving_unit: 'g',
    nutrition: {
      calories: 250,
      protein: 3,
      carbs: 35,
      fat: 12,
      fiber: 1,
      sugar: 25, // Very high sugar
      sodium: 50
    },
    dietary_attributes: {
      dietary_restrictions: [],
      allergens: [],
      food_categories: ['processed', 'sweets']
    }
  }

  // Test user profiles
  const gymRatProfile = {
    dietary_restrictions: ['high-protein', 'low-carb', 'low-sugar'],
    allergens: [],
    strictness_level: 'strict' as const
  }

  const healthConscious = {
    dietary_restrictions: ['whole-foods', 'low-sugar', 'heart-healthy'],
    allergens: [],
    strictness_level: 'moderate' as const
  }

  console.log('🏋️‍♂️ GYM RAT PROFILE (high-protein, low-carb, low-sugar, strict):')
  console.log('Chicken Breast (high protein):', calculateCompatibilityScore(highProteinFood, gymRatProfile))
  console.log('White Rice (high carb):', calculateCompatibilityScore(highCarbFood, gymRatProfile))
  console.log('Candy Bar (high sugar):', calculateCompatibilityScore(highSugarFood, gymRatProfile))

  console.log('\n🌱 HEALTH CONSCIOUS (whole-foods, low-sugar, heart-healthy, moderate):')
  console.log('Chicken Breast:', calculateCompatibilityScore(highProteinFood, healthConscious))
  console.log('White Rice:', calculateCompatibilityScore(highCarbFood, healthConscious))
  console.log('Candy Bar:', calculateCompatibilityScore(highSugarFood, healthConscious))
}

// Simple version of the compatibility function for testing
const calculateCompatibilityScore = (food: FoodItem, userProfile: any) => {
  let score = 100
  let warnings: string[] = []
  let benefits: string[] = []

  const nutritionalGoals = {
    'high-protein': { 
      benefits: (food: FoodItem) => (food.nutrition?.protein || 0) >= 15 ? ['High protein content'] : [],
      penalties: (food: FoodItem) => (food.nutrition?.protein || 0) < 10 ? 30 : (food.nutrition?.protein || 0) < 15 ? 15 : 0
    },
    'low-carb': {
      benefits: (food: FoodItem) => (food.nutrition?.carbs || 0) <= 10 ? ['Very low carb'] : (food.nutrition?.carbs || 0) <= 15 ? ['Low carb friendly'] : [],
      penalties: (food: FoodItem) => (food.nutrition?.carbs || 0) > 30 ? 40 : (food.nutrition?.carbs || 0) > 15 ? 20 : 0
    },
    'low-sugar': {
      benefits: (food: FoodItem) => (food.nutrition?.sugar || 0) <= 2 ? ['Sugar-free'] : (food.nutrition?.sugar || 0) <= 5 ? ['Low sugar'] : [],
      penalties: (food: FoodItem) => (food.nutrition?.sugar || 0) > 15 ? 50 : (food.nutrition?.sugar || 0) > 5 ? 25 : 0
    },
    'whole-foods': {
      benefits: (food: FoodItem) => {
        const categories = food.dietary_attributes?.food_categories || []
        if (categories.includes('whole-foods') || categories.includes('unprocessed')) return ['Whole food']
        return []
      },
      penalties: (food: FoodItem) => {
        const categories = food.dietary_attributes?.food_categories || []
        if (categories.includes('processed') || categories.includes('ultra-processed')) return 35
        if (categories.includes('packaged')) return 15
        return 0
      }
    },
    'heart-healthy': {
      benefits: (food: FoodItem) => {
        const benefits = []
        if ((food.nutrition?.fiber || 0) >= 5) benefits.push('High fiber')
        if ((food.nutrition?.sodium || 0) <= 300) benefits.push('Low sodium')
        return benefits
      },
      penalties: (food: FoodItem) => (food.nutrition?.sodium || 0) > 1000 ? 30 : (food.nutrition?.sodium || 0) > 600 ? 15 : 0
    }
  }

  // Evaluate fitness goals
  userProfile.dietary_restrictions.forEach((goal: string) => {
    if (nutritionalGoals[goal as keyof typeof nutritionalGoals]) {
      const { benefits: goalBenefits, penalties: goalPenalties } = nutritionalGoals[goal as keyof typeof nutritionalGoals]
      const goalBenefitsList = goalBenefits(food)
      const penalty = goalPenalties(food)

      if (penalty > 0) {
        score -= penalty
        if (userProfile.strictness_level === 'strict' && penalty >= 30) {
          warnings.push(`⚠️ Does not meet ${goal} requirements`)
        }
      }

      benefits.push(...goalBenefitsList)
    }
  })

  return {
    score: Math.max(0, Math.min(100, score)),
    warnings,
    benefits,
    isSafe: score > 0
  }
}

// Run the test
testFitnessGoalsCompatibility()

export { testFitnessGoalsCompatibility }
