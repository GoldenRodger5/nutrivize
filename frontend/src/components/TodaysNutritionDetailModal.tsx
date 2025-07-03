import { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Progress,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Center,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  AlertDescription
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import api from '../utils/api'

const MotionCard = motion(Card)

interface NutritionDetailModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FoodLog {
  _id: string
  food_name: string
  amount: number
  unit: string
  meal_type: string
  logged_at: string | null
  nutrition: Record<string, number>
  notes: string
}

interface MealBreakdown {
  logs: FoodLog[]
  totals: Record<string, number>
}

interface TodaysNutritionData {
  success: boolean
  date: string
  meals_breakdown: Record<string, MealBreakdown>
  overall_totals: Record<string, number>
  target_percentages: Record<string, {
    current: number
    target: number
    percentage: number
    remaining: number
  }>
  targets: Record<string, number>
  meal_timing: Array<{
    time: string
    meal_type: string
    food: string
  }>
  total_foods_logged: number
  meals_with_data: number
  summary: {
    calories_consumed: number
    protein_consumed: number
    carbs_consumed: number
    fat_consumed: number
    fiber_consumed: number
    calories_remaining: number
    protein_remaining: number
  }
}

export default function TodaysNutritionDetailModal({ isOpen, onClose }: NutritionDetailModalProps) {
  const [nutritionData, setNutritionData] = useState<TodaysNutritionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const mealBg = useColorModeValue('gray.50', 'gray.700')

  const fetchNutritionDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/todays-nutrition-detail')
      setNutritionData(response.data)
    } catch (err: any) {
      console.error('Error fetching nutrition detail:', err)
      setError(err.message || 'Failed to load nutrition details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNutritionDetail()
    }
  }, [isOpen])

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return '🌅'
      case 'lunch': return '🌞'
      case 'dinner': return '🌙'
      case 'snack': return '🍎'
      default: return '🍽️'
    }
  }

  const getNutrientColor = (percentage: number) => {
    if (percentage >= 90) return 'green'
    if (percentage >= 70) return 'blue'
    if (percentage >= 50) return 'yellow'
    return 'red'
  }

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return timeStr
    }
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Today's Nutrition Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Center py={20}>
              <VStack spacing={4}>
                <Spinner size="xl" color="blue.500" />
                <Text>Loading your nutrition details...</Text>
              </VStack>
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  if (error || !nutritionData?.success) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Today's Nutrition Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="error">
              <AlertIcon />
              <AlertDescription>
                {error || 'Unable to load nutrition details. Please try again.'}
              </AlertDescription>
            </Alert>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => fetchNutritionDetail()} colorScheme="blue" mr={3}>
              Retry
            </Button>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay zIndex={1400} />
      <ModalContent zIndex={1500}>
        <ModalHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Heading size="lg">📊 Today's Nutrition Breakdown</Heading>
              <Text fontSize="sm" color="gray.500">
                {new Date(nutritionData.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </VStack>
            <VStack spacing={1}>
              <Badge colorScheme="blue" fontSize="sm">
                {nutritionData.total_foods_logged} foods logged
              </Badge>
              <Badge colorScheme="green" fontSize="sm">
                {nutritionData.meals_with_data} meals
              </Badge>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            
            {/* Daily Summary */}
            <MotionCard 
              bg={cardBg} 
              borderColor={borderColor} 
              borderWidth={1}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CardHeader>
                <Heading size="md">📈 Daily Summary</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Stat>
                    <StatLabel>Calories</StatLabel>
                    <StatNumber color={getNutrientColor(nutritionData.target_percentages.calories?.percentage || 0) + '.500'}>
                      {nutritionData.summary.calories_consumed}
                    </StatNumber>
                    <StatHelpText>
                      {nutritionData.summary.calories_remaining > 0 
                        ? `${nutritionData.summary.calories_remaining} remaining`
                        : 'Target reached!'
                      }
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Protein</StatLabel>
                    <StatNumber color={getNutrientColor(nutritionData.target_percentages.protein?.percentage || 0) + '.500'}>
                      {nutritionData.summary.protein_consumed}g
                    </StatNumber>
                    <StatHelpText>
                      {nutritionData.summary.protein_remaining > 0 
                        ? `${nutritionData.summary.protein_remaining.toFixed(1)}g remaining`
                        : 'Target reached!'
                      }
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Carbs</StatLabel>
                    <StatNumber color={getNutrientColor(nutritionData.target_percentages.carbs?.percentage || 0) + '.500'}>
                      {nutritionData.summary.carbs_consumed}g
                    </StatNumber>
                    <StatHelpText>
                      {nutritionData.target_percentages.carbs?.percentage.toFixed(0)}% of target
                    </StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Fat</StatLabel>
                    <StatNumber color={getNutrientColor(nutritionData.target_percentages.fat?.percentage || 0) + '.500'}>
                      {nutritionData.summary.fat_consumed}g
                    </StatNumber>
                    <StatHelpText>
                      {nutritionData.target_percentages.fat?.percentage.toFixed(0)}% of target
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>
              </CardBody>
            </MotionCard>

            {/* Nutrition Targets Progress */}
            <MotionCard 
              bg={cardBg} 
              borderColor={borderColor} 
              borderWidth={1}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <CardHeader>
                <Heading size="md">🎯 Progress Towards Targets</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  {Object.entries(nutritionData.target_percentages).map(([nutrient, data]) => (
                    <VStack key={nutrient} w="full" spacing={2}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="medium" textTransform="capitalize">
                          {nutrient}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {data.current} / {data.target} 
                          {nutrient === 'calories' ? '' : 'g'}
                        </Text>
                      </HStack>
                      <Progress 
                        value={data.percentage} 
                        w="full" 
                        colorScheme={getNutrientColor(data.percentage)}
                        size="lg"
                        borderRadius="md"
                      />
                      <Text fontSize="xs" color="gray.500" alignSelf="end">
                        {data.percentage.toFixed(1)}%
                      </Text>
                    </VStack>
                  ))}
                </VStack>
              </CardBody>
            </MotionCard>

            {/* Meal Timeline */}
            {nutritionData.meal_timing.length > 0 && (
              <MotionCard 
                bg={cardBg} 
                borderColor={borderColor} 
                borderWidth={1}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CardHeader>
                  <Heading size="md">⏰ Meal Timeline</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {nutritionData.meal_timing.map((entry, index) => (
                      <HStack key={index} spacing={4} p={3} bg={mealBg} borderRadius="lg">
                        <Text fontSize="lg">{getMealIcon(entry.meal_type)}</Text>
                        <Text fontWeight="bold" minW="80px">
                          {formatTime(entry.time)}
                        </Text>
                        <Badge colorScheme="blue" textTransform="capitalize">
                          {entry.meal_type}
                        </Badge>
                        <Text flex={1}>{entry.food}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </MotionCard>
            )}

            {/* Detailed Meal Breakdown */}
            <MotionCard 
              bg={cardBg} 
              borderColor={borderColor} 
              borderWidth={1}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <CardHeader>
                <Heading size="md">🍽️ Meal-by-Meal Breakdown</Heading>
              </CardHeader>
              <CardBody>
                <Accordion allowMultiple>
                  {Object.entries(nutritionData.meals_breakdown)
                    .filter(([_, data]) => data.logs.length > 0)
                    .map(([mealType, data]) => (
                    <AccordionItem key={mealType}>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <HStack>
                            <Text fontSize="lg">{getMealIcon(mealType)}</Text>
                            <Text fontWeight="bold" textTransform="capitalize">
                              {mealType}
                            </Text>
                            <Badge colorScheme="blue">
                              {data.logs.length} items
                            </Badge>
                            <Badge colorScheme="green">
                              {Math.round(data.totals.calories || 0)} cal
                            </Badge>
                          </HStack>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack spacing={4} align="stretch">
                          {/* Meal Totals */}
                          <Box p={4} bg={mealBg} borderRadius="lg">
                            <Text fontWeight="bold" mb={2}>Meal Totals:</Text>
                            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
                              <Text fontSize="sm">
                                <strong>Calories:</strong> {Math.round(data.totals.calories || 0)}
                              </Text>
                              <Text fontSize="sm">
                                <strong>Protein:</strong> {(data.totals.protein || 0).toFixed(1)}g
                              </Text>
                              <Text fontSize="sm">
                                <strong>Carbs:</strong> {(data.totals.carbs || 0).toFixed(1)}g
                              </Text>
                              <Text fontSize="sm">
                                <strong>Fat:</strong> {(data.totals.fat || 0).toFixed(1)}g
                              </Text>
                            </SimpleGrid>
                          </Box>

                          {/* Individual Food Items */}
                          <VStack spacing={3}>
                            {data.logs.map((log) => (
                              <Box key={log._id} p={4} border="1px" borderColor={borderColor} borderRadius="lg" w="full">
                                <HStack justify="space-between" mb={2}>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="bold">{log.food_name}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                      {log.amount} {log.unit}
                                      {log.logged_at && (
                                        <> • {formatTime(log.logged_at.split('T')[1]?.substring(0, 5) || '')}</>
                                      )}
                                    </Text>
                                    {log.notes && (
                                      <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                        {log.notes}
                                      </Text>
                                    )}
                                  </VStack>
                                  <VStack align="end" spacing={1}>
                                    <Text fontSize="sm" fontWeight="bold">
                                      {Math.round(log.nutrition.calories || 0)} cal
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      P: {(log.nutrition.protein || 0).toFixed(1)}g
                                    </Text>
                                  </VStack>
                                </HStack>
                                
                                {/* Detailed nutrition for this item */}
                                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2} fontSize="xs" color="gray.600">
                                  <Text>Carbs: {(log.nutrition.carbs || 0).toFixed(1)}g</Text>
                                  <Text>Fat: {(log.nutrition.fat || 0).toFixed(1)}g</Text>
                                  <Text>Fiber: {(log.nutrition.fiber || 0).toFixed(1)}g</Text>
                                  <Text>Sugar: {(log.nutrition.sugar || 0).toFixed(1)}g</Text>
                                </SimpleGrid>
                              </Box>
                            ))}
                          </VStack>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardBody>
            </MotionCard>

          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={() => fetchNutritionDetail()}>
            Refresh Data
          </Button>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
