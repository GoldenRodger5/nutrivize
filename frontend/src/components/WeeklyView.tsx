import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  SimpleGrid,
  Badge,
  IconButton,
  Spinner,
  Center,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Icon,
  Heading,
} from '@chakra-ui/react'
import { useAppState } from '../contexts/AppStateContext'
import api from '../utils/api'
import { getCurrentDateInTimezone, getUserTimezone } from '../utils/timezone'

// Custom Arrow Icons
const ChevronLeftIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  </Icon>
)

const ChevronRightIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
  </Icon>
)

interface WeeklyData {
  date: string
  total_nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  meals: Array<{
    id: string
    food_name: string
    meal_type: string
    amount: number
    unit: string
    nutrition: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
  }>
}

interface FoodLogDetail {
  id: string
  food_name: string
  meal_type: string
  amount: number
  unit: string
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  date: string
}

export default function WeeklyView() {
  const { activeGoal } = useAppState()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Start with current week using user's timezone
    const userTimezone = getUserTimezone()
    const today = getCurrentDateInTimezone(userTimezone)
    const todayDate = new Date(today + 'T12:00:00') // Use noon to avoid timezone issues
    const startOfWeek = new Date(todayDate)
    startOfWeek.setDate(todayDate.getDate() - todayDate.getDay()) // Start from Sunday
    return startOfWeek
  })
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<FoodLogDetail | null>(null)
  const [selectedDayData, setSelectedDayData] = useState<WeeklyData | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { 
    isOpen: isDayDetailOpen, 
    onOpen: onDayDetailOpen, 
    onClose: onDayDetailClose 
  } = useDisclosure()

  const getWeekDates = (startDate: Date) => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const fetchWeeklyData = async () => {
    setLoading(true)
    try {
      const weekDates = getWeekDates(currentWeekStart)
      const startDate = weekDates[0].toISOString().split('T')[0]
      const endDate = weekDates[6].toISOString().split('T')[0]
      
      const response = await api.get(`/food-logs/range?start_date=${startDate}&end_date=${endDate}`)
      setWeeklyData(response.data)
    } catch (error) {
      console.error('Error fetching weekly data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchWeeklyData()
  }, [currentWeekStart])

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(currentWeekStart)
    newStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newStart)
  }

  const goToCurrentWeek = () => {
    const userTimezone = getUserTimezone()
    const today = getCurrentDateInTimezone(userTimezone)
    const todayDate = new Date(today + 'T12:00:00') // Use noon to avoid timezone issues
    const startOfWeek = new Date(todayDate)
    startOfWeek.setDate(todayDate.getDate() - todayDate.getDay())
    setCurrentWeekStart(startOfWeek)
  }

  const getDayData = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return weeklyData.find(day => day.date === dateStr)
  }

  const formatMealType = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1)
  }

  const openLogDetail = (log: any, date: string) => {
    setSelectedLog({ ...log, date })
    onOpen()
  }

  const openDayDetail = (dayData: WeeklyData) => {
    setSelectedDayData(dayData)
    onDayDetailOpen()
  }

  const weekDates = getWeekDates(currentWeekStart)
  const isCurrentWeek = weekDates.some(date => {
    const userTimezone = getUserTimezone()
    const today = getCurrentDateInTimezone(userTimezone)
    const todayDate = new Date(today + 'T12:00:00')
    return date.toDateString() === todayDate.toDateString()
  })

  return (
    <VStack spacing={6} align="stretch">
      {/* Week Navigation */}
      <HStack justify="space-between" align="center">
        <HStack spacing={2}>
          <IconButton
            aria-label="Previous week"
            icon={<ChevronLeftIcon />}
            onClick={() => navigateWeek('prev')}
            variant="outline"
            size="sm"
          />
          <Text fontWeight="medium" minW="200px" textAlign="center">
            {currentWeekStart.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })} - {weekDates[6].toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <IconButton
            aria-label="Next week"
            icon={<ChevronRightIcon />}
            onClick={() => navigateWeek('next')}
            variant="outline"
            size="sm"
          />
        </HStack>
        
        {!isCurrentWeek && (
          <HStack spacing={2}>
            <Button size="sm" onClick={goToCurrentWeek} colorScheme="blue">
              Current Week
            </Button>
          </HStack>
        )}
      </HStack>

      {loading ? (
        <Center py={20}>
          <VStack spacing={4}>
            <Spinner size="xl" color="green.500" />
            <Text color="gray.600">Loading weekly data...</Text>
          </VStack>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 7 }} spacing={4}>
          {weekDates.map((date, index) => {
            const dayData = getDayData(date)
            const userTimezone = getUserTimezone()
            const today = getCurrentDateInTimezone(userTimezone)
            const todayDate = new Date(today + 'T12:00:00')
            const isToday = date.toDateString() === todayDate.toDateString()
            
            return (
              <Card 
                key={index} 
                variant={isToday ? "filled" : "outline"}
                bg={isToday ? "blue.50" : "white"}
                borderColor={isToday ? "blue.200" : "gray.200"}
              >
                <CardBody p={4}>
                  <VStack spacing={3} align="stretch">
                    {/* Day Header */}
                    <VStack spacing={1}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.600">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold">
                        {date.getDate()}
                      </Text>
                    </VStack>

                    {dayData ? (
                      <>
                        {/* Calorie Summary */}
                        <Box textAlign="center">
                          <Text fontSize="sm" color="gray.600">Calories</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {Math.round(dayData.total_nutrition.calories)}
                          </Text>
                          {activeGoal?.nutrition_targets?.calories && (
                            <>
                              <Text fontSize="xs" color="gray.500">
                                / {activeGoal.nutrition_targets.calories}
                              </Text>
                              <Text fontSize="xs" color={
                                dayData.total_nutrition.calories > activeGoal.nutrition_targets.calories 
                                  ? "red.500" 
                                  : dayData.total_nutrition.calories >= activeGoal.nutrition_targets.calories * 0.9
                                  ? "green.500"
                                  : "orange.500"
                              }>
                                {dayData.total_nutrition.calories > activeGoal.nutrition_targets.calories 
                                  ? "Over" 
                                  : dayData.total_nutrition.calories >= activeGoal.nutrition_targets.calories * 0.9
                                  ? "On Track"
                                  : "Under"}
                              </Text>
                            </>
                          )}
                        </Box>

                        {/* Macros with Goal Status */}
                        <VStack spacing={1}>
                          <HStack justify="space-between" w="full" fontSize="xs">
                            <Text>P: {Math.round(dayData.total_nutrition.protein)}g</Text>
                            {activeGoal?.nutrition_targets?.protein && (
                              <Text color={
                                dayData.total_nutrition.protein >= activeGoal.nutrition_targets.protein * 0.9
                                  ? "green.500" : "orange.500"
                              }>
                                {dayData.total_nutrition.protein >= activeGoal.nutrition_targets.protein * 0.9 ? "✓" : "!"}
                              </Text>
                            )}
                          </HStack>
                          <HStack justify="space-between" w="full" fontSize="xs">
                            <Text>C: {Math.round(dayData.total_nutrition.carbs)}g</Text>
                            {activeGoal?.nutrition_targets?.carbs && (
                              <Text color={
                                Math.abs(dayData.total_nutrition.carbs - activeGoal.nutrition_targets.carbs) <= activeGoal.nutrition_targets.carbs * 0.2
                                  ? "green.500" : "orange.500"
                              }>
                                {Math.abs(dayData.total_nutrition.carbs - activeGoal.nutrition_targets.carbs) <= activeGoal.nutrition_targets.carbs * 0.2 ? "✓" : "!"}
                              </Text>
                            )}
                          </HStack>
                          <HStack justify="space-between" w="full" fontSize="xs">
                            <Text>F: {Math.round(dayData.total_nutrition.fat)}g</Text>
                            {activeGoal?.nutrition_targets?.fat && (
                              <Text color={
                                Math.abs(dayData.total_nutrition.fat - activeGoal.nutrition_targets.fat) <= activeGoal.nutrition_targets.fat * 0.2
                                  ? "green.500" : "orange.500"
                              }>
                                {Math.abs(dayData.total_nutrition.fat - activeGoal.nutrition_targets.fat) <= activeGoal.nutrition_targets.fat * 0.2 ? "✓" : "!"}
                              </Text>
                            )}
                          </HStack>
                        </VStack>

                        {/* Meals */}
                        {dayData.meals && dayData.meals.length > 0 && (
                          <VStack spacing={1} align="stretch">
                            <Text fontSize="xs" color="gray.600">Meals:</Text>
                            {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                              const mealLogs = dayData.meals.filter(log => log.meal_type === mealType)
                              if (mealLogs.length === 0) return null
                              
                              return (
                                <Box key={mealType}>
                                  <Badge 
                                    size="xs" 
                                    colorScheme="green" 
                                    cursor="pointer"
                                    onClick={() => openLogDetail(mealLogs[0], dayData.date)}
                                  >
                                    {formatMealType(mealType)} ({mealLogs.length})
                                  </Badge>
                                </Box>
                              )
                            })}
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => openDayDetail(dayData)}
                              mt={1}
                            >
                              View Day
                            </Button>
                          </VStack>
                        )}
                      </>
                    ) : (
                      <Box textAlign="center" py={4}>
                        <Text fontSize="xs" color="gray.400">
                          No data
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )
          })}
        </SimpleGrid>
      )}

      {/* Log Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Food Log Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedLog && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" fontSize="lg">{selectedLog.food_name}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {new Date(selectedLog.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} • {formatMealType(selectedLog.meal_type)}
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="medium" mb={2}>Serving Size</Text>
                  <Text>{selectedLog.amount} {selectedLog.unit}</Text>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={2}>Nutrition Information</Text>
                  <SimpleGrid columns={2} spacing={3}>
                    <Text>Calories: {Math.round(selectedLog.nutrition.calories)}</Text>
                    <Text>Protein: {Math.round(selectedLog.nutrition.protein)}g</Text>
                    <Text>Carbs: {Math.round(selectedLog.nutrition.carbs)}g</Text>
                    <Text>Fat: {Math.round(selectedLog.nutrition.fat)}g</Text>
                    {selectedLog.nutrition.fiber && (
                      <Text>Fiber: {Math.round(selectedLog.nutrition.fiber)}g</Text>
                    )}
                    {selectedLog.nutrition.sugar && (
                      <Text>Sugar: {Math.round(selectedLog.nutrition.sugar)}g</Text>
                    )}
                    {selectedLog.nutrition.sodium && (
                      <Text>Sodium: {Math.round(selectedLog.nutrition.sodium)}mg</Text>
                    )}
                  </SimpleGrid>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Day Detail Modal */}
      <Modal isOpen={isDayDetailOpen} onClose={onDayDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Daily Food Log - {selectedDayData && new Date(selectedDayData.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedDayData && (
              <VStack spacing={6} align="stretch">
                {/* Daily Summary */}
                <Card bg="blue.50" borderColor="blue.200" borderWidth={1}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm">Daily Summary</Heading>
                      <SimpleGrid columns={4} spacing={4}>
                        <Box textAlign="center">
                          <Text fontSize="sm" color="gray.600">Calories</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {Math.round(selectedDayData.total_nutrition.calories)}
                          </Text>
                          {activeGoal?.nutrition_targets?.calories && (
                            <Text fontSize="xs" color="gray.500">
                              / {activeGoal.nutrition_targets.calories}
                            </Text>
                          )}
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="sm" color="gray.600">Protein</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {Math.round(selectedDayData.total_nutrition.protein)}g
                          </Text>
                          {activeGoal?.nutrition_targets?.protein && (
                            <Text fontSize="xs" color="gray.500">
                              / {activeGoal.nutrition_targets.protein}g
                            </Text>
                          )}
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="sm" color="gray.600">Carbs</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {Math.round(selectedDayData.total_nutrition.carbs)}g
                          </Text>
                          {activeGoal?.nutrition_targets?.carbs && (
                            <Text fontSize="xs" color="gray.500">
                              / {activeGoal.nutrition_targets.carbs}g
                            </Text>
                          )}
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="sm" color="gray.600">Fat</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {Math.round(selectedDayData.total_nutrition.fat)}g
                          </Text>
                          {activeGoal?.nutrition_targets?.fat && (
                            <Text fontSize="xs" color="gray.500">
                              / {activeGoal.nutrition_targets.fat}g
                            </Text>
                          )}
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Meals Breakdown */}
                {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                  const mealLogs = selectedDayData.meals.filter(log => log.meal_type === mealType)
                  if (mealLogs.length === 0) return null

                  const mealTotals = mealLogs.reduce((totals, log) => ({
                    calories: totals.calories + log.nutrition.calories,
                    protein: totals.protein + log.nutrition.protein,
                    carbs: totals.carbs + log.nutrition.carbs,
                    fat: totals.fat + log.nutrition.fat,
                  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

                  return (
                    <Card key={mealType} variant="outline">
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between">
                            <Heading size="sm">{formatMealType(mealType)}</Heading>
                            <Badge colorScheme="blue" fontSize="sm">
                              {Math.round(mealTotals.calories)} calories
                            </Badge>
                          </HStack>

                          {/* Food Items */}
                          <VStack spacing={2} align="stretch">
                            {mealLogs.map((log) => (
                              <HStack key={log.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                                <Box flex="1">
                                  <Text fontWeight="medium">{log.food_name}</Text>
                                  <Text fontSize="sm" color="gray.600">
                                    {log.amount} {log.unit}
                                  </Text>
                                </Box>
                                <VStack spacing={0} align="end">
                                  <Text fontWeight="bold">{Math.round(log.nutrition.calories)} cal</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    P:{Math.round(log.nutrition.protein)} C:{Math.round(log.nutrition.carbs)} F:{Math.round(log.nutrition.fat)}
                                  </Text>
                                </VStack>
                              </HStack>
                            ))}
                          </VStack>

                          {/* Meal Totals */}
                          <Divider />
                          <HStack justify="space-between" fontSize="sm" color="gray.600">
                            <Text>Meal Total:</Text>
                            <Text>
                              {Math.round(mealTotals.calories)} cal, 
                              P:{Math.round(mealTotals.protein)}g, 
                              C:{Math.round(mealTotals.carbs)}g, 
                              F:{Math.round(mealTotals.fat)}g
                            </Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  )
                })}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  )
}
