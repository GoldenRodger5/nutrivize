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
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  FormControl,
  FormLabel,
  ButtonGroup,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  Icon,
  useToast,
  useColorModeValue,
  Tag,
  TagLabel,
  Collapse,
  useDisclosure
} from '@chakra-ui/react'
import { 
  SearchIcon, 
  TimeIcon, 
  ChevronDownIcon,
  AddIcon,
  RepeatIcon
} from '@chakra-ui/icons'
import api from '../../utils/api'
import { NutritionInfo } from '../../types'

interface MealSuggestion {
  id: string
  name: string
  description: string
  meal_type: string
  prep_time: number
  cook_time: number
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  cuisine: string
  nutrition: NutritionInfo
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    in_food_index?: boolean
  }>
  instructions: string[]
  tags: string[]
  ai_score: number
  match_reason: string
  dietary_compatibility: string[]
  missing_ingredients?: string[]
}

interface SmartMealSuggestionsProps {
  mealType?: string
  targetNutrition?: Partial<NutritionInfo>
  dietaryRestrictions?: string[]
  preferredCuisines?: string[]
  maxPrepTime?: number
  useUserFoodIndex?: boolean
  onMealSelect?: (meal: MealSuggestion) => void
  onAddToMealPlan?: (meal: MealSuggestion) => void
}

