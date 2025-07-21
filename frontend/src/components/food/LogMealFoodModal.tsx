import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Card,
  CardBody,
  SimpleGrid,
  Textarea
} from '@chakra-ui/react'
import api from '../../utils/api'
import { getCurrentDateInTimezone } from '../../utils/timezone'

interface LogMealFoodModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  meal: {
    food_name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sodium?: number
    preparation_notes?: string
    portion_size?: string
  }
  mealType: string
}

interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sodium?: number
}

export default function LogMealFoodModal({
  isOpen,
  onClose,
  onSuccess,
  meal,
  mealType
}: LogMealFoodModalProps) {
  const [foodName, setFoodName] = useState('')
  const [amount, setAmount] = useState(1)
  const [unit, setUnit] = useState('g')
  const [selectedMealType, setSelectedMealType] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [nutrition, setNutrition] = useState<NutritionData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })
  const [baseNutrition, setBaseNutrition] = useState<NutritionData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })
  
  const toast = useToast()

  // Unit conversion factors (relative to 'serving' as base)
  const unitConversions: { [key: string]: number } = {
    'serving': 1,
    'cup': 1.2,
    'piece': 1,
    'slice': 0.5,
    'bowl': 1.5,
    'plate': 2,
    'g': 0.01, // 100g = 1 serving
    'oz': 0.3, // ~3.5oz = 1 serving
    'tbsp': 0.1,
    'tsp': 0.03
  }

  // Convert amount from one unit to another
  const convertAmount = (amount: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return amount
    
    // Convert to serving (base unit)
    const amountInServings = amount * unitConversions[fromUnit]
    
    // Convert from serving to target unit
    const convertedAmount = amountInServings / unitConversions[toUnit]
    
    return Math.round(convertedAmount * 100) / 100 // Round to 2 decimal places
  }

  // Handle unit change with dynamic conversion
  const handleUnitChange = (newUnit: string) => {
    const convertedAmount = convertAmount(amount, unit, newUnit)
    setAmount(convertedAmount)
    setUnit(newUnit)
  }

  // Populate form with meal data when opened
  useEffect(() => {
    if (isOpen && meal) {
      setFoodName(meal.food_name || '')
      setAmount(1)
      setUnit(meal.portion_size ? meal.portion_size.split(' ')[1] || 'serving' : 'serving')
      setSelectedMealType(mealType || 'lunch')
      setSelectedDate(getCurrentDateInTimezone().split('T')[0])
      setNotes(meal.preparation_notes || '')
      
      // Set base nutrition values
      const baseNutr = {
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        fiber: meal.fiber,
        sodium: meal.sodium
      }
      
      setBaseNutrition(baseNutr)
      setNutrition(baseNutr) // Initially set to same values
    }
  }, [isOpen, meal, mealType])
  
  // Update nutrition when amount changes
  useEffect(() => {
    if (amount && baseNutrition) {
      setNutrition({
        calories: baseNutrition.calories * amount,
        protein: baseNutrition.protein * amount,
        carbs: baseNutrition.carbs * amount,
        fat: baseNutrition.fat * amount,
        fiber: baseNutrition.fiber ? baseNutrition.fiber * amount : undefined,
        sodium: baseNutrition.sodium ? baseNutrition.sodium * amount : undefined
      })
    }
  }, [amount, baseNutrition])

  const handleSubmit = async () => {
    if (!foodName) {
      toast({
        title: 'Missing information',
        description: 'Please enter a food name',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      const foodLogData = {
        food_name: foodName,
        amount,
        unit,
        meal_type: selectedMealType,
        notes,
        nutrition,
        date: selectedDate || getCurrentDateInTimezone().split('T')[0]
      }

      await api.post('/food-logs/', foodLogData)
      
      toast({
        title: 'Food logged successfully!',
        description: `${amount} ${unit} of ${foodName} added to ${selectedMealType}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="85vh">
        <ModalHeader>
          📝 Log Meal Food
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={4} w="full">
            <FormControl>
              <FormLabel>Food Name</FormLabel>
              <Input 
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
              />
            </FormControl>
            
            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Amount</FormLabel>
                <NumberInput
                  value={amount}
                  onChange={(_, valueNumber) => setAmount(valueNumber || 1)}
                  min={0.1}
                  step={0.1}
                  precision={2}
                  allowMouseWheel={false}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel>Unit</FormLabel>
                <Select
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                >
                  <option value="cup">cup</option>
                  <option value="piece">piece</option>
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                  <option value="ml">ml</option>
                  <option value="fl oz">fl oz</option>
                  <option value="tbsp">tbsp</option>
                  <option value="tsp">tsp</option>
                </Select>
              </FormControl>
            </HStack>
            
            <FormControl>
              <FormLabel>Meal Type</FormLabel>
              <Select
                value={selectedMealType}
                onChange={(e) => setSelectedMealType(e.target.value)}
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Date</FormLabel>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Notes (Optional)</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any modifications or additional notes..."
                size="sm"
              />
            </FormControl>
            
            {/* Editable Nutrition */}
            <Card w="full" bg="blue.50">
              <CardBody>
                <VStack spacing={4}>
                  <Text fontWeight="bold" color="blue.700">
                    Nutrition per {amount} {unit}(s) - All Values Editable
                  </Text>
                  
                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.600">Calories</FormLabel>
                      <NumberInput
                        value={nutrition.calories}
                        onChange={(_, valueNumber) => {
                          if (valueNumber !== undefined) {
                            setNutrition(prev => ({
                              ...prev,
                              calories: valueNumber
                            }))
                          }
                        }}
                        precision={1}
                        min={0}
                        step={0.1}
                        size="sm"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.600">Protein (g)</FormLabel>
                      <NumberInput
                        value={nutrition.protein}
                        onChange={(_, valueNumber) => {
                          if (valueNumber !== undefined) {
                            setNutrition(prev => ({
                              ...prev,
                              protein: valueNumber
                            }))
                          }
                        }}
                        precision={1}
                        min={0}
                        step={0.1}
                        size="sm"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.600">Carbs (g)</FormLabel>
                      <NumberInput
                        value={nutrition.carbs}
                        onChange={(_, valueNumber) => {
                          if (valueNumber !== undefined) {
                            setNutrition(prev => ({
                              ...prev,
                              carbs: valueNumber
                            }))
                          }
                        }}
                        precision={1}
                        min={0}
                        step={0.1}
                        size="sm"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.600">Fat (g)</FormLabel>
                      <NumberInput
                        value={nutrition.fat}
                        onChange={(_, valueNumber) => {
                          if (valueNumber !== undefined) {
                            setNutrition(prev => ({
                              ...prev,
                              fat: valueNumber
                            }))
                          }
                        }}
                        precision={1}
                        min={0}
                        step={0.1}
                        size="sm"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    {nutrition.fiber !== undefined && (
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.600">Fiber (g)</FormLabel>
                        <NumberInput
                          value={nutrition.fiber || 0}
                          onChange={(_, valueNumber) => {
                            setNutrition(prev => ({
                              ...prev,
                              fiber: valueNumber
                            }))
                          }}
                          precision={1}
                          min={0}
                          step={0.1}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    )}
                    
                    {nutrition.sodium !== undefined && (
                      <FormControl>
                        <FormLabel fontSize="xs" color="gray.600">Sodium (mg)</FormLabel>
                        <NumberInput
                          value={nutrition.sodium || 0}
                          onChange={(_, valueNumber) => {
                            setNutrition(prev => ({
                              ...prev,
                              sodium: valueNumber
                            }))
                          }}
                          precision={1}
                          min={0}
                          step={1}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    )}
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={loading}
          >
            Log Food
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
