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
  SimpleGrid,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  FormControl,
  FormLabel,
  Icon,
  List,
  ListItem,
  ListIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react'
import { CheckCircleIcon, InfoIcon } from '@chakra-ui/icons'
import { FiTrendingUp, FiTarget, FiActivity } from 'react-icons/fi'
import api from '../utils/api'

interface NutritionGap {
  nutrient: string
  current: number
  target: number
  gap: number
  percentage: number
  status: 'low' | 'optimal' | 'high'
  priority: 'high' | 'medium' | 'low'
}

interface OptimizationSuggestion {
  id: string
  nutrient: string
  type: 'increase' | 'decrease' | 'maintain'
  message: string
  foods: Array<{
    name: string
    amount: string
    nutrient_content: number
    calories: number
    additional_benefits?: string[]
  }>
  tips: string[]
  expected_improvement: string
  difficulty: 'easy' | 'moderate' | 'hard'
}

interface NutritionOptimizationSuggestionsProps {
  userId?: string
  timeframe?: 'daily' | 'weekly' | 'monthly'
  onSuggestionApply?: (suggestion: OptimizationSuggestion) => void
}

const NutritionOptimizationSuggestions: React.FC<NutritionOptimizationSuggestionsProps> = ({
  timeframe = 'daily',
  onSuggestionApply
}) => {
  const [nutritionGaps, setNutritionGaps] = useState<NutritionGap[]>([])
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedNutrient, setSelectedNutrient] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [targetCalories, setTargetCalories] = useState(2000)
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  
  const toast = useToast()

  useEffect(() => {
    analyzeNutrition()
  }, [selectedTimeframe, targetCalories])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        analyzeNutrition()
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedTimeframe, targetCalories])

  const analyzeNutrition = async () => {
    try {
      setLoading(true)
      setError('')

      // Get user's current nutrition data
      const endDate = new Date()
      const startDate = new Date()
      
      if (selectedTimeframe === 'daily') {
        startDate.setDate(endDate.getDate() - 1)
      } else if (selectedTimeframe === 'weekly') {
        startDate.setDate(endDate.getDate() - 7)
      } else {
        startDate.setMonth(endDate.getMonth() - 1)
      }

      // Get food logs for the timeframe
      const foodLogsResponse = await api.get(`/food-logs/range?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`)
      const foodLogs = foodLogsResponse.data || []

      // Get user's nutrition targets
      let nutritionTargets = {
        calories: targetCalories,
        protein: Math.round(targetCalories * 0.15 / 4), // 15% of calories from protein
        carbs: Math.round(targetCalories * 0.55 / 4), // 55% of calories from carbs
        fat: Math.round(targetCalories * 0.30 / 9), // 30% of calories from fat
        fiber: 25,
        sodium: 2300,
        sugar: 50,
        saturated_fat: Math.round(targetCalories * 0.10 / 9), // 10% of calories from saturated fat
        calcium: 1000,
        iron: 18,
        vitamin_c: 90,
        vitamin_d: 20
      }

      try {
        const goalsResponse = await api.get('/goals/active')
        if (goalsResponse.data?.nutrition_targets) {
          nutritionTargets = { ...nutritionTargets, ...goalsResponse.data.nutrition_targets }
        }
      } catch (err) {
        // Use default targets if no active goals
        console.log('Using default nutrition targets')
      }

      // Calculate current nutrition totals
      const currentNutrition = foodLogs.reduce((total: any, log: any) => {
        return {
          calories: total.calories + (log.calories || 0),
          protein: total.protein + (log.protein || 0),
          carbs: total.carbs + (log.carbs || 0),
          fat: total.fat + (log.fat || 0),
          fiber: total.fiber + (log.fiber || 0),
          sodium: total.sodium + (log.sodium || 0),
          sugar: total.sugar + (log.sugar || 0),
          saturated_fat: total.saturated_fat + (log.saturated_fat || 0),
          calcium: total.calcium + (log.calcium || 0),
          iron: total.iron + (log.iron || 0),
          vitamin_c: total.vitamin_c + (log.vitamin_c || 0),
          vitamin_d: total.vitamin_d + (log.vitamin_d || 0)
        }
      }, {
        calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0,
        sugar: 0, saturated_fat: 0, calcium: 0, iron: 0, vitamin_c: 0, vitamin_d: 0
      })

      // Calculate gaps and create nutrition analysis
      const gaps: NutritionGap[] = Object.entries(nutritionTargets).map(([nutrient, target]) => {
        const current = currentNutrition[nutrient] || 0
        const gap = target - current
        const percentage = target > 0 ? Math.round((current / target) * 100) : 0
        
        let status: 'low' | 'optimal' | 'high' = 'optimal'
        let priority: 'high' | 'medium' | 'low' = 'low'
        
        if (percentage < 70) {
          status = 'low'
          priority = 'high'
        } else if (percentage > 130) {
          status = 'high'
          priority = percentage > 150 ? 'high' : 'medium'
        } else if (percentage < 90) {
          status = 'low'
          priority = 'medium'
        }

        return {
          nutrient,
          current,
          target,
          gap,
          percentage,
          status,
          priority
        }
      })

      setNutritionGaps(gaps)

      // Generate optimization suggestions
      await generateOptimizationSuggestions(gaps)

    } catch (err: any) {
      console.error('Error analyzing nutrition:', err)
      setError(err.response?.data?.detail || 'Failed to analyze nutrition')
    } finally {
      setLoading(false)
    }
  }

  const generateOptimizationSuggestions = async (gaps: NutritionGap[]) => {
    try {
      const optimizationSuggestions: OptimizationSuggestion[] = []

      // Process each nutrient gap
      for (const gap of gaps) {
        if (gap.priority === 'high' || gap.priority === 'medium') {
          const suggestion = await createOptimizationSuggestion(gap)
          if (suggestion) {
            optimizationSuggestions.push(suggestion)
          }
        }
      }

      // Sort suggestions by priority
      optimizationSuggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const aPriority = gaps.find(g => g.nutrient === a.nutrient)?.priority || 'low'
        const bPriority = gaps.find(g => g.nutrient === b.nutrient)?.priority || 'low'
        return priorityOrder[bPriority] - priorityOrder[aPriority]
      })

      setSuggestions(optimizationSuggestions)

    } catch (err: any) {
      console.error('Error generating optimization suggestions:', err)
    }
  }

  const createOptimizationSuggestion = async (gap: NutritionGap): Promise<OptimizationSuggestion | null> => {
    const nutrientFoodMap: { [key: string]: any } = {
      protein: {
        increase: [
          { name: 'Chicken Breast', amount: '100g', nutrient_content: 31, calories: 165, additional_benefits: ['Complete protein', 'Low fat'] },
          { name: 'Greek Yogurt', amount: '170g', nutrient_content: 15, calories: 100, additional_benefits: ['Probiotics', 'Calcium'] },
          { name: 'Eggs', amount: '2 large', nutrient_content: 12, calories: 140, additional_benefits: ['Complete protein', 'Choline'] },
          { name: 'Lentils', amount: '100g cooked', nutrient_content: 9, calories: 116, additional_benefits: ['Fiber', 'Iron'] }
        ],
        tips: [
          'Include protein at every meal',
          'Consider post-workout protein timing',
          'Combine incomplete proteins for variety'
        ]
      },
      fiber: {
        increase: [
          { name: 'Black Beans', amount: '100g', nutrient_content: 8, calories: 132, additional_benefits: ['Protein', 'Folate'] },
          { name: 'Avocado', amount: '1 medium', nutrient_content: 10, calories: 234, additional_benefits: ['Healthy fats', 'Potassium'] },
          { name: 'Broccoli', amount: '100g', nutrient_content: 3, calories: 34, additional_benefits: ['Vitamin C', 'Folate'] },
          { name: 'Oats', amount: '40g dry', nutrient_content: 4, calories: 150, additional_benefits: ['Beta-glucan', 'Protein'] }
        ],
        tips: [
          'Increase fiber intake gradually',
          'Drink plenty of water with fiber',
          'Choose whole grains over refined'
        ]
      },
      calcium: {
        increase: [
          { name: 'Milk', amount: '1 cup', nutrient_content: 300, calories: 150, additional_benefits: ['Protein', 'Vitamin D'] },
          { name: 'Sardines', amount: '100g', nutrient_content: 382, calories: 208, additional_benefits: ['Omega-3', 'Protein'] },
          { name: 'Kale', amount: '100g', nutrient_content: 150, calories: 35, additional_benefits: ['Vitamin K', 'Antioxidants'] },
          { name: 'Almonds', amount: '28g', nutrient_content: 76, calories: 164, additional_benefits: ['Healthy fats', 'Vitamin E'] }
        ],
        tips: [
          'Combine with vitamin D for better absorption',
          'Space calcium intake throughout the day',
          'Consider calcium-fortified foods'
        ]
      },
      iron: {
        increase: [
          { name: 'Spinach', amount: '100g cooked', nutrient_content: 3.6, calories: 23, additional_benefits: ['Folate', 'Vitamin K'] },
          { name: 'Beef', amount: '100g', nutrient_content: 2.6, calories: 250, additional_benefits: ['Protein', 'B12'] },
          { name: 'Chickpeas', amount: '100g', nutrient_content: 2.9, calories: 164, additional_benefits: ['Protein', 'Fiber'] },
          { name: 'Dark Chocolate', amount: '28g', nutrient_content: 3.9, calories: 155, additional_benefits: ['Antioxidants', 'Magnesium'] }
        ],
        tips: [
          'Combine with vitamin C for better absorption',
          'Avoid tea/coffee with iron-rich meals',
          'Cook in cast iron pans'
        ]
      }
    }

    const nutrientData = nutrientFoodMap[gap.nutrient]
    if (!nutrientData) return null

    const type = gap.status === 'low' ? 'increase' : gap.status === 'high' ? 'decrease' : 'maintain'
    const message = type === 'increase' 
      ? `Increase ${gap.nutrient} by ${Math.abs(gap.gap).toFixed(1)}${gap.nutrient === 'calories' ? '' : 'g'} to reach your target`
      : `Reduce ${gap.nutrient} by ${Math.abs(gap.gap).toFixed(1)}${gap.nutrient === 'calories' ? '' : 'g'} to reach your target`

    return {
      id: `opt-${gap.nutrient}-${Date.now()}`,
      nutrient: gap.nutrient,
      type,
      message,
      foods: nutrientData[type] || nutrientData.increase || [],
      tips: nutrientData.tips || [],
      expected_improvement: `Achieving optimal ${gap.nutrient} levels can improve energy, health, and performance`,
      difficulty: gap.priority === 'high' ? 'moderate' : 'easy'
    }
  }

  const applyOptimizationSuggestion = async (suggestion: OptimizationSuggestion) => {
    try {
      // Try to get more specific optimization from the API
      await api.get(`/meal-planning/nutrition-optimization?target_nutrient=${suggestion.nutrient}`)
      
      if (onSuggestionApply) {
        onSuggestionApply(suggestion)
      }

      toast({
        title: 'Optimization Applied',
        description: `${suggestion.nutrient} optimization suggestions are now active`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      // Refresh analysis after applying
      setTimeout(() => {
        analyzeNutrition()
      }, 1000)

    } catch (err: any) {
      console.error('Error applying optimization:', err)
      toast({
        title: 'Error',
        description: 'Failed to apply optimization suggestion',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const getNutrientStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'red'
      case 'optimal': return 'green'
      case 'high': return 'orange'
      default: return 'gray'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'yellow'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const filteredGaps = selectedNutrient === 'all' 
    ? nutritionGaps 
    : nutritionGaps.filter(gap => gap.nutrient === selectedNutrient)

  const filteredSuggestions = selectedNutrient === 'all'
    ? suggestions
    : suggestions.filter(s => s.nutrient === selectedNutrient)

  if (loading && nutritionGaps.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Analyzing your nutrition patterns...</Text>
      </Box>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiTrendingUp} color="blue.500" />
              <Heading size="md">Nutrition Optimization</Heading>
            </HStack>
            <HStack>
              <FormControl display="flex" alignItems="center" maxW="150px">
                <FormLabel htmlFor="auto-refresh" mb="0" fontSize="sm">
                  Auto-refresh
                </FormLabel>
                <Switch
                  id="auto-refresh"
                  isChecked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="sm"
                />
              </FormControl>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={analyzeNutrition}
                isLoading={loading}
                leftIcon={<FiActivity />}
              >
                Analyze Now
              </Button>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList mb={4}>
              <Tab>Nutrition Analysis</Tab>
              <Tab>Optimization Suggestions</Tab>
              <Tab>Settings</Tab>
            </TabList>

            <TabPanels>
              {/* Nutrition Analysis Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {/* Filters */}
                  <HStack spacing={4}>
                    <FormControl maxW="200px">
                      <FormLabel>Nutrient Focus</FormLabel>
                      <Select
                        value={selectedNutrient}
                        onChange={(e) => setSelectedNutrient(e.target.value)}
                      >
                        <option value="all">All Nutrients</option>
                        <option value="calories">Calories</option>
                        <option value="protein">Protein</option>
                        <option value="carbs">Carbohydrates</option>
                        <option value="fat">Fat</option>
                        <option value="fiber">Fiber</option>
                        <option value="calcium">Calcium</option>
                        <option value="iron">Iron</option>
                        <option value="vitamin_c">Vitamin C</option>
                        <option value="vitamin_d">Vitamin D</option>
                      </Select>
                    </FormControl>

                    <FormControl maxW="150px">
                      <FormLabel>Timeframe</FormLabel>
                      <Select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value as 'daily' | 'weekly' | 'monthly')}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Select>
                    </FormControl>
                  </HStack>

                  {/* Error Display */}
                  {error && (
                    <Alert status="error">
                      <AlertIcon />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Nutrition Gaps Grid */}
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {filteredGaps.map((gap) => (
                      <Card key={gap.nutrient} variant="outline">
                        <CardBody>
                          <VStack spacing={3}>
                            <HStack w="full" justify="space-between">
                              <Text fontWeight="bold" textTransform="capitalize">
                                {gap.nutrient.replace('_', ' ')}
                              </Text>
                              <HStack>
                                <Badge colorScheme={getNutrientStatusColor(gap.status)}>
                                  {gap.status}
                                </Badge>
                                <Badge colorScheme={getPriorityColor(gap.priority)}>
                                  {gap.priority}
                                </Badge>
                              </HStack>
                            </HStack>
                            
                            <Progress 
                              value={gap.percentage} 
                              colorScheme={getNutrientStatusColor(gap.status)}
                              size="lg"
                              w="full"
                            />
                            
                            <Stat size="sm" textAlign="center">
                              <StatLabel>Current vs Target</StatLabel>
                              <StatNumber>
                                {gap.current.toFixed(1)} / {gap.target.toFixed(1)}
                              </StatNumber>
                              <StatHelpText>
                                <StatArrow type={gap.gap > 0 ? 'increase' : 'decrease'} />
                                {gap.percentage}% of target
                              </StatHelpText>
                            </Stat>

                            {Math.abs(gap.gap) > 0.1 && (
                              <Alert status={gap.status === 'low' ? 'warning' : 'info'} size="sm">
                                <AlertIcon />
                                <AlertDescription fontSize="xs">
                                  {gap.gap > 0 ? 'Need' : 'Excess'}: {Math.abs(gap.gap).toFixed(1)}
                                  {gap.nutrient === 'calories' ? '' : 'g'}
                                </AlertDescription>
                              </Alert>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>

                  {filteredGaps.length === 0 && (
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>No Data Available</AlertTitle>
                        <AlertDescription>
                          Log some foods to see your nutrition analysis.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>

              {/* Optimization Suggestions Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {filteredSuggestions.length > 0 ? (
                    <Accordion allowMultiple>
                      {filteredSuggestions.map((suggestion) => (
                        <AccordionItem key={suggestion.id}>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <HStack justify="space-between">
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="bold" textTransform="capitalize">
                                    {suggestion.nutrient.replace('_', ' ')} Optimization
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    {suggestion.message}
                                  </Text>
                                </VStack>
                                <Badge colorScheme={suggestion.difficulty === 'easy' ? 'green' : 'yellow'}>
                                  {suggestion.difficulty}
                                </Badge>
                              </HStack>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel>
                            <VStack spacing={4} align="stretch">
                              <Text fontSize="sm" fontStyle="italic" color="blue.600">
                                {suggestion.expected_improvement}
                              </Text>

                              <Box>
                                <Text fontWeight="bold" mb={2}>Recommended Foods:</Text>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                                  {suggestion.foods.map((food, index) => (
                                    <Card key={index} size="sm" variant="outline">
                                      <CardBody>
                                        <VStack spacing={1} align="start">
                                          <Text fontWeight="bold">{food.name}</Text>
                                          <Text fontSize="sm" color="gray.600">
                                            {food.amount} • {food.nutrient_content}
                                            {suggestion.nutrient === 'calories' ? '' : 'g'} {suggestion.nutrient}
                                          </Text>
                                          <Text fontSize="sm" color="gray.600">
                                            {food.calories} calories
                                          </Text>
                                          {food.additional_benefits && (
                                            <List spacing={0}>
                                              {food.additional_benefits.map((benefit, bIndex) => (
                                                <ListItem key={bIndex} fontSize="xs" color="green.600">
                                                  <ListIcon as={CheckCircleIcon} />
                                                  {benefit}
                                                </ListItem>
                                              ))}
                                            </List>
                                          )}
                                        </VStack>
                                      </CardBody>
                                    </Card>
                                  ))}
                                </SimpleGrid>
                              </Box>

                              {suggestion.tips.length > 0 && (
                                <Box>
                                  <Text fontWeight="bold" mb={2}>Tips:</Text>
                                  <List spacing={1}>
                                    {suggestion.tips.map((tip, index) => (
                                      <ListItem key={index} fontSize="sm">
                                        <ListIcon as={InfoIcon} color="blue.500" />
                                        {tip}
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              )}

                              <Button
                                colorScheme="blue"
                                onClick={() => applyOptimizationSuggestion(suggestion)}
                                leftIcon={<FiTarget />}
                              >
                                Apply This Optimization
                              </Button>
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <Alert status="success">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Great Job!</AlertTitle>
                        <AlertDescription>
                          Your nutrition is well-balanced! No major optimizations needed.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Daily Calorie Target</FormLabel>
                    <NumberInput
                      value={targetCalories}
                      onChange={(_, num) => setTargetCalories(num || 2000)}
                      min={1000}
                      max={5000}
                      step={50}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="auto-refresh-setting" mb="0">
                      Enable Auto-refresh
                    </FormLabel>
                    <Switch
                      id="auto-refresh-setting"
                      isChecked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                  </FormControl>

                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>About Nutrition Optimization</AlertTitle>
                      <AlertDescription fontSize="sm">
                        This feature analyzes your food logs and provides personalized suggestions 
                        to optimize your nutrition based on your goals and dietary patterns.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </VStack>
  )
}

export default NutritionOptimizationSuggestions
