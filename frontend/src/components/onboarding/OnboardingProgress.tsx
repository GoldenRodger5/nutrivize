import {
  Box,
  HStack,
  VStack,
  Text,
  Progress,
  Circle,
  useColorModeValue
} from '@chakra-ui/react'

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  completedSteps: number[]
  stepTitles: string[]
}

export default function OnboardingProgress({ 
  currentStep, 
  totalSteps, 
  completedSteps,
  stepTitles 
}: OnboardingProgressProps) {
  const completedColor = useColorModeValue('green.500', 'green.300')
  const activeColor = useColorModeValue('blue.500', 'blue.300')
  const inactiveColor = useColorModeValue('gray.300', 'gray.600')
  const progressBg = useColorModeValue('gray.100', 'gray.700')
  
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <VStack spacing={4} w="full" maxW="600px" mx="auto" mb={8}>
      {/* Progress Bar */}
      <Box w="full">
        <Progress
          value={progressPercentage}
          colorScheme="green"
          bg={progressBg}
          borderRadius="full"
          size="lg"
          hasStripe
          isAnimated
        />
        <Text mt={2} textAlign="center" fontSize="sm" color="gray.600">
          Step {currentStep} of {totalSteps} • {Math.round(progressPercentage)}% Complete
        </Text>
      </Box>

      {/* Step Indicators */}
      <HStack spacing={2} justify="center" wrap="wrap">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isCompleted = completedSteps.includes(stepNumber)
          const isActive = stepNumber === currentStep
          const isPast = stepNumber < currentStep

          let circleColor = inactiveColor
          if (isCompleted || isPast) {
            circleColor = completedColor
          } else if (isActive) {
            circleColor = activeColor
          }

          return (
            <VStack key={stepNumber} spacing={1} align="center">
              <Circle
                size="40px"
                bg={circleColor}
                color="white"
                fontWeight="bold"
                fontSize="sm"
                border={isActive ? "3px solid" : "none"}
                borderColor={isActive ? activeColor : "transparent"}
                transition="all 0.3s"
              >
                {isCompleted ? "✓" : stepNumber}
              </Circle>
              <Text
                fontSize="xs"
                textAlign="center"
                maxW="60px"
                color={isActive ? activeColor : "gray.500"}
                fontWeight={isActive ? "bold" : "normal"}
                lineHeight="1.2"
              >
                {stepTitles[index]}
              </Text>
            </VStack>
          )
        })}
      </HStack>
    </VStack>
  )
}
