import { useState, useEffect } from 'react'
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
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  SimpleGrid,
  Divider,
  IconButton,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  useToast,
  useDisclosure,
  Container,
  Heading,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Checkbox,
  CheckboxGroup,
  Stack,
} from '@chakra-ui/react'
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiPlay, 
  FiPause,
  FiCalendar,
  FiGrid,
  FiList,
  FiEye,
  FiChevronLeft,
  FiMoreVertical,
  FiCopy,
  FiSave,
  FiTrendingUp,
  FiCheckCircle,
  FiRefreshCw,
  FiDownload,
  FiShare,
  FiBarChart,
} from 'react-icons/fi'
import { MdDragIndicator } from 'react-icons/md'
import api from '../utils/api'
import QuantityUnitInput from '../components/QuantityUnitInput'
import { calculateNutritionForQuantity } from '../utils/unitConversion'

// Types
interface ManualMealFood {
  food_id: string
  food_name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
}

interface ManualMealPlan {
  id: string
  user_id: string
  plan_id: string
  name: string
  title: string
  description: string
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
  type: string
  days: {
    day_number: number
    date: string | null
    meals: {
      breakfast: ManualMealFood[]
      lunch: ManualMealFood[]
      dinner: ManualMealFood[]
      snacks: ManualMealFood[]
    }
    daily_totals: {
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber: number
      sugar: number
      sodium: number
    }
  }[]
  total_days: number
  dietary_restrictions: string[]
  target_nutrition: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
  notes: string
}

interface CreateManualMealPlanRequest {
  name: string
  description: string
  duration_days: number
}

interface Food {
  id: string
  name: string
  brand?: string
  serving_size: number
  serving_unit: string
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }
  source: string
  barcode?: string
  dietary_attributes?: {
    dietary_restrictions: string[]
    allergens: string[]
    food_categories: string[]
  }
}

