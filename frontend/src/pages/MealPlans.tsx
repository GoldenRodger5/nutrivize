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
  AlertTitle,
  AlertDescription,
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
  Textarea,
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
  ListIcon,
  FormHelperText,
  Switch,
  Tooltip,
  Icon,
  Select,
  useBreakpointValue,
  Container
} from '@chakra-ui/react'
import { AddIcon, ViewIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { MdCheckCircle, MdSchedule, MdShoppingCart } from 'react-icons/md'
import { FiInfo, FiPlus, FiTrendingUp, FiTarget } from 'react-icons/fi'
import api from '../utils/api'
// Note: timezone utilities removed as they were unused after function cleanup
import EnhancedShoppingList from '../components/EnhancedShoppingList'
import { ShoppingList } from '../types'
import LogMealFoodModal from '../components/LogMealFoodModal'
import { useFoodIndex } from '../contexts/FoodIndexContext'
import MacroDistributionSlider from '../components/MacroDistributionSlider'
import DatePicker from '../components/DatePicker'
import MealPlanOptimizer from '../components/MealPlanOptimizer'
import BatchMealLogger from '../components/BatchMealLogger'
import SmartMealRecommendations from '../components/SmartMealRecommendations'
import NutritionOptimizationSuggestions from '../components/NutritionOptimizationSuggestions'

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
  calories_per_day?: number
  name?: string
  title?: string
}

// Remove unused interface - ShoppingList type is imported from types.ts

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
  complexity_level?: string
  use_food_index_only?: boolean
  special_requests?: string
}

