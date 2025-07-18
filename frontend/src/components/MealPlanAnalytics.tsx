import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Badge,
  Select,
  FormControl,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Icon,
  List,
  ListItem,
  ListIcon,
  CircularProgress,
  CircularProgressLabel
} from '@chakra-ui/react'
import { InfoIcon, TriangleUpIcon, TriangleDownIcon } from '@chakra-ui/icons'
import { MdCheckCircle, MdWarning, MdError, MdTrendingUp, MdAssessment } from 'react-icons/md'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import api from '../utils/api'
import { NutritionInfo } from '../types'

interface MealPlanAnalytics {
  period: string
  total_meals_planned: number
  total_meals_completed: number
  completion_rate: number
  average_daily_nutrition: NutritionInfo
  goal_adherence: {
    calories: { target: number; actual: number; percentage: number }
    protein: { target: number; actual: number; percentage: number }
    carbs: { target: number; actual: number; percentage: number }
    fat: { target: number; actual: number; percentage: number }
  }
  trends: {
    calories_trend: number
    protein_trend: number
    completion_trend: number
  }
  insights: string[]
  recommendations: string[]
  missed_meals: Array<{
    date: string
    meal_type: string
    planned_nutrition: NutritionInfo
  }>
  top_foods: Array<{
    name: string
    frequency: number
    total_calories: number
  }>
  dietary_balance: {
    variety_score: number
    balance_score: number
    consistency_score: number
  }
}

interface MealPlanAnalyticsProps {
  mealPlanId?: string
  dateRange?: 'week' | 'month' | 'custom'
  startDate?: string
  endDate?: string
}

