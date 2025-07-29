import { Container, VStack, Heading, Text, Box, Button, SimpleGrid, Card, CardBody, useColorModeValue, Badge } from '@chakra-ui/react'
import SEO from '../components/SEO'

export default function BrandPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  
  const highlights = [
    {
      title: 'Official Nutrivize App',
      description: 'The only official Nutrivize platform for smart nutrition tracking.',
      badge: 'Official'
    },
    {
      title: 'AI-Powered by Nutrivize',
      description: 'Advanced AI technology built specifically for Nutrivize users.',
      badge: 'AI'
    },
    {
      title: 'Nutrivize Community',
      description: 'Join thousands of users achieving their health goals with Nutrivize.',
      badge: 'Community'
    }
  ]

  return (
    <>
      <SEO 
        title="Nutrivize - Official Nutrition Tracker & AI Meal Planning App"
        description="Official Nutrivize website. Smart nutrition tracking, AI meal planning, and personalized health insights. The original Nutrivize app trusted by thousands of users."
        keywords="nutrivize, nutrivize official, nutrivize app, nutrivize website, nutrivize nutrition tracker, nutrivize ai, nutrivize meal planner, official nutrivize, nutrivize login, nutrivize sign up"
        url="https://nutrivize.app"
      />
      
      <Container maxW="container.xl" py={16} px={8}>
        <VStack spacing={16} align="stretch">
          {/* Hero Section */}
          <Box textAlign="center">
            <Badge colorScheme="green" fontSize="md" mb={4} px={3} py={1}>
              Official Nutrivize
            </Badge>
            <Heading size="2xl" mb={4} color="green.600">
              Welcome to Nutrivize
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="3xl" mx="auto" mb={6}>
              The official Nutrivize platform for smart nutrition tracking and AI-powered meal planning. 
              Track your health journey with the app trusted by thousands.
            </Text>
            <Text fontSize="lg" color="gray.500" mb={8}>
              Currently in private beta. Request early access below.
            </Text>
          </Box>

          {/* Brand Highlights */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {highlights.map((highlight, index) => (
              <Card key={index} bg={cardBg} shadow="md" textAlign="center">
                <CardBody>
                  <VStack spacing={4}>
                    <Badge colorScheme="green" fontSize="sm">{highlight.badge}</Badge>
                    <Heading size="md" color="green.600">{highlight.title}</Heading>
                    <Text color="gray.600">{highlight.description}</Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* What is Nutrivize */}
          <Box textAlign="center" py={8}>
            <Heading size="lg" mb={6}>What is Nutrivize?</Heading>
            <Text fontSize="lg" color="gray.600" maxW="4xl" mx="auto" lineHeight="tall">
              Nutrivize is the next-generation nutrition tracking platform that combines smart food logging 
              with AI-powered meal planning. Unlike traditional calorie counters, Nutrivize learns your 
              preferences and provides personalized recommendations to help you achieve your health goals 
              more effectively.
            </Text>
          </Box>

          {/* Key Features */}
          <Box>
            <Heading size="lg" textAlign="center" mb={8}>Why Choose Nutrivize?</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Card bg={cardBg} shadow="md">
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Heading size="md" color="green.600">🤖 AI-Powered Intelligence</Heading>
                    <Text color="gray.600">
                      Nutrivize uses advanced AI to provide personalized meal suggestions, 
                      smart food recommendations, and adaptive goal tracking.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              <Card bg={cardBg} shadow="md">
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Heading size="md" color="green.600">🍽️ Restaurant Assistant</Heading>
                    <Text color="gray.600">
                      Unique to Nutrivize: Get AI-powered guidance for healthy choices 
                      when dining out at restaurants.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              <Card bg={cardBg} shadow="md">
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Heading size="md" color="green.600">📊 Smart Analytics</Heading>
                    <Text color="gray.600">
                      Nutrivize provides comprehensive nutrition analytics and progress 
                      tracking with beautiful, easy-to-understand visualizations.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              <Card bg={cardBg} shadow="md">
                <CardBody>
                  <VStack align="start" spacing={4}>
                    <Heading size="md" color="green.600">🎯 Goal-Oriented</Heading>
                    <Text color="gray.600">
                      Set personalized health goals and let Nutrivize guide you with 
                      smart recommendations and progress monitoring.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          {/* CTA Section */}
          <Box textAlign="center" py={8}>
            <Heading size="lg" mb={4}>Ready to Try Nutrivize?</Heading>
            <Text fontSize="lg" color="gray.600" mb={6}>
              Join the Nutrivize community and transform your approach to nutrition.
            </Text>
            <Button 
              colorScheme="green" 
              size="lg" 
              onClick={() => window.location.href = 'mailto:hello@nutrivize.app?subject=Nutrivize Early Access Request'}
            >
              Request Nutrivize Access
            </Button>
          </Box>
        </VStack>
      </Container>
    </>
  )
}
