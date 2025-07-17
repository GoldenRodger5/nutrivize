import React, { useState, useEffect } from 'react';
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
  useToast,
  Spinner,
  Center,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Grid,
  GridItem,
  useColorModeValue
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaSearch, FaLightbulb, FaUtensils, FaHeart, FaClock, FaStar } from 'react-icons/fa';
import api from '../utils/api';
import QuantityUnitInput from './QuantityUnitInput';
import { getBestDefaultUnit } from '../utils/unitConversion';

interface MealDetailViewProps {
  planId: string;
  dayNumber: number;
  mealType: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface Food {
  food_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  serving_unit?: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

interface RecentFood {
  food_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  last_used: string;
}

interface FavoriteFood {
  food_id: string;
  food_name: string;
  default_quantity: number;
  default_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  added_date: string;
}

interface AISuggestion {
  type: string;
  message: string;
  foods: Array<{
    name: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  }>;
}

const MealDetailView: React.FC<MealDetailViewProps> = ({ 
  planId, 
  dayNumber, 
  mealType, 
  onClose, 
  onUpdate 
}) => {
  const [meal, setMeal] = useState<Food[]>([]);
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');

  const toast = useToast();
  const { isOpen: isAddFoodOpen, onOpen: onAddFoodOpen, onClose: onAddFoodClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Set smart default unit when food is selected
  useEffect(() => {
    if (selectedFood) {
      const bestUnit = getBestDefaultUnit(selectedFood.name, selectedFood.serving_unit)
      setUnit(bestUnit)
      setQuantity(100) // Default to 100 for now, could be smarter
    }
  }, [selectedFood])

  useEffect(() => {
    loadMealData();
    loadSuggestions();
    loadRecentFoods();
    loadFavoriteFoods();
  }, [planId, dayNumber, mealType]);

  const loadMealData = async () => {
    try {
      const response = await api.get(`/meal-planning/manual/plans/${planId}`);
      const plan = response.data.plan;
      const day = plan.days.find((d: any) => d.day_number === dayNumber);
      if (day) {
        setMeal(day.meals[mealType] || []);
      }
    } catch (error) {
      console.error('Error loading meal data:', error);
      toast({
        title: 'Error loading meal data',
        description: 'Failed to load meal information. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await api.get('/meal-planning/manual/suggestions', {
        params: { plan_id: planId, day_number: dayNumber, meal_type: mealType }
      });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadRecentFoods = async () => {
    try {
      const response = await api.get('/user/recent-foods');
      setRecentFoods(response.data.recent_foods || []);
    } catch (error) {
      console.error('Error loading recent foods:', error);
    }
  };

  const loadFavoriteFoods = async () => {
    try {
      const response = await api.get('/user/favorite-foods');
      setFavoriteFoods(response.data.favorite_foods || []);
    } catch (error) {
      console.error('Error loading favorite foods:', error);
    }
  };

  const addToRecentFoods = async (food: FoodSearchResult, quantity: number, unit: string) => {
    try {
      const calculatedNutrition = calculateNutrition(food.nutrition, quantity);
      await api.post('/user/recent-foods', {
        food_id: food.id,
        food_name: food.name,
        quantity,
        unit,
        calories: calculatedNutrition.calories,
        protein: calculatedNutrition.protein,
        carbs: calculatedNutrition.carbs,
        fat: calculatedNutrition.fat,
        fiber: calculatedNutrition.fiber,
        sugar: calculatedNutrition.sugar,
        sodium: calculatedNutrition.sodium,
      });
    } catch (error) {
      console.error('Error adding to recent foods:', error);
    }
  };

  const addToFavoriteFoods = async (food: FoodSearchResult, quantity: number, unit: string) => {
    try {
      const calculatedNutrition = calculateNutrition(food.nutrition, quantity);
      await api.post('/user/favorite-foods', {
        food_id: food.id,
        food_name: food.name,
        default_quantity: quantity,
        default_unit: unit,
        calories: calculatedNutrition.calories,
        protein: calculatedNutrition.protein,
        carbs: calculatedNutrition.carbs,
        fat: calculatedNutrition.fat,
        fiber: calculatedNutrition.fiber,
        sugar: calculatedNutrition.sugar,
        sodium: calculatedNutrition.sodium,
      });
      
      // Reload favorite foods
      loadFavoriteFoods();
      
      toast({
        title: 'Added to favorites',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: 'Error adding to favorites',
        description: 'Failed to add food to favorites.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const removeFromFavorites = async (foodId: string) => {
    try {
      await api.delete(`/user/favorite-foods/${foodId}`);
      loadFavoriteFoods();
      toast({
        title: 'Removed from favorites',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: 'Error removing from favorites',
        description: 'Failed to remove food from favorites.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const isInFavorites = (foodId: string): boolean => {
    return favoriteFoods.some(fav => fav.food_id === foodId);
  };

  const toggleFavorite = async (food: FoodSearchResult) => {
    if (isInFavorites(food.id)) {
      await removeFromFavorites(food.id);
    } else {
      await addToFavoriteFoods(food, 100, 'g'); // Default to 100g
    }
  };

  const calculateNutrition = (nutrition: any, quantity: number) => {
    const multiplier = quantity / 100;
    return {
      calories: Math.round(nutrition.calories * multiplier),
      protein: Math.round(nutrition.protein * multiplier * 10) / 10,
      carbs: Math.round(nutrition.carbs * multiplier * 10) / 10,
      fat: Math.round(nutrition.fat * multiplier * 10) / 10,
      fiber: Math.round(nutrition.fiber * multiplier * 10) / 10,
      sugar: Math.round(nutrition.sugar * multiplier * 10) / 10,
      sodium: Math.round(nutrition.sodium * multiplier * 10) / 10,
    };
  };

  const searchFoods = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get('/foods/search', {
        params: { q: term }
      });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching foods:', error);
      toast({
        title: 'Error searching foods',
        description: 'Failed to search for foods. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSearching(false);
    }
  };

  const addFoodToMeal = async () => {
    if (!selectedFood) return;

    const foodData = {
      day_number: dayNumber,
      meal_type: mealType,
      food: {
        food_id: selectedFood.id,
        food_name: selectedFood.name,
        quantity: quantity,
        unit: unit,
        calories: (selectedFood.nutrition.calories * quantity) / 100,
        protein: (selectedFood.nutrition.protein * quantity) / 100,
        carbs: (selectedFood.nutrition.carbs * quantity) / 100,
        fat: (selectedFood.nutrition.fat * quantity) / 100,
        fiber: (selectedFood.nutrition.fiber * quantity) / 100,
        sugar: (selectedFood.nutrition.sugar * quantity) / 100,
        sodium: (selectedFood.nutrition.sodium * quantity) / 100,
      }
    };

    try {
      const response = await api.post(`/meal-planning/manual/plans/${planId}/add-food`, foodData);
      if (response.data.success) {
        toast({
          title: 'Food added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Add to recent foods
        await addToRecentFoods(selectedFood, quantity, unit);
        
        loadMealData();
        onUpdate();
        onAddFoodClose();
        setSelectedFood(null);
        setQuantity(100);
        setUnit('g');
      }
    } catch (error) {
      console.error('Error adding food:', error);
      toast({
        title: 'Error adding food',
        description: 'Failed to add food to meal. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const removeFoodFromMeal = async (foodIndex: number) => {
    try {
      const response = await api.delete(`/meal-planning/manual/plans/${planId}/remove-food`, {
        params: {
          day_number: dayNumber,
          meal_type: mealType,
          food_index: foodIndex
        }
      });
      if (response.data.success) {
        toast({
          title: 'Food removed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadMealData();
        onUpdate();
      }
    } catch (error) {
      console.error('Error removing food:', error);
      toast({
        title: 'Error removing food',
        description: 'Failed to remove food from meal. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getMealTotals = () => {
    return meal.reduce((totals, food) => ({
      calories: totals.calories + food.calories,
      protein: totals.protein + food.protein,
      carbs: totals.carbs + food.carbs,
      fat: totals.fat + food.fat,
      fiber: totals.fiber + food.fiber,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const totals = getMealTotals();

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box p={6} maxW="6xl" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="blue.600">
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)} - Day {dayNumber}
            </Heading>
            <Text color="gray.600">
              {totals.calories.toFixed(0)} calories • {totals.protein.toFixed(1)}g protein
            </Text>
          </VStack>
          <HStack spacing={3}>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              onClick={onAddFoodOpen}
            >
              Add Food
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </HStack>
        </HStack>

        {/* Nutrition Summary */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Text fontWeight="bold">Nutrition Summary</Text>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <GridItem>
                <Text fontSize="sm" color="gray.600">Calories</Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {totals.calories.toFixed(0)}
                </Text>
              </GridItem>
              <GridItem>
                <Text fontSize="sm" color="gray.600">Protein</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {totals.protein.toFixed(1)}g
                </Text>
              </GridItem>
              <GridItem>
                <Text fontSize="sm" color="gray.600">Carbs</Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                  {totals.carbs.toFixed(1)}g
                </Text>
              </GridItem>
              <GridItem>
                <Text fontSize="sm" color="gray.600">Fat</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {totals.fat.toFixed(1)}g
                </Text>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardHeader>
              <HStack>
                <FaLightbulb color="gold" />
                <Text fontWeight="bold">AI Suggestions</Text>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {suggestions.map((suggestion, index) => (
                  <Box key={index} p={3} bg="gray.50" rounded="md">
                    <Text fontWeight="semibold" mb={2}>
                      {suggestion.message}
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {suggestion.foods.map((food, foodIndex) => (
                        <Badge key={foodIndex} colorScheme="blue">
                          {food.name}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Current Foods */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <HStack>
              <FaUtensils />
              <Text fontWeight="bold">Foods in this meal</Text>
            </HStack>
          </CardHeader>
          <CardBody>
            {meal.length === 0 ? (
              <Center py={8}>
                <VStack spacing={4}>
                  <Text color="gray.500">No foods added yet</Text>
                  <Button
                    leftIcon={<FaPlus />}
                    colorScheme="blue"
                    onClick={onAddFoodOpen}
                  >
                    Add Your First Food
                  </Button>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={3} align="stretch">
                {meal.map((food, index) => (
                  <Box
                    key={index}
                    p={4}
                    bg="gray.50"
                    rounded="md"
                    border="1px"
                    borderColor={borderColor}
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">{food.food_name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {food.quantity}{food.unit}
                        </Text>
                      </VStack>
                      <HStack spacing={4}>
                        <VStack spacing={0}>
                          <Text fontSize="sm" fontWeight="bold">
                            {food.calories.toFixed(0)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">cal</Text>
                        </VStack>
                        <VStack spacing={0}>
                          <Text fontSize="sm" fontWeight="bold">
                            {food.protein.toFixed(1)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">protein</Text>
                        </VStack>
                        <IconButton
                          aria-label="Remove food"
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeFoodFromMeal(index)}
                        />
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Add Food Modal */}
      <Modal isOpen={isAddFoodOpen} onClose={onAddFoodClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Food to {mealType}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Recent Foods */}
              {recentFoods.length > 0 && (
                <Box>
                  <HStack mb={3}>
                    <FaClock />
                    <Text fontWeight="bold">Recent Foods</Text>
                  </HStack>
                  <HStack spacing={2} overflowX="auto" pb={2}>
                    {recentFoods.slice(0, 5).map((food) => (
                      <Box
                        key={food.food_id}
                        minW="200px"
                        p={3}
                        bg="gray.50"
                        rounded="md"
                        border="1px"
                        borderColor="gray.200"
                        cursor="pointer"
                        onClick={() => {
                          setSelectedFood({
                            id: food.food_id,
                            name: food.food_name,
                            nutrition: {
                              calories: food.calories,
                              protein: food.protein,
                              carbs: food.carbs,
                              fat: food.fat,
                              fiber: food.fiber,
                              sugar: food.sugar,
                              sodium: food.sodium,
                            }
                          });
                          setQuantity(food.quantity);
                          setUnit(food.unit);
                        }}
                        _hover={{ bg: "blue.50" }}
                      >
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                            {food.food_name}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {food.quantity} {food.unit}
                          </Text>
                          <Text fontSize="xs" fontWeight="bold">
                            {food.calories} cal
                          </Text>
                        </VStack>
                      </Box>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Favorite Foods */}
              {favoriteFoods.length > 0 && (
                <Box>
                  <HStack mb={3}>
                    <FaStar />
                    <Text fontWeight="bold">Favorite Foods</Text>
                  </HStack>
                  <HStack spacing={2} overflowX="auto" pb={2}>
                    {favoriteFoods.slice(0, 5).map((food) => (
                      <Box
                        key={food.food_id}
                        minW="200px"
                        p={3}
                        bg="yellow.50"
                        rounded="md"
                        border="1px"
                        borderColor="yellow.200"
                        position="relative"
                      >
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                            {food.food_name}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {food.default_quantity} {food.default_unit}
                          </Text>
                          <Text fontSize="xs" fontWeight="bold">
                            {food.calories} cal
                          </Text>
                        </VStack>
                        <HStack position="absolute" top={2} right={2} spacing={1}>
                          <IconButton
                            aria-label="Add to meal"
                            icon={<FaPlus />}
                            size="xs"
                            colorScheme="blue"
                            onClick={() => {
                              setSelectedFood({
                                id: food.food_id,
                                name: food.food_name,
                                nutrition: {
                                  calories: food.calories,
                                  protein: food.protein,
                                  carbs: food.carbs,
                                  fat: food.fat,
                                  fiber: food.fiber,
                                  sugar: food.sugar,
                                  sodium: food.sodium,
                                }
                              });
                              setQuantity(food.default_quantity);
                              setUnit(food.default_unit);
                            }}
                          />
                          <IconButton
                            aria-label="Remove from favorites"
                            icon={<FaTrash />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeFromFavorites(food.food_id)}
                          />
                        </HStack>
                      </Box>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Search Foods */}
              <FormControl>
                <FormLabel>Search Foods</FormLabel>
                <HStack>
                  <Input
                    placeholder="Search for foods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchFoods(searchTerm)}
                  />
                  <Button
                    leftIcon={<FaSearch />}
                    onClick={() => searchFoods(searchTerm)}
                    isLoading={searching}
                    colorScheme="blue"
                  >
                    Search
                  </Button>
                </HStack>
              </FormControl>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={3}>Search Results</Text>
                  <VStack spacing={2} maxH="300px" overflowY="auto">
                    {searchResults.map((food, index) => (
                      <Box
                        key={index}
                        p={3}
                        w="full"
                        bg={selectedFood?.id === food.id ? "blue.50" : "gray.50"}
                        rounded="md"
                        border="1px"
                        borderColor={selectedFood?.id === food.id ? "blue.200" : borderColor}
                        cursor="pointer"
                        onClick={() => setSelectedFood(food)}
                        _hover={{ bg: "blue.50" }}
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="semibold">{food.name}</Text>
                            {food.brand && (
                              <Text fontSize="sm" color="gray.600">{food.brand}</Text>
                            )}
                          </VStack>
                          <HStack spacing={2}>
                            <VStack spacing={0}>
                              <Text fontSize="sm" fontWeight="bold">
                                {food.nutrition.calories} cal
                              </Text>
                              <Text fontSize="xs" color="gray.500">per 100g</Text>
                            </VStack>
                            <IconButton
                              aria-label={isInFavorites(food.id) ? "Remove from favorites" : "Add to favorites"}
                              icon={<FaHeart />}
                              size="sm"
                              colorScheme={isInFavorites(food.id) ? "red" : "gray"}
                              variant={isInFavorites(food.id) ? "solid" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(food);
                              }}
                              _hover={{
                                colorScheme: "red",
                                variant: "solid"
                              }}
                            />
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Quantity and Unit */}
              {selectedFood && (
                <Box>
                  <Text fontWeight="bold" mb={3}>Quantity</Text>
                  <QuantityUnitInput
                    quantity={quantity}
                    unit={unit}
                    onQuantityChange={setQuantity}
                    onUnitChange={setUnit}
                    label="Amount & Unit"
                    foodName={selectedFood.name}
                    servingUnit={selectedFood.serving_unit || 'g'}
                    showSmartSuggestions={true}
                  />
                  
                  {/* Nutrition Preview */}
                  <Box mt={4} p={3} bg="blue.50" rounded="md">
                    <HStack justify="space-between" align="center" mb={2}>
                      <Text fontWeight="semibold">Nutrition Preview</Text>
                      <Button
                        size="sm"
                        leftIcon={<FaHeart />}
                        colorScheme="yellow"
                        variant="outline"
                        onClick={() => addToFavoriteFoods(selectedFood, quantity, unit)}
                      >
                        Add to Favorites
                      </Button>
                    </HStack>
                    <HStack spacing={6}>
                      <Text fontSize="sm">
                        <strong>Calories:</strong> {((selectedFood.nutrition.calories * quantity) / 100).toFixed(0)}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Protein:</strong> {((selectedFood.nutrition.protein * quantity) / 100).toFixed(1)}g
                      </Text>
                      <Text fontSize="sm">
                        <strong>Carbs:</strong> {((selectedFood.nutrition.carbs * quantity) / 100).toFixed(1)}g
                      </Text>
                      <Text fontSize="sm">
                        <strong>Fat:</strong> {((selectedFood.nutrition.fat * quantity) / 100).toFixed(1)}g
                      </Text>
                    </HStack>
                  </Box>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddFoodClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={addFoodToMeal}
              isDisabled={!selectedFood}
            >
              Add Food
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MealDetailView;
