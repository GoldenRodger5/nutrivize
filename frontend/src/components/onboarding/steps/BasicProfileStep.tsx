import { useState } from 'react'
import {
  VStack,
  FormControl,
  FormLabel,
  Select,
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
  Box
} from '@chakra-ui/react'
import OnboardingCard from '../OnboardingCard'
import { useOnboarding } from '../../../contexts/OnboardingContext'
import { lbsToKg, inchesToCm, kgToLbs, cmToInches } from '../../../utils/weightHeightConversions'

interface BasicProfileStepProps {
  onNext: () => void
  onBack: () => void
}

export default function BasicProfileStep({ onNext, onBack }: BasicProfileStepProps) {
  const { onboardingData, updateStepData, saveStepData } = useOnboarding()
  
  // Convert existing metric values to imperial for display if they exist
  const existingHeight = onboardingData.basicProfile?.height || 0
  const existingWeight = onboardingData.basicProfile?.current_weight || 0
  
  const [formData, setFormData] = useState({
    age: onboardingData.basicProfile?.age || 0,
    gender: onboardingData.basicProfile?.gender || '',
    // Display in imperial: convert cm to inches, kg to lbs
    height: existingHeight > 0 ? cmToInches(existingHeight) : 0,
    current_weight: existingWeight > 0 ? kgToLbs(existingWeight) : 0,
    activity_level: onboardingData.basicProfile?.activity_level || ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.age || formData.age < 13 || formData.age > 120) {
      newErrors.age = 'Please enter a valid age between 13 and 120'
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender'
    }
    
    // Imperial validation: 20-120 inches (1'8" to 10')
    if (!formData.height || formData.height < 20 || formData.height > 120) {
      newErrors.height = 'Please enter a valid height between 20-120 inches'
    }
    
    // Imperial validation: 45-1100 lbs
    if (!formData.current_weight || formData.current_weight < 45 || formData.current_weight > 1100) {
      newErrors.current_weight = 'Please enter a valid weight between 45-1100 lbs'
    }
    
    if (!formData.activity_level) {
      newErrors.activity_level = 'Please select your activity level'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      
      // Convert imperial values to metric for backend storage
      const height = typeof formData.height === 'string' ? parseFloat(formData.height) : formData.height
      const weight = typeof formData.current_weight === 'string' ? parseFloat(formData.current_weight) : formData.current_weight
      
      const profileData = {
        age: typeof formData.age === 'string' ? parseInt(formData.age) : formData.age,
        gender: formData.gender,
        height: inchesToCm(height), // Convert inches to cm for backend
        current_weight: lbsToKg(weight), // Convert lbs to kg for backend
        activity_level: formData.activity_level
      }

      // Update local context
      updateStepData({ basicProfile: profileData })
      
      // Save to backend
      await saveStepData(1, profileData)
      
      onNext()
    } catch (error) {
      console.error('Failed to save basic profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)' },
    { value: 'extremely_active', label: 'Extremely Active (very hard exercise, physical job)' }
  ]

  return (
    <OnboardingCard title="Tell Us About Yourself" icon="👤">
      <VStack spacing={6} align="stretch">
        <Text textAlign="center" color="gray.600">
          This information helps us calculate your personalized nutrition needs.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={!!errors.age}>
            <FormLabel>Age</FormLabel>
            <NumberInput
              value={formData.age}
              onChange={(value) => handleInputChange('age', value)}
              min={13}
              max={120}
            >
              <NumberInputField placeholder="Enter your age" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {errors.age && <Text color="red.500" fontSize="sm">{errors.age}</Text>}
          </FormControl>

          <FormControl isInvalid={!!errors.gender}>
            <FormLabel>Gender</FormLabel>
            <Select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              placeholder="Select gender"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
            {errors.gender && <Text color="red.500" fontSize="sm">{errors.gender}</Text>}
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl isInvalid={!!errors.height}>
            <FormLabel>Height (inches)</FormLabel>
            <NumberInput
              value={formData.height}
              onChange={(value) => handleInputChange('height', value)}
              min={20}
              max={120}
              precision={1}
            >
              <NumberInputField placeholder="Enter height in inches" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {errors.height && <Text color="red.500" fontSize="sm">{errors.height}</Text>}
          </FormControl>

          <FormControl isInvalid={!!errors.current_weight}>
            <FormLabel>Current Weight (lbs)</FormLabel>
            <NumberInput
              value={formData.current_weight}
              onChange={(value) => handleInputChange('current_weight', value)}
              min={45}
              max={1100}
              precision={1}
            >
              <NumberInputField placeholder="Enter weight in lbs" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {errors.current_weight && <Text color="red.500" fontSize="sm">{errors.current_weight}</Text>}
          </FormControl>
        </SimpleGrid>

        <FormControl isInvalid={!!errors.activity_level}>
          <FormLabel>Activity Level</FormLabel>
          <Select
            value={formData.activity_level}
            onChange={(e) => handleInputChange('activity_level', e.target.value)}
            placeholder="Select your activity level"
          >
            {activityLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
          {errors.activity_level && <Text color="red.500" fontSize="sm">{errors.activity_level}</Text>}
        </FormControl>

        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontSize="sm">
              <strong>Why we need this:</strong> We use the Mifflin-St Jeor equation to calculate your 
              personalized calorie needs based on your age, gender, height, weight, and activity level.
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
          >
            Continue
          </Button>
        </HStack>
      </VStack>
    </OnboardingCard>
  )
}
