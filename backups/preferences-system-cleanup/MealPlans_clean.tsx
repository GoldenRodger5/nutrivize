import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  CheckboxGroup,
  Stack,
  SimpleGrid,
  Divider,
  IconButton,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  useToast,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react'
import { AddIcon, ViewIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { MdCheckCircle, MdSchedule, MdRestaurant, MdShoppingCart } from 'react-icons/md'
import api from '../utils/api'
import { getCurrentDateInTimezone, getUserTimezone } from '../utils/timezone'
import MacroDistributionSlider from '../components/ui/MacroDistributionSlider'

// TypeScript interfaces
interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Ingredient {
  name: string
  amount: number
  unit: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  in_food_index?: boolean
}

interface MealPlanMeal {
  meal_type: string
  food_name: string
  portion_size: string
  calories: number
  protein: number
  carbs: number
  fat: number
  preparation_notes?: string
  ingredients?: Ingredient[]
  cooking_time?: number
  prep_time?: number
  instructions?: string[]
  is_logged?: boolean
}

interface DayMealPlan {
  date: string
  meals: MealPlanMeal[]
  total_nutrition: NutritionInfo
}

interface MealPlan {
  plan_id: string
  user_id: string
  created_at: string
  days: DayMealPlan[]
  total_days: number
  dietary_restrictions: string[]
  target_nutrition: NutritionInfo
  name?: string
  title?: string
}

interface ShoppingListItem {
  item: string
  amount: number
  unit: string
  estimated_cost?: number
  category?: string
  in_food_index?: boolean
}

interface MealPlanRequest {
  days: number
  dietary_restrictions: string[]
  preferred_cuisines: string[]
  calories_per_day?: number
  protein_target?: number
  carbs_target?: number
  fat_target?: number
  exclude_foods: string[]
  meal_types: string[]
}

const MealPlans: React.FC = () => {
  // Initialize with empty array to prevent map errors
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<{meal: MealPlanMeal, dayIndex: number} | null>(null)
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [userPreferences, setUserPreferences] = useState<any>(null)

  // New state for enhanced features
  const [editingMeal, setEditingMeal] = useState<{meal: MealPlanMeal, dayIndex: number} | null>(null)
  const [multiFoodLog, setMultiFoodLog] = useState<{
    mealType: string
    date: string
    ingredients: Array<{
      name: string
      amount: number
      unit: string
      calories: number
      protein: number
      carbs: number
      fat: number
      selected: boolean
    }>
  } | null>(null)

  // Form state for creating new meal plan
  const [newPlanData, setNewPlanData] = useState<MealPlanRequest & { name: string; protein_percent: number; carbs_percent: number; fat_percent: number }>({
    name: '',
    days: 7,
    dietary_restrictions: [],
    preferred_cuisines: [],
    calories_per_day: 2000,
    protein_target: 150,
    carbs_target: 200,
    fat_target: 65,
    exclude_foods: [],
    meal_types: ['breakfast', 'lunch', 'dinner'],
    protein_percent: 30,
    carbs_percent: 40,
    fat_percent: 30
  })

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure()
  const { isOpen: isMealDetailsOpen, onOpen: onMealDetailsOpen, onClose: onMealDetailsClose } = useDisclosure()
  const { isOpen: isShoppingOpen, onOpen: onShoppingOpen, onClose: onShoppingClose } = useDisclosure()
  
  // New modals for enhanced features
  const { isOpen: isEditMealOpen, onOpen: onEditMealOpen, onClose: onEditMealClose } = useDisclosure()
  const { isOpen: isMultiFoodLogOpen, onOpen: onMultiFoodLogOpen, onClose: onMultiFoodLogClose } = useDisclosure()

  const toast = useToast()

  // Load user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await api.get('/preferences/dietary')
        setUserPreferences(response.data)
      } catch (error) {
        console.error('Error fetching dietary preferences:', error)
      }
    }
    fetchUserPreferences()
  }, [])

  // Apply user preferences to meal plan form
  const applyUserPreferences = () => {
    if (!userPreferences) return
    
    setNewPlanData(prev => ({
      ...prev,
      dietary_restrictions: userPreferences.dietary_restrictions || [],
      preferred_cuisines: userPreferences.preferred_cuisines || []
    }))
    
    toast({
      title: 'Preferences Applied',
      description: 'Your dietary preferences have been applied to the meal plan.',
      status: 'info',
      duration: 2000,
      isClosable: true
    })
  }

  // Helper function to normalize macro percentages to 100%
  const normalizeMacros = (protein: number, carbs: number, fat: number) => {
    const total = protein + carbs + fat
    if (total === 0) return { protein: 30, carbs: 40, fat: 30 }
    
    return {
      protein: Math.round((protein / total) * 100),
      carbs: Math.round((carbs / total) * 100),
      fat: Math.round((fat / total) * 100)
    }
  }

  // Fetch meal plans
  const fetchMealPlans = async () => {
    try {
      setIsLoading(true)
      setError('')
      console.log('Fetching meal plans...')
      
      const response = await api.get('/meal-planning/plans')
      console.log('Meal plans response:', response.data)
      
      // The API returns { meal_plans: [...], total: number, ... }
      const data = response.data
      let plans = []
      
      if (data && typeof data === 'object') {
        if (Array.isArray(data.meal_plans)) {
          plans = data.meal_plans
        } else if (Array.isArray(data)) {
          plans = data
        }
      }
      
      console.log('Processed meal plans:', plans)
      setMealPlans(plans)
      
    } catch (err: any) {
      console.error('Error fetching meal plans:', err)
      setError(err.response?.data?.detail || 'Failed to load meal plans')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMealPlans()
  }, [])

  // Create new meal plan
  const createMealPlan = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Calculate actual macro targets based on percentages
      const calories = newPlanData.calories_per_day || 2000
      const { protein: proteinPercent, carbs: carbsPercent, fat: fatPercent } = normalizeMacros(
        newPlanData.protein_percent,
        newPlanData.carbs_percent,
        newPlanData.fat_percent
      )

      // Convert percentages to grams
      // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
      const proteinGrams = Math.round((calories * proteinPercent / 100) / 4)
      const carbsGrams = Math.round((calories * carbsPercent / 100) / 4)
      const fatGrams = Math.round((calories * fatPercent / 100) / 9)

      const requestData = {
        ...newPlanData,
        protein_target: proteinGrams,
        carbs_target: carbsGrams,
        fat_target: fatGrams
      }

      console.log('Creating meal plan with data:', requestData)
      
      const response = await api.post('/meal-planning/generate', requestData)
      console.log('Create meal plan response:', response.data)
      
      toast({
        title: 'Meal Plan Created!',
        description: `Your ${newPlanData.days}-day meal plan has been generated successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      
      // Refresh the meal plans list
      await fetchMealPlans()
      
      // Reset form
      setNewPlanData({
        name: '',
        days: 7,
        dietary_restrictions: [],
        preferred_cuisines: [],
        calories_per_day: 2000,
        protein_target: 150,
        carbs_target: 200,
        fat_target: 65,
        exclude_foods: [],
        meal_types: ['breakfast', 'lunch', 'dinner'],
        protein_percent: 30,
        carbs_percent: 40,
        fat_percent: 30
      })
      
      onCreateClose()
    } catch (err: any) {
      console.error('Error creating meal plan:', err)
      setError(err.response?.data?.detail || 'Failed to create meal plan')
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Failed to create meal plan',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Generate shopping list
  const generateShoppingList = async (planId: string) => {
    try {
      setIsLoading(true)
      const response = await api.post(`/meal-planning/plans/${planId}/shopping-list`)
      setShoppingList(response.data.shopping_list || [])
      onShoppingOpen()
      
      toast({
        title: 'Shopping List Generated',
        description: 'Your shopping list has been created based on the meal plan.',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err: any) {
      console.error('Error generating shopping list:', err)
      toast({
        title: 'Error',
        description: 'Failed to generate shopping list',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Log meal to food log
  const logMealToFoodLog = async (meal: MealPlanMeal, date: string) => {
    try {
      // Convert date to timezone-aware format
      const currentDate = getCurrentDateInTimezone(getUserTimezone())
      const logDate = date || currentDate
      
      console.log('Logging meal to food log:', { meal, date: logDate })
      
      const foodLogEntry = {
        date: logDate,
        food_name: meal.food_name,
        meal_type: meal.meal_type,
        quantity: parseFloat(meal.portion_size) || 1,
        unit: 'serving',
        nutrition: {
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat
        },
        preparation_notes: meal.preparation_notes || '',
        from_meal_plan: true
      }

      const response = await api.post('/food-log/', foodLogEntry)
      console.log('Food log response:', response.data)

      // Mark meal as logged in the meal plan
      if (selectedPlan) {
        const updatedPlan = { ...selectedPlan }
        const dayIndex = updatedPlan.days.findIndex(day => day.date === date)
        if (dayIndex !== -1) {
          const mealIndex = updatedPlan.days[dayIndex].meals.findIndex(m => 
            m.food_name === meal.food_name && m.meal_type === meal.meal_type
          )
          if (mealIndex !== -1) {
            updatedPlan.days[dayIndex].meals[mealIndex].is_logged = true
            setSelectedPlan(updatedPlan)
          }
        }
      }

      toast({
        title: 'Meal Logged',
        description: `${meal.food_name} has been added to your food log for ${logDate}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err: any) {
      console.error('Error logging meal:', err)
      toast({
        title: 'Error',
        description: 'Failed to log meal to food log',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  // Delete meal plan
  const deleteMealPlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this meal plan? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/meal-planning/plans/${planId}`)
      
      toast({
        title: 'Plan Deleted',
        description: 'Meal plan has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      // Refresh the meal plans list
      await fetchMealPlans()
      
      // Close details modal if the deleted plan was selected
      if (selectedPlan?.plan_id === planId) {
        setSelectedPlan(null)
        onDetailsClose()
      }
    } catch (err: any) {
      console.error('Error deleting meal plan:', err)
      toast({
        title: 'Error',
        description: 'Failed to delete meal plan',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  // Enhanced functions for meal editing and multi-food logging
  const openMealEditor = (meal: MealPlanMeal, dayIndex: number) => {
    setEditingMeal({ meal: { ...meal }, dayIndex })
    onEditMealOpen()
  }

  const updateIngredient = (index: number, field: string, value: any) => {
    if (!editingMeal) return

    const updatedMeal = { ...editingMeal }
    if (!updatedMeal.meal.ingredients) return

    updatedMeal.meal.ingredients[index] = {
      ...updatedMeal.meal.ingredients[index],
      [field]: value
    }

    // Recalculate nutrition based on ingredients
    const totalNutrition = updatedMeal.meal.ingredients.reduce((total, ingredient) => ({
      calories: total.calories + (ingredient.calories || 0),
      protein: total.protein + (ingredient.protein || 0),
      carbs: total.carbs + (ingredient.carbs || 0),
      fat: total.fat + (ingredient.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

    updatedMeal.meal.calories = totalNutrition.calories
    updatedMeal.meal.protein = totalNutrition.protein
    updatedMeal.meal.carbs = totalNutrition.carbs
    updatedMeal.meal.fat = totalNutrition.fat

    setEditingMeal(updatedMeal)
  }

  const saveMealChanges = () => {
    if (!editingMeal || !selectedPlan) return

    const updatedPlan = { ...selectedPlan }
    const dayIndex = editingMeal.dayIndex
    const mealIndex = updatedPlan.days[dayIndex].meals.findIndex(m => 
      m.food_name === editingMeal.meal.food_name && m.meal_type === editingMeal.meal.meal_type
    )

    if (mealIndex !== -1) {
      updatedPlan.days[dayIndex].meals[mealIndex] = editingMeal.meal

      // Recalculate day's total nutrition
      const dayTotalNutrition = updatedPlan.days[dayIndex].meals.reduce((total, meal) => ({
        calories: total.calories + (meal.calories || 0),
        protein: total.protein + (meal.protein || 0),
        carbs: total.carbs + (meal.carbs || 0),
        fat: total.fat + (meal.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

      updatedPlan.days[dayIndex].total_nutrition = dayTotalNutrition
      setSelectedPlan(updatedPlan)

      toast({
        title: 'Success',
        description: 'Meal updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    }

    onEditMealClose()
    setEditingMeal(null)
  }

  // Functions for multi-food logging
  const openMultiFoodLog = (meal: MealPlanMeal, date: string) => {
    if (!meal.ingredients) {
      toast({
        title: 'No Ingredients',
        description: 'This meal does not have detailed ingredients for multi-food logging.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    const ingredients = meal.ingredients.map(ingredient => ({
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      calories: 0, // These would need to be calculated based on ingredient database
      protein: 0,
      carbs: 0,
      fat: 0,
      selected: true
    }))

    setMultiFoodLog({
      mealType: meal.meal_type,
      date,
      ingredients
    })
    onMultiFoodLogOpen()
  }

  const updateMultiFoodIngredient = (index: number, field: string, value: any) => {
    if (!multiFoodLog) return

    const updated = { ...multiFoodLog }
    updated.ingredients[index] = {
      ...updated.ingredients[index],
      [field]: value
    }
    setMultiFoodLog(updated)
  }

  const logMultipleFoods = async () => {
    if (!multiFoodLog) return

    try {
      const selectedIngredients = multiFoodLog.ingredients.filter(ing => ing.selected)
      
      for (const ingredient of selectedIngredients) {
        const foodLogEntry = {
          date: multiFoodLog.date,
          food_name: ingredient.name,
          meal_type: multiFoodLog.mealType,
          quantity: ingredient.amount,
          unit: ingredient.unit,
          nutrition: {
            calories: ingredient.calories,
            protein: ingredient.protein,
            carbs: ingredient.carbs,
            fat: ingredient.fat
          },
          from_meal_plan: true
        }

        await api.post('/food-log/', foodLogEntry)
      }

      toast({
        title: 'Foods Logged',
        description: `${selectedIngredients.length} ingredients have been logged to your food diary.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })

      onMultiFoodLogClose()
      setMultiFoodLog(null)
    } catch (err: any) {
      console.error('Error logging multiple foods:', err)
      toast({
        title: 'Error',
        description: 'Failed to log ingredients to food diary',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  // Render meal plan card
  const renderMealPlanCard = (plan: MealPlan) => {
    const planName = plan.name || plan.title || `Meal Plan ${plan.plan_id.slice(-6)}`
    
    // Calculate average daily nutrition
    let avgNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    
    if (plan.days && plan.days.length > 0) {
      const numDays = plan.days.length
      const totalNutrition = plan.days.reduce((total, day) => ({
        calories: total.calories + (day.total_nutrition?.calories || 0),
        protein: total.protein + (day.total_nutrition?.protein || 0),
        carbs: total.carbs + (day.total_nutrition?.carbs || 0),
        fat: total.fat + (day.total_nutrition?.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      
      avgNutrition = {
        calories: totalNutrition.calories / numDays,
        protein: totalNutrition.protein / numDays,
        carbs: totalNutrition.carbs / numDays,
        fat: totalNutrition.fat / numDays
      }
    } else {
      // Fallback to target_nutrition if no days data
      avgNutrition = plan.target_nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }

    return (
      <Card key={plan.plan_id} cursor="pointer" _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                {planName}
              </Text>
              <Badge colorScheme="blue">{plan.total_days || 0} days</Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.600">
              Created {new Date(plan.created_at).toLocaleDateString()}
            </Text>

            {/* Display dietary restrictions */}
            {plan.dietary_restrictions && plan.dietary_restrictions.length > 0 && (
              <HStack flexWrap="wrap" spacing={1}>
                {plan.dietary_restrictions.map((restriction, index) => (
                  <Badge key={index} variant="outline" colorScheme="green" fontSize="xs">
                    {restriction}
                  </Badge>
                ))}
              </HStack>
            )}

            {/* Average daily nutrition */}
            <SimpleGrid columns={4} spacing={2}>
              <Stat size="sm">
                <StatLabel fontSize="xs">Calories</StatLabel>
                <StatNumber fontSize="sm">{Math.round(avgNutrition.calories)}</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Protein</StatLabel>
                <StatNumber fontSize="sm">{Math.round(avgNutrition.protein)}g</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Carbs</StatLabel>
                <StatNumber fontSize="sm">{Math.round(avgNutrition.carbs)}g</StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Fat</StatLabel>
                <StatNumber fontSize="sm">{Math.round(avgNutrition.fat)}g</StatNumber>
              </Stat>
            </SimpleGrid>

            <HStack spacing={2}>
              <Button 
                size="sm" 
                colorScheme="blue" 
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPlan(plan)
                  onDetailsOpen()
                }}
              >
                View Details
              </Button>
              <Button 
                size="sm" 
                colorScheme="green" 
                onClick={(e) => {
                  e.stopPropagation()
                  generateShoppingList(plan.plan_id)
                }}
              >
                Shopping List
              </Button>
              <IconButton
                size="sm"
                aria-label="Delete plan"
                icon={<DeleteIcon />}
                colorScheme="red"
                variant="ghost"
                onClick={() => deleteMealPlan(plan.plan_id)}
              />
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">Meal Plans</Text>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onCreateOpen}>
            Create New Plan
          </Button>
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Meal Plans Grid */}
        {isLoading ? (
          <Flex justify="center" p={8}>
            <Spinner size="lg" />
          </Flex>
        ) : mealPlans.length === 0 ? (
          <Card>
            <CardBody textAlign="center" py={8}>
              <Text fontSize="lg" color="gray.500" mb={4}>
                No meal plans found
              </Text>
              <Text color="gray.600" mb={4}>
                Create your first meal plan to get started with personalized nutrition planning.
              </Text>
              <Button colorScheme="blue" onClick={onCreateOpen}>
                Create Your First Meal Plan
              </Button>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {mealPlans.map(renderMealPlanCard)}
          </SimpleGrid>
        )}

        {/* Create Meal Plan Modal */}
        <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Meal Plan</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Plan Name</FormLabel>
                  <Input
                    value={newPlanData.name}
                    onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                    placeholder="Enter a name for your meal plan"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Number of Days</FormLabel>
                  <NumberInput
                    value={newPlanData.days}
                    onChange={(_, num) => setNewPlanData({ ...newPlanData, days: num || 7 })}
                    min={1}
                    max={30}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Daily Calorie Target</FormLabel>
                  <NumberInput
                    value={newPlanData.calories_per_day}
                    onChange={(_, num) => setNewPlanData({ ...newPlanData, calories_per_day: num || 2000 })}
                    min={1000}
                    max={5000}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <MacroDistributionSlider
                  protein={newPlanData.protein_percent}
                  carbs={newPlanData.carbs_percent}
                  fat={newPlanData.fat_percent}
                  onChange={({ protein, carbs, fat }) => 
                    setNewPlanData({ 
                      ...newPlanData, 
                      protein_percent: protein, 
                      carbs_percent: carbs, 
                      fat_percent: fat 
                    })
                  }
                />

                <FormControl>
                  <FormLabel>Dietary Restrictions</FormLabel>
                  <CheckboxGroup
                    value={newPlanData.dietary_restrictions}
                    onChange={(values) => setNewPlanData({ ...newPlanData, dietary_restrictions: values as string[] })}
                  >
                    <Stack direction="row" flexWrap="wrap">
                      <Checkbox value="vegetarian">Vegetarian</Checkbox>
                      <Checkbox value="vegan">Vegan</Checkbox>
                      <Checkbox value="gluten-free">Gluten-Free</Checkbox>
                      <Checkbox value="dairy-free">Dairy-Free</Checkbox>
                      <Checkbox value="low-carb">Low-Carb</Checkbox>
                      <Checkbox value="keto">Keto</Checkbox>
                    </Stack>
                  </CheckboxGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Preferred Cuisines</FormLabel>
                  <CheckboxGroup
                    value={newPlanData.preferred_cuisines}
                    onChange={(values) => setNewPlanData({ ...newPlanData, preferred_cuisines: values as string[] })}
                  >
                    <Stack direction="row" flexWrap="wrap">
                      <Checkbox value="mediterranean">Mediterranean</Checkbox>
                      <Checkbox value="asian">Asian</Checkbox>
                      <Checkbox value="mexican">Mexican</Checkbox>
                      <Checkbox value="italian">Italian</Checkbox>
                      <Checkbox value="american">American</Checkbox>
                      <Checkbox value="indian">Indian</Checkbox>
                    </Stack>
                  </CheckboxGroup>
                </FormControl>

                {userPreferences && (
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    onClick={applyUserPreferences}
                    w="full"
                  >
                    Apply My Dietary Preferences
                  </Button>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreateClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={createMealPlan}
                isLoading={isLoading}
                loadingText="Creating..."
              >
                Create Plan
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Meal Plan Details Modal */}
        <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {selectedPlan?.name || selectedPlan?.title || 'Meal Plan Details'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedPlan && (
                <VStack spacing={6} align="stretch">
                  {/* Plan Overview */}
                  <Card>
                    <CardBody>
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Stat>
                          <StatLabel>Duration</StatLabel>
                          <StatNumber>{selectedPlan.total_days} days</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Created</StatLabel>
                          <StatNumber fontSize="md">
                            {new Date(selectedPlan.created_at).toLocaleDateString()}
                          </StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Target Calories</StatLabel>
                          <StatNumber>{selectedPlan.target_nutrition?.calories || 'N/A'}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Restrictions</StatLabel>
                          <StatNumber fontSize="sm">
                            {selectedPlan.dietary_restrictions?.length || 0}
                          </StatNumber>
                        </Stat>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Daily Meal Plans */}
                  <Accordion defaultIndex={[0]} allowMultiple>
                    {selectedPlan.days?.map((day, dayIndex) => (
                      <AccordionItem key={dayIndex}>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <HStack justify="space-between">
                              <Text fontWeight="bold">
                                {formatDate(day.date)}
                              </Text>
                              <Badge colorScheme="blue">
                                {Math.round(day.total_nutrition?.calories || 0)} cal
                              </Badge>
                            </HStack>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel>
                          <VStack spacing={4} align="stretch">
                            {/* Day nutrition summary */}
                            <SimpleGrid columns={4} spacing={3}>
                              <Stat size="sm">
                                <StatLabel>Calories</StatLabel>
                                <StatNumber>{Math.round(day.total_nutrition?.calories || 0)}</StatNumber>
                              </Stat>
                              <Stat size="sm">
                                <StatLabel>Protein</StatLabel>
                                <StatNumber>{Math.round(day.total_nutrition?.protein || 0)}g</StatNumber>
                              </Stat>
                              <Stat size="sm">
                                <StatLabel>Carbs</StatLabel>
                                <StatNumber>{Math.round(day.total_nutrition?.carbs || 0)}g</StatNumber>
                              </Stat>
                              <Stat size="sm">
                                <StatLabel>Fat</StatLabel>
                                <StatNumber>{Math.round(day.total_nutrition?.fat || 0)}g</StatNumber>
                              </Stat>
                            </SimpleGrid>

                            <Divider />

                            {/* Meals for this day */}
                            <VStack spacing={3} align="stretch">
                              {day.meals?.map((meal, mealIndex) => (
                                <Card key={mealIndex} variant="outline">
                                  <CardBody>
                                    <VStack align="stretch" spacing={3}>
                                      <HStack justify="space-between">
                                        <VStack align="start" spacing={1}>
                                          <Badge colorScheme="purple" textTransform="capitalize">
                                            {meal.meal_type}
                                          </Badge>
                                          <Text fontWeight="bold">{meal.food_name}</Text>
                                          <Text fontSize="sm" color="gray.600">
                                            Portion: {meal.portion_size}
                                          </Text>
                                        </VStack>
                                        <VStack align="end" spacing={1}>
                                          <Text fontSize="lg" fontWeight="bold">
                                            {Math.round(meal.calories)} cal
                                          </Text>
                                          <Text fontSize="sm">
                                            P: {Math.round(meal.protein)}g | 
                                            C: {Math.round(meal.carbs)}g | 
                                            F: {Math.round(meal.fat)}g
                                          </Text>
                                        </VStack>
                                      </HStack>

                                      {meal.preparation_notes && (
                                        <Text fontSize="sm" color="gray.600">
                                          <strong>Notes:</strong> {meal.preparation_notes}
                                        </Text>
                                      )}

                                      {meal.instructions && meal.instructions.length > 0 && (
                                        <Box>
                                          <Text fontSize="sm" fontWeight="bold" mb={2}>Cooking Instructions:</Text>
                                          <List spacing={1}>
                                            {meal.instructions.map((instruction, idx) => (
                                              <ListItem key={idx} fontSize="sm">
                                                <ListIcon as={MdCheckCircle} color="green.500" />
                                                {instruction}
                                              </ListItem>
                                            ))}
                                          </List>
                                        </Box>
                                      )}

                                      {meal.ingredients && meal.ingredients.length > 0 && (
                                        <Box>
                                          <Text fontSize="sm" fontWeight="bold" mb={2}>Ingredients:</Text>
                                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={1}>
                                            {meal.ingredients.map((ingredient, idx) => (
                                              <Text key={idx} fontSize="sm">
                                                • {ingredient.amount} {ingredient.unit} {ingredient.name}
                                              </Text>
                                            ))}
                                          </SimpleGrid>
                                        </Box>
                                      )}

                                      <HStack spacing={2}>
                                        <Button
                                          size="sm"
                                          colorScheme={meal.is_logged ? "gray" : "green"}
                                          onClick={() => logMealToFoodLog(meal, day.date)}
                                          isDisabled={meal.is_logged}
                                        >
                                          {meal.is_logged ? "Already Logged" : "Log Meal"}
                                        </Button>
                                        
                                        {meal.ingredients && meal.ingredients.length > 0 && (
                                          <>
                                            <Button
                                              size="sm"
                                              colorScheme="blue"
                                              variant="outline"
                                              leftIcon={<EditIcon />}
                                              onClick={() => openMealEditor(meal, dayIndex)}
                                            >
                                              Edit Ingredients
                                            </Button>
                                            <Button
                                              size="sm"
                                              colorScheme="orange"
                                              variant="outline"
                                              leftIcon={<MdRestaurant />}
                                              onClick={() => openMultiFoodLog(meal, day.date)}
                                            >
                                              Log Ingredients
                                            </Button>
                                          </>
                                        )}

                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          leftIcon={<ViewIcon />}
                                          onClick={() => {
                                            setSelectedMeal({ meal, dayIndex })
                                            onMealDetailsOpen()
                                          }}
                                        >
                                          Details
                                        </Button>
                                      </HStack>
                                    </VStack>
                                  </CardBody>
                                </Card>
                              ))}
                            </VStack>
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDetailsClose}>
                Close
              </Button>
              <Button
                colorScheme="green"
                onClick={() => selectedPlan && generateShoppingList(selectedPlan.plan_id)}
              >
                Generate Shopping List
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Meal Details Modal */}
        <Modal isOpen={isMealDetailsOpen} onClose={onMealDetailsClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedMeal?.meal.food_name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedMeal && (
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Badge colorScheme="purple" textTransform="capitalize">
                      {selectedMeal.meal.meal_type}
                    </Badge>
                    <Text fontSize="lg" fontWeight="bold">
                      {Math.round(selectedMeal.meal.calories)} calories
                    </Text>
                  </HStack>

                  <SimpleGrid columns={3} spacing={3}>
                    <Stat size="sm">
                      <StatLabel>Protein</StatLabel>
                      <StatNumber>{Math.round(selectedMeal.meal.protein)}g</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Carbs</StatLabel>
                      <StatNumber>{Math.round(selectedMeal.meal.carbs)}g</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Fat</StatLabel>
                      <StatNumber>{Math.round(selectedMeal.meal.fat)}g</StatNumber>
                    </Stat>
                  </SimpleGrid>

                  {selectedMeal.meal.preparation_notes && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Preparation Notes:</Text>
                      <Text>{selectedMeal.meal.preparation_notes}</Text>
                    </Box>
                  )}

                  {selectedMeal.meal.instructions && selectedMeal.meal.instructions.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Cooking Instructions:</Text>
                      <List spacing={2}>
                        {selectedMeal.meal.instructions.map((instruction, idx) => (
                          <ListItem key={idx}>
                            <ListIcon as={MdCheckCircle} color="green.500" />
                            {instruction}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {selectedMeal.meal.ingredients && selectedMeal.meal.ingredients.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>Ingredients:</Text>
                      <VStack align="stretch" spacing={1}>
                        {selectedMeal.meal.ingredients.map((ingredient, idx) => (
                          <Text key={idx}>
                            • {ingredient.amount} {ingredient.unit} {ingredient.name}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {(selectedMeal.meal.cooking_time || selectedMeal.meal.prep_time) && (
                    <HStack spacing={4}>
                      {selectedMeal.meal.prep_time && (
                        <HStack>
                          <MdSchedule />
                          <Text fontSize="sm">Prep: {selectedMeal.meal.prep_time} min</Text>
                        </HStack>
                      )}
                      {selectedMeal.meal.cooking_time && (
                        <HStack>
                          <MdSchedule />
                          <Text fontSize="sm">Cook: {selectedMeal.meal.cooking_time} min</Text>
                        </HStack>
                      )}
                    </HStack>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onMealDetailsClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Meal Modal */}
        <Modal isOpen={isEditMealOpen} onClose={onEditMealClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Meal Ingredients</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {editingMeal && (
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="bold">{editingMeal.meal.food_name}</Text>
                  
                  {editingMeal.meal.ingredients?.map((ingredient, idx) => (
                    <Card key={idx} variant="outline">
                      <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">Ingredient</FormLabel>
                            <Input
                              value={ingredient.name}
                              onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                              size="sm"
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">Amount</FormLabel>
                            <NumberInput
                              value={ingredient.amount}
                              onChange={(_, num) => updateIngredient(idx, 'amount', num)}
                              size="sm"
                              min={0}
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
                            <FormLabel fontSize="sm">Unit</FormLabel>
                            <Input
                              value={ingredient.unit}
                              onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                              size="sm"
                            />
                          </FormControl>
                        </SimpleGrid>
                      </CardBody>
                    </Card>
                  ))}

                  <Card bg="gray.50">
                    <CardBody>
                      <Text fontWeight="bold" mb={2}>Updated Nutrition:</Text>
                      <SimpleGrid columns={4} spacing={3}>
                        <Stat size="sm">
                          <StatLabel>Calories</StatLabel>
                          <StatNumber>{Math.round(editingMeal.meal.calories)}</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Protein</StatLabel>
                          <StatNumber>{Math.round(editingMeal.meal.protein)}g</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Carbs</StatLabel>
                          <StatNumber>{Math.round(editingMeal.meal.carbs)}g</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Fat</StatLabel>
                          <StatNumber>{Math.round(editingMeal.meal.fat)}g</StatNumber>
                        </Stat>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditMealClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={saveMealChanges}>
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Multi-Food Log Modal */}
        <Modal isOpen={isMultiFoodLogOpen} onClose={onMultiFoodLogClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Log Individual Ingredients</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {multiFoodLog && (
                <VStack spacing={4} align="stretch">
                  <Text>
                    Select ingredients to log individually for <strong>{multiFoodLog.mealType}</strong> on {multiFoodLog.date}
                  </Text>
                  
                  {multiFoodLog.ingredients.map((ingredient, idx) => (
                    <Card key={idx} variant="outline">
                      <CardBody>
                        <HStack spacing={4}>
                          <Checkbox
                            isChecked={ingredient.selected}
                            onChange={(e) => updateMultiFoodIngredient(idx, 'selected', e.target.checked)}
                          />
                          <VStack flex={1} align="stretch" spacing={2}>
                            <HStack justify="space-between">
                              <Text fontWeight="bold">{ingredient.name}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {ingredient.amount} {ingredient.unit}
                              </Text>
                            </HStack>
                            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
                              <FormControl size="sm">
                                <FormLabel fontSize="xs">Calories</FormLabel>
                                <NumberInput
                                  value={ingredient.calories}
                                  onChange={(_, num) => updateMultiFoodIngredient(idx, 'calories', num || 0)}
                                  size="sm"
                                  min={0}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                              <FormControl size="sm">
                                <FormLabel fontSize="xs">Protein (g)</FormLabel>
                                <NumberInput
                                  value={ingredient.protein}
                                  onChange={(_, num) => updateMultiFoodIngredient(idx, 'protein', num || 0)}
                                  size="sm"
                                  min={0}
                                  step={0.1}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                              <FormControl size="sm">
                                <FormLabel fontSize="xs">Carbs (g)</FormLabel>
                                <NumberInput
                                  value={ingredient.carbs}
                                  onChange={(_, num) => updateMultiFoodIngredient(idx, 'carbs', num || 0)}
                                  size="sm"
                                  min={0}
                                  step={0.1}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                              <FormControl size="sm">
                                <FormLabel fontSize="xs">Fat (g)</FormLabel>
                                <NumberInput
                                  value={ingredient.fat}
                                  onChange={(_, num) => updateMultiFoodIngredient(idx, 'fat', num || 0)}
                                  size="sm"
                                  min={0}
                                  step={0.1}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                            </SimpleGrid>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onMultiFoodLogClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={logMultipleFoods}>
                Log Selected Ingredients
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Shopping List Modal */}
        <Modal isOpen={isShoppingOpen} onClose={onShoppingClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <MdShoppingCart />
                <Text>Shopping List</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {shoppingList.length === 0 ? (
                <Text>No shopping list items found.</Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {shoppingList.map((item, index) => (
                    <Card key={index} variant="outline">
                      <CardBody py={3}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{item.item}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {item.amount} {item.unit}
                            </Text>
                          </VStack>
                          <VStack align="end" spacing={0}>
                            {item.estimated_cost && (
                              <Text fontSize="sm" color="green.600">
                                ${item.estimated_cost.toFixed(2)}
                              </Text>
                            )}
                            {item.category && (
                              <Badge size="sm" colorScheme="blue">
                                {item.category}
                              </Badge>
                            )}
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onShoppingClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  )
}

export default MealPlans
