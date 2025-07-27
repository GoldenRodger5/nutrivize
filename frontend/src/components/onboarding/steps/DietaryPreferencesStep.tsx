import { useState } from 'react'
import {
  VStack,
  Button,
  HStack,
  Text,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import OnboardingCard from '../OnboardingCard'
import DietaryProfileBuilder from '../../food/DietaryProfileBuilder'
import { useOnboarding } from '../../../contexts/OnboardingContext'

interface DietaryPreferencesStepProps {
  onNext: () => void
  onBack: () => void
}

export default function DietaryPreferencesStep({ onNext, onBack }: DietaryPreferencesStepProps) {
  const { onboardingData, updateStepData, saveStepData } = useOnboarding()
  
  const [currentProfile, setCurrentProfile] = useState(
    onboardingData.dietaryPreferences || {
      dietary_restrictions: [],
      allergens: [],
      disliked_foods: [],
      preferred_cuisines: [],
      cooking_skill_level: 'intermediate',
      max_prep_time: 30,
      budget_preference: 'moderate',
      strictness_level: 'moderate'
    }
  )
  
  const [loading, setLoading] = useState(false)

  const handleProfileUpdate = (profile: any) => {
    setCurrentProfile(profile)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      // Map the profile to our expected format
      const dietaryData = {
        dietary_restrictions: currentProfile.dietary_restrictions || [],
        allergens: currentProfile.allergens || [],
        disliked_foods: currentProfile.disliked_foods || [],
        preferred_cuisines: currentProfile.preferred_cuisines || [],
        cooking_skill_level: currentProfile.cooking_skill_level || 'intermediate',
        max_prep_time: currentProfile.max_prep_time || 30,
        budget_preference: currentProfile.budget_preference || 'moderate',
        strictness_level: currentProfile.strictness_level || 'moderate'
      }

      // Update local context
      updateStepData({ dietaryPreferences: dietaryData })
      
      // Save to backend
      await saveStepData(3, { dietary_preferences: dietaryData })
      
      onNext()
    } catch (error) {
      console.error('Failed to save dietary preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSkipStep = async () => {
    try {
      setLoading(true)
      
      // Save minimal dietary preferences
      const minimalData = {
        dietary_restrictions: [],
        allergens: [],
        disliked_foods: [],
        preferred_cuisines: [],
        cooking_skill_level: 'intermediate',
        max_prep_time: 30,
        budget_preference: 'moderate',
        strictness_level: 'moderate'
      }

      updateStepData({ dietaryPreferences: minimalData })
      await saveStepData(3, { dietary_preferences: minimalData })
      
      onNext()
    } catch (error) {
      console.error('Failed to skip dietary preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <OnboardingCard title="Dietary Preferences & Restrictions" icon="🥗" maxWidth="800px">
      <VStack spacing={6} align="stretch">
        <Text textAlign="center" color="gray.600">
          Tell us about your dietary preferences, restrictions, and food allergies. 
          This ensures our AI recommendations are safe and aligned with your lifestyle.
        </Text>

        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Text fontSize="sm">
            <strong>Optional but recommended:</strong> This information helps us provide 
            more accurate meal suggestions and ensures food safety. You can skip and add this later.
          </Text>
        </Alert>

        {/* Use the existing DietaryProfileBuilder component */}
        <DietaryProfileBuilder
          currentProfile={currentProfile}
          onProfileUpdate={handleProfileUpdate}
        />

        <HStack spacing={4} justify="space-between">
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
          >
            Back
          </Button>
          
          <HStack spacing={3}>
            <Button
              variant="ghost"
              onClick={handleSkipStep}
              isLoading={loading}
              size="lg"
            >
              Skip for Now
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
        </HStack>
      </VStack>
    </OnboardingCard>
  )
}
