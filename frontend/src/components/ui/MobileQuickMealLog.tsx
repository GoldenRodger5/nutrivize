import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  IconButton,
  Badge,
  useColorModeValue,
  useToast,
  useDisclosure,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react'
import { 
  FiPlus, 
  FiCoffee, 
  FiSun, 
  FiMoon, 
  FiMoreHorizontal 
} from 'react-icons/fi'
import { FaAppleAlt } from 'react-icons/fa'
import MobileFoodSearch from './MobileFoodSearch'
import { FoodItem } from '../../types'
import api from '../../utils/api'

interface MealEntry {
  food_name: string
  amount: number
  unit: string
  calories: number
  logged_at: string
}

interface MobileQuickMealLogProps {
  selectedDate: string
  meals?: {
    breakfast: MealEntry[]
    lunch: MealEntry[]
    dinner: MealEntry[]
    snack: MealEntry[]
  }
  onFoodLogged: () => void
}

const MobileQuickMealLog: React.FC<MobileQuickMealLogProps> = ({
  selectedDate,
  meals = { breakfast: [], lunch: [], dinner: [], snack: [] },
  onFoodLogged,
}) => {
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const { isOpen: isFoodSearchOpen, onOpen: onFoodSearchOpen, onClose: onFoodSearchClose } = useDisclosure()
  const toast = useToast()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  const mealIcons = {
    breakfast: FiCoffee,
    lunch: FiSun,
    dinner: FiMoon,
    snack: FaAppleAlt,
  }
  
  const mealColors = {
    breakfast: 'orange',
    lunch: 'yellow',
    dinner: 'purple',
    snack: 'green',
  }
  
  const mealLabels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snacks',
  }
  
  const getTotalCalories = (mealEntries: MealEntry[]) => {
    return mealEntries.reduce((total, entry) => total + entry.calories, 0)
  }
  
  const handleAddFood = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setSelectedMeal(mealType)
    onFoodSearchOpen()
  }
  
  const handleFoodSelect = async (food: FoodItem) => {
    try {
      await api.post('/food-logs', {
        food_id: food.id,
        food_name: food.name,
        amount: 1,
        unit: food.serving_unit || 'serving',
        meal_type: selectedMeal,
        date: selectedDate,
        nutrition: food.nutrition,
      })
      
      toast({
        title: 'Food logged successfully!',
        description: `Added ${food.name} to ${mealLabels[selectedMeal]}`,
        status: 'success',
        duration: 3000,
      })
      
      onFoodLogged()
    } catch (error) {
      toast({
        title: 'Error logging food',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      })
    }
  }
  
  return (
    <>
      <Card bg={bg} borderWidth={1} borderColor={borderColor} shadow="sm">
        <CardBody p={4}>
          <VStack spacing={4} align="stretch">
            {/* Header */}
            <HStack justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="bold">
                Quick Meal Log
              </Text>
              <Text fontSize="sm" color="gray.500">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </HStack>
            
            {/* Meal Cards */}
            <SimpleGrid columns={2} spacing={3}>
              {(Object.keys(meals) as Array<keyof typeof meals>).map((mealType) => {
                const Icon = mealIcons[mealType]
                const mealEntries = meals[mealType]
                const totalCalories = getTotalCalories(mealEntries)
                
                return (
                  <Card 
                    key={mealType}
                    variant="outline"
                    borderColor={mealEntries.length > 0 ? `${mealColors[mealType]}.200` : borderColor}
                    bg={mealEntries.length > 0 ? `${mealColors[mealType]}.50` : 'transparent'}
                  >
                    <CardBody p={3}>
                      <VStack spacing={3} align="stretch">
                        {/* Meal Header */}
                        <HStack justify="space-between" align="center">
                          <HStack spacing={2}>
                            <Icon size="16px" color={`${mealColors[mealType]}.500`} />
                            <Text fontSize="sm" fontWeight="medium">
                              {mealLabels[mealType]}
                            </Text>
                          </HStack>
                          <IconButton
                            aria-label={`Add to ${mealLabels[mealType]}`}
                            icon={<FiPlus />}
                            size="xs"
                            colorScheme={mealColors[mealType]}
                            variant="ghost"
                            onClick={() => handleAddFood(mealType)}
                          />
                        </HStack>
                        
                        {/* Meal Content */}
                        {mealEntries.length > 0 ? (
                          <VStack spacing={2} align="stretch">
                            {mealEntries.slice(0, 2).map((entry, index) => (
                              <Box key={index}>
                                <Text fontSize="xs" noOfLines={1}>
                                  {entry.food_name}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {entry.amount} {entry.unit}
                                </Text>
                              </Box>
                            ))}
                            
                            {mealEntries.length > 2 && (
                              <HStack justify="center">
                                <IconButton
                                  aria-label="View more"
                                  icon={<FiMoreHorizontal />}
                                  size="xs"
                                  variant="ghost"
                                />
                              </HStack>
                            )}
                            
                            <Divider />
                            <Badge 
                              colorScheme={mealColors[mealType]} 
                              variant="subtle" 
                              fontSize="xs"
                              textAlign="center"
                            >
                              {totalCalories} cal
                            </Badge>
                          </VStack>
                        ) : (
                          <VStack spacing={2} py={2}>
                            <Text fontSize="xs" color="gray.400" textAlign="center">
                              No items logged
                            </Text>
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme={mealColors[mealType]}
                              onClick={() => handleAddFood(mealType)}
                              fontSize="xs"
                              h="6"
                            >
                              Add Food
                            </Button>
                          </VStack>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )
              })}
            </SimpleGrid>
            
            {/* Total for the day */}
            <Box textAlign="center" pt={2}>
              <Text fontSize="sm" color="gray.600">
                Total today: {' '}
                <Text as="span" fontWeight="bold" color={useColorModeValue('green.600', 'green.400')}>
                  {Object.values(meals).reduce((total, mealEntries) => 
                    total + getTotalCalories(mealEntries), 0
                  )} calories
                </Text>
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>
      
      {/* Food Search Modal */}
      <MobileFoodSearch
        isOpen={isFoodSearchOpen}
        onClose={onFoodSearchClose}
        onSelectFood={handleFoodSelect}
      />
    </>
  )
}

export default MobileQuickMealLog
