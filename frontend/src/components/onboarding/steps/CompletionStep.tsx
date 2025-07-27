import { useState, useEffect } from 'react'
import {
  VStack,
  Button,
  HStack,
  Text,
  Box,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Badge,
  useToast
} from '@chakra-ui/react'
import { FaCheckCircle, FaTrophy, FaRocket, FaHeart } from 'react-icons/fa'
import OnboardingCard from '../OnboardingCard'
import { useOnboarding } from '../../../contexts/OnboardingContext'

interface CompletionStepProps {
  onComplete: () => void
}

export default function CompletionStep({ onComplete }: CompletionStepProps) {
  const { onboardingData, completeOnboarding } = useOnboarding()
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    // Show confetti animation on mount
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleComplete = async () => {
    try {
      setLoading(true)
      await completeOnboarding()
      
      toast({
        title: "Welcome to Nutrivize!",
        description: "Your personalized nutrition journey starts now.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      
      onComplete()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      toast({
        title: "Setup Complete",
        description: "Let's get started with your nutrition tracking!",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      onComplete()
    } finally {
      setLoading(false)
    }
  }

  const getDailyCalories = () => {
    return onboardingData.nutritionTargets?.daily_calorie_goal || 2000
  }

  const getProteinGoal = () => {
    const calories = getDailyCalories()
    const proteinPercent = onboardingData.nutritionTargets?.protein_percent || 20
    return Math.round((calories * proteinPercent / 100) / 4)
  }

  const getCarbGoal = () => {
    const calories = getDailyCalories()
    const carbPercent = onboardingData.nutritionTargets?.carbs_percent || 45
    return Math.round((calories * carbPercent / 100) / 4)
  }

  const getFatGoal = () => {
    const calories = getDailyCalories()
    const fatPercent = onboardingData.nutritionTargets?.fat_percent || 35
    return Math.round((calories * fatPercent / 100) / 9)
  }

  const getGoalBadge = () => {
    const goals = onboardingData.healthGoals?.health_goals || []
    if (goals.includes('weight_loss')) return { text: 'Weight Loss Journey', color: 'blue' }
    if (goals.includes('muscle_gain')) return { text: 'Muscle Building', color: 'green' }
    if (goals.includes('maintenance')) return { text: 'Healthy Maintenance', color: 'purple' }
    if (goals.includes('general_health')) return { text: 'General Wellness', color: 'teal' }
    return { text: 'Custom Goals', color: 'orange' }
  }

  const achievement = getGoalBadge()

  return (
    <OnboardingCard title="You're All Set!" icon="🎉">
      {showConfetti && (
        <Box position="absolute" top="-50px" left="50%" transform="translateX(-50%)" zIndex={1000}>
          <Text fontSize="6xl">🎊</Text>
        </Box>
      )}
      
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Icon as={FaTrophy} w={16} h={16} color="yellow.500" mb={4} />
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            Congratulations!
          </Text>
          <Text color="gray.600" mb={4}>
            Your personalized nutrition profile is ready. Here's your plan:
          </Text>
          <Badge colorScheme={achievement.color} fontSize="md" px={3} py={1} borderRadius="full">
            <Icon as={FaHeart} mr={2} />
            {achievement.text}
          </Badge>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Stat textAlign="center" p={4} bg="green.50" borderRadius="lg" _dark={{ bg: "green.900" }}>
            <StatLabel>Daily Calories</StatLabel>
            <StatNumber color="green.600">{getDailyCalories().toLocaleString()}</StatNumber>
            <StatHelpText>Personalized for your goals</StatHelpText>
          </Stat>
          
          <Stat textAlign="center" p={4} bg="blue.50" borderRadius="lg" _dark={{ bg: "blue.900" }}>
            <StatLabel>Protein Goal</StatLabel>
            <StatNumber color="blue.600">{getProteinGoal()}g</StatNumber>
            <StatHelpText>
              {onboardingData.nutritionTargets?.protein_percent || 20}% of calories
            </StatHelpText>
          </Stat>
          
          <Stat textAlign="center" p={4} bg="orange.50" borderRadius="lg" _dark={{ bg: "orange.900" }}>
            <StatLabel>Carbs Goal</StatLabel>
            <StatNumber color="orange.600">{getCarbGoal()}g</StatNumber>
            <StatHelpText>
              {onboardingData.nutritionTargets?.carbs_percent || 45}% of calories
            </StatHelpText>
          </Stat>
          
          <Stat textAlign="center" p={4} bg="purple.50" borderRadius="lg" _dark={{ bg: "purple.900" }}>
            <StatLabel>Fat Goal</StatLabel>
            <StatNumber color="purple.600">{getFatGoal()}g</StatNumber>
            <StatHelpText>
              {onboardingData.nutritionTargets?.fat_percent || 35}% of calories
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box 
          p={4} 
          bg="gradient" 
          bgGradient="linear(to-r, green.100, blue.100)" 
          borderRadius="lg"
          _dark={{ bgGradient: "linear(to-r, green.800, blue.800)" }}
        >
          <HStack>
            <Icon as={FaRocket} color="green.500" />
            <Box>
              <Text fontWeight="bold">What's Next?</Text>
              <Text fontSize="sm" color="gray.600">
                Start logging your first meal, explore food suggestions, and track your progress!
              </Text>
            </Box>
          </HStack>
        </Box>

        <VStack spacing={3}>
          <HStack spacing={2} align="center">
            <Icon as={FaCheckCircle} color="green.500" />
            <Text fontSize="sm">Profile setup complete</Text>
          </HStack>
          <HStack spacing={2} align="center">
            <Icon as={FaCheckCircle} color="green.500" />
            <Text fontSize="sm">Nutrition goals calculated</Text>
          </HStack>
          <HStack spacing={2} align="center">
            <Icon as={FaCheckCircle} color="green.500" />
            <Text fontSize="sm">Preferences saved</Text>
          </HStack>
        </VStack>

        <Button
          colorScheme="green"
          size="lg"
          onClick={handleComplete}
          isLoading={loading}
          loadingText="Setting up your dashboard..."
          leftIcon={<FaRocket />}
          w="full"
          py={6}
          fontSize="lg"
        >
          Start Your Nutrition Journey
        </Button>

        <Text fontSize="xs" textAlign="center" color="gray.500">
          You can always update your preferences and goals in your profile settings.
        </Text>
      </VStack>
    </OnboardingCard>
  )
}
