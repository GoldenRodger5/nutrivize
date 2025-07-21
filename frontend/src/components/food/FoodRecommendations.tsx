import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Button,
  Spinner,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiClock, FiStar } from 'react-icons/fi'
import api from '../../utils/api'

const MotionCard = motion(Card)

interface FoodRecommendation {
  food_name: string
  food_id?: string
  frequency?: number
  last_logged?: string
  avg_amount?: number
  unit?: string
  reason?: string
  meal_type?: string
  benefits?: string[]
  popularity_score?: number
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

interface FoodRecommendationsProps {
  onFoodSelect?: (food: FoodRecommendation) => void
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

export default function FoodRecommendations({ 
  onFoodSelect, 
  size = 'md', 
  showTitle = true 
}: FoodRecommendationsProps) {
  const [recentFoods, setRecentFoods] = useState<FoodRecommendation[]>([])
  const [popularFoods, setPopularFoods] = useState<FoodRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const recentBg = useColorModeValue('blue.50', 'blue.900')
  const popularBg = useColorModeValue('green.50', 'green.900')

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/foods/recommendations/combined')
      if (response.data.success) {
        setRecentFoods(response.data.recent_foods || [])
        setPopularFoods(response.data.popular_foods || [])
      } else {
        setError('Failed to load recommendations')
      }
    } catch (err: any) {
      console.error('Error fetching food recommendations:', err)
      setError('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleFoodClick = (food: FoodRecommendation) => {
    if (onFoodSelect) {
      onFoodSelect(food)
    }
  }

  const FoodCard = ({ food, type }: { food: FoodRecommendation; type: 'recent' | 'popular' }) => (
    <MotionCard
      size="sm"
      variant="outline"
      cursor="pointer"
      onClick={() => handleFoodClick(food)}
      bg={type === 'recent' ? recentBg : popularBg}
      _hover={{ 
        transform: 'translateY(-2px)', 
        boxShadow: 'md',
        borderColor: type === 'recent' ? 'blue.300' : 'green.300'
      }}
      transition="all 0.2s"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <CardBody p={3}>
        <VStack spacing={2} align="start">
          <HStack justify="space-between" w="full">
            <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
              {food.food_name}
            </Text>
            {type === 'recent' && food.frequency && (
              <Badge colorScheme="blue" size="sm">
                {food.frequency}x
              </Badge>
            )}
            {type === 'popular' && food.popularity_score && (
              <Badge colorScheme="green" size="sm">
                {food.popularity_score}%
              </Badge>
            )}
          </HStack>

          {food.reason && (
            <Text fontSize="xs" color="gray.600" noOfLines={2}>
              {food.reason}
            </Text>
          )}

          <HStack spacing={3} fontSize="xs">
            <Text>🔥 {food.nutrition.calories}</Text>
            <Text>💪 {food.nutrition.protein}g</Text>
            <Text>🍞 {food.nutrition.carbs}g</Text>
            <Text>🥑 {food.nutrition.fat}g</Text>
          </HStack>

          {food.benefits && food.benefits.length > 0 && (
            <HStack spacing={1} flexWrap="wrap">
              {food.benefits.slice(0, 2).map((benefit, idx) => (
                <Badge key={idx} colorScheme="gray" size="xs">
                  {benefit}
                </Badge>
              ))}
            </HStack>
          )}

          {type === 'recent' && food.last_logged && (
            <Text fontSize="xs" color="gray.500">
              Last: {new Date(food.last_logged).toLocaleDateString()}
            </Text>
          )}

          {type === 'popular' && food.meal_type && (
            <Badge colorScheme="orange" size="xs">
              {food.meal_type}
            </Badge>
          )}
        </VStack>
      </CardBody>
    </MotionCard>
  )

  if (loading) {
    return (
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        {showTitle && (
          <CardHeader pb={2}>
            <Text fontSize="lg" fontWeight="bold">
              🍽️ Food Suggestions
            </Text>
          </CardHeader>
        )}
        <CardBody>
          <VStack spacing={4} py={8}>
            <Spinner color="green.500" />
            <Text color="gray.500">Loading recommendations...</Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        {showTitle && (
          <CardHeader pb={2}>
            <Text fontSize="lg" fontWeight="bold">
              🍽️ Food Suggestions
            </Text>
          </CardHeader>
        )}
        <CardBody>
          <VStack spacing={4} py={8}>
            <Text color="red.500">{error}</Text>
            <Button size="sm" onClick={fetchRecommendations}>
              Retry
            </Button>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <MotionCard
      bg={cardBg}
      borderColor={borderColor}
      borderWidth={1}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {showTitle && (
        <CardHeader pb={2}>
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              🍽️ Food Suggestions
            </Text>
            <Button size="xs" variant="ghost" onClick={fetchRecommendations}>
              Refresh
            </Button>
          </HStack>
        </CardHeader>
      )}
      <CardBody>
        <Accordion allowMultiple defaultIndex={[0, 1]}>
          {/* Recent Foods */}
          {recentFoods.length > 0 && (
            <AccordionItem border="none">
              <AccordionButton px={0} py={2}>
                <Box flex="1" textAlign="left">
                  <HStack>
                    <FiClock color="blue" />
                    <Text fontWeight="medium" color="blue.600">
                      Recent Foods
                    </Text>
                    <Badge colorScheme="blue" size="sm">
                      {recentFoods.length}
                    </Badge>
                  </HStack>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px={0} pb={4}>
                <SimpleGrid columns={size === 'sm' ? 1 : size === 'lg' ? 3 : 2} spacing={3}>
                  {recentFoods.map((food, index) => (
                    <FoodCard key={`recent-${index}`} food={food} type="recent" />
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Popular Foods */}
          {popularFoods.length > 0 && (
            <AccordionItem border="none">
              <AccordionButton px={0} py={2}>
                <Box flex="1" textAlign="left">
                  <HStack>
                    <FiStar color="green" />
                    <Text fontWeight="medium" color="green.600">
                      Popular Foods
                    </Text>
                    <Badge colorScheme="green" size="sm">
                      {popularFoods.length}
                    </Badge>
                  </HStack>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px={0} pb={4}>
                <SimpleGrid columns={size === 'sm' ? 1 : size === 'lg' ? 3 : 2} spacing={3}>
                  {popularFoods.map((food, index) => (
                    <FoodCard key={`popular-${index}`} food={food} type="popular" />
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          )}
        </Accordion>

        {recentFoods.length === 0 && popularFoods.length === 0 && (
          <VStack spacing={4} py={8}>
            <Text color="gray.500">No food suggestions available</Text>
            <Text fontSize="sm" color="gray.400">
              Start logging foods to get personalized recommendations
            </Text>
          </VStack>
        )}
      </CardBody>
    </MotionCard>
  )
}
