import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  CircularProgress,
  CircularProgressLabel,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useColorModeValue,
  useBreakpointValue,
  Divider,
} from '@chakra-ui/react'
import { FiZap } from 'react-icons/fi'
import { useNutritionStreak } from '../../../hooks/useNutritionStreak'

interface NutritionStreakDetailModalProps {
  isOpen: boolean
  onClose: () => void
}

const NutritionStreakDetailModal: React.FC<NutritionStreakDetailModalProps> = ({ isOpen, onClose }) => {
  const { nutritionStreak, loading, error, refetch } = useNutritionStreak()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const statBg = useColorModeValue('gray.50', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, lg: false })

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"}>
        <ModalOverlay />
        <ModalContent borderRadius={isMobile ? "none" : "lg"}>
          <ModalHeader fontSize={isMobile ? "lg" : "xl"}>
            <HStack spacing={3}>
              <FiZap />
              <Text>Nutrition Streak</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} px={isMobile ? 4 : 6}>
            <VStack spacing={6}>
              <Text>Loading your streak data...</Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"}>
        <ModalOverlay />
        <ModalContent borderRadius={isMobile ? "none" : "lg"}>
          <ModalHeader fontSize={isMobile ? "lg" : "xl"}>
            <HStack spacing={3}>
              <FiZap />
              <Text>Nutrition Streak</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} px={isMobile ? 4 : 6}>
            <Alert status="error">
              <AlertIcon />
              <Box>
                <AlertTitle>Error loading streak data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
            <Button colorScheme="blue" onClick={refetch} mt={4}>
              Try Again
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius={isMobile ? "none" : "lg"}>
        <ModalHeader fontSize={isMobile ? "lg" : "xl"}>
          <HStack spacing={3}>
            <FiZap color="var(--chakra-colors-orange-500)" />
            <Text>Nutrition Streak</Text>
            <Badge colorScheme="orange" variant="solid">
              {nutritionStreak?.current_streak || 0} days
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} px={isMobile ? 4 : 6}>
          <VStack spacing={isMobile ? 4 : 6} align="stretch">
            {/* Current Streak Display */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <VStack spacing={isMobile ? 3 : 4}>
                  <Heading size={isMobile ? "sm" : "md"}>Current Streak</Heading>
                  <CircularProgress 
                    value={Math.min((nutritionStreak?.current_streak || 0) / (nutritionStreak?.next_milestone || 7) * 100, 100)}
                    size={isMobile ? "120px" : "180px"}
                    thickness={isMobile ? "8px" : "12px"}
                    color="orange.400"
                    capIsRound
                  >
                    <CircularProgressLabel>
                      <VStack spacing={0}>
                        <Text fontSize={isMobile ? "2xl" : "4xl"} fontWeight="bold" color="orange.600">
                          {nutritionStreak?.current_streak || 0}
                        </Text>
                        <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">days</Text>
                      </VStack>
                    </CircularProgressLabel>
                  </CircularProgress>

                  {/* Quick Stats */}
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={isMobile ? 3 : 4} w="full">
                    <Box p={isMobile ? 3 : 4} borderRadius="lg" bg={statBg} textAlign="center">
                      <Text fontSize={isMobile ? "lg" : "xl"} fontWeight="bold" color="purple.600">
                        {nutritionStreak?.best_streak || 0}
                      </Text>
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">Best Streak</Text>
                    </Box>
                    
                    <Box p={isMobile ? 3 : 4} borderRadius="lg" bg={statBg} textAlign="center">
                      <Text fontSize={isMobile ? "lg" : "xl"} fontWeight="bold" color="blue.600">
                        {nutritionStreak?.next_milestone || 7}
                      </Text>
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">Next Goal</Text>
                    </Box>

                    <Box p={isMobile ? 3 : 4} borderRadius="lg" bg={statBg} textAlign="center" gridColumn={{ base: "1 / -1", md: "auto" }}>
                      <Text fontSize={isMobile ? "lg" : "xl"} fontWeight="bold" color="green.600">
                        {Math.round((nutritionStreak?.progress_to_milestone || 0))}%
                      </Text>
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">Progress</Text>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Progress to Next Milestone */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <VStack spacing={isMobile ? 3 : 4}>
                  <Heading size={isMobile ? "sm" : "md"}>Next Milestone</Heading>
                  <Text fontSize={isMobile ? "sm" : "md"} textAlign="center" color="gray.600">
                    {Math.max(0, (nutritionStreak?.next_milestone || 7) - (nutritionStreak?.current_streak || 0))} more days to reach your {nutritionStreak?.next_milestone || 7}-day goal!
                  </Text>
                  <Progress 
                    value={nutritionStreak?.progress_to_milestone || 0}
                    size={isMobile ? "md" : "lg"}
                    colorScheme="orange"
                    w="full" 
                    borderRadius="full"
                  />
                  <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500" textAlign="center">
                    {nutritionStreak?.progress_to_milestone || 0}% complete
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Tips for Maintaining Streak */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <VStack spacing={isMobile ? 3 : 4} align="start">
                  <Heading size={isMobile ? "sm" : "md"}>Keep Your Streak Going</Heading>
                  <VStack align="start" spacing={2}>
                    <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">
                      • Log at least one meal each day to maintain your streak
                    </Text>
                    <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">
                      • Set daily reminders to track your nutrition
                    </Text>
                    <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">
                      • Even small meals count - consistency is key!
                    </Text>
                    <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">
                      • Use the quick log buttons for faster entry
                    </Text>
                  </VStack>

                  <Divider />

                  <Box w="full" textAlign="center">
                    <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold" color="orange.600" mb={2}>
                      {(nutritionStreak?.current_streak || 0) === 0 && "🌱 Ready to start your journey?"}
                      {(nutritionStreak?.current_streak || 0) >= 1 && (nutritionStreak?.current_streak || 0) < 3 && "🚀 Great start! Keep building!"}
                      {(nutritionStreak?.current_streak || 0) >= 3 && (nutritionStreak?.current_streak || 0) < 7 && "💪 You're building momentum!"}
                      {(nutritionStreak?.current_streak || 0) >= 7 && (nutritionStreak?.current_streak || 0) < 14 && "🔥 One week down! You're on fire!"}
                      {(nutritionStreak?.current_streak || 0) >= 14 && (nutritionStreak?.current_streak || 0) < 30 && "⭐ Two weeks strong! Amazing consistency!"}
                      {(nutritionStreak?.current_streak || 0) >= 30 && "🏆 You're a nutrition tracking legend!"}
                    </Text>
                    <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">
                      {(nutritionStreak?.current_streak || 0) === 0 && "Log your first meal today and start building a healthy habit!"}
                      {(nutritionStreak?.current_streak || 0) >= 1 && (nutritionStreak?.current_streak || 0) < 7 && "Every day you log brings you closer to forming a lasting habit."}
                      {(nutritionStreak?.current_streak || 0) >= 7 && (nutritionStreak?.current_streak || 0) < 30 && "You've proven you can stay consistent. Keep up the great work!"}
                      {(nutritionStreak?.current_streak || 0) >= 30 && "Your dedication to tracking your nutrition is truly inspiring!"}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default NutritionStreakDetailModal