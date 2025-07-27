import {
  VStack,
  Text,
  Button,
  HStack,
  Icon,
  Box,
  SimpleGrid
} from '@chakra-ui/react'
import { FaHeart, FaBrain, FaUtensils, FaChartLine } from 'react-icons/fa'
import OnboardingCard from '../OnboardingCard'

interface WelcomeStepProps {
  onNext: () => void
  onSkip: () => void
}

export default function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  const features = [
    {
      icon: FaBrain,
      title: "AI-Powered Insights",
      description: "Get personalized nutrition advice based on your unique profile"
    },
    {
      icon: FaUtensils,
      title: "Smart Meal Planning",
      description: "AI creates meal plans tailored to your goals and preferences"
    },
    {
      icon: FaChartLine,
      title: "Progress Tracking",
      description: "Monitor your nutrition goals with detailed analytics"
    },
    {
      icon: FaHeart,
      title: "Health Focus",
      description: "Achieve your wellness goals with evidence-based recommendations"
    }
  ]

  return (
    <OnboardingCard title="Welcome to Nutrivize!" icon="🎉">
      <VStack spacing={6} align="stretch">
        <Text textAlign="center" fontSize="lg" color="gray.600">
          Let's set up your personalized nutrition profile to unlock the full power of AI-driven health insights.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {features.map((feature, index) => (
            <Box
              key={index}
              p={4}
              borderRadius="lg"
              bg="green.50"
              _dark={{ bg: "green.900" }}
              textAlign="center"
            >
              <Icon as={feature.icon} size="24px" color="green.500" mb={2} />
              <Text fontWeight="bold" fontSize="sm" mb={1}>
                {feature.title}
              </Text>
              <Text fontSize="xs" color="gray.600">
                {feature.description}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <Box bg="blue.50" _dark={{ bg: "blue.900" }} p={4} borderRadius="lg">
          <Text fontSize="sm" textAlign="center" color="blue.700" _dark={{ color: "blue.200" }}>
            ⏱️ <strong>Takes just 3-5 minutes</strong><br />
            Your data is private and secure. You can update your preferences anytime.
          </Text>
        </Box>

        <HStack spacing={4} justify="center">
          <Button
            variant="outline"
            colorScheme="gray"
            onClick={onSkip}
            size="lg"
          >
            Skip for Now
          </Button>
          <Button
            colorScheme="green"
            onClick={onNext}
            size="lg"
            px={8}
          >
            Let's Get Started! 🚀
          </Button>
        </HStack>
      </VStack>
    </OnboardingCard>
  )
}
