import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  Progress,
  Spinner,
  Center,
  useBreakpointValue,
  Collapse,
  Wrap,
  WrapItem
} from '@chakra-ui/react'
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons'
import { FoodItem } from '../types'
import DietaryProfileBuilder from '../components/food/DietaryProfileBuilder'
import SmartMealAnalysis from '../components/food/SmartMealAnalysis'
import api from '../utils/api'

// Backend API interfaces
interface ApiMealSuggestion {
  name: string
  description: string
  ingredients: Array<{
    name: string
    amount: number
    unit: string
  }>
  instructions: string[]
  prep_time?: number
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    [key: string]: number
  }
}

// Smart meal recommendation interface
interface MealRecommendation {
  name: string
  score: number
  reasons: string[]
  nutrition_highlights: string[] | Record<string, number | string>
  meal_suitability: string
  food_item?: FoodItem
}

interface DietaryStats {
  total_foods: number
  compatible_foods: number
  compatibility_percentage: number
  recent_conflicts: number
}

export default function SmartMealPlanning() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<MealRecommendation[]>([])
  const [selectedMealFoods, setSelectedMealFoods] = useState<FoodItem[]>([])
  const [dietaryStats, setDietaryStats] = useState<DietaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState('lunch')
  const [expandedRecs, setExpandedRecs] = useState<{[key: number]: boolean}>({})

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, md: false })

  useEffect(() => {
    loadUserProfile()
    loadDietaryStats()
  }, [])

  useEffect(() => {
    if (userProfile) {
      loadRecommendations()
    }
  }, [userProfile, selectedMealType])

  const loadUserProfile = async () => {
    try {
      // Load real user profile from settings/preferences API
      // Changed from '/user/dietary-preferences' to '/preferences/dietary' to match backend endpoint
      const response = await api.get('/preferences/dietary')
      if (response.data) {
        setUserProfile(response.data)
      } else {
        // If no preferences found, use defaults and prompt user to set them
        setUserProfile({
          dietary_restrictions: [],
          allergens: [],
          strictness_level: 'moderate',
          daily_calories: 2000,
          daily_protein: 150
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      // Fallback to basic profile if API fails
      setUserProfile({
        dietary_restrictions: [],
        allergens: [],
        strictness_level: 'moderate',
        daily_calories: 2000,
        daily_protein: 150
      })
      toast({
        title: 'Profile Load Error',
        description: 'Could not load your dietary profile. Using defaults.',
        status: 'warning',
        duration: 3000
      })
    }
    setLoading(false)
  }

  const loadDietaryStats = async () => {
    try {
      // Load real dietary statistics from food index
      // Changed from '/foods/dietary-stats' to '/foods/stats' to match a more common API pattern
      const response = await api.get('/foods/stats')
      if (response.data) {
        setDietaryStats(response.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      // Set basic stats if API fails
      setDietaryStats({
        total_foods: 0,
        compatible_foods: 0,
        compatibility_percentage: 0,
        recent_conflicts: 0
      })
    }
  }

  const loadRecommendations = async () => {
    if (!userProfile) return
    
    setRecommendationsLoading(true)
    try {
      // Call real AI meal recommendation API
      const response = await api.post('/ai/meal-suggestions', {
        meal_type: selectedMealType,
        dietary_preferences: userProfile.dietary_restrictions || [],
        allergies: userProfile.allergens || [],
        prep_time_preference: "moderate", // Default to moderate prep time
        max_results: 5
      })
      
      console.log('API Response:', response.data); // Debug log
      
      // Transform the backend response format to match frontend expectations
      if (response.data && response.data.suggestions) {
        // Create a unique timestamp for this batch of suggestions
        const batchTimestamp = Date.now();
        
        const transformedRecommendations: MealRecommendation[] = response.data.suggestions.map((suggestion: ApiMealSuggestion, index: number) => {
          // Create a unique ID for each food item
          const uniqueId = `ai_${batchTimestamp}_${index}_${Math.random().toString(36).substr(2, 5)}`;
          
          // Format nutrition highlights properly
          const nutritionHighlights = Object.entries(suggestion.nutrition).map(
            ([key, value]) => `${key.replace('_', ' ')}: ${typeof value === 'number' ? Math.round(value) : value}${key === 'calories' ? '' : 'g'}`
          );
          
          // Create the transformed recommendation
          return {
            name: suggestion.name,
            score: 90, // Assume high score for AI-generated suggestions
            reasons: [suggestion.description],
            nutrition_highlights: nutritionHighlights,
            meal_suitability: selectedMealType,
            food_item: {
              id: uniqueId,
              name: suggestion.name,
              brand: 'AI Suggestion',
              serving_size: 1,
              serving_unit: 'serving',
              nutrition: {
                calories: suggestion.nutrition.calories || 300,
                protein: suggestion.nutrition.protein || 20,
                carbs: suggestion.nutrition.carbs || 30,
                fat: suggestion.nutrition.fat || 10,
                fiber: suggestion.nutrition.fiber || 5,
                sugar: suggestion.nutrition.sugar || 5,
                sodium: suggestion.nutrition.sodium || 400
              },
              source: 'ai_suggestion',
              barcode: '',
              dietary_attributes: {
                dietary_restrictions: userProfile.dietary_restrictions || [],
                allergens: [],
                food_categories: [selectedMealType]
              }
            }
          };
        });
        
        console.log('Transformed recommendations:', transformedRecommendations); // Debug log
        setRecommendations(transformedRecommendations);
      } else {
        console.warn("Unexpected response format:", response.data)
        setRecommendations([])
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
      toast({
        title: 'Recommendations Error',
        description: 'Could not load meal recommendations. Please try again.',
        status: 'error',
        duration: 3000
      })
      setRecommendations([])
    }
    setRecommendationsLoading(false)
  }

  const addToMeal = (recommendation: MealRecommendation) => {
    if (!recommendation.food_item) {
      console.error("Food item is missing in recommendation", recommendation);
      toast({
        title: 'Error Adding Item',
        description: 'Could not add this item to your meal',
        status: 'error',
        duration: 2000
      });
      return;
    }
    
    console.log('Adding to meal:', recommendation); // Debug log
    
    // Use the food item from the recommendation directly
    const foodItem: FoodItem = recommendation.food_item;
    
    // Ensure the food item has all required fields
    if (!foodItem.id || !foodItem.name || !foodItem.nutrition) {
      console.error("Food item is missing required fields", foodItem);
      toast({
        title: 'Invalid Food Item',
        description: 'The food item is missing required information',
        status: 'error',
        duration: 2000
      });
      return;
    }

    setSelectedMealFoods(prev => {
      // Check if already added
      if (prev.find(food => food.id === foodItem.id)) {
        toast({
          title: 'Already Added',
          description: 'This meal is already in your builder',
          status: 'warning',
          duration: 2000
        })
        return prev
      }

      toast({
        title: 'Meal Added',
        description: `${recommendation.name} added to your meal`,
        status: 'success',
        duration: 2000
      })

      return [...prev, foodItem]
    })
  }

  const removeFromMeal = (foodId: string) => {
    setSelectedMealFoods(prev => {
      const removed = prev.find(food => food.id === foodId)
      if (removed) {
        toast({
          title: 'Meal Removed',
          description: `${removed.name} removed from your meal`,
          status: 'info',
          duration: 2000
        })
      }
      return prev.filter(food => food.id !== foodId)
    })
  }

  const viewAnalytics = () => {
    // Placeholder for analytics functionality
    toast({
      title: 'Analytics Coming Soon',
      description: 'Detailed nutrition analytics will be available soon',
      status: 'info',
      duration: 3000
    })
  }

  const handleProfileUpdate = async (newProfile: any) => {
    try {
      // Save profile to backend
      await api.post('/user/dietary-preferences', newProfile)
      
      setUserProfile(newProfile)
      onClose()
      toast({
        title: 'Profile Updated',
        description: 'Your dietary preferences have been updated successfully',
        status: 'success',
        duration: 3000
      })
      
      // Reload recommendations with new profile
      await loadRecommendations()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Update Error',
        description: 'Could not save your dietary preferences',
        status: 'error',
        duration: 3000
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green'
    if (score >= 80) return 'blue'
    if (score >= 70) return 'yellow'
    return 'orange'
  }

  const getMealSuitabilityIcon = (suitability: string) => {
    switch (suitability) {
      case 'perfect': return '🎯'
      case 'great': return '⭐'
      case 'good': return '👍'
      default: return '📝'
    }
  }

  const toggleRecExpand = (idx: number) => {
    setExpandedRecs(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  if (loading) {
    return (
      <Center py={20}>
        <VStack spacing={4}>
          <Spinner size="xl" color="green.500" />
          <Text>Loading your smart meal planner...</Text>
        </VStack>
      </Center>
    )
  }

  return (
    <Container maxW="container.xl" py={isMobile ? 4 : 8}>
      <VStack spacing={isMobile ? 4 : 8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={isMobile ? 1 : 2}>
            🍽️ Smart Meal Planning
          </Heading>
          <Text color="gray.600" fontSize={isMobile ? "sm" : "md"}>
            AI-powered meal recommendations based on your dietary preferences
          </Text>
        </Box>

        {/* Quick Actions */}
        <HStack spacing={4} wrap="wrap">
          <Button colorScheme="blue" onClick={onOpen}>
            🎯 Update Dietary Profile
          </Button>
          <Button colorScheme="green" onClick={loadRecommendations} isLoading={recommendationsLoading}>
            🔄 Refresh Recommendations
          </Button>
          <Button colorScheme="purple" variant="outline" onClick={viewAnalytics}>
            📊 View Analytics
          </Button>
        </HStack>

        {/* Dietary Stats Dashboard */}
        {dietaryStats && (
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {dietaryStats.total_foods.toLocaleString()}
                </Text>
                <Text fontSize="sm" color="gray.600">Total Foods</Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {dietaryStats.compatible_foods.toLocaleString()}
                </Text>
                <Text fontSize="sm" color="gray.600">Compatible Foods</Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody textAlign="center">
                <HStack justify="center" spacing={2}>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                    {dietaryStats.compatibility_percentage}%
                  </Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">Compatibility Score</Text>
              </CardBody>
            </Card>
            <Card>
              <CardBody textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color={dietaryStats.recent_conflicts > 0 ? "red.500" : "green.500"}>
                  {dietaryStats.recent_conflicts}
                </Text>
                <Text fontSize="sm" color="gray.600">Recent Conflicts</Text>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Current Profile Summary */}
        {userProfile && (
          <Card>
            <CardHeader>
              <Heading size="md">🎯 Your Dietary Profile</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack wrap="wrap" spacing={2}>
                  <Text fontWeight="medium">Dietary Restrictions:</Text>
                  {userProfile.dietary_restrictions?.map((restriction: string) => (
                    <Badge key={restriction} colorScheme="green" variant="outline">
                      {restriction}
                    </Badge>
                  ))}
                </HStack>
                <HStack wrap="wrap" spacing={2}>
                  <Text fontWeight="medium">Allergens to Avoid:</Text>
                  {userProfile.allergens?.map((allergen: string) => (
                    <Badge key={allergen} colorScheme="red" variant="outline">
                      {allergen}
                    </Badge>
                  ))}
                </HStack>
                <HStack>
                  <Text fontWeight="medium">Strictness Level:</Text>
                  <Badge colorScheme="blue" textTransform="capitalize">
                    {userProfile.strictness_level}
                  </Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Main Content */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* AI Recommendations */}
          <VStack spacing={6} align="stretch">
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md">🤖 AI Meal Recommendations</Heading>
                  <HStack spacing={2}>
                    {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                      <Button
                        key={meal}
                        size="sm"
                        variant={selectedMealType === meal ? 'solid' : 'outline'}
                        colorScheme="blue"
                        onClick={() => setSelectedMealType(meal)}
                        textTransform="capitalize"
                      >
                        {meal}
                      </Button>
                    ))}
                  </HStack>
                </HStack>
              </CardHeader>
              <CardBody>
                {recommendationsLoading ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Spinner color="blue.500" />
                      <Text fontSize="sm">Getting personalized recommendations...</Text>
                    </VStack>
                  </Center>
                ) : recommendations.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Text fontSize="md">No recommendations available</Text>
                      <Text fontSize="sm" color="gray.500">Try updating your dietary profile or selecting a different meal type</Text>
                      <Button colorScheme="blue" size="sm" onClick={loadRecommendations}>
                        Retry
                      </Button>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {recommendations.map((rec, idx) => (
                      <Card key={idx} variant="outline">
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1} flex={1} minW={0}>
                                <HStack>
                                  <Text fontWeight="bold" noOfLines={isMobile ? 1 : undefined}>{rec.name}</Text>
                                  <Text fontSize="lg">{getMealSuitabilityIcon(rec.meal_suitability)}</Text>
                                </HStack>
                                <HStack>
                                  <Badge colorScheme={getScoreColor(rec.score)} size="sm">
                                    {rec.score}/100
                                  </Badge>
                                  <Progress 
                                    value={rec.score} 
                                    colorScheme={getScoreColor(rec.score)} 
                                    size="sm" 
                                    width={isMobile ? "60px" : "100px"}
                                    borderRadius="md"
                                  />
                                </HStack>
                              </VStack>
                              <Button
                                size="sm"
                                colorScheme="green"
                                onClick={() => addToMeal(rec)}
                                ml={2}
                              >
                                {isMobile ? "Add" : "Add to Meal"}
                              </Button>
                            </HStack>
                            
                            {/* For mobile, make detailed info collapsible */}
                            {isMobile ? (
                              <>
                                <Button 
                                  onClick={() => toggleRecExpand(idx)} 
                                  size="sm" 
                                  variant="ghost" 
                                  rightIcon={expandedRecs[idx] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                  justifyContent="space-between"
                                  width="100%"
                                  bg="gray.50"
                                >
                                  Details
                                </Button>
                                <Collapse in={expandedRecs[idx] || false} animateOpacity>
                                  <VStack spacing={3} align="stretch" pt={2}>
                                    <Box>
                                      <Text fontSize="sm" fontWeight="medium" mb={1}>Why it's perfect for you:</Text>
                                      <Wrap spacing={1}>
                                        {rec.reasons.map((reason, i) => (
                                          <WrapItem key={i}>
                                            <Badge colorScheme="blue" size="sm" variant="subtle">
                                              {reason}
                                            </Badge>
                                          </WrapItem>
                                        ))}
                                      </Wrap>
                                    </Box>
                                    
                                    <Box>
                                      <Text fontSize="sm" fontWeight="medium" mb={1}>Nutrition highlights:</Text>                                <Wrap spacing={1}>
                                  {Array.isArray(rec.nutrition_highlights) ? 
                                    rec.nutrition_highlights.map((highlight: string, i: number) => (
                                      <WrapItem key={i}>
                                        <Badge colorScheme="green" size="sm" variant="outline">
                                          {highlight}
                                        </Badge>
                                      </WrapItem>
                                    )) : 
                                    Object.entries(rec.nutrition_highlights || {}).map(([key, value], i) => (
                                      <WrapItem key={i}>
                                        <Badge colorScheme="green" size="sm" variant="outline">
                                          {key}: {String(value)}
                                        </Badge>
                                      </WrapItem>
                                    ))
                                  }
                                </Wrap>
                                    </Box>
                                  </VStack>
                                </Collapse>
                              </>
                            ) : (
                              <>
                                <Box>
                                  <Text fontSize="sm" fontWeight="medium" mb={1}>Why it's perfect for you:</Text>
                                  <Wrap spacing={1}>
                                    {rec.reasons.map((reason, i) => (
                                      <WrapItem key={i}>
                                        <Badge colorScheme="blue" size="sm" variant="subtle">
                                          {reason}
                                        </Badge>
                                      </WrapItem>
                                    ))}
                                  </Wrap>
                                </Box>
                                
                                <Box>
                                  <Text fontSize="sm" fontWeight="medium" mb={1}>Nutrition highlights:</Text>
                                  <Wrap spacing={1}>
                                    {Array.isArray(rec.nutrition_highlights) ? 
                                      rec.nutrition_highlights.map((highlight: string, i: number) => (
                                        <WrapItem key={i}>
                                          <Badge colorScheme="green" size="sm" variant="outline">
                                            {highlight}
                                          </Badge>
                                        </WrapItem>
                                      )) : 
                                      Object.entries(rec.nutrition_highlights || {}).map(([key, value], i) => (
                                        <WrapItem key={i}>
                                          <Badge colorScheme="green" size="sm" variant="outline">
                                            {key}: {String(value)}
                                          </Badge>
                                        </WrapItem>
                                      ))
                                    }
                                  </Wrap>
                                </Box>
                              </>
                            )}

                            {/* Mobile view expand/collapse */}
                            {isMobile && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  onClick={() => toggleRecExpand(idx)}
                                  rightIcon={expandedRecs[idx] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                  colorScheme="blue"
                                  justifyContent="space-between"
                                >
                                  {expandedRecs[idx] ? 'Hide Details' : 'View Details'}
                                </Button>
                                <Collapse in={expandedRecs[idx]}>
                                  <Box mt={2} p={3} borderWidth={1} borderRadius="md" borderColor="gray.200">
                                    <Text fontSize="sm" fontWeight="medium" mb={1}>Detailed Nutrition Info:</Text>
                                    <Wrap spacing={2}>
                                      {Array.isArray(rec.nutrition_highlights) 
                                        ? rec.nutrition_highlights.map((highlight, i) => (
                                            <WrapItem key={i}>
                                              <Badge colorScheme="green" size="sm" variant="outline">
                                                {highlight}
                                              </Badge>
                                            </WrapItem>
                                          ))
                                        : Object.entries(rec.nutrition_highlights || {}).map(([key, value], i) => (
                                            <WrapItem key={i}>
                                              <Badge colorScheme="green" size="sm" variant="outline">
                                                {key}: {String(value)}
                                              </Badge>
                                            </WrapItem>
                                          ))
                                      }
                                    </Wrap>
                                  </Box>
                                </Collapse>
                              </>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </VStack>

          {/* Current Meal Builder */}
          <VStack spacing={6} align="stretch">
            <Card>
              <CardHeader>
                <Heading size="md">🍽️ Build Your Meal</Heading>
              </CardHeader>
              <CardBody>
                {selectedMealFoods.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Text fontSize="5xl">🍽️</Text>
                      <Text color="gray.500">Add foods to start building your meal</Text>
                    </VStack>
                  </Center>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {selectedMealFoods.map((food) => (
                      <Card key={food.id} variant="outline">
                        <CardBody>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1} flex={1} minW={0}>
                              <Text fontWeight="medium" noOfLines={1}>{food.name}</Text>
                              <HStack spacing={2} flexWrap="wrap">
                                <Text fontSize={isMobile ? "xs" : "sm"}>
                                  <strong>{Math.round(food.nutrition.calories)}</strong> cal
                                </Text>
                                <Text fontSize={isMobile ? "xs" : "sm"}>
                                  <strong>{food.nutrition.protein}g</strong> protein
                                </Text>
                                {!isMobile && (
                                  <>
                                    <Text fontSize="sm">
                                      <strong>{food.nutrition.carbs}g</strong> carbs
                                    </Text>
                                    <Text fontSize="sm">
                                      <strong>{food.nutrition.fat}g</strong> fat
                                    </Text>
                                  </>
                                )}
                              </HStack>
                            </VStack>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => removeFromMeal(food.id)}
                              ml={2}
                            >
                              {isMobile ? "×" : "Remove"}
                            </Button>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>

            {/* Smart Meal Analysis */}
            {selectedMealFoods.length > 0 && userProfile && (
              <SmartMealAnalysis 
                foods={selectedMealFoods}
                userProfile={userProfile}
              />
            )}
          </VStack>
        </SimpleGrid>

        {/* Dietary Profile Builder Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Update Dietary Profile</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <DietaryProfileBuilder 
                currentProfile={userProfile}
                onProfileUpdate={handleProfileUpdate}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  )
}
