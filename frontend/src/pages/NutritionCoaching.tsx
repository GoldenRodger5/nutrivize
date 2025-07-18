import { Container, VStack, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import PersonalizedNutritionCoaching from '../components/PersonalizedNutritionCoaching'

export default function NutritionCoachingPage() {
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} align="center" mb={6}>
          <Heading size="lg" textAlign="center">
            AI Nutrition Coaching
          </Heading>
          <Text color={textColor} textAlign="center" maxW="600px">
            Get personalized nutrition coaching, custom meal plans, and ongoing support 
            to achieve your health and fitness goals.
          </Text>
        </VStack>
        
        <PersonalizedNutritionCoaching />
      </VStack>
    </Container>
  )
}
