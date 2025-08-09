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
  Divider,
  Icon,
  List,
  ListItem,
  ListIcon,
  Spinner,
} from '@chakra-ui/react'
import { FiTarget, FiRefreshCw, FiPlus, FiCheckCircle, FiClock, FiActivity } from 'react-icons/fi'
import api from '../../../utils/api'

interface Goal {
  id: string
  title: string
  description: string
  type: 'weight_loss' | 'weight_gain' | 'muscle_gain' | 'maintenance' | 'custom'
  target_weight?: number
  current_weight?: number
  start_weight?: number
  target_date?: string
  status: 'active' | 'completed' | 'paused'
  progress: number
  nutrition_targets: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  created_at: string
  updated_at: string
}

interface GoalsProgressDetailModalProps {
  isOpen: boolean
  onClose: () => void
}

const GoalsProgressDetailModal: React.FC<GoalsProgressDetailModalProps> = ({ isOpen, onClose }) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const fetchGoalsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/goals/')
      setGoals(response.data || [])
    } catch (err: any) {
      console.error('Error fetching goals data:', err)
      setError(err.message || 'Failed to load goals data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchGoalsData()
    }
  }, [isOpen])

  const getGoalTypeEmoji = (type: string) => {
    switch (type) {
      case 'weight_loss':
        return '📉'
      case 'weight_gain':
        return '📈'
      case 'muscle_gain':
        return '💪'
      case 'maintenance':
        return '⚖️'
      default:
        return '🎯'
    }
  }

  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case 'weight_loss':
        return 'red'
      case 'weight_gain':
        return 'green'
      case 'muscle_gain':
        return 'purple'
      case 'maintenance':
        return 'blue'
      default:
        return 'gray'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'completed':
        return 'blue'
      case 'paused':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'green'
    if (progress >= 60) return 'blue'
    if (progress >= 40) return 'yellow'
    return 'orange'
  }

  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')
  const pausedGoals = goals.filter(goal => goal.status === 'paused')

  const calculateTimeRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = new Date()
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'Past due'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return '1 day left'
    return `${diffDays} days left`
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Goals Progress</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} py={8}>
              <Spinner color="purple.400" />
              <Text>Loading your goals...</Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="1000px">
        <ModalHeader>
          <HStack spacing={3}>
            <FiTarget color="var(--chakra-colors-purple-500)" />
            <Text>Goals Progress</Text>
            <Badge colorScheme="purple" variant="solid">
              {activeGoals.length} active
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {error && (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error loading data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Goals Overview */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody textAlign="center">
                  <VStack spacing={2}>
                    <Icon as={FiTarget} color="green.500" boxSize={8} />
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {activeGoals.length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Active Goals</Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody textAlign="center">
                  <VStack spacing={2}>
                    <Icon as={FiCheckCircle} color="blue.500" boxSize={8} />
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {completedGoals.length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Completed</Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody textAlign="center">
                  <VStack spacing={2}>
                    <Icon as={FiClock} color="yellow.500" boxSize={8} />
                    <Text fontSize="2xl" fontWeight="bold" color="yellow.600">
                      {pausedGoals.length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">Paused</Text>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody textAlign="center">
                  <VStack spacing={2}>
                    <Icon as={FiActivity} color="purple.500" boxSize={8} />
                    <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                      {activeGoals.length > 0 ? 
                        Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length) : 0
                      }%
                    </Text>
                    <Text fontSize="sm" color="gray.600">Avg Progress</Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            {goals.length === 0 ? (
              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody>
                  <VStack spacing={6} py={12} textAlign="center">
                    <Icon as={FiTarget} color="gray.300" boxSize={20} />
                    <VStack spacing={3}>
                      <Heading size="lg" color="gray.600">No goals set yet</Heading>
                      <Text color="gray.500" maxW="md">
                        Setting clear, achievable goals is the first step towards better health. 
                        Create your first goal to start tracking your progress!
                      </Text>
                    </VStack>
                    
                    <Button
                      leftIcon={<FiPlus />}
                      colorScheme="purple"
                      size="lg"
                      onClick={() => {
                        // This would navigate to goals creation page
                        alert('Navigate to goals creation page')
                      }}
                    >
                      Set Your First Goal
                    </Button>
                    
                    <Box textAlign="left">
                      <Text fontWeight="bold" mb={2} color="gray.700">Popular goal types:</Text>
                      <List spacing={2} fontSize="sm" color="gray.600">
                        <ListItem>📉 Weight loss goals with target dates</ListItem>
                        <ListItem>💪 Muscle gain and strength building</ListItem>
                        <ListItem>⚖️ Weight maintenance and healthy habits</ListItem>
                        <ListItem>🎯 Custom nutrition and fitness targets</ListItem>
                      </List>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            ) : (
              <>
                {/* Active Goals */}
                {activeGoals.length > 0 && (
                  <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                    <CardBody>
                      <Heading size="md" mb={4}>
                        <HStack>
                          <Text fontSize="2xl">🎯</Text>
                          <Text>Active Goals</Text>
                          <Badge colorScheme="green" variant="outline">
                            {activeGoals.length}
                          </Badge>
                        </HStack>
                      </Heading>
                      
                      <VStack spacing={4} align="stretch">
                        {activeGoals.map((goal) => (
                          <Box
                            key={goal.id}
                            p={5}
                            borderRadius="lg"
                            bg={useColorModeValue(`${getGoalTypeColor(goal.type)}.50`, `${getGoalTypeColor(goal.type)}.900`)}
                            border="1px solid"
                            borderColor={`${getGoalTypeColor(goal.type)}.200`}
                          >
                            <HStack align="start" spacing={4}>
                              <CircularProgress 
                                value={goal.progress} 
                                size="80px" 
                                thickness="6px"
                                color={`${getProgressColor(goal.progress)}.400`}
                                trackColor={useColorModeValue('gray.100', 'gray.600')}
                              >
                                <CircularProgressLabel fontSize="sm" fontWeight="bold">
                                  {Math.round(goal.progress)}%
                                </CircularProgressLabel>
                              </CircularProgress>
                              
                              <VStack align="start" spacing={2} flex={1}>
                                <HStack justify="space-between" w="full">
                                  <HStack>
                                    <Text fontSize="lg">{getGoalTypeEmoji(goal.type)}</Text>
                                    <Text fontWeight="bold" fontSize="lg">{goal.title}</Text>
                                  </HStack>
                                  <Badge colorScheme={getStatusColor(goal.status)} variant="solid">
                                    {goal.status}
                                  </Badge>
                                </HStack>
                                
                                <Text fontSize="sm" color="gray.600">
                                  {goal.description}
                                </Text>
                                
                                {goal.target_date && (
                                  <HStack>
                                    <Icon as={FiClock} color="gray.500" boxSize={4} />
                                    <Text fontSize="sm" color="gray.600">
                                      {calculateTimeRemaining(goal.target_date)}
                                    </Text>
                                  </HStack>
                                )}
                                
                                {/* Weight Progress */}
                                {(goal.current_weight && goal.target_weight) && (
                                  <VStack align="start" spacing={1} w="full">
                                    <HStack justify="space-between" w="full" fontSize="sm">
                                      <Text color="gray.600">Weight Progress</Text>
                                      <Text fontWeight="medium">
                                        {goal.current_weight} → {goal.target_weight} lbs
                                      </Text>
                                    </HStack>
                                    <Progress 
                                      value={goal.progress} 
                                      colorScheme={getProgressColor(goal.progress)}
                                      size="sm"
                                      w="full"
                                      borderRadius="full"
                                    />
                                  </VStack>
                                )}
                                
                                {/* Nutrition Targets */}
                                <VStack align="start" spacing={1} w="full">
                                  <Text fontSize="sm" color="gray.600" fontWeight="medium">
                                    Daily Nutrition Targets
                                  </Text>
                                  <HStack spacing={4} fontSize="sm">
                                    <Text>🔥 {goal.nutrition_targets.calories} cal</Text>
                                    <Text>💪 {goal.nutrition_targets.protein}g protein</Text>
                                    <Text>🌾 {goal.nutrition_targets.carbs}g carbs</Text>
                                    <Text>🥑 {goal.nutrition_targets.fat}g fat</Text>
                                  </HStack>
                                </VStack>
                              </VStack>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                  <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                    <CardBody>
                      <Heading size="md" mb={4}>
                        <HStack>
                          <Text fontSize="2xl">🏆</Text>
                          <Text>Completed Goals</Text>
                          <Badge colorScheme="blue" variant="outline">
                            {completedGoals.length}
                          </Badge>
                        </HStack>
                      </Heading>
                      
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {completedGoals.map((goal) => (
                          <Box
                            key={goal.id}
                            p={4}
                            borderRadius="lg"
                            bg={useColorModeValue('green.50', 'green.900')}
                            border="1px solid"
                            borderColor="green.200"
                          >
                            <HStack justify="space-between" mb={2}>
                              <HStack>
                                <Text fontSize="lg">🎉</Text>
                                <Text fontWeight="bold">{goal.title}</Text>
                              </HStack>
                              <Badge colorScheme="green" variant="solid">
                                Completed
                              </Badge>
                            </HStack>
                            
                            <Text fontSize="sm" color="gray.600" mb={2}>
                              {goal.description}
                            </Text>
                            
                            <Text fontSize="xs" color="gray.500">
                              Completed on {new Date(goal.updated_at).toLocaleDateString()}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                )}

                {/* Paused Goals */}
                {pausedGoals.length > 0 && (
                  <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                    <CardBody>
                      <Heading size="md" mb={4}>
                        <HStack>
                          <Text fontSize="2xl">⏸️</Text>
                          <Text>Paused Goals</Text>
                          <Badge colorScheme="yellow" variant="outline">
                            {pausedGoals.length}
                          </Badge>
                        </HStack>
                      </Heading>
                      
                      <VStack spacing={3} align="stretch">
                        {pausedGoals.map((goal) => (
                          <Box
                            key={goal.id}
                            p={4}
                            borderRadius="lg"
                            bg={useColorModeValue('yellow.50', 'yellow.900')}
                            border="1px solid"
                            borderColor="yellow.200"
                          >
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Text fontSize="lg">{getGoalTypeEmoji(goal.type)}</Text>
                                  <Text fontWeight="bold">{goal.title}</Text>
                                </HStack>
                                <Text fontSize="sm" color="gray.600">
                                  Progress: {Math.round(goal.progress)}%
                                </Text>
                              </VStack>
                              
                              <VStack spacing={2}>
                                <Badge colorScheme="yellow" variant="solid">
                                  Paused
                                </Badge>
                                <Button size="xs" colorScheme="green" variant="outline">
                                  Resume
                                </Button>
                              </VStack>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Goal Tips */}
                <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                  <CardBody>
                    <Heading size="md" mb={4}>💡 Tips for Goal Success</Heading>
                    <List spacing={3}>
                      <ListItem display="flex" alignItems="flex-start">
                        <ListIcon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">Set specific, measurable goals</Text>
                          <Text fontSize="sm" color="gray.600">
                            Instead of "lose weight," try "lose 10 pounds in 3 months"
                          </Text>
                        </VStack>
                      </ListItem>
                      
                      <ListItem display="flex" alignItems="flex-start">
                        <ListIcon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">Track your progress regularly</Text>
                          <Text fontSize="sm" color="gray.600">
                            Log your meals, weight, and activities consistently
                          </Text>
                        </VStack>
                      </ListItem>
                      
                      <ListItem display="flex" alignItems="flex-start">
                        <ListIcon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">Adjust goals as needed</Text>
                          <Text fontSize="sm" color="gray.600">
                            It's okay to modify your goals based on your progress and circumstances
                          </Text>
                        </VStack>
                      </ListItem>
                      
                      <ListItem display="flex" alignItems="flex-start">
                        <ListIcon as={FiCheckCircle} color="green.500" mt={0.5} />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">Celebrate small wins</Text>
                          <Text fontSize="sm" color="gray.600">
                            Acknowledge your progress along the way to stay motivated
                          </Text>
                        </VStack>
                      </ListItem>
                    </List>
                  </CardBody>
                </Card>
              </>
            )}

            <HStack justify="center" pt={4}>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={fetchGoalsData}
                variant="outline"
              >
                Refresh Data
              </Button>
              
              <Button
                leftIcon={<FiPlus />}
                colorScheme="purple"
                onClick={() => {
                  // This would navigate to goals creation
                  alert('Navigate to goals creation')
                }}
              >
                {goals.length === 0 ? 'Create Your First Goal' : 'Add New Goal'}
              </Button>
            </HStack>

            <Divider />
            
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Goals help you stay motivated and track your progress towards better health
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default GoalsProgressDetailModal
