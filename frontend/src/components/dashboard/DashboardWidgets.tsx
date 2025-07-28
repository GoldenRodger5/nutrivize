import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Heading, 
  Progress, 
  Badge, 
  useColorModeValue, 
  useBreakpointValue,
  Spinner 
} from '@chakra-ui/react'
import { FiTarget, FiTrendingUp, FiActivity, FiDroplet, FiHeart } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import api from '../../utils/api'

interface RecentMeal {
  id: string
  meal_type: string
  food_name: string
  calories: number
  created_at: string
}

interface WaterIntake {
  total_today: number
  goal: number
  last_logged: string
}

interface StreakData {
  current_streak: number
  best_streak: number
  streak_type: string
}

export const RecentMealsWidget = () => {
  const [meals, setMeals] = useState<RecentMeal[]>([])
  const [loading, setLoading] = useState(true)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, md: false })

  useEffect(() => {
    const fetchRecentMeals = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const response = await api.get(`/food-logs/daily/${today}`)
        const dailyData = response.data
        
        // Extract recent meals from the daily data
        const recentMeals = (dailyData.meals || [])
          .slice(-5) // Last 5 meals
          .map((meal: any) => ({
            id: meal.id,
            meal_type: meal.meal_type,
            food_name: meal.food_name,
            calories: meal.calories,
            created_at: meal.created_at
          }))
        
        setMeals(recentMeals)
      } catch (err) {
        console.error('Error fetching recent meals:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentMeals()
  }, [])

  if (loading) return <Spinner size="sm" />

  return (
    <Box bg={bg} p={isMobile ? 3 : 4} borderRadius="lg" borderWidth={1} borderColor={borderColor} h="100%">
      <VStack spacing={isMobile ? 2 : 3} align="stretch">
        <HStack>
          <FiActivity color="green" />
          <Heading size={isMobile ? "xs" : "sm"} color="green.600">Recent Meals</Heading>
        </HStack>
        
        {meals.length > 0 ? (
          <VStack spacing={isMobile ? 1.5 : 2} align="stretch">
            {meals.map((meal) => (
              <Box 
                key={meal.id} 
                p={isMobile ? 2 : 2} 
                bg={useColorModeValue('gray.50', 'gray.700')} 
                borderRadius="md"
              >
                <HStack justify="space-between">
                  <VStack spacing={0} align="start">
                    <Text fontSize={isMobile ? "xs" : "sm"} fontWeight="medium" noOfLines={1}>
                      {meal.food_name}
                    </Text>
                    <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.500" textTransform="capitalize">
                      {meal.meal_type}
                    </Text>
                  </VStack>
                  <Text fontSize={isMobile ? "xs" : "sm"} fontWeight="bold" color="green.600">
                    {Math.round(meal.calories)} cal
                  </Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500" textAlign="center" py={isMobile ? 2 : 4}>
            No meals logged today
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export const WaterIntakeWidget = () => {
  const [waterData, setWaterData] = useState<WaterIntake | null>(null)
  const [loading, setLoading] = useState(true)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    const fetchWaterIntake = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const response = await api.get(`/water-logs/?date=${today}`)
        const waterLogs = response.data || []
        
        const totalToday = waterLogs.reduce((total: number, log: any) => total + (log.amount_fl_oz || 0), 0)
        const goal = 64 // Default goal, could be fetched from user preferences
        
        setWaterData({
          total_today: totalToday,
          goal: goal,
          last_logged: waterLogs.length > 0 ? waterLogs[waterLogs.length - 1].created_at : ''
        })
      } catch (err) {
        console.error('Error fetching water intake:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWaterIntake()
  }, [])

  if (loading) return <Spinner size="sm" />

  const percentage = waterData ? Math.min((waterData.total_today / waterData.goal) * 100, 100) : 0

  return (
    <Box bg={bg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor} h="100%">
      <VStack spacing={3} align="stretch">
        <HStack>
          <FiDroplet color="blue" />
          <Heading size="sm" color="blue.600">Water Intake</Heading>
        </HStack>
        
        <VStack spacing={2}>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
            {Math.round(waterData?.total_today || 0)} / {waterData?.goal || 64} fl oz
          </Text>
          
          <Progress 
            value={percentage} 
            colorScheme="blue" 
            size="lg" 
            w="full" 
            borderRadius="full"
          />
          
          <Text fontSize="sm" color="gray.500">
            {Math.round(percentage)}% of daily goal
          </Text>
          
          {percentage >= 100 && (
            <Badge colorScheme="blue" variant="solid">
              Goal Achieved! 🎉
            </Badge>
          )}
        </VStack>
      </VStack>
    </Box>
  )
}

export const StreakWidget = () => {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/analytics/nutrition-streak')
        setStreakData(response.data)
      } catch (err) {
        console.error('Error fetching streak data:', err)
        // Set default data if API fails
        setStreakData({
          current_streak: 0,
          best_streak: 0,
          streak_type: 'daily_logging'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStreakData()
  }, [])

  if (loading) return <Spinner size="sm" />

  return (
    <Box bg={bg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor} h="100%">
      <VStack spacing={3} align="stretch">
        <HStack>
          <FiTrendingUp color="orange" />
          <Heading size="sm" color="orange.600">Nutrition Streak</Heading>
        </HStack>
        
        <VStack spacing={2}>
          <Text fontSize="3xl" fontWeight="bold" color="orange.600">
            {streakData?.current_streak || 0}
          </Text>
          <Text fontSize="sm" color="gray.500">Days in a row</Text>
          
          <Box textAlign="center">
            <Text fontSize="xs" color="gray.400">Personal Best</Text>
            <Text fontSize="lg" fontWeight="bold" color="orange.400">
              {streakData?.best_streak || 0} days
            </Text>
          </Box>
          
          {(streakData?.current_streak || 0) >= 7 && (
            <Badge colorScheme="orange" variant="solid">
              🔥 On Fire!
            </Badge>
          )}
        </VStack>
      </VStack>
    </Box>
  )
}

export const GoalsProgressWidget = () => {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true)
        const response = await api.get('/goals/')
        const goalsData = response.data || []
        
        // Take the first 3 active goals
        const activeGoals = goalsData
          .filter((goal: any) => goal.status === 'active')
          .slice(0, 3)
        
        setGoals(activeGoals)
      } catch (err) {
        console.error('Error fetching goals:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [])

  if (loading) return <Spinner size="sm" />

  return (
    <Box bg={bg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor} h="100%">
      <VStack spacing={3} align="stretch">
        <HStack>
          <FiTarget color="purple" />
          <Heading size="sm" color="purple.600">Goals Progress</Heading>
        </HStack>
        
        {goals.length > 0 ? (
          <VStack spacing={3} align="stretch">
            {goals.map((goal) => (
              <Box key={goal.id}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                    {goal.title}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {Math.round(goal.progress || 0)}%
                  </Text>
                </HStack>
                <Progress 
                  value={goal.progress || 0} 
                  colorScheme="purple" 
                  size="sm" 
                  borderRadius="full"
                />
              </Box>
            ))}
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            No active goals set
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export const HealthScoreWidget = ({ score }: { score: number }) => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'red'
  }
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <Box bg={bg} p={4} borderRadius="lg" borderWidth={1} borderColor={borderColor} h="100%">
      <VStack spacing={3} align="stretch">
        <HStack>
          <FiHeart color="red" />
          <Heading size="sm" color="red.600">Health Score</Heading>
        </HStack>
        
        <VStack spacing={2}>
          <Text fontSize="4xl" fontWeight="bold" color={`${getScoreColor(score)}.600`}>
            {score}
          </Text>
          <Text fontSize="sm" color="gray.500">/100</Text>
          
          <Badge 
            colorScheme={getScoreColor(score)} 
            variant="solid"
            fontSize="xs"
          >
            {getScoreLabel(score)}
          </Badge>
          
          <Progress 
            value={score} 
            colorScheme={getScoreColor(score)} 
            size="lg" 
            w="full" 
            borderRadius="full"
          />
        </VStack>
      </VStack>
    </Box>
  )
}