const MealPlanAnalyticsComponent: React.FC<MealPlanAnalyticsProps> = ({
  mealPlanId,
  dateRange = 'week',
  startDate,
  endDate
}) => {
  const [analytics, setAnalytics] = useState<MealPlanAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange)
  const [activeTab, setActiveTab] = useState(0)

  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const successColor = useColorModeValue('green.500', 'green.300')
  const warningColor = useColorModeValue('yellow.500', 'yellow.300')
  const errorColor = useColorModeValue('red.500', 'red.300')

  useEffect(() => {
    fetchAnalytics()
  }, [mealPlanId, selectedPeriod, startDate, endDate])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = {
        meal_plan_id: mealPlanId,
        period: selectedPeriod,
        start_date: startDate || getStartDate(),
        end_date: endDate || getEndDate()
      }

      const response = await api.get('/meal-plans/analytics', { params })
      setAnalytics(response.data)
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to fetch analytics'
      setError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStartDate = () => {
    const now = new Date()
    switch (selectedPeriod) {
      case 'week':
        return format(startOfWeek(now), 'yyyy-MM-dd')
      case 'month':
        return format(startOfMonth(now), 'yyyy-MM-dd')
      default:
        return format(subDays(now, 7), 'yyyy-MM-dd')
    }
  }

  const getEndDate = () => {
    const now = new Date()
    switch (selectedPeriod) {
      case 'week':
        return format(endOfWeek(now), 'yyyy-MM-dd')
      case 'month':
        return format(endOfMonth(now), 'yyyy-MM-dd')
      default:
        return format(now, 'yyyy-MM-dd')
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'green'
    if (percentage >= 70) return 'yellow'
    if (percentage >= 50) return 'orange'
    return 'red'
  }

  const getAdherenceStatus = (percentage: number) => {
    if (percentage >= 95) return { label: 'Excellent', color: successColor, icon: MdCheckCircle }
    if (percentage >= 85) return { label: 'Good', color: successColor, icon: MdCheckCircle }
    if (percentage >= 70) return { label: 'Fair', color: warningColor, icon: MdWarning }
    return { label: 'Needs Improvement', color: errorColor, icon: MdError }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return TriangleUpIcon
    if (trend < 0) return TriangleDownIcon
    return InfoIcon
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'green.500'
    if (trend < 0) return 'red.500'
    return 'gray.500'
  }

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" color="blue.500" />
        <Text mt={4} color="gray.500">
          Analyzing your meal plan data...
        </Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Error Loading Analytics</Text>
          <Text>{error}</Text>
        </Box>
      </Alert>
    )
  }

  if (!analytics) {
    return (
      <Alert status="info">
        <AlertIcon />
        <Text>No analytics data available. Start logging meals to see your progress!</Text>
      </Alert>
    )
  }

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="bold">
              Meal Plan Analytics
            </Text>
            <Text fontSize="sm" color="gray.500">
              Track your nutrition progress and meal plan adherence
            </Text>
          </VStack>
          <FormControl maxW="200px">
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </Select>
          </FormControl>
        </HStack>

        {/* Overview Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Completion Rate</StatLabel>
                <StatNumber>
                  {analytics.completion_rate.toFixed(1)}%
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={analytics.trends.completion_trend > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analytics.trends.completion_trend).toFixed(1)}% from last period
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Meals Completed</StatLabel>
                <StatNumber>
                  {analytics.total_meals_completed}/{analytics.total_meals_planned}
                </StatNumber>
                <StatHelpText>
                  {analytics.total_meals_planned - analytics.total_meals_completed} meals missed
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Avg Daily Calories</StatLabel>
                <StatNumber>
                  {analytics.average_daily_nutrition.calories.toFixed(0)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={analytics.trends.calories_trend > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(analytics.trends.calories_trend).toFixed(0)} cal change
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Dietary Balance</StatLabel>
                <StatNumber>
                  {analytics.dietary_balance.balance_score.toFixed(0)}/100
                </StatNumber>
                <StatHelpText>
                  Overall nutrition balance score
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Detailed Analytics Tabs */}
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
          <TabList>
            <Tab>Goal Adherence</Tab>
            <Tab>Trends</Tab>
            <Tab>Insights</Tab>
            <Tab>Food Analysis</Tab>
          </TabList>

          <TabPanels>
            {/* Goal Adherence Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">
                  Nutrition Goal Adherence
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {Object.entries(analytics.goal_adherence).map(([nutrient, data]) => {
                    const status = getAdherenceStatus(data.percentage)
                    return (
                      <Card key={nutrient} bg={bgColor} borderWidth={1} borderColor={borderColor}>
                        <CardHeader pb={2}>
                          <HStack justify="space-between">
                            <Text fontWeight="semibold" textTransform="capitalize">
                              {nutrient}
                            </Text>
                            <Badge colorScheme={getProgressColor(data.percentage)}>
                              {status.label}
                            </Badge>
                          </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                          <VStack align="stretch" spacing={3}>
                            <HStack justify="space-between">
                              <Text fontSize="sm">Target: {data.target}{nutrient === 'calories' ? '' : 'g'}</Text>
                              <Text fontSize="sm">Actual: {data.actual.toFixed(1)}{nutrient === 'calories' ? '' : 'g'}</Text>
                            </HStack>
                            <Progress
                              value={Math.min(data.percentage, 100)}
                              colorScheme={getProgressColor(data.percentage)}
                              hasStripe
                              isAnimated
                            />
                            <Text fontSize="xs" color="gray.500" textAlign="center">
                              {data.percentage.toFixed(1)}% of target achieved
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    )
                  })}
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Trends Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">
                  Progress Trends
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <VStack>
                        <Icon 
                          as={getTrendIcon(analytics.trends.calories_trend)} 
                          color={getTrendColor(analytics.trends.calories_trend)}
                          boxSize={8}
                        />
                        <Text fontWeight="semibold">Calorie Trend</Text>
                        <Text fontSize="sm" color="gray.500">
                          {analytics.trends.calories_trend > 0 ? '+' : ''}
                          {analytics.trends.calories_trend.toFixed(0)} cal/day
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <VStack>
                        <Icon 
                          as={getTrendIcon(analytics.trends.protein_trend)} 
                          color={getTrendColor(analytics.trends.protein_trend)}
                          boxSize={8}
                        />
                        <Text fontWeight="semibold">Protein Trend</Text>
                        <Text fontSize="sm" color="gray.500">
                          {analytics.trends.protein_trend > 0 ? '+' : ''}
                          {analytics.trends.protein_trend.toFixed(1)}g/day
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardBody>
                      <VStack>
                        <Icon 
                          as={getTrendIcon(analytics.trends.completion_trend)} 
                          color={getTrendColor(analytics.trends.completion_trend)}
                          boxSize={8}
                        />
                        <Text fontWeight="semibold">Completion Trend</Text>
                        <Text fontSize="sm" color="gray.500">
                          {analytics.trends.completion_trend > 0 ? '+' : ''}
                          {analytics.trends.completion_trend.toFixed(1)}%
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            </TabPanel>

            {/* Insights Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="semibold">
                        Key Insights
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <List spacing={2}>
                        {analytics.insights.map((insight, index) => (
                          <ListItem key={index}>
                            <ListIcon as={MdTrendingUp} color="blue.500" />
                            <Text fontSize="sm">{insight}</Text>
                          </ListItem>
                        ))}
                      </List>
                    </CardBody>
                  </Card>

                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="semibold">
                        Recommendations
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <List spacing={2}>
                        {analytics.recommendations.map((recommendation, index) => (
                          <ListItem key={index}>
                            <ListIcon as={MdAssessment} color="green.500" />
                            <Text fontSize="sm">{recommendation}</Text>
                          </ListItem>
                        ))}
                      </List>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Missed Meals */}
                {analytics.missed_meals.length > 0 && (
                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="semibold">
                        Missed Meals ({analytics.missed_meals.length})
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {analytics.missed_meals.map((meal, index) => (
                          <Box key={index} p={3} bg={useColorModeValue('red.50', 'red.900')} borderRadius="md">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {meal.meal_type}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {format(new Date(meal.date), 'MMM dd, yyyy')}
                                </Text>
                              </VStack>
                              <Text fontSize="xs" color="gray.500">
                                {meal.planned_nutrition.calories} cal
                              </Text>
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Food Analysis Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="semibold">
                        Top Foods
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        {analytics.top_foods.map((food, index) => (
                          <HStack key={index} justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">
                                {food.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {food.frequency} times
                              </Text>
                            </VStack>
                            <Text fontSize="sm" color="gray.500">
                              {food.total_calories} cal
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
                    <CardHeader>
                      <Text fontSize="lg" fontWeight="semibold">
                        Dietary Balance Scores
                      </Text>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4}>
                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm">Food Variety</Text>
                          <CircularProgress
                            value={analytics.dietary_balance.variety_score}
                            size="60px"
                            color="blue.400"
                          >
                            <CircularProgressLabel fontSize="xs">
                              {analytics.dietary_balance.variety_score}
                            </CircularProgressLabel>
                          </CircularProgress>
                        </HStack>

                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm">Nutritional Balance</Text>
                          <CircularProgress
                            value={analytics.dietary_balance.balance_score}
                            size="60px"
                            color="green.400"
                          >
                            <CircularProgressLabel fontSize="xs">
                              {analytics.dietary_balance.balance_score}
                            </CircularProgressLabel>
                          </CircularProgress>
                        </HStack>

                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm">Consistency</Text>
                          <CircularProgress
                            value={analytics.dietary_balance.consistency_score}
                            size="60px"
                            color="purple.400"
                          >
                            <CircularProgressLabel fontSize="xs">
                              {analytics.dietary_balance.consistency_score}
                            </CircularProgressLabel>
                          </CircularProgress>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}

export default MealPlanAnalyticsComponent
