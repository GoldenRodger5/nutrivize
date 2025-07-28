import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  SimpleGrid,
  Progress,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  CircularProgress,
  CircularProgressLabel,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
} from '@chakra-ui/react'
import { useAppState } from '../contexts/AppStateContext'
import { FoodItem, NutritionInfo } from '../types'
import api from '../utils/api'
import WeeklyView from '../components/ui/WeeklyView'
import NumberInputField from '../components/ui/NumberInputField'

// Define types for different food sources
interface FavoriteFood {
  id?: string
  food_id?: string
  name?: string
  food_name?: string
  serving_size?: number
  serving_unit?: string
  default_unit?: string
  nutrition?: NutritionInfo
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

type AnyFoodItem = FoodItem | FavoriteFood

// Helper functions for type-safe property access
const getFoodName = (food: AnyFoodItem): string => {
  if ('name' in food && food.name) return food.name
  if ('food_name' in food && food.food_name) return food.food_name
  return 'Unknown Food'
}

const getFoodId = (food: AnyFoodItem): string => {
  if ('id' in food && food.id) return food.id
  if ('food_id' in food && food.food_id) return food.food_id
  return 'unknown'
}

const getFoodCalories = (food: AnyFoodItem): number => {
  if ('nutrition' in food && food.nutrition?.calories) return food.nutrition.calories
  if ('calories' in food && food.calories) return food.calories
  return 0
}

const getFoodProtein = (food: AnyFoodItem): number => {
  if ('nutrition' in food && food.nutrition?.protein) return food.nutrition.protein
  if ('protein' in food && food.protein) return food.protein
  return 0
}

const getFoodCarbs = (food: AnyFoodItem): number => {
  if ('nutrition' in food && food.nutrition?.carbs) return food.nutrition.carbs
  if ('carbs' in food && food.carbs) return food.carbs
  return 0
}

const getFoodFat = (food: AnyFoodItem): number => {
  if ('nutrition' in food && food.nutrition?.fat) return food.nutrition.fat
  if ('fat' in food && food.fat) return food.fat
  return 0
}

const getFoodUnit = (food: AnyFoodItem): string => {
  if ('serving_unit' in food && food.serving_unit) return food.serving_unit
  if ('default_unit' in food && food.default_unit) return food.default_unit
  return 'serving'
}

const getFoodServingSize = (food: AnyFoodItem): number => {
  if ('serving_size' in food && food.serving_size) return food.serving_size
  return 1
}
const SearchIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.384,21.619,16.855,15.09a9.284,9.284,0,1,0-1.768,1.768l6.529,6.529a1.266,1.266,0,0,0,1.768,0A1.251,1.251,0,0,0,23.384,21.619ZM2.75,9.5a6.75,6.75,0,1,1,6.75,6.75A6.758,6.758,0,0,1,2.75,9.5Z"/>
  </Icon>
)

// Arrow Icons for navigation
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

