import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  Progress,
  Badge,
  Button,
  CircularProgress,
  CircularProgressLabel,
  useColorModeValue,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Icon,
  useBreakpointValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Collapse,
  CardHeader,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiTrendingUp, FiTarget, FiActivity, FiZap, FiHeart } from 'react-icons/fi'
import { useAICoaching, useSmartNutrition, useHealthScore } from '../hooks/useAIDashboard'
import { useEnhancedHealthScore, useProgressAnalytics } from '../hooks/useEnhancedAIHealth'
import { useTodayActivity } from '../hooks/useTodayActivity'
import TodaysNutritionDetailModal from '../components/TodaysNutritionDetailModal'
import WaterLogModal from '../components/WaterLogModal'
import WeightLogModal from '../components/WeightLogModal'
import FoodLogModal from '../components/FoodLogModal'
import AIResponseFormatter from '../components/AIResponseFormatter'

const MotionCard = motion(Card)
const MotionBox = motion(Box)

// Collapsible Card Component
const CollapsibleCard = ({ 
  title, 
  icon, 
  children, 
  colorScheme = 'blue',
  size = 'md',
  ...props 
}: any) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  // Always show content (removed collapsible behavior for mobile)
  const showContent = true
  
  return (
    <MotionCard 
      bg={cardBg} 
      borderColor={borderColor} 
      borderWidth={1}
      size={size}
      boxShadow="sm"
      _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
      transition="all 0.2s"
      {...props}
    >
      <CardHeader 
        pb={2}
        borderRadius="md"
        transition="background 0.2s"
      >
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Box 
              w={8} h={8} 
              borderRadius="full" 
              bg={`${colorScheme}.100`}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={icon} color={`${colorScheme}.600`} w={4} h={4} />
            </Box>
            <Heading size="sm" color={`${colorScheme}.600`}>
              {title}
            </Heading>
          </HStack>
        </HStack>
      </CardHeader>
      <Collapse in={showContent} animateOpacity>
        <CardBody pt={0}>
          {children}
        </CardBody>
      </Collapse>
    </MotionCard>
  )
}

// Compact AI Health Coach Component
const CompactAIHealthCoach = () => {
  // ALL HOOKS MUST BE CALLED AT THE TOP
  const { coaching, loading, error } = useAICoaching()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const bgColor = useColorModeValue('purple.50', 'purple.900')
  const borderColor = useColorModeValue('purple.200', 'purple.700')

  if (loading) return (
    isMobile ? (
      <CollapsibleCard title="AI Coach" icon={FiActivity} colorScheme="purple" size="sm">
        <Spinner size="sm" />
      </CollapsibleCard>
    ) : (
      <Spinner size="sm" />
    )
  )
  
  if (error || !coaching) return null

  const content = (
    <VStack spacing={3} align="stretch">
      <HStack justify="space-between">
        <Badge colorScheme="purple" variant="subtle" fontSize={isMobile ? "xs" : "sm"}>
          <Icon as={FiActivity} mr={1} />
          Live Analysis
        </Badge>
        <Badge colorScheme="green" variant="solid" fontSize={isMobile ? "xs" : "sm"}>
          {(coaching as any).aiConfidence}% Confidence
        </Badge>
      </HStack>
      
      <Box 
        p={isMobile ? 3 : 6} 
        borderRadius="lg" 
        bg={bgColor}
        border="1px" 
        borderColor={borderColor}
      >
        <HStack mb={isMobile ? 2 : 4}>
          <Icon as={FiTarget} color="purple.500" w={isMobile ? 4 : 5} h={isMobile ? 4 : 5} />
          <Text fontWeight="bold" color="purple.600" fontSize={isMobile ? "sm" : "lg"}>💡 Today's Insight</Text>
        </HStack>
        <Box fontSize={isMobile ? "sm" : "md"} lineHeight="1.6" color="gray.700">
          <AIResponseFormatter 
            content={(coaching as any).personalizedInsight}
            isMobile={isMobile}
            fontSize={isMobile ? "sm" : "md"}
          />
        </Box>
      </Box>

      {(coaching as any).urgentAction && (
        <Alert status="warning" borderRadius="lg" variant="left-accent" size={isMobile ? "sm" : "md"}>
          <AlertIcon />
          <VStack align="start" spacing={0}>
            <Text fontSize={isMobile ? "xs" : "sm"} fontWeight="bold">🚨 Action Needed</Text>
            <AlertDescription fontSize={isMobile ? "xs" : "sm"}>{(coaching as any).urgentAction}</AlertDescription>
          </VStack>
        </Alert>
      )}

      <HStack justify="space-between" pt={isMobile ? 2 : 4}>
        <VStack align="start" spacing={isMobile ? 1 : 2}>
          <HStack>
            <Icon as={FiTrendingUp} color="green.500" w={isMobile ? 3 : 4} h={isMobile ? 3 : 4} />
            <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" fontWeight="medium">Weekly Progress</Text>
          </HStack>
          <Text fontWeight="bold" fontSize={isMobile ? "sm" : "lg"} color="green.600">
            {(coaching as any).weeklyTrend}
          </Text>
        </VStack>
        <Button 
          size={isMobile ? "xs" : "md"} 
          colorScheme="purple" 
          variant="outline"
          leftIcon={<Icon as={FiZap} />}
        >
          Chat AI
        </Button>
      </HStack>
    </VStack>
  )

  return isMobile ? (
    <CollapsibleCard 
      title="AI Health Coach" 
      icon={FiActivity} 
      colorScheme="purple" 
      size="sm"
      defaultExpanded={false}
    >
      {content}
    </CollapsibleCard>
  ) : content
}

