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
  Spinner,
  useDisclosure 
} from '@chakra-ui/react'
import { FiTarget, FiTrendingUp, FiActivity, FiDroplet, FiHeart, FiInfo } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import api from '../../utils/api'
import {
  HealthScoreDetailModal,
  WeeklyProgressDetailModal,
  NutritionStreakDetailModal,
  WaterIntakeDetailModal,
  RecentMealsDetailModal,
  GoalsProgressDetailModal
} from './DetailedModals'

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
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, md: false })

  useEffect(() => {
    const fetchRecentMeals = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const response = await api.get(`/food-logs/date/${today}`)
        const logs = response.data.logs || []
        
        // Extract recent meals from the logs
        const recentMeals = logs
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
    <>
      <Box 
        bg={bg} 
        p={isMobile ? 3 : 4} 
        borderRadius="lg" 
        borderWidth={1} 
        borderColor={borderColor} 
        h="100%"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ 
          borderColor: 'green.300', 
          boxShadow: 'md',
          transform: 'translateY(-2px)' 
        }}
        onClick={onOpen}
      >
        <VStack spacing={isMobile ? 2 : 3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <FiActivity color="green" />
              <Heading size={isMobile ? "xs" : "sm"} color="green.600">Recent Meals</Heading>
            </HStack>
            <FiInfo color="gray" size={16} />
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
            <VStack spacing={2} py={4}>
              <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500" textAlign="center">
                No meals logged today
              </Text>
              <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.400" textAlign="center">
                Click to start logging
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
      
      <RecentMealsDetailModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

export const WaterIntakeWidget = () => {
  const [waterData, setWaterData] = useState<WaterIntake | null>(null)
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
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
    <>
      <Box 
        bg={bg} 
        p={4} 
        borderRadius="lg" 
        borderWidth={1} 
        borderColor={borderColor} 
        h="100%"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ 
          borderColor: 'blue.300', 
          boxShadow: 'md',
          transform: 'translateY(-2px)' 
        }}
        onClick={onOpen}
      >
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <FiDroplet color="blue" />
              <Heading size="sm" color="blue.600">Water Intake</Heading>
            </HStack>
            <FiInfo color="gray" size={16} />
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
            
            {percentage < 100 && (
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Click for detailed tracking
              </Text>
            )}
          </VStack>
        </VStack>
      </Box>
      
      <WaterIntakeDetailModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

export const StreakWidget = () => {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
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

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'green'
    if (streak >= 3) return 'orange'
    return 'red'
  }

  const currentStreak = streakData?.current_streak || 0

  return (
    <>
      <Box 
        bg={bg} 
        p={4} 
        borderRadius="lg" 
        borderWidth={1} 
        borderColor={borderColor} 
        h="100%"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ 
          borderColor: 'orange.300', 
          boxShadow: 'md',
          transform: 'translateY(-2px)' 
        }}
        onClick={onOpen}
      >
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <FiTrendingUp color="orange" />
              <Heading size="sm" color="orange.600">Nutrition Streak</Heading>
            </HStack>
            <FiInfo color="gray" size={16} />
          </HStack>
          
          <VStack spacing={2}>
            <Text fontSize="3xl" fontWeight="bold" color={`${getStreakColor(currentStreak)}.600`}>
              {currentStreak}
            </Text>
            <Text fontSize="sm" color="gray.500">Days in a row</Text>
            
            <Box textAlign="center">
              <Text fontSize="xs" color="gray.400">Personal Best</Text>
              <Text fontSize="lg" fontWeight="bold" color="orange.400">
                {streakData?.best_streak || 0} days
              </Text>
            </Box>
            
            {currentStreak >= 7 && (
              <Badge colorScheme="orange" variant="solid">
                🔥 On Fire!
              </Badge>
            )}
            
            {currentStreak === 0 && (
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Click to start your streak
              </Text>
            )}
            
            {currentStreak > 0 && currentStreak < 7 && (
              <Text fontSize="xs" color="gray.400" textAlign="center">
                {7 - currentStreak} days to weekly goal
              </Text>
            )}
          </VStack>
        </VStack>
      </Box>
      
      <NutritionStreakDetailModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