const MealPlans: React.FC = () => {
  // Mobile responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false })
  const cardColumns = useBreakpointValue({ base: 1, md: 2, lg: 3 })
  const modalSize = useBreakpointValue({ base: 'full', md: 'xl', lg: '6xl' })
  
  // Food index context for real-time updates
  const { triggerRefresh } = useFoodIndex()
  
  // Initialize with empty array to prevent map errors
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<{meal: MealPlanMeal, dayIndex: number} | null>(null)
  const [shoppingListData, setShoppingListData] = useState<ShoppingList | null>(null)
  const [currentShoppingPlanId, setCurrentShoppingPlanId] = useState<string | null>(null)
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
      food_id?: string
    }>
  } | null>(null)

  // Add state for single meal food logging
  const [singleMealToLog, setSingleMealToLog] = useState<{meal: MealPlanMeal, mealType: string} | null>(null)

  // Form state for creating new meal plan
  const [newPlanData, setNewPlanData] = useState<MealPlanRequest & { name: string; protein_percent: number; carbs_percent: number; fat_percent: number; start_date: string }>({
    name: '',
    days: 3,
    dietary_restrictions: [],
    preferred_cuisines: [],
    calories_per_day: 2000,
    protein_target: 150,
    carbs_target: 200,
    fat_target: 65,
    exclude_foods: [],
    meal_types: ['breakfast', 'lunch', 'dinner'],
    complexity_level: 'any',
    protein_percent: 30,
    carbs_percent: 40,
    fat_percent: 30,
    use_food_index_only: false,
    special_requests: '',
    start_date: new Date().toISOString().split('T')[0] // Today's date as default
  })

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure()
  const { isOpen: isMealDetailsOpen, onOpen: onMealDetailsOpen, onClose: onMealDetailsClose } = useDisclosure()
  const { isOpen: isShoppingOpen, onOpen: onShoppingOpen, onClose: onShoppingClose } = useDisclosure()
  
  // New modals for enhanced features
  const { isOpen: isEditMealOpen, onOpen: onEditMealOpen, onClose: onEditMealClose } = useDisclosure()
  const { isOpen: isMultiFoodLogOpen, onClose: onMultiFoodLogClose } = useDisclosure()
  // Add disclosure for single meal food logging
  const { isOpen: isSingleMealLogOpen, onOpen: onSingleMealLogOpen, onClose: onSingleMealLogClose } = useDisclosure()
  // Add disclosure for viewing all meal plans
  const { isOpen: isAllPlansOpen, onOpen: onAllPlansOpen, onClose: onAllPlansClose } = useDisclosure()
  const { isOpen: isAllPlansModalOpen, onOpen: onAllPlansModalOpen, onClose: onAllPlansModalClose } = useDisclosure()
  
  // Add disclosure for Phase 3 Advanced Features
  const { isOpen: isBatchLoggerOpen, onOpen: onBatchLoggerOpen, onClose: onBatchLoggerClose } = useDisclosure()
  const { isOpen: isOptimizerOpen, onOpen: onOptimizerOpen, onClose: onOptimizerClose } = useDisclosure()
  const { isOpen: isRecommendationsOpen, onOpen: onRecommendationsOpen, onClose: onRecommendationsClose } = useDisclosure()
  const { isOpen: isNutritionOptOpen, onOpen: onNutritionOptOpen, onClose: onNutritionOptClose } = useDisclosure()

  // Toggle function for collapsible plans view
  const toggleAllPlans = () => {
    if (isAllPlansOpen) {
      onAllPlansClose()
    } else {
      onAllPlansOpen()
    }
  }

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
  }, [triggerRefresh])

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
      
      // Auto-select first plan if none selected
      if (plans.length > 0 && !selectedPlan) {
        setSelectedPlan(plans[0])
      }
      
    } catch (err: any) {
      console.error('Error fetching meal plans:', err)
      setError(err.response?.data?.detail || 'Failed to load meal plans')
      
      // Show toast notification for errors
      toast({
        title: 'Error Loading Meal Plans',
        description: err.response?.data?.detail || 'Failed to load meal plans',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMealPlans()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchMealPlans()
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
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
      
      const response = await api.post('/meal-planning/generate-plan', requestData)
      console.log('Create meal plan response:', response.data)
      
      toast({
        title: 'Meal Plan Created!',
        description: `Your ${newPlanData.days}-day meal plan has been generated and saved successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true
      })
      
      // Refresh the meal plans list
      await fetchMealPlans()
      
      // Reset form
      setNewPlanData({
        name: '',
        days: 3,
        dietary_restrictions: [],
        preferred_cuisines: [],
        calories_per_day: 2000,
        protein_target: 150,
        carbs_target: 200,
        fat_target: 65,
        exclude_foods: [],
        meal_types: ['breakfast', 'lunch', 'dinner'],
        complexity_level: 'any',
        protein_percent: 30,
        carbs_percent: 40,
        fat_percent: 30,
        use_food_index_only: false,
        special_requests: '',
        start_date: new Date().toISOString().split('T')[0]
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
  const generateShoppingList = async (planId: string, forceRegenerate: boolean = false) => {
    try {
      setIsLoading(true)
      
      // First try to get cached shopping list (unless force regenerating)
      if (!forceRegenerate) {
        try {
          const cachedResponse = await api.get(`/meal-planning/plans/${planId}/shopping-list`)
          const shoppingData = cachedResponse.data
          setShoppingListData(shoppingData)
          setCurrentShoppingPlanId(planId)
          onShoppingOpen()
          
          toast({
            title: 'Shopping List Loaded',
            description: `Cached shopping list loaded with ${shoppingData.items?.length || 0} items. Total estimated cost: $${shoppingData.total_estimated_cost || 0}`,
            status: 'success',
            duration: 3000,
            isClosable: true
          })
          return
        } catch (cachedError) {
          // If no cached version, continue to generate new one
          console.log('No cached shopping list found, generating new one...')
        }
      }
      
      // Generate new shopping list
      try {
        const response = await api.post(`/meal-planning/plans/${planId}/shopping-list`, {
          force_regenerate: forceRegenerate
        })
        
        // The backend returns the shopping list directly with an 'items' array
        const shoppingData = response.data
        setShoppingListData(shoppingData)
        setCurrentShoppingPlanId(planId)
        onShoppingOpen()
      } catch (error: any) {
        console.error('Error generating shopping list:', error)
        toast({
          title: 'Error Generating Shopping List',
          description: error.response?.data?.detail || 'Failed to generate shopping list. The meal plan may no longer exist.',
          status: 'error',
          duration: 5000,
          isClosable: true
        })
        return
      }
      
      toast({
        title: forceRegenerate ? 'Shopping List Regenerated' : 'Shopping List Generated',
        description: `Your shopping list has been ${forceRegenerate ? 'regenerated' : 'created'} with ${shoppingListData?.items?.length || 0} items. Total estimated cost: $${shoppingListData?.total_estimated_cost || 0}`,
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

  // Log individual food item to food log
  const logSingleFoodItem = async (foodData: any) => {
    try {
      // Optimistic update - mark as logged immediately
      if (selectedPlan) {
        const updatedPlan = { ...selectedPlan }
        updatedPlan.days = updatedPlan.days.map(day => ({
          ...day,
          meals: day.meals.map(meal => 
            meal.meal_type === foodData.meal_type && meal.food_name === foodData.food_name
              ? { ...meal, is_logged: true }
              : meal
          )
        }))
        setSelectedPlan(updatedPlan)
        
        // Update in meal plans array
        setMealPlans(prevPlans => 
          prevPlans.map(plan => 
            plan.plan_id === selectedPlan.plan_id ? updatedPlan : plan
          )
        )
      }
      
      const response = await api.post('/food-logs/', foodData)
      console.log('Food log response:', response.data)
      
      toast({
        title: 'Food Logged Successfully',
        description: `${foodData.food_name} has been logged to your food diary.`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      return response.data
    } catch (err: any) {
      console.error('Error logging food item:', err)
      
      // Rollback optimistic update on error
      if (selectedPlan) {
        const revertedPlan = { ...selectedPlan }
        revertedPlan.days = revertedPlan.days.map(day => ({
          ...day,
          meals: day.meals.map(meal => 
            meal.meal_type === foodData.meal_type && meal.food_name === foodData.food_name
              ? { ...meal, is_logged: false }
              : meal
          )
        }))
        setSelectedPlan(revertedPlan)
        
        setMealPlans(prevPlans => 
          prevPlans.map(plan => 
            plan.plan_id === selectedPlan.plan_id ? revertedPlan : plan
          )
        )
      }
      
      toast({
        title: 'Error Logging Food',
        description: err.response?.data?.detail || 'Failed to log food item',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
      
      throw err
    }
  }

  // Delete meal plan
  const deleteMealPlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this meal plan? This action cannot be undone.')) {
      return
    }

    // Optimistically remove the plan from the UI
    const originalPlans = [...mealPlans]
    setMealPlans(prev => prev.filter(plan => plan.plan_id !== planId))
    
    // Close details modal if the deleted plan was selected
    if (selectedPlan?.plan_id === planId) {
      setSelectedPlan(null)
      onDetailsClose()
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
      
      // Refresh the meal plans list to ensure consistency
      await fetchMealPlans()
      
    } catch (err: any) {
      console.error('Error deleting meal plan:', err)
      
      // Restore original plans on error
      setMealPlans(originalPlans)
      
      // Restore selected plan if it was the one being deleted
      if (selectedPlan?.plan_id === planId) {
        const restoredPlan = originalPlans.find(plan => plan.plan_id === planId)
        if (restoredPlan) {
          setSelectedPlan(restoredPlan)
        }
      }
      
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
  const openMealEditor = async (meal: MealPlanMeal, dayIndex: number) => {
    const mealToEdit = { ...meal }
    
    // If meal doesn't have ingredients, extract them using AI
    if (!mealToEdit.ingredients || mealToEdit.ingredients.length === 0) {
      try {
        toast({
          title: 'Extracting Ingredients',
          description: `Analyzing "${meal.food_name}" to extract ingredients...`,
          status: 'info',
          duration: 3000,
          isClosable: true
        })

        const response = await api.post('/meal-planning/extract-ingredients', {
          meal_name: meal.food_name,
          portion_size: meal.portion_size || '1 serving'
        })

        if (response.data.ingredients && response.data.ingredients.length > 0) {
          mealToEdit.ingredients = response.data.ingredients
          toast({
            title: 'Ingredients Extracted',
            description: `Found ${response.data.ingredients.length} ingredients for ${meal.food_name}`,
            status: 'success',
            duration: 3000,
            isClosable: true
          })
        } else {
          // Initialize with empty array if extraction failed
          mealToEdit.ingredients = []
          toast({
            title: 'No Ingredients Found',
            description: 'Could not extract ingredients. You can add them manually.',
            status: 'warning',
            duration: 3000,
            isClosable: true
          })
        }
      } catch (error) {
        console.error('Error extracting ingredients:', error)
        // Initialize with empty array if extraction failed
        mealToEdit.ingredients = []
        toast({
          title: 'Extraction Failed',
          description: 'Could not extract ingredients. You can add them manually.',
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
      }
    }
    
    setEditingMeal({ meal: mealToEdit, dayIndex })
    onEditMealOpen()
  }

  // Food lookup for auto-populating nutrition info
  const lookupFoodNutrition = async (foodName: string) => {
    try {
      // Search for food in the database
      const response = await api.get(`/foods/search?q=${encodeURIComponent(foodName)}&limit=1`)
      const foods = response.data // Backend returns array directly
      
      if (foods && foods.length > 0) {
        const food = foods[0]
        const nutrition = food.nutrition || {}
        return {
          calories: nutrition.calories || 0,
          protein: nutrition.protein || 0,
          carbs: nutrition.carbs || 0,
          fat: nutrition.fat || 0
        }
      }
    } catch (error) {
      console.log('Food not found in database:', foodName)
    }
    return null
  }

  const updateIngredient = async (index: number, field: string, value: any) => {
    if (!editingMeal) return

    const updatedMeal = { ...editingMeal }
    if (!updatedMeal.meal.ingredients) return

    updatedMeal.meal.ingredients[index] = {
      ...updatedMeal.meal.ingredients[index],
      [field]: value
    }

    // Auto-populate nutrition info when ingredient name changes
    if (field === 'name' && value.trim()) {
      try {
        const nutritionInfo = await lookupFoodNutrition(value.trim())
        if (nutritionInfo) {
          updatedMeal.meal.ingredients[index] = {
            ...updatedMeal.meal.ingredients[index],
            calories: nutritionInfo.calories,
            protein: nutritionInfo.protein,
            carbs: nutritionInfo.carbs,
            fat: nutritionInfo.fat
          }
          
          toast({
            title: 'Nutrition Info Auto-Populated',
            description: `Found nutrition data for ${value}`,
            status: 'success',
            duration: 2000,
            isClosable: true
          })
        } else {
          toast({
            title: 'Nutrition Info Not Found',
            description: `No nutrition data found for "${value}". You can enter it manually.`,
            status: 'warning',
            duration: 3000,
            isClosable: true
          })
        }
      } catch (error) {
        console.error('Error looking up nutrition:', error)
        toast({
          title: 'Lookup Error',
          description: 'Unable to fetch nutrition data. Please enter manually.',
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
      }
    }

    // Recalculate nutrition based on ingredients if nutrition data is available
    if (updatedMeal.meal.ingredients.some(ing => ing.calories || ing.protein || ing.carbs || ing.fat)) {
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
    }

    setEditingMeal(updatedMeal)
  }

  const addNewIngredient = () => {
    if (!editingMeal) return

    const updatedMeal = { ...editingMeal }
    if (!updatedMeal.meal.ingredients) {
      updatedMeal.meal.ingredients = []
    }

    updatedMeal.meal.ingredients.push({
      name: '',
      amount: 1,
      unit: 'cup',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    })

    setEditingMeal(updatedMeal)
  }

  const removeIngredient = (index: number) => {
    if (!editingMeal || !editingMeal.meal.ingredients) return

    const updatedMeal = { ...editingMeal }
    if (updatedMeal.meal.ingredients) {
      updatedMeal.meal.ingredients.splice(index, 1)

      // Recalculate nutrition
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
  }

  const saveMealChanges = async () => {
    if (!editingMeal || !selectedPlan) return

    try {
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

        // Save to backend
        await api.put(`/meal-planning/plans/${selectedPlan.plan_id}`, {
          days: updatedPlan.days,
          updated_at: new Date().toISOString()
        })

        setSelectedPlan(updatedPlan)

        toast({
          title: 'Success',
          description: 'Meal updated and saved successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      }
    } catch (error) {
      console.error('Error saving meal changes:', error)
      toast({
        title: 'Error',
        description: 'Failed to save meal changes',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }

    onEditMealClose()
    setEditingMeal(null)
  }

  // Functions for multi-food logging
  // Note: openMultiFoodLog function removed as it was unused

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
      
      const logPromises = selectedIngredients.map(ingredient => {
        const foodLogEntry = {
          date: multiFoodLog.date,
          meal_type: multiFoodLog.mealType,
          food_id: ingredient.food_id || `ingredient_${ingredient.name.toLowerCase().replace(/\s+/g, '_')}`,
          food_name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          nutrition: {
            calories: ingredient.calories,
            protein: ingredient.protein,
            carbs: ingredient.carbs,
            fat: ingredient.fat
          },
          notes: 'From meal plan'
        }

        return logSingleFoodItem(foodLogEntry)
      })

      await Promise.all(logPromises)

      // Mark meal as logged in the meal plan if all ingredients were selected
      if (selectedIngredients.length === multiFoodLog.ingredients.length && selectedPlan) {
        const updatedPlan = { ...selectedPlan }
        const dayIndex = updatedPlan.days.findIndex(day => day.date === multiFoodLog.date)
        if (dayIndex !== -1) {
          const mealIndex = updatedPlan.days[dayIndex].meals.findIndex(m => 
            m.meal_type === multiFoodLog.mealType
          )
          if (mealIndex !== -1) {
            updatedPlan.days[dayIndex].meals[mealIndex].is_logged = true
            setSelectedPlan(updatedPlan)
          }
        }
      }

      toast({
        title: 'Foods Logged',
        description: `${selectedIngredients.length} item(s) have been logged to your food diary.`,
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

  // Functions for single meal logging
  const openSingleMealLog = (meal: MealPlanMeal, mealType: string) => {
    setSingleMealToLog({
      meal,
      mealType: mealType.toLowerCase()
    })
    onSingleMealLogOpen()
  }

  // Note: saveSingleMealLog function removed as it was unused

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
              <Button
                size="sm"
                colorScheme="green"
                variant="ghost"
                leftIcon={<FiTarget />}
                onClick={() => {
                  setSelectedPlan(plan)
                  onOptimizerOpen()
                }}
              >
                Optimize
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
    <Container maxW="8xl" p={isMobile ? 4 : 6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl" fontWeight="bold">Meal Plans</Text>
            {mealPlans.length > 0 && (
              <HStack spacing={4}>
                <Text fontSize="sm" color="gray.600">Active Plan:</Text>
                <Select 
                  value={selectedPlan?.plan_id || ''} 
                  onChange={(e) => {
                    const plan = mealPlans.find(p => p.plan_id === e.target.value)
                    if (plan) {
                      setSelectedPlan(plan)
                      onDetailsOpen()
                    }
                  }}
                  size="sm"
                  maxW="300px"
                >
                  <option value="">Select a meal plan...</option>
                  {mealPlans.map(plan => (
                    <option key={plan.plan_id} value={plan.plan_id}>
                      {plan.name || plan.title || `Plan ${plan.plan_id.slice(-6)}`} ({plan.total_days} days)
                    </option>
                  ))}
                </Select>
              </HStack>
            )}
          </VStack>
          <HStack spacing={2}>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onCreateOpen}>
              Create New Plan
            </Button>
            <Button 
              leftIcon={<FiPlus />} 
              colorScheme="purple" 
              variant="outline"
              onClick={onBatchLoggerOpen}
            >
              Batch Logger
            </Button>
            <Button 
              leftIcon={<FiTrendingUp />} 
              colorScheme="orange" 
              variant="outline"
              onClick={onRecommendationsOpen}
            >
              Smart Recommendations
            </Button>
            <Button 
              leftIcon={<FiTarget />} 
              colorScheme="green" 
              variant="outline"
              onClick={onNutritionOptOpen}
            >
              Nutrition Optimizer
            </Button>
          </HStack>
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Featured Meal Plan Daily View */}
        {selectedPlan && (
          <Card bg="gradient.linear(to-r, blue.50, purple.50)" borderColor="blue.200" borderWidth={2}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xl" fontWeight="bold" color="blue.800">
                      {selectedPlan.name || selectedPlan.title || 'Active Meal Plan'}
                    </Text>
                    <Text fontSize="sm" color="blue.600">
                      {selectedPlan.total_days} days • Created {new Date(selectedPlan.created_at).toLocaleDateString()}
                    </Text>
                  </VStack>
                  <HStack spacing={2}>
                    <Button 
                      size="sm" 
                      colorScheme="green" 
                      leftIcon={<MdShoppingCart />}
                      onClick={() => generateShoppingList(selectedPlan.plan_id)}
                    >
                      Shopping List
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onDetailsOpen()}
                    >
                      View Details
                    </Button>
                  </HStack>
                </HStack>

                {/* Today's Meals Preview */}
                {selectedPlan.days && selectedPlan.days.length > 0 && (
                  <Box>
                    <Text fontSize="md" fontWeight="semibold" color="blue.700" mb={3}>
                      Today's Meals Preview
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: selectedPlan.days[0].meals?.length || 1 }} spacing={3}>
                      {Array.isArray(selectedPlan.days[0].meals) && selectedPlan.days[0].meals.map((meal, idx) => (
                        <Card key={idx} size="sm" variant="outline">
                          <CardBody>
                            <VStack spacing={2}>
                              <Badge colorScheme="purple" textTransform="capitalize">
                                {meal.meal_type}
                              </Badge>
                              <Text fontSize="sm" fontWeight="bold" textAlign="center">
                                {meal.food_name}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {Math.round(meal.calories)} cal
                              </Text>
                              <Button 
                                size="xs" 
                                colorScheme={meal.is_logged ? "gray" : "green"}
                                onClick={() => openSingleMealLog(meal, meal.meal_type)}
                                isDisabled={meal.is_logged}
                              >
                                {meal.is_logged ? "Logged" : "Log"}
                              </Button>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Meal Plans Grid */}
        {isLoading ? (
          <Flex justify="center" p={8}>
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Loading meal plans...</Text>
            </VStack>
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
              <Button colorScheme="blue" onClick={onCreateOpen} size={isMobile ? "md" : "lg"}>
                Create Your First Meal Plan
              </Button>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={4} align="stretch">
            {/* All Meal Plans Management */}
            <HStack justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                All Meal Plans ({mealPlans.length})
              </Text>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={toggleAllPlans}
                >
                  {isAllPlansOpen ? 'Hide All Plans' : 'View All Plans'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="purple"
                  onClick={onAllPlansModalOpen}
                >
                  Manage Plans
                </Button>
              </HStack>
            </HStack>
            
            {/* Collapsible All Plans Grid */}
            {isAllPlansOpen && (
              <Card variant="outline" bg="gray.50">
                <CardBody>
                  <SimpleGrid columns={cardColumns} spacing={4}>
                    {mealPlans.map(renderMealPlanCard)}
                  </SimpleGrid>
                </CardBody>
              </Card>
            )}
          </VStack>
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

                <DatePicker
                  value={newPlanData.start_date}
                  onChange={(date) => setNewPlanData({ ...newPlanData, start_date: date })}
                  label="Start Date"
                  placeholder="Select when to start this meal plan"
                  helperText="Choose the date when you want to begin following this meal plan"
                  minDate={new Date().toISOString().split('T')[0]} // Can't start in the past
                  isDisabled={isLoading}
                />

                <FormControl>
                  <FormLabel>Number of Days</FormLabel>
                  <NumberInput
                    value={newPlanData.days}
                    onChange={(_, num) => setNewPlanData({ ...newPlanData, days: num || 3 })}
                    min={1}
                    max={5}
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
                  onChange={(macros) => setNewPlanData({ 
                    ...newPlanData, 
                    protein_percent: macros.protein,
                    carbs_percent: macros.carbs,
                    fat_percent: macros.fat
                  })}
                  isDisabled={isLoading}
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

                <FormControl>
                  <FormLabel>Meal Complexity Level</FormLabel>
                  <Select
                    value={newPlanData.complexity_level}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewPlanData({ ...newPlanData, complexity_level: e.target.value })}
                  >
                    <option value="any">Any - Mix of different complexity levels</option>
                    <option value="simple">Simple - Quick meals with 3-5 ingredients (under 15 mins)</option>
                    <option value="moderate">Moderate - Balanced meals with 5-8 ingredients (15-30 mins)</option>
                    <option value="complex">Complex - Elaborate meals with 8+ ingredients (30+ mins)</option>
                  </Select>
                  <FormHelperText>
                    Choose based on your available time and cooking preference
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <HStack>
                    <FormLabel mb={0}>Use Only My Food Index</FormLabel>
                    <Tooltip 
                      label="When enabled, meal plans will only use foods from your personal food index for main ingredients. Pantry staples like oil, salt, and spices are assumed to be available."
                      placement="top"
                    >
                      <Icon as={FiInfo} color="gray.500" />
                    </Tooltip>
                  </HStack>
                  <Switch
                    isChecked={newPlanData.use_food_index_only}
                    onChange={(e) => setNewPlanData({ ...newPlanData, use_food_index_only: e.target.checked })}
                    colorScheme="blue"
                    size="lg"
                  />
                  <FormHelperText>
                    This provides more realistic nutrition results using foods you've already logged.
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Special Requests</FormLabel>
                  <Textarea
                    value={newPlanData.special_requests}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPlanData({ ...newPlanData, special_requests: e.target.value })}
                    placeholder="Any special dietary needs, cooking preferences, meal timing, or other custom requirements..."
                    rows={4}
                    resize="vertical"
                  />
                  <FormHelperText>
                    Provide any custom instructions for your meal plan (e.g., meal prep friendly, specific cooking methods, equipment limitations, etc.)
                  </FormHelperText>
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
        <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size={modalSize}>
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
                          <StatNumber>
                            {(() => {
                              // First try explicit target nutrition
                              if (selectedPlan.target_nutrition?.calories) {
                                return selectedPlan.target_nutrition.calories;
                              }
                              // Then try calories_per_day field
                              if (selectedPlan.calories_per_day) {
                                return selectedPlan.calories_per_day;
                              }
                              // Finally calculate average from actual daily totals
                              if (selectedPlan.days && selectedPlan.days.length > 0) {
                                const totalCalories = selectedPlan.days.reduce((sum, day) => 
                                  sum + (day.total_nutrition?.calories || 0), 0);
                                const avgCalories = Math.round(totalCalories / selectedPlan.days.length);
                                return avgCalories > 0 ? avgCalories : 'N/A';
                              }
                              return 'N/A';
                            })()}
                          </StatNumber>
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
                              {Array.isArray(day.meals) && day.meals.length > 0 ? (
                                day.meals.map((meal, mealIndex) => (
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
                                          onClick={() => openSingleMealLog(meal, meal.meal_type)}
                                          isDisabled={meal.is_logged}
                                        >
                                          {meal.is_logged ? "Already Logged" : "Log Food"}
                                        </Button>
                                        
                                        {meal.ingredients && meal.ingredients.length > 0 && (
                                          <Button
                                            size="sm"
                                            colorScheme="blue"
                                            variant="outline"
                                            leftIcon={<EditIcon />}
                                            onClick={() => openMealEditor(meal, dayIndex)}
                                          >
                                            Edit Recipe
                                          </Button>
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
                              ))
                              ) : (
                                <Text fontSize="sm" color="gray.500" textAlign="center">
                                  No meals planned for this day
                                </Text>
                              )}
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
        <Modal isOpen={isEditMealOpen} onClose={onEditMealClose} size="xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>Edit Meal Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody overflowY="auto" maxH="70vh">
              {editingMeal && (
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Meal Name</FormLabel>
                    <Input
                      value={editingMeal.meal.food_name}
                      onChange={(e) => setEditingMeal({
                        ...editingMeal,
                        meal: { ...editingMeal.meal, food_name: e.target.value }
                      })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Preparation Notes</FormLabel>
                    <Input
                      value={editingMeal.meal.preparation_notes || ''}
                      onChange={(e) => setEditingMeal({
                        ...editingMeal,
                        meal: { ...editingMeal.meal, preparation_notes: e.target.value }
                      })}
                      placeholder="Add preparation notes..."
                    />
                  </FormControl>

                  <Box>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="bold">Ingredients</Text>
                      <Button size="sm" onClick={addNewIngredient} leftIcon={<AddIcon />}>
                        Add Ingredient
                      </Button>
                    </HStack>
                    
                    {editingMeal.meal.ingredients?.map((ingredient, idx) => (
                      <Card key={idx} variant="outline" mb={3}>
                        <CardBody>
                          <VStack spacing={3}>
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} w="full">
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
                            
                            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} w="full">
                              <FormControl>
                                <FormLabel fontSize="xs">Calories</FormLabel>
                                <NumberInput
                                  value={ingredient.calories || 0}
                                  onChange={(_, num) => updateIngredient(idx, 'calories', num || 0)}
                                  size="sm"
                                  min={0}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs">Protein (g)</FormLabel>
                                <NumberInput
                                  value={ingredient.protein || 0}
                                  onChange={(_, num) => updateIngredient(idx, 'protein', num || 0)}
                                  size="sm"
                                  min={0}
                                  step={0.1}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs">Carbs (g)</FormLabel>
                                <NumberInput
                                  value={ingredient.carbs || 0}
                                  onChange={(_, num) => updateIngredient(idx, 'carbs', num || 0)}
                                  size="sm"
                                  min={0}
                                  step={0.1}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="xs">Fat (g)</FormLabel>
                                <NumberInput
                                  value={ingredient.fat || 0}
                                  onChange={(_, num) => updateIngredient(idx, 'fat', num || 0)}
                                  size="sm"
                                  min={0}
                                  step={0.1}
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>
                            </SimpleGrid>
                            
                            <HStack justify="end" w="full">
                              <IconButton
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                aria-label="Remove ingredient"
                                icon={<DeleteIcon />}
                                onClick={() => removeIngredient(idx)}
                              />
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </Box>

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
            <ModalHeader>
              <VStack align="start" spacing={1}>
                <Text>Log Food Items</Text>
                <Text fontSize="sm" color="gray.600">
                  {multiFoodLog && `${multiFoodLog.mealType} on ${multiFoodLog.date}`}
                </Text>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {multiFoodLog && (
                <VStack spacing={4} align="stretch">
                  <Alert status="info" variant="left-accent">
                    <AlertIcon />
                    <Box>
                      <Text fontSize="sm">
                        Select which items to log and adjust amounts/nutrition as needed.
                      </Text>
                    </Box>
                  </Alert>
                  
                  {multiFoodLog.ingredients.map((ingredient, idx) => (
                    <Card key={idx} variant={ingredient.selected ? "solid" : "outline"} 
                          colorScheme={ingredient.selected ? "blue" : undefined}>
                      <CardBody>
                        <VStack spacing={4}>
                          <HStack w="full" justify="space-between">
                            <HStack spacing={3}>
                              <Checkbox
                                isChecked={ingredient.selected}
                                onChange={(e) => updateMultiFoodIngredient(idx, 'selected', e.target.checked)}
                                size="lg"
                              />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" fontSize="lg">{ingredient.name}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {ingredient.amount} {ingredient.unit}
                                </Text>
                              </VStack>
                            </HStack>
                            <VStack align="end" spacing={0}>
                              <Text fontWeight="bold" color="green.600">
                                {Math.round(ingredient.calories)} cal
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                P:{Math.round(ingredient.protein)}g C:{Math.round(ingredient.carbs)}g F:{Math.round(ingredient.fat)}g
                              </Text>
                            </VStack>
                          </HStack>
                          
                          {ingredient.selected && (
                            <VStack spacing={3} w="full" bg="gray.50" p={3} borderRadius="md">
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="full">
                                <FormControl>
                                  <FormLabel fontSize="sm">Amount</FormLabel>
                                  <NumberInput
                                    value={ingredient.amount}
                                    onChange={(_, num) => updateMultiFoodIngredient(idx, 'amount', num || 0)}
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
                                    onChange={(e) => updateMultiFoodIngredient(idx, 'unit', e.target.value)}
                                    size="sm"
                                  />
                                </FormControl>
                              </SimpleGrid>
                              
                              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} w="full">
                                <FormControl>
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
                                <FormControl>
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
                                <FormControl>
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
                                <FormControl>
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
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}

                  {/* Summary */}
                  <Card bg="green.50" borderColor="green.200">
                    <CardBody>
                      <VStack spacing={2}>
                        <Text fontWeight="bold" color="green.800">
                          Selected Items Summary
                        </Text>
                        <SimpleGrid columns={4} spacing={2} w="full">
                          <Stat size="sm">
                            <StatLabel color="green.700">Total Calories</StatLabel>
                            <StatNumber color="green.800">
                              {Math.round(multiFoodLog.ingredients
                                .filter(ing => ing.selected)
                                .reduce((sum, ing) => sum + ing.calories, 0))}
                            </StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel color="green.700">Protein</StatLabel>
                            <StatNumber color="green.800">
                              {Math.round(multiFoodLog.ingredients
                                .filter(ing => ing.selected)
                                .reduce((sum, ing) => sum + ing.protein, 0))}g
                            </StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel color="green.700">Carbs</StatLabel>
                            <StatNumber color="green.800">
                              {Math.round(multiFoodLog.ingredients
                                .filter(ing => ing.selected)
                                .reduce((sum, ing) => sum + ing.carbs, 0))}g
                            </StatNumber>
                          </Stat>
                          <Stat size="sm">
                            <StatLabel color="green.700">Fat</StatLabel>
                            <StatNumber color="green.800">
                              {Math.round(multiFoodLog.ingredients
                                .filter(ing => ing.selected)
                                .reduce((sum, ing) => sum + ing.fat, 0))}g
                            </StatNumber>
                          </Stat>
                        </SimpleGrid>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onMultiFoodLogClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="green" 
                onClick={logMultipleFoods}
                isDisabled={!multiFoodLog?.ingredients.some(ing => ing.selected)}
              >
                Log Selected Items ({multiFoodLog?.ingredients.filter(ing => ing.selected).length || 0})
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Enhanced Shopping List Modal */}
        <Modal isOpen={isShoppingOpen} onClose={onShoppingClose} size="xl">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>
              <HStack>
                <MdShoppingCart />
                <Text>Smart Shopping List</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={0}>
              {shoppingListData ? (
                <EnhancedShoppingList
                  shoppingList={shoppingListData}
                  onUpdate={(updatedList) => setShoppingListData(updatedList)}
                  onRefresh={() => currentShoppingPlanId && generateShoppingList(currentShoppingPlanId, true)}
                  isLoading={isLoading}
                />
              ) : (
                <Box p={6} textAlign="center">
                  <Text>No shopping list available</Text>
                </Box>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onShoppingClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Single Meal Food Logging Modal */}
        {singleMealToLog && (
          <LogMealFoodModal 
            isOpen={isSingleMealLogOpen} 
            onClose={() => {
              onSingleMealLogClose();
              setSingleMealToLog(null);
            }}
            onSuccess={() => {
              fetchMealPlans();
              toast({
                title: 'Food logged successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            }}
            meal={singleMealToLog.meal}
            mealType={singleMealToLog.mealType}
          />
        )}

        {/* Manage All Meal Plans Modal */}
        <Modal isOpen={isAllPlansModalOpen} onClose={onAllPlansModalClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>
              <HStack>
                <Text>Manage All Meal Plans</Text>
                <Badge colorScheme="blue">{mealPlans.length} Plans</Badge>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody overflowY="auto" maxH="70vh">
              <VStack spacing={4} align="stretch">
                {mealPlans.length === 0 ? (
                  <Card>
                    <CardBody textAlign="center" py={8}>
                      <Text fontSize="lg" color="gray.500" mb={4}>
                        No meal plans found
                      </Text>
                      <Button colorScheme="blue" onClick={() => {
                        onAllPlansModalClose();
                        onCreateOpen();
                      }}>
                        Create Your First Meal Plan
                      </Button>
                    </CardBody>
                  </Card>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {mealPlans.map((plan) => (
                      <Card key={plan.plan_id} cursor="pointer" 
                            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                            borderColor={selectedPlan?.plan_id === plan.plan_id ? 'blue.500' : 'gray.200'}
                            borderWidth={selectedPlan?.plan_id === plan.plan_id ? 2 : 1}>
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                                  {plan.name || plan.title || `Plan ${plan.plan_id.slice(-6)}`}
                                </Text>
                                <HStack spacing={2}>
                                  <Badge colorScheme="purple">{plan.total_days} days</Badge>
                                  {selectedPlan?.plan_id === plan.plan_id && (
                                    <Badge colorScheme="green">Active</Badge>
                                  )}
                                </HStack>
                              </VStack>
                              <IconButton
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                aria-label="Delete plan"
                                icon={<DeleteIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMealPlan(plan.plan_id);
                                }}
                              />
                            </HStack>
                            
                            <Text fontSize="sm" color="gray.600">
                              Created: {new Date(plan.created_at).toLocaleDateString()}
                            </Text>
                            
                            {/* Quick nutrition overview */}
                            <SimpleGrid columns={2} spacing={2}>
                              <Stat size="sm">
                                <StatLabel fontSize="xs">Avg Calories</StatLabel>
                                <StatNumber fontSize="sm">
                                  {(() => {
                                    if (plan.target_nutrition?.calories) {
                                      return plan.target_nutrition.calories;
                                    }
                                    if (plan.calories_per_day) {
                                      return plan.calories_per_day;
                                    }
                                    if (plan.days && plan.days.length > 0) {
                                      const totalCalories = plan.days.reduce((sum, day) => 
                                        sum + (day.total_nutrition?.calories || 0), 0);
                                      return Math.round(totalCalories / plan.days.length);
                                    }
                                    return 'N/A';
                                  })()}
                                </StatNumber>
                              </Stat>
                              <Stat size="sm">
                                <StatLabel fontSize="xs">Restrictions</StatLabel>
                                <StatNumber fontSize="sm">
                                  {plan.dietary_restrictions?.length || 0}
                                </StatNumber>
                              </Stat>
                            </SimpleGrid>
                            
                            <HStack spacing={2}>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                variant={selectedPlan?.plan_id === plan.plan_id ? "solid" : "outline"}
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  onAllPlansModalClose();
                                }}
                                flex={1}
                              >
                                {selectedPlan?.plan_id === plan.plan_id ? "Current" : "Select"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  onAllPlansModalClose();
                                  onDetailsOpen();
                                }}
                              >
                                Details
                              </Button>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAllPlansModalClose}>
                Close
              </Button>
              <Button colorScheme="blue" onClick={() => {
                onAllPlansModalClose();
                onCreateOpen();
              }}>
                Create New Plan
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Phase 3 Advanced Features Modals */}
        
        {/* Batch Meal Logger Modal */}
        <Modal isOpen={isBatchLoggerOpen} onClose={onBatchLoggerClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>Batch Meal Logger</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <BatchMealLogger 
                mealPlan={selectedPlan}
                onLogComplete={(loggedItems) => {
                  toast({
                    title: 'Batch Logged Successfully',
                    description: `${loggedItems.length} items logged successfully`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                  })
                  onBatchLoggerClose()
                }}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Meal Plan Optimizer Modal */}
        <Modal isOpen={isOptimizerOpen} onClose={onOptimizerClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>Meal Plan Optimizer</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedPlan ? (
                <MealPlanOptimizer 
                  planId={selectedPlan.plan_id}
                />
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  <AlertTitle>No Meal Plan Selected</AlertTitle>
                  <AlertDescription>
                    Please select a meal plan to optimize.
                  </AlertDescription>
                </Alert>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Smart Meal Recommendations Modal */}
        <Modal isOpen={isRecommendationsOpen} onClose={onRecommendationsClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>Smart Meal Recommendations</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SmartMealRecommendations 
                mealType="lunch"
                onRecommendationSelect={(recommendation) => {
                  toast({
                    title: 'Recommendation Selected',
                    description: `${recommendation.name} has been selected`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                  })
                  onRecommendationsClose()
                }}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Nutrition Optimization Modal */}
        <Modal isOpen={isNutritionOptOpen} onClose={onNutritionOptClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>Nutrition Optimization</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <NutritionOptimizationSuggestions 
                onSuggestionApply={(suggestion) => {
                  toast({
                    title: 'Optimization Applied',
                    description: `${suggestion.nutrient} optimization applied`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                  })
                }}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  )
}

export default MealPlans
