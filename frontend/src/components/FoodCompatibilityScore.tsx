import { useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Progress,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react'
import { FoodItem } from '../types'

interface FoodCompatibilityScoreProps {
  food: FoodItem
  userProfile: {
    dietary_restrictions: string[]
    allergens: string[]
    strictness_level: 'flexible' | 'moderate' | 'strict'
  }
}

// AI-powered compatibility scoring with strict dietary adherence
const calculateCompatibilityScore = (food: FoodItem, userProfile: any) => {
  if (!userProfile || (!userProfile.dietary_restrictions?.length && !userProfile.allergens?.length)) {
    // If no dietary preferences set, return neutral score
    return {
      score: 75,
      rating: 'good' as const,
      warnings: [],
      benefits: ['No dietary restrictions set']
    }
  }

  let score = 100
  let warnings: string[] = []
  let benefits: string[] = []

  const foodRestrictions = food.dietary_attributes?.dietary_restrictions || []
  const foodAllergens = food.dietary_attributes?.allergens || []
  const foodCategories = food.dietary_attributes?.food_categories || []

  console.log('🔍 Calculating compatibility for:', food.name, {
    userProfile,
    foodRestrictions,
    foodAllergens,
    foodCategories
  })

  // Define incompatible combinations for strict enforcement
  const strictIncompatibilities: Record<string, string[]> = {
    'vegetarian': ['meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'seafood', 'lamb', 'veal', 'duck', 'game'],
    'vegan': ['meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'seafood', 'lamb', 'veal', 'duck', 'game', 'dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'eggs', 'honey'],
    'pescatarian': ['meat', 'beef', 'pork', 'chicken', 'turkey', 'lamb', 'veal', 'duck', 'game'], // Note: fish/seafood NOT in this list
    'kosher': ['pork', 'shellfish', 'non-kosher'],
    'halal': ['pork', 'alcohol', 'non-halal'],
    'gluten-free': ['gluten', 'wheat', 'barley', 'rye', 'malt'],
    'dairy-free': ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'lactose'],
    'nut-free': ['nuts', 'peanuts', 'tree nuts', 'almonds', 'walnuts', 'cashews', 'pistachios'],
    'keto': ['high-carb', 'grains', 'sugar', 'bread', 'pasta', 'rice'],
    'paleo': ['grains', 'legumes', 'dairy', 'processed', 'sugar', 'bread', 'pasta']
  }

  // Nutritional thresholds for fitness goals (per 100g or serving)
  const nutritionalGoals = {
    'high-protein': { 
      minProtein: 15, // grams per serving
      benefits: (food: FoodItem) => (food.nutrition?.protein || 0) >= 15 ? ['High protein content'] : [],
      penalties: (food: FoodItem) => {
        const protein = food.nutrition?.protein || 0
        if (protein < 5) return 40  // Very low protein
        if (protein < 10) return 30 // Low protein  
        if (protein < 15) return 20 // Below high-protein threshold
        return 0
      }
    },
    'low-carb': {
      maxCarbs: 15, // grams per serving
      benefits: (food: FoodItem) => (food.nutrition?.carbs || 0) <= 10 ? ['Very low carb'] : (food.nutrition?.carbs || 0) <= 15 ? ['Low carb friendly'] : [],
      penalties: (food: FoodItem) => {
        const carbs = food.nutrition?.carbs || 0
        if (carbs > 30) return 40 // High carb
        if (carbs > 20) return 25 // Moderate carb
        if (carbs > 15) return 15 // Above low-carb threshold
        return 0
      }
    },
    'low-sugar': {
      maxSugar: 5, // grams per serving
      benefits: (food: FoodItem) => (food.nutrition?.sugar || 0) <= 2 ? ['Sugar-free'] : (food.nutrition?.sugar || 0) <= 5 ? ['Low sugar'] : [],
      penalties: (food: FoodItem) => {
        const sugar = food.nutrition?.sugar || 0
        if (sugar > 20) return 50 // Very high sugar
        if (sugar > 10) return 35 // High sugar
        if (sugar > 5) return 20  // Above low-sugar threshold
        return 0
      }
    },
    'whole-foods': {
      benefits: (food: FoodItem) => {
        const categories = food.dietary_attributes?.food_categories || []
        const restrictions = food.dietary_attributes?.dietary_restrictions || []
        if (restrictions.includes('whole-foods') || categories.includes('whole-foods') || categories.includes('unprocessed')) {
          return ['Whole food']
        }
        return []
      },
      penalties: (food: FoodItem) => {
        const categories = food.dietary_attributes?.food_categories || []
        const restrictions = food.dietary_attributes?.dietary_restrictions || []
        if (restrictions.includes('whole-foods')) return 0 // No penalty if marked as whole food
        if (categories.includes('processed') || categories.includes('ultra-processed')) return 35
        if (categories.includes('packaged')) return 15
        return 0
      }
    },
    'heart-healthy': {
      maxSodium: 600, // mg per serving
      benefits: (food: FoodItem) => {
        const benefits = []
        const restrictions = food.dietary_attributes?.dietary_restrictions || []
        if (restrictions.includes('heart-healthy')) benefits.push('Heart healthy')
        if ((food.nutrition?.fiber || 0) >= 5) benefits.push('High fiber')
        if ((food.nutrition?.sodium || 0) <= 300) benefits.push('Low sodium')
        return benefits
      },
      penalties: (food: FoodItem) => {
        const restrictions = food.dietary_attributes?.dietary_restrictions || []
        if (restrictions.includes('heart-healthy')) return 0 // No penalty if marked as heart healthy
        const sodium = food.nutrition?.sodium || 0
        if (sodium > 1200) return 40 // Very high sodium
        if (sodium > 800) return 25  // High sodium
        if (sodium > 600) return 15  // Above heart-healthy threshold
        return 0
      }
    },
    'anti-inflammatory': {
      benefits: (food: FoodItem) => {
        const categories = food.dietary_attributes?.food_categories || []
        const restrictions = food.dietary_attributes?.dietary_restrictions || []
        const benefits = []
        if (restrictions.includes('anti-inflammatory')) benefits.push('Anti-inflammatory')
        if (categories.includes('antioxidant-rich')) benefits.push('Antioxidant rich')
        if (categories.includes('omega-3')) benefits.push('Omega-3 rich')
        return benefits
      },
      penalties: (food: FoodItem) => {
        const categories = food.dietary_attributes?.food_categories || []
        const restrictions = food.dietary_attributes?.dietary_restrictions || []
        if (restrictions.includes('anti-inflammatory')) return 0 // No penalty if marked as anti-inflammatory
        if (categories.includes('inflammatory') || categories.includes('ultra-processed')) return 30
        if (categories.includes('processed')) return 15
        return 0
      }
    },
    'high-fiber': {
      minFiber: 5, // grams per serving
      benefits: (food: FoodItem) => {
        const fiber = food.nutrition?.fiber || 0
        if (fiber >= 8) return ['Very high fiber']
        if (fiber >= 5) return ['High fiber']
        return []
      },
      penalties: (food: FoodItem) => {
        const fiber = food.nutrition?.fiber || 0
        if (fiber < 1) return 25  // Very low fiber
        if (fiber < 3) return 15  // Low fiber
        if (fiber < 5) return 10  // Below high-fiber threshold
        return 0
      }
    }
  }

  // Check allergens first - critical scoring
  userProfile.allergens.forEach((allergen: string) => {
    if (foodAllergens.includes(allergen) || foodCategories.includes(allergen)) {
      score = 0 // Critical failure
      warnings.push(`⚠️ Contains ${allergen}`)
    }
  })

  // Only proceed with dietary restriction checks if no allergen conflicts
  if (score > 0) {
    // Check dietary restrictions with strict enforcement
    userProfile.dietary_restrictions.forEach((userRestriction: string) => {
      const incompatibleItems = strictIncompatibilities[userRestriction.toLowerCase()] || []
      
      // Check if food contains any incompatible items
      const hasIncompatibleRestriction = incompatibleItems.some(item => 
        foodRestrictions.some(fr => fr.toLowerCase().includes(item.toLowerCase())) ||
        foodCategories.some(fc => fc.toLowerCase().includes(item.toLowerCase()))
      )

      const hasCompatibleRestriction = foodRestrictions.some(fr => 
        fr.toLowerCase().includes(userRestriction.toLowerCase())
      )

      // Special logic for naturally compatible foods
      let isNaturallyCompatible = false
      if (userRestriction.toLowerCase() === 'vegan') {
        // Check if food is naturally vegan (fruits, vegetables, grains, etc.)
        const naturallyVeganCategories = ['fruit', 'fruits', 'vegetable', 'vegetables', 'grain', 'grains', 'nuts', 'seeds', 'legume', 'legumes', 'berries', 'herbs', 'spices']
        const isNaturallyVegan = foodCategories.some(cat => naturallyVeganCategories.includes(cat.toLowerCase()))
        const plantBasedWords = ['avocado', 'apple', 'banana', 'orange', 'lettuce', 'tomato', 'carrot', 'spinach', 'kale', 'broccoli', 'quinoa', 'rice', 'oats', 'almond', 'walnut', 'cashew', 'pistachio', 'pecan']
        const soundsPlantBased = plantBasedWords.some(word => food.name.toLowerCase().includes(word))
        
        isNaturallyCompatible = isNaturallyVegan || soundsPlantBased || 
          (foodCategories.length === 0 && foodRestrictions.length === 0 && !hasIncompatibleRestriction)
      } else if (userRestriction.toLowerCase() === 'vegetarian') {
        // Similar logic for vegetarian
        const vegetarianFriendlyCategories = ['fruit', 'fruits', 'vegetable', 'vegetables', 'grain', 'grains', 'nuts', 'seeds', 'legume', 'legumes', 'berries', 'herbs', 'spices', 'dairy', 'eggs']
        const isVegetarianFriendly = foodCategories.some(cat => vegetarianFriendlyCategories.includes(cat.toLowerCase()))
        const meatItems = ['meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'seafood', 'lamb', 'veal', 'duck', 'game']
        const hasMeat = foodCategories.some(cat => meatItems.includes(cat.toLowerCase()))
        
        isNaturallyCompatible = isVegetarianFriendly || 
          (foodCategories.length === 0 && foodRestrictions.length === 0 && !hasMeat)
      }

      // Special logic for pescatarian - if it's fish/seafood, it's automatically compatible
      const isPescatarianCompatible = userRestriction.toLowerCase() === 'pescatarian' && 
        (foodCategories.includes('fish') || foodCategories.includes('seafood') || 
         foodRestrictions.includes('pescatarian'))

      if (hasIncompatibleRestriction && !isNaturallyCompatible) {
        if (userProfile.strictness_level === 'strict') {
          score = 0 // Complete incompatibility for strict users
          warnings.push(`❌ Not ${userRestriction} (strict mode)`)
        } else {
          const penalty = userProfile.strictness_level === 'moderate' ? 40 : 20
          score -= penalty
          warnings.push(`⚠️ Not ${userRestriction}`)
        }
      } else if (hasCompatibleRestriction || isPescatarianCompatible || isNaturallyCompatible) {
        benefits.push(`✅ ${userRestriction.charAt(0).toUpperCase() + userRestriction.slice(1)}`)
      } else {
        // Only show "Unverified" warnings for foods that could reasonably be expected to have labels
        // Skip for whole foods, simple ingredients, and basic items that are naturally compatible
        const isBasicFood = foodCategories.includes('fruit') || foodCategories.includes('vegetable') || 
                           foodCategories.includes('grain') || foodCategories.includes('legume') ||
                           foodCategories.includes('nuts') || foodCategories.includes('dairy') ||
                           !foodCategories.includes('processed')
        
        // For pescatarian, if it's clearly plant-based or dairy, don't show unverified warning
        const isPescatarianSafe = userRestriction.toLowerCase() === 'pescatarian' && 
          (foodCategories.includes('fruit') || foodCategories.includes('vegetable') || 
           foodCategories.includes('grain') || foodCategories.includes('legume') ||
           foodCategories.includes('nuts') || foodCategories.includes('dairy') ||
           foodRestrictions.includes('vegetarian') || foodRestrictions.includes('vegan'))

        if (userProfile.strictness_level === 'strict' && !isBasicFood && !isPescatarianSafe) {
          const penalty = 10 // Reduced penalty for uncertainty
          score -= penalty
          warnings.push(`? Unverified ${userRestriction} status`)
        }
      }
    })
  }

  // Bonus points for additional beneficial attributes (only if base compatibility exists)
  if (score > 0) {
    foodRestrictions.forEach((restriction: string) => {
      if (!userProfile.dietary_restrictions.some((ur: string) => 
          ur.toLowerCase() === restriction.toLowerCase())) {
        score += 3
        benefits.push(`+ ${restriction}`)
      }
    })
  }

  // Evaluate fitness goals based on nutritional content
  if (score > 0) {
    userProfile.dietary_restrictions.forEach((goal: string) => {
      if (nutritionalGoals[goal as keyof typeof nutritionalGoals]) {
        const { benefits: goalBenefits, penalties: goalPenalties } = nutritionalGoals[goal as keyof typeof nutritionalGoals]
        const goalBenefitsList = goalBenefits(food)
        let penalty = goalPenalties(food)

        // Apply strictness multiplier for penalties
        if (userProfile.strictness_level === 'strict' && penalty > 0) {
          penalty = Math.min(50, penalty * 1.5) // Increase penalty by 50% for strict users, cap at 50
        } else if (userProfile.strictness_level === 'moderate' && penalty > 0) {
          penalty = Math.min(40, penalty * 1.2) // Increase penalty by 20% for moderate users, cap at 40
        }

        // Apply penalties for not meeting the goal
        if (penalty > 0) {
          console.log(`🔍 Applying penalty for ${goal}: ${penalty} points for ${food.name}`)
          score -= penalty
          
          // Add warnings for nutritional mismatches - only when food doesn't meet the goal
          if (userProfile.strictness_level === 'strict') {
            if (goal === 'high-protein' && (food.nutrition?.protein || 0) < 15) {
              warnings.push(`⚠️ Low protein: ${food.nutrition?.protein || 0}g (need ≥15g)`)
            } else if (goal === 'low-carb' && (food.nutrition?.carbs || 0) > 15) {
              warnings.push(`⚠️ High carb: ${food.nutrition?.carbs || 0}g (need ≤15g)`)
            } else if (goal === 'low-sugar' && (food.nutrition?.sugar || 0) > 5) {
              warnings.push(`⚠️ High sugar: ${food.nutrition?.sugar || 0}g (need ≤5g)`)
            } else if (goal === 'high-fiber' && (food.nutrition?.fiber || 0) < 5) {
              warnings.push(`⚠️ Low fiber: ${food.nutrition?.fiber || 0}g (need ≥5g)`)
            }
          }
        }

        // Add benefits if the goal is met (only when penalty is 0)
        if (penalty === 0) {
          benefits.push(...goalBenefitsList)
        }
      }
    })
  }

  const finalScore = Math.max(0, Math.min(100, score))
  console.log(`🎯 Final compatibility score for ${food.name}: ${finalScore}% (penalties applied: ${100 - score})`)

  return {
    score: finalScore,
    warnings,
    benefits,
    isSafe: finalScore > 0
  }
}

export default function FoodCompatibilityScore({ food, userProfile }: FoodCompatibilityScoreProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const compatibility = useMemo(() => 
    calculateCompatibilityScore(food, userProfile), 
    [food, userProfile]
  )

  const getScoreColor = () => {
    if (!compatibility.isSafe) return 'red'
    if (compatibility.score >= 80) return 'green'
    if (compatibility.score >= 60) return 'yellow'
    return 'orange'
  }

  const getScoreLabel = () => {
    if (!compatibility.isSafe) return 'Incompatible'
    if (compatibility.score >= 95) return 'Perfect Match'
    if (compatibility.score >= 85) return 'Excellent'
    if (compatibility.score >= 70) return 'Good'
    if (compatibility.score >= 50) return 'Okay'
    if (compatibility.score >= 25) return 'Poor Match'
    return 'Avoid'
  }

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth={1} size="sm">
      <CardBody p={3}>
        <VStack spacing={3} align="stretch">
          {/* Score Header */}
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="sm">Diet Compatibility</Text>
            <Tooltip label={`${compatibility.score}/100 compatibility score`}>
              <Badge 
                colorScheme={getScoreColor()} 
                variant={compatibility.isSafe ? 'solid' : 'outline'}
                px={2}
              >
                {getScoreLabel()}
              </Badge>
            </Tooltip>
          </HStack>

          {/* Progress Bar */}
          {compatibility.isSafe && (
            <Progress 
              value={compatibility.score} 
              colorScheme={getScoreColor()} 
              size="sm"
              borderRadius="md"
            />
          )}

          {/* Benefits */}
          {compatibility.benefits.length > 0 && (
            <VStack spacing={1} align="stretch">
              <Text fontSize="xs" fontWeight="medium" color="green.600">
                ✅ Compatible Features:
              </Text>
              <Box>
                {compatibility.benefits.slice(0, 3).map((benefit, idx) => (
                  <Badge key={idx} colorScheme="green" variant="outline" size="sm" mr={1} mb={1}>
                    {benefit}
                  </Badge>
                ))}
                {compatibility.benefits.length > 3 && (
                  <Badge colorScheme="green" variant="outline" size="sm">
                    +{compatibility.benefits.length - 3} more
                  </Badge>
                )}
              </Box>
            </VStack>
          )}

          {/* Warnings */}
          {compatibility.warnings.length > 0 && (
            <VStack spacing={1} align="stretch">
              <Text fontSize="xs" fontWeight="medium" color="red.600">
                ⚠️ Concerns:
              </Text>
              <Box>
                {compatibility.warnings.map((warning, idx) => (
                  <Badge key={idx} colorScheme="red" variant="outline" size="sm" mr={1} mb={1}>
                    {warning}
                  </Badge>
                ))}
              </Box>
            </VStack>
          )}

          {/* Food Categories */}
          {food.dietary_attributes?.food_categories && food.dietary_attributes.food_categories.length > 0 && (
            <VStack spacing={1} align="stretch">
              <Text fontSize="xs" fontWeight="medium" color="gray.600">
                🏷️ Categories:
              </Text>
              <Box>
                {food.dietary_attributes.food_categories.map((category, idx) => (
                  <Badge key={idx} colorScheme="blue" variant="subtle" size="sm" mr={1} mb={1}>
                    {category}
                  </Badge>
                ))}
              </Box>
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
