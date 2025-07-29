import { Container, VStack, Heading, Text, Box, Button, SimpleGrid, Card, CardBody, useColorModeValue } from '@chakra-ui/react'
import SEO from '../components/SEO'

export default function AboutPage() {
  const cardBg = useColorModeValue('white', 'gray.800')
  
  const values = [
    {
      title: 'Science-Based',
      description: 'Our approach is grounded in nutritional science and evidence-based research.',
      icon: '🔬'
    },
    {
      title: 'User-Focused',
      description: 'We prioritize user experience and make nutrition tracking simple and intuitive.',
      icon: '👥'
    },
    {
      title: 'AI-Powered',
      description: 'Cutting-edge AI technology provides personalized recommendations and insights.',
      icon: '🧠'
    }
  ]

  return (
    <>
      <SEO 
        title="About Nutrivize - Your Smart Nutrition Companion"
        description="Learn about Nutrivize's mission to make nutrition tracking simple and effective. Discover our science-based approach to helping you achieve your health goals."
        keywords="about nutrivize, nutrition app story, health technology, AI nutrition assistant, nutrition tracking mission"
        url="https://nutrivize.app/about"
      />
      
      <Container maxW="container.xl" py={16} px={8}>
        <VStack spacing={16} align="stretch">
          {/* Hero Section */}
          <Box textAlign="center">
            <Heading size="2xl" mb={4} color="green.600">
              About Nutrivize
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="3xl" mx="auto">
              We're on a mission to make nutrition tracking simple, effective, and accessible for everyone.
            </Text>
          </Box>

          {/* Mission Section */}
          <Box textAlign="center" py={8}>
            <Heading size="lg" mb={6}>Our Mission</Heading>
            <Text fontSize="lg" color="gray.600" maxW="4xl" mx="auto" lineHeight="tall">
              At Nutrivize, we believe that good nutrition is the foundation of a healthy life. Our platform combines 
              cutting-edge AI technology with nutritional science to provide personalized guidance, making it easier 
              than ever to track your nutrition, plan meals, and achieve your health goals.
            </Text>
          </Box>

          {/* Values Section */}
          <Box>
            <Heading size="lg" textAlign="center" mb={8}>Our Values</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              {values.map((value, index) => (
                <Card key={index} bg={cardBg} shadow="md" textAlign="center">
                  <CardBody>
                    <VStack spacing={4}>
                      <Box fontSize="3xl">{value.icon}</Box>
                      <Heading size="md" color="green.600">{value.title}</Heading>
                      <Text color="gray.600">{value.description}</Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Story Section */}
          <Box textAlign="center" py={8}>
            <Heading size="lg" mb={6}>The Nutrivize Story</Heading>
            <Text fontSize="lg" color="gray.600" maxW="4xl" mx="auto" lineHeight="tall">
              Founded by health enthusiasts and technology experts, Nutrivize was created to solve the common 
              challenges people face when trying to maintain a healthy diet. We recognized that traditional 
              nutrition tracking was often time-consuming and overwhelming. By leveraging AI and machine learning, 
              we've created a platform that learns from your preferences and provides intelligent recommendations 
              tailored specifically to your lifestyle and goals.
            </Text>
          </Box>

          {/* CTA Section */}
          <Box textAlign="center" py={8}>
            <Heading size="lg" mb={4}>Join Our Community</Heading>
            <Text fontSize="lg" color="gray.600" mb={6}>
              We're in private beta. Contact us to request early access.
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
