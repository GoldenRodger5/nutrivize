import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardHeader,
  CardBody,
  Alert,
  AlertIcon,
  Badge,
  SimpleGrid,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  useToast,
  useColorModeValue,
  Spinner,
  Avatar,
  Divider,
  Progress,
  List,
  ListItem,
  ListIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon
} from '@chakra-ui/react'
import { 
  CheckCircleIcon,
  InfoIcon,
  ChatIcon,
  CalendarIcon,
  StarIcon,
  EditIcon,
  AddIcon
} from '@chakra-ui/icons'
import { 
  MdFitnessCenter,
  MdRestaurant,
  MdSchedule,
  MdLightbulb
} from 'react-icons/md'
import api from '../utils/api'

interface CoachingSession {
  id: string
  date: string
  duration: number
  focus_areas: string[]
  goals_discussed: string[]
  recommendations: string[]
  homework_assigned: string[]
  next_session_date?: string
  notes: string
  coach_rating?: number
}

interface PersonalizedPlan {
  id: string
  name: string
  duration_weeks: number
  weekly_goals: {
    week: number
    calorie_target: number
    protein_target: number
    exercise_minutes: number
    hydration_glasses: number
    focus_areas: string[]
  }[]
  meal_suggestions: {
    meal_type: string
    suggested_foods: string[]
    preparation_tips: string[]
  }[]
  progress_milestones: {
    week: number
    milestone: string
    reward: string
  }[]
}

interface CoachingRecommendation {
  id: string
  type: 'nutrition' | 'exercise' | 'lifestyle'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  due_date?: Date
  resources?: string[]
  difficulty?: string
  estimated_impact?: number
  time_to_implement?: string
  resources_needed?: string[]
  success_criteria?: string
  tracking_method?: string
  completed?: boolean
}

