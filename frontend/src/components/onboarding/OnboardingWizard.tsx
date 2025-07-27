import { useState, useEffect } from 'react'
import { Box, useToast } from '@chakra-ui/react'
import { useOnboarding } from '../../contexts/OnboardingContext'
import OnboardingProgress from './OnboardingProgress'
import WelcomeStep from './steps/WelcomeStep'
import BasicProfileStep from './steps/BasicProfileStep'
import HealthGoalsStep from './steps/HealthGoalsStep'
import DietaryPreferencesStep from './steps/DietaryPreferencesStep'
import NutritionTargetsStep from './steps/NutritionTargetsStep'
import AppPreferencesStep from './steps/AppPreferencesStep'
import CompletionStep from './steps/CompletionStep'

interface OnboardingWizardProps {
  onComplete: () => void
}

const STEP_TITLES = [
  'Welcome',
  'Basic Profile', 
  'Health Goals',
  'Dietary Preferences',
  'Nutrition Targets',
  'App Preferences',
  'Complete'
]

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { startOnboarding, currentStep, setCurrentStep } = useOnboarding()
  const [isInitialized, setIsInitialized] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        await startOnboarding()
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize onboarding:', error)
        toast({
          title: "Setup Error",
          description: "There was an issue starting the onboarding process. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    }

    if (!isInitialized) {
      initializeOnboarding()
    }
  }, [isInitialized, startOnboarding, toast])

  const handleNext = () => {
    if (currentStep < STEP_TITLES.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const handleComplete = () => {
    onComplete()
  }

  if (!isInitialized) {
    return (
      <Box 
        minH="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
      >
        <Box textAlign="center">
          <Box fontSize="2xl" mb={4}>🌱</Box>
          <Box>Setting up your personalized nutrition journey...</Box>
        </Box>
      </Box>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
      case 2:
        return <BasicProfileStep onNext={handleNext} onBack={handleBack} />
      case 3:
        return <HealthGoalsStep onNext={handleNext} onBack={handleBack} />
      case 4:
        return <DietaryPreferencesStep onNext={handleNext} onBack={handleBack} />
      case 5:
        return <NutritionTargetsStep onNext={handleNext} onBack={handleBack} />
      case 6:
        return <AppPreferencesStep onNext={handleNext} onBack={handleBack} />
      case 7:
        return <CompletionStep onComplete={handleComplete} />
      default:
        return (
          <Box textAlign="center">
            <Box fontSize="2xl" mb={4}>❌</Box>
            <Box>Invalid step. Please refresh and try again.</Box>
          </Box>
        )
    }
  }

  return (
    <Box 
      minH="100vh" 
      bg="gray.50" 
      _dark={{ bg: "gray.900" }}
      py={8}
    >
      <Box maxW="4xl" mx="auto" px={4}>
        {/* Progress Bar */}
        <OnboardingProgress 
          currentStep={currentStep}
          totalSteps={STEP_TITLES.length}
          completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => i + 1)}
          stepTitles={STEP_TITLES}
        />
        
        {/* Current Step Content */}
        <Box mt={8}>
          {renderCurrentStep()}
        </Box>
      </Box>
    </Box>
  )
}
