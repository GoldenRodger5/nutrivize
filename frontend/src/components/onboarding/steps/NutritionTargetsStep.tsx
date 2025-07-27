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
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
  Badge,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react'
import OnboardingCard from '../OnboardingCard'
import { useOnboarding } from '../../../contexts/OnboardingContext'

interface NutritionTargetsStepProps {
  onNext: () => void
  onBack: () => void
}

export default function NutritionTargetsStep({ onNext, onBack }: NutritionTargetsStepProps) {
  const { onboardingData, updateStepData, saveStepData } = useOnboarding()
  
  // Get recommended calories from previous steps if available
  const recommendedCalories = 2000 // Default, could be calculated from previous steps
  
  const [formData, setFormData] = useState({
    daily_calorie_goal: onboardingData.nutritionTargets?.daily_calorie_goal || recommendedCalories,
    protein_percent: onboardingData.nutritionTargets?.protein_percent || 25,
    carbs_percent: onboardingData.nutritionTargets?.carbs_percent || 45,
    fat_percent: onboardingData.nutritionTargets?.fat_percent || 30,
    meal_frequency: onboardingData.nutritionTargets?.meal_frequency || 3
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate macro grams based on percentages and calories
  const calculateMacroGrams = () => {
    const calories = formData.daily_calorie_goal
    return {
      protein: Math.round((calories * formData.protein_percent / 100) / 4), // 4 cal/g
      carbs: Math.round((calories * formData.carbs_percent / 100) / 4), // 4 cal/g
      fat: Math.round((calories * formData.fat_percent / 100) / 9) // 9 cal/g
    }
  }

  const validateMacros = () => {
    const total = formData.protein_percent + formData.carbs_percent + formData.fat_percent
    if (Math.abs(total - 100) > 1) { // Allow 1% tolerance
      setErrors({ macros: 'Macro percentages must add up to 100%' })
      return false
    }
    setErrors({})
    return true
  }

  const handleMacroChange = (macro: string, value: number) => {
    const newFormData = { ...formData, [macro]: value }
    
    // Auto-adjust other macros to maintain 100%
    if (macro === 'protein_percent') {
      const remaining = 100 - value
      const ratio = remaining / (formData.carbs_percent + formData.fat_percent)
      newFormData.carbs_percent = Math.round(formData.carbs_percent * ratio)
      newFormData.fat_percent = 100 - value - newFormData.carbs_percent
    } else if (macro === 'carbs_percent') {
      const remaining = 100 - value
      const ratio = remaining / (formData.protein_percent + formData.fat_percent)
      newFormData.protein_percent = Math.round(formData.protein_percent * ratio)
      newFormData.fat_percent = 100 - value - newFormData.protein_percent
    } else if (macro === 'fat_percent') {
      const remaining = 100 - value
      const ratio = remaining / (formData.protein_percent + formData.carbs_percent)
      newFormData.protein_percent = Math.round(formData.protein_percent * ratio)
      newFormData.carbs_percent = 100 - value - newFormData.protein_percent
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = async () => {
    if (!validateMacros()) return

    try {
      setLoading(true)
      
      const nutritionData = {
        daily_calorie_goal: formData.daily_calorie_goal,
        protein_percent: formData.protein_percent,
        carbs_percent: formData.carbs_percent,
        fat_percent: formData.fat_percent,
        meal_frequency: formData.meal_frequency
      }

      // Update local context
      updateStepData({ nutritionTargets: nutritionData })
      
      // Save to backend
      await saveStepData(4, nutritionData)
      
      onNext()
    } catch (error) {
      console.error('Failed to save nutrition targets:', error)
    } finally {
      setLoading(false)
    }
  }

  const macroGrams = calculateMacroGrams()
  const macroTotal = formData.protein_percent + formData.carbs_percent + formData.fat_percent

  const mealFrequencyOptions = [
    { value: 2, label: '2 meals (Intermittent Fasting)' },
    { value: 3, label: '3 meals (Traditional)' },
    { value: 4, label: '4 meals (Small + Snacks)' },
    { value: 5, label: '5-6 meals (Frequent eating)' }
  ]

  return (
    <OnboardingCard title="Nutrition Targets" icon="📊" maxWidth="700px">
      <VStack spacing={6} align="stretch">
        <Text textAlign="center" color="gray.600">
          Set your daily calorie goal and macro distribution. These can be adjusted anytime based on your progress.
        </Text>

        <FormControl>
          <FormLabel>Daily Calorie Goal</FormLabel>
          <NumberInput
            value={formData.daily_calorie_goal}
            onChange={(value) => setFormData(prev => ({ ...prev, daily_calorie_goal: parseInt(value) || 2000 }))}
            min={800}
            max={5000}
            step={50}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Based on your profile and goals. Adjust as needed.
          </Text>
        </FormControl>

        <Box>
          <Text fontWeight="bold" mb={4}>
            Macronutrient Distribution
            {macroTotal !== 100 && (
              <Badge colorScheme="orange" ml={2}>
                {macroTotal}% (should be 100%)
              </Badge>
            )}
          </Text>
          
          {errors.macros && (
            <Alert status="warning" mb={4} borderRadius="lg">
              <AlertIcon />
              <Text fontSize="sm">{errors.macros}</Text>
            </Alert>
          )}

          <VStack spacing={4}>
            {/* Protein */}
            <Box w="full">
              <HStack justify="space-between" mb={2}>
                <Text>Protein</Text>
                <HStack>
                  <Text fontWeight="bold">{formData.protein_percent}%</Text>
                  <Text fontSize="sm" color="gray.500">({macroGrams.protein}g)</Text>
                </HStack>
              </HStack>
              <Slider
                value={formData.protein_percent}
                onChange={(value) => handleMacroChange('protein_percent', value)}
                min={10}
                max={50}
                colorScheme="red"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>

            {/* Carbohydrates */}
            <Box w="full">
              <HStack justify="space-between" mb={2}>
                <Text>Carbohydrates</Text>
                <HStack>
                  <Text fontWeight="bold">{formData.carbs_percent}%</Text>
                  <Text fontSize="sm" color="gray.500">({macroGrams.carbs}g)</Text>
                </HStack>
              </HStack>
              <Slider
                value={formData.carbs_percent}
                onChange={(value) => handleMacroChange('carbs_percent', value)}
                min={20}
                max={70}
                colorScheme="green"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>

            {/* Fat */}
            <Box w="full">
              <HStack justify="space-between" mb={2}>
                <Text>Fat</Text>
                <HStack>
                  <Text fontWeight="bold">{formData.fat_percent}%</Text>
                  <Text fontSize="sm" color="gray.500">({macroGrams.fat}g)</Text>
                </HStack>
              </HStack>
              <Slider
                value={formData.fat_percent}
                onChange={(value) => handleMacroChange('fat_percent', value)}
                min={10}
                max={50}
                colorScheme="yellow"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </VStack>
        </Box>

        <SimpleGrid columns={3} spacing={4}>
          <Stat textAlign="center" p={3} bg="red.50" _dark={{ bg: "red.900" }} borderRadius="lg">
            <StatLabel>Protein</StatLabel>
            <StatNumber color="red.500">{macroGrams.protein}g</StatNumber>
          </Stat>
          <Stat textAlign="center" p={3} bg="green.50" _dark={{ bg: "green.900" }} borderRadius="lg">
            <StatLabel>Carbs</StatLabel>
            <StatNumber color="green.500">{macroGrams.carbs}g</StatNumber>
          </Stat>
          <Stat textAlign="center" p={3} bg="yellow.50" _dark={{ bg: "yellow.900" }} borderRadius="lg">
            <StatLabel>Fat</StatLabel>
            <StatNumber color="yellow.500">{macroGrams.fat}g</StatNumber>
          </Stat>
        </SimpleGrid>

        <FormControl>
          <FormLabel>Meal Frequency</FormLabel>
          <Select
            value={formData.meal_frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, meal_frequency: parseInt(e.target.value) }))}
          >
            {mealFrequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Text fontSize="sm" color="gray.500" mt={1}>
            How many meals and snacks per day works best for you?
          </Text>
        </FormControl>

        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontSize="sm">
              <strong>These are starting targets:</strong> You can adjust your goals anytime based on 
              your progress and preferences. Our AI will learn from your eating patterns and provide personalized recommendations.
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
            isDisabled={macroTotal !== 100}
          >
            Continue
          </Button>
        </HStack>
      </VStack>
    </OnboardingCard>
  )
}
