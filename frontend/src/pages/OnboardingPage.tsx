import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'
import OnboardingWizard from '../components/onboarding/OnboardingWizard'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      navigate('/login')
      return
    }

    // For now, we'll check if onboarding is needed based on route
    // In a production app, you'd check user.onboarding_completed or similar
    // if (user?.onboarding_completed) {
    //   navigate('/dashboard')
    //   return
    // }
  }, [user, loading, navigate])

  const handleOnboardingComplete = () => {
    // Navigate to dashboard after successful onboarding
    navigate('/dashboard')
  }

  // Show loading state while checking authentication
  if (loading) {
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
          <Box>Loading your nutrition journey...</Box>
        </Box>
      </Box>
    )
  }

  // Don't render onboarding if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <Box>
      <OnboardingWizard onComplete={handleOnboardingComplete} />
    </Box>
  )
}
