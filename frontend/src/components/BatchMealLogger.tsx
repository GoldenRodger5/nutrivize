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
  Checkbox,
  SimpleGrid,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  Select,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Flex
} from '@chakra-ui/react'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { FiPlus, FiCheck } from 'react-icons/fi'
import api from '../utils/api'

interface BatchMealItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  quantity: number
  unit: string
  selected: boolean
  meal_type: string
  food_id?: string
}

interface BatchMealLoggerProps {
  mealPlan?: any
  onLogComplete?: (loggedItems: BatchMealItem[]) => void
  defaultMealType?: string
}

const BatchMealLogger: React.FC<BatchMealLoggerProps> = ({ 
  mealPlan, 
  onLogComplete, 
  defaultMealType = 'lunch' 
}) => {
  const [batchItems, setBatchItems] = useState<BatchMealItem[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error] = useState('')
  const [currentMealType, setCurrentMealType] = useState(defaultMealType)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  useEffect(() => {
    if (mealPlan) {
      initializeFromMealPlan()
    }
  }, [mealPlan])

  const initializeFromMealPlan = () => {
    if (!mealPlan?.days) return

    const items: BatchMealItem[] = []
    
    mealPlan.days.forEach((day: any, dayIndex: number) => {
      if (day.meals) {
        day.meals.forEach((meal: any, mealIndex: number) => {
          if (meal.ingredients && meal.ingredients.length > 0) {
            // Add ingredients as separate items
            meal.ingredients.forEach((ingredient: any, ingIndex: number) => {
              items.push({
                id: `${dayIndex}-${mealIndex}-${ingIndex}`,
                name: ingredient.name,
                calories: ingredient.calories || 0,
                protein: ingredient.protein || 0,
                carbs: ingredient.carbs || 0,
                fat: ingredient.fat || 0,
                fiber: ingredient.fiber || 0,
                quantity: ingredient.amount || 1,
                unit: ingredient.unit || 'serving',
                selected: false,
                meal_type: meal.meal_type || 'lunch',
                food_id: ingredient.food_id
              })
            })
          } else {
            // Add meal as single item
            items.push({
              id: `${dayIndex}-${mealIndex}`,
              name: meal.food_name,
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              carbs: meal.carbs || 0,
              fat: meal.fat || 0,
              fiber: meal.fiber || 0,
              quantity: 1,
              unit: meal.portion_size || 'serving',
              selected: false,
              meal_type: meal.meal_type || 'lunch',
              food_id: meal.food_id
            })
          }
        })
      }
    })

    setBatchItems(items)
  }

  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      const response = await api.get(`/foods/search?q=${encodeURIComponent(query)}&limit=10`)
      setSearchResults(response.data || [])
    } catch (err: any) {
      console.error('Error searching foods:', err)
      toast({
        title: 'Search Error',
        description: 'Failed to search for foods. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setSearchLoading(false)
    }
  }

  const addFoodToBatch = (food: any) => {
    const newItem: BatchMealItem = {
      id: `manual-${Date.now()}`,
      name: food.name,
      calories: food.nutrition?.calories || 0,
      protein: food.nutrition?.protein || 0,
      carbs: food.nutrition?.carbs || 0,
      fat: food.nutrition?.fat || 0,
      fiber: food.nutrition?.fiber || 0,
      quantity: 1,
      unit: food.nutrition?.unit || 'serving',
      selected: true,
      meal_type: currentMealType,
      food_id: food.id
    }

    setBatchItems(prev => [...prev, newItem])
    setSearchTerm('')
    setSearchResults([])
    
    toast({
      title: 'Food Added',
      description: `${food.name} added to batch`,
      status: 'success',
      duration: 2000,
      isClosable: true
    })
  }

  const updateBatchItem = (id: string, field: string, value: any) => {
    setBatchItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeBatchItem = (id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id))
  }

  const toggleItemSelection = (id: string) => {
    setBatchItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    )
  }

  const selectAllItems = () => {
    setBatchItems(prev => prev.map(item => ({ ...item, selected: true })))
  }

  const deselectAllItems = () => {
    setBatchItems(prev => prev.map(item => ({ ...item, selected: false })))
  }

  const logSelectedItems = async () => {
    const selectedItems = batchItems.filter(item => item.selected)
    
    if (selectedItems.length === 0) {
      toast({
        title: 'No Items Selected',
        description: 'Please select at least one item to log.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    try {
      setLoading(true)
      
      // Log each selected item
      const logPromises = selectedItems.map(item => 
        api.post('/food-logs/', {
          food_id: item.food_id,
          food_name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          meal_type: item.meal_type,
          date: selectedDate,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: item.fiber
        })
      )

      await Promise.all(logPromises)
      
      toast({
        title: 'Batch Logged Successfully',
        description: `${selectedItems.length} items logged for ${selectedDate}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      // Remove logged items from the list
      setBatchItems(prev => prev.filter(item => !item.selected))
      
      // Call callback if provided
      if (onLogComplete) {
        onLogComplete(selectedItems)
      }

    } catch (err: any) {
      console.error('Error logging batch items:', err)
      toast({
        title: 'Logging Error',
        description: 'Failed to log some items. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedItems = batchItems.filter(item => item.selected)
  const totalNutrition = selectedItems.reduce((total, item) => ({
    calories: total.calories + (item.calories * item.quantity),
    protein: total.protein + (item.protein * item.quantity),
    carbs: total.carbs + (item.carbs * item.quantity),
    fat: total.fat + (item.fat * item.quantity),
    fiber: total.fiber + ((item.fiber || 0) * item.quantity)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiCheck} color="green.500" />
              <Heading size="md">Batch Meal Logger</Heading>
            </HStack>
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={onOpen}
              leftIcon={<FiPlus />}
            >
              Add Foods
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Logging Controls */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Default Meal Type</FormLabel>
                <Select
                  value={currentMealType}
                  onChange={(e) => setCurrentMealType(e.target.value)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Batch Actions</FormLabel>
                <HStack>
                  <Button size="sm" onClick={selectAllItems}>
                    Select All
                  </Button>
                  <Button size="sm" onClick={deselectAllItems}>
                    Deselect All
                  </Button>
                </HStack>
              </FormControl>
            </SimpleGrid>

            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <Card bg="green.50" borderColor="green.200">
                <CardBody>
                  <VStack spacing={3}>
                    <Text fontWeight="bold" color="green.800">
                      Selected Items Summary ({selectedItems.length} items)
                    </Text>
                    <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                      <Stat size="sm">
                        <StatLabel color="green.700">Calories</StatLabel>
                        <StatNumber color="green.800">
                          {Math.round(totalNutrition.calories)}
                        </StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel color="green.700">Protein</StatLabel>
                        <StatNumber color="green.800">
                          {Math.round(totalNutrition.protein)}g
                        </StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel color="green.700">Carbs</StatLabel>
                        <StatNumber color="green.800">
                          {Math.round(totalNutrition.carbs)}g
                        </StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel color="green.700">Fat</StatLabel>
                        <StatNumber color="green.800">
                          {Math.round(totalNutrition.fat)}g
                        </StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel color="green.700">Fiber</StatLabel>
                        <StatNumber color="green.800">
                          {Math.round(totalNutrition.fiber)}g
                        </StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Batch Items List */}
            <VStack spacing={3} align="stretch">
              {batchItems.length > 0 ? (
                batchItems.map((item) => (
                  <Card 
                    key={item.id} 
                    variant={item.selected ? "solid" : "outline"}
                    colorScheme={item.selected ? "green" : undefined}
                  >
                    <CardBody>
                      <HStack spacing={4}>
                        <Checkbox
                          isChecked={item.selected}
                          onChange={() => toggleItemSelection(item.id)}
                          size="lg"
                        />
                        
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="bold">{item.name}</Text>
                          <HStack>
                            <Badge colorScheme="purple">{item.meal_type}</Badge>
                            <Text fontSize="sm" color="gray.600">
                              {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                            </Text>
                          </HStack>
                        </VStack>

                        <SimpleGrid columns={3} spacing={2} minW="300px">
                          <FormControl>
                            <FormLabel fontSize="xs">Quantity</FormLabel>
                            <NumberInput
                              value={item.quantity}
                              onChange={(_, num) => updateBatchItem(item.id, 'quantity', num || 1)}
                              size="sm"
                              min={0.1}
                              step={0.1}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="xs">Unit</FormLabel>
                            <Input
                              value={item.unit}
                              onChange={(e) => updateBatchItem(item.id, 'unit', e.target.value)}
                              size="sm"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="xs">Meal Type</FormLabel>
                            <Select
                              value={item.meal_type}
                              onChange={(e) => updateBatchItem(item.id, 'meal_type', e.target.value)}
                              size="sm"
                            >
                              <option value="breakfast">Breakfast</option>
                              <option value="lunch">Lunch</option>
                              <option value="dinner">Dinner</option>
                              <option value="snack">Snack</option>
                            </Select>
                          </FormControl>
                        </SimpleGrid>

                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeBatchItem(item.id)}
                        >
                          Remove
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>No Items to Log</AlertTitle>
                    <AlertDescription>
                      Add foods to your batch by clicking "Add Foods" or loading from a meal plan.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>

            {/* Log Button */}
            <Button
              colorScheme="green"
              size="lg"
              onClick={logSelectedItems}
              isLoading={loading}
              loadingText="Logging..."
              isDisabled={selectedItems.length === 0}
              leftIcon={<CheckCircleIcon />}
            >
              Log Selected Items ({selectedItems.length})
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Add Foods Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Foods to Batch</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Search Foods</FormLabel>
                <Input
                  placeholder="Search for foods to add..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    searchFoods(e.target.value)
                  }}
                />
              </FormControl>

              {searchLoading && (
                <Flex justify="center" p={4}>
                  <Spinner />
                </Flex>
              )}

              {searchResults.length > 0 && (
                <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                  {searchResults.map((food) => (
                    <Card key={food.id} variant="outline">
                      <CardBody>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{food.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {food.nutrition?.calories || 0} cal per {food.nutrition?.unit || 'serving'}
                            </Text>
                          </VStack>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => addFoodToBatch(food)}
                          >
                            Add
                          </Button>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}

              {searchTerm && searchResults.length === 0 && !searchLoading && (
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    No foods found for "{searchTerm}". Try a different search term.
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default BatchMealLogger
