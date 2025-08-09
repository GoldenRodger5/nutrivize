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
  Divider,
  useBreakpointValue,
} from '@chakra-ui/react'
import { FiTrendingUp, FiCalendar, FiTarget, FiActivity, FiDroplet, FiZap } from 'react-icons/fi'
import { useWeeklyProgress } from '../../../hooks/useWeeklyProgress'

interface WeeklyProgressDetailModalProps {
  isOpen: boolean
  onClose: () => void
}

const WeeklyProgressDetailModal: React.FC<WeeklyProgressDetailModalProps> = ({ isOpen, onClose }) => {
  const { weeklyProgress, loading, error, refetch } = useWeeklyProgress()
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
              <FiTrendingUp />
              <Text>Weekly Progress</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} px={isMobile ? 4 : 6}>
            <VStack spacing={6}>
              <Text>Loading your weekly progress...</Text>
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
              <FiTrendingUp />
              <Text>Weekly Progress</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} px={isMobile ? 4 : 6}>
            <Alert status="error">
              <AlertIcon />
              <Box>
                <AlertTitle>Error loading progress data</AlertTitle>
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

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'green'
      case 'declining': return 'red'
      default: return 'blue'
    }
  }

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving': return 'Improving'
      case 'declining': return 'Needs Focus'
      default: return 'Stable'
    }
  }

  const getProgressColor = (value: number) => {
    if (value >= 85) return 'green'
    if (value >= 70) return 'yellow'
    return 'red'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="900px" borderRadius={isMobile ? "none" : "lg"}>
        <ModalHeader fontSize={isMobile ? "lg" : "xl"}>
          <HStack spacing={3}>
            <FiCalendar color="var(--chakra-colors-blue-500)" />
            <Text>Weekly Progress Overview</Text>
            <Badge colorScheme={getTrendColor(weeklyProgress?.trend || 'stable')} variant="solid">
              {getTrendText(weeklyProgress?.trend || 'stable')}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} px={isMobile ? 4 : 6}>
          <VStack spacing={isMobile ? 4 : 6} align="stretch">
            {/* Overall Progress Summary */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Heading size={isMobile ? "sm" : "md"} mb={4}>This Week at a Glance</Heading>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={isMobile ? 3 : 4}>
                  <Box p={isMobile ? 3 : 4} borderRadius="lg" bg={statBg}>
                    <VStack spacing={2}>
                      <FiZap color="var(--chakra-colors-orange-500)" size={isMobile ? 18 : 24} />
                      <Text fontSize={isMobile ? "lg" : "2xl"} fontWeight="bold" color="orange.600">
                        {weeklyProgress?.streak_days || 0}
                      </Text>
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" textAlign="center">
                        Day Streak
                      </Text>
                    </VStack>
                  </Box>

                  <Box p={isMobile ? 3 : 4} borderRadius="lg" bg={statBg}>
                    <VStack spacing={2}>
                      <FiTarget color="var(--chakra-colors-green-500)" size={isMobile ? 18 : 24} />
                      <Text fontSize={isMobile ? "lg" : "2xl"} fontWeight="bold" color="green.600">
                        {weeklyProgress?.goal_achievement || 0}%
                      </Text>
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" textAlign="center">
                        Goal Achievement
                      </Text>
                    </VStack>
                  </Box>

                  <Box p={isMobile ? 3 : 4} borderRadius="lg" bg={statBg}>
                    <VStack spacing={2}>
                      <FiActivity color="var(--chakra-colors-purple-500)" size={isMobile ? 18 : 24} />
                      <Text fontSize={isMobile ? "lg" : "2xl"} fontWeight="bold" color="purple.600">
                        {weeklyProgress?.meals_logged || 0}
                      </Text>
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" textAlign="center">
                        Meals Logged
                      </Text>
                    </VStack>
                  </Box>

                  <Box p={isMobile ? 3 : 4} borderRadius="lg" bg={statBg}>
                    <VStack spacing={2}>
                      <FiDroplet color="var(--chakra-colors-blue-500)" size={isMobile ? 18 : 24} />
                      <Text fontSize={isMobile ? "lg" : "2xl"} fontWeight="bold" color="blue.600">
                        {weeklyProgress?.water_intake || 0}
                      </Text>
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" textAlign="center">
                        Avg Water (oz)
                      </Text>
                    </VStack>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Detailed Progress Analysis */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <VStack spacing={isMobile ? 4 : 6}>
                  <Heading size={isMobile ? "sm" : "md"}>Weekly Performance</Heading>
                  
                  {/* Goal Achievement Progress */}
                  <Box w="full">
                    <VStack spacing={3}>
                      <HStack justify="space-between" w="full">
                        <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Goal Achievement</Text>
                        <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold">
                          {weeklyProgress?.goal_achievement || 0}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={weeklyProgress?.goal_achievement || 0}
                        colorScheme={getProgressColor(weeklyProgress?.goal_achievement || 0)}
                        size={isMobile ? "md" : "lg"}
                        w="full" 
                        borderRadius="full"
                      />
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500" textAlign="center">
                        {(weeklyProgress?.goal_achievement || 0) >= 85 ? (
                          "🎉 Excellent progress this week!"
                        ) : (
                          `${85 - (weeklyProgress?.goal_achievement || 0)}% to reach weekly target`
                        )}
                      </Text>
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Consistency Score */}
                  <Box w="full">
                    <VStack spacing={3}>
                      <HStack justify="space-between" w="full">
                        <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Consistency Score</Text>
                        <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold">
                          {weeklyProgress?.consistency_score || 0}%
                        </Text>
                      </HStack>
                      <Progress 
                        value={weeklyProgress?.consistency_score || 0}
                        colorScheme={getProgressColor(weeklyProgress?.consistency_score || 0)}
                        size={isMobile ? "md" : "lg"}
                        w="full" 
                        borderRadius="full"
                      />
                      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500" textAlign="center">
                        {(weeklyProgress?.consistency_score || 0) >= 80
                          ? "🔥 Amazing consistency!"
                          : `${80 - (weeklyProgress?.consistency_score || 0)}% improvement needed for optimal consistency`
                        }
                      </Text>
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Weekly Insights */}
                  <Box w="full">
                    <VStack spacing={3}>
                      <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Weekly Insights</Text>
                      <VStack spacing={2} align="start">
                        <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">
                          • You've maintained a {weeklyProgress?.streak_days || 0}-day tracking streak
                        </Text>
                        <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">
                          • Logged {weeklyProgress?.meals_logged || 0} meals this week
                        </Text>
                        <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">
                          • Average daily water intake: {weeklyProgress?.water_intake || 0} fl oz
                        </Text>
                      </VStack>
                    </VStack>
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

export default WeeklyProgressDetailModal
