import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import { useAppState } from '../contexts/AppStateContext'
import { getCurrentDateInTimezone, getUserTimezone } from '../utils/timezone'
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget'
import UserSystemNotifications from '../components/notifications/UserSystemNotifications'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const { 
    dailySummary,
    goals,
    loading,
    refreshDailySummary,
    refreshGoals
  } = useAppState()

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    // Load today's data using user's timezone
    const userTimezone = getUserTimezone()
    const today = getCurrentDateInTimezone(userTimezone)
    console.log('📅 Dashboard loading data for today:', today, 'in timezone:', userTimezone)
    refreshDailySummary(today)
    refreshGoals()
  }, [refreshDailySummary, refreshGoals])

  // Find the active goal
  const activeGoal = goals.find(goal => goal.active) || null

  const getNutritionProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  // Use active goal nutrition targets if available, otherwise fall back to defaults
  const nutritionTargets = activeGoal?.nutrition_targets || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading...</Text>
      </Container>
    )
  }

  const nutrition = dailySummary?.total_nutrition || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  }

  return (
    <Container maxW={isMobile ? "100%" : "container.xl"} py={isMobile ? 4 : 8} px={isMobile ? 3 : 8}>
      <VStack spacing={isMobile ? 4 : 8} align="stretch">
        {/* Header */}
        <Box textAlign={isMobile ? "center" : "left"}>
          <Heading size={isMobile ? "md" : "lg"} mb={2}>
            Welcome back, {user?.name}! 👋
          </Heading>
          <Text color="gray.600" fontSize={isMobile ? "sm" : "md"}>
            Here's your nutrition summary for today
          </Text>
        </Box>

        {/* System notifications and onboarding prompts */}
        <UserSystemNotifications />

        {/* Welcome message or goal status */}
        {!activeGoal && (
          <Alert status="info">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Welcome to Nutrivize!</AlertTitle>
              <AlertDescription>
                Set up your nutrition goals to get personalized recommendations and track your progress.
              </AlertDescription>
            </Box>
            <Button 
              colorScheme="blue" 
              size="sm"
              onClick={() => navigate('/goals')}
            >
              Set Goals
            </Button>
          </Alert>
        )}

        {/* Nutrition Overview */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card bg={bg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Calories</StatLabel>
                <StatNumber>{Math.round(nutrition.calories)}</StatNumber>
                <StatHelpText>of {nutritionTargets.calories} kcal</StatHelpText>
                <Progress 
                  value={getNutritionProgress(nutrition.calories, nutritionTargets.calories)}
                  colorScheme="blue"
                  size="sm"
                  mt={2}
                />
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Protein</StatLabel>
                <StatNumber>{Math.round(nutrition.protein)}g</StatNumber>
                <StatHelpText>of {nutritionTargets.protein}g</StatHelpText>
                <Progress 
                  value={getNutritionProgress(nutrition.protein, nutritionTargets.protein)}
                  colorScheme="red"
                  size="sm"
                  mt={2}
                />
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Carbs</StatLabel>
                <StatNumber>{Math.round(nutrition.carbs)}g</StatNumber>
                <StatHelpText>of {nutritionTargets.carbs}g</StatHelpText>
                <Progress 
                  value={getNutritionProgress(nutrition.carbs, nutritionTargets.carbs)}
                  colorScheme="green"
                  size="sm"
                  mt={2}
                />
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Fat</StatLabel>
                <StatNumber>{Math.round(nutrition.fat)}g</StatNumber>
                <StatHelpText>of {nutritionTargets.fat}g</StatHelpText>
                <Progress 
                  value={getNutritionProgress(nutrition.fat, nutritionTargets.fat)}
                  colorScheme="yellow"
                  size="sm"
                  mt={2}
                />
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Quick Actions Widget */}
        <QuickActionsWidget />

        {/* Quick Actions */}
        <Card bg={bg} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Quick Actions</Heading>
              <HStack spacing={4} wrap="wrap">
                <Button 
                  colorScheme="green" 
                  size="md"
                  onClick={() => navigate('/food-log')}
                >
                  Log Food
                </Button>
                <Button 
                  colorScheme="blue" 
                  size="md"
                  onClick={() => navigate('/meal-planning')}
                >
                  Get Meal Suggestions
                </Button>
                <Button 
                  colorScheme="purple" 
                  size="md"
                  onClick={() => navigate('/ai')}
                >
                  Chat with AI Assistant
                </Button>
                <Button 
                  colorScheme="orange" 
                  size="md"
                  onClick={() => navigate('/analytics')}
                >
                  View Analytics
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Recent Meals */}
        {dailySummary?.meals && dailySummary.meals.length > 0 && (
          <Card bg={bg} borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Today's Meals</Heading>
                <VStack spacing={3} align="stretch">
                  {dailySummary.meals.map((meal) => (
                    <Box
                      key={meal.id}
                      p={3}
                      borderWidth={1}
                      borderColor={borderColor}
                      borderRadius="md"
                    >
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{meal.food_name}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {meal.meal_type} • {meal.amount} {meal.unit}
                          </Text>
                        </VStack>
                        <Text fontWeight="medium">
                          {Math.round(meal.nutrition.calories)} cal
                        </Text>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  )
}
