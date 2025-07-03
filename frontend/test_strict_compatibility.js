// Quick test to verify strict dietary compatibility logic
// This simulates the compatibility calculation for testing

const strictIncompatibilities = {
  'vegetarian': ['meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'seafood', 'lamb', 'veal', 'duck', 'game'],
  'vegan': ['meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'seafood', 'lamb', 'veal', 'duck', 'game', 'dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs', 'honey'],
  'pescatarian': ['meat', 'beef', 'pork', 'chicken', 'turkey', 'lamb', 'veal', 'duck', 'game'],
  'kosher': ['pork', 'shellfish', 'non-kosher'],
  'halal': ['pork', 'alcohol', 'non-halal'],
  'gluten-free': ['gluten', 'wheat', 'barley', 'rye', 'malt'],
  'dairy-free': ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'lactose'],
  'nut-free': ['nuts', 'peanuts', 'tree nuts', 'almonds', 'walnuts', 'cashews', 'pistachios'],
  'keto': ['high-carb', 'grains', 'sugar', 'bread', 'pasta', 'rice'],
  'paleo': ['grains', 'legumes', 'dairy', 'processed', 'sugar', 'bread', 'pasta']
}

function calculateCompatibilityScore(food, userProfile) {
  let score = 100
  let warnings = []
  let benefits = []

  const foodRestrictions = food.dietary_attributes?.dietary_restrictions || []
  const foodAllergens = food.dietary_attributes?.allergens || []
  const foodCategories = food.dietary_attributes?.food_categories || []

  // Check allergens first - critical scoring
  userProfile.allergens.forEach((allergen) => {
    if (foodAllergens.includes(allergen) || foodCategories.includes(allergen)) {
      score = 0 // Critical failure
      warnings.push(`⚠️ Contains ${allergen}`)
    }
  })

  // Only proceed with dietary restriction checks if no allergen conflicts
  if (score > 0) {
    // Check dietary restrictions with strict enforcement
    userProfile.dietary_restrictions.forEach((userRestriction) => {
      const incompatibleItems = strictIncompatibilities[userRestriction.toLowerCase()] || []
      
      // Check if food contains any incompatible items
      const hasIncompatibleRestriction = incompatibleItems.some(item => 
        foodRestrictions.some(fr => fr.toLowerCase().includes(item.toLowerCase())) ||
        foodCategories.some(fc => fc.toLowerCase().includes(item.toLowerCase()))
      )

      const hasCompatibleRestriction = foodRestrictions.some(fr => 
        fr.toLowerCase().includes(userRestriction.toLowerCase())
      )

      if (hasIncompatibleRestriction) {
        if (userProfile.strictness_level === 'strict') {
          score = 0 // Complete incompatibility for strict users
          warnings.push(`❌ Not ${userRestriction} (strict mode)`)
        } else {
          const penalty = userProfile.strictness_level === 'moderate' ? 40 : 20
          score -= penalty
          warnings.push(`⚠️ Not ${userRestriction}`)
        }
      } else if (hasCompatibleRestriction) {
        benefits.push(`✅ ${userRestriction.charAt(0).toUpperCase() + userRestriction.slice(1)}`)
      } else {
        // Neutral case - no explicit incompatibility but no confirmation either
        if (userProfile.strictness_level === 'strict') {
          const penalty = 15 // Minor penalty for uncertainty in strict mode
          score -= penalty
          warnings.push(`? Unverified ${userRestriction} status`)
        }
      }
    })
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    warnings,
    benefits,
    isSafe: score > 0
  }
}

// Test cases
const testCases = [
  {
    name: "Strict Vegetarian + Chicken",
    food: {
      name: "Grilled Chicken Breast",
      dietary_attributes: {
        dietary_restrictions: [],
        allergens: [],
        food_categories: ["meat", "chicken", "protein"]
      }
    },
    userProfile: {
      dietary_restrictions: ["vegetarian"],
      allergens: [],
      strictness_level: "strict"
    }
  },
  {
    name: "Strict Vegetarian + Tofu",
    food: {
      name: "Organic Tofu",
      dietary_attributes: {
        dietary_restrictions: ["vegetarian", "vegan"],
        allergens: [],
        food_categories: ["plant-based", "protein", "soy"]
      }
    },
    userProfile: {
      dietary_restrictions: ["vegetarian"],
      allergens: [],
      strictness_level: "strict"
    }
  },
  {
    name: "Moderate Vegetarian + Chicken",
    food: {
      name: "Grilled Chicken Breast",
      dietary_attributes: {
        dietary_restrictions: [],
        allergens: [],
        food_categories: ["meat", "chicken", "protein"]
      }
    },
    userProfile: {
      dietary_restrictions: ["vegetarian"],
      allergens: [],
      strictness_level: "moderate"
    }
  },
  {
    name: "Strict Vegan + Cheese",
    food: {
      name: "Cheddar Cheese",
      dietary_attributes: {
        dietary_restrictions: [],
        allergens: [],
        food_categories: ["dairy", "cheese"]
      }
    },
    userProfile: {
      dietary_restrictions: ["vegan"],
      allergens: [],
      strictness_level: "strict"
    }
  }
]

console.log("Testing Strict Dietary Compatibility Logic:\n")

testCases.forEach(testCase => {
  const result = calculateCompatibilityScore(testCase.food, testCase.userProfile)
  console.log(`${testCase.name}:`)
  console.log(`  Score: ${result.score}%`)
  console.log(`  Safe: ${result.isSafe}`)
  console.log(`  Warnings: ${result.warnings.join(', ') || 'None'}`)
  console.log(`  Benefits: ${result.benefits.join(', ') || 'None'}`)
  console.log()
})
