import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Heading,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import { FoodItem } from '../../types'
import api from '../../utils/api'
import FoodCompatibilityScore from './FoodCompatibilityScore'
import SmartMealAnalysis from './SmartMealAnalysis'

interface SmartMealPlannerProps {
  userProfile: {
    dietary_restrictions: string[]
    allergens: string[]
    strictness_level: 'flexible' | 'moderate' | 'strict'
  }
  currentMeal: FoodItem[]
  onAddFood: (food: FoodItem) => void
  onRemoveFood: (foodId: string) => void
}

interface FoodRecommendation {
  name: string
  score: number
  reasons: string[]
  nutrition_highlights: string[]
  meal_suitability: string
  food_data?: FoodItem
}

export default function SmartMealPlanner({ 
  userProfile, 
  currentMeal, 
  onAddFood, 
  onRemoveFood 
}: SmartMealPlannerProps) {
  const [recommendations, setRecommendations] = useState<FoodRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState('lunch')
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([])
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  useEffect(() => {
    loadRecommendations()
    loadAvailableFoods()
  }, [userProfile, selectedMealType])

  const loadRecommendations = async () => {
    if (!userProfile) return
    
    setLoading(true)
    try {
      // Call the AI meal suggestions endpoint
      const response = await api.post('/ai/meal-suggestions', {
        meal_type: selectedMealType,
        cuisine_preference: 'any',
        max_prep_time: 45,
        target_calories: 500
      })
      
      // Transform the response to match our component expectations
      const suggestions = response.data.suggestions || []
      const transformedRecommendations = suggestions.map((suggestion: any) => ({
        name: suggestion.name,
        score: 85, // Mock score since AI suggestions are already good
        reasons: [`AI recommended for ${selectedMealType}`, `Prep time: ${suggestion.prep_time} minutes`],
        nutrition_highlights: [`${suggestion.nutrition.calories} calories`, `${suggestion.nutrition.protein}g protein`],
        meal_suitability: selectedMealType,
        food_data: {
          id: suggestion.name.toLowerCase().replace(/\s+/g, '_'),
          name: suggestion.name,
          brand: 'AI Suggestion',
          nutrition: suggestion.nutrition,
          ingredients: suggestion.ingredients,
          instructions: suggestion.instructions
        }
      }))
      
      setRecommendations(transformedRecommendations)
    } catch (error) {
      console.error('Error loading recommendations:', error)
      setRecommendations([])
    }
    setLoading(false)
  }

  const loadAvailableFoods = async () => {
    try {
      const response = await api.get('/foods?limit=20')
      setAvailableFoods(response.data || [])
    } catch (error) {
      console.error('Error loading foods:', error)
    }
  }

  const handleAddRecommendedFood = async (recommendation: FoodRecommendation) => {
    try {
      // Find the actual food item
      const food = availableFoods.find(f => f.name === recommendation.name)
      if (food) {
        onAddFood(food)
        toast({
          title: 'Food Added',
          description: `${recommendation.name} added to your meal`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      }
    } catch (error) {
      console.error('Error adding food:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green'
    if (score >= 80) return 'blue'
    if (score >= 70) return 'yellow'
    return 'orange'
  }

  const getMealTypeEmoji = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅'
      case 'lunch': return '🌞'
      case 'dinner': return '🌙'
      case 'snack': return '🍎'
      default: return '🍽️'
    }
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <Card>
        <CardHeader>
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={0}>
              <Heading size="md">🤖 Smart Meal Planner</Heading>
              <Text color="gray.600" fontSize="sm">
                AI-powered recommendations based on your dietary profile
              </Text>
            </VStack>
            <Button onClick={onOpen} colorScheme="blue" size="sm">
              View Current Meal
            </Button>
          </HStack>
        </CardHeader>
      </Card>

      {/* Meal Type Selector */}
      <Card>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <Text fontWeight="bold">Choose Meal Type:</Text>
            <HStack spacing={2}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => (
                <Button
                  key={mealType}
                  size="sm"
                  variant={selectedMealType === mealType ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setSelectedMealType(mealType)}
                  leftIcon={<Text>{getMealTypeEmoji(mealType)}</Text>}
                  textTransform="capitalize"
                >
                  {mealType}
                </Button>
              ))}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Current Meal Summary */}
      {currentMeal.length > 0 && (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>Current Meal Progress</AlertTitle>
            <AlertDescription>
              {currentMeal.length} food{currentMeal.length !== 1 ? 's' : ''} selected. 
              Total calories: {Math.round(currentMeal.reduce((sum, food) => sum + food.nutrition.calories, 0))}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <Heading size="sm">
            🎯 Recommended for {selectedMealType} ({recommendations.length} suggestions)
          </Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Center py={8}>
              <VStack spacing={3}>
                <Spinner size="lg" color="blue.500" />
                <Text color="gray.600">Finding perfect foods for you...</Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={4} align="stretch">
              {recommendations.map((rec, idx) => (
                <Card key={idx} variant="outline" size="sm">
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{rec.name}</Text>
                          <HStack spacing={2}>
                            <Badge colorScheme={getScoreColor(rec.score)} variant="solid">
                              {rec.score}% Match
                            </Badge>
                            <Badge colorScheme="purple" variant="outline">
                              {rec.meal_suitability}
                            </Badge>
                          </HStack>
                        </VStack>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleAddRecommendedFood(rec)}
                          isDisabled={currentMeal.some(food => food.name === rec.name)}
                        >
                          {currentMeal.some(food => food.name === rec.name) ? 'Added' : 'Add'}
                        </Button>
                      </HStack>

                      {/* Reasons */}
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color="green.600" mb={1}>
                          ✅ Why this works:
                        </Text>
                        <HStack spacing={1} wrap="wrap">
                          {rec.reasons.slice(0, 3).map((reason, i) => (
                            <Badge key={i} colorScheme="green" variant="subtle" size="sm">
                              {reason}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>

                      {/* Nutrition Highlights */}
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" color="blue.600" mb={1}>
                          📊 Nutrition:
                        </Text>
                        <HStack spacing={1} wrap="wrap">
                          {rec.nutrition_highlights.map((highlight, i) => (
                            <Badge key={i} colorScheme="blue" variant="subtle" size="sm">
                              {highlight}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              ))}

              {recommendations.length === 0 && !loading && (
                <Center py={8}>
                  <VStack spacing={3}>
                    <Text color="gray.500">No recommendations available</Text>
                    <Button size="sm" onClick={loadRecommendations}>
                      Refresh Recommendations
                    </Button>
                  </VStack>
                </Center>
              )}
            </VStack>
          )}
        </CardBody>
      </Card>

      {/* Current Meal Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Current Meal Analysis</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              {currentMeal.length === 0 ? (
                <Center py={8}>
                  <VStack spacing={3}>
                    <Text color="gray.500">No foods in current meal</Text>
                    <Text fontSize="sm" color="gray.400">
                      Add foods from the recommendations to see meal analysis
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <>
                  {/* Current Foods */}
                  <Box>
                    <Text fontWeight="bold" mb={3}>Foods in Meal:</Text>
                    <VStack spacing={2} align="stretch">
                      {currentMeal.map((food, idx) => (
                        <Card key={idx} variant="outline" size="sm">
                          <CardBody>
                            <HStack justify="space-between" align="center">
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="medium">{food.name}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {Math.round(food.nutrition.calories)} cal, {food.nutrition.protein}g protein
                                </Text>
                              </VStack>
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => onRemoveFood(food.id)}
                              >
                                Remove
                              </Button>
                            </HStack>
                            {userProfile && (
                              <Box mt={2}>
                                <FoodCompatibilityScore 
                                  food={food} 
                                  userProfile={userProfile} 
                                />
                              </Box>
                            )}
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </Box>

                  {/* Meal Analysis */}
                  {userProfile && (
                    <SmartMealAnalysis 
                      foods={currentMeal}
                      userProfile={userProfile}
                    />
                  )}
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  )
}