export const GoalsProgressWidget = () => {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
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
    <>
      <Box 
        bg={bg} 
        p={4} 
        borderRadius="lg" 
        borderWidth={1} 
        borderColor={borderColor} 
        h="100%"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ 
          borderColor: 'purple.300', 
          boxShadow: 'md',
          transform: 'translateY(-2px)' 
        }}
        onClick={onOpen}
      >
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <FiTarget color="purple" />
              <Heading size="sm" color="purple.600">Goals Progress</Heading>
            </HStack>
            <FiInfo color="gray" size={16} />
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
              <Text fontSize="xs" color="gray.400" textAlign="center" pt={2}>
                Click to see all goals
              </Text>
            </VStack>
          ) : (
            <VStack spacing={2} py={4}>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                No active goals set
              </Text>
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Click to create your first goal
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
      
      <GoalsProgressDetailModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

export const HealthScoreWidget = ({ score }: { score: number }) => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const { isOpen, onOpen, onClose } = useDisclosure()
  
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
    <>
      <Box 
        bg={bg} 
        p={4} 
        borderRadius="lg" 
        borderWidth={1} 
        borderColor={borderColor} 
        h="100%"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ 
          borderColor: `${getScoreColor(score)}.300`, 
          boxShadow: 'md',
          transform: 'translateY(-2px)' 
        }}
        onClick={onOpen}
      >
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <FiHeart color="red" />
              <Heading size="sm" color="red.600">Health Score</Heading>
            </HStack>
            <FiInfo color="gray" size={16} />
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
            
            <Text fontSize="xs" color="gray.400" textAlign="center" pt={1}>
              Click for detailed analysis
            </Text>
          </VStack>
        </VStack>
      </Box>
      
      <HealthScoreDetailModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

export const WeeklyProgressWidget = () => {
  const [loading, setLoading] = useState(true)
  const [weeklyData, setWeeklyData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    const fetchWeeklyProgress = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.get('/ai-dashboard/weekly-progress')
        setWeeklyData(response.data)
      } catch (err: any) {
        console.error('Error fetching weekly progress:', err)
        setError(err.message || 'Failed to load weekly progress')
      } finally {
        setLoading(false)
      }
    }

    fetchWeeklyProgress()
  }, [])

  if (loading) return <Spinner size="sm" />

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'green'
      case 'declining':
        return 'red'
      default:
        return 'blue'
    }
  }

  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈'
      case 'declining':
        return '📉'
      default:
        return '➡️'
    }
  }

  return (
    <>
      <Box 
        bg={bg} 
        p={4} 
        borderRadius="lg" 
        borderWidth={1} 
        borderColor={borderColor} 
        h="100%"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ 
          borderColor: `${getTrendColor(weeklyData?.trend || 'stable')}.300`, 
          boxShadow: 'md',
          transform: 'translateY(-2px)' 
        }}
        onClick={onOpen}
      >
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between">
            <HStack>
              <Text fontSize="lg">{getTrendEmoji(weeklyData?.trend || 'stable')}</Text>
              <Heading size="sm" color={`${getTrendColor(weeklyData?.trend || 'stable')}.600`}>
                Weekly Progress
              </Heading>
            </HStack>
            <FiInfo color="gray" size={16} />
          </HStack>
          
          {error || !weeklyData ? (
            <VStack spacing={2} py={4}>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                {error ? 'Unable to load data' : 'No data available'}
              </Text>
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Click to view details
              </Text>
            </VStack>
          ) : (
            <VStack spacing={3} align="stretch">
              {/* Key metrics in a compact grid */}
              <HStack justify="space-between" w="full">
                <VStack spacing={1} align="center">
                  <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                    {weeklyData.streak_days}
                  </Text>
                  <Text fontSize="xs" color="gray.600">Day Streak</Text>
                </VStack>
                
                <VStack spacing={1} align="center">
                  <Text fontSize="2xl" fontWeight="bold" color="green.600">
                    {weeklyData.goal_achievement}%
                  </Text>
                  <Text fontSize="xs" color="gray.600">Goals</Text>
                </VStack>
              </HStack>
              
              <HStack justify="space-between" w="full">
                <VStack spacing={1} align="center">
                  <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    {weeklyData.meals_logged}
                  </Text>
                  <Text fontSize="xs" color="gray.600">Meals</Text>
                </VStack>
                
                <VStack spacing={1} align="center">
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    {weeklyData.water_intake}
                  </Text>
                  <Text fontSize="xs" color="gray.600">Water</Text>
                </VStack>
              </HStack>
              
              {/* Progress bar for consistency */}
              <VStack spacing={1} w="full">
                <HStack justify="space-between" w="full">
                  <Text fontSize="xs" color="gray.600">Consistency</Text>
                  <Text fontSize="xs" fontWeight="medium">
                    {weeklyData.consistency_score}%
                  </Text>
                </HStack>
                <Progress 
                  value={weeklyData.consistency_score} 
                  colorScheme={getTrendColor(weeklyData.trend)}
                  size="sm"
                  w="full"
                  borderRadius="full"
                />
              </VStack>
              
              <Badge 
                colorScheme={getTrendColor(weeklyData.trend)} 
                variant="outline"
                textAlign="center"
                fontSize="xs"
              >
                {weeklyData.trend === 'improving' ? '📈 Trending Up' : 
                 weeklyData.trend === 'declining' ? '📉 Needs Attention' : 
                 '➡️ Stable Progress'}
              </Badge>
              
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Click for detailed insights
              </Text>
            </VStack>
          )}
        </VStack>
      </Box>
      
      <WeeklyProgressDetailModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}
