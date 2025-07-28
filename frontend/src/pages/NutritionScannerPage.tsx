import React from 'react'
import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  useColorModeValue,
} from '@chakra-ui/react'
import NutritionLabelScanner from '../components/nutrition/NutritionLabelScanner'

const NutritionScannerPage: React.FC = () => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleScanComplete = (nutritionInfo: any) => {
    console.log('Scan completed:', nutritionInfo)
    // Could navigate to food log or show success message
  }

  const handleCreateFood = (nutritionInfo: any) => {
    console.log('Food created:', nutritionInfo)
    // Could navigate to food index or show success message
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" color="green.500" mb={2}>
            📱 Nutrition Label Scanner
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Scan nutrition labels to quickly add foods to your database
          </Text>
        </Box>

        <Box
          bg={bg}
          borderWidth={1}
          borderColor={borderColor}
          borderRadius="xl"
          p={6}
          shadow="lg"
        >
          <NutritionLabelScanner
            onScanComplete={handleScanComplete}
            onCreateFood={handleCreateFood}
            showCreateButton={true}
          />
        </Box>
      </VStack>
    </Container>
  )
}

export default NutritionScannerPage
