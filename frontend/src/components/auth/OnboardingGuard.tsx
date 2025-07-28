import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Center, Spinner, Text, VStack } from '@chakra-ui/react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'

interface OnboardingGuardProps {
  children: React.ReactNode
}

interface OnboardingStatus {
  onboarding_completed: boolean
  current_step?: number
  profile_completeness_score: number
}

export default function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth()
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || authLoading) return

      try {
        setLoading(true)
        setError(null)
        
        // Check if user has completed onboarding
        const response = await api.get('/preferences/onboarding-status')
        const status: OnboardingStatus = response.data
        
        setOnboardingStatus(status)
      } catch (err: any) {
        console.error('Failed to check onboarding status:', err)
        
        // If this is a 404 or the user doesn't have onboarding data yet,
        // we should direct them to onboarding
        if (err.response?.status === 404 || err.response?.status === 400) {
          setOnboardingStatus({
            onboarding_completed: false,
            current_step: 0,
            profile_completeness_score: 0
          })
        } else {
          setError('Failed to check onboarding status')
        }
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user, authLoading])

  // Show loading while checking auth or onboarding status
  if (authLoading || loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="green.500" />
          <Text color="gray.600">Checking your profile...</Text>
        </VStack>
      </Center>
    )
  }

  // Show error state
  if (error) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text color="red.500" fontSize="lg">⚠️ Setup Error</Text>
          <Text color="gray.600" textAlign="center" maxW="md">
            There was an issue checking your profile setup. Please try refreshing the page.
          </Text>
          <Text fontSize="sm" color="gray.500">
            {error}
          </Text>
        </VStack>
      </Center>
    )
  }

  // Redirect to onboarding if not completed
  if (onboardingStatus && !onboardingStatus.onboarding_completed) {
    // Allow access to onboarding page itself
    if (window.location.pathname === '/onboarding') {
      return <>{children}</>
    }
    
    return <Navigate to="/onboarding" replace />
  }

  // User has completed onboarding, allow access to app
  return <>{children}</>
}
