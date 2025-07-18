import { Container, VStack, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import AIHealthInsights from '../components/AIHealthInsights'

export default function HealthInsightsPage() {
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} align="center" mb={6}>
          <Heading size="lg" textAlign="center">
            AI Health Insights
          </Heading>
          <Text color={textColor} textAlign="center" maxW="600px">
            Get personalized health insights and recommendations based on your nutrition data, 
            progress tracking, and health goals.
          </Text>
        </VStack>
        
        <AIHealthInsights />
      </VStack>
    </Container>
  )
}
