import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Select,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  useToast,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Badge,
  Spinner
} from '@chakra-ui/react'
import api from '../utils/api'
import { FoodItem } from '../types'
import QuickLogging from '../components/QuickLogging'
import FoodRecommendations from '../components/FoodRecommendations'

export default function FoodLog() {
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [userFoods, setUserFoods] = useState<FoodItem[]>([])
  const [popularFoods, setPopularFoods] = useState<FoodItem[]>([])
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [amount, setAmount] = useState(1)
  const [selectedUnit, setSelectedUnit] = useState('serving')
  const [mealType, setMealType] = useState('breakfast')
  const [loading, setLoading] = useState(false)
  const [foodIndexLoading, setFoodIndexLoading] = useState(false)
  const toast = useToast()

  // Fetch user foods from the food index, popular foods, and recent foods on component mount
  useEffect(() => {
    fetchUserFoods();
    fetchPopularFoods();
    fetchRecentFoods();
  }, []);

  // Search for foods when the search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchFoods()
    } else {
      setFoods([])
    }
  }, [searchQuery])
  
  // Fetch user's personal food index
  const fetchUserFoods = async () => {
    setFoodIndexLoading(true);
    try {
      const response = await api.get('/foods/user-foods');
      setUserFoods(response.data);
    } catch (error) {
      console.error('Error fetching user foods:', error);
    } finally {
      setFoodIndexLoading(false);
    }
  }
  
  // Fetch popular foods based on global usage data
  const fetchPopularFoods = async () => {
    try {
      const response = await api.get('/foods/popular');
      setPopularFoods(response.data);
    } catch (error) {
      console.error('Error fetching popular foods:', error);
      setPopularFoods([]);
    }
  }
  
  // Fetch user's recently logged foods
  const fetchRecentFoods = async () => {
    try {
      const response = await api.get('/food-logs/recent');
      setRecentFoods(response.data);
    } catch (error) {
      console.error('Error fetching recent foods:', error);
      setRecentFoods([]);
    }
  }

  const searchFoods = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/foods/search?q=${encodeURIComponent(searchQuery)}`)
      setFoods(response.data)
    } catch (error) {
      console.error('Error searching foods:', error)
      toast({
        title: 'Error',
        description: 'Failed to search foods',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }

  // Calculate multiplier based on selected unit vs food's base serving
  const getUnitMultiplier = (fromUnit: string, toUnit: string, amount: number, servingSize: number) => {
    // Unit conversion table (to grams)
    const unitToGrams: Record<string, number> = {
      'gram': 1,
      'g': 1,
      'ounce': 28.35,
      'oz': 28.35,
      'pound': 453.592,
      'lb': 453.592,
      'cup': 240, // Approximate for most foods
      'tablespoon': 15,
      'tbsp': 15,
      'teaspoon': 5,
      'tsp': 5,
      'serving': servingSize // Use the food's serving size
    }

    // Handle different serving units
    const fromGrams = unitToGrams[fromUnit] || servingSize
    const toGrams = unitToGrams[toUnit] || 100 // Most nutrition data is per 100g
    
    return (amount * fromGrams) / toGrams
  }

  const logFood = async () => {
    if (!selectedFood) return

    setLoading(true)
    try {
      // Calculate multiplier based on selected unit
      const multiplier = getUnitMultiplier(selectedUnit, 'gram', amount, selectedFood.serving_size)
      
      const nutrition = {
        calories: (selectedFood.nutrition.calories * multiplier) / 100,
        protein: (selectedFood.nutrition.protein * multiplier) / 100,
        carbs: (selectedFood.nutrition.carbs * multiplier) / 100,
        fat: (selectedFood.nutrition.fat * multiplier) / 100,
        fiber: ((selectedFood.nutrition.fiber || 0) * multiplier) / 100,
      }

      // Determine the actual amount and unit to log
      const actualAmount = selectedUnit === 'serving' ? amount : amount
      const actualUnit = selectedUnit === 'serving' ? selectedFood.serving_unit : selectedUnit

      await api.post('/food-logs/', {
        date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        food_id: selectedFood.id,
        food_name: selectedFood.name,
        amount: actualAmount,
        unit: actualUnit,
        nutrition,
      })

      toast({
        title: 'Success',
        description: 'Food logged successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      // Reset form
      setSelectedFood(null)
      setAmount(1)
      setSelectedUnit('serving')
      setSearchQuery('')
    } catch (error) {
      console.error('Error logging food:', error)
      toast({
        title: 'Error',
        description: 'Failed to log food',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setLoading(false)
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Food & Health Logging</Heading>

        {/* Top Section: Quick Logging and Food Recommendations */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Quick Logging for Water and Weight */}
          <QuickLogging size="md" />
          
          {/* Food Recommendations */}
          <FoodRecommendations onFoodSelect={(food) => {
            setSearchQuery(food.food_name)
            // Auto-select the food if it exists in search results
            const matchingFood = foods.find(f => f.name.toLowerCase() === food.food_name.toLowerCase())
            if (matchingFood) {
              setSelectedFood(matchingFood)
            }
          }} />
        </SimpleGrid>

        {/* Food Logging Section */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="bold">🍎 Log Food</Text>
              
              <FormControl>
                <FormLabel>Search for food</FormLabel>
                <Input
                  placeholder="Search for food items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </FormControl>

              {/* User Foods Section - From Food Index */}
              <Box mt={4}>
                <Text fontWeight="medium" mb={2}>
                  Your Food Index:
                </Text>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} maxH="150px" overflowY="auto">
                  {foodIndexLoading ? (
                    <Box p={4} textAlign="center" w="full">
                      <Spinner size="sm" />
                      <Text fontSize="sm" mt={2}>Loading your food index...</Text>
                    </Box>
                  ) : userFoods.length > 0 ? (
                    userFoods.map((userFood) => (
                      <Card
                        key={userFood.id}
                        variant={selectedFood?.id === userFood.id ? 'filled' : 'outline'}
                        cursor="pointer"
                        onClick={() => setSelectedFood(userFood)}
                        _hover={{ bg: 'gray.50', transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                        size="sm"
                      >
                        <CardBody py={2}>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{userFood.name}</Text>
                            <HStack fontSize="xs">
                              <Text color="green.500" fontWeight="bold">{userFood.nutrition.calories}</Text>
                              <Text color="gray.500">cal</Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))
                  ) : (
                    <Box p={4} textAlign="center" w="full" gridColumn="span 4">
                      <Text fontSize="sm" color="gray.500">No custom foods found in your food index.</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </Box>

              {/* Popular Foods Section */}
              <Box mt={4}>
                <Text fontWeight="medium" mb={2}>
                  Popular Foods:
                </Text>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} maxH="120px" overflowY="auto">
                  {popularFoods.length > 0 ? (
                    popularFoods.map((popularFood) => (
                      <Card
                        key={popularFood.id}
                        variant={selectedFood?.id === popularFood.id ? 'filled' : 'outline'}
                        cursor="pointer"
                        onClick={() => setSelectedFood(popularFood)}
                        _hover={{ bg: 'gray.50', transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                        size="sm"
                      >
                        <CardBody py={2}>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{popularFood.name}</Text>
                            <HStack fontSize="xs">
                              <Text color="green.500" fontWeight="bold">{popularFood.nutrition.calories}</Text>
                              <Text color="gray.500">cal</Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))
                  ) : (
                    <Box p={4} textAlign="center" w="full" gridColumn="span 4">
                      <Text fontSize="sm" color="gray.500">Unable to load popular foods.</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </Box>

              {/* Recent Foods Section */}
              <Box mt={4}>
                <Text fontWeight="medium" mb={2}>
                  Recent Foods:
                </Text>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2} maxH="120px" overflowY="auto">
                  {recentFoods.length > 0 ? (
                    recentFoods.map((recentFood) => (
                      <Card
                        key={recentFood.id}
                        variant={selectedFood?.id === recentFood.id ? 'filled' : 'outline'}
                        cursor="pointer"
                        onClick={() => setSelectedFood(recentFood)}
                        _hover={{ bg: 'gray.50', transform: 'translateY(-2px)' }}
                        transition="all 0.2s"
                        size="sm"
                      >
                        <CardBody py={2}>
                          <VStack align="start" spacing={0}>
                            <HStack justify="space-between" w="full">
                              <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{recentFood.name}</Text>
                              <Badge colorScheme="purple" size="sm" variant="subtle">Recent</Badge>
                            </HStack>
                            <HStack fontSize="xs">
                              <Text color="green.500" fontWeight="bold">{recentFood.nutrition.calories}</Text>
                              <Text color="gray.500">cal</Text>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))
                  ) : (
                    <Box p={4} textAlign="center" w="full" gridColumn="span 3">
                      <Text fontSize="sm" color="gray.500">No recently logged foods found.</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </Box>

              {/* Search Results - With Virtualized Scrolling for Better Performance */}
              <Box mt={4}>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="medium">
                    {searchQuery ? `Search Results for "${searchQuery}"` : "All Foods"}
                  </Text>
                  {foods.length > 0 && (
                    <Badge colorScheme="blue">{foods.length} items</Badge>
                  )}
                </HStack>
                
                <Box 
                  maxH="300px" 
                  overflowY="auto" 
                  borderWidth="1px" 
                  borderRadius="md" 
                  p={2}
                  className="foods-scrollable-container"
                >
                  {loading ? (
                    <Box p={4} textAlign="center" w="full">
                      <Spinner size="sm" />
                      <Text fontSize="sm" mt={2}>Searching foods...</Text>
                    </Box>
                  ) : foods.length > 0 ? (
                    <SimpleGrid columns={1} spacing={2}>
                      {foods.map((food) => (
                        <Card
                          key={food.id}
                          variant={selectedFood?.id === food.id ? 'filled' : 'outline'}
                          cursor="pointer"
                          onClick={() => setSelectedFood(food)}
                          _hover={{ bg: 'gray.50', transform: 'translateY(-1px)' }}
                          transition="all 0.2s"
                          data-testid={`food-item-${food.id}`}
                        >
                          <CardBody py={3}>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{food.name}</Text>
                                <HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    {food.serving_size} {food.serving_unit}
                                  </Text>
                                  <Badge colorScheme={food.source === 'User' ? 'purple' : 'blue'} size="sm">
                                    {food.source}
                                  </Badge>
                                </HStack>
                              </VStack>
                              <Text fontWeight="medium">
                                {Math.round(food.nutrition.calories)} cal
                              </Text>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : searchQuery ? (
                    <Box p={4} textAlign="center">
                      <Text>No results found for "{searchQuery}"</Text>
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Try a different search term or browse your food index above
                      </Text>
                    </Box>
                  ) : (
                    <Box p={4} textAlign="center">
                      <Text fontSize="sm" color="gray.500">
                        Type in the search box to find foods, or select from your food index above
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>

              {selectedFood && (
                <Card variant="filled">
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Text fontWeight="medium">Selected: {selectedFood.name}</Text>
                      
                      <HStack spacing={4}>
                        <FormControl>
                          <FormLabel>Meal Type</FormLabel>
                          <Select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Unit</FormLabel>
                          <Select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                            <option value="serving">Serving ({selectedFood.serving_size} {selectedFood.serving_unit})</option>
                            <option value="gram">Gram (g)</option>
                            <option value="ounce">Ounce (oz)</option>
                            <option value="pound">Pound (lb)</option>
                            <option value="cup">Cup</option>
                            <option value="tablespoon">Tablespoon (tbsp)</option>
                            <option value="teaspoon">Teaspoon (tsp)</option>
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Amount</FormLabel>
                          <NumberInput
                            value={amount}
                            onChange={(_, value) => setAmount(value || 1)}
                            min={0.1}
                            step={0.1}
                            precision={1}
                          >
                            <NumberInputField />
                          </NumberInput>
                        </FormControl>
                      </HStack>

                      <Box>
                        <Text fontWeight="medium" mb={2}>
                          Nutrition (for {amount} {selectedUnit === 'serving' ? selectedFood.serving_unit : selectedUnit}):
                        </Text>
                        <SimpleGrid columns={4} spacing={4}>
                          <Box textAlign="center">
                            <Text fontSize="lg" fontWeight="bold">
                              {Math.round((selectedFood.nutrition.calories * getUnitMultiplier(selectedUnit, 'gram', amount, selectedFood.serving_size)) / 100)}
                            </Text>
                            <Text fontSize="sm" color="gray.600">Calories</Text>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="lg" fontWeight="bold">
                              {Math.round((selectedFood.nutrition.protein * getUnitMultiplier(selectedUnit, 'gram', amount, selectedFood.serving_size)) / 100)}g
                            </Text>
                            <Text fontSize="sm" color="gray.600">Protein</Text>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="lg" fontWeight="bold">
                              {Math.round((selectedFood.nutrition.carbs * getUnitMultiplier(selectedUnit, 'gram', amount, selectedFood.serving_size)) / 100)}g
                            </Text>
                            <Text fontSize="sm" color="gray.600">Carbs</Text>
                          </Box>
                          <Box textAlign="center">
                            <Text fontSize="lg" fontWeight="bold">
                              {Math.round((selectedFood.nutrition.fat * getUnitMultiplier(selectedUnit, 'gram', amount, selectedFood.serving_size)) / 100)}g
                            </Text>
                            <Text fontSize="sm" color="gray.600">Fat</Text>
                          </Box>
                        </SimpleGrid>
                      </Box>

                      <Button
                        colorScheme="green"
                        onClick={logFood}
                        isLoading={loading}
                        size="lg"
                      >
                        Log Food
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}
