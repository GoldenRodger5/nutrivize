import React, { useState, useEffect } from 'react'
import {
  Box,
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
  Stat,
  StatLabel,
  StatNumber,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  FormControl,
  FormLabel,
  Switch,
  Icon,
  List,
  ListItem,
  ListIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  CheckboxGroup,
  Stack
} from '@chakra-ui/react'
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons'
import { FiClock, FiTrendingUp, FiStar } from 'react-icons/fi'
import api from '../../utils/api'

interface Recommendation {
  id: string
  name: string
  description: string
  meal_type: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  prep_time: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: string[]
  instructions: string[]
  health_benefits: string[]
  recommendation_reason: string
  confidence_score: number
  tags: string[]
}

interface SmartMealRecommendationsProps {
  userId?: string
  mealType?: string
  considerRecentMeals?: boolean
  maxRecommendations?: number
  onRecommendationSelect?: (recommendation: Recommendation) => void
}

const SmartMealRecommendations: React.FC<SmartMealRecommendationsProps> = ({
  mealType = 'lunch',
  considerRecentMeals = true,
  maxRecommendations = 6,
  onRecommendationSelect
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedMealType, setSelectedMealType] = useState(mealType)
  const [filters, setFilters] = useState({
    max_prep_time: 30,
    difficulty: 'any',
    dietary_restrictions: [] as string[],
    consider_recent: considerRecentMeals,
    include_health_benefits: true,
    focus_nutrition: 'balanced'
  })
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null)
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  useEffect(() => {
    fetchRecommendations()
  }, [selectedMealType, filters])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        meal_type: selectedMealType,
        consider_recent_meals: filters.consider_recent.toString(),
        max_recommendations: maxRecommendations.toString(),
        max_prep_time: filters.max_prep_time.toString(),
        difficulty: filters.difficulty,
        focus_nutrition: filters.focus_nutrition
      })

      if (filters.dietary_restrictions.length > 0) {
        params.append('dietary_restrictions', filters.dietary_restrictions.join(','))
      }

      const response = await api.get(`/meal-planning/recommendations?${params}`)
      
      // Transform response to match our interface
      const transformedRecommendations = (response.data?.recommendations || []).map((rec: any, index: number) => ({
        id: rec.id || `rec-${index}`,
        name: rec.name || rec.meal_name || 'Untitled Meal',
        description: rec.description || 'No description available',
        meal_type: rec.meal_type || selectedMealType,
        calories: rec.nutrition?.calories || rec.calories || 0,
        protein: rec.nutrition?.protein || rec.protein || 0,
        carbs: rec.nutrition?.carbs || rec.carbs || 0,
        fat: rec.nutrition?.fat || rec.fat || 0,
        fiber: rec.nutrition?.fiber || rec.fiber || 0,
        prep_time: rec.prep_time || 15,
        difficulty: rec.difficulty || 'medium',
        ingredients: rec.ingredients || [],
        instructions: rec.instructions || [],
        health_benefits: rec.health_benefits || [],
        recommendation_reason: rec.recommendation_reason || rec.reason || 'Recommended for you',
        confidence_score: rec.confidence_score || 0.8,
        tags: rec.tags || []
      }))

      setRecommendations(transformedRecommendations)

      if (transformedRecommendations.length === 0) {
        setError('No recommendations found for your current preferences. Try adjusting your filters.')
      }

    } catch (err: any) {
      console.error('Error fetching recommendations:', err)
      setError(err.response?.data?.detail || 'Failed to fetch recommendations')
    } finally {
      setLoading(false)
    }
  }

  const generateSmartRecommendations = async () => {
    try {
      setLoading(true)
      
      // Call AI-powered recommendation endpoint
      const response = await api.post('/ai/meal-suggestions', {
        meal_type: selectedMealType,
        remaining_calories: 500,
        dietary_preferences: filters.dietary_restrictions,
        prep_time_preference: filters.max_prep_time <= 15 ? 'quick' : 'moderate',
        special_requests: `Focus on ${filters.focus_nutrition} nutrition`
      })

      if (response.data?.suggestions) {
        const aiRecommendations = response.data.suggestions.map((suggestion: any, index: number) => ({
          id: `ai-${index}`,
          name: suggestion.name,
          description: suggestion.description,
          meal_type: selectedMealType,
          calories: suggestion.nutrition?.calories || 0,
          protein: suggestion.nutrition?.protein || 0,
          carbs: suggestion.nutrition?.carbs || 0,
          fat: suggestion.nutrition?.fat || 0,
          fiber: suggestion.nutrition?.fiber || 0,
          prep_time: suggestion.prep_time || 20,
          difficulty: suggestion.difficulty || 'medium',
          ingredients: suggestion.ingredients?.map((ing: any) => ing.name) || [],
          instructions: suggestion.instructions || [],
          health_benefits: [suggestion.goal_alignment || 'Supports your nutrition goals'],
          recommendation_reason: 'AI-generated based on your preferences',
          confidence_score: 0.9,
          tags: ['AI-generated', 'personalized']
        }))

        setRecommendations(aiRecommendations)
      }

      toast({
        title: 'Smart Recommendations Generated',
        description: 'AI-powered meal recommendations are ready!',
        status: 'success',
        duration: 3000,
        isClosable: true
      })

    } catch (err: any) {
      console.error('Error generating smart recommendations:', err)
      toast({
        title: 'Error',
        description: 'Failed to generate smart recommendations. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  const selectRecommendation = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation)
    onOpen()
  }

  const confirmRecommendation = () => {
    if (selectedRecommendation && onRecommendationSelect) {
      onRecommendationSelect(selectedRecommendation)
    }
    onClose()
    
    toast({
      title: 'Recommendation Selected',
      description: `${selectedRecommendation?.name} has been selected`,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'green'
      case 'medium': return 'yellow'
      case 'hard': return 'red'
      default: return 'gray'
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'green'
    if (score >= 0.6) return 'yellow'
    return 'red'
  }

  if (loading && recommendations.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Finding the perfect meal recommendations for you...</Text>
      </Box>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiStar} color="yellow.500" />
              <Heading size="md">Smart Meal Recommendations</Heading>
            </HStack>
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={generateSmartRecommendations}
              isLoading={loading}
              leftIcon={<FiTrendingUp />}
            >
              Generate AI Recommendations
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList mb={4}>
              <Tab>Recommendations</Tab>
              <Tab>Filters</Tab>
            </TabList>

            <TabPanels>
              {/* Recommendations Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {/* Meal Type Selector */}
                  <HStack spacing={4}>
                    <FormControl maxW="200px">
                      <FormLabel>Meal Type</FormLabel>
                      <Select
                        value={selectedMealType}
                        onChange={(e) => setSelectedMealType(e.target.value)}
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </Select>
                    </FormControl>
                  </HStack>

                  {/* Error Display */}
                  {error && (
                    <Alert status="error">
                      <AlertIcon />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Recommendations Grid */}
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {recommendations.map((rec) => (
                      <Card 
                        key={rec.id} 
                        variant="outline"
                        cursor="pointer"
                        onClick={() => selectRecommendation(rec)}
                        _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                      >
                        <CardBody>
                          <VStack spacing={3} align="stretch">
                            <HStack justify="space-between">
                              <Text fontWeight="bold" fontSize="lg">{rec.name}</Text>
                              <Badge colorScheme={getConfidenceColor(rec.confidence_score)}>
                                {Math.round(rec.confidence_score * 100)}%
                              </Badge>
                            </HStack>

                            <Text fontSize="sm" color="gray.600" noOfLines={2}>
                              {rec.description}
                            </Text>

                            <HStack spacing={2}>
                              <Badge colorScheme="purple">{rec.meal_type}</Badge>
                              <Badge colorScheme={getDifficultyColor(rec.difficulty)}>
                                {rec.difficulty}
                              </Badge>
                              <Badge colorScheme="blue">
                                <HStack spacing={1}>
                                  <FiClock />
                                  <Text>{rec.prep_time}min</Text>
                                </HStack>
                              </Badge>
                            </HStack>

                            <SimpleGrid columns={2} spacing={2}>
                              <Stat size="sm">
                                <StatLabel fontSize="xs">Calories</StatLabel>
                                <StatNumber fontSize="sm">{rec.calories}</StatNumber>
                              </Stat>
                              <Stat size="sm">
                                <StatLabel fontSize="xs">Protein</StatLabel>
                                <StatNumber fontSize="sm">{rec.protein}g</StatNumber>
                              </Stat>
                            </SimpleGrid>

                            <Text fontSize="xs" color="blue.600" fontStyle="italic">
                              {rec.recommendation_reason}
                            </Text>

                            {rec.tags.length > 0 && (
                              <HStack spacing={1}>
                                {rec.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} size="sm" colorScheme="gray">
                                    {tag}
                                  </Badge>
                                ))}
                              </HStack>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>

                  {recommendations.length === 0 && !loading && !error && (
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>No Recommendations Available</AlertTitle>
                        <AlertDescription>
                          Try adjusting your filters or generating AI recommendations.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </TabPanel>

              {/* Filters Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Max Prep Time (minutes)</FormLabel>
                      <Select
                        value={filters.max_prep_time}
                        onChange={(e) => setFilters(prev => ({ ...prev, max_prep_time: Number(e.target.value) }))}
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={999}>Any time</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select
                        value={filters.difficulty}
                        onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                      >
                        <option value="any">Any</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Nutrition Focus</FormLabel>
                      <Select
                        value={filters.focus_nutrition}
                        onChange={(e) => setFilters(prev => ({ ...prev, focus_nutrition: e.target.value }))}
                      >
                        <option value="balanced">Balanced</option>
                        <option value="protein">High Protein</option>
                        <option value="carbs">High Carbs</option>
                        <option value="fat">Healthy Fats</option>
                        <option value="fiber">High Fiber</option>
                        <option value="low_calorie">Low Calorie</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>Dietary Restrictions</FormLabel>
                    <CheckboxGroup 
                      value={filters.dietary_restrictions}
                      onChange={(values) => setFilters(prev => ({ ...prev, dietary_restrictions: values as string[] }))}
                    >
                      <Stack direction="row" flexWrap="wrap">
                        <Checkbox value="vegetarian">Vegetarian</Checkbox>
                        <Checkbox value="vegan">Vegan</Checkbox>
                        <Checkbox value="gluten_free">Gluten Free</Checkbox>
                        <Checkbox value="dairy_free">Dairy Free</Checkbox>
                        <Checkbox value="keto">Keto</Checkbox>
                        <Checkbox value="paleo">Paleo</Checkbox>
                      </Stack>
                    </CheckboxGroup>
                  </FormControl>

                  <HStack spacing={4}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="consider-recent" mb="0">
                        Consider Recent Meals
                      </FormLabel>
                      <Switch
                        id="consider-recent"
                        isChecked={filters.consider_recent}
                        onChange={(e) => setFilters(prev => ({ ...prev, consider_recent: e.target.checked }))}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="health-benefits" mb="0">
                        Include Health Benefits
                      </FormLabel>
                      <Switch
                        id="health-benefits"
                        isChecked={filters.include_health_benefits}
                        onChange={(e) => setFilters(prev => ({ ...prev, include_health_benefits: e.target.checked }))}
                      />
                    </FormControl>
                  </HStack>

                  <Button
                    colorScheme="blue"
                    onClick={fetchRecommendations}
                    isLoading={loading}
                  >
                    Apply Filters
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>

      {/* Recommendation Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedRecommendation?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRecommendation && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Badge colorScheme="purple">{selectedRecommendation.meal_type}</Badge>
                  <Badge colorScheme={getDifficultyColor(selectedRecommendation.difficulty)}>
                    {selectedRecommendation.difficulty}
                  </Badge>
                  <Badge colorScheme="blue">
                    <HStack spacing={1}>
                      <FiClock />
                      <Text>{selectedRecommendation.prep_time}min</Text>
                    </HStack>
                  </Badge>
                </HStack>

                <Text>{selectedRecommendation.description}</Text>

                <SimpleGrid columns={4} spacing={3}>
                  <Stat size="sm">
                    <StatLabel>Calories</StatLabel>
                    <StatNumber>{selectedRecommendation.calories}</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>Protein</StatLabel>
                    <StatNumber>{selectedRecommendation.protein}g</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>Carbs</StatLabel>
                    <StatNumber>{selectedRecommendation.carbs}g</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>Fat</StatLabel>
                    <StatNumber>{selectedRecommendation.fat}g</StatNumber>
                  </Stat>
                </SimpleGrid>

                {selectedRecommendation.ingredients.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Ingredients:</Text>
                    <List spacing={1}>
                      {selectedRecommendation.ingredients.map((ingredient, index) => (
                        <ListItem key={index}>
                          <ListIcon as={CheckCircleIcon} color="green.500" />
                          {ingredient}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {selectedRecommendation.instructions.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Instructions:</Text>
                    <List spacing={1}>
                      {selectedRecommendation.instructions.map((instruction, index) => (
                        <ListItem key={index}>
                          <Text fontSize="sm">{index + 1}. {instruction}</Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {selectedRecommendation.health_benefits.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Health Benefits:</Text>
                    <List spacing={1}>
                      {selectedRecommendation.health_benefits.map((benefit, index) => (
                        <ListItem key={index}>
                          <ListIcon as={StarIcon} color="yellow.500" />
                          <Text fontSize="sm">{benefit}</Text>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">Why this recommendation?</AlertTitle>
                    <AlertDescription fontSize="sm">
                      {selectedRecommendation.recommendation_reason}
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={confirmRecommendation}>
              Select This Meal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default SmartMealRecommendations
