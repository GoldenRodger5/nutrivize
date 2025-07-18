import { Container, VStack, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import RestaurantMenuAnalyzer from '../components/RestaurantMenuAnalyzer'

export default function RestaurantMenuAnalysisPage() {
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} align="center" mb={6}>
          <Heading size="lg" textAlign="center">
            Restaurant Menu Analysis
          </Heading>
          <Text color={textColor} textAlign="center" maxW="600px">
            Upload a menu photo, paste menu text, or enter a restaurant URL to get AI-powered 
            nutritional analysis and personalized recommendations.
          </Text>
        </VStack>
        
        <RestaurantMenuAnalyzer />
      </VStack>
    </Container>
  )
}
