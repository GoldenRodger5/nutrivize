import { Container, VStack, Heading, Text, SimpleGrid, Card, CardBody, Box, Button, useColorModeValue } from '@chakra-ui/react'
import SEO from '../components/SEO'

export default function FeaturesPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  
  const features = [
    {
      title: 'Smart Food Tracking',
      description: 'Log your meals with our intelligent food database. Track calories, macros, and micronutrients with ease.',
      icon: '📊'
    },
    {
      title: 'AI Meal Planning',
      description: 'Get personalized meal suggestions powered by AI. Tailored to your goals, preferences, and dietary restrictions.',
      icon: '🤖'
    },
    {
      title: 'Restaurant Assistant',
      description: 'Make healthy choices when dining out with our AI restaurant assistant and nutrition database.',
      icon: '🍽️'
    },
    {
      title: 'Progress Analytics',
      description: 'Visualize your nutrition data with comprehensive charts and track your progress over time.',
      icon: '📈'
    },
    {
      title: 'Goal Setting',
      description: 'Set and track personalized health goals. Monitor your progress and stay motivated.',
      icon: '🎯'
    },
    {
      title: 'Food Database',
      description: 'Access thousands of foods with detailed nutrition information and easy search functionality.',
      icon: '🔍'
    }
  ]

  return (
    <>
      <SEO 
        title="Features - Smart Nutrition Tracking & AI Meal Planning"
        description="Discover Nutrivize's powerful features: AI meal planning, smart food tracking, restaurant assistant, progress analytics, and comprehensive nutrition database."
        keywords="nutrition tracking features, AI meal planner, food database, progress analytics, restaurant nutrition, health goal tracking"
        url="https://nutrivize.app/features"
      />
      
      <Container maxW="container.xl" py={16} px={8}>
        <VStack spacing={16} align="stretch">
          {/* Hero Section */}
          <Box textAlign="center">
            <Heading size="2xl" mb={4} color="green.600">
              Powerful Features for Your Health Journey
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="3xl" mx="auto">
              Everything you need to track nutrition, plan meals, and achieve your health goals in one comprehensive platform.
            </Text>
          </Box>

          {/* Features Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {features.map((feature, index) => (
              <Card key={index} bg={cardBg} shadow="md" _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }} transition="all 0.2s">
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Box fontSize="3xl">{feature.icon}</Box>
                    <Heading size="md" color="green.600">{feature.title}</Heading>
                    <Text color="gray.600">{feature.description}</Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* CTA Section */}
          <Box textAlign="center" py={8}>
            <Heading size="lg" mb={4}>Ready to Start Your Health Journey?</Heading>
            <Text fontSize="lg" color="gray.600" mb={6}>
              Nutrivize is currently in private beta. Contact us for early access.
            </Text>
            <Button 
              colorScheme="green" 
              size="lg" 
              onClick={() => window.location.href = 'mailto:hello@nutrivize.app?subject=Early Access Request'}
            >
              Request Early Access
            </Button>
          </Box>
        </VStack>
      </Container>
    </>
  )
}
