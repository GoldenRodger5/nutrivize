/*
 * FoodIndex Component - Optimized for User Personalization
 * 
 * Endpoint Usage Strategy:
 * 1. `/foods/search?q=` - Used for browsing user's personal food collection (no filters, empty query)
 *    - Returns user-specific foods + default foods
 *    - Best for displaying the user's complete food index
 *    - Client-side pagination and sorting for better UX
 * 
 * 2. `/foods/search` - Used for text-based searches and filtered browsing
 *    - Supports query parameters for flexible searching
 *    - Returns personalized results (user foods + default foods)
 *    - Better for finding specific foods with user context
 *    - Used when: searching with text or applying filter queries
 * 
 * 3. Client-side filtering for dietary preferences to maximize personalization
 *    - Applies user's dietary restrictions and allergen filters
 *    - Provides instant feedback without additional API calls
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Button,
  Card,
  CardBody,
  Text,
  Badge,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Textarea,
  useToast,
  Icon,
  Switch,
  Select,
  Spinner,
  Center,
  useBreakpointValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { FoodItem } from '../types'
import api from '../utils/api'
import { getCurrentDateInTimezone, getUserTimezone } from '../utils/timezone'
import { SERVING_UNITS } from '../constants/servingUnits'
import NutritionLabelScanner from '../components/NutritionLabelScanner'
import FoodCompatibilityScore from '../components/FoodCompatibilityScore'
import DietaryProfileBuilder from '../components/DietaryProfileBuilder'
import QuantityUnitInput from '../components/QuantityUnitInput'
import FoodDetailModal from '../components/FoodDetailModal'
import { calculateNutritionForQuantity } from '../utils/unitConversion'
import { useFoodIndex } from '../contexts/FoodIndexContext'

// Mobile-optimized icons
const SearchIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={4} h={4}>
    <path d="M23.384,21.619,16.855,15.09a9.284,9.284,0,1,0-1.768,1.768l6.529,6.529a1.266,1.266,0,0,0,1.768,0A1.251,1.251,0,0,0,23.384,21.619ZM2.75,9.5a6.75,6.75,0,1,1,6.75,6.75A6.758,6.758,0,0,1,2.75,9.5Z"/>
  </Icon>
)

const AddIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={4} h={4}>
    <path d="M19,11H13V5a1,1,0,0,0-2,0v6H5a1,1,0,0,0,0,2h6v6a1,1,0,0,0,2,0V13h6a1,1,0,0,0,0-2Z"/>
  </Icon>
)

const FilterIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={4} h={4}>
    <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"/>
  </Icon>
)

const ScanIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={4} h={4}>
    <path d="M9 2a1 1 0 000 2h6a1 1 0 100-2H9z"/>
    <path fillRule="evenodd" d="M10 5a2 2 0 00-2 2v1H5a1 1 0 000 2h1v11a3 3 0 003 3h6a3 3 0 003-3V10h1a1 1 0 100-2h-3V7a2 2 0 00-2-2h-6zm0 2h6v1h-6V7zm-1 3h8v11a1 1 0 01-1 1H10a1 1 0 01-1-1V10z"/>
  </Icon>
)

// Mobile-optimized Food Card Component
export default function FoodIndex() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [allFoods, setAllFoods] = useState<FoodItem[]>([])
  const [, setLoading] = useState(false)
  const [allFoodsLoading, setAllFoodsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [, setTotalItems] = useState(0)
  const [filterQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { 
    isOpen: isLogModalOpen, 
    onOpen: onLogModalOpen, 
    onClose: onLogModalClose 
  } = useDisclosure()
  const { 
    isOpen: isScanModalOpen, 
    onOpen: onScanModalOpen, 
    onClose: onScanModalClose 
  } = useDisclosure()
  const { 
    isOpen: isEditModalOpen, 
    onOpen: onEditModalOpen, 
    onClose: onEditModalClose 
  } = useDisclosure()
  const { 
    isOpen: isDetailModalOpen, 
    onOpen: onDetailModalOpen, 
    onClose: onDetailModalClose 
  } = useDisclosure()
  const toast = useToast()

  // Add food index context
  const { refreshUserFoods } = useFoodIndex()

  const ITEMS_PER_PAGE = 20

  // State for food logging
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [logEntry, setLogEntry] = useState({
    meal_type: 'lunch',
    servings: 1,
    unit: 'serving',
    notes: ''
  })
  const [convertedNutrition, setConvertedNutrition] = useState<any>(null)

  // State for editing food
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null)

  // Form state for adding new food
  const [newFood, setNewFood] = useState({
    name: '',
    brand: '',
    serving_size: 1,
    serving_unit: '',
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    },
    notes: '',
    dietary_attributes: {
      dietary_restrictions: [],
      allergens: [],
      food_categories: []
    }
  })

  // User dietary preferences state
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [applyDietaryFilter, setApplyDietaryFilter] = useState(false) // Default to showing ALL foods
  
  // Advanced filter states
  const [advancedFilters, setAdvancedFilters] = useState({
    nutrition: {
      calories: { min: 0, max: 1000 },
      protein: { min: 0, max: 100 },
      carbs: { min: 0, max: 100 },
      fat: { min: 0, max: 100 },
    },
    category: '',
    source: 'all', // 'all', 'personal', 'database'
    compatibilityScore: 0, // minimum compatibility score
    favoritesOnly: false,
    recentlyAdded: false,
  })
  
  const { 
    isOpen: isDietaryBuilderOpen, 
    onOpen: onDietaryBuilderOpen,
    onClose: onDietaryBuilderClose 
  } = useDisclosure()

  const isMobile = useBreakpointValue({ base: true, lg: false })
  const { 
    isOpen: isFilterDrawerOpen, 
    onOpen: onFilterDrawerOpen, 
    onClose: onFilterDrawerClose 
  } = useDisclosure()

  // Reset advanced filters
  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      nutrition: {
        calories: { min: 0, max: 1000 },
        protein: { min: 0, max: 100 },
        carbs: { min: 0, max: 100 },
        fat: { min: 0, max: 100 },
      },
      category: '',
      source: 'all',
      compatibilityScore: 0,
      favoritesOnly: false,
      recentlyAdded: false,
    })
  }

  // Check if advanced filters are active
  const hasActiveAdvancedFilters = () => {
    return (
      advancedFilters.source !== 'all' ||
      advancedFilters.category !== '' ||
      advancedFilters.favoritesOnly ||
      advancedFilters.recentlyAdded ||
      advancedFilters.nutrition.calories.min > 0 ||
      advancedFilters.nutrition.calories.max < 1000 ||
      advancedFilters.nutrition.protein.min > 0 ||
      advancedFilters.nutrition.protein.max < 100 ||
      advancedFilters.nutrition.carbs.min > 0 ||
      advancedFilters.nutrition.carbs.max < 100 ||
      advancedFilters.nutrition.fat.min > 0 ||
      advancedFilters.nutrition.fat.max < 100
    )
  }

  // Fetch user dietary preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        const response = await api.get('/preferences/dietary')
        console.log('✅ Loaded user dietary preferences:', response.data)
        setUserPreferences(response.data)
      } catch (error) {
        console.error('❌ Error fetching dietary preferences:', error)
        // Set empty preferences to prevent errors
        setUserPreferences({
          dietary_restrictions: [],
          allergens: [],
          strictness_level: 'moderate'
        })
      }
    }
    fetchUserPreferences()
  }, [])

  // Filter foods based on dietary preferences AND advanced filters
  const filterFoodsByDietaryPrefs = (foods: FoodItem[]) => {
    console.log('🔍 FILTER DEBUG - User Preferences:', JSON.stringify(userPreferences, null, 2))
    console.log('🔍 FILTER DEBUG - Apply Filter:', applyDietaryFilter)
    console.log('🔍 FILTER DEBUG - Advanced Filters:', advancedFilters)
    console.log('🔍 FILTER DEBUG - Foods to filter:', foods.length)
    
    let filteredFoods = foods

    // Apply dietary preference filters first
    if (userPreferences && applyDietaryFilter) {
      console.log('🔍 Applying dietary filters:', {
        userPreferences,
        applyDietaryFilter,
        totalFoods: filteredFoods.length
      })
      
      filteredFoods = filteredFoods.filter(food => {
        // Handle foods without dietary attributes gracefully
        const foodRestrictions = food.dietary_attributes?.dietary_restrictions || []
        const foodCategories = food.dietary_attributes?.food_categories || []
        const foodAllergens = food.dietary_attributes?.allergens || []

        // CRITICAL FIX: Check allergens first - this is a hard requirement
        if (userPreferences.allergens?.length > 0) {
          for (const userAllergen of userPreferences.allergens) {
            const allergenLower = userAllergen.toLowerCase()
            
            // Check if food contains this allergen or related allergens
            const hasAllergen = foodAllergens.some(foodAllergen => {
              const foodAllergenLower = foodAllergen.toLowerCase()
              
              // Exact match
              if (foodAllergenLower === allergenLower) {
                console.log(`🔍 Exact allergen match: ${foodAllergenLower} === ${allergenLower}`)
                return true
              }
              
              // Special allergen mappings
              if (allergenLower === 'nuts' || allergenLower === 'tree nuts') {
                const nutTypes = ['nuts', 'tree nuts', 'almonds', 'walnuts', 'cashews', 'pistachios', 'pecans', 'hazelnuts', 'brazil nuts', 'macadamia', 'pine nuts']
                const isNut = nutTypes.includes(foodAllergenLower)
                if (isNut) {
                  console.log(`🔍 Nut allergen match: ${foodAllergenLower} found in nut types`)
                }
                return isNut
              }
              
              if (allergenLower === 'dairy') {
                const dairyTypes = ['dairy', 'milk', 'lactose', 'cheese', 'yogurt', 'butter', 'cream', 'whey', 'casein']
                return dairyTypes.includes(foodAllergenLower)
              }
              
              if (allergenLower === 'gluten') {
                const glutenTypes = ['gluten', 'wheat', 'barley', 'rye', 'oats']
                return glutenTypes.includes(foodAllergenLower)
              }
              
              // Check if food allergen contains user allergen as substring
              return foodAllergenLower.includes(allergenLower) || allergenLower.includes(foodAllergenLower)
            })
            
            // Also check food categories for allergens (like nuts category)
            const hasAllergenInCategories = foodCategories.some(category => {
              const categoryLower = category.toLowerCase()
              
              // Exact match
              if (categoryLower === allergenLower) {
                console.log(`🔍 Exact category allergen match: ${categoryLower} === ${allergenLower}`)
                return true
              }
              
              // Special allergen mappings for categories
              if (allergenLower === 'nuts' || allergenLower === 'tree nuts') {
                const nutTypes = ['nuts', 'tree nuts', 'almonds', 'walnuts', 'cashews', 'pistachios', 'pecans', 'hazelnuts', 'brazil nuts', 'macadamia', 'pine nuts']
                const isNut = nutTypes.includes(categoryLower)
                if (isNut) {
                  console.log(`🔍 Nut category allergen match: ${categoryLower} found in nut types`)
                }
                return isNut
              }
              
              if (allergenLower === 'dairy') {
                const dairyTypes = ['dairy', 'milk', 'lactose', 'cheese', 'yogurt', 'butter', 'cream', 'whey', 'casein']
                return dairyTypes.includes(categoryLower)
              }
              
              return categoryLower.includes(allergenLower) || allergenLower.includes(categoryLower)
            })
            
            if (hasAllergen || hasAllergenInCategories) {
              console.log(`❌ ${food.name} contains allergen: ${userAllergen} (found in allergens: [${foodAllergens.join(', ')}] or categories: [${foodCategories.join(', ')}])`)
              return false // Food contains allergen user wants to avoid
            }
          }
        }

        // IMPROVED LOGIC: For dietary restrictions, be more lenient
        if (userPreferences.dietary_restrictions?.length > 0) {
          let hasCompatibleRestriction = false
          let hasIncompatibleElements = false

          for (const userRestriction of userPreferences.dietary_restrictions) {
            const restriction = userRestriction.toLowerCase()
            
            // Check if food explicitly supports this dietary restriction
            if (foodRestrictions.some(fr => fr.toLowerCase() === restriction)) {
              hasCompatibleRestriction = true
              continue
            }

            // Special handling for different dietary restrictions
            switch (restriction) {
              case 'vegetarian':
                // If no dietary info available, allow it unless it's explicitly meat
                if (foodCategories.length === 0 && foodRestrictions.length === 0) {
                  hasCompatibleRestriction = true
                } else if (foodCategories.some(cat => ['meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'seafood'].includes(cat.toLowerCase()))) {
                  hasIncompatibleElements = true
                } else {
                  hasCompatibleRestriction = true
                }
                break

              case 'vegan':
                // More lenient vegan logic - allow naturally vegan foods
                if (foodRestrictions.includes('vegan')) {
                  hasCompatibleRestriction = true
                } else if (foodCategories.some(cat => ['meat', 'dairy', 'eggs', 'fish', 'seafood', 'cheese', 'milk', 'butter', 'cream', 'honey'].includes(cat.toLowerCase()))) {
                  hasIncompatibleElements = true
                } else if (foodAllergens.some(allergen => ['dairy', 'milk', 'eggs', 'fish', 'shellfish'].includes(allergen.toLowerCase()))) {
                  hasIncompatibleElements = true
                } else {
                  // Allow foods that are naturally vegan (fruits, vegetables, grains, etc.)
                  const naturallyVeganCategories = ['fruits', 'vegetables', 'grains', 'nuts', 'seeds', 'legumes', 'berries', 'herbs', 'spices']
                  const isNaturallyVegan = foodCategories.some(cat => naturallyVeganCategories.includes(cat.toLowerCase()))
                  const isPlantBased = ['fruit', 'vegetable', 'grain', 'nut', 'seed', 'legume', 'berry', 'herb', 'spice'].some(type => 
                    food.name.toLowerCase().includes(type) || foodCategories.some(cat => cat.toLowerCase().includes(type))
                  )
                  
                  if (isNaturallyVegan || isPlantBased || (foodCategories.length === 0 && foodRestrictions.length === 0)) {
                    hasCompatibleRestriction = true
                  } else {
                    // If unclear, allow it (err on the side of inclusion for common foods)
                    hasCompatibleRestriction = true
                  }
                }
                break

              case 'gluten-free':
                // Allow if explicitly gluten-free or no gluten-containing ingredients
                if (foodRestrictions.includes('gluten-free')) {
                  hasCompatibleRestriction = true
                } else if (foodCategories.some(cat => ['wheat', 'gluten', 'barley', 'rye'].includes(cat.toLowerCase()))) {
                  hasIncompatibleElements = true
                } else {
                  // Default to allowing if no gluten info
                  hasCompatibleRestriction = true
                }
                break

              case 'dairy-free':
                if (foodRestrictions.includes('dairy-free')) {
                  hasCompatibleRestriction = true
                } else if (foodCategories.includes('dairy') || foodAllergens.includes('dairy')) {
                  hasIncompatibleElements = true
                } else {
                  hasCompatibleRestriction = true
                }
                break

              case 'pescatarian':
                // Allow fish/seafood and vegetarian options
                if (foodCategories.some(cat => ['fish', 'seafood'].includes(cat.toLowerCase())) ||
                    foodRestrictions.includes('pescatarian') ||
                    foodRestrictions.includes('vegetarian')) {
                  hasCompatibleRestriction = true
                } else if (foodCategories.some(cat => ['meat', 'beef', 'pork', 'chicken', 'turkey'].includes(cat.toLowerCase()))) {
                  hasIncompatibleElements = true
                } else {
                  // Allow unknowns
                  hasCompatibleRestriction = true
                }
                break

              default:
                // For other restrictions, be lenient - allow if no conflicting info
                if (foodRestrictions.includes(restriction) || 
                    (foodRestrictions.length === 0 && foodCategories.length === 0)) {
                  hasCompatibleRestriction = true
                }
                break
            }
          }

          // LENIENT APPROACH: Only reject if there are definitive incompatible elements
          if (hasIncompatibleElements) {
            console.log(`❌ ${food.name} has incompatible elements for dietary restrictions`)
            return false
          }

          // Accept if we found any compatible restriction or if no definitive incompatability
          if (!hasCompatibleRestriction && foodRestrictions.length > 0) {
            console.log(`⚠️ ${food.name} might not match dietary restrictions but allowing due to uncertainty`)
          }
        }
        
        console.log(`✅ ${food.name} passed dietary filters`)
        return true
      })
    }

    // Apply advanced filters
    if (advancedFilters.favoritesOnly) {
      // This would need to be implemented with favorites data
      console.log('🔍 Applying favorites filter')
    }

    if (advancedFilters.source !== 'all') {
      filteredFoods = filteredFoods.filter(food => {
        if (advancedFilters.source === 'personal') {
          return (food as any).is_custom || (food as any).user_id // User's personal foods
        } else if (advancedFilters.source === 'database') {
          return !(food as any).is_custom && !(food as any).user_id // Database foods
        }
        return true
      })
    }

    if (advancedFilters.category) {
      filteredFoods = filteredFoods.filter(food => {
        const foodCategories = food.dietary_attributes?.food_categories || []
        return foodCategories.some(cat => 
          cat.toLowerCase().includes(advancedFilters.category.toLowerCase())
        )
      })
    }

    // Apply nutrition filters
    filteredFoods = filteredFoods.filter(food => {
      if (!food.nutrition) return true
      
      const { calories, protein, carbs, fat } = food.nutrition
      
      return (
        (!calories || (calories >= advancedFilters.nutrition.calories.min && calories <= advancedFilters.nutrition.calories.max)) &&
        (!protein || (protein >= advancedFilters.nutrition.protein.min && protein <= advancedFilters.nutrition.protein.max)) &&
        (!carbs || (carbs >= advancedFilters.nutrition.carbs.min && carbs <= advancedFilters.nutrition.carbs.max)) &&
        (!fat || (fat >= advancedFilters.nutrition.fat.min && fat <= advancedFilters.nutrition.fat.max))
      )
    })

    console.log(`🔍 All filtering complete: ${filteredFoods.length}/${foods.length} foods remaining`)
    return filteredFoods
  }

  // Load all foods for the browse tab
  const loadAllFoods = async (page = 1, filter = '', sort = 'name', order = 'asc') => {
    console.log('🔄 loadAllFoods called with:', { page, filter, sort, order })
    setAllFoodsLoading(true)
    try {
      // If there's a filter query, use the search endpoint for better personalization
      if (filter.trim()) {
        console.log('📍 Using search endpoint with filter:', filter)
        const skip = (page - 1) * ITEMS_PER_PAGE
        const params = new URLSearchParams({
          q: filter,
          limit: (ITEMS_PER_PAGE + 1).toString(),
          skip: skip.toString()
        })
        
        const response = await api.get(`/foods/search?${params}`)
        const foods = response.data || []
        console.log('🔍 Search response:', { foodsCount: foods.length, foods })
        
        // Sort the foods client-side since search endpoint might not support all sort options
        const sortedFoods = [...foods].sort((a, b) => {
          if (sort === 'name') {
            const nameA = a.name?.toLowerCase() || '';
            const nameB = b.name?.toLowerCase() || '';
            return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
          } else if (sort === 'calories') {
            const caloriesA = a.nutrition?.calories || 0;
            const caloriesB = b.nutrition?.calories || 0;
            return order === 'asc' ? caloriesA - caloriesB : caloriesB - caloriesA;
          } else if (sort === 'protein') {
            const proteinA = a.nutrition?.protein || 0;
            const proteinB = b.nutrition?.protein || 0;
            return order === 'asc' ? proteinA - proteinB : proteinB - proteinA;
          }
          return 0;
        });
        
        // Check if there's a next page
        if (sortedFoods.length > ITEMS_PER_PAGE) {
          setHasNextPage(true)
          setAllFoods(sortedFoods.slice(0, ITEMS_PER_PAGE)) // Remove the extra item
        } else {
          setHasNextPage(false)
          setAllFoods(sortedFoods)
        }
        
        // Calculate total items for display (this is an estimate)
        setTotalItems(skip + sortedFoods.length)
      } 
      // If no filter query, use the search endpoint with empty query for user's personalized food collection
      else {
        console.log('📍 Using search endpoint with empty query (no filter)')
        // The search endpoint with empty query provides the user's personalized food collection
        const response = await api.get('/foods/search?q=&limit=100')
        const foods = response.data || []
        console.log('📋 Search response (empty query):', { 
          status: response.status, 
          foodsCount: foods.length, 
          foods: foods.slice(0, 3) // Show first 3 foods for debugging
        })
        
        // Sort the foods client-side
        const sortedFoods = [...foods].sort((a, b) => {
          if (sort === 'name') {
            const nameA = a.name?.toLowerCase() || '';
            const nameB = b.name?.toLowerCase() || '';
            return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
          } else if (sort === 'calories') {
            const caloriesA = a.nutrition?.calories || 0;
            const caloriesB = b.nutrition?.calories || 0;
            return order === 'asc' ? caloriesA - caloriesB : caloriesB - caloriesA;
          } else if (sort === 'protein') {
            const proteinA = a.nutrition?.protein || 0;
            const proteinB = b.nutrition?.protein || 0;
            return order === 'asc' ? proteinA - proteinB : proteinB - proteinA;
          }
          return 0;
        });
        
        // Handle pagination client-side
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedFoods = sortedFoods.slice(startIndex, endIndex);
        
        setAllFoods(paginatedFoods);
        setHasNextPage(endIndex < sortedFoods.length);
        setTotalItems(sortedFoods.length);
      }
    } catch (error) {
      console.error('Error loading foods:', error)
      toast({
        title: 'Load Error',
        description: 'Failed to load foods. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setAllFoods([])
      setHasNextPage(false)
      setTotalItems(0)
    }
    setAllFoodsLoading(false)
  }

  useEffect(() => {
    loadAllFoods(currentPage, filterQuery, sortBy, sortOrder)
  }, [currentPage, filterQuery, sortBy, sortOrder, refreshUserFoods])

  // Real-time search function
  const searchFoods = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    
    setLoading(true)
    try {
      // Use a more comprehensive search with higher limit
      const response = await api.get(`/foods/search?q=${encodeURIComponent(query)}&limit=50`)
      const results = response.data || []
      
      // Enhanced search: search in name and partial matches
      const enhancedResults = results.filter((food: FoodItem) => {
        const searchLower = query.toLowerCase()
        const name = food.name?.toLowerCase() || ''
        
        // Check for exact matches first, then partial matches
        return name.includes(searchLower) || 
               // Check for word matches
               name.split(' ').some((word: string) => word.startsWith(searchLower))
      })
      
      // Sort search results by relevance (exact matches first, then partial)
      const sortedResults = enhancedResults.sort((a: FoodItem, b: FoodItem) => {
        const searchLower = query.toLowerCase()
        const aName = a.name?.toLowerCase() || ''
        const bName = b.name?.toLowerCase() || ''
        
        // Exact name matches first
        if (aName === searchLower && bName !== searchLower) return -1
        if (bName === searchLower && aName !== searchLower) return 1
        
        // Name starts with search term
        if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1
        if (bName.startsWith(searchLower) && !aName.startsWith(searchLower)) return 1
        
        // Alphabetical as fallback
        return aName.localeCompare(bName)
      })
      
      // Apply dietary filtering to search results
      const filteredResults = filterFoodsByDietaryPrefs(sortedResults)
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching foods:', error)
      setSearchResults([])
    }
    setLoading(false)
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFoods(searchQuery)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, userPreferences, applyDietaryFilter])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleAddFood = async () => {
    try {
      await api.post('/foods', newFood)
      toast({
        title: 'Food Added',
        description: `${newFood.name} has been added to the food index.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onClose()
      // Reset form
      setNewFood({
        name: '',
        brand: '',
        serving_size: 1,
        serving_unit: '',
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        },
        notes: '',
        dietary_attributes: {
          dietary_restrictions: [],
          allergens: [],
          food_categories: []
        }
      })
      // Refresh food lists
      if (searchQuery.trim()) {
        searchFoods(searchQuery)
      }
      loadAllFoods(currentPage, filterQuery, sortBy, sortOrder)
    } catch (error) {
      console.error('Error adding food:', error)
      toast({
        title: 'Add Food Error',
        description: 'Failed to add food. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleLogFood = (food: FoodItem) => {
    setSelectedFood(food)
    setLogEntry({
      meal_type: 'lunch',
      servings: 1,
      unit: 'serving',
      notes: ''
    })
    setConvertedNutrition(null)
    onLogModalOpen()
  }

  // Handle quantity/unit changes with real-time nutrition updates
  const handleQuantityUnitChange = (newQuantity: number, newUnit: string) => {
    setLogEntry(prev => ({ ...prev, servings: newQuantity, unit: newUnit }))
    
    if (selectedFood) {
      // Calculate nutrition for the new quantity and unit
      const baseNutrition = {
        calories: selectedFood.nutrition?.calories || 0,
        protein: selectedFood.nutrition?.protein || 0,
        carbs: selectedFood.nutrition?.carbs || 0,
        fat: selectedFood.nutrition?.fat || 0,
        fiber: selectedFood.nutrition?.fiber || 0,
        sugar: selectedFood.nutrition?.sugar || 0,
        sodium: selectedFood.nutrition?.sodium || 0
      }
      
      const nutrition = calculateNutritionForQuantity(
        baseNutrition,
        selectedFood.serving_size || 1,
        selectedFood.serving_unit || 'serving',
        newQuantity,
        newUnit
      )
      setConvertedNutrition(nutrition)
    }
  }

  const handleEditFood = (food: FoodItem) => {
    setEditingFood(food)
    onEditModalOpen()
  }

  const handleViewFoodDetails = (food: FoodItem) => {
    setSelectedFood(food)
    onDetailModalOpen()
  }

  const handleUpdateFood = async () => {
    if (!editingFood) return

    try {
      await api.put(`/foods/${editingFood.id}`, editingFood)
      toast({
        title: 'Food Updated',
        description: `${editingFood.name} has been updated successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onEditModalClose()
      
      // Refresh food lists
      if (searchQuery.trim()) {
        searchFoods(searchQuery)
      }
      loadAllFoods(currentPage, filterQuery, sortBy, sortOrder)
    } catch (error) {
      console.error('Error updating food:', error)
      toast({
        title: 'Update Error',
        description: 'Failed to update food. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleDeleteFood = async () => {
    if (!editingFood) return

    try {
      await api.delete(`/foods/${editingFood.id}`)
      toast({
        title: 'Food Deleted',
        description: `${editingFood.name} has been deleted.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onEditModalClose()
      
      // Refresh food lists
      if (searchQuery.trim()) {
        searchFoods(searchQuery)
      }
      loadAllFoods(currentPage, filterQuery, sortBy, sortOrder)
    } catch (error) {
      console.error('Error deleting food:', error)
      toast({
        title: 'Delete Error',
        description: 'Failed to delete food. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleLogSubmit = async () => {
    if (!selectedFood) return

    try {
      // Use converted nutrition if available, otherwise calculate on the fly
      const nutritionToLog = convertedNutrition || {
        calories: selectedFood.nutrition.calories * logEntry.servings,
        protein: selectedFood.nutrition.protein * logEntry.servings,
        carbs: selectedFood.nutrition.carbs * logEntry.servings,
        fat: selectedFood.nutrition.fat * logEntry.servings,
        fiber: (selectedFood.nutrition.fiber || 0) * logEntry.servings,
        sugar: (selectedFood.nutrition.sugar || 0) * logEntry.servings,
        sodium: (selectedFood.nutrition.sodium || 0) * logEntry.servings,
      }

      const logData = {
        date: getCurrentDateInTimezone(getUserTimezone()), // Use timezone-aware date
        meal_type: logEntry.meal_type,
        food_id: selectedFood.id,
        food_name: selectedFood.name,
        amount: logEntry.servings * (selectedFood.serving_size || 1),
        unit: logEntry.unit,
        nutrition: nutritionToLog,
        notes: logEntry.notes
      }

      await api.post('/food-logs', logData)
      
      toast({
        title: 'Food Logged',
        description: `${selectedFood.name} has been logged to your ${logEntry.meal_type}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onLogModalClose()
    } catch (error) {
      console.error('Error logging food:', error)
      toast({
        title: 'Log Error',
        description: 'Failed to log food. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // Apply dietary filtering to sorted and searched foods
  const displayedFoods = useMemo(() => {
    console.log('🎯 displayedFoods calculation:', {
      allFoodsCount: allFoods.length,
      searchResultsCount: searchResults.length,
      searchQuery: searchQuery.trim(),
      applyDietaryFilter,
      userPreferences: userPreferences ? 'present' : 'null'
    })
    
    let result = allFoods
    
    // Apply search filter (integrate search into browse)
    if (searchQuery.trim()) {
      // Use search results if searching
      result = searchResults
      console.log('🔍 Using search results:', result.length)
    } else {
      console.log('📋 Using all foods:', result.length)
    }
    
    // Apply dietary preferences filter
    const filteredResult = filterFoodsByDietaryPrefs(result)
    console.log('🎯 Final displayed foods count:', filteredResult.length)
    
    return filteredResult
  }, [allFoods, searchResults, searchQuery, userPreferences, applyDietaryFilter])

  const renderFoodCard = (food: FoodItem) => {
    // Debug: Log ALL food data to see structure
    console.log(`🍎 FULL FOOD DATA for ${food.name}:`, JSON.stringify(food, null, 2))
    
    return (
      <Card key={food.id} _hover={{ shadow: 'md', cursor: 'pointer' }}>
        <CardBody>
          <VStack align="start" spacing={3}>
            <Box w="full" onClick={() => handleViewFoodDetails(food)}>
              {food.brand && (
                <Text fontSize="sm" color="gray.400" fontWeight="medium" textTransform="uppercase" mb={1}>
                  {food.brand}
                </Text>
              )}
              <Text fontWeight="bold" fontSize="lg">
                {food.name}
              </Text>
              <HStack spacing={2} wrap="wrap" mt={1}>
                {food.source && (
                  <Badge colorScheme="blue" size="sm">
                    {food.source}
                  </Badge>
                )}
                
                {/* Debug: Show if dietary_attributes exist */}
                {food.dietary_attributes ? (
                  <Badge colorScheme="purple" size="sm" variant="outline">
                    HAS DIETARY DATA
                  </Badge>
                ) : (
                  <Badge colorScheme="gray" size="sm" variant="outline">
                    NO DIETARY DATA
                  </Badge>
                )}
                

              </HStack>
            </Box>

            {/* Dietary Compatibility Score */}
            {userPreferences && (userPreferences.dietary_restrictions?.length > 0 || userPreferences.allergens?.length > 0) && (
              <FoodCompatibilityScore 
                food={food} 
                userProfile={userPreferences} 
              />
            )}
            
            <Text fontSize="sm" color="gray.600">
              Per {food.serving_size} {food.serving_unit}
            </Text>
            
            <SimpleGrid columns={2} spacing={2} w="full">
              <Text fontSize="sm">
                <strong>Calories:</strong> {Math.round(food.nutrition.calories)}
              </Text>
              <Text fontSize="sm">
                <strong>Protein:</strong> {food.nutrition.protein}g
              </Text>
              <Text fontSize="sm">
                <strong>Carbs:</strong> {food.nutrition.carbs}g
              </Text>
              <Text fontSize="sm">
                <strong>Fat:</strong> {food.nutrition.fat}g
              </Text>
            </SimpleGrid>

            <HStack w="full" spacing={2}>
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={<AddIcon />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLogFood(food)
                }}
                flex={1}
              >
                Log Food
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditFood(food)
                }}
              >
                Edit
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  const renderMobileFoodCard = (food: FoodItem) => {
    return (
      <Card 
        key={food.id} 
        _hover={{ shadow: 'md', cursor: 'pointer' }} 
        size="sm"
        onClick={() => handleViewFoodDetails(food)}
        bg="linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(249,252,255,0.95) 100%)"
      >
        <CardBody p={2}>
          <VStack align="start" spacing={1.5} w="full">
            {/* Food Name & Calories - Compact */}
            <HStack justify="space-between" align="start" w="full">
              <VStack align="start" spacing={0} flex={1} minW={0}>
                {food.brand && (
                  <Text fontSize="xs" color="gray.400" fontWeight="medium" textTransform="uppercase" noOfLines={1}>
                    {food.brand}
                  </Text>
                )}
                <Text 
                  fontWeight="bold" 
                  fontSize="sm" 
                  lineHeight="tight" 
                  noOfLines={1}
                  color="gray.800"
                >
                  {food.name}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {food.source} • {food.serving_size} {food.serving_unit}
                </Text>
              </VStack>
              <VStack spacing={0} align="end" minW="fit-content" ml={2}>
                <Text fontSize="lg" fontWeight="bold" color="green.600">
                  {Math.round(food.nutrition.calories)}
                </Text>
                <Text fontSize="xs" color="gray.400">cal</Text>
              </VStack>
            </HStack>

            {/* Macros - Compact and Always Visible */}
            <HStack spacing={2} fontSize="xs" color="gray.700" w="full" justify="space-between" bg="gray.50" p={1.5} borderRadius="md">
              <VStack spacing={0} align="center" flex={1}>
                <Text fontWeight="bold" color="blue.600" fontSize="xs">{food.nutrition.protein}g</Text>
                <Text fontSize="xs" color="gray.500">Protein</Text>
              </VStack>
              <VStack spacing={0} align="center" flex={1}>
                <Text fontWeight="bold" color="orange.600" fontSize="xs">{food.nutrition.carbs}g</Text>
                <Text fontSize="xs" color="gray.500">Carbs</Text>
              </VStack>
              <VStack spacing={0} align="center" flex={1}>
                <Text fontWeight="bold" color="purple.600" fontSize="xs">{food.nutrition.fat}g</Text>
                <Text fontSize="xs" color="gray.500">Fat</Text>
              </VStack>
            </HStack>

            {/* Mobile: Removed dietary info - moved to details modal */}

            {/* Compact Action Buttons */}
            <HStack w="full" spacing={1} pt={1}>
              <Button
                size="xs"
                colorScheme="green"
                leftIcon={<AddIcon />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLogFood(food)
                }}
                flex={1}
                fontSize="xs"
              >
                Log Food
              </Button>
              <Button
                size="xs"
                colorScheme="blue"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditFood(food)
                }}
                fontSize="xs"
              >
                Edit
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    )
  }
  // Handler for nutrition scan completion
  const handleScanComplete = (nutritionInfo: any) => {
    // Pre-populate the new food form with scanned data
    setNewFood({
      name: nutritionInfo.name || '',
      brand: '',
      serving_size: nutritionInfo.serving_size || 1,
      serving_unit: 'serving',
      nutrition: {
        calories: nutritionInfo.calories || 0,
        protein: nutritionInfo.protein || 0,
        carbs: nutritionInfo.carbs || 0,
        fat: nutritionInfo.fat || 0,
        fiber: nutritionInfo.fiber || 0,
        sugar: nutritionInfo.sugar || 0,
        sodium: nutritionInfo.sodium || 0,
      },
      notes: 'Created from nutrition label scan',
      dietary_attributes: {
        dietary_restrictions: [],
        allergens: [],
        food_categories: []
      }
    })
    
    // Close scanner modal and open add food modal
    onScanModalClose()
    onOpen()
    
    toast({
      title: 'Nutrition Information Scanned',
      description: 'Food form has been pre-populated with scanned data. Review and save.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleFoodCreatedFromScan = (food: any) => {
    // Refresh the foods list
    loadAllFoods(currentPage, filterQuery, sortBy, sortOrder)
    onScanModalClose()
    
    toast({
      title: 'Food Created',
      description: `${food.name} has been added to your food database.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <Box bg="linear-gradient(135deg, #f6f9fc 0%, #e9f4f9 100%)" minH="100vh">
      <Container maxW={isMobile ? "100%" : "container.xl"} py={isMobile ? 2 : 8} px={isMobile ? 2 : 8}>
        <VStack spacing={isMobile ? 3 : 6} align="stretch">
          {/* Mobile Header */}
          {isMobile && (
            <Box bg="white" p={4} borderRadius="lg" shadow="sm">
              <VStack spacing={3}>
                <Heading size="md" textAlign="center">
                  Food Index 🥗
                </Heading>
                
                {/* Search Bar */}
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon />
                  </InputLeftElement>
                  <Input
                    placeholder="Search foods..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    borderRadius="full"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: "white", shadow: "outline" }}
                  />
                </InputGroup>

                {/* Mobile Action Buttons */}
                <HStack spacing={2} w="full">
                  <Button
                    leftIcon={<FilterIcon />}
                    onClick={onFilterDrawerOpen}
                    size="sm"
                    variant="outline"
                    flex={1}
                  >
                    Filter
                  </Button>
                  <Button
                    leftIcon={<ScanIcon />}
                    onClick={onScanModalOpen}
                    size="sm"
                    colorScheme="purple"
                    flex={1}
                  >
                    Scan
                  </Button>
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={onOpen}
                    size="sm"
                    colorScheme="green"
                    flex={1}
                  >
                    Add
                  </Button>
                </HStack>

                {/* Mobile Dietary Profile Button */}
                <Button
                  onClick={onDietaryBuilderOpen}
                  size="sm"
                  colorScheme="orange"
                  variant="outline"
                  w="full"
                  leftIcon={<Text fontSize="sm">⚙️</Text>}
                >
                  Dietary Profile
                </Button>

                {/* Quick Stats */}
                <HStack justify="space-between" w="full" fontSize="xs" color="gray.600">
                  <Text>Total: {allFoods.length}</Text>
                  <Text>Showing: {displayedFoods.length}</Text>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* Desktop Header */}
          {!isMobile && (
            <Box>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={1}>
                    <Heading size="lg">
                      Food Index 🍎
                    </Heading>
                    <Text color="gray.600">
                      Browse and search our comprehensive food database
                    </Text>
                  </VStack>
                  
                  {/* Desktop Action Buttons */}
                  <HStack spacing={3}>
                    <Button
                      leftIcon={<SearchIcon />}
                      size="md"
                      variant="outline"
                      colorScheme="blue"
                    >
                      Search
                    </Button>
                    <Button
                      leftIcon={<FilterIcon />}
                      onClick={onFilterDrawerOpen}
                      size="md"
                      variant="outline"
                      colorScheme="gray"
                    >
                      Filter
                    </Button>
                    <Button
                      leftIcon={<ScanIcon />}
                      onClick={onScanModalOpen}
                      size="md"
                      colorScheme="purple"
                    >
                      Scan Label
                    </Button>
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={onOpen}
                      size="md"
                      colorScheme="green"
                    >
                      Add Food
                    </Button>
                    {/* Dietary Profile Button - Always show so users can set preferences */}
                    <Button
                      size="md"
                      colorScheme="orange"
                      variant="outline"
                      onClick={onDietaryBuilderOpen}
                      leftIcon={<Text fontSize="sm">⚙️</Text>}
                    >
                      Dietary Profile
                    </Button>
                  </HStack>
                </HStack>

                {/* Desktop Search Bar */}
                <HStack spacing={4} w="full">
                  <InputGroup size="lg" flex={1}>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon />
                    </InputLeftElement>
                    <Input
                      placeholder="Search foods by name, category, or brand..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      borderRadius="lg"
                      bg="white"
                      border="2px solid"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", shadow: "lg" }}
                    />
                  </InputGroup>
                  
                  {/* Desktop Filter Controls */}
                  <HStack spacing={3}>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      size="lg"
                      w="150px"
                      bg="white"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="calories">Sort by Calories</option>
                      <option value="protein">Sort by Protein</option>
                    </Select>
                    
                    <Select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      size="lg"
                      w="120px"
                      bg="white"
                    >
                      <option value="asc">Low to High</option>
                      <option value="desc">High to Low</option>
                    </Select>

                    {/* Dietary Filter Toggle - Always visible */}
                    <HStack spacing={2} bg="white" p={3} borderRadius="lg" border="2px solid" borderColor={applyDietaryFilter ? "green.200" : "gray.200"}>
                      <Text fontSize="sm" fontWeight="medium">Dietary Filters:</Text>
                      <Switch
                        isChecked={applyDietaryFilter}
                        onChange={(e) => setApplyDietaryFilter(e.target.checked)}
                        colorScheme="green"
                        size="lg"
                      />
                      {applyDietaryFilter && userPreferences && (
                        <Badge colorScheme="green" variant="solid" ml={2}>
                          {(userPreferences.dietary_restrictions?.length || 0) + (userPreferences.allergens?.length || 0)} active
                        </Badge>
                      )}
                    </HStack>

                    {/* Advanced Filters */}
                    {hasActiveAdvancedFilters() && (
                      <HStack spacing={2} bg="blue.50" p={3} borderRadius="lg" border="2px solid" borderColor="blue.200">
                        <Text fontSize="sm" fontWeight="medium">Advanced Filters:</Text>
                        <Badge colorScheme="blue" variant="solid">
                          Active
                        </Badge>
                        <Button size="xs" variant="outline" colorScheme="blue" onClick={resetAdvancedFilters}>
                          Reset
                        </Button>
                      </HStack>
                    )}
                  </HStack>
                </HStack>

                {/* Desktop Stats Row */}
                <HStack justify="space-between" w="full" fontSize="sm" color="gray.600" bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
                  <HStack spacing={6}>
                    <Text><strong>Total Foods:</strong> {allFoods.length}</Text>
                    <Text><strong>Displayed:</strong> {displayedFoods.length}</Text>
                    {searchQuery.trim() && (
                      <Text><strong>Search Results:</strong> {searchResults.length}</Text>
                    )}
                  </HStack>
                  
                  {/* Active Filters Display */}
                  {userPreferences && applyDietaryFilter && (userPreferences.dietary_restrictions?.length > 0 || userPreferences.allergens?.length > 0) && (
                    <HStack spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">Active Filters:</Text>
                      <Wrap spacing={1}>
                        {userPreferences.dietary_restrictions?.slice(0, 3).map((restriction: string) => (
                          <WrapItem key={restriction}>
                            <Tag size="sm" colorScheme="green" variant="solid">
                              <TagLabel>{restriction}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                        {userPreferences.allergens?.slice(0, 2).map((allergen: string) => (
                          <WrapItem key={allergen}>
                            <Tag size="sm" colorScheme="red" variant="solid">
                              <TagLabel>No {allergen}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </HStack>
                  )}
                </HStack>
              </VStack>
            </Box>
          )}

          {/* Mobile Filter Drawer */}
          <Drawer isOpen={isFilterDrawerOpen} placement="bottom" onClose={onFilterDrawerClose}>
            <DrawerOverlay />
            <DrawerContent borderTopRadius="xl" maxH="80vh">
              <DrawerCloseButton />
              <DrawerHeader borderBottomWidth="1px" pb={3}>
                <Text fontWeight="semibold">Filter & Sort</Text>
              </DrawerHeader>
              <DrawerBody>
                <VStack spacing={4} align="stretch">
                  {/* Sort Options */}
                  <FormControl>
                    <FormLabel fontSize="sm">Sort by</FormLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      size="sm"
                    >
                      <option value="name">Name</option>
                      <option value="calories">Calories</option>
                      <option value="protein">Protein</option>
                    </Select>
                  </FormControl>

                  {/* Sort Order */}
                  <FormControl>
                    <FormLabel fontSize="sm">Order</FormLabel>
                    <Select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      size="sm"
                    >
                      <option value="asc">Low to High</option>
                      <option value="desc">High to Low</option>
                    </Select>
                  </FormControl>

                  {/* Dietary Filter Toggle - Always visible */}
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <FormLabel htmlFor="dietary-filter" mb="0" fontSize="sm">
                      Apply Dietary Filters
                      {applyDietaryFilter && userPreferences && (
                        <Badge colorScheme="green" variant="solid" ml={2} fontSize="xs">
                          {(userPreferences.dietary_restrictions?.length || 0) + (userPreferences.allergens?.length || 0)} active
                        </Badge>
                      )}
                    </FormLabel>
                    <Switch
                      id="dietary-filter"
                      isChecked={applyDietaryFilter}
                      onChange={(e) => setApplyDietaryFilter(e.target.checked)}
                      colorScheme="green"
                    />
                  </FormControl>

                  {/* Active Filters Display */}
                  {userPreferences && applyDietaryFilter && (userPreferences.dietary_restrictions?.length > 0 || userPreferences.allergens?.length > 0) && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Active Filters:</Text>
                      <Wrap spacing={1}>
                        {userPreferences.dietary_restrictions?.map((restriction: string) => (
                          <WrapItem key={restriction}>
                            <Tag size="sm" colorScheme="green" variant="solid">
                              <TagLabel>{restriction}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                        {userPreferences.allergens?.map((allergen: string) => (
                          <WrapItem key={allergen}>
                            <Tag size="sm" colorScheme="red" variant="solid">
                              <TagLabel>No {allergen}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Box>
                  )}

                  <Button colorScheme="green" onClick={onFilterDrawerClose} size="sm">
                    Apply Filters
                  </Button>
                </VStack>
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          {/* Foods Grid - Mobile Optimized */}
          {allFoodsLoading ? (
            <Center py={20}>
              <VStack spacing={4}>
                <Spinner size="xl" color="green.500" />
                <Text color="gray.600" fontSize={isMobile ? "sm" : "md"}>Loading foods...</Text>
              </VStack>
            </Center>
          ) : (
            <Box>
              {/* Search Results or All Foods */}
              {searchQuery.trim() ? (
                <VStack spacing={3} align="stretch">
                  <Text fontWeight="medium" fontSize="sm" color="gray.600" px={2}>
                    Search Results for "{searchQuery}" ({searchResults.length} found)
                  </Text>
                  {searchResults.length > 0 ? (
                    <SimpleGrid columns={isMobile ? 1 : { base: 1, md: 2, lg: 3 }} spacing={isMobile ? 1 : 3}>
                      {searchResults.map((food) => isMobile ? renderMobileFoodCard(food) : renderFoodCard(food))}
                    </SimpleGrid>
                  ) : (
                    <Card>
                      <CardBody textAlign="center" py={8}>
                        <Text fontSize={isMobile ? "sm" : "lg"} color="gray.500">
                          No foods found for "{searchQuery}"
                        </Text>
                        <Text fontSize={isMobile ? "xs" : "sm"} color="gray.400" mt={1}>
                          Try adjusting your search terms
                        </Text>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              ) : (
                <VStack spacing={3} align="stretch">
                  {displayedFoods.length > 0 ? (
                    <SimpleGrid columns={isMobile ? 1 : { base: 1, md: 2, lg: 3 }} spacing={isMobile ? 1 : 4}>
                      {displayedFoods.map((food: FoodItem) => isMobile ? renderMobileFoodCard(food) : renderFoodCard(food))}
                    </SimpleGrid>
                  ) : (
                    <Card>
                      <CardBody textAlign="center" py={12}>
                        <Text fontSize={isMobile ? "sm" : "lg"} color="gray.500">
                          No foods found
                        </Text>
                        <Text fontSize={isMobile ? "xs" : "sm"} color="gray.400" mt={2}>
                          Try adjusting your filter or add some foods to get started
                        </Text>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              )}
            </Box>
          )}

          {/* Mobile Pagination */}
          {isMobile && (currentPage > 1 || hasNextPage) && (
            <HStack justify="center" spacing={4} py={4}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                leftIcon={<ChevronLeftIcon />}
              >
                Previous
              </Button>
              <Text fontSize="sm" color="gray.600">
                Page {currentPage}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={!hasNextPage}
                rightIcon={<ChevronRightIcon />}
              >
                Next
              </Button>
            </HStack>
          )}

          {/* Add Food Modal */}
          <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Add New Food</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <VStack spacing={4}>
                  <HStack spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel>Food Name</FormLabel>
                      <Input
                        value={newFood.name}
                        onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                        placeholder="e.g., Granny Smith Apple"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Brand</FormLabel>
                      <Input
                        value={newFood.brand}
                        onChange={(e) => setNewFood({ ...newFood, brand: e.target.value })}
                        placeholder="e.g., Organic Valley"
                      />
                    </FormControl>
                  </HStack>

                  <HStack spacing={4} w="full">
                    <FormControl isRequired>
                      <FormLabel>Serving Size</FormLabel>
                      <NumberInput
                        value={newFood.serving_size}
                        onChange={(_, value) => setNewFood({ ...newFood, serving_size: value || 1 })}
                        min={0.01}
                        step={0.01}
                        precision={2}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Serving Unit</FormLabel>
                      <Select
                        value={newFood.serving_unit}
                        onChange={(e) => setNewFood({ ...newFood, serving_unit: e.target.value })}
                        placeholder="Select serving unit"
                      >
                        {SERVING_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </HStack>

                  <Heading size="sm" alignSelf="start">Nutrition Facts</Heading>

                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Calories</FormLabel>
                      <NumberInput
                        value={newFood.nutrition.calories}
                        onChange={(_, value) => setNewFood({
                          ...newFood,
                          nutrition: { ...newFood.nutrition, calories: value || 0 }
                        })}
                        min={0}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Protein (g)</FormLabel>
                      <NumberInput
                        value={newFood.nutrition.protein}
                        onChange={(_, value) => setNewFood({
                          ...newFood,
                          nutrition: { ...newFood.nutrition, protein: value || 0 }
                        })}
                        min={0}
                        step={0.1}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Carbs (g)</FormLabel>
                      <NumberInput
                        value={newFood.nutrition.carbs}
                        onChange={(_, value) => setNewFood({
                          ...newFood,
                          nutrition: { ...newFood.nutrition, carbs: value || 0 }
                        })}
                        min={0}
                        step={0.1}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Fat (g)</FormLabel>
                      <NumberInput
                        value={newFood.nutrition.fat}
                        onChange={(_, value) => setNewFood({
                          ...newFood,
                          nutrition: { ...newFood.nutrition, fat: value || 0 }
                        })}
                        min={0}
                        step={0.1}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Fiber (g)</FormLabel>
                      <NumberInput
                        value={newFood.nutrition.fiber}
                        onChange={(_, value) => setNewFood({
                          ...newFood,
                          nutrition: { ...newFood.nutrition, fiber: value || 0 }
                        })}
                        min={0}
                        step={0.1}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Sugar (g)</FormLabel>
                      <NumberInput
                        value={newFood.nutrition.sugar}
                        onChange={(_, value) => setNewFood({
                          ...newFood,
                          nutrition: { ...newFood.nutrition, sugar: value || 0 }
                        })}
                        min={0}
                        step={0.1}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>Sodium (mg)</FormLabel>
                    <NumberInput
                      value={newFood.nutrition.sodium}
                      onChange={(_, value) => setNewFood({
                        ...newFood,
                        nutrition: { ...newFood.nutrition, sodium: value || 0 }
                      })}
                      min={0}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Notes (optional)</FormLabel>
                    <Textarea
                      value={newFood.notes}
                      onChange={(e) => setNewFood({ ...newFood, notes: e.target.value })}
                      placeholder="Any additional information..."
                    />
                  </FormControl>

                  <Button colorScheme="green" onClick={handleAddFood} w="full">
                    Add Food
                  </Button>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Log Food Modal */}
          <Modal isOpen={isLogModalOpen} onClose={onLogModalClose} size={isMobile ? "full" : "lg"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                Log Food: {selectedFood?.name}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {selectedFood && (
                  <VStack spacing={6}>
                    {/* Food Info */}
                    <Card w="full" bg="gray.50">
                      <CardBody>
                        <VStack spacing={3}>
                          <Heading size="sm">Food Information</Heading>
                          <Text fontSize="sm" color="gray.600">
                            Per {selectedFood.serving_size} {selectedFood.serving_unit}
                          </Text>
                          <SimpleGrid columns={2} spacing={2} w="full">
                            <Text fontSize="sm">
                              <strong>Calories:</strong> {Math.round(selectedFood.nutrition.calories)}
                            </Text>
                            <Text fontSize="sm">
                              <strong>Protein:</strong> {selectedFood.nutrition.protein}g
                            </Text>
                            <Text fontSize="sm">
                              <strong>Carbs:</strong> {selectedFood.nutrition.carbs}g
                            </Text>
                            <Text fontSize="sm">
                              <strong>Fat:</strong> {selectedFood.nutrition.fat}g
                            </Text>
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Log Entry Form */}
                    <VStack spacing={4} w="full">
                      <HStack spacing={4} w="full">
                        <FormControl>
                          <FormLabel>Meal Type</FormLabel>
                          <Select
                            value={logEntry.meal_type}
                            onChange={(e) => setLogEntry({ ...logEntry, meal_type: e.target.value })}
                          >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snack">Snack</option>
                          </Select>
                        </FormControl>
                        <QuantityUnitInput
                          quantity={logEntry.servings}
                          unit={logEntry.unit}
                          onQuantityChange={(newQuantity) => handleQuantityUnitChange(newQuantity, logEntry.unit)}
                          onUnitChange={(newUnit) => handleQuantityUnitChange(logEntry.servings, newUnit)}
                          label="Quantity & Unit"
                        />
                      </HStack>

                      {/* Calculated Nutrition Preview */}
                      <Card w="full" bg="green.50" borderColor="green.200" borderWidth={1}>
                        <CardBody>
                          <VStack spacing={3}>
                            <Heading size="sm" color="green.700">
                              Total Nutrition ({logEntry.servings} {logEntry.unit})
                            </Heading>
                            <SimpleGrid columns={2} spacing={2} w="full">
                              <Text fontSize="sm" color="green.700">
                                <strong>Calories:</strong> {Math.round(convertedNutrition?.calories || selectedFood.nutrition.calories * logEntry.servings)}
                              </Text>
                              <Text fontSize="sm" color="green.700">
                                <strong>Protein:</strong> {(convertedNutrition?.protein || selectedFood.nutrition.protein * logEntry.servings).toFixed(1)}g
                              </Text>
                              <Text fontSize="sm" color="green.700">
                                <strong>Carbs:</strong> {(convertedNutrition?.carbs || selectedFood.nutrition.carbs * logEntry.servings).toFixed(1)}g
                              </Text>
                              <Text fontSize="sm" color="green.700">
                                <strong>Fat:</strong> {(convertedNutrition?.fat || selectedFood.nutrition.fat * logEntry.servings).toFixed(1)}g
                              </Text>
                            </SimpleGrid>
                          </VStack>
                        </CardBody>
                      </Card>

                      <FormControl>
                        <FormLabel>Notes (optional)</FormLabel>
                        <Textarea
                          value={logEntry.notes}
                          onChange={(e) => setLogEntry({ ...logEntry, notes: e.target.value })}
                          placeholder="Any additional notes about this meal..."
                        />
                      </FormControl>

                      <Button colorScheme="green" onClick={handleLogSubmit} w="full" size="lg">
                        Log Food
                      </Button>
                    </VStack>
                  </VStack>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Nutrition Label Scanner Modal */}
          <Modal isOpen={isScanModalOpen} onClose={onScanModalClose} size={isMobile ? "full" : "xl"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Scan Nutrition Label</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <NutritionLabelScanner
                  onScanComplete={handleScanComplete}
                  onCreateFood={handleFoodCreatedFromScan}
                  showCreateButton={true}
                  className="w-full"
                />
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Edit Food Modal */}
          <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size={isMobile ? "full" : "xl"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Edit Food: {editingFood?.name}</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {editingFood && (
                  <VStack spacing={4}>
                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>Food Name</FormLabel>
                        <Input
                          value={editingFood.name}
                          onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                          placeholder="e.g., Granny Smith Apple"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Brand</FormLabel>
                        <Input
                          value={editingFood.brand || ''}
                          onChange={(e) => setEditingFood({ ...editingFood, brand: e.target.value })}
                          placeholder="e.g., Organic Valley"
                        />
                      </FormControl>
                    </HStack>

                    <HStack spacing={4} w="full">
                      <FormControl>
                        <FormLabel>Source</FormLabel>
                        <Input
                          value={editingFood.source || ''}
                          onChange={(e) => setEditingFood({ ...editingFood, source: e.target.value })}
                          placeholder="e.g., USDA, Custom"
                        />
                      </FormControl>
                    </HStack>

                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>Serving Size</FormLabel>
                        <NumberInput
                          value={editingFood.serving_size}
                          onChange={(_, value) => setEditingFood({ ...editingFood, serving_size: value || 1 })}
                          min={0.01}
                          step={0.01}
                          precision={2}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Serving Unit</FormLabel>
                        <Select
                          value={editingFood.serving_unit}
                          onChange={(e) => setEditingFood({ ...editingFood, serving_unit: e.target.value })}
                          placeholder="Select serving unit"
                        >
                          {SERVING_UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </HStack>

                    <Heading size="sm" alignSelf="start">Nutrition Facts</Heading>

                    <SimpleGrid columns={2} spacing={4} w="full">
                      <FormControl>
                        <FormLabel>Calories</FormLabel>
                        <NumberInput
                          value={editingFood.nutrition.calories}
                          onChange={(_, value) => setEditingFood({
                            ...editingFood,
                            nutrition: { ...editingFood.nutrition, calories: value || 0 }
                          })}
                          min={0}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Protein (g)</FormLabel>
                        <NumberInput
                          value={editingFood.nutrition.protein}
                          onChange={(_, value) => setEditingFood({
                            ...editingFood,
                            nutrition: { ...editingFood.nutrition, protein: value || 0 }
                          })}
                          min={0}
                          step={0.1}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Carbs (g)</FormLabel>
                        <NumberInput
                          value={editingFood.nutrition.carbs}
                          onChange={(_, value) => setEditingFood({
                            ...editingFood,
                            nutrition: { ...editingFood.nutrition, carbs: value || 0 }
                          })}
                          min={0}
                          step={0.1}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Fat (g)</FormLabel>
                        <NumberInput
                          value={editingFood.nutrition.fat}
                          onChange={(_, value) => setEditingFood({
                            ...editingFood,
                            nutrition: { ...editingFood.nutrition, fat: value || 0 }
                          })}
                          min={0}
                          step={0.1}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Fiber (g)</FormLabel>
                        <NumberInput
                          value={editingFood.nutrition.fiber}
                          onChange={(_, value) => setEditingFood({
                            ...editingFood,
                            nutrition: { ...editingFood.nutrition, fiber: value || 0 }
                          })}
                          min={0}
                          step={0.1}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Sugar (g)</FormLabel>
                        <NumberInput
                          value={editingFood.nutrition.sugar}
                          onChange={(_, value) => setEditingFood({
                            ...editingFood,
                            nutrition: { ...editingFood.nutrition, sugar: value || 0 }
                          })}
                          min={0}
                          step={0.1}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel>Sodium (mg)</FormLabel>
                      <NumberInput
                        value={editingFood.nutrition.sodium}
                        onChange={(_, value) => setEditingFood({
                          ...editingFood,
                          nutrition: { ...editingFood.nutrition, sodium: value || 0 }
                        })}
                        min={0}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    {/* Dietary Information - Mobile Only */}
                    {isMobile && userPreferences && (userPreferences.dietary_restrictions?.length > 0 || userPreferences.allergens?.length > 0) && (
                      <Box w="full" borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
                        <Heading size="xs" mb={2}>Dietary Information</Heading>
                        <FoodCompatibilityScore 
                          food={editingFood} 
                          userProfile={userPreferences} 
                        />
                      </Box>
                    )}

                    <HStack spacing={3} w="full" pt={4}>
                      <Button colorScheme="blue" onClick={handleUpdateFood} flex={1}>
                        Update Food
                      </Button>
                      <Button colorScheme="red" variant="outline" onClick={handleDeleteFood}>
                        Delete
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Dietary Profile Builder Modal */}
          <Modal isOpen={isDietaryBuilderOpen} onClose={onDietaryBuilderClose} size={isMobile ? "full" : "xl"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Dietary Profile Builder</ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                <DietaryProfileBuilder 
                  currentProfile={userPreferences}
                  onProfileUpdate={(preferences: any) => {
                    setUserPreferences(preferences)
                    onDietaryBuilderClose()
                    toast({
                      title: 'Preferences Updated',
                      description: 'Your dietary preferences have been updated.',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    })
                  }}
                />
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Food Detail Modal */}
          <FoodDetailModal
            food={selectedFood}
            isOpen={isDetailModalOpen}
            onClose={onDetailModalClose}
            onLogFood={(food, servings, unit) => {
              setSelectedFood(food)
              setLogEntry({
                meal_type: 'lunch',
                servings: servings,
                unit: unit,
                notes: ''
              })
              onDetailModalClose()
              onLogModalOpen()
            }}
            userProfile={userPreferences}
          />
        </VStack>
      </Container>
    </Box>
  )
}
