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
  useToast,
  Card,
  CardBody,
  Box,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Flex
} from '@chakra-ui/react'
import api from '../utils/api'
import { MealSuggestion } from '../types'

interface AddToMealPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  suggestion: MealSuggestion | null
}

export default function AddToMealPlanModal({
  isOpen,
  onClose,
  onSuccess,
  suggestion
}: AddToMealPlanModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedMealType, setSelectedMealType] = useState('lunch')
  const [loading, setLoading] = useState(false)
  const [fetchingPlans, setFetchingPlans] = useState(false)
  const [mealPlans, setMealPlans] = useState<any[]>([])
  
  const toast = useToast()

  // Fetch meal plans when modal opens
  useEffect(() => {
    if (isOpen && suggestion) {
      fetchMealPlans()
    }
  }, [isOpen, suggestion])

  const fetchMealPlans = async () => {
    if (!suggestion) return
    
    setFetchingPlans(true)
    try {
      const response = await api.get('/meal-planning/manual/plans')
      setMealPlans(response.data)
    } catch (error: any) {
      console.error('Error fetching meal plans:', error)
      toast({
        title: 'Error Loading Meal Plans',
        description: 'Failed to load meal plans. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setFetchingPlans(false)
    }
  }

  const handleAddToMealPlan = async () => {
    if (!selectedPlanId || !suggestion) return
    
    setLoading(true)
    try {
      const mealData = {
        name: suggestion.name,
        description: suggestion.description,
        meal_type: selectedMealType,
        prep_time: suggestion.prep_time,
        nutrition: suggestion.nutrition,
        ingredients: suggestion.ingredients || []
      }

      await api.post(`/meal-planning/plans/${selectedPlanId}/add-meal`, mealData)
      
      toast({
        title: 'Meal Added Successfully',
        description: `${suggestion.name} has been added to your meal plan.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error adding meal to plan:', error)
      toast({
        title: 'Error Adding Meal',
        description: error.response?.data?.detail || 'Failed to add meal to plan. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedPlanId('')
    setSelectedMealType('lunch')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Add to Meal Plan
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
                    <Flex gap={2} flexWrap="wrap">
                      {suggestion.prep_time && (
                        <Badge colorScheme="blue">
                          {suggestion.prep_time} min prep
                        </Badge>
                      )}
                      <Badge colorScheme="green">
                        {Math.round(suggestion.nutrition.calories)} cal
                      </Badge>
                    </Flex>
                  </VStack>
                </CardBody>
              </Card>

              {/* Meal Plan Selection */}
              <FormControl>
                <FormLabel>Select Meal Plan</FormLabel>
                {fetchingPlans ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <Spinner size="sm" />
                    <Text fontSize="sm">Loading meal plans...</Text>
                  </Box>
                ) : mealPlans.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    No meal plans found. Create a meal plan first to add meals.
                  </Alert>
                ) : (
                  <Select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    placeholder="Choose a meal plan"
                  >
                    {mealPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.meals?.length || 0} meals)
                      </option>
                    ))}
                  </Select>
                )}
              </FormControl>

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
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="green" 
            onClick={handleAddToMealPlan}
            isLoading={loading}
            loadingText="Adding..."
            isDisabled={!selectedPlanId || !suggestion}
          >
            Add to Meal Plan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
