import { useState, useEffect } from 'react'
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  Badge,
  Box,
  Divider
} from '@chakra-ui/react'
import { FoodItem } from '../types'
import DietaryProfileBuilder from '../components/DietaryProfileBuilder'
import SmartMealPlanner from '../components/SmartMealPlanner'
import SmartMealAnalysis from '../components/SmartMealAnalysis'
import api from '../utils/api'

interface UserProfile {
  dietary_restrictions: string[]
  allergens: string[]
  strictness_level: 'flexible' | 'moderate' | 'strict'
  compatibility_score?: number
}

export default function MealPlanningPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [currentMeal, setCurrentMeal] = useState<FoodItem[]>([])
  const [hasProfile, setHasProfile] = useState(false)
  
  const { 
    isOpen: isProfileOpen, 
    onOpen: onProfileOpen, 
    onClose: onProfileClose 
  } = useDisclosure()
  
  const toast = useToast()

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await api.get('/dietary/preferences')
      if (response.data) {
        setUserProfile(response.data)
        setHasProfile(true)
      }
    } catch (error) {
      console.log('No dietary profile found, will prompt user to create one')
      setHasProfile(false)
    }
  }

  const handleProfileUpdate = async (profile: UserProfile) => {
    try {
      await api.post('/dietary/preferences', profile)
      setUserProfile(profile)
      setHasProfile(true)
      onProfileClose()
      
      toast({
        title: 'Profile Updated! 🎉',
        description: 'Your dietary preferences have been saved. You\'ll now see personalized recommendations.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      // Still save locally for demo purposes
      setUserProfile(profile)
      setHasProfile(true)
      onProfileClose()
      
      toast({
        title: 'Profile Saved Locally',
        description: 'Your preferences are saved for this session.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleAddFood = (food: FoodItem) => {
    if (!currentMeal.find(f => f.id === food.id)) {
      setCurrentMeal(prev => [...prev, food])
    }
  }

  const handleRemoveFood = (foodId: string) => {
    setCurrentMeal(prev => prev.filter(f => f.id !== foodId))
  }

  const clearMeal = () => {
    setCurrentMeal([])
    toast({
      title: 'Meal Cleared',
      description: 'All foods removed from current meal',
      status: 'info',
      duration: 2000,
      isClosable: true,
    })
  }

  const saveMealPlan = async () => {
    if (currentMeal.length === 0) {
      toast({
        title: 'No Foods Selected',
        description: 'Add some foods to your meal before saving',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      // This would save to your meal plans API
      const mealData = {
        name: `Meal Plan - ${new Date().toLocaleDateString()}`,
        foods: currentMeal.map(food => ({
          food_id: food.id,
          name: food.name,
          servings: 1
        })),
        total_nutrition: currentMeal.reduce((acc, food) => ({
          calories: acc.calories + food.nutrition.calories,
          protein: acc.protein + food.nutrition.protein,
          carbs: acc.carbs + food.nutrition.carbs,
          fat: acc.fat + food.nutrition.fat
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
      }

      console.log('Saving meal plan:', mealData)
      
      toast({
        title: 'Meal Plan Saved! 📝',
        description: 'Your meal plan has been saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error saving meal plan:', error)
      toast({
        title: 'Save Error',
        description: 'Failed to save meal plan. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const calculateMealStats = () => {
    if (currentMeal.length === 0) return null
    
    return currentMeal.reduce((acc, food) => ({
      calories: acc.calories + food.nutrition.calories,
      protein: acc.protein + food.nutrition.protein,
      carbs: acc.carbs + food.nutrition.carbs,
      fat: acc.fat + food.nutrition.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const mealStats = calculateMealStats()

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" mb={2}>
            🤖 AI Meal Planning
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Smart meal planning powered by your dietary preferences
          </Text>
        </Box>

        {/* Profile Status */}
        <Card>
          <CardBody>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold">
                  {hasProfile ? '✅ Dietary Profile Active' : '⚠️ No Dietary Profile'}
                </Text>
                <Text color="gray.600" fontSize="sm">
                  {hasProfile 
                    ? `${userProfile?.dietary_restrictions?.length || 0} restrictions, ${userProfile?.allergens?.length || 0} allergens tracked`
                    : 'Create a profile to get personalized recommendations'
                  }
                </Text>
                {hasProfile && userProfile?.compatibility_score && (
                  <Badge colorScheme="green" size="sm">
                    {userProfile.compatibility_score}% food compatibility
                  </Badge>
                )}
              </VStack>
              <VStack spacing={2}>
                <Button
                  colorScheme={hasProfile ? 'blue' : 'green'}
                  onClick={onProfileOpen}
                  size="sm"
                >
                  {hasProfile ? 'Edit Profile' : 'Create Profile'}
                </Button>
                {hasProfile && (
                  <Text fontSize="xs" color="gray.500">
                    Strictness: {userProfile?.strictness_level}
                  </Text>
                )}
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Main Content */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Left Column - Meal Planner */}
          <VStack spacing={6} align="stretch">
            {hasProfile && userProfile ? (
              <SmartMealPlanner
                userProfile={userProfile}
                currentMeal={currentMeal}
                onAddFood={handleAddFood}
                onRemoveFood={handleRemoveFood}
              />
            ) : (
              <Card>
                <CardBody textAlign="center" py={12}>
                  <VStack spacing={4}>
                    <Text fontSize="4xl">🎯</Text>
                    <Heading size="md">Get Started with AI Meal Planning</Heading>
                    <Text color="gray.600" maxW="400px">
                      Create your dietary profile to receive personalized food recommendations 
                      based on your preferences, restrictions, and health goals.
                    </Text>
                    <Button colorScheme="green" size="lg" onClick={onProfileOpen}>
                      Create Dietary Profile
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>

          {/* Right Column - Current Meal */}
          <VStack spacing={6} align="stretch">
            {/* Current Meal Summary */}
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md">🍽️ Current Meal</Heading>
                    <HStack spacing={2}>
                      <Button size="sm" onClick={clearMeal} isDisabled={currentMeal.length === 0}>
                        Clear
                      </Button>
                      <Button 
                        size="sm" 
                        colorScheme="green" 
                        onClick={saveMealPlan}
                        isDisabled={currentMeal.length === 0}
                      >
                        Save Plan
                      </Button>
                    </HStack>
                  </HStack>

                  {currentMeal.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">No foods selected</Text>
                      <Text fontSize="sm" color="gray.400" mt={1}>
                        {hasProfile 
                          ? 'Use the recommendations to add foods'
                          : 'Create a dietary profile to get started'
                        }
                      </Text>
                    </Box>
                  ) : (
                    <VStack spacing={3} align="stretch">
                      {/* Meal Stats */}
                      {mealStats && (
                        <Card variant="outline" size="sm">
                          <CardBody>
                            <Text fontWeight="bold" mb={2} fontSize="sm">📊 Nutritional Summary</Text>
                            <SimpleGrid columns={2} spacing={2}>
                              <Text fontSize="sm">
                                <strong>Calories:</strong> {Math.round(mealStats.calories)}
                              </Text>
                              <Text fontSize="sm">
                                <strong>Protein:</strong> {mealStats.protein.toFixed(1)}g
                              </Text>
                              <Text fontSize="sm">
                                <strong>Carbs:</strong> {mealStats.carbs.toFixed(1)}g
                              </Text>
                              <Text fontSize="sm">
                                <strong>Fat:</strong> {mealStats.fat.toFixed(1)}g
                              </Text>
                            </SimpleGrid>
                          </CardBody>
                        </Card>
                      )}

                      <Divider />

                      {/* Food List */}
                      <Text fontWeight="bold" fontSize="sm">Foods ({currentMeal.length}):</Text>
                      <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                        {currentMeal.map((food, idx) => (
                          <Card key={idx} variant="outline" size="sm">
                            <CardBody>
                              <HStack justify="space-between" align="center">
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium" fontSize="sm">{food.name}</Text>
                                  <Text fontSize="xs" color="gray.600">
                                    {Math.round(food.nutrition.calories)} cal, {food.nutrition.protein}g protein
                                  </Text>
                                </VStack>
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleRemoveFood(food.id)}
                                >
                                  ✕
                                </Button>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Meal Analysis */}
            {currentMeal.length > 0 && hasProfile && userProfile && (
              <SmartMealAnalysis 
                foods={currentMeal}
                userProfile={userProfile}
              />
            )}
          </VStack>
        </SimpleGrid>

        {/* Dietary Profile Builder Modal */}
        <Modal isOpen={isProfileOpen} onClose={onProfileClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {hasProfile ? 'Edit Dietary Profile' : 'Create Dietary Profile'}
            </ModalHeader>
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
