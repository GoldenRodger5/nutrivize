import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  useColorModeValue,
  useBreakpointValue,
  SimpleGrid,
  CircularProgress,
  CircularProgressLabel,
  Badge,
  Button,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Alert,
  AlertIcon,
  AlertDescription,
  Grid
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  FiActivity, 
  FiTarget, 
  FiHeart, 
  FiZap,
  FiCalendar,
  FiSun
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

// Import hooks - correct paths
import { useAICoaching, useSmartNutrition, useHealthScore } from '../hooks/useAIDashboard'
import { useEnhancedHealthScore } from '../hooks/useEnhancedAIHealth'

// Import modals - fix import syntax
import TodaysNutritionDetailModal from '../components/nutrition/TodaysNutritionDetailModal'
import WaterLogModal from '../components/nutrition/WaterLogModal'
import WeightLogModal from '../components/nutrition/WeightLogModal'
import FoodLogModal from '../components/food/FoodLogModal'

// Import AI components
import { AIResponseFormatter } from '../components/dashboard/AIResponseFormatter'

const MotionBox = motion(Box)

// Clean, simple nutrition component
const NutritionCard = ({ 
  nutrition, 
  loading, 
  error, 
  onOpenDetail, 
  isMobile 
}: {
  nutrition: any
  loading: boolean
  error: any
  onOpenDetail: () => void
  isMobile: boolean | undefined
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const trackColor = useColorModeValue('gray.100', 'gray.700')

  if (loading) return <Spinner size="md" />
  if (error || !nutrition) return null

  const getNutritionColor = (percentage: number) => {
    if (percentage >= 80) return 'green'
    if (percentage >= 60) return 'yellow'
    return 'red'
  }

  return (
    <Card bg={cardBg} borderRadius="xl" boxShadow="md">
      <CardHeader>
        <HStack justify="space-between">
          <HStack>
            <Icon as={FiTarget} color="green.500" />
            <Text fontWeight="bold" color="green.600">Today's Nutrition</Text>
          </HStack>
          <Badge colorScheme="green" variant="solid">Live Tracking</Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4}>
          {/* Calories */}
          <CircularProgress 
            value={nutrition.calories.percentage} 
            size={isMobile ? "120px" : "160px"} 
            thickness="12px"
            color={getNutritionColor(nutrition.calories.percentage) + '.400'}
            trackColor={trackColor}
          >
            <CircularProgressLabel>
              <VStack spacing={0}>
                <Text fontSize={isMobile ? "xl" : "2xl"} fontWeight="bold">
                  {nutrition.calories.current}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  / {nutrition.calories.target}
                </Text>
                <Text fontSize="xs" color="gray.400">calories</Text>
              </VStack>
            </CircularProgressLabel>
          </CircularProgress>

          {/* Macros */}
          <SimpleGrid columns={3} spacing={4} w="full">
            {['protein', 'carbs', 'fat'].map((macro) => {
              const data = nutrition[macro]
              return (
                <VStack spacing={2} key={macro}>
                  <CircularProgress 
                    value={data.percentage} 
                    size="60px" 
                    thickness="8px"
                    color={getNutritionColor(data.percentage) + '.400'}
                    trackColor={trackColor}
                  >
                    <CircularProgressLabel fontSize="sm" fontWeight="bold">
                      {data.percentage}%
                    </CircularProgressLabel>
                  </CircularProgress>
                  <VStack spacing={0}>
                    <Text fontSize="sm" fontWeight="bold" textTransform="capitalize">
                      {macro}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {data.current}g
                    </Text>
                  </VStack>
                </VStack>
              )
            })}
          </SimpleGrid>

          <Button onClick={onOpenDetail} size="sm" variant="outline" w="full">
            View Details
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}

// Clean health score component
const HealthScoreCard = ({ 
  healthScore, 
  enhancedHealthScore, 
  basicLoading, 
  enhancedLoading, 
  basicError, 
  enhancedError, 
  onOpenDetail,
  isMobile 
}: {
  healthScore: any
  enhancedHealthScore: any
  basicLoading: boolean
  enhancedLoading: boolean
  basicError: any
  enhancedError: any
  onOpenDetail: () => void
  isMobile: boolean | undefined
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const trackColor = useColorModeValue('gray.100', 'gray.700')

  const scoreData = enhancedHealthScore || healthScore
  const loading = basicLoading || enhancedLoading
  const error = basicError && enhancedError

  if (loading) return <Spinner size="md" />
  if (error || !scoreData) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'red'
  }

  return (
    <Card bg={cardBg} borderRadius="xl" boxShadow="md">
      <CardHeader>
        <HStack justify="space-between">
          <HStack>
            <Icon as={FiHeart} color="red.500" />
            <Text fontWeight="bold" color="red.600">Health Score</Text>
          </HStack>
          <Badge colorScheme={getScoreColor(scoreData.overall_score)} variant="solid">
            {scoreData.trend === 'improving' ? '📈' : '📉'} {scoreData.trend}
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4}>
          <CircularProgress 
            value={scoreData.overall_score} 
            size={isMobile ? "120px" : "160px"} 
            thickness="12px"
            color={getScoreColor(scoreData.overall_score) + '.400'}
            trackColor={trackColor}
          >
            <CircularProgressLabel>
              <VStack spacing={0}>
                <Text fontSize={isMobile ? "2xl" : "3xl"} fontWeight="bold" color={getScoreColor(scoreData.overall_score) + '.600'}>
                  {scoreData.overall_score}
                </Text>
                <Text fontSize="xs" color="gray.500">/100</Text>
              </VStack>
            </CircularProgressLabel>
          </CircularProgress>

          <Button onClick={onOpenDetail} size="sm" variant="outline" w="full">
            View Analysis
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}

// Clean AI coaching component
const AICoachingCard = ({ 
  coaching, 
  loading, 
  error, 
  isMobile 
}: {
  coaching: any
  loading: boolean
  error: any
  isMobile: boolean | undefined
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const bgColor = useColorModeValue('purple.50', 'purple.900')

  if (loading) return <Spinner size="md" />
  if (error || !coaching) return null

  return (
    <Card bg={cardBg} borderRadius="xl" boxShadow="md">
      <CardHeader>
        <HStack justify="space-between">
          <HStack>
            <Icon as={FiActivity} color="purple.500" />
            <Text fontWeight="bold" color="purple.600">AI Health Coach</Text>
          </HStack>
          <Badge colorScheme="green" variant="solid">
            {coaching.aiConfidence}% Confidence
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Box p={4} borderRadius="lg" bg={bgColor}>
            <Text fontWeight="bold" color="purple.600" mb={2}>💡 Today's Insight</Text>
            <AIResponseFormatter 
              content={coaching.personalizedInsight}
              isMobile={isMobile}
              fontSize="sm"
            />
          </Box>

          {coaching.urgentAction && (
            <Alert status="warning" borderRadius="lg" size="sm">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                {coaching.urgentAction}
              </AlertDescription>
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

// Clean quick actions component
const QuickActionsCard = ({ 
  onScanFood, 
  onMealPlan, 
  onHealthReport, 
  onAskAI, 
  isMobile 
}: {
  onScanFood: () => void
  onMealPlan: () => void
  onHealthReport: () => void
  onAskAI: () => void
  isMobile: boolean | undefined
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')

  const actions = [
    { label: 'Scan Food', icon: '📱', colorScheme: 'purple', onClick: onScanFood },
    { label: 'Meal Plan', icon: '🍽️', colorScheme: 'blue', onClick: onMealPlan },
    { label: 'Health Report', icon: '📊', colorScheme: 'green', onClick: onHealthReport },
    { label: 'Ask AI', icon: '🤖', colorScheme: 'orange', onClick: onAskAI }
  ]

  return (
    <Card bg={cardBg} borderRadius="xl" boxShadow="md">
      <CardHeader>
        <HStack>
          <Icon as={FiZap} color="orange.500" />
          <Text fontWeight="bold" color="orange.600">Quick Actions</Text>
        </HStack>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={2} spacing={3}>
          {actions.map((action, index) => (
            <Button 
              key={index}
              colorScheme={action.colorScheme} 
              variant="outline" 
              size={isMobile ? "sm" : "md"} 
              onClick={action.onClick}
              h="60px"
              flexDirection="column"
            >
              <VStack spacing={1}>
                <Text fontSize="lg">{action.icon}</Text>
                <Text fontSize="xs" fontWeight="bold">
                  {action.label}
                </Text>
              </VStack>
            </Button>
          ))}
        </SimpleGrid>
      </CardBody>
    </Card>
  )
}

// Clean quick logging component
const QuickLoggingCard = ({ 
  onLogFood, 
  onLogWater, 
  onLogWeight, 
  isMobile 
}: {
  onLogFood: () => void
  onLogWater: () => void
  onLogWeight: () => void
  isMobile: boolean | undefined
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')

  return (
    <Card bg={cardBg} borderRadius="xl" boxShadow="md">
      <CardHeader>
        <HStack>
          <Icon as={FiCalendar} color="blue.500" />
          <Text fontWeight="bold" color="blue.600">Quick Logging</Text>
        </HStack>
      </CardHeader>
      <CardBody>
        <SimpleGrid columns={3} spacing={2}>
          <Button 
            size={isMobile ? "sm" : "md"} 
            colorScheme="green" 
            leftIcon={<Text fontSize="lg">🍎</Text>}
            onClick={onLogFood}
          >
            Food
          </Button>
          <Button 
            size={isMobile ? "sm" : "md"} 
            colorScheme="blue" 
            leftIcon={<Text fontSize="lg">💧</Text>}
            onClick={onLogWater}
          >
            Water
          </Button>
          <Button 
            size={isMobile ? "sm" : "md"} 
            colorScheme="purple" 
            leftIcon={<Text fontSize="lg">⚖️</Text>}
            onClick={onLogWeight}
          >
            Weight
          </Button>
        </SimpleGrid>
      </CardBody>
    </Card>
  )
}

// Main dashboard component with clean structure
export default function AIDashboardNew() {
  // All hooks at the top level - no conditional calls
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, md: false })
  
  // Loading state
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Modal states
  const { isOpen: isNutritionDetailOpen, onOpen: onNutritionDetailOpen, onClose: onNutritionDetailClose } = useDisclosure()
  const { isOpen: isHealthDetailOpen, onOpen: onHealthDetailOpen, onClose: onHealthDetailClose } = useDisclosure()
  const { isOpen: isWaterModalOpen, onOpen: onWaterModalOpen, onClose: onWaterModalClose } = useDisclosure()
  const { isOpen: isWeightModalOpen, onOpen: onWeightModalOpen, onClose: onWeightModalClose } = useDisclosure()
  const { isOpen: isFoodModalOpen, onOpen: onFoodModalOpen, onClose: onFoodModalClose } = useDisclosure()
  
  // Data hooks - only the ones we're using
  const { nutrition, loading: nutritionLoading, error: nutritionError } = useSmartNutrition()
  const { healthScore, loading: basicLoading, error: basicError } = useHealthScore()
  const { enhancedHealthScore, loading: enhancedLoading, error: enhancedError } = useEnhancedHealthScore()
  const { coaching, loading: coachingLoading, error: coachingError } = useAICoaching()

  // Action handlers
  const handleScanFood = () => navigate('/food-log')
  const handleMealPlan = () => navigate('/meal-plans')
  const handleHealthReport = () => navigate('/analytics')
  const handleAskAI = () => navigate('/ai-chat')

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  if (initialLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="60vh">
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Spinner size="xl" color="purple.500" thickness="4px" />
          </MotionBox>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <VStack spacing={2}>
              <Text fontSize="lg" fontWeight="bold">🤖 Analyzing your health data...</Text>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW={isMobile ? "100%" : "1400px"} py={isMobile ? 4 : 8} px={isMobile ? 4 : 8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <HStack>
                <Icon as={FiSun} color="orange.500" />
                <Text fontSize={isMobile ? "xl" : "2xl"} fontWeight="bold">
                  Good morning! 👋
                </Text>
              </HStack>
              <Text fontSize={isMobile ? "sm" : "md"} color="gray.600">
                Here's your health overview for today
              </Text>
            </VStack>
          </HStack>
        </MotionBox>

        {/* Mobile vs Desktop Layout */}
        {isMobile ? (
          <Tabs variant="soft-rounded" colorScheme="green" size="sm">
            <TabList bg="white" p={2} borderRadius="xl" boxShadow="sm">
              <Tab fontSize="xs">Overview</Tab>
              <Tab fontSize="xs">Actions</Tab>
              <Tab fontSize="xs">Progress</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <VStack spacing={4}>
                  <QuickLoggingCard 
                    onLogFood={onFoodModalOpen}
                    onLogWater={onWaterModalOpen}
                    onLogWeight={onWeightModalOpen}
                    isMobile={isMobile}
                  />
                  <NutritionCard 
                    nutrition={nutrition}
                    loading={nutritionLoading}
                    error={nutritionError}
                    onOpenDetail={onNutritionDetailOpen}
                    isMobile={isMobile}
                  />
                  <HealthScoreCard 
                    healthScore={healthScore}
                    enhancedHealthScore={enhancedHealthScore}
                    basicLoading={basicLoading}
                    enhancedLoading={enhancedLoading}
                    basicError={basicError}
                    enhancedError={enhancedError}
                    onOpenDetail={onHealthDetailOpen}
                    isMobile={isMobile}
                  />
                </VStack>
              </TabPanel>

              <TabPanel px={0}>
                <VStack spacing={4}>
                  <QuickActionsCard 
                    onScanFood={handleScanFood}
                    onMealPlan={handleMealPlan}
                    onHealthReport={handleHealthReport}
                    onAskAI={handleAskAI}
                    isMobile={isMobile}
                  />
                  <AICoachingCard 
                    coaching={coaching}
                    loading={coachingLoading}
                    error={coachingError}
                    isMobile={isMobile}
                  />
                </VStack>
              </TabPanel>

              <TabPanel px={0}>
                <VStack spacing={4}>
                  <Text>Progress content coming soon...</Text>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : (
          <Grid
            templateColumns="repeat(auto-fit, minmax(350px, 1fr))"
            gap={6}
          >
            <NutritionCard 
              nutrition={nutrition}
              loading={nutritionLoading}
              error={nutritionError}
              onOpenDetail={onNutritionDetailOpen}
              isMobile={isMobile}
            />
            <HealthScoreCard 
              healthScore={healthScore}
              enhancedHealthScore={enhancedHealthScore}
              basicLoading={basicLoading}
              enhancedLoading={enhancedLoading}
              basicError={basicError}
              enhancedError={enhancedError}
              onOpenDetail={onHealthDetailOpen}
              isMobile={isMobile}
            />
            <AICoachingCard 
              coaching={coaching}
              loading={coachingLoading}
              error={coachingError}
              isMobile={isMobile}
            />
            <QuickActionsCard 
              onScanFood={handleScanFood}
              onMealPlan={handleMealPlan}
              onHealthReport={handleHealthReport}
              onAskAI={handleAskAI}
              isMobile={isMobile}
            />
            <QuickLoggingCard 
              onLogFood={onFoodModalOpen}
              onLogWater={onWaterModalOpen}
              onLogWeight={onWeightModalOpen}
              isMobile={isMobile}
            />
          </Grid>
        )}

        {/* Modals */}
        <TodaysNutritionDetailModal
          isOpen={isNutritionDetailOpen}
          onClose={onNutritionDetailClose}
        />

        <Modal isOpen={isHealthDetailOpen} onClose={onHealthDetailClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Health Score Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Text>Detailed health analysis coming soon...</Text>
            </ModalBody>
          </ModalContent>
        </Modal>

        <WaterLogModal 
          isOpen={isWaterModalOpen} 
          onClose={onWaterModalClose}
          onSuccess={() => window.location.reload()}
        />
        
        <WeightLogModal 
          isOpen={isWeightModalOpen} 
          onClose={onWeightModalClose}
          onSuccess={() => window.location.reload()}
        />
        
        <FoodLogModal 
          isOpen={isFoodModalOpen} 
          onClose={onFoodModalClose}
          onSuccess={() => window.location.reload()}
        />
      </VStack>
    </Container>
  )
}
