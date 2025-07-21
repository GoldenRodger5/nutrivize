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
  Text,
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
  Textarea,
  Badge
} from '@chakra-ui/react'
import api from '../../utils/api'
import { getCurrentDateInTimezone } from '../../utils/timezone'
import { calculateNutritionForQuantity, getSmartUnitSuggestions, UnitSuggestion } from '../../utils/unitConversion'
import { getSmartUnitAssignment } from '../../utils/smartUnitAssignment'
import { MealSuggestion } from '../../types'

interface MealSuggestionLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  suggestion: MealSuggestion
  mealType?: string
}

export default function MealSuggestionLogModal({
  isOpen,
  onClose,
  onSuccess,
  suggestion,
  mealType = 'lunch'
}: MealSuggestionLogModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('g')
  const [selectedMealType, setSelectedMealType] = useState(mealType)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [scaledNutrition, setScaledNutrition] = useState(suggestion?.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 })
  const [availableUnits, setAvailableUnits] = useState<string[]>([])
  
  const toast = useToast()

  // Initialize available units and scaled nutrition
  useEffect(() => {
    if (suggestion) {
      // Get unit suggestions for this food
      const units: UnitSuggestion[] = getSmartUnitSuggestions(suggestion.name)
      setAvailableUnits(units.map((u: UnitSuggestion) => u.unit))
      
      // Set default unit if available
      if (units.length > 0) {
        const recommendedUnit = units.find((u: UnitSuggestion) => u.isRecommended)?.unit || units[0].unit
        setUnit(recommendedUnit)
      } else {
        // Fallback to common units without "serving"
        setAvailableUnits(['cup', 'g', 'oz', 'piece'])
        setUnit('g')
      }
      
      // Calculate initial scaled nutrition
      updateScaledNutrition(quantity, unit)
    }
  }, [suggestion])

  // Update scaled nutrition when amount or unit changes
  useEffect(() => {
    updateScaledNutrition(quantity, unit)
  }, [quantity, unit])

  const updateScaledNutrition = (newAmount: number, newUnit: string) => {
    if (!suggestion) return
    
    try {
      const baseNutrition = suggestion.nutrition
      const scaledNutrition = calculateNutritionForQuantity(
        baseNutrition, 
        1, // base quantity
        'g', // base unit (use grams as default)
        newAmount, 
        newUnit
      )
      
      if (scaledNutrition) {
        setScaledNutrition({
          calories: scaledNutrition.calories || 0,
          protein: scaledNutrition.protein || 0,
          carbs: scaledNutrition.carbs || 0,
          fat: scaledNutrition.fat || 0,
          fiber: scaledNutrition.fiber || 0,
          sodium: scaledNutrition.sodium || 0
        })
      } else {
        // Fallback to simple multiplication
        const scale = newAmount
        setScaledNutrition({
          calories: (suggestion.nutrition.calories || 0) * scale,
          protein: (suggestion.nutrition.protein || 0) * scale,
          carbs: (suggestion.nutrition.carbs || 0) * scale,
          fat: (suggestion.nutrition.fat || 0) * scale,
          fiber: (suggestion.nutrition.fiber || 0) * scale,
          sodium: (suggestion.nutrition.sodium || 0) * scale
        })
      }
    } catch (error) {
      console.error('Error scaling nutrition:', error)
      // Fallback to simple multiplication
      const scale = newAmount
      setScaledNutrition({
        calories: (suggestion.nutrition.calories || 0) * scale,
        protein: (suggestion.nutrition.protein || 0) * scale,
        carbs: (suggestion.nutrition.carbs || 0) * scale,
        fat: (suggestion.nutrition.fat || 0) * scale,
        fiber: (suggestion.nutrition.fiber || 0) * scale,
        sodium: (suggestion.nutrition.sodium || 0) * scale
      })
    }
  }

  const handleLog = async () => {
    if (!suggestion) return
    
    setLoading(true)
    try {
      const logData = {
        date: getCurrentDateInTimezone(),
        meal_type: selectedMealType,
        food_name: suggestion.name,
        quantity: quantity,
        unit: unit,
        nutrition: scaledNutrition,
        notes: notes || `Logged from meal suggestion: ${suggestion.name}`,
        source: 'meal_suggestion'
      }

      await api.post('/meal-planning/meal-suggestions/log', logData)
      
      toast({
        title: 'Meal Logged Successfully',
        description: `${suggestion.name} has been logged to your food diary.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error logging meal:', error)
      toast({
        title: 'Error Logging Meal',
        description: error.response?.data?.detail || 'Failed to log meal. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setQuantity(1)
    if (suggestion) {
      const assignment = getSmartUnitAssignment(suggestion.name)
      setUnit(assignment.defaultUnit)
    } else {
      setUnit('g')
    }
    setSelectedMealType(mealType)
    setNotes('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Log Meal: {suggestion?.name || 'Unknown Meal'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!suggestion ? (
            <Text>No meal selected</Text>
          ) : (
            <VStack spacing={6} align="stretch">
            {/* Meal Information */}
            <Card>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="md" fontWeight="semibold">{suggestion.name}</Text>
                  <Text fontSize="sm" color="gray.600">{suggestion.description}</Text>
                  {suggestion.prep_time && (
                    <Badge colorScheme="blue" alignSelf="start">
                      {suggestion.prep_time} min prep
                    </Badge>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Portion Settings */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="md" fontWeight="semibold">Portion Settings</Text>
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel>Quantity</FormLabel>
                      <NumberInput
                        value={quantity}
                        onChange={(_, value) => setQuantity(value || 1)}
                        min={0.1}
                        max={50}
                        step={0.1}
                        precision={1}
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
                        onChange={(e) => setUnit(e.target.value)}
                      >
                        {availableUnits.map((unitOption) => (
                          <option key={unitOption} value={unitOption}>
                            {unitOption}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Nutrition Preview */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="md" fontWeight="semibold">Nutrition (for {quantity} {unit})</Text>
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <VStack spacing={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                        {Math.round(scaledNutrition.calories)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Calories</Text>
                    </VStack>
                    <VStack spacing={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {Math.round(scaledNutrition.protein)}g
                      </Text>
                      <Text fontSize="sm" color="gray.600">Protein</Text>
                    </VStack>
                    <VStack spacing={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                        {Math.round(scaledNutrition.carbs)}g
                      </Text>
                      <Text fontSize="sm" color="gray.600">Carbs</Text>
                    </VStack>
                    <VStack spacing={2}>
                      <Text fontSize="2xl" fontWeight="bold" color="red.600">
                        {Math.round(scaledNutrition.fat)}g
                      </Text>
                      <Text fontSize="sm" color="gray.600">Fat</Text>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Meal Type Selection */}
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

            {/* Notes */}
            <FormControl>
              <FormLabel>Notes (optional)</FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this meal..."
                rows={3}
              />
            </FormControl>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleLog}
            isLoading={loading}
            loadingText="Logging..."
            isDisabled={!suggestion}
          >
            Log This Meal
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}