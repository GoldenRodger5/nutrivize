import { useState, useEffect } from 'react'
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
  Input,
  Button,
  Select,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  useToast,
  SimpleGrid,
  Badge,
  Spinner,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Divider
} from '@chakra-ui/react'
import api from '../utils/api'
import { FoodItem } from '../types'
import { SERVING_UNITS } from '../constants/servingUnits'
import NumberInputField from './NumberInputField'

interface FoodLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function FoodLogModal({ isOpen, onClose, onSuccess }: FoodLogModalProps) {
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
  const [searchLoading, setSearchLoading] = useState(false)
  const [popularLoading, setPopularLoading] = useState(false)
  const [recentLoading, setRecentLoading] = useState(false)
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserFoods()
      fetchPopularFoods()
      fetchRecentFoods()
    }
  }, [isOpen])

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
    setFoodIndexLoading(true)
    try {
      const response = await api.get('/foods/user-foods/')
      setUserFoods(response.data)
    } catch (error) {
      console.error('Error fetching user foods:', error)
      setUserFoods([])
    } finally {
      setFoodIndexLoading(false)
    }
  }
  
  // Fetch popular foods based on global usage data
  const fetchPopularFoods = async () => {
    setPopularLoading(true)
    try {
      const response = await api.get('/foods/popular/')
      setPopularFoods(response.data)
    } catch (error) {
      console.error('Error fetching popular foods:', error)
      setPopularFoods([])
    } finally {
      setPopularLoading(false)
    }
  }
  
  // Fetch user's recently logged foods
  const fetchRecentFoods = async () => {
    setRecentLoading(true)
    try {
      const response = await api.get('/food-logs/recent/')
      setRecentFoods(response.data)
    } catch (error) {
      console.error('Error fetching recent foods:', error)
      setRecentFoods([])
    } finally {
      setRecentLoading(false)
    }
  }

  const searchFoods = async () => {
    setSearchLoading(true)
    try {
      const response = await api.get(`/foods/search/?q=${encodeURIComponent(searchQuery)}`)
      setFoods(response.data)
    } catch (error) {
      console.error('Error searching foods:', error)
      setFoods([])
      toast({
        title: 'Error searching foods',
        description: 'Failed to search for foods. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const logFood = async () => {
    if (!selectedFood) {
      toast({
        title: 'No food selected',
        description: 'Please select a food item to log.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      await api.post('/food-logs/', {
        food_id: selectedFood.id,
        food_name: selectedFood.name,
        brand: selectedFood.brand || '',
        amount: amount,
        unit: selectedUnit,
        meal_type: mealType,
        nutrition: selectedFood.nutrition
      })
      
      toast({
        title: 'Food logged successfully!',
        description: `${amount} ${selectedUnit} of ${selectedFood.name} added to ${mealType}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      // Reset form
      setSelectedFood(null)
      setAmount(1)
      setSelectedUnit('serving')
      setSearchQuery('')
      setFoods([])
      
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error logging food:', error)
      toast({
        title: 'Error logging food',
        description: error.response?.data?.detail || 'Failed to log food. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const FoodCard = ({ food, onClick }: { food: FoodItem, onClick: () => void }) => (
    <Card
      variant={selectedFood?.id === food.id ? 'filled' : 'outline'}
      cursor="pointer"
      onClick={onClick}
      _hover={{ bg: useColorModeValue('gray.50', 'gray.700'), transform: 'translateY(-1px)' }}
      transition="all 0.2s"
      size="sm"
      bg={selectedFood?.id === food.id ? useColorModeValue('blue.50', 'blue.900') : cardBg}
      borderColor={selectedFood?.id === food.id ? 'blue.300' : borderColor}
    >
      <CardBody py={2} px={3}>
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium" fontSize="sm" noOfLines={2} lineHeight="1.2">
            {food.name}
          </Text>
          {food.brand && (
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {food.brand}
            </Text>
          )}
          <HStack fontSize="xs" justify="space-between" w="full">
            <HStack>
              <Text color="green.500" fontWeight="bold">{food.nutrition?.calories || 0}</Text>
              <Text color="gray.500">cal</Text>
            </HStack>
            {food.nutrition?.protein && (
              <HStack>
                <Text color="blue.500" fontWeight="bold">{food.nutrition.protein}g</Text>
                <Text color="gray.500">protein</Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" zIndex={1200} />
      <ModalContent maxH="90vh" bg={cardBg} zIndex={1300}>
        <ModalHeader>
          <HStack>
            <Text fontSize="xl">🍎 Log Food</Text>
            {selectedFood && (
              <Badge colorScheme="green" variant="solid">
                {selectedFood.name} selected
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* Search Section */}
            <FormControl>
              <FormLabel>Search for food</FormLabel>
              <Input
                placeholder="Search for food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="lg"
              />
              {searchLoading && (
                <HStack mt={2}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="gray.500">Searching...</Text>
                </HStack>
              )}
            </FormControl>

            {/* Search Results */}
            {searchQuery.trim() && foods.length > 0 && (
              <Box>
                <Text fontWeight="medium" mb={3}>Search Results:</Text>
                <Box maxH="200px" overflowY="auto">
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                    {foods.slice(0, 12).map((food) => (
                      <FoodCard
                        key={food.id}
                        food={food}
                        onClick={() => setSelectedFood(food)}
                      />
                    ))}
                  </SimpleGrid>
                </Box>
              </Box>
            )}

            <Divider />

            {/* Food Categories */}
            <Tabs variant="soft-rounded" colorScheme="blue">
              <TabList>
                <Tab fontSize="sm">Recent Foods</Tab>
                <Tab fontSize="sm">Popular Foods</Tab>
                <Tab fontSize="sm">My Foods</Tab>
              </TabList>

              <TabPanels>
                {/* Recent Foods */}
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="medium">Recently Logged Foods:</Text>
                    {recentLoading ? (
                      <HStack justify="center" py={8}>
                        <Spinner size="md" />
                        <Text>Loading recent foods...</Text>
                      </HStack>
                    ) : recentFoods.length > 0 ? (
                      <Box maxH="300px" overflowY="auto">
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                          {recentFoods.map((food) => (
                            <FoodCard
                              key={food.id}
                              food={food}
                              onClick={() => setSelectedFood(food)}
                            />
                          ))}
                        </SimpleGrid>
                      </Box>
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Text fontSize="sm" color="gray.500">No recent foods found.</Text>
                        <Text fontSize="xs" color="gray.400">Start logging foods to see them here!</Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Popular Foods */}
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="medium">Popular Foods:</Text>
                    {popularLoading ? (
                      <HStack justify="center" py={8}>
                        <Spinner size="md" />
                        <Text>Loading popular foods...</Text>
                      </HStack>
                    ) : popularFoods.length > 0 ? (
                      <Box maxH="300px" overflowY="auto">
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                          {popularFoods.map((food) => (
                            <FoodCard
                              key={food.id}
                              food={food}
                              onClick={() => setSelectedFood(food)}
                            />
                          ))}
                        </SimpleGrid>
                      </Box>
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Text fontSize="sm" color="gray.500">No popular foods available.</Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* User Foods */}
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="medium">Your Personal Food Index:</Text>
                    {foodIndexLoading ? (
                      <HStack justify="center" py={8}>
                        <Spinner size="md" />
                        <Text>Loading your foods...</Text>
                      </HStack>
                    ) : userFoods.length > 0 ? (
                      <Box maxH="300px" overflowY="auto">
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                          {userFoods.map((food) => (
                            <FoodCard
                              key={food.id}
                              food={food}
                              onClick={() => setSelectedFood(food)}
                            />
                          ))}
                        </SimpleGrid>
                      </Box>
                    ) : (
                      <Box textAlign="center" py={8}>
                        <Text fontSize="sm" color="gray.500">No custom foods in your food index.</Text>
                        <Text fontSize="xs" color="gray.400">Add custom foods to build your personal index!</Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Food Details and Logging Form */}
            {selectedFood && (
              <Card bg={useColorModeValue('blue.50', 'blue.900')} borderColor="blue.300">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="lg" fontWeight="bold">Log: {selectedFood.name}</Text>
                      {selectedFood.brand && (
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">
                          Brand: {selectedFood.brand}
                        </Text>
                      )}
                    </VStack>
                    
                    {/* Nutrition Preview */}
                    <SimpleGrid columns={4} spacing={4}>
                      <VStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="green.500">
                          {selectedFood.nutrition?.calories || 0}
                        </Text>
                        <Text fontSize="xs" color="gray.500">Calories</Text>
                      </VStack>
                      <VStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="blue.500">
                          {selectedFood.nutrition?.protein || 0}g
                        </Text>
                        <Text fontSize="xs" color="gray.500">Protein</Text>
                      </VStack>
                      <VStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="orange.500">
                          {selectedFood.nutrition?.carbs || 0}g
                        </Text>
                        <Text fontSize="xs" color="gray.500">Carbs</Text>
                      </VStack>
                      <VStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="purple.500">
                          {selectedFood.nutrition?.fat || 0}g
                        </Text>
                        <Text fontSize="xs" color="gray.500">Fat</Text>
                      </VStack>
                    </SimpleGrid>

                    <SimpleGrid columns={3} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Amount</FormLabel>
                        <NumberInputField 
                          value={amount} 
                          onChange={(value) => setAmount(value)} 
                          min={0.1} 
                          step={0.1}
                          allowDecimal={true}
                          precision={2}
                          placeholder="1.0"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Unit</FormLabel>
                        <Select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                          {SERVING_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Meal</FormLabel>
                        <Select value={mealType} onChange={(e) => setMealType(e.target.value)}>
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </Select>
                      </FormControl>
                    </SimpleGrid>

                    <Button
                      colorScheme="green"
                      size="lg"
                      onClick={logFood}
                      isLoading={loading}
                      loadingText="Logging..."
                    >
                      Log Food
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
