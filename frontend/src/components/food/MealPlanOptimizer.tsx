import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Progress,
  Badge,
  SimpleGrid,
  Stat,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Divider,
  Icon
} from '@chakra-ui/react'
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons'
import { FiTarget, FiTrendingUp, FiActivity, FiInfo } from 'react-icons/fi'
import api from '../../utils/api'

interface NutritionTarget {
  current: number
  target: number
  percentage: number
}

interface NutritionData {
  calories: NutritionTarget
  protein: NutritionTarget
  carbs: NutritionTarget
  fat: NutritionTarget
  fiber: NutritionTarget
}

interface OptimizationSuggestion {
  type: string
  message: string
  foods: Array<{
    name: string
    calories: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
  }>
}

interface MealPlanInsights {
  analysis: string
  recommendations: string[]
  health_benefits: string[]
  improvements: string[]
  tips: string[]
}

interface MealPlanOptimizerProps {
  planId: string
  onOptimizationComplete?: (updatedPlan: any) => void
}

const MealPlanOptimizer: React.FC<MealPlanOptimizerProps> = ({ planId }) => {
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([])
  const [insights, setInsights] = useState<MealPlanInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  useEffect(() => {
    if (planId) {
      fetchNutritionData()
    }
  }, [planId])

  const fetchNutritionData = async () => {
    try {
      setLoading(true)
      setError('')

      // Get current nutrition data for the meal plan
      const response = await api.get(`/meal-planning/plans/${planId}`)
      const plan = response.data

      // Calculate nutrition totals across all days
      const totalNutrition = plan.days?.reduce((total: any, day: any) => {
        const dayTotals = day.total_nutrition || {}
        return {
          calories: total.calories + (dayTotals.calories || 0),
          protein: total.protein + (dayTotals.protein || 0),
          carbs: total.carbs + (dayTotals.carbs || 0),
          fat: total.fat + (dayTotals.fat || 0),
          fiber: total.fiber + (dayTotals.fiber || 0)
        }
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

      // Get user's nutrition targets
      const targetResponse = await api.get('/goals/active')
      const targets = targetResponse.data?.nutrition_targets || {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
        fiber: 25
      }

      // Calculate average daily nutrition
      const numDays = plan.days?.length || 1
      const avgNutrition = {
        calories: totalNutrition.calories / numDays,
        protein: totalNutrition.protein / numDays,
        carbs: totalNutrition.carbs / numDays,
        fat: totalNutrition.fat / numDays,
        fiber: totalNutrition.fiber / numDays
      }

      // Create nutrition data structure
      const nutritionData: NutritionData = {
        calories: {
          current: avgNutrition.calories,
          target: targets.calories,
          percentage: Math.min(100, Math.round((avgNutrition.calories / targets.calories) * 100))
        },
        protein: {
          current: avgNutrition.protein,
          target: targets.protein,
          percentage: Math.min(100, Math.round((avgNutrition.protein / targets.protein) * 100))
        },
        carbs: {
          current: avgNutrition.carbs,
          target: targets.carbs,
          percentage: Math.min(100, Math.round((avgNutrition.carbs / targets.carbs) * 100))
        },
        fat: {
          current: avgNutrition.fat,
          target: targets.fat,
          percentage: Math.min(100, Math.round((avgNutrition.fat / targets.fat) * 100))
        },
        fiber: {
          current: avgNutrition.fiber,
          target: targets.fiber || 25,
          percentage: Math.min(100, Math.round((avgNutrition.fiber / (targets.fiber || 25)) * 100))
        }
      }

      setNutritionData(nutritionData)
      
      // Generate optimization suggestions based on gaps
      await generateOptimizationSuggestions(nutritionData)

    } catch (err: any) {
      console.error('Error fetching nutrition data:', err)
      setError(err.response?.data?.detail || 'Failed to load nutrition data')
    } finally {
      setLoading(false)
    }
  }

  const generateOptimizationSuggestions = async (nutrition: NutritionData) => {
    try {
      const suggestions: OptimizationSuggestion[] = []

      // Check each nutrient for gaps
      Object.entries(nutrition).forEach(([nutrient, data]) => {
        const gap = data.target - data.current
        const gapPercentage = Math.abs(gap / data.target) * 100

        if (gapPercentage > 10) { // Only suggest if gap is >10%
          if (gap > 0) {
            // Need more of this nutrient
            suggestions.push({
              type: `${nutrient}_boost`,
              message: `Add ${Math.round(gap)}${nutrient === 'calories' ? '' : 'g'} more ${nutrient} to reach your target`,
              foods: getOptimizationFoods(nutrient, 'increase')
            })
          } else {
            // Need less of this nutrient
            suggestions.push({
              type: `${nutrient}_reduce`,
              message: `Consider reducing ${nutrient} by ${Math.round(Math.abs(gap))}${nutrient === 'calories' ? '' : 'g'}`,
              foods: getOptimizationFoods(nutrient, 'decrease')
            })
          }
        }
      })

      setOptimizationSuggestions(suggestions)
    } catch (err: any) {
      console.error('Error generating optimization suggestions:', err)
    }
  }

  const getOptimizationFoods = (nutrient: string, action: 'increase' | 'decrease') => {
    const foods: any = {
      protein: {
        increase: [
          { name: 'Greek Yogurt (170g)', calories: 100, protein: 15 },
          { name: 'Chicken Breast (100g)', calories: 165, protein: 31 },
          { name: 'Lentils (100g)', calories: 116, protein: 9 },
          { name: 'Eggs (2 large)', calories: 140, protein: 12 }
        ],
        decrease: [
          { name: 'Replace with vegetables', calories: 25, protein: 1 },
          { name: 'Reduce portion sizes', calories: 0, protein: 0 }
        ]
      },
      carbs: {
        increase: [
          { name: 'Brown Rice (100g)', calories: 111, carbs: 23 },
          { name: 'Quinoa (100g)', calories: 120, carbs: 22 },
          { name: 'Sweet Potato (100g)', calories: 86, carbs: 20 },
          { name: 'Banana (1 medium)', calories: 105, carbs: 27 }
        ],
        decrease: [
          { name: 'Replace grains with vegetables', calories: 25, carbs: 5 },
          { name: 'Reduce portion sizes', calories: 0, carbs: 0 }
        ]
      },
      fat: {
        increase: [
          { name: 'Avocado (100g)', calories: 160, fat: 15 },
          { name: 'Nuts (28g)', calories: 170, fat: 15 },
          { name: 'Olive Oil (1 tbsp)', calories: 120, fat: 14 },
          { name: 'Salmon (100g)', calories: 208, fat: 12 }
        ],
        decrease: [
          { name: 'Use cooking spray instead of oil', calories: 5, fat: 0 },
          { name: 'Choose leaner proteins', calories: 150, fat: 3 }
        ]
      },
      fiber: {
        increase: [
          { name: 'Broccoli (100g)', calories: 34, fiber: 3 },
          { name: 'Apple (1 medium)', calories: 95, fiber: 4 },
          { name: 'Oats (40g)', calories: 150, fiber: 4 },
          { name: 'Black Beans (100g)', calories: 132, fiber: 8 }
        ],
        decrease: [
          { name: 'Choose refined grains', calories: 100, fiber: 1 }
        ]
      },
      calories: {
        increase: [
          { name: 'Nuts (28g)', calories: 170 },
          { name: 'Dried Fruit (30g)', calories: 85 },
          { name: 'Granola (30g)', calories: 150 }
        ],
        decrease: [
          { name: 'Replace with vegetables', calories: 25 },
          { name: 'Reduce portion sizes', calories: 0 }
        ]
      }
    }

    return foods[nutrient]?.[action] || []
  }

  const generateInsights = async () => {
    try {
      setInsightsLoading(true)
      const response = await api.post(`/meal-planning/manual/plans/${planId}/insights`)
      setInsights(response.data.insights)
      
      toast({
        title: 'Insights Generated',
        description: 'AI-powered meal plan insights are ready!',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err: any) {
      console.error('Error generating insights:', err)
      toast({
        title: 'Error',
        description: 'Failed to generate insights. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setInsightsLoading(false)
    }
  }

  const optimizeNutrient = async (nutrient: string) => {
    try {
      setLoading(true)
      await api.get(`/meal-planning/nutrition-optimization?target_nutrient=${nutrient}`)
      
      toast({
        title: 'Optimization Complete',
        description: `Generated suggestions to optimize ${nutrient}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      // Refresh nutrition data
      await fetchNutritionData()
    } catch (err: any) {
      console.error('Error optimizing nutrient:', err)
      toast({
        title: 'Error',
        description: 'Failed to optimize meal plan. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !nutritionData) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Analyzing your meal plan...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardHeader>
          <HStack>
            <Icon as={FiTarget} color="blue.500" />
            <Heading size="md">Meal Plan Optimizer</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList mb={6}>
              <Tab>Nutrition Analysis</Tab>
              <Tab>Optimization Suggestions</Tab>
              <Tab>AI Insights</Tab>
            </TabList>

            <TabPanels>
              {/* Nutrition Analysis Tab */}
              <TabPanel>
                {nutritionData && (
                  <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {Object.entries(nutritionData).map(([nutrient, data]) => (
                        <Card key={nutrient} variant="outline">
                          <CardBody>
                            <VStack spacing={3}>
                              <HStack w="full" justify="space-between">
                                <Text fontWeight="bold" textTransform="capitalize">
                                  {nutrient}
                                </Text>
                                <Badge 
                                  colorScheme={data.percentage >= 80 && data.percentage <= 120 ? 'green' : 'orange'}
                                >
                                  {data.percentage}%
                                </Badge>
                              </HStack>
                              
                              <Progress 
                                value={data.percentage} 
                                colorScheme={data.percentage >= 80 && data.percentage <= 120 ? 'green' : 'orange'}
                                size="lg"
                                w="full"
                              />
                              
                              <Stat size="sm" textAlign="center">
                                <StatNumber>
                                  {Math.round(data.current)}{nutrient === 'calories' ? '' : 'g'}
                                </StatNumber>
                                <StatHelpText>
                                  Target: {data.target}{nutrient === 'calories' ? '' : 'g'}
                                </StatHelpText>
                              </Stat>

                              <Button
                                size="sm"
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => optimizeNutrient(nutrient)}
                                isLoading={loading}
                              >
                                Optimize
                              </Button>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>

                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Optimization Tips</AlertTitle>
                        <AlertDescription>
                          Green badges indicate optimal ranges (80-120% of target).
                          Click "Optimize" on any nutrient to get personalized suggestions.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  </VStack>
                )}
              </TabPanel>

              {/* Optimization Suggestions Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {optimizationSuggestions.length > 0 ? (
                    optimizationSuggestions.map((suggestion, index) => (
                      <Card key={index} variant="outline">
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <HStack>
                              <Icon as={FiTrendingUp} color="orange.500" />
                              <Text fontWeight="bold" color="orange.600">
                                {suggestion.message}
                              </Text>
                            </HStack>
                            
                            <Divider />
                            
                            <Text fontSize="sm" fontWeight="medium">
                              Suggested Foods:
                            </Text>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                              {suggestion.foods.map((food, foodIndex) => (
                                <HStack key={foodIndex} spacing={2}>
                                  <CheckCircleIcon color="green.500" />
                                  <Text fontSize="sm">{food.name}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {food.calories} cal
                                  </Text>
                                </HStack>
                              ))}
                            </SimpleGrid>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))
                  ) : (
                    <Alert status="success">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Great Job!</AlertTitle>
                        <AlertDescription>
                          Your meal plan is well-balanced with no major optimization needed.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>

              {/* AI Insights Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Button
                    colorScheme="blue"
                    onClick={generateInsights}
                    isLoading={insightsLoading}
                    loadingText="Generating insights..."
                    leftIcon={<FiInfo />}
                  >
                    Generate AI Insights
                  </Button>

                  {insights && (
                    <VStack spacing={4} align="stretch">
                      <Card>
                        <CardHeader>
                          <HStack>
                            <Icon as={FiActivity} color="green.500" />
                            <Heading size="sm">Analysis</Heading>
                          </HStack>
                        </CardHeader>
                        <CardBody>
                          <Text>{insights.analysis}</Text>
                        </CardBody>
                      </Card>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Card>
                          <CardHeader>
                            <Heading size="sm" color="blue.600">Recommendations</Heading>
                          </CardHeader>
                          <CardBody>
                            <List spacing={2}>
                              {insights.recommendations.map((rec, index) => (
                                <ListItem key={index}>
                                  <ListIcon as={CheckCircleIcon} color="blue.500" />
                                  <Text fontSize="sm">{rec}</Text>
                                </ListItem>
                              ))}
                            </List>
                          </CardBody>
                        </Card>

                        <Card>
                          <CardHeader>
                            <Heading size="sm" color="green.600">Health Benefits</Heading>
                          </CardHeader>
                          <CardBody>
                            <List spacing={2}>
                              {insights.health_benefits.map((benefit, index) => (
                                <ListItem key={index}>
                                  <ListIcon as={CheckCircleIcon} color="green.500" />
                                  <Text fontSize="sm">{benefit}</Text>
                                </ListItem>
                              ))}
                            </List>
                          </CardBody>
                        </Card>

                        <Card>
                          <CardHeader>
                            <Heading size="sm" color="orange.600">Improvements</Heading>
                          </CardHeader>
                          <CardBody>
                            <List spacing={2}>
                              {insights.improvements.map((improvement, index) => (
                                <ListItem key={index}>
                                  <ListIcon as={WarningIcon} color="orange.500" />
                                  <Text fontSize="sm">{improvement}</Text>
                                </ListItem>
                              ))}
                            </List>
                          </CardBody>
                        </Card>

                        <Card>
                          <CardHeader>
                            <Heading size="sm" color="purple.600">Tips</Heading>
                          </CardHeader>
                          <CardBody>
                            <List spacing={2}>
                              {insights.tips.map((tip, index) => (
                                <ListItem key={index}>
                                  <ListIcon as={FiInfo} color="purple.500" />
                                  <Text fontSize="sm">{tip}</Text>
                                </ListItem>
                              ))}
                            </List>
                          </CardBody>
                        </Card>
                      </SimpleGrid>
                    </VStack>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </VStack>
  )
}

export default MealPlanOptimizer