// Compact Nutrition Display
const CompactNutritionDisplay = ({ onOpenDetailModal }: { 
  onOpenDetailModal: () => void;
}) => {
  const { nutrition, loading, error } = useSmartNutrition()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const trackColor = useColorModeValue('gray.100', 'gray.700')

  const getNutritionColor = (percentage: number) => {
    if (percentage >= 80) return 'green'
    if (percentage >= 60) return 'yellow'
    return 'red'
  }



  if (loading) return (
    isMobile ? (
      <CollapsibleCard title="Nutrition" icon={FiTarget} colorScheme="green" size="sm">
        <Spinner size="sm" />
      </CollapsibleCard>
    ) : (
      <Spinner size="sm" />
    )
  )
  
  if (error || !nutrition) return null

  const content = (
    <VStack spacing={3}>
      <HStack justify="space-between" w="full">
        <Button 
          variant="ghost" 
          p={0} 
          h="auto" 
          onClick={onOpenDetailModal}
          fontSize="xs"
        >
          <Badge colorScheme="green" variant="solid" fontSize="xs">
            🔴 Live Tracking
          </Badge>
        </Button>
      </HStack>

      {/* Compact Calories Ring */}
      <CircularProgress 
        value={(nutrition as any).calories.percentage} 
        size={isMobile ? "100px" : "180px"} 
        thickness={isMobile ? "8px" : "12px"}
        color={getNutritionColor((nutrition as any).calories.percentage) + '.400'}
        trackColor={trackColor}
      >
        <CircularProgressLabel>
          <VStack spacing={0}>
            <Text fontSize={isMobile ? "lg" : "3xl"} fontWeight="bold">
              {(nutrition as any).calories.current}
            </Text>
            <Text fontSize={isMobile ? "2xs" : "sm"} color="gray.500">
              / {(nutrition as any).calories.target}
            </Text>
            <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.400" fontWeight="medium">
              calories
            </Text>
          </VStack>
        </CircularProgressLabel>
      </CircularProgress>

      {/* Compact Macros */}
      <SimpleGrid columns={3} spacing={isMobile ? 2 : 4} w="full">
        {['protein', 'carbs', 'fat'].map((macro) => {
          const data = (nutrition as any)[macro]
          return (
            <VStack spacing={isMobile ? 1 : 2} key={macro}>
              <CircularProgress 
                value={data.percentage} 
                size={isMobile ? "40px" : "70px"} 
                thickness={isMobile ? "6px" : "8px"}
                color={getNutritionColor(data.percentage) + '.400'}
                trackColor={trackColor}
              >
                <CircularProgressLabel fontSize={isMobile ? "2xs" : "sm"} fontWeight="bold">
                  {data.percentage}%
                </CircularProgressLabel>
              </CircularProgress>
              <VStack spacing={0}>
                <Text fontSize={isMobile ? "2xs" : "sm"} fontWeight="bold" textTransform="capitalize">
                  {macro}
                </Text>
                <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.500">
                  {data.current}g
                </Text>
              </VStack>
            </VStack>
          )
        })}
      </SimpleGrid>

      {/* Compact Fiber & Water */}
      <SimpleGrid columns={2} spacing={isMobile ? 3 : 4} w="full">
        <VStack spacing={isMobile ? 1 : 2}>
          <HStack>
            <Text fontSize={isMobile ? "sm" : "md"}>🌾</Text>
            <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" fontWeight="medium">Fiber</Text>
          </HStack>
          <Progress 
            value={(nutrition as any).fiber.percentage} 
            colorScheme="green" 
            size={isMobile ? "sm" : "md"}
            w="full"
            borderRadius="full"
          />
          <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.500">
            {(nutrition as any).fiber.current}g / {(nutrition as any).fiber.target}g
          </Text>
        </VStack>
        
        <VStack spacing={isMobile ? 1 : 2}>
          <HStack>
            <Text fontSize={isMobile ? "sm" : "md"}>💧</Text>
            <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" fontWeight="medium">Water</Text>
          </HStack>
          <Progress 
            value={(nutrition as any).water?.percentage || 0} 
            colorScheme="blue" 
            size={isMobile ? "sm" : "md"}
            w="full" 
            borderRadius="full"
          />
          <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.500">
            {(nutrition as any).water?.current || 0} / {(nutrition as any).water?.target || 64} fl oz
          </Text>
        </VStack>
      </SimpleGrid>


    </VStack>
  )

  return (
    <>
      {isMobile ? (
        <CollapsibleCard 
          title="Today's Nutrition" 
          icon={FiTarget} 
          colorScheme="green" 
          size="sm"
          defaultExpanded={false}
        >
          {content}
        </CollapsibleCard>
      ) : content}
    </>
  )
}

