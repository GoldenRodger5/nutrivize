import { useState } from 'react'
import {
  VStack,
  FormControl,
  FormLabel,
  Button,
  HStack,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  SimpleGrid,
  Box,
  Checkbox,
  CheckboxGroup,
  Select,
  Badge
} from '@chakra-ui/react'
import OnboardingCard from '../OnboardingCard'
import { useOnboarding } from '../../../contexts/OnboardingContext'

interface HealthGoalsStepProps {
  onNext: () => void
  onBack: () => void
}

export default function HealthGoalsStep({ onNext, onBack }: HealthGoalsStepProps) {
  const { onboardingData, updateStepData, saveStepData, calculateCalories } = useOnboarding()
  
  const [formData, setFormData] = useState({
    health_goals: onboardingData.healthGoals?.health_goals || [],
    target_weight: onboardingData.healthGoals?.target_weight || 0,
    timeline: onboardingData.healthGoals?.timeline || ''
  })
  
  const [calorieRecommendation, setCalorieRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [calculatingCalories, setCalculatingCalories] = useState(false)

  const healthGoalOptions = [
    { value: 'lose_weight', label: 'Lose Weight', color: 'blue' },
    { value: 'gain_muscle', label: 'Gain Muscle', color: 'green' },
    { value: 'maintain_weight', label: 'Maintain Weight', color: 'purple' },
    { value: 'improve_health', label: 'Improve Overall Health', color: 'orange' },
    { value: 'increase_energy', label: 'Increase Energy', color: 'yellow' },
    { value: 'better_sleep', label: 'Better Sleep', color: 'teal' }
  ]

  const timelineOptions = [
    { value: '1_month', label: '1 Month' },
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6 Months' },
    { value: '1_year', label: '1 Year' },
    { value: 'gradual', label: 'Gradual (No rush)' }
  ]

  const handleGoalsChange = async (selectedGoals: string[]) => {
    const newFormData = { ...formData, health_goals: selectedGoals }
    setFormData(newFormData)
    
    // Auto-calculate calories if we have basic profile
    if (onboardingData.basicProfile && selectedGoals.length > 0) {
      await calculateRecommendedCalories(newFormData)
    }
  }

  const calculateRecommendedCalories = async (goalsData = formData) => {
    if (!onboardingData.basicProfile) return

    try {
      setCalculatingCalories(true)
      const result = await calculateCalories(onboardingData.basicProfile, goalsData)
      setCalorieRecommendation(result)
    } catch (error) {
      console.error('Failed to calculate calories:', error)
    } finally {
      setCalculatingCalories(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      const goalsData = {
        health_goals: formData.health_goals,
        target_weight: formData.target_weight || undefined,
        timeline: formData.timeline || undefined
      }

      // Update local context
      updateStepData({ healthGoals: goalsData })
      
      // Save to backend
      await saveStepData(2, goalsData)
      
      onNext()
    } catch (error) {
      console.error('Failed to save health goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const needsTargetWeight = formData.health_goals.includes('lose_weight') || formData.health_goals.includes('gain_muscle')
  const currentWeight = onboardingData.basicProfile?.current_weight

  return (
    <OnboardingCard title="What Are Your Health Goals?" icon="🎯">
      <VStack spacing={6} align="stretch">
        <Text textAlign="center" color="gray.600">
          Select your primary health and fitness goals. This helps us personalize your nutrition plan.
        </Text>

        <FormControl>
          <FormLabel>Health Goals (select all that apply)</FormLabel>
          <CheckboxGroup 
            value={formData.health_goals} 
            onChange={handleGoalsChange}
          >
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {healthGoalOptions.map((goal) => (
                <Box key={goal.value}>
                  <Checkbox value={goal.value} size="lg">
                    <HStack>
                      <Text>{goal.label}</Text>
                      <Badge colorScheme={goal.color} size="sm">{goal.color}</Badge>
                    </HStack>
                  </Checkbox>
                </Box>
              ))}
            </SimpleGrid>
          </CheckboxGroup>
        </FormControl>

        {needsTargetWeight && (
          <FormControl>
            <FormLabel>
              Target Weight (kg)
              {currentWeight && (
                <Text as="span" fontSize="sm" color="gray.500" ml={2}>
                  Current: {currentWeight} kg
                </Text>
              )}
            </FormLabel>
            <NumberInput
              value={formData.target_weight}
              onChange={(value) => setFormData(prev => ({ ...prev, target_weight: parseFloat(value) || 0 }))}
              min={20}
              max={500}
              precision={1}
            >
              <NumberInputField placeholder="Enter your target weight" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        )}

        <FormControl>
          <FormLabel>Timeline</FormLabel>
          <Select
            value={formData.timeline}
            onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
            placeholder="How quickly do you want to achieve your goals?"
          >
            {timelineOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>

        {calorieRecommendation && (
          <Alert status="success" borderRadius="lg" flexDirection="column" alignItems="start">
            <HStack mb={2}>
              <AlertIcon />
              <Text fontWeight="bold">Recommended Daily Calories</Text>
            </HStack>
            <VStack align="start" spacing={1} pl={6}>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {calorieRecommendation.recommended_calories} calories/day
              </Text>
              <Text fontSize="sm" color="gray.600">
                {calorieRecommendation.explanation}
              </Text>
              <HStack spacing={4} fontSize="xs" color="gray.500">
                <Text>BMR: {calorieRecommendation.bmr}</Text>
                <Text>TDEE: {calorieRecommendation.tdee}</Text>
              </HStack>
            </VStack>
          </Alert>
        )}

        {calculatingCalories && (
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <Text>Calculating your personalized calorie recommendation...</Text>
          </Alert>
        )}

        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontSize="sm">
              <strong>Goal-based recommendations:</strong> We'll adjust your nutrition targets 
              based on your selected goals and create personalized meal suggestions.
            </Text>
          </Box>
        </Alert>

        <HStack spacing={4} justify="space-between">
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
          >
            Back
          </Button>
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={loading}
            size="lg"
            px={8}
            isDisabled={formData.health_goals.length === 0}
          >
            Continue
          </Button>
        </HStack>
      </VStack>
    </OnboardingCard>
  )
}