const SmartMealSuggestions: React.FC<SmartMealSuggestionsProps> = ({
  mealType = 'any',
  targetNutrition = {},
  dietaryRestrictions = [],
  preferredCuisines = [],
  maxPrepTime = 60,
  useUserFoodIndex = false,
  onMealSelect,
  onAddToMealPlan
}) => {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    difficulty: 'any',
    cuisine: 'any',
    maxTime: maxPrepTime,
    sortBy: 'ai_score'
  })
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set())
  
  const toast = useToast()
  const { isOpen: isFiltersOpen, onToggle: onFiltersToggle } = useDisclosure()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    if (mealType || targetNutrition || dietaryRestrictions.length > 0) {
      fetchSuggestions()
    }
  }, [mealType, targetNutrition, dietaryRestrictions, preferredCuisines, useUserFoodIndex])

  const fetchSuggestions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const payload = {
        meal_type: mealType,
        target_nutrition: targetNutrition,
        dietary_restrictions: dietaryRestrictions,
        preferred_cuisines: preferredCuisines,
        max_prep_time: selectedFilters.maxTime,
        use_food_index_only: useUserFoodIndex,
        search_query: searchQuery.trim() || undefined,
        difficulty_filter: selectedFilters.difficulty !== 'any' ? selectedFilters.difficulty : undefined,
        cuisine_filter: selectedFilters.cuisine !== 'any' ? selectedFilters.cuisine : undefined,
        sort_by: selectedFilters.sortBy
      }

      const response = await api.post('/ai/meal-suggestions', payload)
      setSuggestions(response.data.suggestions || [])
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Failed to fetch meal suggestions'
      setError(errorMsg)
      toast({
        title: 'Error',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshSuggestions = () => {
    fetchSuggestions()
  }

  const handleFilterChange = (key: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleSuggestionExpansion = (suggestionId: string) => {
    setExpandedSuggestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId)
      } else {
        newSet.add(suggestionId)
      }
      return newSet
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

  const getAIScoreColor = (score: number) => {
    if (score >= 90) return 'green'
    if (score >= 70) return 'yellow'
    if (score >= 50) return 'orange'
    return 'red'
  }

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (searchQuery && !suggestion.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !suggestion.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (selectedFilters.difficulty !== 'any' && suggestion.difficulty !== selectedFilters.difficulty) {
      return false
    }
    if (selectedFilters.cuisine !== 'any' && suggestion.cuisine !== selectedFilters.cuisine) {
      return false
    }
    if (suggestion.prep_time + suggestion.cook_time > selectedFilters.maxTime) {
      return false
    }
    return true
  })

  const sortedSuggestions = [...filteredSuggestions].sort((a, b) => {
    switch (selectedFilters.sortBy) {
      case 'ai_score':
        return b.ai_score - a.ai_score
      case 'prep_time':
        return (a.prep_time + a.cook_time) - (b.prep_time + b.cook_time)
      case 'calories':
        return (a.nutrition.calories || 0) - (b.nutrition.calories || 0)
      case 'protein':
        return (b.nutrition.protein || 0) - (a.nutrition.protein || 0)
      default:
        return 0
    }
  })

  return (
    <Box p={4} bg={bgColor} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={0}>
            <Text fontSize="lg" fontWeight="bold">
              Smart Meal Suggestions
            </Text>
            <Text fontSize="sm" color="gray.500">
              AI-powered recommendations based on your preferences
            </Text>
          </VStack>
          <ButtonGroup size="sm">
            <Button
              leftIcon={<RepeatIcon />}
              onClick={handleRefreshSuggestions}
              isLoading={isLoading}
              variant="outline"
            >
              Refresh
            </Button>
            <Button
              leftIcon={<ChevronDownIcon />}
              onClick={onFiltersToggle}
              variant="outline"
            >
              Filters
            </Button>
          </ButtonGroup>
        </HStack>

        {/* Search and Filters */}
        <Collapse in={isFiltersOpen}>
          <Box p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Search Meals</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Difficulty</FormLabel>
                  <Select
                    value={selectedFilters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Cuisine</FormLabel>
                  <Select
                    value={selectedFilters.cuisine}
                    onChange={(e) => handleFilterChange('cuisine', e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="american">American</option>
                    <option value="italian">Italian</option>
                    <option value="mexican">Mexican</option>
                    <option value="asian">Asian</option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="indian">Indian</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Max Time (min)</FormLabel>
                  <Input
                    type="number"
                    value={selectedFilters.maxTime}
                    onChange={(e) => handleFilterChange('maxTime', parseInt(e.target.value) || 60)}
                    min="5"
                    max="180"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Sort By</FormLabel>
                  <Select
                    value={selectedFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="ai_score">AI Score</option>
                    <option value="prep_time">Preparation Time</option>
                    <option value="calories">Calories</option>
                    <option value="protein">Protein</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <Button onClick={fetchSuggestions} colorScheme="blue" w="full">
                Apply Filters
              </Button>
            </VStack>
          </Box>
        </Collapse>

        {/* Results */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {isLoading && (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" color="blue.500" />
            <Text mt={4} color="gray.500">
              Finding the perfect meals for you...
            </Text>
          </Box>
        )}

        {!isLoading && sortedSuggestions.length === 0 && !error && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">
              No meal suggestions found. Try adjusting your filters or search criteria.
            </Text>
          </Box>
        )}

        {!isLoading && sortedSuggestions.length > 0 && (
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              Found {sortedSuggestions.length} meal suggestions
            </Text>

            {sortedSuggestions.map((suggestion) => (
              <Card key={suggestion.id} variant="outline">
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    {/* Header */}
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack>
                          <Text fontSize="lg" fontWeight="semibold">
                            {suggestion.name}
                          </Text>
                          <Badge
                            colorScheme={getAIScoreColor(suggestion.ai_score)}
                            variant="solid"
                          >
                            {suggestion.ai_score}% Match
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {suggestion.description}
                        </Text>
                        <Text fontSize="xs" color="blue.500">
                          {suggestion.match_reason}
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Badge colorScheme={getDifficultyColor(suggestion.difficulty)}>
                          {suggestion.difficulty}
                        </Badge>
                        <HStack fontSize="xs" color="gray.500">
                          <Icon as={TimeIcon} />
                          <Text>{suggestion.prep_time + suggestion.cook_time} min</Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Nutrition Summary */}
                    <SimpleGrid columns={4} spacing={2}>
                      <Stat size="sm">
                        <StatLabel>Calories</StatLabel>
                        <StatNumber fontSize="sm">{suggestion.nutrition.calories}</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Protein</StatLabel>
                        <StatNumber fontSize="sm">{suggestion.nutrition.protein}g</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Carbs</StatLabel>
                        <StatNumber fontSize="sm">{suggestion.nutrition.carbs}g</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Fat</StatLabel>
                        <StatNumber fontSize="sm">{suggestion.nutrition.fat}g</StatNumber>
                      </Stat>
                    </SimpleGrid>

                    {/* Tags */}
                    <HStack wrap="wrap" spacing={1}>
                      {suggestion.tags.map((tag) => (
                        <Tag key={tag} size="sm" variant="subtle" colorScheme="blue">
                          <TagLabel>{tag}</TagLabel>
                        </Tag>
                      ))}
                    </HStack>

                    {/* Expandable Details */}
                    <Collapse in={expandedSuggestions.has(suggestion.id)}>
                      <VStack spacing={3} align="stretch" pt={3}>
                        <Divider />
                        
                        {/* Ingredients */}
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold" mb={2}>
                            Ingredients ({suggestion.ingredients.length})
                          </Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={1}>
                            {suggestion.ingredients.map((ingredient, idx) => (
                              <HStack key={idx} fontSize="sm" spacing={2}>
                                <Text>•</Text>
                                <Text>
                                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                                </Text>
                                {!ingredient.in_food_index && (
                                  <Badge size="xs" colorScheme="yellow">
                                    New
                                  </Badge>
                                )}
                              </HStack>
                            ))}
                          </SimpleGrid>
                        </Box>

                        {/* Instructions */}
                        <Box>
                          <Text fontSize="sm" fontWeight="semibold" mb={2}>
                            Instructions
                          </Text>
                          <VStack align="stretch" spacing={1}>
                            {suggestion.instructions.map((instruction, idx) => (
                              <Text key={idx} fontSize="sm">
                                {idx + 1}. {instruction}
                              </Text>
                            ))}
                          </VStack>
                        </Box>
                      </VStack>
                    </Collapse>

                    {/* Action Buttons */}
                    <HStack justify="space-between">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSuggestionExpansion(suggestion.id)}
                      >
                        {expandedSuggestions.has(suggestion.id) ? 'Show Less' : 'Show Details'}
                      </Button>
                      <ButtonGroup size="sm">
                        {onMealSelect && (
                          <Button
                            colorScheme="blue"
                            onClick={() => onMealSelect(suggestion)}
                          >
                            Select Meal
                          </Button>
                        )}
                        {onAddToMealPlan && (
                          <Button
                            colorScheme="green"
                            variant="outline"
                            leftIcon={<AddIcon />}
                            onClick={() => onAddToMealPlan(suggestion)}
                          >
                            Add to Plan
                          </Button>
                        )}
                      </ButtonGroup>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}

export default SmartMealSuggestions