export default function FoodLog() {
  const { activeGoal, dailySummary, refreshDailySummary, loading } = useAppState()
  
  // Helper function to get local date string
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Helper function to safely parse date string and avoid timezone issues
  const parseSelectedDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }
  
  const [selectedDate, setSelectedDate] = useState(() => {
    // Start with today's date
    return getLocalDateString()
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [selectedFood, setSelectedFood] = useState<AnyFoodItem | null>(null)
  const [searching, setSearching] = useState(false)
  const [logging, setLogging] = useState(false)
  const [popularFoods, setPopularFoods] = useState<FoodItem[]>([])
  const [recentFoods, setRecentFoods] = useState<AnyFoodItem[]>([])
  const [favoriteFoods, setFavoriteFoods] = useState<AnyFoodItem[]>([])
  const [foodIndexItems, setFoodIndexItems] = useState<FoodItem[]>([])
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'favorites' | 'index'>('search')
  const [loadingData, setLoadingData] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [logForm, setLogForm] = useState({
    meal_type: 'breakfast',
    amount: 1,
    unit: 'serving',
  })

  useEffect(() => {
    refreshDailySummary(selectedDate)
  }, [selectedDate])

  // Auto-search when query changes (debounced)
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchFoods()
      }, 300) // 300ms debounce
      
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate + 'T12:00:00') // Use noon to avoid timezone issues
    currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(getLocalDateString(currentDate))
  }

  const goToToday = () => {
    const today = new Date()
    setSelectedDate(getLocalDateString(today))
  }

  const searchFoods = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      const response = await api.get(`/foods/search?q=${encodeURIComponent(searchQuery)}&limit=20`)
      setSearchResults(response.data)
    } catch (error) {
      console.error('Error searching foods:', error)
      toast({
        title: 'Search Error',
        description: 'Failed to search foods. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setSearching(false)
  }

  const loadPopularFoods = async () => {
    try {
      const response = await api.get('/foods/search?q=chicken&limit=10') // Get some common foods
      setPopularFoods(response.data)
    } catch (error) {
      console.error('Error loading popular foods:', error)
    }
  }

  const loadRecentFoods = async () => {
    try {
      setLoadingData(true)
      const response = await api.get('/foods/recommendations/recent?limit=10')
      setRecentFoods(response.data)
    } catch (error) {
      console.error('Error loading recent foods:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadFavoriteFoods = async () => {
    try {
      setLoadingData(true)
      const response = await api.get('/favorites/?limit=20')
      setFavoriteFoods(response.data)
    } catch (error) {
      console.error('Error loading favorite foods:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const loadFoodIndex = async () => {
    try {
      setLoadingData(true)
      const response = await api.get('/foods/recommendations/popular?limit=50') // Get more comprehensive food index
      setFoodIndexItems(response.data)
    } catch (error) {
      console.error('Error loading food index:', error)
      // Try alternative endpoints in order of preference
      try {
        // Try user-specific food index first
        const userIndexResponse = await api.get('/foods/user-index')
        setFoodIndexItems(userIndexResponse.data)
      } catch (userIndexError) {
        console.error('Error loading user food index:', userIndexError)
        try {
          // Try general foods endpoint with limit
          const generalResponse = await api.get('/foods/?limit=50')
          setFoodIndexItems(generalResponse.data)
        } catch (generalError) {
          console.error('Error loading general foods:', generalError)
          try {
            // Final fallback to search endpoint
            const fallbackResponse = await api.get('/foods/search?q=&limit=50')
            setFoodIndexItems(fallbackResponse.data)
          } catch (fallbackError) {
            console.error('Error loading fallback food index:', fallbackError)
            // Set empty array to prevent UI errors
            setFoodIndexItems([])
          }
        }
      }
    } finally {
      setLoadingData(false)
    }
  }

  // Load all food data when modal opens
  const loadAllFoodData = async () => {
    await Promise.all([
      loadPopularFoods(),
      loadRecentFoods(),
      loadFavoriteFoods(),
      loadFoodIndex()
    ])
  }

  // Load food data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAllFoodData()
    }
  }, [isOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchFoods()
  }

  const selectFood = (food: AnyFoodItem) => {
    setSelectedFood(food)
    setLogForm({
      meal_type: 'breakfast',
      amount: 1,
      unit: getFoodUnit(food),
    })
    onOpen()
  }

  const logFood = async () => {
    if (!selectedFood) return

    setLogging(true)
    try {
      const logData = {
        date: selectedDate,
        meal_type: logForm.meal_type,
        food_id: getFoodId(selectedFood),
        food_name: getFoodName(selectedFood),
        amount: logForm.amount,
        unit: logForm.unit,
        nutrition: {
          calories: (getFoodCalories(selectedFood) * logForm.amount),
          protein: (getFoodProtein(selectedFood) * logForm.amount),
          carbs: (getFoodCarbs(selectedFood) * logForm.amount),
          fat: (getFoodFat(selectedFood) * logForm.amount),
          fiber: (selectedFood.nutrition?.fiber || 0) * logForm.amount,
          sugar: (selectedFood.nutrition?.sugar || 0) * logForm.amount,
          sodium: (selectedFood.nutrition?.sodium || 0) * logForm.amount,
        },
        notes: '',
      }

      await api.post('/food-logs/', logData)
      
      toast({
        title: 'Food Logged',
        description: `${selectedFood.name} has been added to your ${logForm.meal_type}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onClose()
      refreshDailySummary(selectedDate) // Refresh the daily summary
      setSearchQuery('')
      setSearchResults([])
      setSelectedFood(null)
    } catch (error) {
      console.error('Error logging food:', error)
      toast({
        title: 'Log Error',
        description: 'Failed to log food. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setLogging(false)
  }

  const deleteFood = async (logId: string) => {
    try {
      await api.delete(`/food-logs/${logId}`)
      toast({
        title: 'Food Deleted',
        description: 'Food entry has been removed.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      refreshDailySummary(selectedDate)
    } catch (error) {
      console.error('Error deleting food:', error)
      toast({
        title: 'Delete Error',
        description: 'Failed to delete food entry.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage < 70) return 'red'
    if (percentage < 90) return 'yellow'
    return 'green'
  }

  const formatMealType = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>
              Food Log 📱
            </Heading>
            <Text color="gray.600">
              Track your daily nutrition like MyFitnessPal, but with AI
            </Text>
          </Box>
          <Button colorScheme="green" onClick={onOpen}>
            Add Food
          </Button>
        </HStack>

        {/* Tabs for Daily and Weekly Views */}
        <Tabs colorScheme="green">
          <TabList>
            <Tab>Daily View</Tab>
            <Tab>Weekly View</Tab>
          </TabList>

          <TabPanels>
            {/* Daily View Panel */}
            <TabPanel px={0}>
              {loading ? (
                <Center py={20}>
                  <VStack spacing={4}>
                    <Spinner size="xl" color="green.500" />
                    <Text color="gray.600">Loading your food log...</Text>
                  </VStack>
                </Center>
              ) : (
                <VStack spacing={8} align="stretch">
                  {/* Date Navigation */}
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Previous day"
                        icon={<ChevronLeftIcon />}
                        onClick={() => navigateDate('prev')}
                        variant="outline"
                        size="sm"
                      />
                      <Text fontWeight="medium" minW="200px" textAlign="center">
                        {parseSelectedDate(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                      <IconButton
                        aria-label="Next day"
                        icon={<ChevronRightIcon />}
                        onClick={() => navigateDate('next')}
                        variant="outline"
                        size="sm"
                      />
                    </HStack>
                    
                    <HStack spacing={2}>
                      {selectedDate !== getLocalDateString() && (
                        <Button size="sm" onClick={goToToday} colorScheme="blue">
                          Today
                        </Button>
                      )}
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        size="sm"
                        w="auto"
                      />
                    </HStack>
                  </HStack>

                  {/* Daily Summary & Goals */}
                  {dailySummary && dailySummary.total_nutrition && activeGoal && activeGoal.nutrition_targets && (
                    <Card bg="blue.50" borderColor="blue.200" borderWidth={2}>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Box>
                              <Heading size="md">Daily Summary</Heading>
                              <Text color="gray.600" fontSize="sm">
                                {parseSelectedDate(selectedDate).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </Text>
                            </Box>
                            <HStack spacing={6}>
                              <CircularProgress 
                                value={activeGoal.nutrition_targets.calories > 0 && dailySummary.total_nutrition ? (dailySummary.total_nutrition.calories / activeGoal.nutrition_targets.calories) * 100 : 0} 
                                size="80px" 
                                color={activeGoal.nutrition_targets.calories > 0 && dailySummary.total_nutrition ? getProgressColor(dailySummary.total_nutrition.calories, activeGoal.nutrition_targets.calories) : 'gray'}
                              >
                                <CircularProgressLabel fontSize="sm">
                                  {activeGoal.nutrition_targets.calories > 0 && dailySummary.total_nutrition ? Math.round((dailySummary.total_nutrition.calories / activeGoal.nutrition_targets.calories) * 100) : 0}%
                                </CircularProgressLabel>
                              </CircularProgress>
                            </HStack>
                          </HStack>

                          {/* Macros Overview */}
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                            <Stat size="sm">
                              <StatLabel>Calories</StatLabel>
                              <StatNumber>{dailySummary.total_nutrition ? Math.round(dailySummary.total_nutrition.calories) : 0}</StatNumber>
                              <StatHelpText>
                                {activeGoal?.nutrition_targets?.calories && dailySummary.total_nutrition ? Math.round(activeGoal.nutrition_targets.calories - dailySummary.total_nutrition.calories) : 0} remaining
                              </StatHelpText>
                              <Progress 
                                value={activeGoal?.nutrition_targets?.calories && dailySummary.total_nutrition ? (dailySummary.total_nutrition.calories / activeGoal.nutrition_targets.calories) * 100 : 0} 
                                colorScheme={activeGoal?.nutrition_targets?.calories && dailySummary.total_nutrition ? getProgressColor(dailySummary.total_nutrition.calories, activeGoal.nutrition_targets.calories) : 'gray'}
                                size="sm"
                              />
                            </Stat>

                            <Stat size="sm">
                              <StatLabel>Protein</StatLabel>
                              <StatNumber>{dailySummary.total_nutrition ? Math.round(dailySummary.total_nutrition.protein) : 0}g</StatNumber>
                              <StatHelpText>
                                {activeGoal?.nutrition_targets?.protein && dailySummary.total_nutrition ? Math.round(activeGoal.nutrition_targets.protein - dailySummary.total_nutrition.protein) : 0} remaining
                              </StatHelpText>
                              <Progress 
                                value={activeGoal?.nutrition_targets?.protein && dailySummary.total_nutrition ? (dailySummary.total_nutrition.protein / activeGoal.nutrition_targets.protein) * 100 : 0} 
                                colorScheme={activeGoal?.nutrition_targets?.protein && dailySummary.total_nutrition ? getProgressColor(dailySummary.total_nutrition.protein, activeGoal.nutrition_targets.protein) : 'gray'}
                                size="sm"
                              />
                            </Stat>

                            <Stat size="sm">
                              <StatLabel>Carbs</StatLabel>
                              <StatNumber>{dailySummary.total_nutrition ? Math.round(dailySummary.total_nutrition.carbs) : 0}g</StatNumber>
                              <StatHelpText>
                                {activeGoal?.nutrition_targets?.carbs && dailySummary.total_nutrition ? Math.round(activeGoal.nutrition_targets.carbs - dailySummary.total_nutrition.carbs) : 0} remaining
                              </StatHelpText>
                              <Progress 
                                value={activeGoal?.nutrition_targets?.carbs && dailySummary.total_nutrition ? (dailySummary.total_nutrition.carbs / activeGoal.nutrition_targets.carbs) * 100 : 0} 
                                colorScheme={activeGoal?.nutrition_targets?.carbs && dailySummary.total_nutrition ? getProgressColor(dailySummary.total_nutrition.carbs, activeGoal.nutrition_targets.carbs) : 'gray'}
                                size="sm"
                              />
                            </Stat>

                            <Stat size="sm">
                              <StatLabel>Fat</StatLabel>
                              <StatNumber>{dailySummary.total_nutrition ? Math.round(dailySummary.total_nutrition.fat) : 0}g</StatNumber>
                              <StatHelpText>
                                {activeGoal?.nutrition_targets?.fat && dailySummary.total_nutrition ? Math.round(activeGoal.nutrition_targets.fat - dailySummary.total_nutrition.fat) : 0} remaining
                              </StatHelpText>
                              <Progress 
                                value={activeGoal?.nutrition_targets?.fat && dailySummary.total_nutrition ? (dailySummary.total_nutrition.fat / activeGoal.nutrition_targets.fat) * 100 : 0} 
                                colorScheme={activeGoal?.nutrition_targets?.fat && dailySummary.total_nutrition ? getProgressColor(dailySummary.total_nutrition.fat, activeGoal.nutrition_targets.fat) : 'gray'}
                                size="sm"
                              />
                            </Stat>
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* No Active Goal Alert */}
                  {!activeGoal && (
                    <Alert status="warning">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>No Active Goal</AlertTitle>
                        <AlertDescription>
                          Set a nutrition goal to see your daily targets and progress.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}

                  {/* Meals Breakdown */}
                  {dailySummary && dailySummary.meals && dailySummary.meals.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                        const mealLogs = dailySummary.meals.filter(log => log.meal_type === mealType)
                        if (mealLogs.length === 0) return null

                        const mealTotals = mealLogs.reduce((totals, log) => ({
                          calories: totals.calories + (log.nutrition?.calories || 0),
                          protein: totals.protein + (log.nutrition?.protein || 0),
                          carbs: totals.carbs + (log.nutrition?.carbs || 0),
                          fat: totals.fat + (log.nutrition?.fat || 0),
                        }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

                        return (
                          <Card key={mealType} variant="outline">
                            <CardBody>
                              <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                  <Heading size="md">{formatMealType(mealType)}</Heading>
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
                                        <Text fontWeight="bold">{Math.round(log.nutrition?.calories || 0)} cal</Text>
                                        <Text fontSize="xs" color="gray.500">
                                          P:{Math.round(log.nutrition?.protein || 0)} C:{Math.round(log.nutrition?.carbs || 0)} F:{Math.round(log.nutrition?.fat || 0)}
                                        </Text>
                                      </VStack>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        colorScheme="red"
                                        onClick={() => deleteFood(log.id)}
                                      >
                                        ✕
                                      </Button>
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
                  ) : (
                    <Card>
                      <CardBody textAlign="center" py={12}>
                        <Text fontSize="lg" color="gray.500">
                          No foods logged for {parseSelectedDate(selectedDate).toLocaleDateString()}
                        </Text>
                        <Text fontSize="sm" color="gray.400" mt={2}>
                          Start tracking your nutrition by adding foods to your meals
                        </Text>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              )}
            </TabPanel>

            {/* Weekly View Panel */}
            <TabPanel px={0}>
              <WeeklyView />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Enhanced Add Food Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>Add Food to Log</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            <VStack spacing={4} align="stretch">
              {/* Enhanced Food Selection Interface */}
              <Tabs variant="soft-rounded" colorScheme="green" index={activeTab === 'search' ? 0 : activeTab === 'recent' ? 1 : activeTab === 'favorites' ? 2 : 3} onChange={(index) => {
                const tabs = ['search', 'recent', 'favorites', 'index'] as const
                setActiveTab(tabs[index])
              }}>
                <TabList mb={4}>
                  <Tab>🔍 Search</Tab>
                  <Tab>🕒 Recent</Tab>
                  <Tab>⭐ Favorites</Tab>
                  <Tab>📋 Food Index</Tab>
                </TabList>

                <TabPanels>
                  {/* Search Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel>Search for Food</FormLabel>
                        <form onSubmit={handleSearch}>
                          <InputGroup>
                            <InputLeftElement>
                              <SearchIcon />
                            </InputLeftElement>
                            <Input
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search foods (e.g., chicken breast, apple)..."
                            />
                          </InputGroup>
                        </form>
                      </FormControl>

                      {searching && (
                        <Center py={8}>
                          <Spinner size="lg" color="green.500" />
                        </Center>
                      )}

                      {!searching && searchResults.length > 0 && (
                        <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                          <Text fontSize="sm" color="gray.600" mb={2}>
                            Search Results ({searchResults.length})
                          </Text>
                          {searchResults.map((food) => (
                            <Card 
                              key={food.id} 
                              variant="outline" 
                              cursor="pointer" 
                              _hover={{ shadow: 'md', borderColor: 'green.300' }}
                              onClick={() => selectFood(food)}
                            >
                              <CardBody p={3}>
                                <HStack justify="space-between">
                                  <Box flex={1}>
                                    <Text fontWeight="medium">{food.name}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                      {food.serving_size} {food.serving_unit} • {Math.round(food.nutrition.calories)} calories
                                    </Text>
                                  </Box>
                                  <Button size="sm" colorScheme="green">
                                    Select
                                  </Button>
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      )}

                      {!searching && !searchQuery.trim() && popularFoods.length > 0 && (
                        <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                          <Text fontSize="sm" color="gray.600" mb={2}>
                            Popular Foods
                          </Text>
                          {popularFoods.map((food) => (
                            <Card 
                              key={food.id} 
                              variant="outline" 
                              cursor="pointer" 
                              _hover={{ shadow: 'md', borderColor: 'green.300' }}
                              onClick={() => selectFood(food)}
                            >
                              <CardBody p={3}>
                                <HStack justify="space-between">
                                  <Box flex={1}>
                                    <Text fontWeight="medium">{food.name}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                      {food.serving_size} {food.serving_unit} • {Math.round(food.nutrition.calories)} calories
                                    </Text>
                                  </Box>
                                  <Button size="sm" colorScheme="green">
                                    Select
                                  </Button>
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Recent Foods Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Recently Logged Foods
                        </Text>
                        <Button size="xs" variant="outline" onClick={loadRecentFoods}>
                          Refresh
                        </Button>
                      </HStack>
                      
                      {loadingData ? (
                        <Center py={8}>
                          <Spinner size="lg" color="green.500" />
                        </Center>
                      ) : recentFoods.length > 0 ? (
                        <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                          {recentFoods.map((food) => (
                            <Card 
                              key={getFoodId(food)} 
                              variant="outline" 
                              cursor="pointer" 
                              _hover={{ shadow: 'md', borderColor: 'green.300' }}
                              onClick={() => selectFood(food)}
                            >
                              <CardBody p={3}>
                                <HStack justify="space-between">
                                  <Box flex={1}>
                                    <HStack>
                                      <Text fontWeight="medium">{getFoodName(food)}</Text>
                                      <Badge colorScheme="blue" size="sm">Recent</Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600">
                                      {getFoodServingSize(food)} {getFoodUnit(food)} • {Math.round(getFoodCalories(food))} calories
                                    </Text>
                                  </Box>
                                  <Button size="sm" colorScheme="green">
                                    Select
                                  </Button>
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      ) : (
                        <Center py={8}>
                          <VStack>
                            <Text color="gray.500">No recent foods found</Text>
                            <Text fontSize="sm" color="gray.400">
                              Start logging foods to see them here
                            </Text>
                          </VStack>
                        </Center>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Favorite Foods Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Your Favorite Foods
                        </Text>
                        <Button size="xs" variant="outline" onClick={loadFavoriteFoods}>
                          Refresh
                        </Button>
                      </HStack>
                      
                      {loadingData ? (
                        <Center py={8}>
                          <Spinner size="lg" color="green.500" />
                        </Center>
                      ) : favoriteFoods.length > 0 ? (
                        <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                          {favoriteFoods.map((food) => (
                            <Card 
                              key={getFoodId(food)} 
                              variant="outline" 
                              cursor="pointer" 
                              _hover={{ shadow: 'md', borderColor: 'green.300' }}
                              onClick={() => selectFood(food)}
                            >
                              <CardBody p={3}>
                                <HStack justify="space-between">
                                  <Box flex={1}>
                                    <HStack>
                                      <Text fontWeight="medium">{getFoodName(food)}</Text>
                                      <Badge colorScheme="yellow" size="sm">⭐ Favorite</Badge>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.600">
                                      {getFoodServingSize(food)} {getFoodUnit(food)} • {Math.round(getFoodCalories(food))} calories
                                    </Text>
                                  </Box>
                                  <Button size="sm" colorScheme="green">
                                    Select
                                  </Button>
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      ) : (
                        <Center py={8}>
                          <VStack>
                            <Text color="gray.500">No favorite foods yet</Text>
                            <Text fontSize="sm" color="gray.400">
                              Add foods to favorites for quick access
                            </Text>
                          </VStack>
                        </Center>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Food Index Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Food Database ({foodIndexItems.length} items)
                        </Text>
                        <Button size="xs" variant="outline" onClick={loadFoodIndex}>
                          Refresh
                        </Button>
                      </HStack>
                      
                      {loadingData ? (
                        <Center py={8}>
                          <Spinner size="lg" color="green.500" />
                        </Center>
                      ) : foodIndexItems.length > 0 ? (
                        <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                          {foodIndexItems.map((food) => (
                            <Card 
                              key={food.id} 
                              variant="outline" 
                              cursor="pointer" 
                              _hover={{ shadow: 'md', borderColor: 'green.300' }}
                              onClick={() => selectFood(food)}
                            >
                              <CardBody p={3}>
                                <HStack justify="space-between">
                                  <Box flex={1}>
                                    <Text fontWeight="medium">{food.name}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                      {food.serving_size} {food.serving_unit} • {Math.round(food.nutrition.calories)} calories
                                    </Text>
                                    <HStack spacing={2} mt={1}>
                                      <Text fontSize="xs" color="gray.500">
                                        P: {Math.round(food.nutrition.protein)}g
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        C: {Math.round(food.nutrition.carbs)}g
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        F: {Math.round(food.nutrition.fat)}g
                                      </Text>
                                    </HStack>
                                  </Box>
                                  <Button size="sm" colorScheme="green">
                                    Select
                                  </Button>
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      ) : (
                        <Center py={8}>
                          <VStack>
                            <Text color="gray.500">Food database not available</Text>
                            <Text fontSize="sm" color="gray.400">
                              Try refreshing or check your connection
                            </Text>
                          </VStack>
                        </Center>
                      )}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              {/* Selected Food Form */}
              {selectedFood && (
                <>
                  <Divider />
                  <Card bg="green.50" borderColor="green.200" w="full">
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Text fontWeight="bold" fontSize="lg">{getFoodName(selectedFood)}</Text>
                          <Text fontSize="sm" color="gray.600">
                            Per {getFoodServingSize(selectedFood)} {getFoodUnit(selectedFood)}: {Math.round(getFoodCalories(selectedFood))} calories
                          </Text>
                        </Box>

                        <SimpleGrid columns={2} spacing={4}>
                          <FormControl>
                            <FormLabel>Meal</FormLabel>
                            <Select
                              value={logForm.meal_type}
                              onChange={(e) => setLogForm({...logForm, meal_type: e.target.value})}
                            >
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Amount</FormLabel>
                            <NumberInputField
                              value={logForm.amount}
                              onChange={(value) => setLogForm({...logForm, amount: value})}
                              min={0.1}
                              step={0.1}
                              allowDecimal={true}
                              precision={2}
                            />
                          </FormControl>
                        </SimpleGrid>

                        {/* Nutrition Preview */}
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={2}>Nutrition (for {logForm.amount} {logForm.unit}):</Text>
                          <SimpleGrid columns={4} spacing={2} fontSize="sm">
                            <Text>Calories: {Math.round(getFoodCalories(selectedFood) * logForm.amount)}</Text>
                            <Text>Protein: {Math.round(getFoodProtein(selectedFood) * logForm.amount)}g</Text>
                            <Text>Carbs: {Math.round(getFoodCarbs(selectedFood) * logForm.amount)}g</Text>
                            <Text>Fat: {Math.round(getFoodFat(selectedFood) * logForm.amount)}g</Text>
                          </SimpleGrid>
                        </Box>

                        <Button
                          colorScheme="green"
                          onClick={logFood}
                          isLoading={logging}
                          loadingText="Adding to log..."
                          w="full"
                        >
                          Add to {formatMealType(logForm.meal_type)}
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  )
}
