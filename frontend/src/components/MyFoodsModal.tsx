// My Foods Modal - Shows both favorites and recent foods
import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Spinner,
  Center,
  useToast,
  Box,
  IconButton,
  useBreakpointValue,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Divider,
  Collapse,
  useColorModeValue
} from '@chakra-ui/react'
import { FaHeart, FaTrash, FaSearch, FaPlus, FaClock, FaStar, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { useUserFavorites } from '../hooks/useUserFavorites'
import { UserFavorite } from '../services/userFavoritesService'
import api from '../utils/api'
import { FoodItem } from '../types'
import FoodDetailModal from './FoodDetailModal'
import { calculateNutritionForQuantity } from '../utils/unitConversion'
import { SERVING_UNITS } from '../constants/servingUnits'
import { getSmartUnitAssignment } from '../utils/smartUnitAssignment'

interface MyFoodsModalProps {
  isOpen: boolean
  onClose: () => void
  onFoodSelect?: (food: FoodItem) => void
  showLogButtons?: boolean
}

interface RecentFood {
  id: string
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
  last_used: string
  usage_count: number
}

const MyFoodsModal: React.FC<MyFoodsModalProps> = ({
  isOpen,
  onClose,
  onFoodSelect,
  showLogButtons = true
}) => {
  const {
    favorites,
    stats,
    loading: favoritesLoading,
    removeFavorite,
    searchFavorites,
  } = useUserFavorites()

  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([])
  const [recentLoading, setRecentLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'date'>('name')
  const [deletingFavorite, setDeletingFavorite] = useState<UserFavorite | null>(null)
  const [tabIndex, setTabIndex] = useState(0)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [isFoodDetailOpen, setIsFoodDetailOpen] = useState(false)

  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, lg: false })

  // Load recent foods
  useEffect(() => {
    if (isOpen) {
      loadRecentFoods()
    }
  }, [isOpen])

  const loadRecentFoods = async () => {
    setRecentLoading(true)
    try {
      const response = await api.get('/user-foods/recent')
      setRecentFoods(response.data.recent_foods || [])
    } catch (error) {
      console.error('Error loading recent foods:', error)
      toast({
        title: 'Error loading recent foods',
        description: 'Failed to load your recent foods. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setRecentLoading(false)
    }
  }

  const handleDeleteFavorite = (favorite: UserFavorite) => {
    setDeletingFavorite(favorite)
    onDeleteOpen()
  }

  const handleConfirmDelete = async () => {
    if (!deletingFavorite) return

    try {
      await removeFavorite(deletingFavorite.food_id)
      onDeleteClose()
      setDeletingFavorite(null)
      toast({
        title: 'Favorite removed',
        description: 'Food has been removed from your favorites.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error removing favorite',
        description: 'Failed to remove favorite. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleFoodClick = (food: FoodItem) => {
    setSelectedFood(food)
    setIsFoodDetailOpen(true)
  }

  const handleFoodDetailClose = () => {
    setIsFoodDetailOpen(false)
    setSelectedFood(null)
  }

  const convertFavoriteToFoodItem = (favorite: UserFavorite): FoodItem => {
    return {
      id: favorite.food_id,
      name: favorite.custom_name || favorite.food_name,
      brand: '',
      serving_size: favorite.default_serving_size || 1,
      serving_unit: favorite.default_serving_unit || 'serving',
      nutrition: {
        calories: favorite.nutrition?.calories || 0,
        protein: favorite.nutrition?.protein || 0,
        carbs: favorite.nutrition?.carbs || 0,
        fat: favorite.nutrition?.fat || 0,
        fiber: favorite.nutrition?.fiber || 0,
        sugar: favorite.nutrition?.sugar || 0,
        sodium: favorite.nutrition?.sodium || 0,
      },
      dietary_attributes: favorite.dietary_attributes || {
        dietary_restrictions: [],
        allergens: [],
        food_categories: []
      },
      source: 'favorites'
    }
  }

  const convertRecentToFoodItem = (recent: RecentFood): FoodItem => {
    return {
      id: recent.food_id,
      name: recent.food_name,
      brand: '',
      serving_size: recent.quantity,
      serving_unit: recent.unit,
      nutrition: {
        calories: recent.calories,
        protein: recent.protein,
        carbs: recent.carbs,
        fat: recent.fat,
        fiber: recent.fiber,
        sugar: recent.sugar,
        sodium: recent.sodium,
      },
      dietary_attributes: {
        dietary_restrictions: [],
        allergens: [],
        food_categories: []
      },
      source: 'recent'
    }
  }

  const filteredFavorites = React.useMemo(() => {
    let filtered = favorites

    // Search filter
    if (searchQuery.trim()) {
      filtered = searchFavorites(searchQuery)
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(fav => fav.category === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'usage':
        filtered.sort((a, b) => b.usage_count - a.usage_count)
        break
      case 'date':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'name':
      default:
        filtered.sort((a, b) => (a.custom_name || a.food_name).localeCompare(b.custom_name || b.food_name))
        break
    }

    return filtered
  }, [favorites, searchQuery, selectedCategory, sortBy, searchFavorites])

  const FavoriteCard = ({ favorite }: { favorite: UserFavorite }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    
    // Convert "serving" units to smart units
    const getInitialUnit = () => {
      const currentUnit = favorite.default_serving_unit || 'g'
      if (currentUnit === 'serving' || currentUnit === 'servings') {
        const smartUnit = getSmartUnitAssignment(favorite.food_name)
        return smartUnit.defaultUnit
      }
      return currentUnit
    }
    
    const getInitialSize = () => {
      const currentSize = favorite.default_serving_size || 1
      const currentUnit = favorite.default_serving_unit || 'g'
      if (currentUnit === 'serving' || currentUnit === 'servings') {
        const smartUnit = getSmartUnitAssignment(favorite.food_name)
        return smartUnit.defaultSize
      }
      return currentSize
    }
    
    const [customQuantity, setCustomQuantity] = useState(getInitialSize())
    const [customUnit, setCustomUnit] = useState(getInitialUnit())
    const [calculatedNutrition, setCalculatedNutrition] = useState(favorite.nutrition || null)
    
    const bgColor = useColorModeValue('white', 'gray.800')
    const expandedBg = useColorModeValue('gray.50', 'gray.700')
    
    // Calculate nutrition when quantity or unit changes
    useEffect(() => {
      if (favorite.nutrition) {
        const baseSize = favorite.default_serving_size || 1
        const baseUnit = favorite.default_serving_unit || 'g'
        
        // If base unit is "serving", use ratio scaling since we can't convert
        if (baseUnit === 'serving' || baseUnit === 'servings') {
          const ratio = customQuantity / baseSize
          setCalculatedNutrition({
            calories: Math.round((favorite.nutrition.calories || 0) * ratio),
            protein: Math.round((favorite.nutrition.protein || 0) * ratio * 10) / 10,
            carbs: Math.round((favorite.nutrition.carbs || 0) * ratio * 10) / 10,
            fat: Math.round((favorite.nutrition.fat || 0) * ratio * 10) / 10,
            fiber: Math.round((favorite.nutrition.fiber || 0) * ratio * 10) / 10,
            sugar: Math.round((favorite.nutrition.sugar || 0) * ratio * 10) / 10,
            sodium: Math.round((favorite.nutrition.sodium || 0) * ratio * 10) / 10
          })
        } else {
          // Try unit conversion
          const newNutrition = calculateNutritionForQuantity(
            favorite.nutrition,
            baseSize,
            baseUnit,
            customQuantity,
            customUnit
          )
          
          if (newNutrition) {
            setCalculatedNutrition({
              calories: newNutrition.calories || 0,
              protein: newNutrition.protein || 0,
              carbs: newNutrition.carbs || 0,
              fat: newNutrition.fat || 0,
              fiber: newNutrition.fiber || 0,
              sugar: newNutrition.sugar || 0,
              sodium: newNutrition.sodium || 0
            })
          } else {
            // If conversion fails, use ratio scaling
            const ratio = customQuantity / baseSize
            setCalculatedNutrition({
              calories: Math.round((favorite.nutrition.calories || 0) * ratio),
              protein: Math.round((favorite.nutrition.protein || 0) * ratio * 10) / 10,
              carbs: Math.round((favorite.nutrition.carbs || 0) * ratio * 10) / 10,
              fat: Math.round((favorite.nutrition.fat || 0) * ratio * 10) / 10,
              fiber: Math.round((favorite.nutrition.fiber || 0) * ratio * 10) / 10,
              sugar: Math.round((favorite.nutrition.sugar || 0) * ratio * 10) / 10,
              sodium: Math.round((favorite.nutrition.sodium || 0) * ratio * 10) / 10
            })
          }
        }
      }
    }, [customQuantity, customUnit, favorite])
    
    const handleAddToLog = (e: React.MouseEvent) => {
      e.stopPropagation()
      
      // Create a modified favorite with custom quantity
      const modifiedFavorite = {
        ...favorite,
        default_serving_size: customQuantity,
        default_serving_unit: customUnit,
        nutrition: calculatedNutrition || favorite.nutrition
      }
      
      onFoodSelect?.(convertFavoriteToFoodItem(modifiedFavorite))
    }
    
    return (
      <Card 
        size="sm" 
        bg={isExpanded ? expandedBg : bgColor}
        _hover={{ shadow: 'md', cursor: 'pointer' }} 
        onClick={() => handleFoodClick(convertFavoriteToFoodItem(favorite))}
      >
        <CardBody>
          <VStack align="start" spacing={2}>
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={0} flex={1}>
                <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                  {favorite.custom_name || favorite.food_name}
                </Text>
                {favorite.custom_name && (
                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                    {favorite.food_name}
                  </Text>
                )}
              </VStack>
              <HStack spacing={1}>
                <IconButton
                  aria-label="Expand nutrition details"
                  icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                  }}
                />
                <IconButton
                  aria-label="Remove from favorites"
                  icon={<FaTrash />}
                  size="xs"
                  colorScheme="red"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFavorite(favorite)
                  }}
                />
              </HStack>
            </HStack>

            <HStack justify="space-between" w="full">
              <Badge colorScheme="purple" size="sm">
                {favorite.category}
              </Badge>
              <HStack spacing={1}>
                <FaStar size={10} />
                <Text fontSize="xs" color="gray.500">
                  {favorite.usage_count}
                </Text>
              </HStack>
            </HStack>

            {/* Basic nutrition display */}
            {calculatedNutrition && (
              <SimpleGrid columns={2} spacing={1} w="full" fontSize="xs">
                <Text>Cal: {Math.round(calculatedNutrition.calories || 0)}</Text>
                <Text>Pro: {Math.round((calculatedNutrition.protein || 0) * 10) / 10}g</Text>
                <Text>Carbs: {Math.round((calculatedNutrition.carbs || 0) * 10) / 10}g</Text>
                <Text>Fat: {Math.round((calculatedNutrition.fat || 0) * 10) / 10}g</Text>
              </SimpleGrid>
            )}

            {/* Expanded nutrition and unit conversion */}
            <Collapse in={isExpanded} animateOpacity>
              <VStack spacing={3} align="stretch" w="full" pt={2}>
                <Divider />
                
                {/* Unit Conversion Controls */}
                <Box>
                  <HStack spacing={2} align="end">
                    <FormControl size="sm" flex="1">
                      <FormLabel fontSize="xs" mb={1}>Quantity</FormLabel>
                      <NumberInput
                        value={customQuantity}
                        onChange={(_, value) => setCustomQuantity(value || 1)}
                        min={0.1}
                        max={50}
                        step={0.1}
                        precision={1}
                        size="sm"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl size="sm" flex="1">
                      <FormLabel fontSize="xs" mb={1}>Unit</FormLabel>
                      <Select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        size="sm"
                      >
                        {SERVING_UNITS.map(unit => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </HStack>
                  
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {(favorite.default_serving_unit === 'serving' || favorite.default_serving_unit === 'servings') ? 
                      `Original: ${favorite.default_serving_size || 1} ${favorite.default_serving_unit || 'serving'} (converted to descriptive unit)` :
                      `Default: ${favorite.default_serving_size || 1} ${favorite.default_serving_unit || 'g'}`
                    }
                  </Text>
                </Box>

                {/* Detailed Nutrition */}
                {calculatedNutrition && (
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={2}>
                      Nutrition per {customQuantity} {customUnit}(s):
                    </Text>
                    <Box maxH="120px" overflowY="auto" pr={2}>
                      <SimpleGrid columns={2} spacing={2} fontSize="xs">
                        <Text>🔥 Calories: {Math.round(calculatedNutrition.calories || 0)}</Text>
                        <Text>💪 Protein: {Math.round((calculatedNutrition.protein || 0) * 10) / 10}g</Text>
                        <Text>🌾 Carbs: {Math.round((calculatedNutrition.carbs || 0) * 10) / 10}g</Text>
                        <Text>🥑 Fat: {Math.round((calculatedNutrition.fat || 0) * 10) / 10}g</Text>
                        {calculatedNutrition.fiber > 0 && (
                          <Text>🌿 Fiber: {Math.round((calculatedNutrition.fiber || 0) * 10) / 10}g</Text>
                        )}
                        {calculatedNutrition.sugar > 0 && (
                          <Text>🍯 Sugar: {Math.round((calculatedNutrition.sugar || 0) * 10) / 10}g</Text>
                        )}
                        {calculatedNutrition.sodium > 0 && (
                          <Text>🧂 Sodium: {Math.round(calculatedNutrition.sodium || 0)}mg</Text>
                        )}
                      </SimpleGrid>
                    </Box>
                  </Box>
                )}

                {/* Dietary Attributes */}
                {favorite.dietary_attributes && (
                  <Box maxH="80px" overflowY="auto" pr={2}>
                    <Text fontSize="xs" fontWeight="bold" mb={1}>Dietary Info:</Text>
                    <VStack align="start" spacing={1}>
                      {favorite.dietary_attributes.dietary_restrictions?.length > 0 && (
                        <Text fontSize="xs">
                          🏷️ <strong>Restrictions:</strong> {favorite.dietary_attributes.dietary_restrictions.join(', ')}
                        </Text>
                      )}
                      {favorite.dietary_attributes.allergens?.length > 0 && (
                        <Text fontSize="xs">
                          ⚠️ <strong>Allergens:</strong> {favorite.dietary_attributes.allergens.join(', ')}
                        </Text>
                      )}
                      {favorite.dietary_attributes.food_categories?.length > 0 && (
                        <Text fontSize="xs">
                          📂 <strong>Categories:</strong> {favorite.dietary_attributes.food_categories.join(', ')}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Notes */}
                {favorite.notes && (
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" mb={1}>Notes:</Text>
                    <Text fontSize="xs" color="gray.600">{favorite.notes}</Text>
                  </Box>
                )}
              </VStack>
            </Collapse>

            {showLogButtons && (
              <Button
                size="xs"
                colorScheme="green"
                leftIcon={<FaPlus />}
                onClick={handleAddToLog}
                w="full"
              >
                Add {customQuantity} {customUnit}(s) to Log
              </Button>
            )}
          </VStack>
        </CardBody>
      </Card>
    )
  }

  const RecentFoodCard = ({ recent }: { recent: RecentFood }) => (
    <Card size="sm" _hover={{ shadow: 'md', cursor: 'pointer' }} onClick={() => handleFoodClick(convertRecentToFoodItem(recent))}>
      <CardBody>
        <VStack align="start" spacing={2}>
          <HStack justify="space-between" w="full">
            <VStack align="start" spacing={0} flex={1}>
              <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                {recent.food_name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {recent.quantity} {recent.unit}
              </Text>
            </VStack>
            <HStack spacing={1}>
              <FaClock size={10} />
              <Text fontSize="xs" color="gray.500">
                {recent.usage_count}
              </Text>
            </HStack>
          </HStack>

          <SimpleGrid columns={2} spacing={1} w="full" fontSize="xs">
            <Text>Cal: {Math.round(recent.calories)}</Text>
            <Text>Pro: {recent.protein}g</Text>
          </SimpleGrid>

          {showLogButtons && (
            <Button
              size="xs"
              colorScheme="blue"
              leftIcon={<FaPlus />}
              onClick={(e) => {
                e.stopPropagation()
                onFoodSelect?.(convertRecentToFoodItem(recent))
              }}
              w="full"
            >
              Add to Log
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  )

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "4xl"}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FaHeart color="red" />
              <Text>My Foods</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs index={tabIndex} onChange={setTabIndex}>
              <TabList>
                <Tab>
                  <HStack>
                    <FaHeart />
                    <Text>Favorites ({favorites.length})</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack>
                    <FaClock />
                    <Text>Recent ({recentFoods.length})</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Favorites Panel */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Search and Filters */}
                    <HStack spacing={2}>
                      <InputGroup flex={1}>
                        <InputLeftElement pointerEvents="none">
                          <FaSearch color="gray.300" />
                        </InputLeftElement>
                        <Input
                          placeholder="Search favorites..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          size="sm"
                        />
                      </InputGroup>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        size="sm"
                        w="120px"
                      >
                        <option value="all">All</option>
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </Select>
                      <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'date')}
                        size="sm"
                        w="120px"
                      >
                        <option value="name">Name</option>
                        <option value="usage">Usage</option>
                        <option value="date">Date</option>
                      </Select>
                    </HStack>

                    {/* Stats */}
                    {stats && (
                      <Box p={3} bg="blue.50" borderRadius="md">
                        <HStack justify="space-between" fontSize="sm">
                          <Text>Total Favorites: <strong>{stats.total_favorites}</strong></Text>
                          <Text>Most Used: <strong>{stats.most_used_favorites[0]?.food_name || 'None'}</strong></Text>
                        </HStack>
                      </Box>
                    )}

                    {/* Favorites Grid */}
                    {favoritesLoading ? (
                      <Center py={8}>
                        <Spinner size="lg" />
                      </Center>
                    ) : filteredFavorites.length > 0 ? (
                      <SimpleGrid columns={isMobile ? 1 : 2} spacing={3}>
                        {filteredFavorites.map(favorite => (
                          <FavoriteCard key={favorite.id} favorite={favorite} />
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Center py={8}>
                        <VStack spacing={2}>
                          <Text color="gray.500">No favorites found</Text>
                          <Text fontSize="sm" color="gray.400">
                            Add foods to your favorites to see them here
                          </Text>
                        </VStack>
                      </Center>
                    )}
                  </VStack>
                </TabPanel>

                {/* Recent Foods Panel */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* Recent Foods Grid */}
                    {recentLoading ? (
                      <Center py={8}>
                        <Spinner size="lg" />
                      </Center>
                    ) : recentFoods.length > 0 ? (
                      <SimpleGrid columns={isMobile ? 1 : 2} spacing={3}>
                        {recentFoods.slice(0, 20).map(recent => (
                          <RecentFoodCard key={recent.id} recent={recent} />
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Center py={8}>
                        <VStack spacing={2}>
                          <Text color="gray.500">No recent foods found</Text>
                          <Text fontSize="sm" color="gray.400">
                            Start logging foods to see them here
                          </Text>
                        </VStack>
                      </Center>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Favorite
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to remove "{deletingFavorite?.custom_name || deletingFavorite?.food_name}" from your favorites?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Food Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={isFoodDetailOpen}
        onClose={handleFoodDetailClose}
        onLogFood={onFoodSelect && ((food, _quantity, _unit) => {
          onFoodSelect(food)
          handleFoodDetailClose()
        })}
      />
    </>
  )
}

export default MyFoodsModal