const PersonalizedNutritionCoaching: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<PersonalizedPlan | null>(null)
  const [recommendations, setRecommendations] = useState<CoachingRecommendation[]>([])
  const [sessions, setSessions] = useState<CoachingSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [newQuestion, setNewQuestion] = useState('')
  const [questionCategory, setQuestionCategory] = useState('')
  
  const toast = useToast()
  const { isOpen: isQuestionOpen, onOpen: onQuestionOpen, onClose: onQuestionClose } = useDisclosure()
  
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    fetchCoachingData()
  }, [])

    const fetchCoachingData = async () => {
    setIsLoading(true)
    try {
      const [plansRes, sessionsRes, recommendationsRes] = await Promise.all([
        api.get('/ai/coaching/plans'),
        api.get('/ai/coaching/sessions'),
        api.get('/ai/coaching/recommendations')
      ])
      
      setCurrentPlan(plansRes.data.current_plan)
      setSessions(sessionsRes.data)
      setRecommendations(recommendationsRes.data)
    } catch (error) {
      console.error('Error fetching coaching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load coaching data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const askCoachQuestion = async () => {
    if (!newQuestion.trim()) return
    
    try {
      await api.post('/ai/coaching/ask', {
        question: newQuestion,
        category: questionCategory,
        context: {
          current_plan: currentPlan,
          recent_sessions: sessions.slice(-5)
        }
      })
      
      toast({
        title: 'Question submitted',
        description: 'Your coach will respond within 24 hours',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      setNewQuestion('')
      setQuestionCategory('')
      onQuestionClose()
    } catch (error: any) {
      console.error('Question submission error:', error)
      toast({
        title: 'Failed to submit question',
        description: error.response?.data?.detail || 'Could not submit question',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const completeRecommendation = async (recommendationId: string) => {
    try {
      await api.post(`/ai/coaching/recommendations/${recommendationId}/complete`)
      
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, completed: true } 
            : rec
        )
      )
      
      toast({
        title: 'Recommendation completed',
        description: 'Great job! Your progress has been updated',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error: any) {
      console.error('Complete recommendation error:', error)
      toast({
        title: 'Failed to update progress',
        description: error.response?.data?.detail || 'Could not update recommendation',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red'
      case 'medium': return 'orange'
      case 'low': return 'green'
      default: return 'gray'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'challenging': return 'red'
      case 'moderate': return 'orange'
      case 'easy': return 'green'
      default: return 'gray'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nutrition': return MdRestaurant
      case 'exercise': return MdFitnessCenter
      case 'habit': return MdSchedule
      case 'mindset': return MdLightbulb
      default: return InfoIcon
    }
  }

  const renderRecommendationCard = (rec: CoachingRecommendation) => (
    <Card key={rec.id} variant="outline" borderColor={borderColor}>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <HStack>
            <Icon as={getTypeIcon(rec.type)} boxSize={5} />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">{rec.title}</Text>
              <HStack spacing={2}>
                <Badge colorScheme={getPriorityColor(rec.priority)}>
                  {rec.priority} priority
                </Badge>
                <Badge colorScheme={getDifficultyColor(rec.difficulty || 'medium')}>
                  {rec.difficulty || 'Medium'}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
          <VStack align="end" spacing={1}>
            <Text fontSize="sm" color="gray.600">
              Impact: {rec.estimated_impact}/10
            </Text>
            <Text fontSize="xs" color="gray.500">
              {rec.time_to_implement}
            </Text>
          </VStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="start" spacing={3}>
          <Text fontSize="sm">{rec.description}</Text>
          
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>Resources needed:</Text>
            <Text fontSize="xs" color="gray.600">
              {rec.resources_needed?.join(', ') || 'None required'}
            </Text>
          </Box>
          
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>Success criteria:</Text>
            <Text fontSize="xs" color="gray.600">
              {rec.success_criteria}
            </Text>
          </Box>
          
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => completeRecommendation(rec.id)}
            >
              Mark Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast({
                  title: 'More details',
                  description: `Track progress using: ${rec.tracking_method}`,
                  status: 'info',
                  duration: 5000,
                  isClosable: true
                })
              }}
            >
              More Details
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )

  const renderCurrentPlan = () => {
    if (!currentPlan) return null
    
    return (
      <Card variant="outline" borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold">{currentPlan.name}</Text>
              <Text fontSize="sm" color="gray.600">
                {currentPlan.duration_weeks} week program
              </Text>
            </VStack>
            <Button leftIcon={<EditIcon />} size="sm" variant="outline">
              Customize
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2}>This Week's Goals</Text>
              {currentPlan.weekly_goals.slice(0, 1).map(goal => (
                <SimpleGrid key={goal.week} columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">Calories</Text>
                    <Text fontSize="2xl">{goal.calorie_target}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">Protein</Text>
                    <Text fontSize="2xl">{goal.protein_target}g</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">Exercise</Text>
                    <Text fontSize="2xl">{goal.exercise_minutes}min</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">Hydration</Text>
                    <Text fontSize="2xl">{goal.hydration_glasses} glasses</Text>
                  </Box>
                </SimpleGrid>
              ))}
            </Box>
            
            <Divider />
            
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={2}>Meal Suggestions</Text>
              {currentPlan.meal_suggestions.slice(0, 3).map((meal, index) => (
                <Box key={index} mb={2}>
                  <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                    {meal.meal_type}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {meal.suggested_foods.join(', ')}
                  </Text>
                </Box>
              ))}
            </Box>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading your coaching dashboard...</Text>
      </Box>
    )
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <HStack>
                <Avatar size="sm" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold">Your Nutrition Coach</Text>
                  <Text color="gray.600">Personalized guidance for your health journey</Text>
                </VStack>
              </HStack>
            </VStack>
            <HStack>
              <Button
                leftIcon={<ChatIcon />}
                colorScheme="blue"
                onClick={onQuestionOpen}
              >
                Ask Coach
              </Button>
              <Button
                leftIcon={<EditIcon />}
                variant="outline"
                onClick={() => {
                  toast({
                    title: 'Profile Settings',
                    description: 'Profile settings coming soon!',
                    status: 'info',
                    duration: 3000,
                    isClosable: true,
                  })
                }}
              >
                Edit Profile
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Navigation */}
        <HStack spacing={4} mb={4}>
          <Button
            variant={activeTab === 'dashboard' ? 'solid' : 'ghost'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'recommendations' ? 'solid' : 'ghost'}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations
          </Button>
          <Button
            variant={activeTab === 'sessions' ? 'solid' : 'ghost'}
            onClick={() => setActiveTab('sessions')}
          >
            Sessions
          </Button>
        </HStack>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            <VStack spacing={4} align="stretch">
              {renderCurrentPlan()}
              
              <Card variant="outline" borderColor={borderColor}>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">Quick Stats</Text>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                        {sessions.length}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Sessions</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">
                        {recommendations.filter(r => r.completed).length}
                      </Text>
                      <Text fontSize="sm" color="gray.600">Completed</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                        {recommendations.filter(r => r.priority === 'high').length}
                      </Text>
                      <Text fontSize="sm" color="gray.600">High Priority</Text>
                    </Box>
                    <Box textAlign="center">
                      <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                        85%
                      </Text>
                      <Text fontSize="sm" color="gray.600">Success Rate</Text>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            </VStack>
            
            <VStack spacing={4} align="stretch">
              <Card variant="outline" borderColor={borderColor}>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">This Week's Focus</Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Alert status="info">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Focus on increasing your protein intake and staying hydrated
                      </Text>
                    </Alert>
                    <Progress value={65} colorScheme="blue" />
                    <Text fontSize="sm" color="gray.600">
                      You're 65% towards your weekly goal
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card variant="outline" borderColor={borderColor}>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">Upcoming Milestones</Text>
                </CardHeader>
                <CardBody>
                  <VStack spacing={2} align="stretch">
                    {currentPlan?.progress_milestones.slice(0, 3).map((milestone, index) => (
                      <HStack key={index} justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            Week {milestone.week}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {milestone.milestone}
                          </Text>
                        </VStack>
                        <Badge colorScheme="green">
                          {milestone.reward}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </SimpleGrid>
        )}

        {activeTab === 'recommendations' && (
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                Active Recommendations ({recommendations.length})
              </Text>
              <Button leftIcon={<AddIcon />} size="sm" variant="outline">
                Request Custom
              </Button>
            </HStack>
            
            {recommendations.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                No active recommendations. Great job staying on track!
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                {recommendations.map(renderRecommendationCard)}
              </VStack>
            )}
          </VStack>
        )}

        {activeTab === 'sessions' && (
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">
                Coaching Sessions
              </Text>
              <Button leftIcon={<CalendarIcon />} colorScheme="blue">
                Schedule Next Session
              </Button>
            </HStack>
            
            {sessions.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                No sessions yet. Schedule your first coaching session to get started!
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                {sessions.map(session => (
                  <Card key={session.id} variant="outline" borderColor={borderColor}>
                    <CardHeader>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">
                            {new Date(session.date).toLocaleDateString()}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {session.duration} minutes
                          </Text>
                        </VStack>
                        {session.coach_rating && (
                          <HStack>
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                color={i < session.coach_rating! ? 'yellow.500' : 'gray.300'}
                                boxSize={4}
                              />
                            ))}
                          </HStack>
                        )}
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={1}>
                            Focus Areas:
                          </Text>
                          <HStack spacing={2}>
                            {session.focus_areas.map((area, index) => (
                              <Badge key={index} colorScheme="blue">
                                {area}
                              </Badge>
                            ))}
                          </HStack>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={1}>
                            Key Recommendations:
                          </Text>
                          <List spacing={1}>
                            {session.recommendations.slice(0, 3).map((rec, index) => (
                              <ListItem key={index} fontSize="sm">
                                <ListIcon as={CheckCircleIcon} color="green.500" />
                                {rec}
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            )}
          </VStack>
        )}

        {/* Ask Coach Modal */}
        <Modal isOpen={isQuestionOpen} onClose={onQuestionClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Ask Your Coach</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={questionCategory}
                    onChange={(e) => setQuestionCategory(e.target.value)}
                    placeholder="Select category"
                  >
                    <option value="nutrition">Nutrition</option>
                    <option value="exercise">Exercise</option>
                    <option value="meal_planning">Meal Planning</option>
                    <option value="motivation">Motivation</option>
                    <option value="general">General</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Your Question</FormLabel>
                  <Textarea
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="What would you like to ask your coach?"
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onQuestionClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={askCoachQuestion}>
                Submit Question
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  )
}

export default PersonalizedNutritionCoaching