// Compact Health Score with Enhanced AI Insights
const CompactHealthScore = () => {
  const { healthScore, loading: basicLoading, error: basicError } = useHealthScore()
  const { enhancedHealthScore, loading: enhancedLoading, error: enhancedError } = useEnhancedHealthScore()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const { isOpen: isHealthDetailOpen, onOpen: onHealthDetailOpen, onClose: onHealthDetailClose } = useDisclosure()
  const trackColor = useColorModeValue('gray.100', 'gray.700')
  const scoreBreakdownBg = useColorModeValue('gray.50', 'gray.700')

  // Use enhanced data if available, fall back to basic data
  const scoreData = enhancedHealthScore || healthScore
  const loading = basicLoading || enhancedLoading
  const error = basicError && enhancedError

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'red'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  if (loading) return (
    isMobile ? (
      <CollapsibleCard title="Health Score" icon={FiHeart} colorScheme="red" size="sm">
        <Spinner size="sm" />
      </CollapsibleCard>
    ) : (
      <Spinner size="sm" />
    )
  )
  
  if (error || !scoreData) return null

  const content = (
    <VStack spacing={isMobile ? 3 : 5}>
      <HStack justify="space-between" w="full">
        <Badge 
          colorScheme={getScoreColor((healthScore as any).overall_score)} 
          variant="solid" 
          fontSize={isMobile ? "xs" : "sm"}
        >
          {(healthScore as any).trend === 'improving' ? '📈' : '📉'} {(healthScore as any).trend}
        </Badge>
        <Badge 
          colorScheme={getScoreColor((healthScore as any).overall_score)} 
          variant="outline" 
          fontSize={isMobile ? "xs" : "sm"}
        >
          {getScoreLabel((healthScore as any).overall_score)}
        </Badge>
      </HStack>

      <Box
        position="relative"
        width={isMobile ? "120px" : "180px"}
        height={isMobile ? "120px" : "180px"}
        margin="0 auto"
      >
        <CircularProgress 
          value={(healthScore as any).overall_score} 
          size="100%"
          thickness={isMobile ? "8px" : "12px"}
          color={getScoreColor((healthScore as any).overall_score) + '.400'}
          trackColor={trackColor}
          capIsRound
        >
          <CircularProgressLabel>
            <VStack spacing={0}>
              <Text fontSize={isMobile ? "2xl" : "4xl"} fontWeight="bold" color={getScoreColor((healthScore as any).overall_score) + '.600'}>
                {(healthScore as any).overall_score}
              </Text>
              <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">
                /100
              </Text>
              <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.400" textAlign="center">
                Health Score
              </Text>
            </VStack>
          </CircularProgressLabel>
        </CircularProgress>
        <Box
          position="absolute"
          top="-10px"
          right="-10px"
          bg={getScoreColor((healthScore as any).overall_score) + '.500'}
          borderRadius="full"
          p={2}
          boxShadow="md"
        >
          <Icon as={FiHeart} color="white" w={5} h={5} />
        </Box>
      </Box>

      {/* Component Scores */}
      <VStack spacing={isMobile ? 2 : 3} w="full">
        <Text fontSize={isMobile ? "xs" : "sm"} fontWeight="bold" color="gray.600">
          Score Breakdown
        </Text>
        <SimpleGrid columns={2} spacing={isMobile ? 2 : 3} w="full">
          {Object.entries((healthScore as any).component_scores || {}).slice(0, 4).map(([key, value]: [string, any]) => (
            <VStack spacing={1} key={key} p={2} bg={scoreBreakdownBg} borderRadius="md">
              <Text fontSize={isMobile ? "2xs" : "xs"} fontWeight="medium" textTransform="capitalize" textAlign="center" color="gray.600">
                {key.replace('_', ' ')}
              </Text>
              <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold" color={getScoreColor(value) + '.600'}>
                {value}
              </Text>
            </VStack>
          ))}
        </SimpleGrid>
      </VStack>

      {/* More Info Button */}
      <Button 
        size={isMobile ? "sm" : "md"} 
        colorScheme="red" 
        variant="outline"
        onClick={onHealthDetailOpen}
        w="full"
        leftIcon={<Icon as={FiActivity} />}
      >
        View Detailed Analysis
      </Button>

      {/* Health Score Detail Modal - Enhanced with LLM insights */}
      <Modal isOpen={isHealthDetailOpen} onClose={onHealthDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Health Score Analysis</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6}>
              {/* Score Visualization */}
              <Box textAlign="center" w="full">
                <CircularProgress 
                  value={(healthScore as any).overall_score} 
                  size="150px" 
                  thickness="12px"
                  color={getScoreColor((healthScore as any).overall_score) + '.400'}
                  capIsRound
                >
                  <CircularProgressLabel>
                    <VStack spacing={0}>
                      <Text fontSize="3xl" fontWeight="bold">
                        {(healthScore as any).overall_score}
                      </Text>
                      <Text fontSize="xs" color="gray.500">/100</Text>
                    </VStack>
                  </CircularProgressLabel>
                </CircularProgress>
                <Text mt={3} fontSize="xl" fontWeight="bold" color={getScoreColor((healthScore as any).overall_score) + '.600'}>
                  {getScoreLabel((healthScore as any).overall_score)}
                </Text>
                
                {/* Trend */}
                <Badge 
                  colorScheme={(healthScore as any).trend === 'improving' ? 'green' : 'orange'} 
                  variant="solid" 
                  fontSize="sm"
                  mt={2}
                >
                  {(healthScore as any).trend === 'improving' ? '📈 Improving' : '📉 Declining'}
                </Badge>
              </Box>
              
              {/* How Score Is Calculated */}
              <Box w="full" p={4} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="md">
                <Heading size="sm" mb={3} color="blue.600">How Your Score Is Calculated</Heading>
                <Text fontSize="sm">
                  Your Health Score is a comprehensive measurement based on your nutrition, activity, sleep, and other health data. 
                  We analyze daily patterns, meal compositions, nutritional balance, and adherence to recommended guidelines 
                  to generate this personalized assessment of your overall health status.
                </Text>
              </Box>
              
              {/* Score Breakdown */}
              <VStack spacing={4} w="full" align="start">
                <Heading size="sm" color="gray.700">Score Breakdown</Heading>
                {Object.entries((healthScore as any).component_scores || {}).map(([key, value]: [string, any]) => (
                  <Box w="full" key={key}>
                    <HStack justify="space-between" w="full" mb={1}>
                      <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color={getScoreColor(value) + '.600'}>
                        {value}/100
                      </Text>
                    </HStack>
                    <Progress 
                      value={value} 
                      colorScheme={getScoreColor(value)} 
                      size="sm" 
                      w="full"
                      borderRadius="full"
                    />
                  </Box>
                ))}
              </VStack>
              
              {/* Improvement Areas */}
              <Box w="full" p={4} bg={useColorModeValue('red.50', 'red.900')} borderRadius="md">
                <Heading size="sm" mb={3} color="red.600">Areas to Improve</Heading>
                <VStack spacing={2} align="start">
                  {(healthScore as any).overall_score < 90 && (
                    <>
                      {(healthScore as any).component_scores?.nutrition < 70 && (
                        <Text fontSize="sm">• Increase protein intake and reduce processed carbohydrates</Text>
                      )}
                      {(healthScore as any).component_scores?.activity < 70 && (
                        <Text fontSize="sm">• Add 15-30 minutes of moderate exercise 3-4 times per week</Text>
                      )}
                      {(healthScore as any).component_scores?.sleep < 70 && (
                        <Text fontSize="sm">• Improve sleep quality by maintaining a consistent sleep schedule</Text>
                      )}
                      {(healthScore as any).component_scores?.hydration < 70 && (
                        <Text fontSize="sm">• Increase daily water intake to at least 8 glasses</Text>
                      )}
                    </>
                  )}
                  {(healthScore as any).overall_score >= 90 && (
                    <Text fontSize="sm">Great job! Focus on maintaining your excellent habits.</Text>
                  )}
                </VStack>
              </Box>
              
              {/* AI-Powered Insights */}
              <Box w="full" p={4} bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="md">
                <Heading size="sm" mb={3} color="purple.600">AI-Powered Insights</Heading>
                <Text fontSize="sm">
                  Based on your recent data patterns, our AI has identified that your nutrition balance has improved by 12%
                  in the last two weeks. Your protein to carb ratio is now optimal for your fitness goals, and we've noticed 
                  more consistent meal timing which contributes positively to your metabolic health.
                </Text>
                <Text fontSize="sm" mt={2}>
                  Continue focusing on whole foods and maintaining your current hydration levels for optimal results.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  )

  return isMobile ? (
    <CollapsibleCard 
      title="Health Score" 
      icon={FiHeart} 
      colorScheme="red" 
      size="sm"
      defaultExpanded={false}
    >
      {content}
    </CollapsibleCard>
  ) : content
}

// Quick Actions Component
const QuickActionsCard = ({ 
  handleScanFood, 
  handleMealPlan, 
  handleHealthReport, 
  handleAskAI 
}: any) => {
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const { activity, loading: activityLoading, error: activityError } = useTodayActivity()
  
  const actions = [
    {
      label: 'Scan Food',
      icon: '📱',
      description: 'Scan nutrition labels',
      colorScheme: 'purple',
      onClick: handleScanFood
    },
    {
      label: 'Meal Plan',
      icon: '🍽️',
      description: 'Get AI meal suggestions',
      colorScheme: 'blue',
      onClick: handleMealPlan
    },
    {
      label: 'Health Report',
      icon: '📊',
      description: 'View detailed analytics',
      colorScheme: 'green',
      onClick: handleHealthReport
    },
    {
      label: 'Ask AI',
      icon: '🤖',
      description: 'Chat with nutrition AI',
      colorScheme: 'orange',
      onClick: handleAskAI
    }
  ]
  
  const content = (
    <VStack spacing={isMobile ? 3 : 4} w="full">
      <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" textAlign="center">
        Quick access to key features
      </Text>
      
      <SimpleGrid columns={2} spacing={isMobile ? 3 : 4} w="full">
        {actions.map((action, index) => (
          <Button 
            key={index}
            colorScheme={action.colorScheme} 
            variant="outline" 
            size={isMobile ? "sm" : "lg"} 
            onClick={action.onClick}
            fontSize={isMobile ? "xs" : "sm"}
            h={isMobile ? "auto" : "80px"}
            p={isMobile ? 2 : 4}
            flexDirection="column"
            _hover={{ 
              transform: 'translateY(-2px)', 
              shadow: 'md',
              borderColor: `${action.colorScheme}.400`
            }}
            transition="all 0.2s"
          >
            <VStack spacing={1}>
              <Text fontSize={isMobile ? "lg" : "2xl"}>{action.icon}</Text>
              <Text fontSize={isMobile ? "xs" : "sm"} fontWeight="bold" textAlign="center">
                {action.label}
              </Text>
              {!isMobile && (
                <Text fontSize="xs" color="gray.500" textAlign="center" lineHeight="1.2">
                  {action.description}
                </Text>
              )}
            </VStack>
          </Button>
        ))}
      </SimpleGrid>
      
      {/* Quick Stats */}
      <VStack spacing={2} w="full" pt={2}>
        <Text fontSize={isMobile ? "xs" : "sm"} fontWeight="bold" color="gray.600">
          Today's Activity
        </Text>
        {activityLoading ? (
          <Spinner size="sm" />
        ) : activityError || !activity ? (
          <Text fontSize="xs" color="red.500">Unable to load activity data</Text>
        ) : (
          <SimpleGrid columns={3} spacing={2} w="full">
            <VStack spacing={1}>
              <Text fontSize={isMobile ? "sm" : "lg"} fontWeight="bold" color="purple.600">
                {activity.foods_logged}
              </Text>
              <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.500" textAlign="center">Foods Logged</Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize={isMobile ? "sm" : "lg"} fontWeight="bold" color="blue.600">
                {activity.water_logged}
              </Text>
              <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.500" textAlign="center">Water Logged</Text>
            </VStack>
            <VStack spacing={1}>
              <Text fontSize={isMobile ? "sm" : "lg"} fontWeight="bold" color="green.600">
                {activity.ai_chats}
              </Text>
              <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.500" textAlign="center">AI Chats</Text>
            </VStack>
          </SimpleGrid>
        )}
      </VStack>
    </VStack>
  )
  
  return isMobile ? (
    <CollapsibleCard 
      title="Quick Actions" 
      icon={FiZap} 
      colorScheme="orange" 
      size="sm"
    >
      {content}
    </CollapsibleCard>
  ) : content
}

