import { useEffect, useState } from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  VStack,
  Text,
  Progress,
  useColorModeValue,
  Box,
  Badge,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

interface OnboardingStatus {
  onboarding_completed: boolean
  current_step?: number
  profile_completeness_score: number
  completed_steps: number[]
  next_step?: number
}

interface OnboardingPromptProps {
  onDismiss?: () => void
}

export default function OnboardingPrompt({ onDismiss }: OnboardingPromptProps) {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const navigate = useNavigate()
  const bg = useColorModeValue('blue.50', 'blue.900')
  const borderColor = useColorModeValue('blue.200', 'blue.700')

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get('/preferences/onboarding-status')
        setStatus(response.data)
      } catch (error) {
        // If onboarding status doesn't exist, assume not completed
        setStatus({
          onboarding_completed: false,
          current_step: 0,
          profile_completeness_score: 0,
          completed_steps: [],
          next_step: 0
        })
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [])

  const handleStartOnboarding = () => {
    navigate('/onboarding')
  }

  const handleContinueOnboarding = () => {
    navigate('/onboarding')
  }

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) {
      onDismiss()
    }
  }

  // Don't show if loading, dismissed, or onboarding is completed
  if (loading || dismissed || (status?.onboarding_completed)) {
    return null
  }

  // If status indicates no onboarding started
  if (!status || status.profile_completeness_score === 0) {
    return (
      <Alert status="info" bg={bg} borderColor={borderColor} borderWidth={1} borderRadius="lg">
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>Welcome to Nutrivize! 🌱</AlertTitle>
          <AlertDescription>
            <VStack align="start" spacing={3} mt={2}>
              <Text>
                Let's set up your personalized nutrition journey. Complete our quick setup wizard 
                to get AI-powered meal suggestions, track your goals, and unlock all features.
              </Text>
              <HStack spacing={3}>
                <Button colorScheme="blue" size="sm" onClick={handleStartOnboarding}>
                  Start Setup (5 min)
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDismiss}>
                  Maybe Later
                </Button>
              </HStack>
            </VStack>
          </AlertDescription>
        </Box>
      </Alert>
    )
  }

  // If onboarding is partially complete
  const completionPercentage = Math.round(status.profile_completeness_score)
  
  return (
    <Alert status="warning" bg={bg} borderColor={borderColor} borderWidth={1} borderRadius="lg">
      <AlertIcon />
      <Box flex="1">
        <AlertTitle>
          Complete Your Profile Setup 
          <Badge ml={2} colorScheme="orange">{completionPercentage}% Complete</Badge>
        </AlertTitle>
        <AlertDescription>
          <VStack align="start" spacing={3} mt={2}>
            <Text>
              You're {completionPercentage}% done with setup! Complete your profile to unlock 
              personalized meal recommendations and better nutrition tracking.
            </Text>
            <Progress 
              value={completionPercentage} 
              colorScheme="orange" 
              size="sm" 
              w="100%" 
              borderRadius="full"
            />
            <HStack spacing={3}>
              <Button colorScheme="orange" size="sm" onClick={handleContinueOnboarding}>
                Continue Setup
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Skip for Now
              </Button>
            </HStack>
          </VStack>
        </AlertDescription>
      </Box>
    </Alert>
  )
}
