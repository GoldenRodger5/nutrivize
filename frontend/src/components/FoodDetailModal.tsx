import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Divider,
  Box,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Icon,
} from '@chakra-ui/react'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { FoodItem } from '../types'
import FoodCompatibilityScore from './FoodCompatibilityScore'
import { calculateNutritionForQuantity } from '../utils/unitConversion'
import { SERVING_UNITS } from '../constants/servingUnits'
import api from '../utils/api'

interface FoodDetailModalProps {
  food: FoodItem | null
  isOpen: boolean
  onClose: () => void
  onLogFood?: (food: FoodItem, servings: number, unit: string) => void
  userProfile?: any
}

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  food,
  isOpen,
  onClose,
  onLogFood,
  userProfile
}) => {
  const [servings, setServings] = useState(1)
  const [unit, setUnit] = useState('serving')
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [nutritionData, setNutritionData] = useState<any>(null)
  const toast = useToast()

  // Calculate nutrition for current serving size
  useEffect(() => {
    if (food && servings > 0) {
      const calculatedNutrition = calculateNutritionForQuantity(
        food.nutrition as unknown as Record<string, number>,
        food.serving_size,
        food.serving_unit,
        servings,
        unit === 'serving' ? food.serving_unit : unit
      )
      setNutritionData(calculatedNutrition)
    }
  }, [food, servings, unit])

  // Check if food is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!food) return
      
      try {
        const response = await api.get('/favorites')
        const favorites = response.data.favorites || []
        setIsFavorite(favorites.some((fav: any) => fav.food_id === food.id))
      } catch (error) {
        console.error('Error checking favorite status:', error)
      }
    }

    if (isOpen && food) {
      checkFavoriteStatus()
    }
  }, [food, isOpen])

  const handleToggleFavorite = async () => {
    if (!food) return
    
    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${food.id}`)
        setIsFavorite(false)
        toast({
          title: 'Removed from favorites',
          status: 'info',
          duration: 2000,
        })
      } else {
        await api.post('/favorites', { food_id: food.id })
        setIsFavorite(true)
        toast({
          title: 'Added to favorites',
          status: 'success',
          duration: 2000,
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: 'Error updating favorites',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleLogFood = () => {
    if (food && onLogFood) {
      onLogFood(food, servings, unit)
      onClose()
    }
  }

  if (!food) return null

  const dietaryAttributes = food.dietary_attributes

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold">
                {food.name}
              </Text>
              {food.brand && (
                <Text fontSize="sm" color="gray.600">
                  {food.brand}
                </Text>
              )}
            </VStack>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleToggleFavorite}
              isLoading={favoriteLoading}
              leftIcon={<Icon as={isFavorite ? FaHeart : FaRegHeart} />}
              colorScheme={isFavorite ? "red" : "gray"}
            >
              {isFavorite ? 'Favorited' : 'Add to Favorites'}
            </Button>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Serving Size Calculator */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                Serving Size Calculator
              </Text>
              <HStack spacing={4}>
                <FormControl flex={1}>
                  <FormLabel fontSize="sm">Servings</FormLabel>
                  <NumberInput
                    value={servings}
                    onChange={(_, value) => setServings(value || 1)}
                    min={0.1}
                    max={50}
                    step={0.1}
                    precision={1}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel fontSize="sm">Unit</FormLabel>
                  <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
                    <option value="serving">Serving</option>
                    {SERVING_UNITS.map(unitOption => (
                      <option key={unitOption} value={unitOption}>
                        {unitOption}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
            </Box>

            <Divider />

            {/* Nutrition Information */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                Nutrition Information
              </Text>
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                <Stat>
                  <StatLabel>Calories</StatLabel>
                  <StatNumber>{Math.round(nutritionData?.calories || 0)}</StatNumber>
                  <StatHelpText>per {servings} {unit}(s)</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Protein</StatLabel>
                  <StatNumber>{Math.round(nutritionData?.protein || 0)}g</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Carbs</StatLabel>
                  <StatNumber>{Math.round(nutritionData?.carbs || 0)}g</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Fat</StatLabel>
                  <StatNumber>{Math.round(nutritionData?.fat || 0)}g</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Fiber</StatLabel>
                  <StatNumber>{Math.round(nutritionData?.fiber || 0)}g</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Sugar</StatLabel>
                  <StatNumber>{Math.round(nutritionData?.sugar || 0)}g</StatNumber>
                </Stat>
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Dietary Compatibility */}
            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                Dietary Compatibility
              </Text>
              <FoodCompatibilityScore food={food} userProfile={userProfile} />
            </Box>

            {/* Dietary Attributes */}
            {dietaryAttributes && (
              <>
                <Divider />
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>
                    Dietary Attributes
                  </Text>
                  <VStack spacing={3} align="stretch">
                    {dietaryAttributes.dietary_restrictions && dietaryAttributes.dietary_restrictions.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Dietary Restrictions:
                        </Text>
                        <Wrap spacing={2}>
                          {dietaryAttributes.dietary_restrictions.map((restriction: string) => (
                            <WrapItem key={restriction}>
                              <Tag size="sm" colorScheme="green">
                                <TagLabel>{restriction}</TagLabel>
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                    
                    {dietaryAttributes.allergens && dietaryAttributes.allergens.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Contains Allergens:
                        </Text>
                        <Wrap spacing={2}>
                          {dietaryAttributes.allergens.map((allergen: string) => (
                            <WrapItem key={allergen}>
                              <Tag size="sm" colorScheme="red">
                                <TagLabel>{allergen}</TagLabel>
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                    
                    {dietaryAttributes.food_categories && dietaryAttributes.food_categories.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={2}>
                          Food Categories:
                        </Text>
                        <Wrap spacing={2}>
                          {dietaryAttributes.food_categories.map((category: string) => (
                            <WrapItem key={category}>
                              <Tag size="sm" colorScheme="blue">
                                <TagLabel>{category}</TagLabel>
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </>
            )}

            {/* Additional Information */}
            {food.barcode && (
              <>
                <Divider />
                <Box>
                  <Text fontSize="lg" fontWeight="bold" mb={3}>
                    Additional Information
                  </Text>
                  <VStack spacing={2} align="stretch">
                    <HStack>
                      <Text fontSize="sm" fontWeight="medium">Barcode:</Text>
                      <Text fontSize="sm">{food.barcode}</Text>
                    </HStack>
                  </VStack>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          {onLogFood && (
            <Button colorScheme="green" onClick={handleLogFood}>
              Log Food
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default FoodDetailModal