// Progress Goals Component
const ProgressGoalsCard = () => {
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const { isOpen: isProgressDetailOpen, onOpen: onProgressDetailOpen, onClose: onProgressDetailClose } = useDisclosure()
  
  // ALL HOOKS MUST BE CALLED AT THE TOP - BEFORE ANY RETURNS
  const { progressAnalytics, loading: progressLoading, error: progressError } = useProgressAnalytics()
  const { nutrition } = useSmartNutrition()
  
  // Color mode values - defined at the top
  // const grayBg = useColorModeValue('gray.50', 'gray.800')
  // const redBg = useColorModeValue('red.50', 'red.900')
  // const purpleBg = useColorModeValue('purple.50', 'purple.900')
  // const blueBg = useColorModeValue('blue.50', 'blue.900')
  // const grayBg2 = useColorModeValue('gray.50', 'gray.700')
  // const greenBg = useColorModeValue('green.50', 'green.900')
  // const whiteBg = useColorModeValue('white', 'gray.700')
  // const cardBg = useColorModeValue('white', 'gray.800')
  // const greenHeaderBg = useColorModeValue('green.50', 'green.900')
  // const greenBorderColor = useColorModeValue('green.100', 'green.700')
  // const greenIconBg = useColorModeValue('green.100', 'green.700')
  // const purpleHeaderBg = useColorModeValue('purple.50', 'purple.900')
  // const purpleBorderColor = useColorModeValue('purple.100', 'purple.700')
  // const purpleIconBg = useColorModeValue('purple.100', 'purple.700')

  // Show loading state
  if (progressLoading) {
    return isMobile ? (
      <CollapsibleCard 
        title="Progress & Goals" 
        icon={FiTrendingUp} 
        colorScheme="blue" 
        size="sm"
      >
        <Spinner size="sm" />
      </CollapsibleCard>
    ) : (
      <Spinner size="sm" />
    )
  }

  // Show error state if data failed to load
  if (progressError || !progressAnalytics) {
    const errorContent = (
      <VStack spacing={3} align="center" p={4}>
        <Text fontSize="sm" color="red.500" textAlign="center">
          Unable to load progress data
        </Text>
        <Text fontSize="xs" color="gray.500" textAlign="center">
          {progressError || 'No progress data available'}
        </Text>
      </VStack>
    )
    
    return isMobile ? (
      <CollapsibleCard 
        title="Progress & Goals" 
        icon={FiTrendingUp} 
        colorScheme="blue" 
        size="sm"
      >
        {errorContent}
      </CollapsibleCard>
    ) : errorContent
  }

  // Use only real data from progressAnalytics
  const weightProgress = progressAnalytics?.weight_progress?.percent_complete || 0
  const currentWeight = progressAnalytics?.weight_progress?.current_weight
  const targetWeight = progressAnalytics?.weight_progress?.target_weight
  
  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'green';
    if (progress >= 70) return 'blue';
    if (progress >= 50) return 'yellow';
    return 'red';
  };

  const content = (
    <VStack spacing={isMobile ? 4 : 5} w="full">
      {/* Weight Progress - Only Real Data */}
      {progressAnalytics?.weight_progress ? (
        <VStack spacing={isMobile ? 2 : 3} w="full">
          <HStack justify="space-between" w="full">
            <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold" color="blue.600">
              🎯 Weight Goal Progress
            </Text>
            <HStack spacing={1}>
              <Badge colorScheme="blue" fontSize={isMobile ? "xs" : "sm"}>
                {Math.round(weightProgress)}% Complete
              </Badge>
              {Number(progressAnalytics.weight_progress.current_rate) > progressAnalytics.weight_progress.weekly_goal && (
                <Badge colorScheme="green" variant="solid" fontSize="xs">
                  Ahead of Goal
                </Badge>
              )}
            </HStack>
          </HStack>
          
          <Box w="full" bg={useColorModeValue('blue.50', 'blue.900')} p={isMobile ? 3 : 4} borderRadius="lg">
            <HStack justify="space-between" mb={2}>
              <VStack spacing={0} align="start">
                <Text fontSize={isMobile ? "2xl" : "3xl"} fontWeight="bold" color="blue.600">
                  {currentWeight}
                </Text>
                <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">Current</Text>
              </VStack>
              <VStack spacing={0} align="center">
                <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold" color="gray.600">
                  →
                </Text>
                <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">Goal</Text>
              </VStack>
              <VStack spacing={0} align="end">
                <Text fontSize={isMobile ? "2xl" : "3xl"} fontWeight="bold" color="green.600">
                  {targetWeight}
                </Text>
                <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">Target</Text>
              </VStack>
            </HStack>
            <Progress 
              value={weightProgress} 
              colorScheme="blue" 
              size={isMobile ? "lg" : "xl"} 
              borderRadius="full"
            />
            <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" mt={1} textAlign="center">
              {progressAnalytics.weight_progress.weight_lost_so_far} lbs lost 
              • {progressAnalytics.weight_progress.remaining_weight} lbs to go
            </Text>
            
            {/* Estimated Completion Date Badge */}
            <Badge colorScheme="blue" mt={2} p={1} fontSize="xs" textAlign="center" w="full">
              Est. completion: {new Date(progressAnalytics.weight_progress.estimated_completion).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric'
              })}
            </Badge>
          </Box>
        </VStack>
      ) : (
        <VStack spacing={3} align="center" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
          <Text fontSize="sm" color="gray.500" textAlign="center">
            No weight goal data available
          </Text>
          <Text fontSize="xs" color="gray.400" textAlign="center">
            Set up weight goals in your profile to track progress
          </Text>
        </VStack>
      )}
      
      {/* Enhanced Progress Metrics - Show if available */}
      {progressAnalytics && (
        <SimpleGrid columns={2} spacing={isMobile ? 2 : 4} w="full">
          <Box p={3} bg={useColorModeValue('purple.50', 'purple.900')} borderRadius="md" textAlign="center">
            <Text fontSize="xs" color="purple.600" fontWeight="medium">Achievement Rate</Text>
            <CircularProgress 
              value={progressAnalytics.achievement_rate} 
              color="purple.400"
              size="60px"
              thickness="8px"
            >
              <CircularProgressLabel fontSize="sm" fontWeight="bold">
                {progressAnalytics.achievement_rate}%
              </CircularProgressLabel>
            </CircularProgress>
          </Box>
          <Box p={3} bg={useColorModeValue('green.50', 'green.900')} borderRadius="md" textAlign="center">
            <Text fontSize="xs" color="green.600" fontWeight="medium">Consistency Score</Text>
            <CircularProgress 
              value={progressAnalytics.consistency_score} 
              color="green.400"
              size="60px"
              thickness="8px"
            >
              <CircularProgressLabel fontSize="sm" fontWeight="bold">
                {progressAnalytics.consistency_score}
              </CircularProgressLabel>
            </CircularProgress>
          </Box>
        </SimpleGrid>
      )}

      {/* Daily Goals - Use Real Nutrition Data */}
      {nutrition ? (
        <VStack spacing={isMobile ? 2 : 3} w="full">
          <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold" color="gray.700">
            📊 Today's Goals
          </Text>
          
          <SimpleGrid columns={1} spacing={isMobile ? 2 : 3} w="full">
            {/* Calories */}
            <HStack justify="space-between" p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
              <HStack>
                <Text fontSize={isMobile ? "md" : "lg"}>🔥</Text>
                <VStack align="start" spacing={0}>
                  <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Calories</Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">
                    {(nutrition as any).calories.current} / {(nutrition as any).calories.target}
                  </Text>
                </VStack>
              </HStack>
              <CircularProgress 
                value={(nutrition as any).calories.percentage} 
                size={isMobile ? "40px" : "50px"} 
                color={getProgressColor((nutrition as any).calories.percentage) + '.400'}
                thickness="8px"
              >
                <CircularProgressLabel fontSize={isMobile ? "xs" : "sm"} fontWeight="bold">
                  {Math.round((nutrition as any).calories.percentage)}%
                </CircularProgressLabel>
              </CircularProgress>
            </HStack>

            {/* Water */}
            <HStack justify="space-between" p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
              <HStack>
                <Text fontSize={isMobile ? "md" : "lg"}>💧</Text>
                <VStack align="start" spacing={0}>
                  <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Water</Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">
                    {(nutrition as any).water?.current || 0} / {(nutrition as any).water?.target || 64} fl oz
                  </Text>
                </VStack>
              </HStack>
              <CircularProgress 
                value={(nutrition as any).water?.percentage || 0} 
                size={isMobile ? "40px" : "50px"} 
                color={getProgressColor((nutrition as any).water?.percentage || 0) + '.400'}
                thickness="8px"
              >
                <CircularProgressLabel fontSize={isMobile ? "xs" : "sm"} fontWeight="bold">
                  {Math.round((nutrition as any).water?.percentage || 0)}%
                </CircularProgressLabel>
              </CircularProgress>
            </HStack>

            {/* Protein Goal */}
            <HStack justify="space-between" p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
              <HStack>
                <Text fontSize={isMobile ? "md" : "lg"}>💪</Text>
                <VStack align="start" spacing={0}>
                  <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Protein</Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">
                    {(nutrition as any).protein.current}g / {(nutrition as any).protein.target}g
                  </Text>
                </VStack>
              </HStack>
              <CircularProgress 
                value={(nutrition as any).protein.percentage} 
                size={isMobile ? "40px" : "50px"} 
                color={getProgressColor((nutrition as any).protein.percentage) + '.400'}
                thickness="8px"
              >
                <CircularProgressLabel fontSize={isMobile ? "xs" : "sm"} fontWeight="bold">
                  {Math.round((nutrition as any).protein.percentage)}%
                </CircularProgressLabel>
              </CircularProgress>
            </HStack>
          </SimpleGrid>
        </VStack>
      ) : (
        <VStack spacing={3} align="center" p={4} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="lg">
          <Text fontSize="sm" color="gray.500" textAlign="center">
            No daily nutrition goals available
          </Text>
          <Text fontSize="xs" color="gray.400" textAlign="center">
            Log some food to track your daily progress
          </Text>
        </VStack>
      )}

      {/* View Details Button */}
      <Button 
        size={isMobile ? "sm" : "md"} 
        colorScheme="blue" 
        variant="outline"
        onClick={onProgressDetailOpen}
        w="full"
        leftIcon={<Icon as={FiTrendingUp} />}
      >
        View Progress Details
      </Button>

      {/* Progress Detail Modal - Enhanced with estimated completion date & analytics */}
      <Modal isOpen={isProgressDetailOpen} onClose={onProgressDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Progress & Goals Dashboard</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {progressLoading ? (
              <VStack py={10}>
                <Spinner size="xl" />
                <Text mt={4}>Loading your enhanced progress analytics...</Text>
              </VStack>
            ) : !progressAnalytics ? (
              <VStack spacing={4} py={10}>
                <Text fontSize="lg" fontWeight="bold" color="gray.500">No Progress Data Available</Text>
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  Set up weight goals and start tracking to see detailed progress analytics.
                </Text>
                <Button colorScheme="blue" onClick={onProgressDetailClose}>
                  Close
                </Button>
              </VStack>
            ) : (
              <VStack spacing={6}>
                {/* Detailed Weight Chart - Only with Real Data */}
                <Box w="full" textAlign="center">
                  <Text fontSize="lg" fontWeight="bold" mb={4}>Weight Loss Journey</Text>
                  <HStack justify="space-around" w="full">
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="red.500">
                        {progressAnalytics.weight_progress.start_weight}
                      </Text>
                      <Text fontSize="sm" color="gray.500">Start Weight</Text>
                      <Text fontSize="xs" color="gray.400">Start Date</Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                        {progressAnalytics.weight_progress.current_weight}
                      </Text>
                      <Text fontSize="sm" color="gray.500">Current Weight</Text>
                      <Text fontSize="xs" color="gray.400">Today</Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="2xl" fontWeight="bold" color="green.500">
                        {progressAnalytics.weight_progress.target_weight}
                      </Text>
                      <Text fontSize="sm" color="gray.500">Target Weight</Text>
                      <Badge colorScheme="green" fontSize="xs" mt={1}>Goal</Badge>
                    </VStack>
                  </HStack>
                  <Progress value={weightProgress} colorScheme="blue" size="xl" mt={4} borderRadius="full" />
                  <Text mt={2} color="gray.600">
                    {Math.round(weightProgress)}% of weight loss goal achieved
                  </Text>
                  
                  {/* Estimated Completion Date - Using Real AI Data */}
                  <Box mt={5} p={4} bg="blue.50" borderRadius="md">
                    <Text fontSize="md" fontWeight="bold" color="blue.700">Estimated Completion Date</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600" mt={1}>
                      {new Date(progressAnalytics.weight_progress.estimated_completion).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Text>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      Based on your current progress rate of {progressAnalytics.weight_progress.current_rate} lbs per week
                    </Text>
                  </Box>
                </Box>

                {/* Weekly & Monthly Analytics - Real Data Only */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  {/* Weekly Summary */}
                  <Box w="full">
                    <Text fontSize="md" fontWeight="bold" mb={3}>Progress Analytics</Text>
                    <VStack spacing={4}>
                      <HStack w="full" justify="space-between" bg="green.50" p={3} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium">Achievement Rate</Text>
                        <Text fontSize="lg" fontWeight="bold" color="green.600">
                          {progressAnalytics.achievement_rate}%
                        </Text>
                      </HStack>
                      <HStack w="full" justify="space-between" bg="blue.50" p={3} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium">Current Rate</Text>
                        <Text fontSize="lg" fontWeight="bold" color="blue.600">
                          {progressAnalytics.weight_progress.current_rate} lbs/week
                        </Text>
                      </HStack>
                      <HStack w="full" justify="space-between" bg="purple.50" p={3} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium">Consistency Score</Text>
                        <Text fontSize="lg" fontWeight="bold" color="purple.600">
                          {progressAnalytics.consistency_score}/100
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* Weight Progress */}
                  <Box w="full">
                    <Text fontSize="md" fontWeight="bold" mb={3}>Weight Progress</Text>
                    <VStack spacing={4}>
                      <HStack w="full" justify="space-between" bg="orange.50" p={3} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium">Weight Lost</Text>
                        <Text fontSize="lg" fontWeight="bold" color="orange.600">
                          {progressAnalytics.weight_progress.weight_lost_so_far} lbs
                        </Text>
                      </HStack>
                      <HStack w="full" justify="space-between" bg="cyan.50" p={3} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium">Remaining</Text>
                        <Text fontSize="lg" fontWeight="bold" color="cyan.600">
                          {progressAnalytics.weight_progress.remaining_weight} lbs
                        </Text>
                      </HStack>
                      <HStack w="full" justify="space-between" bg="teal.50" p={3} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium">Progress</Text>
                        <Text fontSize="lg" fontWeight="bold" color="teal.600">
                          {Math.round(weightProgress)}%
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                </SimpleGrid>

                {/* AI-Powered Analysis */}
                <Box w="full" p={4} bg="purple.50" borderRadius="md">
                  <Text fontSize="md" fontWeight="bold" color="purple.700" mb={2}>AI-Powered Progress Analysis</Text>
                  {progressAnalytics?.ai_insights ? (
                    <>
                      <Box fontSize="sm" mb={3}>
                        <AIResponseFormatter 
                          content={progressAnalytics.ai_insights.progress_summary}
                          isMobile={isMobile}
                          fontSize="sm"
                        />
                      </Box>
                      <Box fontSize="sm" mb={3}>
                        <AIResponseFormatter 
                          content={progressAnalytics.ai_insights.achievement_insights}
                          isMobile={isMobile}
                          fontSize="sm"
                        />
                      </Box>
                      <Text fontSize="sm" fontWeight="medium" color="purple.600">Focus Areas:</Text>
                      <VStack align="start" spacing={1} mt={1} pl={2}>
                        {progressAnalytics.ai_insights.focus_areas?.map((focus: string, index: number) => (
                          <Box key={index} w="100%">
                            <AIResponseFormatter 
                              content={`• ${focus}`}
                              isMobile={isMobile}
                              fontSize="sm"
                            />
                          </Box>
                        ))}
                      </VStack>
                    </>
                  ) : (
                    <Box fontSize="sm" color="gray.500">
                      <AIResponseFormatter 
                        content="No detailed AI insights available. Continue tracking to get personalized analysis."
                        isMobile={isMobile}
                        fontSize="sm"
                      />
                    </Box>
                  )}
                </Box>
                
                {/* Milestone Timeline - Only if data exists */}
                {progressAnalytics?.ai_insights?.milestone_projections && (
                  <Box w="full">
                    <Text fontSize="md" fontWeight="bold" mb={3}>Milestone Timeline</Text>
                    <Box p={4} borderWidth="1px" borderRadius="md" bg={useColorModeValue('gray.50', 'gray.800')}>
                      <VStack spacing={3} align="stretch">
                        {progressAnalytics.ai_insights.milestone_projections.map((milestone: { milestone: string; estimated_date: string }, index: number) => (
                          <HStack key={index} justify="space-between" p={2} bg={useColorModeValue('white', 'gray.700')} borderRadius="md" boxShadow="sm">
                            <Box fontSize="sm" fontWeight="medium" flex="1">
                              <AIResponseFormatter 
                                content={milestone.milestone}
                                isMobile={isMobile}
                                fontSize="sm"
                              />
                            </Box>
                            <Badge colorScheme="blue">{new Date(milestone.estimated_date).toLocaleDateString()}</Badge>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  </Box>
                )}
                
                {/* Completion Timeline - Only if data exists */}
                {progressAnalytics && (
                  <Box w="full">
                    <Text fontSize="md" fontWeight="bold" mb={3}>Completion Timeline</Text>
                    <Box p={4} borderWidth="1px" borderRadius="md">
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <VStack spacing={1}>
                          <Text fontSize="sm" color="gray.500">Current Pace</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {progressAnalytics.weight_progress.current_rate} lbs/week
                          </Text>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="sm" color="gray.500">Remaining</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {progressAnalytics.weight_progress.remaining_weight} lbs
                          </Text>
                        </VStack>
                        <VStack spacing={1}>
                          <Text fontSize="sm" color="gray.500">Time to Goal</Text>
                          <HStack>
                            <Text fontSize="lg" fontWeight="bold">
                              {progressAnalytics.weight_progress.current_rate && Number(progressAnalytics.weight_progress.current_rate) > 0 
                                ? Math.ceil(Number(progressAnalytics.weight_progress.remaining_weight) / Number(progressAnalytics.weight_progress.current_rate))
                                : '--'
                              }
                            </Text>
                            <Text fontSize="lg">weeks</Text>
                          </HStack>
                        </VStack>
                      </SimpleGrid>
                    </Box>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  )

  return isMobile ? (
    <CollapsibleCard 
      title="Progress & Goals" 
      icon={FiTrendingUp} 
      colorScheme="blue" 
      size="sm"
      defaultExpanded={false}
    >
      {content}
    </CollapsibleCard>
  ) : content
}

// Quick Logging Buttons Component - Outside of Today's Nutrition
const QuickLoggingButtons = () => {
  const isMobile = useBreakpointValue({ base: true, lg: false })
  
  // Modal states
  const { isOpen: isWaterModalOpen, onOpen: onWaterModalOpen, onClose: onWaterModalClose } = useDisclosure()
  const { isOpen: isWeightModalOpen, onOpen: onWeightModalOpen, onClose: onWeightModalClose } = useDisclosure()
  const { isOpen: isFoodModalOpen, onOpen: onFoodModalOpen, onClose: onFoodModalClose } = useDisclosure()

  const handleLogFood = () => {
    onWaterModalClose()
    onWeightModalClose()
    onFoodModalOpen()
  }

  const handleLogWater = () => {
    onFoodModalClose()
    onWeightModalClose()
    onWaterModalOpen()
  }

  const handleLogWeight = () => {
    onFoodModalClose()
    onWaterModalClose()
    onWeightModalOpen()
  }

  return (
    <>
      {/* Quick Log Buttons */}
      <SimpleGrid columns={3} spacing={2} w="full">
        <Button 
          size={isMobile ? "sm" : "md"} 
          colorScheme="green" 
          leftIcon={<Text fontSize="lg">🍎</Text>}
          onClick={handleLogFood}
          _hover={{ transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          Log Food
        </Button>
        <Button 
          size={isMobile ? "sm" : "md"} 
          colorScheme="blue" 
          leftIcon={<Text fontSize="lg">💧</Text>}
          onClick={handleLogWater}
          _hover={{ transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          Log Water
        </Button>
        <Button 
          size={isMobile ? "sm" : "md"} 
          colorScheme="purple" 
          leftIcon={<Text fontSize="lg">⚖️</Text>}
          onClick={handleLogWeight}
          _hover={{ transform: "translateY(-2px)" }}
          transition="all 0.2s"
        >
          Log Weight
        </Button>
      </SimpleGrid>
      
      {/* Water Log Modal */}
      <WaterLogModal 
        isOpen={isWaterModalOpen} 
        onClose={onWaterModalClose}
        onSuccess={() => {
          window.location.reload()
        }}
      />
      
      {/* Weight Log Modal */}
      <WeightLogModal 
        isOpen={isWeightModalOpen} 
        onClose={onWeightModalClose}
        onSuccess={() => {
          window.location.reload()
        }}
      />
      
      {/* Food Log Modal */}
      <FoodLogModal 
        isOpen={isFoodModalOpen} 
        onClose={onFoodModalClose}
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </>
  )
}

// Main AI Dashboard
export default function AIDashboard() {
  const [loading, setLoading] = useState(true)
  const [isNutritionDetailModalOpen, setIsNutritionDetailModalOpen] = useState(false)
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Quick action handlers
  const handleScanFood = () => {
    navigate('/food-log')
  }

  const handleMealPlan = () => {
    navigate('/meal-plans')
  }

  const handleHealthReport = () => {
    navigate('/analytics')
  }

  const handleAskAI = () => {
    navigate('/ai-chat')
  }

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => setLoading(false), 800)
  }, [])

  if (loading) {
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
              <Text color="gray.500">Preparing personalized insights</Text>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW={isMobile ? "100%" : "1600px"} py={isMobile ? 2 : 6} px={isMobile ? 2 : 6}>
      <VStack spacing={isMobile ? 3 : 6} align="stretch">
        {/* Compact Header */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <VStack spacing={1} align="start" w="full">
            <HStack w="full" justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading 
                  size={isMobile ? "lg" : "2xl"} 
                  bgGradient="linear(to-r, purple.400, blue.500, green.400)" 
                  bgClip="text"
                  textAlign={isMobile ? "center" : "left"}
                  letterSpacing="tight"
                  fontWeight="extrabold"
                >
                  🚀 AI Health Dashboard
                </Heading>
                {/* Hide description text on mobile */}
                {!isMobile && (
                  <Text color="gray.600" fontSize="md" maxW="600px">
                    Your intelligent nutrition companion powered by advanced AI.
                  </Text>
                )}
              </VStack>
              
              {!isMobile && (
                <Button 
                  colorScheme="purple" 
                  size="md" 
                  leftIcon={<Icon as={FiZap} />}
                  onClick={handleAskAI}
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  transition="all 0.3s"
                >
                  Chat with AI
                </Button>
              )}
            </HStack>
            
            {!isMobile && (
              <Box w="full" h="1px" bg="gray.200" my={4} />
            )}
          </VStack>
        </MotionBox>

        {/* Mobile Tabbed Interface */}
        {isMobile ? (
          <Tabs variant="soft-rounded" colorScheme="green" size="sm">
            <TabList bg="white" p={2} borderRadius="xl" boxShadow="sm" overflowX="auto" overflowY="hidden">
              <Tab fontSize="xs" minW="60px">🤖 AI</Tab>
              <Tab fontSize="xs" minW="60px">📊 Stats</Tab>
              <Tab fontSize="xs" minW="60px">⚡ Quick</Tab>
            </TabList>

            <TabPanels>
              {/* AI Tab */}
              <TabPanel p={2}>
                <VStack spacing={4}>
                  {/* Today's Nutrition - First thing user sees */}
                  <Box w="full">
                    <Card 
                      bg={useColorModeValue('white', 'gray.800')}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={useColorModeValue('green.50', 'green.900')} borderBottom="1px" borderColor={useColorModeValue('green.100', 'green.700')}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={useColorModeValue('green.100', 'green.700')} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiTarget} color={useColorModeValue('green.600', 'green.200')} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={useColorModeValue('green.600', 'green.200')}>Today's Nutrition</Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <CompactNutritionDisplay onOpenDetailModal={() => setIsNutritionDetailModalOpen(true)} />
                      </CardBody>
                    </Card>
                  </Box>
                  
                  {/* Quick Logging Buttons - Outside of nutrition component */}
                  <QuickLoggingButtons />
                  
                  {/* AI Health Coach - Full Component */}
                  <Box w="full">
                    <Card 
                      bg={useColorModeValue('white', 'gray.800')}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={useColorModeValue('purple.50', 'purple.900')} borderBottom="1px" borderColor={useColorModeValue('purple.100', 'purple.700')}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={useColorModeValue('purple.100', 'purple.700')} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiActivity} color={useColorModeValue('purple.600', 'purple.200')} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={useColorModeValue('purple.600', 'purple.200')}>AI Health Coach</Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <CompactAIHealthCoach />
                      </CardBody>
                    </Card>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Stats Tab */}
              <TabPanel p={2}>
                <VStack spacing={4}>
                  {/* Today's Nutrition - First here too */}
                  <Box w="full">
                    <Card 
                      bg={useColorModeValue('white', 'gray.800')}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={useColorModeValue('green.50', 'green.900')} borderBottom="1px" borderColor={useColorModeValue('green.100', 'green.700')}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={useColorModeValue('green.100', 'green.700')} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiTarget} color={useColorModeValue('green.600', 'green.200')} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={useColorModeValue('green.600', 'green.200')}>Today's Nutrition</Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <CompactNutritionDisplay onOpenDetailModal={() => setIsNutritionDetailModalOpen(true)} />
                      </CardBody>
                    </Card>
                  </Box>
                  
                  {/* Quick Logging Buttons */}
                  <QuickLoggingButtons />
                  
                  {/* Health Score - Full Component */}
                  <Box w="full">
                    <Card 
                      bg={useColorModeValue('white', 'gray.800')}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={useColorModeValue('red.50', 'red.900')} borderBottom="1px" borderColor={useColorModeValue('red.100', 'red.700')}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={useColorModeValue('red.100', 'red.700')} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiHeart} color={useColorModeValue('red.600', 'red.200')} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={useColorModeValue('red.600', 'red.200')}>Health Score</Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <CompactHealthScore />
                      </CardBody>
                    </Card>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Quick Actions Tab */}
              <TabPanel p={2}>
                <VStack spacing={4}>
                  {/* Quick Logging Buttons */}
                  <QuickLoggingButtons />
                  
                  {/* Quick Actions */}
                  <Box w="full">
                    <Card 
                      bg={useColorModeValue('white', 'gray.800')}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={useColorModeValue('orange.50', 'orange.900')} borderBottom="1px" borderColor={useColorModeValue('orange.100', 'orange.700')}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={useColorModeValue('orange.100', 'orange.700')} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiZap} color={useColorModeValue('orange.600', 'orange.200')} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={useColorModeValue('orange.600', 'orange.200')}>Quick Actions</Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <QuickActionsCard 
                          handleScanFood={handleScanFood}
                          handleMealPlan={handleMealPlan}
                          handleHealthReport={handleHealthReport}
                          handleAskAI={handleAskAI}
                        />
                      </CardBody>
                    </Card>
                  </Box>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : (
          /* Desktop Grid Layout - Always Expanded Cards with Better Sizing */
          <VStack spacing={6}>
            {/* Today's Nutrition First - Full Width */}
            <MotionCard 
              bg={useColorModeValue('white', 'gray.800')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)', cursor: 'pointer' }}
              transition="all 0.3s ease"
              w="full"
              onClick={() => setIsNutritionDetailModalOpen(true)}
            >
              <CardHeader pb={3} bg={useColorModeValue('green.50', 'green.900')} borderBottom="1px" borderColor={useColorModeValue('green.100', 'green.700')}>
                <HStack spacing={4} justify="space-between" w="full">
                  <HStack spacing={4}>
                    <Box w={10} h={10} borderRadius="full" bg={useColorModeValue('green.100', 'green.700')} display="flex" alignItems="center" justifyContent="center">
                      <Icon as={FiTarget} color={useColorModeValue('green.600', 'green.200')} w={6} h={6} />
                    </Box>
                    <Heading size="md" color={useColorModeValue('green.600', 'green.200')}>Today's Nutrition</Heading>
                  </HStack>
                  <Badge colorScheme="green" variant="outline" fontSize="xs">
                    Click for Details
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <CompactNutritionDisplay onOpenDetailModal={() => setIsNutritionDetailModalOpen(true)} />
              </CardBody>
            </MotionCard>

            {/* Quick Logging Buttons - Below Today's Nutrition */}
            <Box w="full">
              <QuickLoggingButtons />
            </Box>

            <Grid 
              templateColumns={{ 
                base: "1fr", 
                lg: "repeat(2, 1fr)", 
                xl: "repeat(3, 1fr)"
              }} 
              gap={{ base: 4, md: 5, lg: 6, xl: 7 }}
              autoRows="minmax(400px, auto)"
              w="full"
            >
            {/* AI Health Coach - Large Card */}
            <MotionCard 
              bg={useColorModeValue('white', 'gray.800')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={useColorModeValue('purple.50', 'purple.900')} borderBottom="1px" borderColor={useColorModeValue('purple.100', 'purple.700')}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={useColorModeValue('purple.100', 'purple.700')} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiActivity} color={useColorModeValue('purple.600', 'purple.200')} w={6} h={6} />
                  </Box>
                  <Heading size="md" color={useColorModeValue('purple.600', 'purple.200')}>AI Health Coach</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <CompactAIHealthCoach />
              </CardBody>
            </MotionCard>
            
            {/* Today's Nutrition - Large Card - Clickable */}
            <MotionCard 
              bg={useColorModeValue('white', 'gray.800')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)', cursor: 'pointer' }}
              transition="all 0.3s ease"
              height="100%"
              onClick={() => setIsNutritionDetailModalOpen(true)}
            >
              <CardHeader pb={3} bg={useColorModeValue('green.50', 'green.900')} borderBottom="1px" borderColor={useColorModeValue('green.100', 'green.700')}>
                <HStack spacing={4} justify="space-between" w="full">
                  <HStack spacing={4}>
                    <Box w={10} h={10} borderRadius="full" bg={useColorModeValue('green.100', 'green.700')} display="flex" alignItems="center" justifyContent="center">
                      <Icon as={FiTarget} color={useColorModeValue('green.600', 'green.200')} w={6} h={6} />
                    </Box>
                    <Heading size="md" color={useColorModeValue('green.600', 'green.200')}>Today's Nutrition</Heading>
                  </HStack>
                  <Badge colorScheme="green" variant="outline" fontSize="xs">
                    Click for Details
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <CompactNutritionDisplay onOpenDetailModal={() => setIsNutritionDetailModalOpen(true)} />
              </CardBody>
            </MotionCard>
            
            {/* Progress & Goals - New Card */}
            <MotionCard 
              bg={useColorModeValue('white', 'gray.800')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={useColorModeValue('blue.50', 'blue.900')} borderBottom="1px" borderColor={useColorModeValue('blue.100', 'blue.700')}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={useColorModeValue('blue.100', 'blue.700')} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiTrendingUp} color={useColorModeValue('blue.600', 'blue.200')} w={6} h={6} />
                  </Box>
                  <Heading size="md" color={useColorModeValue('blue.600', 'blue.200')}>Progress & Goals</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <ProgressGoalsCard />
              </CardBody>
            </MotionCard>

            {/* Health Score - Large Card */}
            <MotionCard 
              bg={useColorModeValue('white', 'gray.800')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={useColorModeValue('red.50', 'red.900')} borderBottom="1px" borderColor={useColorModeValue('red.100', 'red.700')}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={useColorModeValue('red.100', 'red.700')} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiHeart} color={useColorModeValue('red.600', 'red.200')} w={6} h={6} />
                  </Box>
                  <Heading size="md" color={useColorModeValue('red.600', 'red.200')}>Health Score</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <CompactHealthScore />
              </CardBody>
            </MotionCard>
            
            {/* Quick Actions - Large Card */}
            <MotionCard 
              bg={useColorModeValue('white', 'gray.800')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={useColorModeValue('orange.50', 'orange.900')} borderBottom="1px" borderColor={useColorModeValue('orange.100', 'orange.700')}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={useColorModeValue('orange.100', 'orange.700')} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiZap} color={useColorModeValue('orange.600', 'orange.200')} w={6} h={6} />
                  </Box>
                  <Heading size="md" color={useColorModeValue('orange.600', 'orange.200')}>Quick Actions</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <QuickActionsCard 
                  handleScanFood={handleScanFood}
                  handleMealPlan={handleMealPlan}
                  handleHealthReport={handleHealthReport}
                  handleAskAI={handleAskAI}
                />
              </CardBody>
            </MotionCard>
          </Grid>
          </VStack>
        )}

        {/* Nutrition Detail Modal */}
        <TodaysNutritionDetailModal
          isOpen={isNutritionDetailModalOpen}
          onClose={() => setIsNutritionDetailModalOpen(false)}
        />
      </VStack>
    </Container>
  )
}
