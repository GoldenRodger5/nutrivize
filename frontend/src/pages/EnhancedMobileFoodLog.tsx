import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Textarea,
  useDisclosure,
  useToast,
  Card,
  CardBody,
  Badge,
  SimpleGrid,
  Progress,
  CircularProgress,
  CircularProgressLabel,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Icon,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { AddIcon, StarIcon } from '@chakra-ui/icons'
import { useAppState } from '../contexts/AppStateContext'
import api from '../utils/api'
import vectorService, { VectorizedFoodLog } from '../services/vectorService'

interface FoodItem {
  id: string
  name: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  serving_sizes: Array<{
    name: string
    grams: number
  }>
}

// Enhanced Food Log Entry Component with Vector Context
const VectorizedFoodLogEntry = ({ 
  entry, 
  onEdit, 
  onDelete 
}: { 
  entry: VectorizedFoodLog
  onEdit: (entry: VectorizedFoodLog) => void
  onDelete: (id: string) => void
}) => {
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  // Determine visual indicators based on context score
  const getContextIndicator = (score: number) => {
    if (score > 0.8) return { color: 'green', label: 'Highly Relevant' }
    if (score > 0.6) return { color: 'blue', label: 'Good Match' }
    if (score > 0.4) return { color: 'orange', label: 'Some Context' }
    return { color: 'gray', label: 'Basic Entry' }
  }

  const contextInfo = getContextIndicator(entry.context_score || 0)

  return (
    <Card bg={cardBg} border="1px" borderColor={borderColor} shadow="sm">
      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1} flex={1}>
              <HStack>
                <Text fontWeight="semibold" fontSize="sm" lineHeight="short" noOfLines={1}>
                  {entry.food_name}
                </Text>
                {entry.context_score && entry.context_score > 0.4 && (
                  <Tooltip label={`AI Context: ${contextInfo.label}`}>
                    <Icon as={StarIcon} color={`${contextInfo.color}.400`} boxSize={3} />
                  </Tooltip>
                )}
              </HStack>
              <HStack spacing={2}>
                <Badge variant="outline" fontSize="xs">
                  {entry.meal_type}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  {entry.servings}x {entry.serving_unit}
                </Text>
                {entry.context_score && entry.context_score > 0.6 && (
                  <Badge colorScheme={contextInfo.color} fontSize="xs">
                    Smart Pick
                  </Badge>
                )}
              </HStack>
            </VStack>
            <VStack spacing={0} align="end">
              <Text fontSize="sm" fontWeight="medium">
                {Math.round(entry.calories)} cal
              </Text>
              <Text fontSize="xs" color="gray.500">
                {new Date(entry.logged_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </VStack>
          </HStack>

          {/* Nutrition Overview */}
          <SimpleGrid columns={3} spacing={2} fontSize="xs">
            <VStack spacing={0}>
              <Text fontWeight="medium">{entry.protein}g</Text>
              <Text color="gray.500">Protein</Text>
            </VStack>
            <VStack spacing={0}>
              <Text fontWeight="medium">{entry.carbs}g</Text>
              <Text color="gray.500">Carbs</Text>
            </VStack>
            <VStack spacing={0}>
              <Text fontWeight="medium">{entry.fat}g</Text>
              <Text color="gray.500">Fat</Text>
            </VStack>
          </SimpleGrid>

          {/* Action Buttons */}
          <HStack spacing={2} pt={1}>
            <Button
              size="xs"
              variant="outline"
              onClick={() => onEdit(entry)}
              flex={1}
            >
              Edit
            </Button>
            <Button
              size="xs"
              colorScheme="red"
              variant="outline"
              onClick={() => onDelete(entry.id)}
              flex={1}
            >
              Delete
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}

// Smart Food Recommendations Component
const SmartFoodRecommendations = ({ 
  mealType, 
  onSelectFood,
  isVisible 
}: { 
  mealType: string
  onSelectFood: (food: any) => void
  isVisible: boolean
}) => {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isVisible && mealType) {
      loadRecommendations()
    }
  }, [isVisible, mealType])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const smartRecs = await vectorService.getSmartFoodRecommendations(mealType)
      setRecommendations(smartRecs.slice(0, 6)) // Show top 6
    } catch (error) {
      console.error('Failed to load smart recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <Box>
      <HStack mb={3}>
        <Icon as={StarIcon} color="blue.400" />
        <Text fontSize="sm" fontWeight="medium" color="blue.600">
          Smart Recommendations for {mealType}
        </Text>
        {loading && <Spinner size="xs" />}
      </HStack>
      
      {recommendations.length > 0 && (
        <SimpleGrid columns={2} spacing={2}>
          {recommendations.map((rec, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              onClick={() => onSelectFood(rec)}
              p={2}
              h="auto"
              justifyContent="start"
              _hover={{ bg: 'blue.50' }}
            >
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                  {rec.name}
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="2xs" color="gray.500">
                    {Math.round(rec.calories)} cal
                  </Text>
                  {rec.similarity_score > 0.6 && (
                    <Badge size="xs" colorScheme="blue">
                      {Math.round(rec.similarity_score * 100)}% match
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="2xs" color="gray.400" noOfLines={1}>
                  {rec.recommendation_reason}
                </Text>
              </VStack>
            </Button>
          ))}
        </SimpleGrid>
      )}
    </Box>
  )
}

// Main Enhanced Mobile Food Log Component
export default function EnhancedMobileFoodLog() {
  const { activeGoal, dailySummary, refreshDailySummary } = useAppState()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [foodLogs, setFoodLogs] = useState<VectorizedFoodLog[]>([])
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([])
  const [logEntry, setLogEntry] = useState({
    food_id: '',
    servings: 1,
    meal_type: 'lunch',
    notes: ''
  })
  const [vectorLoading, setVectorLoading] = useState(false)
  const [showSmartRecs, setShowSmartRecs] = useState(true)

  const { isOpen: isLogModalOpen, onOpen: onLogModalOpen, onClose: onLogModalClose } = useDisclosure()
  const toast = useToast()
  const bg = useColorModeValue('white', 'gray.800')

  useEffect(() => {
    fetchVectorizedFoodLogs()
    fetchFoods()
    refreshDailySummary(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = foods.filter(food => 
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredFoods(filtered)
    } else {
      setFilteredFoods([])
    }
  }, [searchQuery, foods])

  const fetchVectorizedFoodLogs = async () => {
    setVectorLoading(true)
    try {
      const vectorizedLogs = await vectorService.getSmartFoodLogs(selectedDate)
      setFoodLogs(vectorizedLogs)
    } catch (error) {
      console.error('Failed to fetch vectorized food logs:', error)
      toast({
        title: 'Loading Error',
        description: 'Failed to load smart food logs. Falling back to basic view.',
        status: 'warning',
        duration: 3000
      })
      // Fallback to traditional API
      try {
        const response = await api.get(`/food-logs/date/${selectedDate}`)
        setFoodLogs(response.data.map((log: any) => ({ ...log, context_score: 0 })))
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
      }
    } finally {
      setVectorLoading(false)
    }
  }

  const fetchFoods = async () => {
    try {
      const response = await api.get('/foods')
      setFoods(response.data)
    } catch (error) {
      console.error('Failed to fetch foods:', error)
    }
  }

  const handleLogFood = async () => {
    try {
      const selectedFood = foods.find(f => f.id === logEntry.food_id)
      if (!selectedFood) return

      const logData = {
        ...logEntry,
        date: selectedDate
      }

      await api.post('/food-logs', logData)
      
      toast({
        title: 'Food Logged Successfully',
        description: `${selectedFood.name} added to your ${logEntry.meal_type}`,
        status: 'success',
        duration: 2000
      })

      // Reset form and refresh data
      setLogEntry({
        food_id: '',
        servings: 1,
        meal_type: 'lunch',
        notes: ''
      })
      onLogModalClose()
      
      // Refresh vectorized logs to get updated context
      await fetchVectorizedFoodLogs()
      refreshDailySummary(selectedDate)
    } catch (error) {
      console.error('Failed to log food:', error)
      toast({
        title: 'Error',
        description: 'Failed to log food entry',
        status: 'error',
        duration: 3000
      })
    }
  }

  const handleDeleteLog = async (logId: string) => {
    try {
      await api.delete(`/food-logs/${logId}`)
      
      toast({
        title: 'Food Entry Deleted',
        status: 'info',
        duration: 2000
      })

      await fetchVectorizedFoodLogs()
      refreshDailySummary(selectedDate)
    } catch (error) {
      console.error('Failed to delete food log:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete entry',
        status: 'error',
        duration: 3000
      })
    }
  }

  const handleSmartFoodSelect = (food: any) => {
    setLogEntry(prev => ({
      ...prev,
      food_id: food.id
    }))
    setSearchQuery(food.name)
  }

  return (
    <Box bg={bg} minH="100vh" p={4}>
      <VStack spacing={6} maxW="md" mx="auto">
        {/* Header */}
        <HStack justify="space-between" w="full">
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold">Enhanced Food Log</Text>
            <HStack>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                size="sm"
                w="auto"
              />
              {vectorLoading && (
                <Tooltip label="Loading smart context...">
                  <Spinner size="sm" color="blue.400" />
                </Tooltip>
              )}
            </HStack>
          </VStack>
          <IconButton
            aria-label="Add Food"
            icon={<AddIcon />}
            colorScheme="blue"
            onClick={onLogModalOpen}
          />
        </HStack>

        {/* Vector Status Alert */}
        {foodLogs.some(log => (log.context_score || 0) > 0.4) && (
          <Alert status="info" borderRadius="md" size="sm">
            <AlertIcon />
            <Text fontSize="sm">
              🎯 Smart AI context is active! Entries marked with ⭐ are personalized based on your patterns.
            </Text>
          </Alert>
        )}

        {/* Daily Summary */}
        {dailySummary && (
          <Card bg={useColorModeValue('white', 'gray.700')} shadow="sm" w="full">
            <CardBody p={4}>
              <VStack spacing={4}>
                {/* Calories Circle */}
                <VStack spacing={2}>
                  <CircularProgress 
                    value={Math.min((dailySummary.total_nutrition.calories / (activeGoal?.nutrition_targets.calories || 2000)) * 100, 100)} 
                    size="80px" 
                    color="green.400"
                    thickness="8px"
                  >
                    <CircularProgressLabel fontSize="sm" fontWeight="bold">
                      {Math.round(dailySummary.total_nutrition.calories)}
                    </CircularProgressLabel>
                  </CircularProgress>
                  <VStack spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">Calories</Text>
                    <Text fontSize="xs" color="gray.500">
                      {activeGoal?.nutrition_targets.calories ? `of ${activeGoal.nutrition_targets.calories}` : 'goal not set'}
                    </Text>
                  </VStack>
                </VStack>

                {/* Macros */}
                <SimpleGrid columns={3} spacing={4} w="full">
                  <VStack spacing={1}>
                    <Progress 
                      value={Math.min((dailySummary.total_nutrition.protein / (activeGoal?.nutrition_targets.protein || 100)) * 100, 100)} 
                      colorScheme="blue" 
                      size="sm" 
                      w="40px"
                      borderRadius="full"
                    />
                    <Text fontSize="xs" fontWeight="medium">{dailySummary.total_nutrition.protein}g</Text>
                    <Text fontSize="2xs" color="gray.500">Protein</Text>
                  </VStack>
                  
                  <VStack spacing={1}>
                    <Progress 
                      value={Math.min((dailySummary.total_nutrition.carbs / (activeGoal?.nutrition_targets.carbs || 200)) * 100, 100)} 
                      colorScheme="orange" 
                      size="sm" 
                      w="40px"
                      borderRadius="full"
                    />
                    <Text fontSize="xs" fontWeight="medium">{dailySummary.total_nutrition.carbs}g</Text>
                    <Text fontSize="2xs" color="gray.500">Carbs</Text>
                  </VStack>
                  
                  <VStack spacing={1}>
                    <Progress 
                      value={Math.min((dailySummary.total_nutrition.fat / (activeGoal?.nutrition_targets.fat || 80)) * 100, 100)} 
                      colorScheme="purple" 
                      size="sm" 
                      w="40px"
                      borderRadius="full"
                    />
                    <Text fontSize="xs" fontWeight="medium">{dailySummary.total_nutrition.fat}g</Text>
                    <Text fontSize="2xs" color="gray.500">Fat</Text>
                  </VStack>
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Food Logs */}
        <VStack spacing={3} w="full">
          {foodLogs.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No food entries for this date
            </Text>
          ) : (
            foodLogs.map(entry => (
              <VectorizedFoodLogEntry
                key={entry.id}
                entry={entry}
                onEdit={() => {}}
                onDelete={handleDeleteLog}
              />
            ))
          )}
        </VStack>
      </VStack>

      {/* Enhanced Add Food Modal */}
      <Modal isOpen={isLogModalOpen} onClose={onLogModalClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Food Entry</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Meal Type Selection */}
              <Select
                value={logEntry.meal_type}
                onChange={(e) => {
                  setLogEntry(prev => ({ ...prev, meal_type: e.target.value }))
                  setShowSmartRecs(true) // Trigger smart recommendations
                }}
                placeholder="Select meal type"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </Select>

              {/* Smart Recommendations */}
              {logEntry.meal_type && (
                <SmartFoodRecommendations
                  mealType={logEntry.meal_type}
                  onSelectFood={handleSmartFoodSelect}
                  isVisible={showSmartRecs}
                />
              )}

              {/* Food Search */}
              <Input
                placeholder="Search for food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* Food Selection */}
              {filteredFoods.length > 0 && (
                <VStack spacing={2} maxH="200px" overflowY="auto" w="full">
                  {filteredFoods.slice(0, 10).map(food => (
                    <Button
                      key={food.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLogEntry(prev => ({ ...prev, food_id: food.id }))
                        setSearchQuery(food.name)
                        setFilteredFoods([])
                      }}
                      w="full"
                      justifyContent="start"
                    >
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm">{food.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {food.calories_per_100g} cal/100g
                        </Text>
                      </VStack>
                    </Button>
                  ))}
                </VStack>
              )}

              {/* Servings */}
              <HStack>
                <Text fontSize="sm">Servings:</Text>
                <Input
                  type="number"
                  value={logEntry.servings}
                  onChange={(e) => setLogEntry(prev => ({ 
                    ...prev, 
                    servings: parseFloat(e.target.value) || 1 
                  }))}
                  min="0.1"
                  step="0.1"
                  w="100px"
                />
              </HStack>

              {/* Notes */}
              <Textarea
                placeholder="Notes (optional)"
                value={logEntry.notes}
                onChange={(e) => setLogEntry(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLogModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleLogFood}
              isDisabled={!logEntry.food_id}
            >
              Log Food
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
