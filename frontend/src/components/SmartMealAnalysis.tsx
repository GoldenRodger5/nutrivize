import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Heading,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react'
import { FoodItem } from '../types'

interface MealAnalysisProps {
  foods: FoodItem[]
  userProfile: {
    dietary_restrictions: string[]
    allergens: string[]
    strictness_level: string
    daily_calories?: number
    daily_protein?: number
  }
}

interface MealAnalysis {
  overall_score: number
  safety_score: number
  conflicts: Array<{
    type: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    food_name: string
    conflict: string
    recommendation: string
  }>
  nutritional_balance: {
    protein: string
    carbs: string
    fats: string
    fiber: string
  }
  highlights: string[]
  suggestions: string[]
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

export default function SmartMealAnalysis({ foods, userProfile }: MealAnalysisProps) {
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    if (foods.length > 0) {
      analyzeMeal()
    }
  }, [foods, userProfile])

  const analyzeMeal = async () => {
    setLoading(true)
    try {
      // Calculate nutritional totals
      const totals = foods.reduce((acc, food) => ({
        calories: acc.calories + food.nutrition.calories,
        protein: acc.protein + food.nutrition.protein,
        carbs: acc.carbs + food.nutrition.carbs,
        fat: acc.fat + food.nutrition.fat,
        fiber: acc.fiber + (food.nutrition.fiber || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

      // Analyze conflicts
      const conflicts = analyzeConflicts()
      
      // Calculate scores
      const safety_score = calculateSafetyScore(conflicts)
      const overall_score = calculateOverallScore(totals, conflicts)
      
      // Generate suggestions
      const suggestions = generateSuggestions(totals, conflicts)
      const highlights = generateHighlights(totals)
      
      setAnalysis({
        overall_score,
        safety_score,
        conflicts,
        nutritional_balance: assessNutritionalBalance(totals),
        highlights,
        suggestions,
        totals
      })
    } catch (error) {
      console.error('Error analyzing meal:', error)
    }
    setLoading(false)
  }

  const analyzeConflicts = () => {
    const conflicts: any[] = []
    
    foods.forEach(food => {
      // Check allergens
      userProfile.allergens?.forEach(allergen => {
        if (food.dietary_attributes?.allergens?.includes(allergen)) {
          conflicts.push({
            type: 'allergen',
            severity: 'critical',
            food_name: food.name,
            conflict: `Contains ${allergen}`,
            recommendation: `REMOVE - Contains ${allergen} which you must avoid`
          })
        }
      })

      // Check dietary restrictions
      userProfile.dietary_restrictions?.forEach(restriction => {
        if (!food.dietary_attributes?.dietary_restrictions?.includes(restriction)) {
          let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium'
          if (userProfile.strictness_level === 'strict') severity = 'high'
          if (userProfile.strictness_level === 'flexible') severity = 'low'

          conflicts.push({
            type: 'dietary_restriction',
            severity,
            food_name: food.name,
            conflict: `Not ${restriction}`,
            recommendation: `Consider replacing with ${restriction} alternative`
          })
        }
      })
    })

    return conflicts
  }

  const calculateSafetyScore = (conflicts: any[]) => {
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length
    if (criticalConflicts > 0) return 0
    
    const highConflicts = conflicts.filter(c => c.severity === 'high').length
    const mediumConflicts = conflicts.filter(c => c.severity === 'medium').length
    
    return Math.max(0, 100 - (highConflicts * 25) - (mediumConflicts * 10))
  }

  const calculateOverallScore = (totals: any, conflicts: any[]) => {
    let score = 50 // Base score
    
    // Nutrition scoring
    if (totals.protein >= 20) score += 15
    if (totals.fiber >= 10) score += 10
    if (totals.calories >= 300 && totals.calories <= 800) score += 10
    
    // Conflict penalties
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length
    const highConflicts = conflicts.filter(c => c.severity === 'high').length
    
    score -= (criticalConflicts * 50) + (highConflicts * 20)
    
    return Math.max(0, Math.min(100, score))
  }

  const assessNutritionalBalance = (totals: any) => {
    const totalCalories = totals.calories
    const proteinPercent = (totals.protein * 4) / totalCalories * 100
    const carbPercent = (totals.carbs * 4) / totalCalories * 100
    const fatPercent = (totals.fat * 9) / totalCalories * 100

    return {
      protein: proteinPercent >= 20 ? 'excellent' : proteinPercent >= 15 ? 'good' : 'needs improvement',
      carbs: carbPercent <= 45 ? 'good' : carbPercent <= 65 ? 'moderate' : 'high',
      fats: fatPercent >= 20 && fatPercent <= 35 ? 'good' : 'needs balance',
      fiber: totals.fiber >= 10 ? 'excellent' : totals.fiber >= 5 ? 'good' : 'low'
    }
  }

  const generateHighlights = (totals: any) => {
    const highlights = []
    if (totals.protein >= 25) highlights.push('🏋️ High protein content')
    if (totals.fiber >= 10) highlights.push('🌾 Excellent fiber source')
    if (totals.calories <= 500) highlights.push('⚡ Light and energizing')
    if (totals.calories >= 600) highlights.push('🍽️ Satisfying and filling')
    return highlights
  }

  const generateSuggestions = (totals: any, conflicts: any[]) => {
    const suggestions = []
    
    if (conflicts.some(c => c.severity === 'critical')) {
      suggestions.push('⚠️ Remove foods with allergens immediately')
    }
    
    if (totals.protein < 15) {
      suggestions.push('🥩 Add more protein sources')
    }
    
    if (totals.fiber < 5) {
      suggestions.push('🥬 Include more fiber-rich vegetables')
    }
    
    if (totals.calories < 300) {
      suggestions.push('🍎 Consider adding a healthy snack')
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ Great meal choice!')
    }
    
    return suggestions
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    if (score >= 40) return 'orange'
    return 'red'
  }

  if (!analysis && !loading) return null

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
      <CardHeader pb={2}>
        <Heading size="md">🍽️ Smart Meal Analysis</Heading>
      </CardHeader>
      <CardBody pt={2}>
        <VStack spacing={4} align="stretch">
          {loading ? (
            <Text>Analyzing your meal...</Text>
          ) : analysis && (
            <>
              {/* Overall Scores */}
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Overall Score</Text>
                  <HStack>
                    <Progress 
                      value={analysis.overall_score} 
                      colorScheme={getScoreColor(analysis.overall_score)} 
                      flex={1}
                      borderRadius="md"
                    />
                    <Badge colorScheme={getScoreColor(analysis.overall_score)}>
                      {analysis.overall_score}/100
                    </Badge>
                  </HStack>
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>Safety Score</Text>
                  <HStack>
                    <Progress 
                      value={analysis.safety_score} 
                      colorScheme={getScoreColor(analysis.safety_score)} 
                      flex={1}
                      borderRadius="md"
                    />
                    <Badge colorScheme={getScoreColor(analysis.safety_score)}>
                      {analysis.safety_score}/100
                    </Badge>
                  </HStack>
                </Box>
              </SimpleGrid>

              {/* Critical Alerts */}
              {analysis.conflicts.filter(c => c.severity === 'critical').length > 0 && (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Critical Dietary Conflicts!</AlertTitle>
                    <AlertDescription>
                      This meal contains allergens you must avoid. Please review carefully.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Nutritional Totals */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>📊 Nutritional Summary</Text>
                <SimpleGrid columns={2} spacing={2}>
                  <Text fontSize="sm">Calories: <strong>{Math.round(analysis.totals.calories)}</strong></Text>
                  <Text fontSize="sm">Protein: <strong>{analysis.totals.protein.toFixed(1)}g</strong></Text>
                  <Text fontSize="sm">Carbs: <strong>{analysis.totals.carbs.toFixed(1)}g</strong></Text>
                  <Text fontSize="sm">Fat: <strong>{analysis.totals.fat.toFixed(1)}g</strong></Text>
                </SimpleGrid>
              </Box>

              {/* Nutritional Balance */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>⚖️ Balance Assessment</Text>
                <SimpleGrid columns={2} spacing={1}>
                  {Object.entries(analysis.nutritional_balance).map(([nutrient, rating]) => (
                    <HStack key={nutrient} justify="space-between">
                      <Text fontSize="sm" textTransform="capitalize">{nutrient}:</Text>
                      <Badge 
                        size="sm" 
                        colorScheme={rating === 'excellent' ? 'green' : rating === 'good' ? 'blue' : 'yellow'}
                      >
                        {rating}
                      </Badge>
                    </HStack>
                  ))}
                </SimpleGrid>
              </Box>

              {/* Highlights */}
              {analysis.highlights.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>✨ Highlights</Text>
                  {analysis.highlights.map((highlight, idx) => (
                    <Badge key={idx} colorScheme="green" mr={1} mb={1}>
                      {highlight}
                    </Badge>
                  ))}
                </Box>
              )}

              {/* Conflicts */}
              {analysis.conflicts.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="bold" mb={2}>⚠️ Dietary Concerns</Text>
                  <VStack spacing={2} align="stretch">
                    {analysis.conflicts.slice(0, 3).map((conflict, idx) => (
                      <Alert key={idx} status="warning" size="sm">
                        <AlertIcon />
                        <Box fontSize="sm">
                          <Text fontWeight="medium">{conflict.food_name}: {conflict.conflict}</Text>
                          <Text fontSize="xs" color="gray.600">{conflict.recommendation}</Text>
                        </Box>
                      </Alert>
                    ))}
                    {analysis.conflicts.length > 3 && (
                      <Text fontSize="xs" color="gray.500">
                        +{analysis.conflicts.length - 3} more conflicts
                      </Text>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Suggestions */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>💡 AI Suggestions</Text>
                <VStack spacing={1} align="stretch">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <Text key={idx} fontSize="sm" color="blue.600">
                      {suggestion}
                    </Text>
                  ))}
                </VStack>
              </Box>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
