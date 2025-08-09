import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useColorModeValue,
  Divider,
  Icon,
  List,
  ListItem,
  Spinner,
  Flex,
} from '@chakra-ui/react'
import { FiActivity, FiTarget, FiRefreshCw, FiPlus, FiClock } from 'react-icons/fi'
import api from '../../../utils/api'

interface RecentMeal {
  id: string
  food_name: string
  meal_type: string
  amount: number
  unit: string
  calories: number
  logged_at: string
  nutrition: {
    protein: number
    carbs: number
    fat: number
    fiber?: number
  }
}

interface RecentMealsDetailModalProps {
  isOpen: boolean
  onClose: () => void
}

const RecentMealsDetailModal: React.FC<RecentMealsDetailModalProps> = ({ isOpen, onClose }) => {
  const [meals, setMeals] = useState<RecentMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailySummary, setDailySummary] = useState<any>(null)
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const statBg = useColorModeValue('gray.50', 'gray.700')

  const fetchMealsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch today's food logs
      const response = await api.get(`/food-logs/date/${today}`)
      const logs = response.data.logs || []
      
      // Create a basic daily summary structure for compatibility
      const dailyData = {
        meals: logs,
        date: today,
        total_nutrition: {
          calories: logs.reduce((sum: number, meal: any) => sum + (meal.nutrition?.calories || 0), 0),
          protein: logs.reduce((sum: number, meal: any) => sum + (meal.nutrition?.protein || 0), 0),
          carbs: logs.reduce((sum: number, meal: any) => sum + (meal.nutrition?.carbs || 0), 0),
          fat: logs.reduce((sum: number, meal: any) => sum + (meal.nutrition?.fat || 0), 0),
        }
      }
      
      setDailySummary(dailyData)
      
      // Extract and sort meals by time
      const allMeals = logs.map((meal: any) => ({
        id: meal.id,
        food_name: meal.food_name,
        meal_type: meal.meal_type,
        amount: meal.amount,
        unit: meal.unit,
        calories: meal.nutrition?.calories || 0,
        logged_at: meal.logged_at,
        nutrition: {
          protein: meal.nutrition?.protein || 0,
          carbs: meal.nutrition?.carbs || 0,
          fat: meal.nutrition?.fat || 0,
          fiber: meal.nutrition?.fiber || 0,
        }
      })).sort((a: RecentMeal, b: RecentMeal) => 
        new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
      )
      
      setMeals(allMeals)
    } catch (err: any) {
      console.error('Error fetching meals data:', err)
      setError(err.message || 'Failed to load meals data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchMealsData()
    }
  }, [isOpen])

  const getMealTypeColor = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return 'orange'
      case 'lunch':
        return 'blue'
      case 'dinner':
        return 'purple'
      case 'snack':
        return 'green'
      default:
        return 'gray'
    }
  }

  const getMealTypeEmoji = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return '🌅'
      case 'lunch':
        return '☀️'
      case 'dinner':
        return '🌙'
      case 'snack':
        return '🍎'
      default:
        return '🍽️'
    }
  }

  const totalCalories = dailySummary?.total_nutrition?.calories || 0
  const totalProtein = dailySummary?.total_nutrition?.protein || 0
  const totalCarbs = dailySummary?.total_nutrition?.carbs || 0
  const totalFat = dailySummary?.total_nutrition?.fat || 0

  const mealTypeGroups = meals.reduce((groups: any, meal) => {
    const type = meal.meal_type.toLowerCase()
    if (!groups[type]) groups[type] = []
    groups[type].push(meal)
    return groups
  }, {})

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Today's Meals</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} py={8}>
              <Spinner color="green.400" />
              <Text>Loading your meals...</Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="900px">
        <ModalHeader>
          <HStack spacing={3}>
            <FiActivity color="var(--chakra-colors-green-500)" />
            <Text>Today's Meals & Nutrition</Text>
            <Badge colorScheme="green" variant="solid">
              {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error loading data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Today's Summary */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Heading size="md" mb={4}>Today's Nutrition Summary</Heading>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Box p={4} borderRadius="lg" bg={statBg} textAlign="center">
                    <Icon as={FiTarget} color="red.500" boxSize={6} mb={2} />
                    <Text fontSize="2xl" fontWeight="bold" color="red.600">
                      {Math.round(totalCalories)}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Calories</Text>
                  </Box>

                  <Box p={4} borderRadius="lg" bg={statBg} textAlign="center">
                    <Text fontSize="2xl" mb={2}>💪</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {Math.round(totalProtein)}g
                    </Text>
                    <Text fontSize="sm" color="gray.600">Protein</Text>
                  </Box>

                  <Box p={4} borderRadius="lg" bg={statBg} textAlign="center">
                    <Text fontSize="2xl" mb={2}>🌾</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {Math.round(totalCarbs)}g
                    </Text>
                    <Text fontSize="sm" color="gray.600">Carbs</Text>
                  </Box>

                  <Box p={4} borderRadius="lg" bg={statBg} textAlign="center">
                    <Text fontSize="2xl" mb={2}>🥑</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="yellow.600">
                      {Math.round(totalFat)}g
                    </Text>
                    <Text fontSize="sm" color="gray.600">Fat</Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {meals.length > 0 ? (
              <>
                {/* Meals by Type */}
                <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                  <CardBody>
                    <Heading size="md" mb={4}>Meals by Type</Heading>
                    <VStack spacing={4} align="stretch">
                      {Object.entries(mealTypeGroups).map(([mealType, typeMeals]: [string, any]) => (
                        <Box key={mealType}>
                          <HStack mb={3}>
                            <Text fontSize="xl">{getMealTypeEmoji(mealType)}</Text>
                            <Heading size="sm" textTransform="capitalize">
                              {mealType}
                            </Heading>
                            <Badge colorScheme={getMealTypeColor(mealType)} variant="outline">
                              {typeMeals.length} {typeMeals.length === 1 ? 'item' : 'items'}
                            </Badge>
                          </HStack>
                          
                          <VStack spacing={2} align="stretch" pl={6}>
                            {typeMeals.map((meal: RecentMeal) => (
                              <Box
                                key={meal.id}
                                p={3}
                                borderRadius="lg"
                                bg={useColorModeValue(`${getMealTypeColor(mealType)}.50`, `${getMealTypeColor(mealType)}.900`)}
                                border="1px solid"
                                borderColor={`${getMealTypeColor(mealType)}.200`}
                              >
                                <Flex justify="space-between" align="start">
                                  <VStack align="start" spacing={1} flex={1}>
                                    <Text fontWeight="bold" fontSize="md">
                                      {meal.food_name}
                                    </Text>
                                    <HStack spacing={4} fontSize="sm" color="gray.600">
                                      <Text>{meal.amount} {meal.unit}</Text>
                                      <Text>{Math.round(meal.calories)} cal</Text>
                                      <Text>
                                        {new Date(meal.logged_at).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </Text>
                                    </HStack>
                                    <HStack spacing={3} fontSize="xs">
                                      <Text>P: {Math.round(meal.nutrition.protein)}g</Text>
                                      <Text>C: {Math.round(meal.nutrition.carbs)}g</Text>
                                      <Text>F: {Math.round(meal.nutrition.fat)}g</Text>
                                    </HStack>
                                  </VStack>
                                  
                                  <VStack spacing={1} align="end">
                                    <Badge colorScheme={getMealTypeColor(mealType)} variant="solid">
                                      {Math.round(meal.calories)} cal
                                    </Badge>
                                  </VStack>
                                </Flex>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Timeline View */}
                <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      <HStack>
                        <Icon as={FiClock} />
                        <Text>Meal Timeline</Text>
                      </HStack>
                    </Heading>
                    
                    <VStack spacing={3} align="stretch">
                      {meals.map((meal, index) => (
                        <Box key={meal.id} position="relative">
                          {index < meals.length - 1 && (
                            <Box
                              position="absolute"
                              left="20px"
                              top="50px"
                              width="2px"
                              height="40px"
                              bg="gray.200"
                              zIndex={0}
                            />
                          )}
                          
                          <HStack spacing={4} align="start">
                            <VStack spacing={1} minW="80px">
                              <Box
                                w="40px"
                                h="40px"
                                borderRadius="full"
                                bg={`${getMealTypeColor(meal.meal_type)}.100`}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                border="2px solid"
                                borderColor={`${getMealTypeColor(meal.meal_type)}.300`}
                                zIndex={1}
                                position="relative"
                              >
                                <Text fontSize="lg">
                                  {getMealTypeEmoji(meal.meal_type)}
                                </Text>
                              </Box>
                              <Text fontSize="xs" color="gray.600" textAlign="center">
                                {new Date(meal.logged_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </VStack>
                            
                            <Box
                              flex={1}
                              p={4}
                              borderRadius="lg"
                              bg={statBg}
                              border="1px solid"
                              borderColor={borderColor}
                            >
                              <HStack justify="space-between" mb={2}>
                                <Text fontWeight="bold">{meal.food_name}</Text>
                                <Badge colorScheme={getMealTypeColor(meal.meal_type)}>
                                  {meal.meal_type}
                                </Badge>
                              </HStack>
                              
                              <HStack justify="space-between" fontSize="sm">
                                <Text color="gray.600">
                                  {meal.amount} {meal.unit}
                                </Text>
                                <HStack spacing={3}>
                                  <Text fontWeight="medium">{Math.round(meal.calories)} cal</Text>
                                  <Text color="gray.600">
                                    P:{Math.round(meal.nutrition.protein)}g C:{Math.round(meal.nutrition.carbs)}g F:{Math.round(meal.nutrition.fat)}g
                                  </Text>
                                </HStack>
                              </HStack>
                            </Box>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Meal Statistics */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                    <CardBody>
                      <Heading size="sm" mb={4}>Today's Statistics</Heading>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Total meals logged</Text>
                          <Text fontWeight="bold">{meals.length}</Text>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Average calories per meal</Text>
                          <Text fontWeight="bold">{Math.round(totalCalories / Math.max(meals.length, 1))}</Text>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">First meal time</Text>
                          <Text fontWeight="bold">
                            {meals.length > 0 ? 
                              new Date(meals[meals.length - 1].logged_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '--:--'
                            }
                          </Text>
                        </HStack>
                        
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">Last meal time</Text>
                          <Text fontWeight="bold">
                            {meals.length > 0 ? 
                              new Date(meals[0].logged_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '--:--'
                            }
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                    <CardBody>
                      <Heading size="sm" mb={4}>Meal Type Distribution</Heading>
                      <VStack spacing={3} align="stretch">
                        {Object.entries(mealTypeGroups).map(([type, typeMeals]: [string, any]) => {
                          const percentage = (typeMeals.length / meals.length) * 100
                          return (
                            <Box key={type}>
                              <HStack justify="space-between" mb={1}>
                                <HStack>
                                  <Text fontSize="lg">{getMealTypeEmoji(type)}</Text>
                                  <Text fontSize="sm" textTransform="capitalize">{type}</Text>
                                </HStack>
                                <Text fontSize="sm" fontWeight="bold">
                                  {typeMeals.length} ({Math.round(percentage)}%)
                                </Text>
                              </HStack>
                            </Box>
                          )
                        })}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              </>
            ) : (
              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody>
                  <VStack spacing={6} py={8} textAlign="center">
                    <Icon as={FiActivity} color="gray.300" boxSize={16} />
                    <VStack spacing={2}>
                      <Text fontSize="xl" fontWeight="bold" color="gray.600">
                        No meals logged today
                      </Text>
                      <Text color="gray.500">
                        Start tracking your nutrition by logging your first meal!
                      </Text>
                    </VStack>
                    
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="green"
                      size="lg"
                      onClick={() => {
                        // This would open food logging modal or navigate to food log page
                        alert('Food logging would open here')
                      }}
                    >
                      Log Your First Meal
                    </Button>
                    
                    <List spacing={2} fontSize="sm" color="gray.600" textAlign="left">
                      <ListItem>🌅 Log breakfast to start your day right</ListItem>
                      <ListItem>📱 Use the food search to find your meals quickly</ListItem>
                      <ListItem>📊 Track your nutrition goals and progress</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            )}

            <HStack justify="center" pt={4}>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={fetchMealsData}
                variant="outline"
              >
                Refresh Data
              </Button>
              
              <Button
                leftIcon={<FiPlus />}
                colorScheme="green"
                onClick={() => {
                  // This would open food logging modal
                  alert('Food logging modal would open here')
                }}
              >
                Log New Meal
              </Button>
            </HStack>

            <Divider />
            
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Showing all meals logged for today ({new Date().toLocaleDateString()})
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default RecentMealsDetailModal
