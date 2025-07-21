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
  Badge,
  Select,
  NumberInput,
  NumberInputField,
  Input,
  useToast,
  Skeleton,
  Divider,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Textarea,
  Stat,
  StatLabel,
  StatNumber,
  useBreakpointValue,
  Collapse,
  IconButton,
} from '@chakra-ui/react'
import { FiInfo, FiSave, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { MealSuggestion } from '../types'
import api from '../utils/api'
import { convertUnit } from '../utils/unitConversion'
import MealSuggestionLogModal from '../components/food/MealSuggestionLogModal'
import AddToMealPlanModal from '../components/food/AddToMealPlanModal'

const STORAGE_KEY = 'meal_suggestions_cache'
const FILTERS_STORAGE_KEY = 'meal_suggestions_filters'

export default function MealSuggestions() {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [collapsedCards, setCollapsedCards] = useState<{ [key: number]: boolean }>({})
  const [filters, setFilters] = useState({
    meal_type: 'lunch',
    max_calories: 500,
    dietary_restrictions: '',
    cuisine_preference: '',
    prep_time_preference: '',
    main_ingredients: '',
    use_food_index_only: false,
    special_requests: '',
  })
  const [selectedSuggestion, setSelectedSuggestion] = useState<MealSuggestion | null>(null)
  const [editingSuggestion, setEditingSuggestion] = useState<MealSuggestion | null>(null)
  const [logModalSuggestion, setLogModalSuggestion] = useState<MealSuggestion | null>(null)
  const [addToMealPlanSuggestion, setAddToMealPlanSuggestion] = useState<MealSuggestion | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Load cached suggestions and filters on component mount
  useEffect(() => {
    const cachedSuggestions = localStorage.getItem(STORAGE_KEY)
    const cachedFilters = localStorage.getItem(FILTERS_STORAGE_KEY)
    
    if (cachedSuggestions) {
      try {
        const parsedSuggestions = JSON.parse(cachedSuggestions)
        setSuggestions(parsedSuggestions)
      } catch (error) {
        console.error('Error parsing cached suggestions:', error)
      }
    }
    
    if (cachedFilters) {
      try {
        const parsedFilters = JSON.parse(cachedFilters)
        setFilters(prevFilters => ({ ...prevFilters, ...parsedFilters }))
      } catch (error) {
        console.error('Error parsing cached filters:', error)
      }
    }
  }, [])

  const openEditModal = (suggestion: MealSuggestion) => {
    setSelectedSuggestion(suggestion)
    
    // Create a deep copy and store original nutrition values for each ingredient
    const editingCopy = {
      ...suggestion,
      ingredients: suggestion.ingredients.map(ingredient => ({
        ...ingredient,
        // Store original nutrition values from the API response
        originalNutrition: {
          calories: ingredient.calories || 0,
          protein: ingredient.protein || 0,
          carbs: ingredient.carbs || 0,
          fat: ingredient.fat || 0,
          originalAmount: ingredient.amount || 1,
          originalUnit: ingredient.unit || 'g'
        }
      }))
    }
    
    setEditingSuggestion(editingCopy)
    onOpen()
  }

  const toggleCardCollapse = (index: number) => {
    setCollapsedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const saveEdits = () => {
    if (editingSuggestion && selectedSuggestion) {
      // Update the suggestion in the list
      const updatedSuggestions = suggestions.map(s => 
        s === selectedSuggestion ? editingSuggestion : s
      )
      setSuggestions(updatedSuggestions)
      
      // Update cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSuggestions))
      
      toast({
        title: 'Suggestion Updated',
        description: 'Your meal suggestion has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onClose()
    }
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    if (editingSuggestion) {
      const updatedIngredients = [...editingSuggestion.ingredients]
      const updatedIngredient = { ...updatedIngredients[index] }
      ;(updatedIngredient as any)[field] = value
      
      // If amount or unit changed, recalculate nutrition for this ingredient
      if (field === 'amount' || field === 'unit') {
        const baseNutrition = getBaseNutritionForIngredient(updatedIngredient)
        const currentAmount = updatedIngredient.amount ?? 0
        const currentUnit = updatedIngredient.unit || 'g'
        const originalUnit = (updatedIngredient as any).originalNutrition?.originalUnit || 'g'
        
        const scaledNutrition = calculateScaledNutrition(baseNutrition, currentAmount, currentUnit, originalUnit)
        
        updatedIngredient.calories = scaledNutrition.calories
        updatedIngredient.protein = scaledNutrition.protein
        updatedIngredient.carbs = scaledNutrition.carbs
        updatedIngredient.fat = scaledNutrition.fat
      }
      
      updatedIngredients[index] = updatedIngredient
      
      setEditingSuggestion({ ...editingSuggestion, ingredients: updatedIngredients })
      
      // Recalculate total nutrition after updating the ingredient
      setTimeout(() => {
        updateTotalNutrition(updatedIngredients)
      }, 0)
    }
  }

  const getBaseNutritionForIngredient = (ingredient: any) => {
    // Use the stored original nutrition values from when the modal was opened
    if (ingredient.originalNutrition) {
      return {
        calories: ingredient.originalNutrition.calories,
        protein: ingredient.originalNutrition.protein,
        carbs: ingredient.originalNutrition.carbs,
        fat: ingredient.originalNutrition.fat,
        baseAmount: ingredient.originalNutrition.originalAmount
      }
    }
    
    // Fallback to current values if original nutrition is not available
    return {
      calories: ingredient.calories || 0,
      protein: ingredient.protein || 0,
      carbs: ingredient.carbs || 0,
      fat: ingredient.fat || 0,
      baseAmount: ingredient.amount || 1
    }
  }

  const calculateScaledNutrition = (baseNutrition: any, newAmount: number, newUnit: string, originalUnit: string) => {
    // If amount is 0, return 0 for all nutrition values
    if (newAmount === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }
    }
    
    // Convert the new amount to the same unit as the original for accurate scaling
    let scaleFactor = 1
    
    if (newUnit === originalUnit) {
      // Same unit, direct scaling
      scaleFactor = newAmount / baseNutrition.baseAmount
    } else {
      // Different units, need to convert
      const conversionResult = convertUnit(newAmount, newUnit, originalUnit)
      
      if (conversionResult.isValid) {
        // Successfully converted, use converted value for scaling
        scaleFactor = conversionResult.value / baseNutrition.baseAmount
      } else {
        // Units are incompatible, fall back to direct scaling
        // This handles cases like switching between weight and volume units
        scaleFactor = newAmount / baseNutrition.baseAmount
        console.warn(`Cannot convert ${newUnit} to ${originalUnit}: ${conversionResult.error}`)
      }
    }
    
    return {
      calories: Math.round(baseNutrition.calories * scaleFactor),
      protein: Math.round(baseNutrition.protein * scaleFactor * 10) / 10, // 1 decimal place
      carbs: Math.round(baseNutrition.carbs * scaleFactor * 10) / 10,
      fat: Math.round(baseNutrition.fat * scaleFactor * 10) / 10
    }
  }

  const updateTotalNutrition = (ingredients: any[]) => {
    if (editingSuggestion) {
      const totalNutrition = ingredients.reduce((total, ingredient) => ({
        calories: total.calories + (ingredient.calories || 0),
        protein: total.protein + (ingredient.protein || 0),
        carbs: total.carbs + (ingredient.carbs || 0),
        fat: total.fat + (ingredient.fat || 0),
        fiber: total.fiber + (ingredient.fiber || 0),
        sodium: total.sodium + (ingredient.sodium || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 })
      
      setEditingSuggestion(prev => prev ? { ...prev, nutrition: totalNutrition } : null)
    }
  }

  const getMealSuggestions = async () => {
    setLoading(true)
    try {
      const params: any = {
        meal_type: filters.meal_type,
        remaining_calories: filters.max_calories,
        dietary_preferences: filters.dietary_restrictions ? [filters.dietary_restrictions] : [],
        allergies: [],
      }

      if (filters.cuisine_preference) {
        params.cuisine_preference = filters.cuisine_preference
      }

      // Add new parameters
      if (filters.prep_time_preference) {
        params.prep_time_preference = filters.prep_time_preference
      }

      if (filters.main_ingredients.trim()) {
        // Split by comma and clean up the ingredients
        params.main_ingredients = filters.main_ingredients
          .split(',')
          .map(ing => ing.trim())
          .filter(ing => ing.length > 0)
          .slice(0, 3) // Limit to 3 ingredients
      }

      // Add food index restriction
      if (filters.use_food_index_only) {
        params.use_food_index_only = true
      }

      // Add special requests
      if (filters.special_requests.trim()) {
        params.special_requests = filters.special_requests.trim()
      }

      const response = await api.post('/ai/meal-suggestions', params)
      const newSuggestions = response.data.suggestions || []
      setSuggestions(newSuggestions)
      
      // Cache the suggestions and filters
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSuggestions))
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters))
    } catch (error) {
      console.error('Error getting meal suggestions:', error)
      toast({
        title: 'Suggestion Error',
        description: 'Failed to get meal suggestions. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setLoading(false)
  }

  const formatPrepTime = (minutes?: number) => {
    if (!minutes) return 'Not specified'
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #f6f9fc 0%, #e9f4f9 100%)">
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Meal Suggestions 💡
          </Heading>
          <Text color="gray.600">
            Get AI-powered meal suggestions based on your preferences and goals
          </Text>
        </Box>

        {/* Filters */}
        <Card 
          bg="linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,252,255,0.98) 100%)"
          border="1px solid"
          borderColor="rgba(79, 172, 254, 0.15)"
          boxShadow="0 4px 12px rgba(79, 172, 254, 0.08)"
        >
          <CardBody>
            <VStack spacing={4}>
              <Heading size="sm" alignSelf="start">
                Customize Your Suggestions
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} w="full">
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Meal Type
                  </Text>
                  <Select
                    value={filters.meal_type}
                    onChange={(e) => setFilters({ ...filters, meal_type: e.target.value })}
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Max Calories
                  </Text>
                  <NumberInput
                    value={filters.max_calories}
                    onChange={(_, value) => setFilters({ ...filters, max_calories: value || 500 })}
                    min={100}
                    max={2000}
                    step={50}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Dietary Preference
                  </Text>
                  <Select
                    value={filters.dietary_restrictions}
                    onChange={(e) => setFilters({ ...filters, dietary_restrictions: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Keto</option>
                    <option value="paleo">Paleo</option>
                    <option value="gluten-free">Gluten-Free</option>
                    <option value="dairy-free">Dairy-Free</option>
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Cuisine Type
                  </Text>
                  <Select
                    value={filters.cuisine_preference}
                    onChange={(e) => setFilters({ ...filters, cuisine_preference: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="asian">Asian</option>
                    <option value="mexican">Mexican</option>
                    <option value="italian">Italian</option>
                    <option value="american">American</option>
                    <option value="indian">Indian</option>
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Prep Time
                  </Text>
                  <Select
                    value={filters.prep_time_preference}
                    onChange={(e) => setFilters({ ...filters, prep_time_preference: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="quick">Quick (≤15 min)</option>
                    <option value="moderate">Moderate (15-45 min)</option>
                    <option value="complex">Complex (45+ min)</option>
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Main Ingredients
                  </Text>
                  <Input
                    placeholder="e.g., chicken, vegetables, rice (max 3)"
                    value={filters.main_ingredients}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({ ...filters, main_ingredients: e.target.value })}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Separate with commas. Suggestions will feature these prominently.
                  </Text>
                </Box>
              </SimpleGrid>

              {/* Special Requests */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Special Requests
                </Text>
                <Textarea
                  placeholder="Any special preferences, cooking methods, dietary needs, or custom instructions..."
                  value={filters.special_requests}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFilters({ ...filters, special_requests: e.target.value })}
                  rows={3}
                  resize="vertical"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Provide any custom instructions for your meal suggestions (e.g., "easy to meal prep", "uses minimal ingredients", "no dairy substitutes").
                </Text>
              </Box>

              {/* Food Index Toggle */}
              <Divider />
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <HStack spacing={2}>
                  <FormLabel htmlFor="food-index-toggle" mb="0" fontWeight="medium">
                    Use only foods from my food index
                  </FormLabel>
                  <Tooltip 
                    label="When enabled, AI will only suggest meals using foods you've already added to your food index. Basic pantry items (oil, salt, spices) are still assumed available."
                    fontSize="sm"
                    placement="top"
                  >
                    <Box display="inline-flex" alignItems="center">
                      <FiInfo color="gray.400" size={16} />
                    </Box>
                  </Tooltip>
                </HStack>
                <Switch
                  id="food-index-toggle"
                  isChecked={filters.use_food_index_only}
                  onChange={(e) => setFilters({ ...filters, use_food_index_only: e.target.checked })}
                  colorScheme="green"
                />
              </FormControl>

              <Button
                colorScheme="green"
                onClick={getMealSuggestions}
                isLoading={loading}
                loadingText="Getting suggestions..."
                alignSelf="center"
                size="lg"
              >
                Get Meal Suggestions
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Loading State */}
        {loading && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <Skeleton height="20px" width="70%" />
                    <Skeleton height="60px" width="100%" />
                    <Skeleton height="15px" width="40%" />
                    <Skeleton height="80px" width="100%" />
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Suggestions */}
        {!loading && suggestions.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>
              Suggested Meals ({suggestions.length})
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={isMobile ? 3 : 6}>
              {suggestions.map((suggestion, index) => (
                <Card 
                  key={index} 
                  _hover={{ 
                    boxShadow: '0 8px 20px rgba(79, 172, 254, 0.15), 0 2px 8px rgba(79, 172, 254, 0.08)',
                    transform: 'translateY(-2px)'
                  }}
                  transition="all 0.2s ease"
                  bg="linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,252,255,0.98) 100%)"
                  border="1px solid"
                  borderColor="rgba(79, 172, 254, 0.15)"
                >
                  <CardBody p={isMobile ? 3 : 6}>
                    <VStack align="start" spacing={isMobile ? 3 : 4}>
                      {/* Header with Collapse Toggle for Mobile */}
                      <Box w="full">
                        <HStack justify="space-between" mb={2}>
                          <Heading size={isMobile ? "sm" : "md"}>{suggestion.name}</Heading>
                          <HStack spacing={2}>
                            {suggestion.prep_time && (
                              <Badge colorScheme="blue" fontSize={isMobile ? "xs" : "sm"}>
                                {formatPrepTime(suggestion.prep_time)}
                              </Badge>
                            )}
                            {isMobile && (
                              <IconButton
                                aria-label={collapsedCards[index] ? "Expand meal details" : "Collapse meal details"}
                                icon={collapsedCards[index] ? <FiChevronDown /> : <FiChevronUp />}
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleCardCollapse(index)}
                              />
                            )}
                          </HStack>
                        </HStack>
                        <Text color="gray.600" fontSize="sm" noOfLines={isMobile ? 2 : undefined}>
                          {suggestion.description}
                        </Text>
                      </Box>

                      {/* Nutrition Summary - Always visible but compact on mobile */}
                      <Box w="full">
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Nutrition (estimated)
                        </Text>
                        <SimpleGrid columns={isMobile ? 4 : 2} spacing={2}>
                          <Text fontSize={isMobile ? "xs" : "sm"}>
                            <strong>{Math.round(suggestion.nutrition.calories || 0)}</strong> cal
                          </Text>
                          <Text fontSize={isMobile ? "xs" : "sm"}>
                            <strong>{Math.round(suggestion.nutrition.protein || 0)}g</strong> protein
                          </Text>
                          <Text fontSize={isMobile ? "xs" : "sm"}>
                            <strong>{Math.round(suggestion.nutrition.carbs || 0)}g</strong> carbs
                          </Text>
                          <Text fontSize={isMobile ? "xs" : "sm"}>
                            <strong>{Math.round(suggestion.nutrition.fat || 0)}g</strong> fat
                          </Text>
                        </SimpleGrid>
                      </Box>

                      {/* Collapsible Content for Mobile */}
                      <Collapse in={!isMobile || !collapsedCards[index]} animateOpacity>
                        <VStack align="start" spacing={isMobile ? 3 : 4} w="full">
                          {/* Ingredients */}
                          <Box w="full">
                            <Text fontSize="sm" fontWeight="medium" mb={2}>
                              Ingredients
                            </Text>
                            <VStack align="start" spacing={1}>
                              {suggestion.ingredients.map((ingredient, idx) => (
                                <Text key={idx} fontSize={isMobile ? "xs" : "sm"} color="gray.700">
                                  • {ingredient.amount} {ingredient.unit} {ingredient.name}
                                </Text>
                              ))}
                            </VStack>
                          </Box>

                          {/* Instructions */}
                          {suggestion.instructions && suggestion.instructions.length > 0 && (
                            <Box w="full">
                              <Text fontSize="sm" fontWeight="medium" mb={2}>
                                Instructions
                              </Text>
                              <VStack align="start" spacing={1}>
                                {suggestion.instructions.map((step, idx) => (
                                  <Text key={idx} fontSize={isMobile ? "xs" : "sm"} color="gray.700">
                                    {idx + 1}. {step}
                                  </Text>
                                ))}
                              </VStack>
                            </Box>
                          )}
                        </VStack>
                      </Collapse>

                      <Divider />

                      {/* Actions */}
                      <HStack w="full" spacing={2} flexWrap={isMobile ? "wrap" : "nowrap"}>
                        <Button 
                          size={isMobile ? "xs" : "sm"} 
                          colorScheme="blue" 
                          onClick={() => openEditModal(suggestion)}
                          flex={isMobile ? 0 : 1}
                        >
                          <FiInfo style={{ marginRight: '4px' }} />
                          More Info
                        </Button>
                        <Button 
                          size={isMobile ? "xs" : "sm"} 
                          colorScheme="green" 
                          flex={1}
                          onClick={() => setAddToMealPlanSuggestion(suggestion)}
                        >
                          Add to Meal Plan
                        </Button>
                        <Button 
                          size={isMobile ? "xs" : "sm"} 
                          variant="outline" 
                          flex={1}
                          onClick={() => setLogModalSuggestion(suggestion)}
                        >
                          Log This Meal
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Empty State */}
        {!loading && suggestions.length === 0 && (
          <Card
            bg="linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,252,255,0.98) 100%)"
            border="1px solid"
            borderColor="rgba(79, 172, 254, 0.15)"
            boxShadow="0 4px 12px rgba(79, 172, 254, 0.08)"
          >
            <CardBody textAlign="center" py={12}>
              <Text fontSize="lg" color="gray.500">
                No meal suggestions yet
              </Text>
              <Text fontSize="sm" color="gray.400" mt={2}>
                Customize your preferences above and click "Get Meal Suggestions"
              </Text>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Edit Suggestion Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Edit Meal Suggestion: {editingSuggestion?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingSuggestion && (
              <VStack spacing={6} align="stretch">
                {/* Basic Info */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Meal Name</FormLabel>
                    <Input
                      value={editingSuggestion.name}
                      onChange={(e) => setEditingSuggestion({ ...editingSuggestion, name: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Prep Time (minutes)</FormLabel>
                    <NumberInput
                      value={editingSuggestion.prep_time || 0}
                      onChange={(_, value) => setEditingSuggestion({ ...editingSuggestion, prep_time: value })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={editingSuggestion.description}
                    onChange={(e) => setEditingSuggestion({ ...editingSuggestion, description: e.target.value })}
                    rows={3}
                  />
                </FormControl>

                {/* Nutrition Info */}
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>
                    Nutrition Information
                  </Text>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    {['calories', 'protein', 'carbs', 'fat'].map((nutrient) => (
                      <Stat key={nutrient} size="sm">
                        <StatLabel textTransform="capitalize">{nutrient}</StatLabel>
                        <StatNumber>
                          <NumberInput
                            value={editingSuggestion.nutrition[nutrient as keyof typeof editingSuggestion.nutrition] || 0}
                            onChange={(_, value) => setEditingSuggestion({
                              ...editingSuggestion,
                              nutrition: { ...editingSuggestion.nutrition, [nutrient]: value || 0 }
                            })}
                            min={0}
                            size="sm"
                          >
                            <NumberInputField />
                          </NumberInput>
                        </StatNumber>
                      </Stat>
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Ingredients */}
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>
                    Ingredients
                  </Text>
                  <TableContainer>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Ingredient</Th>
                          <Th>Amount</Th>
                          <Th>Unit</Th>
                          <Th>Calories</Th>
                          <Th>Protein (g)</Th>
                          <Th>Carbs (g)</Th>
                          <Th>Fat (g)</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {editingSuggestion.ingredients.map((ingredient, index) => (
                          <Tr key={`${ingredient.name}-${index}`}>
                            <Td>
                              <Input
                                value={ingredient.name}
                                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                size="sm"
                              />
                            </Td>
                            <Td>
                              <NumberInput
                                value={ingredient.amount}
                                onChange={(_, value) => updateIngredient(index, 'amount', value || 0)}
                                min={0}
                                step={0.1}
                                precision={2}
                                size="sm"
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td>
                              <Select
                                value={ingredient.unit}
                                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                size="sm"
                              >
                                {/* Weight Units */}
                                <option value="g">g (grams)</option>
                                <option value="kg">kg (kilograms)</option>
                                <option value="oz">oz (ounces)</option>
                                <option value="lb">lb (pounds)</option>
                                
                                {/* Volume Units */}
                                <option value="ml">ml (milliliters)</option>
                                <option value="l">l (liters)</option>
                                <option value="cup">cup</option>
                                <option value="tbsp">tbsp (tablespoons)</option>
                                <option value="tsp">tsp (teaspoons)</option>
                                <option value="fl oz">fl oz (fluid ounces)</option>
                                
                                {/* Count/Piece Units */}
                                <option value="serving">serving</option>
                                <option value="piece">piece</option>
                                <option value="slice">slice</option>
                              </Select>
                            </Td>
                            <Td>
                              <NumberInput
                                value={ingredient.calories || 0}
                                onChange={(_, value) => updateIngredient(index, 'calories', value || 0)}
                                min={0}
                                size="sm"
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td>
                              <NumberInput
                                value={ingredient.protein || 0}
                                onChange={(_, value) => updateIngredient(index, 'protein', value || 0)}
                                min={0}
                                size="sm"
                                precision={1}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td>
                              <NumberInput
                                value={ingredient.carbs || 0}
                                onChange={(_, value) => updateIngredient(index, 'carbs', value || 0)}
                                min={0}
                                size="sm"
                                precision={1}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td>
                              <NumberInput
                                value={ingredient.fat || 0}
                                onChange={(_, value) => updateIngredient(index, 'fat', value || 0)}
                                min={0}
                                size="sm"
                                precision={1}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Instructions */}
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>
                    Instructions
                  </Text>
                  <VStack spacing={2} align="stretch">
                    {editingSuggestion.instructions?.map((instruction, index) => (
                      <HStack key={index}>
                        <Text minW="20px" fontSize="sm" fontWeight="bold">
                          {index + 1}.
                        </Text>
                        <Textarea
                          value={instruction}
                          onChange={(e) => {
                            const updatedInstructions = [...(editingSuggestion.instructions || [])]
                            updatedInstructions[index] = e.target.value
                            setEditingSuggestion({ ...editingSuggestion, instructions: updatedInstructions })
                          }}
                          size="sm"
                          rows={2}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={saveEdits}>
              <FiSave style={{ marginRight: '8px' }} />
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Log Meal Modal */}
      {logModalSuggestion && (
        <MealSuggestionLogModal
          isOpen={!!logModalSuggestion}
          onClose={() => setLogModalSuggestion(null)}
          suggestion={logModalSuggestion}
          onSuccess={() => {
            // Optional: Add success callback
          }}
        />
      )}

      {/* Add to Meal Plan Modal */}
      {addToMealPlanSuggestion && (
        <AddToMealPlanModal
          isOpen={!!addToMealPlanSuggestion}
          onClose={() => setAddToMealPlanSuggestion(null)}
          suggestion={addToMealPlanSuggestion}
          onSuccess={() => {
            // Optional: Add success callback
          }}
        />
      )}
    </Container>
    </Box>
  )
}
