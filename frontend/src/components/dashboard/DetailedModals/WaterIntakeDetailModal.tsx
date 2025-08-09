import React, { useState, useEffect } from 'react'
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
  useBreakpointValue,
  Divider,
  Icon,
  List,
  ListItem,
  Spinner,
} from '@chakra-ui/react'
import { FiDroplet, FiTrendingUp, FiTarget, FiRefreshCw, FiPlus, FiClock } from 'react-icons/fi'
import api from '../../../utils/api'

interface WaterLog {
  id: string
  amount: number
  unit: string
  logged_at: string
  notes?: string
}

interface WaterIntakeDetailModalProps {
  isOpen: boolean
  onClose: () => void
}

const WaterIntakeDetailModal: React.FC<WaterIntakeDetailModalProps> = ({ isOpen, onClose }) => {
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalToday, setTotalToday] = useState(0)
  const [goal] = useState(64) // Default daily goal in fl oz
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const statBg = useColorModeValue('gray.50', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, lg: false })

  const fetchWaterData = async () => {
    try {
      setLoading(true)
      setError(null)
      const today = new Date().toISOString().split('T')[0]
      const response = await api.get(`/water-logs/?date=${today}`)
      const logs = response.data || []
      
      setWaterLogs(logs)
      const total = logs.reduce((sum: number, log: any) => sum + (log.amount_fl_oz || 0), 0)
      setTotalToday(total)
    } catch (err: any) {
      console.error('Error fetching water data:', err)
      setError(err.message || 'Failed to load water intake data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchWaterData()
    }
  }, [isOpen])

  const getHydrationLevel = (percentage: number) => {
    if (percentage >= 100) return { level: 'Excellent', color: 'green', emoji: '💧' }
    if (percentage >= 75) return { level: 'Good', color: 'blue', emoji: '💙' }
    if (percentage >= 50) return { level: 'Moderate', color: 'yellow', emoji: '🟡' }
    return { level: 'Low', color: 'red', emoji: '🔴' }
  }

  const percentage = (totalToday / goal) * 100
  const hydrationInfo = getHydrationLevel(percentage)
  const remaining = Math.max(0, goal - totalToday)

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"}>
        <ModalOverlay />
        <ModalContent borderRadius={isMobile ? "none" : "lg"}>
          <ModalHeader fontSize={isMobile ? "lg" : "xl"}>Water Intake Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody px={isMobile ? 4 : 6}>
            <VStack spacing={4} py={8}>
              <Spinner color="blue.400" />
              <Text>Loading your hydration data...</Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW={isMobile ? "100%" : "800px"} borderRadius={isMobile ? "none" : "lg"}>
        <ModalHeader fontSize={isMobile ? "lg" : "xl"}>
          <HStack spacing={3}>
            <FiDroplet color="var(--chakra-colors-blue-500)" />
            <Text>Daily Water Intake</Text>
            <Badge colorScheme={hydrationInfo.color} variant="solid" fontSize={isMobile ? "xs" : "sm"}>
              {hydrationInfo.emoji} {hydrationInfo.level}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} px={isMobile ? 4 : 6}>
          <VStack spacing={isMobile ? 4 : 6} align="stretch">
            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error loading data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Today's Progress */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <VStack spacing={6}>
                  <HStack spacing={8} w="full" justify="center">
                    <VStack spacing={4}>
                      <Box textAlign="center">
                        <Text fontSize="4xl" fontWeight="bold" color="blue.600">
                          {Math.round(totalToday * 10) / 10}
                        </Text>
                        <Text fontSize="lg" color="gray.600">
                          fl oz today
                        </Text>
                      </Box>
                      
                      <Box textAlign="center">
                        <Text fontSize="2xl" fontWeight="bold" color={`${hydrationInfo.color}.600`}>
                          {Math.round(percentage)}%
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          of daily goal
                        </Text>
                      </Box>
                    </VStack>
                    
                    <VStack spacing={4} align="start">
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Icon as={FiTarget} color="blue.500" />
                          <Text fontWeight="bold">Daily Goal</Text>
                        </HStack>
                        <Text fontSize="xl" fontWeight="bold" color="blue.600">
                          {goal} fl oz
                        </Text>
                      </VStack>

                      {remaining > 0 && (
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Icon as={FiDroplet} color="gray.500" />
                            <Text fontWeight="bold">Remaining</Text>
                          </HStack>
                          <Text fontSize="xl" fontWeight="bold" color="gray.600">
                            {Math.round(remaining * 10) / 10} fl oz
                          </Text>
                        </VStack>
                      )}

                      <Button
                        leftIcon={<FiPlus />}
                        colorScheme="blue"
                        size="sm"
                        onClick={() => {
                          // This would open water logging modal
                          alert('Water logging modal would open here')
                        }}
                      >
                        Log Water
                      </Button>
                    </VStack>
                  </HStack>
                  
                  <Box w="full">
                    <HStack justify="space-between" mb={2}>
                      <Text fontSize="sm" color="gray.600">
                        Progress to daily goal
                      </Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {Math.round(percentage)}%
                      </Text>
                    </HStack>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      colorScheme={hydrationInfo.color}
                      size="lg"
                      borderRadius="full"
                    />
                    {percentage >= 100 && (
                      <Text fontSize="sm" color="green.600" textAlign="center" mt={2} fontWeight="bold">
                        🎉 Daily goal achieved! Great hydration!
                      </Text>
                    )}
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Hydration Stats */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody textAlign="center">
                  <VStack spacing={2}>
                    <Icon as={FiDroplet} color="blue.500" boxSize={8} />
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {waterLogs.length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Times logged today
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody textAlign="center">
                  <VStack spacing={2}>
                    <Icon as={FiTrendingUp} color="green.500" boxSize={8} />
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {waterLogs.length > 0 ? Math.round((totalToday / waterLogs.length) * 10) / 10 : 0}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Average per log (fl oz)
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody textAlign="center">
                  <VStack spacing={2}>
                    <Icon as={FiClock} color="purple.500" boxSize={8} />
                    <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                      {waterLogs.length > 0 ? 
                        new Date(waterLogs[waterLogs.length - 1].logged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                        '--:--'
                      }
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Last logged
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {/* Today's Water Logs */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Heading size="md" mb={4}>Today's Water Intake Log</Heading>
                {waterLogs.length > 0 ? (
                  <VStack spacing={3} align="stretch">
                    {waterLogs.map((log, index) => (
                      <Box 
                        key={log.id || index}
                        p={3}
                        borderRadius="lg"
                        bg={statBg}
                        border="1px solid"
                        borderColor={borderColor}
                      >
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Icon as={FiDroplet} color="blue.500" />
                              <Text fontWeight="medium">
                                {log.amount} {log.unit || 'fl oz'}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {new Date(log.logged_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                            {log.notes && (
                              <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                {log.notes}
                              </Text>
                            )}
                          </VStack>
                          <Badge colorScheme="blue" variant="outline">
                            {Math.round(((log.amount || 0) / goal) * 100)}% of goal
                          </Badge>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Box textAlign="center" py={8}>
                    <Icon as={FiDroplet} color="gray.300" boxSize={12} mb={4} />
                    <Text color="gray.500" mb={4}>
                      No water intake logged today
                    </Text>
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="blue"
                      onClick={() => {
                        // This would open water logging modal
                        alert('Water logging modal would open here')
                      }}
                    >
                      Log Your First Water Intake
                    </Button>
                  </Box>
                )}
              </CardBody>
            </Card>

            {/* Hydration Tips */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Heading size="md" mb={4}>💡 Hydration Tips</Heading>
                <List spacing={3}>
                  <ListItem>
                    <HStack align="start">
                      <Text>🌅</Text>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Start your day with water</Text>
                        <Text fontSize="sm" color="gray.600">
                          Drink a glass of water when you wake up to kickstart hydration
                        </Text>
                      </VStack>
                    </HStack>
                  </ListItem>
                  
                  <ListItem>
                    <HStack align="start">
                      <Text>⏰</Text>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Set reminders</Text>
                        <Text fontSize="sm" color="gray.600">
                          Use phone alarms or apps to remind you to drink water regularly
                        </Text>
                      </VStack>
                    </HStack>
                  </ListItem>
                  
                  <ListItem>
                    <HStack align="start">
                      <Text>🍋</Text>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Add flavor naturally</Text>
                        <Text fontSize="sm" color="gray.600">
                          Try lemon, cucumber, or mint to make water more appealing
                        </Text>
                      </VStack>
                    </HStack>
                  </ListItem>
                  
                  <ListItem>
                    <HStack align="start">
                      <Text>🏃‍♂️</Text>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">Drink more during exercise</Text>
                        <Text fontSize="sm" color="gray.600">
                          Increase intake before, during, and after physical activity
                        </Text>
                      </VStack>
                    </HStack>
                  </ListItem>
                </List>
              </CardBody>
            </Card>

            {/* Hydration Status Alert */}
            {percentage < 50 && (
              <Alert status="warning" borderRadius="lg">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Low Hydration Alert</Text>
                  <Text fontSize="sm">
                    You're only at {Math.round(percentage)}% of your daily water goal. 
                    Try to drink more water throughout the day for optimal health.
                  </Text>
                </VStack>
              </Alert>
            )}

            {percentage >= 100 && (
              <Alert status="success" borderRadius="lg">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">🎉 Excellent Hydration!</Text>
                  <Text fontSize="sm">
                    You've achieved your daily water intake goal! Your body thanks you for staying well-hydrated.
                  </Text>
                </VStack>
              </Alert>
            )}

            <HStack justify="center" pt={4}>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={fetchWaterData}
                variant="outline"
              >
                Refresh Data
              </Button>
            </HStack>

            <Divider />
            
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Daily water intake goal: {goal} fl oz (approximately 8 cups)
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default WaterIntakeDetailModal