export default function ManualMealPlanner() {
  const toast = useToast()
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const headingColor = useColorModeValue('gray.800', 'white')
  
  // Color mode values - moved to top level to fix hooks order issue
  const foodItemBg = useColorModeValue('gray.50', 'gray.700')
  const foodItemHoverBg = useColorModeValue('gray.100', 'gray.600')
  const mealTotalBg = useColorModeValue('green.50', 'green.900')
  const mealTotalBorderColor = useColorModeValue('green.200', 'green.600')
  
  // State
  const [plans, setPlans] = useState<ManualMealPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<ManualMealPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [foods, setFoods] = useState<Food[]>([])
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snacks'>('breakfast')
  const [isCreating, setIsCreating] = useState(false)
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isFoodPickerOpen, onOpen: onFoodPickerOpen, onClose: onFoodPickerClose } = useDisclosure()
  
  // Form states
  const [formData, setFormData] = useState<CreateManualMealPlanRequest>({
    name: '',
    description: '',
    duration_days: 3
  })

  const [foodSearchTerm, setFoodSearchTerm] = useState('')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [foodQuantity, setFoodQuantity] = useState(100)
  const [foodUnit, setFoodUnit] = useState('g')
  
  // Phase 2 & 3 Enhancement States
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [draggedFood, setDraggedFood] = useState<any>(null)
  const [draggedFromSlot, setDraggedFromSlot] = useState<{day: number, meal: string} | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [copyFromDay, setCopyFromDay] = useState(1)
  const [copyToDay, setCopyToDay] = useState(1)
  const [selectedFoodsForLog, setSelectedFoodsForLog] = useState<Set<string>>(new Set())
  
  // Additional modal states
  const { isOpen: isTemplateModalOpen, onOpen: onTemplateModalOpen, onClose: onTemplateModalClose } = useDisclosure()
  const { isOpen: isCopyDayModalOpen, onOpen: onCopyDayModalOpen, onClose: onCopyDayModalClose } = useDisclosure()
  const { isOpen: isLogDayModalOpen, onOpen: onLogDayModalOpen, onClose: onLogDayModalClose } = useDisclosure()
  const { isOpen: isAnalyticsModalOpen, onOpen: onAnalyticsModalOpen, onClose: onAnalyticsModalClose } = useDisclosure()
  const { isOpen: isSuggestionsModalOpen, onOpen: onSuggestionsModalOpen, onClose: onSuggestionsModalClose } = useDisclosure()
  const { isOpen: isShareModalOpen, onOpen: onShareModalOpen, onClose: onShareModalClose } = useDisclosure()

  // Load plans
  const loadPlans = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await api.get('/meal-planning/manual/plans')
      
      const data = response.data
      setPlans(data.plans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans')
      toast({
        title: 'Error',
        description: 'Failed to load meal plans',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load foods
  const loadFoods = async () => {
    try {
      const response = await api.get(`/foods/search?q=${encodeURIComponent(foodSearchTerm)}&limit=50`)
      
      const data = response.data
      setFoods(data || [])
    } catch (err) {
      console.error('Error loading foods:', err)
    }
  }

  // Create plan
  const createPlan = async () => {
    try {
      setIsCreating(true)
      
      await api.post('/meal-planning/manual/create', formData)
      
      toast({
        title: 'Success',
        description: 'Meal plan created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      onCreateClose()
      setFormData({ name: '', description: '', duration_days: 3 })
      loadPlans()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create plan',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Load plan details
  const loadPlanDetails = async (planId: string) => {
    try {
      const response = await api.get(`/meal-planning/manual/plans/${planId}`)
      
      const data = response.data
      setSelectedPlan(data.plan)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load plan details',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Add food to meal
  const addFoodToMeal = async () => {
    if (!selectedPlan || !selectedFood) return

    try {
      // Calculate nutrition using unit conversion
      const calculatedNutrition = calculateNutritionForQuantity(
        selectedFood.nutrition,
        selectedFood.serving_size,
        selectedFood.serving_unit,
        foodQuantity,
        foodUnit
      )
      
      // If conversion failed, fall back to simple ratio calculation
      let finalNutrition
      if (calculatedNutrition) {
        finalNutrition = calculatedNutrition
      } else {
        // Fallback: simple ratio calculation (assumes same units)
        const nutritionRatio = foodQuantity / selectedFood.serving_size
        finalNutrition = {
          calories: selectedFood.nutrition.calories * nutritionRatio,
          protein: selectedFood.nutrition.protein * nutritionRatio,
          carbs: selectedFood.nutrition.carbs * nutritionRatio,
          fat: selectedFood.nutrition.fat * nutritionRatio,
          fiber: selectedFood.nutrition.fiber * nutritionRatio,
          sugar: selectedFood.nutrition.sugar * nutritionRatio,
          sodium: selectedFood.nutrition.sodium * nutritionRatio
        }
      }

      const foodToAdd = {
        food_id: selectedFood.id,
        food_name: selectedFood.name,
        quantity: foodQuantity,
        unit: foodUnit,
        ...finalNutrition
      }
      
      await api.post(`/meal-planning/manual/plans/${selectedPlan.plan_id}/add-food`, {
        day_number: selectedDay,
        meal_type: selectedMeal,
        food: foodToAdd
      })
      
      toast({
        title: 'Success',
        description: 'Food added to meal successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      onFoodPickerClose()
      setSelectedFood(null)
      setFoodQuantity(100)
      setFoodUnit('g')
      loadPlanDetails(selectedPlan.plan_id)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add food',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Delete plan
  const deletePlan = async (planId: string) => {
    try {
      await api.delete(`/meal-planning/manual/plans/${planId}`)
      
      toast({
        title: 'Success',
        description: 'Plan deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      loadPlans()
      if (selectedPlan?.id === planId) {
        setSelectedPlan(null)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete plan',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Activate plan
  const activatePlan = async (planId: string) => {
    try {
      await api.post(`/meal-planning/manual/plans/${planId}/activate`)
      
      toast({
        title: 'Success',
        description: 'Plan activated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      loadPlans()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to activate plan',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Phase 2 & 3 Enhancement Functions
  
  // Load AI suggestions for specific meal slot
  const loadAiSuggestions = async (planId: string, dayNumber: number, mealType: string) => {
    try {
      const response = await api.get(`/meal-planning/manual/suggestions?plan_id=${planId}&day_number=${dayNumber}&meal_type=${mealType}`)
      setAiSuggestions(response.data.suggestions || [])
      onSuggestionsModalOpen()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load AI suggestions',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Load templates
  const loadTemplates = async () => {
    try {
      const response = await api.get('/meal-planning/manual/templates')
      
      const data = response.data
      setTemplates(data.templates || [])
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Save plan as template
  const saveAsTemplate = async (planId: string, name: string) => {
    try {
      await api.post(`/meal-planning/manual/plans/${planId}/save-template`, { 
        template_name: name 
      })
      
      toast({
        title: 'Success',
        description: 'Plan saved as template successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      onTemplateModalClose()
      setTemplateName('')
      loadTemplates()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save template',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Create plan from template
  const createFromTemplate = async (templateId: string, planName: string) => {
    try {
      await api.post(`/meal-planning/manual/create-from-template`, { 
        template_id: templateId, 
        plan_name: planName 
      })
      
      toast({
        title: 'Success',
        description: 'Plan created from template successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      loadPlans()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create plan from template',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Copy day
  const copyDay = async (planId: string, sourceDay: number, targetDay: number) => {
    try {
      await api.post(`/meal-planning/manual/plans/${planId}/copy-day`, { 
        source_day: sourceDay, 
        target_day: targetDay 
      })
      
      toast({
        title: 'Success',
        description: `Day ${sourceDay} copied to Day ${targetDay}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      onCopyDayModalClose()
      if (selectedPlan) {
        loadPlanDetails(selectedPlan.plan_id)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy day',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Log day's meals to food diary
  const logDayMeals = async (planId: string, dayNumber: number, mealTypes: string[]) => {
    try {
      const response = await api.post(`/meal-planning/manual/plans/${planId}/log-day`, { 
        day_number: dayNumber,
        meal_types: mealTypes,
        log_date: new Date().toISOString().split('T')[0]
      })
      
      toast({
        title: 'Success',
        description: `Logged ${response.data.logged_meals?.length || 0} meals to food diary`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      onLogDayModalClose()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to log meals',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Remove food from meal
  const removeFoodFromMeal = async (planId: string, dayNumber: number, mealType: string, foodIndex: number) => {
    try {
      await api.delete(`/meal-planning/manual/plans/${planId}/remove-food?day_number=${dayNumber}&meal_type=${mealType}&food_index=${foodIndex}`)
      
      toast({
        title: 'Success',
        description: 'Food removed from meal',
        status: 'success',
        duration: 2000,
        isClosable: true
      })
      
      loadPlanDetails(planId)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove food',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Drag and drop handlers
  const handleDragStart = (food: ManualMealFood, day: number, meal: string) => {
    setDraggedFood(food)
    setDraggedFromSlot({ day, meal })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetDay: number, targetMeal: string) => {
    e.preventDefault()
    
    if (!draggedFood || !draggedFromSlot || !selectedPlan) return
    
    // If dropping in same slot, do nothing
    if (draggedFromSlot.day === targetDay && draggedFromSlot.meal === targetMeal) {
      setDraggedFood(null)
      setDraggedFromSlot(null)
      return
    }
    
    // Remove from original slot
    const sourceDay = selectedPlan.days.find(d => d.day_number === draggedFromSlot.day)
    const sourceMeals = sourceDay?.meals[draggedFromSlot.meal as keyof typeof sourceDay.meals]
    const foodIndex = sourceMeals?.findIndex(f => f.food_id === draggedFood.food_id)
    
    if (foodIndex !== undefined && foodIndex >= 0) {
      await removeFoodFromMeal(selectedPlan.plan_id, draggedFromSlot.day, draggedFromSlot.meal, foodIndex)
    }
    
    // Add to new slot
    await addFoodToMealSlot(selectedPlan.plan_id, targetDay, targetMeal, draggedFood)
    
    setDraggedFood(null)
    setDraggedFromSlot(null)
  }

  const addFoodToMealSlot = async (planId: string, dayNumber: number, mealType: string, food: ManualMealFood) => {
    try {
      await api.post(`/meal-planning/manual/plans/${planId}/add-food`, {
        day_number: dayNumber,
        meal_type: mealType,
        food: food
      })
      
      loadPlanDetails(planId)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to move food',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Social sharing and export functions
  const shareViaLink = async (planId: string) => {
    try {
      const shareableLink = `${window.location.origin}/meal-plans/shared/${planId}`
      await navigator.clipboard.writeText(shareableLink)
      toast({
        title: 'Link Copied!',
        description: 'Shareable link has been copied to clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const exportToPDF = async (planId: string) => {
    try {
      const response = await api.get(`/meal-planning/manual/plans/${planId}/export/pdf`, {
        responseType: 'blob'
      })
      
      const blob = response.data
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meal-plan-${selectedPlan?.name || 'plan'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Success',
        description: 'Meal plan exported as PDF',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const exportToGroceryList = async (planId: string) => {
    try {
      const response = await api.get(`/meal-planning/manual/plans/${planId}/export/grocery-list`)
      
      const groceryListText = response.data.grocery_list.map((item: any) => 
        `${item.quantity} ${item.unit} ${item.name}`
      ).join('\n')
      
      await navigator.clipboard.writeText(groceryListText)
      
      toast({
        title: 'Success',
        description: 'Grocery list copied to clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to generate grocery list',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const shareToSocialMedia = (platform: string, planId: string) => {
    const shareText = `Check out my meal plan: ${selectedPlan?.name || 'Custom Meal Plan'}`
    const shareUrl = `${window.location.origin}/meal-plans/shared/${planId}`
    
    let url = ''
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        toast({
          title: 'Text Copied!',
          description: 'Share text copied to clipboard. You can paste it in your Instagram story or post.',
          status: 'success',
          duration: 5000,
          isClosable: true
        })
        return
      default:
        return
    }
    
    window.open(url, '_blank', 'width=600,height=400')
  }

  // Effects
  useEffect(() => {
    loadPlans()
    loadTemplates()
  }, [])

  useEffect(() => {
    if (foodSearchTerm) {
      const timer = setTimeout(() => {
        loadFoods()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [foodSearchTerm])

  // Helper functions
  const getMealFoods = (plan: ManualMealPlan, day: number, meal: string) => {
    const dayData = plan.days.find(d => d.day_number === day)
    if (!dayData) return []
    return dayData.meals[meal as keyof typeof dayData.meals] || []
  }

  const getDayNutrition = (plan: ManualMealPlan, day: number) => {
    const dayData = plan.days.find(d => d.day_number === day)
    if (!dayData) return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    return dayData.daily_totals
  }

  const getTotalNutrition = (plan: ManualMealPlan) => {
    return plan.days.reduce((total, day) => ({
      calories: total.calories + day.daily_totals.calories,
      protein: total.protein + day.daily_totals.protein,
      carbs: total.carbs + day.daily_totals.carbs,
      fat: total.fat + day.daily_totals.fat,
      fiber: total.fiber + day.daily_totals.fiber,
      sugar: total.sugar + day.daily_totals.sugar,
      sodium: total.sodium + day.daily_totals.sodium
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 })
  }

  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(foodSearchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={6}>
        <Flex justify="center" align="center" h="400px">
          <Spinner size="xl" color="green.500" />
        </Flex>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" color={headingColor} mb={2}>
            Manual Meal Plan Builder
          </Heading>
          <Text color={textColor} fontSize="md">
            Create custom meal plans with complete control over every meal and ingredient
          </Text>
        </Box>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Main Content */}
        {!selectedPlan ? (
          <Box>
            {/* Controls */}
            <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
              <HStack spacing={4}>
                <Input
                  placeholder="Search plans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  maxW="300px"
                />
                <IconButton
                  aria-label="Grid view"
                  icon={<FiGrid />}
                  variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                />
                <IconButton
                  aria-label="List view"
                  icon={<FiList />}
                  variant={viewMode === 'list' ? 'solid' : 'ghost'}
                  onClick={() => setViewMode('list')}
                />
              </HStack>
              
              <HStack spacing={2}>
                <Menu>
                  <MenuButton as={Button} size="sm" leftIcon={<FiSave />}>
                    Templates
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={onTemplateModalOpen}>
                      Manage Templates
                    </MenuItem>
                    <MenuDivider />
                    {templates.map((template) => (
                      <MenuItem key={template.id} onClick={() => {
                        const planName = prompt('Enter name for new plan:')
                        if (planName) {
                          createFromTemplate(template.id, planName)
                        }
                      }}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
                
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="green"
                  onClick={onCreateOpen}
                >
                  Create New Plan
                </Button>
              </HStack>
            </Flex>

            {/* Plans Grid/List */}
            {filteredPlans.length === 0 ? (
              <Card>
                <CardBody>
                  <VStack py={8} spacing={4}>
                    <FiCalendar size={48} color="gray.400" />
                    <Text color={textColor}>No meal plans found</Text>
                    <Button
                      colorScheme="green"
                      onClick={onCreateOpen}
                      leftIcon={<FiPlus />}
                    >
                      Create Your First Plan
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {filteredPlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    cursor="pointer"
                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    onClick={() => loadPlanDetails(plan.plan_id)}
                  >
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold" fontSize="lg">
                              {plan.name}
                            </Text>
                            <Text color={textColor} fontSize="sm">
                              {plan.duration_days} days
                            </Text>
                          </VStack>
                          <HStack spacing={2}>
                            {plan.is_active && (
                              <Badge colorScheme="green">Active</Badge>
                            )}
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <MenuList>
                                <MenuItem icon={<FiEye />} onClick={(e) => {
                                  e.stopPropagation()
                                  loadPlanDetails(plan.plan_id)
                                }}>
                                  View Details
                                </MenuItem>
                                <MenuItem icon={<FiEdit2 />} onClick={(e) => {
                                  e.stopPropagation()
                                  toast({
                                    title: 'Coming Soon',
                                    description: 'Plan editing feature will be added soon',
                                    status: 'info',
                                    duration: 3000,
                                    isClosable: true
                                  })
                                }}>
                                  Edit Plan
                                </MenuItem>
                                <MenuItem icon={<FiPlay />} onClick={(e) => {
                                  e.stopPropagation()
                                  activatePlan(plan.id)
                                }}>
                                  {plan.is_active ? 'Deactivate' : 'Activate'}
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem icon={<FiSave />} onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPlan(plan)
                                  onTemplateModalOpen()
                                }}>
                                  Save as Template
                                </MenuItem>
                                <MenuItem icon={<FiCopy />} onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPlan(plan)
                                  onCopyDayModalOpen()
                                }}>
                                  Copy Day
                                </MenuItem>
                                <MenuItem icon={<FiTrendingUp />} onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPlan(plan)
                                  onAnalyticsModalOpen()
                                }}>
                                  Analytics
                                </MenuItem>
                                <MenuItem icon={<FiShare />} onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPlan(plan)
                                  onShareModalOpen()
                                }}>
                                  Share & Export
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem icon={<FiCopy />} onClick={(e) => {
                                  e.stopPropagation()
                                  const newPlan = { ...formData, name: `Copy of ${plan.name}` }
                                  setFormData(newPlan)
                                  onCreateOpen()
                                }}>
                                  Duplicate Plan
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem icon={<FiTrash2 />} color="red.500" onClick={(e) => {
                                  e.stopPropagation()
                                  deletePlan(plan.id)
                                }}>
                                  Delete
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </HStack>
                        </HStack>
                        
                        <Text color={textColor} fontSize="sm">
                          {plan.description}
                        </Text>
                        
                        <Divider />
                        
                        <SimpleGrid columns={3} spacing={4}>
                          <Stat>
                            <StatLabel fontSize="xs">Calories</StatLabel>
                            <StatNumber fontSize="sm">
                              {Math.round(getTotalNutrition(plan).calories)}
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel fontSize="xs">Protein</StatLabel>
                            <StatNumber fontSize="sm">
                              {Math.round(getTotalNutrition(plan).protein)}g
                            </StatNumber>
                          </Stat>
                          <Stat>
                            <StatLabel fontSize="xs">Carbs</StatLabel>
                            <StatNumber fontSize="sm">
                              {Math.round(getTotalNutrition(plan).carbs)}g
                            </StatNumber>
                          </Stat>
                        </SimpleGrid>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Box>
        ) : (
          /* Plan Details View */
          <Box>
            {/* Plan Header */}
            <Card mb={6}>
              <CardBody>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Button
                        leftIcon={<FiChevronLeft />}
                        variant="ghost"
                        onClick={() => setSelectedPlan(null)}
                      >
                        Back to Plans
                      </Button>
                    </HStack>
                    <Heading size="lg">{selectedPlan.name}</Heading>
                    <Text color={textColor}>{selectedPlan.description}</Text>
                    <HStack spacing={4}>
                      <Badge colorScheme="blue">{selectedPlan.duration_days} days</Badge>
                      {selectedPlan.is_active && (
                        <Badge colorScheme="green">Active</Badge>
                      )}
                    </HStack>
                  </VStack>
                  
                  <VStack align="end" spacing={2}>
                    <HStack spacing={2}>
                      <Button
                        leftIcon={<FiEdit2 />}
                        size="sm"
                        onClick={() => {
                          toast({
                            title: 'Coming Soon',
                            description: 'Plan editing feature will be added soon',
                            status: 'info',
                            duration: 3000,
                            isClosable: true
                          })
                        }}
                      >
                        Edit Plan
                      </Button>
                      <Button
                        leftIcon={selectedPlan.is_active ? <FiPause /> : <FiPlay />}
                        colorScheme={selectedPlan.is_active ? 'red' : 'green'}
                        size="sm"
                        onClick={() => activatePlan(selectedPlan.plan_id)}
                      >
                        {selectedPlan.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </HStack>
                    <HStack spacing={2}>
                      <Button
                        leftIcon={<FiSave />}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onTemplateModalOpen()
                        }}
                      >
                        Save as Template
                      </Button>
                      <Button
                        leftIcon={<FiCopy />}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onCopyDayModalOpen()
                        }}
                      >
                        Copy Day
                      </Button>
                      <Button
                        leftIcon={<FiCheckCircle />}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onLogDayModalOpen()
                        }}
                      >
                        Log Day
                      </Button>
                      <Button
                        leftIcon={<FiBarChart />}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onAnalyticsModalOpen()
                        }}
                      >
                        Analytics
                      </Button>
                      <Button
                        leftIcon={<FiShare />}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onShareModalOpen()
                        }}
                      >
                        Share
                      </Button>
                      <Menu>
                        <MenuButton
                          as={Button}
                          size="sm"
                          variant="outline"
                          leftIcon={<FiMoreVertical />}
                        >
                          Bulk Actions
                        </MenuButton>
                        <MenuList>
                          <MenuItem onClick={() => {
                            // Clear all meals for selected day
                            if (confirm(`Are you sure you want to clear all meals for Day ${selectedDay}?`)) {
                              // This would call a bulk clear endpoint
                              toast({
                                title: 'Feature Coming Soon',
                                description: 'Bulk clear functionality will be added soon',
                                status: 'info',
                                duration: 3000,
                                isClosable: true
                              })
                            }
                          }}>
                            Clear Day
                          </MenuItem>
                          <MenuItem onClick={() => {
                            // Duplicate all meals from one day to another
                            onCopyDayModalOpen()
                          }}>
                            Copy Day
                          </MenuItem>
                          <MenuItem onClick={() => {
                            // Auto-fill day with AI suggestions
                            toast({
                              title: 'Feature Coming Soon',
                              description: 'AI auto-fill functionality will be added soon',
                              status: 'info',
                              duration: 3000,
                              isClosable: true
                            })
                          }}>
                            AI Auto-Fill Day
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </HStack>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>

            {/* Nutrition Overview */}
            <Card mb={6}>
              <CardBody>
                <Text fontWeight="bold" mb={4}>Total Nutrition (All Days)</Text>
                <SimpleGrid columns={{ base: 3, md: 7 }} spacing={4}>
                  <Stat>
                    <StatLabel>Calories</StatLabel>
                    <StatNumber>{Math.round(getTotalNutrition(selectedPlan).calories)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Protein</StatLabel>
                    <StatNumber>{Math.round(getTotalNutrition(selectedPlan).protein)}g</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Carbs</StatLabel>
                    <StatNumber>{Math.round(getTotalNutrition(selectedPlan).carbs)}g</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Fat</StatLabel>
                    <StatNumber>{Math.round(getTotalNutrition(selectedPlan).fat)}g</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Fiber</StatLabel>
                    <StatNumber>{Math.round(getTotalNutrition(selectedPlan).fiber)}g</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Sugar</StatLabel>
                    <StatNumber>{Math.round(getTotalNutrition(selectedPlan).sugar)}g</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Sodium</StatLabel>
                    <StatNumber>{Math.round(getTotalNutrition(selectedPlan).sodium)}mg</StatNumber>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Day Tabs */}
            <Card>
              <CardBody>
                <Tabs 
                  index={selectedDay - 1}
                  onChange={(index) => setSelectedDay(index + 1)}
                  variant="enclosed"
                >
                  <TabList>
                    {Array.from({ length: selectedPlan.duration_days }, (_, i) => (
                      <Tab key={i + 1}>Day {i + 1}</Tab>
                    ))}
                  </TabList>
                  
                  <TabPanels>
                    {Array.from({ length: selectedPlan.duration_days }, (_, dayIndex) => {
                      const day = dayIndex + 1
                      const dayNutrition = getDayNutrition(selectedPlan, day)
                      
                      return (
                        <TabPanel key={day}>
                          <VStack spacing={6} align="stretch">
                            {/* Day Nutrition Summary */}
                            <Card>
                              <CardBody>
                                <Text fontWeight="bold" mb={4}>Day {day} Nutrition</Text>
                                <SimpleGrid columns={{ base: 3, md: 7 }} spacing={4}>
                                  <Stat>
                                    <StatLabel>Calories</StatLabel>
                                    <StatNumber>{Math.round(dayNutrition.calories)}</StatNumber>
                                  </Stat>
                                  <Stat>
                                    <StatLabel>Protein</StatLabel>
                                    <StatNumber>{Math.round(dayNutrition.protein)}g</StatNumber>
                                  </Stat>
                                  <Stat>
                                    <StatLabel>Carbs</StatLabel>
                                    <StatNumber>{Math.round(dayNutrition.carbs)}g</StatNumber>
                                  </Stat>
                                  <Stat>
                                    <StatLabel>Fat</StatLabel>
                                    <StatNumber>{Math.round(dayNutrition.fat)}g</StatNumber>
                                  </Stat>
                                  <Stat>
                                    <StatLabel>Fiber</StatLabel>
                                    <StatNumber>{Math.round(dayNutrition.fiber)}g</StatNumber>
                                  </Stat>
                                  <Stat>
                                    <StatLabel>Sugar</StatLabel>
                                    <StatNumber>{Math.round(dayNutrition.sugar)}g</StatNumber>
                                  </Stat>
                                  <Stat>
                                    <StatLabel>Sodium</StatLabel>
                                    <StatNumber>{Math.round(dayNutrition.sodium)}mg</StatNumber>
                                  </Stat>
                                </SimpleGrid>
                              </CardBody>
                            </Card>

                            {/* Meals */}
                            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                              {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => {
                                const foods = getMealFoods(selectedPlan, day, meal)
                                const mealNutrition = foods.reduce((acc, food) => ({
                                  calories: acc.calories + food.calories,
                                  protein: acc.protein + food.protein,
                                  carbs: acc.carbs + food.carbs,
                                  fat: acc.fat + food.fat
                                }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

                                return (
                                  <Card 
                                    key={meal}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, day, meal)}
                                    bg={draggedFromSlot?.day === day && draggedFromSlot?.meal === meal ? 'blue.50' : 'inherit'}
                                    borderColor={draggedFromSlot?.day === day && draggedFromSlot?.meal === meal ? 'blue.200' : 'inherit'}
                                  >
                                    <CardBody>
                                      <HStack justify="space-between" mb={4}>
                                        <HStack spacing={2}>
                                          <Text fontWeight="bold" textTransform="capitalize">
                                            {meal}
                                          </Text>
                                          <Badge colorScheme="blue">
                                            {Math.round(mealNutrition.calories)} cal
                                          </Badge>
                                        </HStack>
                                        <HStack spacing={1}>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            leftIcon={<FiRefreshCw />}
                                            onClick={() => loadAiSuggestions(selectedPlan.id, day, meal)}
                                          >
                                            AI
                                          </Button>
                                          <Button
                                            size="sm"
                                            leftIcon={<FiPlus />}
                                            onClick={() => {
                                              setSelectedDay(day)
                                              setSelectedMeal(meal)
                                              onFoodPickerOpen()
                                            }}
                                          >
                                            Add Food
                                          </Button>
                                        </HStack>
                                      </HStack>
                                      
                                      <VStack align="stretch" spacing={2}>
                                        {foods.length === 0 ? (
                                          <Box
                                            p={8}
                                            textAlign="center"
                                            border="2px dashed"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                            bg="gray.50"
                                          >
                                            <Text color={textColor} mb={2}>
                                              No foods added yet
                                            </Text>
                                            <Text fontSize="sm" color="gray.400">
                                              Drag foods here or click "Add Food"
                                            </Text>
                                          </Box>
                                        ) : (
                                          foods.map((food, index) => (
                                            <Box
                                              key={index}
                                              p={3}
                                              borderRadius="md"
                                              bg={foodItemBg}
                                              draggable
                                              onDragStart={() => handleDragStart(food, day, meal)}
                                              cursor="move"
                                              _hover={{ bg: foodItemHoverBg }}
                                            >
                                              <HStack justify="space-between">
                                                <HStack spacing={2}>
                                                  <Box as={MdDragIndicator} color="gray.400" />
                                                  <VStack align="start" spacing={1}>
                                                    <Text fontWeight="medium">{food.food_name}</Text>
                                                    <Text fontSize="sm" color={textColor}>
                                                      {food.quantity}{food.unit}
                                                    </Text>
                                                  </VStack>
                                                </HStack>
                                                <HStack spacing={2}>
                                                  <VStack align="end" spacing={1}>
                                                    <Text fontSize="sm" fontWeight="medium">
                                                      {Math.round(food.calories)} cal
                                                    </Text>
                                                    <Text fontSize="xs" color={textColor}>
                                                      P: {Math.round(food.protein)}g | C: {Math.round(food.carbs)}g | F: {Math.round(food.fat)}g
                                                    </Text>
                                                  </VStack>
                                                  <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    icon={<FiTrash2 />}
                                                    colorScheme="red"
                                                    aria-label="Remove food"
                                                    onClick={() => removeFoodFromMeal(selectedPlan.id, day, meal, index)}
                                                  />
                                                </HStack>
                                              </HStack>
                                            </Box>
                                          ))
                                        )}
                                        
                                        {foods.length > 0 && (
                                          <Box
                                            p={3}
                                            borderRadius="md"
                                            bg={mealTotalBg}
                                            borderColor={mealTotalBorderColor}
                                            borderWidth={1}
                                          >
                                            <Text fontWeight="bold" mb={2}>Meal Total</Text>
                                            <HStack justify="space-between">
                                              <Text fontSize="sm">
                                                {Math.round(mealNutrition.calories)} calories
                                              </Text>
                                              <Text fontSize="sm">
                                                P: {Math.round(mealNutrition.protein)}g | 
                                                C: {Math.round(mealNutrition.carbs)}g | 
                                                F: {Math.round(mealNutrition.fat)}g
                                              </Text>
                                            </HStack>
                                          </Box>
                                        )}
                                      </VStack>
                                    </CardBody>
                                  </Card>
                                )
                              })}
                            </SimpleGrid>
                          </VStack>
                        </TabPanel>
                      )
                    })}
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>
          </Box>
        )}
      </VStack>

      {/* Create Plan Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Meal Plan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Plan Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter plan name"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter plan description"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Duration (days)</FormLabel>
                <NumberInput
                  value={formData.duration_days}
                  onChange={(_, value) => setFormData({ ...formData, duration_days: value || 7 })}
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
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={createPlan}
              isLoading={isCreating}
              loadingText="Creating..."
            >
              Create Plan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Food Picker Modal */}
      <Modal isOpen={isFoodPickerOpen} onClose={onFoodPickerClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Food to {selectedMeal} - Day {selectedDay}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Search Foods</FormLabel>
                <Input
                  value={foodSearchTerm}
                  onChange={(e) => setFoodSearchTerm(e.target.value)}
                  placeholder="Search for foods..."
                />
              </FormControl>
              
              {filteredFoods.length > 0 && (
                <FormControl>
                  <FormLabel>Select Food</FormLabel>
                  <Select
                    placeholder="Choose a food"
                    value={selectedFood?.id || ''}
                    onChange={(e) => {
                      const food = foods.find(f => f.id === e.target.value)
                      setSelectedFood(food || null)
                      if (food) {
                        setFoodQuantity(food.serving_size || 100)
                        setFoodUnit(food.serving_unit || 'g')
                      }
                    }}
                  >
                    {filteredFoods.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name} ({food.nutrition.calories} cal/{food.serving_size}{food.serving_unit})
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {selectedFood && (
                <QuantityUnitInput
                  quantity={foodQuantity}
                  unit={foodUnit}
                  onQuantityChange={setFoodQuantity}
                  onUnitChange={setFoodUnit}
                  baseNutrition={selectedFood.nutrition}
                  allowDecimals={true}
                  size="md"
                  label="Food"
                />
              )}
              
              {selectedFood && (
                <Card w="full">
                  <CardBody>
                    <Text fontWeight="bold" mb={2}>Nutrition Preview</Text>
                    <Text fontSize="sm" color={textColor}>
                      Based on {foodQuantity}{foodUnit} of {selectedFood.name}
                    </Text>
                    <SimpleGrid columns={4} spacing={4} mt={3}>
                      <Stat>
                        <StatLabel>Calories</StatLabel>
                        <StatNumber fontSize="md">
                          {Math.round((selectedFood.nutrition.calories * foodQuantity) / selectedFood.serving_size)}
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Protein</StatLabel>
                        <StatNumber fontSize="md">
                          {Math.round((selectedFood.nutrition.protein * foodQuantity) / selectedFood.serving_size)}g
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Carbs</StatLabel>
                        <StatNumber fontSize="md">
                          {Math.round((selectedFood.nutrition.carbs * foodQuantity) / selectedFood.serving_size)}g
                        </StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Fat</StatLabel>
                        <StatNumber fontSize="md">
                          {Math.round((selectedFood.nutrition.fat * foodQuantity) / selectedFood.serving_size)}g
                        </StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFoodPickerClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={addFoodToMeal}
              isDisabled={!selectedFood}
            >
              Add Food
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* AI Suggestions Modal */}
      <Modal isOpen={isSuggestionsModalOpen} onClose={onSuggestionsModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiRefreshCw />
              <Text>AI Suggestions</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {aiSuggestions.length === 0 ? (
                <Text color={textColor}>No suggestions available</Text>
              ) : (
                aiSuggestions.map((suggestion, index) => (
                  <Card key={index} variant="outline">
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack>
                          <Badge colorScheme="blue">{suggestion.type}</Badge>
                          <Text fontWeight="bold">{suggestion.message}</Text>
                        </HStack>
                        <SimpleGrid columns={1} spacing={2}>
                          {suggestion.foods?.map((food: any, foodIndex: number) => (
                            <HStack key={foodIndex} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                              <Text>{food.name}</Text>
                              <Text fontSize="sm" color={textColor}>
                                {food.calories} cal
                              </Text>
                            </HStack>
                          ))}
                        </SimpleGrid>
                      </VStack>
                    </CardBody>
                  </Card>
                ))
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onSuggestionsModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Template Management Modal */}
      <Modal isOpen={isTemplateModalOpen} onClose={onTemplateModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiSave />
              <Text>Template Management</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {selectedPlan && (
                <Card>
                  <CardBody>
                    <Text fontWeight="bold" mb={2}>Save Current Plan as Template</Text>
                    <FormControl>
                      <FormLabel>Template Name</FormLabel>
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter template name"
                      />
                    </FormControl>
                    <Button
                      mt={3}
                      colorScheme="green"
                      onClick={() => saveAsTemplate(selectedPlan.id, templateName)}
                      isDisabled={!templateName.trim()}
                    >
                      Save Template
                    </Button>
                  </CardBody>
                </Card>
              )}
              
              <Divider />
              
              <Box>
                <Text fontWeight="bold" mb={3}>Your Templates</Text>
                {templates.length === 0 ? (
                  <Text color={textColor}>No templates saved yet</Text>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {templates.map((template) => (
                      <HStack key={template.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{template.name}</Text>
                          <Text fontSize="sm" color={textColor}>
                            {template.duration_days} days
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          onClick={() => {
                            const planName = prompt('Enter name for new plan:')
                            if (planName) {
                              createFromTemplate(template.id, planName)
                            }
                          }}
                        >
                          Use Template
                        </Button>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onTemplateModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Copy Day Modal */}
      <Modal isOpen={isCopyDayModalOpen} onClose={onCopyDayModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiCopy />
              <Text>Copy Day</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Copy from Day</FormLabel>
                <Select
                  value={copyFromDay}
                  onChange={(e) => setCopyFromDay(Number(e.target.value))}
                >
                  {selectedPlan && Array.from({ length: selectedPlan.duration_days }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Day {i + 1}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Copy to Day</FormLabel>
                <Select
                  value={copyToDay}
                  onChange={(e) => setCopyToDay(Number(e.target.value))}
                >
                  {selectedPlan && Array.from({ length: selectedPlan.duration_days }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Day {i + 1}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <Alert status="info">
                <AlertIcon />
                This will overwrite all meals in the target day.
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCopyDayModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={() => selectedPlan && copyDay(selectedPlan.id, copyFromDay, copyToDay)}
              isDisabled={copyFromDay === copyToDay}
            >
              Copy Day
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Log Day Modal */}
      <Modal isOpen={isLogDayModalOpen} onClose={onLogDayModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiCheckCircle />
              <Text>Log Day to Food Diary</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Select Day</FormLabel>
                <Select value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))}>
                  {selectedPlan && Array.from({ length: selectedPlan.duration_days }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Day {i + 1}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Select Meals to Log</FormLabel>
                <CheckboxGroup
                  value={Array.from(selectedFoodsForLog)}
                  onChange={(values) => setSelectedFoodsForLog(new Set(values as string[]))}
                >
                  <Stack direction="column">
                    <Checkbox value="breakfast">Breakfast</Checkbox>
                    <Checkbox value="lunch">Lunch</Checkbox>
                    <Checkbox value="dinner">Dinner</Checkbox>
                    <Checkbox value="snacks">Snacks</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>
              
              <Alert status="info">
                <AlertIcon />
                This will log the selected meals to today's food diary.
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLogDayModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={() => {
                if (selectedPlan) {
                  logDayMeals(selectedPlan.id, selectedDay, Array.from(selectedFoodsForLog))
                }
              }}
              isDisabled={selectedFoodsForLog.size === 0}
            >
              Log Meals
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Analytics Modal */}
      <Modal isOpen={isAnalyticsModalOpen} onClose={onAnalyticsModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiBarChart />
              <Text>Plan Analytics</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPlan && (
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardBody>
                    <Text fontWeight="bold" mb={4}>Nutrition Overview</Text>
                    <SimpleGrid columns={2} spacing={4}>
                      <Stat>
                        <StatLabel>Total Calories</StatLabel>
                        <StatNumber>{Math.round(getTotalNutrition(selectedPlan).calories)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Avg Calories/Day</StatLabel>
                        <StatNumber>{Math.round(getTotalNutrition(selectedPlan).calories / selectedPlan.duration_days)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Total Protein</StatLabel>
                        <StatNumber>{Math.round(getTotalNutrition(selectedPlan).protein)}g</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Avg Protein/Day</StatLabel>
                        <StatNumber>{Math.round(getTotalNutrition(selectedPlan).protein / selectedPlan.duration_days)}g</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Total Carbs</StatLabel>
                        <StatNumber>{Math.round(getTotalNutrition(selectedPlan).carbs)}g</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Avg Carbs/Day</StatLabel>
                        <StatNumber>{Math.round(getTotalNutrition(selectedPlan).carbs / selectedPlan.duration_days)}g</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Total Fat</StatLabel>
                        <StatNumber>{Math.round(getTotalNutrition(selectedPlan).fat)}g</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Avg Fat/Day</StatLabel>
                        <StatNumber>{Math.round(getTotalNutrition(selectedPlan).fat / selectedPlan.duration_days)}g</StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Text fontWeight="bold" mb={4}>Macronutrient Distribution</Text>
                    <VStack spacing={3} align="stretch">
                      {(() => {
                        const total = getTotalNutrition(selectedPlan)
                        const totalCalories = total.calories
                        const proteinCals = total.protein * 4
                        const carbsCals = total.carbs * 4
                        const fatCals = total.fat * 9
                        
                        return (
                          <>
                            <HStack justify="space-between">
                              <Text>Protein</Text>
                              <Text>{Math.round((proteinCals / totalCalories) * 100)}%</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Carbohydrates</Text>
                              <Text>{Math.round((carbsCals / totalCalories) * 100)}%</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text>Fat</Text>
                              <Text>{Math.round((fatCals / totalCalories) * 100)}%</Text>
                            </HStack>
                          </>
                        )
                      })()}
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Text fontWeight="bold" mb={4}>Daily Breakdown</Text>
                    <VStack spacing={3} align="stretch">
                      {selectedPlan.days.map((day) => (
                        <HStack key={day.day_number} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                          <Text fontWeight="medium">Day {day.day_number}</Text>
                          <HStack spacing={4}>
                            <Text fontSize="sm">{Math.round(day.daily_totals.calories)} cal</Text>
                            <Text fontSize="sm">{Math.round(day.daily_totals.protein)}g protein</Text>
                            <Text fontSize="sm">{Math.round(day.daily_totals.carbs)}g carbs</Text>
                            <Text fontSize="sm">{Math.round(day.daily_totals.fat)}g fat</Text>
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <Text fontWeight="bold" mb={4}>Meal Distribution</Text>
                    <SimpleGrid columns={2} spacing={4}>
                      {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((meal) => {
                        const mealTotal = selectedPlan.days.reduce((total, day) => {
                          const mealFoods = day.meals[meal] || []
                          return total + mealFoods.reduce((mealSum, food) => mealSum + food.calories, 0)
                        }, 0)
                        return (
                          <Stat key={meal}>
                            <StatLabel textTransform="capitalize">{meal}</StatLabel>
                            <StatNumber>{Math.round(mealTotal)} cal</StatNumber>
                          </Stat>
                        )
                      })}
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onAnalyticsModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Share & Export Modal */}
      <Modal isOpen={isShareModalOpen} onClose={onShareModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiShare />
              <Text>Share & Export</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Social Sharing Section */}
              <Card>
                <CardBody>
                  <Text fontWeight="bold" mb={4}>Share on Social Media</Text>
                  <SimpleGrid columns={3} spacing={3}>
                    <Button
                      leftIcon={<FiShare />}
                      colorScheme="twitter"
                      onClick={() => selectedPlan && shareToSocialMedia('twitter', selectedPlan.id)}
                    >
                      Twitter
                    </Button>
                    <Button
                      leftIcon={<FiShare />}
                      colorScheme="facebook"
                      onClick={() => selectedPlan && shareToSocialMedia('facebook', selectedPlan.id)}
                    >
                      Facebook
                    </Button>
                    <Button
                      leftIcon={<FiShare />}
                      colorScheme="pink"
                      onClick={() => selectedPlan && shareToSocialMedia('instagram', selectedPlan.id)}
                    >
                      Instagram
                    </Button>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Link Sharing Section */}
              <Card>
                <CardBody>
                  <Text fontWeight="bold" mb={4}>Share via Link</Text>
                  <HStack>
                    <Button
                      leftIcon={<FiShare />}
                      onClick={() => selectedPlan && shareViaLink(selectedPlan.id)}
                      flex={1}
                    >
                      Copy Shareable Link
                    </Button>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    Anyone with this link can view your meal plan
                  </Text>
                </CardBody>
              </Card>

              {/* Export Section */}
              <Card>
                <CardBody>
                  <Text fontWeight="bold" mb={4}>Export Options</Text>
                  <VStack spacing={3} align="stretch">
                    <Button
                      leftIcon={<FiDownload />}
                      onClick={() => selectedPlan && exportToPDF(selectedPlan.id)}
                      variant="outline"
                    >
                      Export as PDF
                    </Button>
                    <Button
                      leftIcon={<FiList />}
                      onClick={() => selectedPlan && exportToGroceryList(selectedPlan.id)}
                      variant="outline"
                    >
                      Generate Grocery List
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onShareModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}
