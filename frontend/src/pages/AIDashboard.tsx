import { useState, useEffect, useCallback } from 'react'
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
import { FiTrendingUp, FiTarget, FiActivity, FiZap, FiHeart, FiCheck, FiRefreshCw } from 'react-icons/fi'
import { useAICoaching, useSmartNutrition, useHealthScore } from '../hooks/useAIDashboard'
import { useEnhancedHealthScore, useProgressAnalytics } from '../hooks/useEnhancedAIHealth'
import { useTodayActivity } from '../hooks/useTodayActivity'
import { useWeeklyProgress } from '../hooks/useWeeklyProgress'
import { useNutritionStreak } from '../hooks/useNutritionStreak'
import TodaysNutritionDetailModal from '../components/TodaysNutritionDetailModal'
import ErrorBoundary from '../components/ErrorBoundary'
import WaterLogModal from '../components/WaterLogModal'
import WeightLogModal from '../components/WeightLogModal'
import FoodLogModal from '../components/FoodLogModal'
import NutritionLabelScanner from '../components/NutritionLabelScanner'
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
const CompactAIHealthCoach = ({
  coaching,
  loading,
  error,
  isMobile,
  bgColor,
  borderColor
}: {
  coaching: any;
  loading: boolean;
  error: any;
  isMobile: boolean | undefined;
  bgColor: string;
  borderColor: string;
}) => {
  // Removed hooks - now using props

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
        <Badge colorScheme="green" variant="solid" fontSize={isMobile ? "xs" : "sm"}>
          <Icon as={FiCheck} mr={1} />
          AI Verified
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
          size={isMobile ? "xs" : "sm"} 
          colorScheme="purple" 
          variant="outline"
          leftIcon={<Icon as={FiZap} />}
          onClick={() => {
            // This would open a modal explaining AI Coach functionality
            alert('AI Coach analyzes your nutrition data, patterns, and goals to provide personalized insights. It tracks macro balance, eating patterns, consistency, and correlates with your activity levels to give you actionable recommendations.')
          }}
        >
          How It Works
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
const CompactNutritionDisplay = ({ 
  onOpenDetailModal,
  nutrition,
  loading,
  error,
  isMobile,
  trackColor
}: { 
  onOpenDetailModal: () => void;
  nutrition: any;
  loading: boolean;
  error: any;
  isMobile: boolean | undefined;
  trackColor: string;
}) => {
  // Removed hooks - now using props

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
              {Math.round((nutrition as any).calories.current)}
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
                  {Math.round(data.percentage)}%
                </CircularProgressLabel>
              </CircularProgress>
              <VStack spacing={0}>
                <Text fontSize={isMobile ? "2xs" : "sm"} fontWeight="bold" textTransform="capitalize">
                  {macro}
                </Text>
                <Text fontSize={isMobile ? "2xs" : "xs"} color="gray.500">
                  {Math.round(data.current * 10) / 10}g
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
            {Math.round((nutrition as any).fiber.current * 10) / 10}g / {(nutrition as any).fiber.target}g
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
            {Math.round(((nutrition as any).water?.current || 0) * 10) / 10} / {(nutrition as any).water?.target || 64} fl oz
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
const CompactHealthScore = ({
  healthScore,
  enhancedHealthScore,
  basicLoading,
  enhancedLoading,
  basicError,
  enhancedError,
  refreshHealthScore,
  isMobile,
  isHealthDetailOpen,
  onHealthDetailOpen,
  onHealthDetailClose,
  trackColor,
  scoreBreakdownBg,
  redBg,
  purpleBg
}: {
  healthScore: any;
  enhancedHealthScore: any;
  basicLoading: boolean;
  enhancedLoading: boolean;
  basicError: any;
  enhancedError: any;
  refreshHealthScore: () => Promise<void>;
  isMobile: boolean | undefined;
  isHealthDetailOpen: boolean;
  onHealthDetailOpen: () => void;
  onHealthDetailClose: () => void;
  trackColor: string;
  scoreBreakdownBg: string;
  redBg: string;
  purpleBg: string;
}) => {
  // Removed hooks - now using props

  // Use enhanced data if available, fall back to basic data
  const scoreData = enhancedHealthScore || healthScore
  const loading = basicLoading || enhancedLoading
  const error = basicError && enhancedError

  // Define helper functions
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

  // Handle loading state
  if (loading) {
    return isMobile ? (
      <CollapsibleCard title="Health Score" icon={FiHeart} colorScheme="red" size="sm">
        <Spinner size="sm" />
      </CollapsibleCard>
    ) : (
      <Spinner size="sm" />
    )
  }
  
  // Handle error state
  if (error || !scoreData) return null

  const content = (
    <VStack spacing={isMobile ? 3 : 5}>
      <HStack justify="space-between" w="full">
        <Badge 
          colorScheme={getScoreColor((scoreData as any).overall_score)} 
          variant="solid" 
          fontSize={isMobile ? "xs" : "sm"}
        >
          {(scoreData as any).trend === 'improving' ? '📈' : '📉'} {(scoreData as any).trend}
        </Badge>
        <Badge 
          colorScheme={getScoreColor((scoreData as any).overall_score)} 
          variant="outline" 
          fontSize={isMobile ? "xs" : "sm"}
        >
          {getScoreLabel((scoreData as any).overall_score)}
        </Badge>
      </HStack>

      <Box
        position="relative"
        width={isMobile ? "120px" : "180px"}
        height={isMobile ? "120px" : "180px"}
        margin="0 auto"
      >
        <CircularProgress 
          value={Math.round((scoreData as any).overall_score / 10) * 10} 
          size="100%"
          thickness={isMobile ? "8px" : "12px"}
          color={getScoreColor(Math.round((scoreData as any).overall_score / 10) * 10) + '.400'}
          trackColor={trackColor}
          capIsRound
        >
          <CircularProgressLabel>
            <VStack spacing={0}>
              <Text fontSize={isMobile ? "2xl" : "4xl"} fontWeight="bold" color={getScoreColor(Math.round((scoreData as any).overall_score / 10) * 10) + '.600'}>
                {Math.round((scoreData as any).overall_score / 10) * 10}
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
          bg={getScoreColor((scoreData as any).overall_score) + '.500'}
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
          {Object.entries((scoreData as any).component_scores || {}).slice(0, 4).map(([key, value]: [string, any]) => (
            <VStack spacing={1} key={key} p={2} bg={scoreBreakdownBg} borderRadius="md">
              <Text fontSize={isMobile ? "2xs" : "xs"} fontWeight="medium" textTransform="capitalize" textAlign="center" color="gray.600">
                {key.replace('_', ' ')}
              </Text>
              <Text fontSize={isMobile ? "sm" : "md"} fontWeight="bold" color={getScoreColor(Math.round(value / 10) * 10) + '.600'}>
                {Math.round(value / 10) * 10}
              </Text>
            </VStack>
          ))}
        </SimpleGrid>
      </VStack>

      {/* More Info Button */}
      <VStack spacing={2} w="full">
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
        
        <Button 
          size={isMobile ? "sm" : "md"} 
          colorScheme="blue" 
          variant="ghost"
          onClick={refreshHealthScore}
          w="full"
          leftIcon={<Icon as={FiRefreshCw} />}
          isLoading={loading}
        >
          Refresh Health Score
        </Button>
      </VStack>

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
                  value={(scoreData as any).overall_score} 
                  size="150px" 
                  thickness="12px"
                  color={getScoreColor((scoreData as any).overall_score) + '.400'}
                  capIsRound
                >
                  <CircularProgressLabel>
                    <VStack spacing={0}>
                      <Text fontSize="3xl" fontWeight="bold">
                        {(scoreData as any).overall_score}
                      </Text>
                      <Text fontSize="xs" color="gray.500">/100</Text>
                    </VStack>
                  </CircularProgressLabel>
                </CircularProgress>
                <Text mt={3} fontSize="xl" fontWeight="bold" color={getScoreColor((scoreData as any).overall_score) + '.600'}>
                  {getScoreLabel((scoreData as any).overall_score)}
                </Text>
                
                {/* Trend */}
                <Badge 
                  colorScheme={(scoreData as any).trend === 'improving' ? 'green' : 'orange'} 
                  variant="solid" 
                  fontSize="sm"
                  mt={2}
                >
                  {(scoreData as any).trend === 'improving' ? '📈 Improving' : '📉 Declining'}
                </Badge>
              </Box>
              
              {/* How Score Is Calculated */}
              <Box w="full" p={4} bg={scoreBreakdownBg} borderRadius="md">
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
                {Object.entries((scoreData as any).component_scores || {}).map(([key, value]: [string, any]) => (
                  <Box w="full" key={key}>
                    <HStack justify="space-between" w="full" mb={1}>
                      <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Text fontSize="sm" fontWeight="bold" color={getScoreColor(Math.round(value / 10) * 10) + '.600'}>
                        {Math.round(value / 10) * 10}/100
                      </Text>
                    </HStack>
                    <Progress 
                      value={Math.round(value / 10) * 10} 
                      colorScheme={getScoreColor(Math.round(value / 10) * 10)} 
                      size="sm" 
                      w="full"
                      borderRadius="full"
                    />
                  </Box>
                ))}
              </VStack>
              
              {/* Improvement Areas */}
              <Box w="full" p={4} bg={redBg} borderRadius="md">
                <Heading size="sm" mb={3} color="red.600">Areas to Improve</Heading>
                <VStack spacing={2} align="start">
                  {(scoreData as any).overall_score < 90 && (
                    <>
                      {(scoreData as any).component_scores?.nutrition < 70 && (
                        <Text fontSize="sm">• Increase protein intake and reduce processed carbohydrates</Text>
                      )}
                      {(scoreData as any).component_scores?.activity < 70 && (
                        <Text fontSize="sm">• Add 15-30 minutes of moderate exercise 3-4 times per week</Text>
                      )}
                      {(scoreData as any).component_scores?.sleep < 70 && (
                        <Text fontSize="sm">• Improve sleep quality by maintaining a consistent sleep schedule</Text>
                      )}
                      {(scoreData as any).component_scores?.hydration < 70 && (
                        <Text fontSize="sm">• Increase daily water intake to at least 8 glasses</Text>
                      )}
                    </>
                  )}
                  {(scoreData as any).overall_score >= 90 && (
                    <Text fontSize="sm">Great job! Focus on maintaining your excellent habits.</Text>
                  )}
                </VStack>
              </Box>
              
              {/* AI-Powered Insights */}
              <Box w="full" p={4} bg={purpleBg} borderRadius="md">
                <Heading size="sm" mb={3} color="purple.600">Health Score Analysis</Heading>
                <VStack spacing={3} align="start">
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="purple.700">
                      How Your Score is Calculated:
                    </Text>
                    <Text fontSize="sm" mt={1}>
                      Your health score is based on a weighted analysis of your nutrition balance (40%), 
                      activity levels (25%), sleep quality (20%), and hydration (15%). Each factor is 
                      evaluated against optimal health standards.
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="purple.700">
                      What This Score Means:
                    </Text>
                    <Text fontSize="sm" mt={1}>
                      {Math.round((scoreData as any).overall_score / 10) * 10 >= 90 
                        ? "Excellent! You're maintaining optimal health habits. Focus on consistency to sustain these results."
                        : Math.round((scoreData as any).overall_score / 10) * 10 >= 70
                        ? "Good progress! You're on the right track. Small improvements in your weaker areas will boost your score significantly."
                        : "Room for improvement. Focus on the highlighted areas below to see meaningful health improvements within 2-3 weeks."
                      }
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="purple.700">
                      Factors Affecting Your Score:
                    </Text>
                    <VStack align="start" spacing={1} mt={1}>
                      <Text fontSize="sm">• Macro balance: Protein-carb-fat ratios</Text>
                      <Text fontSize="sm">• Meal timing: Consistency and frequency</Text>
                      <Text fontSize="sm">• Nutrient density: Vitamin and mineral intake</Text>
                      <Text fontSize="sm">• Hydration patterns: Water intake timing</Text>
                      <Text fontSize="sm">• Activity correlation: Exercise-nutrition sync</Text>
                    </VStack>
                  </Box>
                </VStack>
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
  handleAskAI,
  isMobile,
  activity,
  activityLoading,
  activityError
}: {
  handleScanFood: () => void;
  handleMealPlan: () => void;
  handleHealthReport: () => void;
  handleAskAI: () => void;
  isMobile: boolean | undefined;
  activity: any;
  activityLoading: boolean;
  activityError: any;
}) => {
  // Removed hooks - now using props
  
  const actions = [
    {
      label: 'Scan Label',
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
const ProgressGoalsCard = ({
  isMobile,
  isProgressDetailOpen,
  onProgressDetailOpen,
  onProgressDetailClose,
  progressAnalytics,
  progressLoading,
  progressError,
  nutrition,
  grayBg,
  grayBg2,
  purpleBg,
  blueBg,
  greenBg,
  whiteBg
}: {
  isMobile: boolean | undefined;
  isProgressDetailOpen: boolean;
  onProgressDetailOpen: () => void;
  onProgressDetailClose: () => void;
  progressAnalytics: any;
  progressLoading: boolean;
  progressError: any;
  nutrition: any;
  grayBg: string;
  grayBg2: string;
  purpleBg: string;
  blueBg: string;
  greenBg: string;
  whiteBg: string;
}) => {
  // Removed hooks - now using props

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
          
          <Box w="full" bg={blueBg} p={isMobile ? 3 : 4} borderRadius="lg">
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
              value={Math.round(weightProgress / 10) * 10} 
              colorScheme="blue" 
              size={isMobile ? "lg" : "xl"} 
              borderRadius="full"
            />
            <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600" mt={1} textAlign="center">
              {progressAnalytics.weight_progress.weight_lost_so_far} lost 
              • {progressAnalytics.weight_progress.remaining_weight} to go
            </Text>
            
            {/* Estimated Completion Date Badge */}
            <Badge colorScheme="blue" mt={2} p={1} fontSize="xs" textAlign="center" w="full">
              Est. completion: {progressAnalytics.weight_progress.estimated_completion}
            </Badge>
          </Box>
        </VStack>
      ) : (
        <VStack spacing={3} align="center" p={4} bg={grayBg2} borderRadius="lg">
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
          <Box p={3} bg={purpleBg} borderRadius="md" textAlign="center">
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
          <Box p={3} bg={greenBg} borderRadius="md" textAlign="center">
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
            <HStack justify="space-between" p={3} bg={grayBg2} borderRadius="md">
              <HStack>
                <Text fontSize={isMobile ? "md" : "lg"}>🔥</Text>
                <VStack align="start" spacing={0}>
                  <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Calories</Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">
                    {Math.round((nutrition as any).calories.current)} / {(nutrition as any).calories.target}
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
            <HStack justify="space-between" p={3} bg={grayBg2} borderRadius="md">
              <HStack>
                <Text fontSize={isMobile ? "md" : "lg"}>💧</Text>
                <VStack align="start" spacing={0}>
                  <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Water</Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">
                    {Math.round(((nutrition as any).water?.current || 0) * 10) / 10} / {(nutrition as any).water?.target || 64} fl oz
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
            <HStack justify="space-between" p={3} bg={grayBg2} borderRadius="md">
              <HStack>
                <Text fontSize={isMobile ? "md" : "lg"}>💪</Text>
                <VStack align="start" spacing={0}>
                  <Text fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Protein</Text>
                  <Text fontSize={isMobile ? "xs" : "sm"} color="gray.500">
                    {Math.round((nutrition as any).protein.current * 10) / 10}g / {(nutrition as any).protein.target}g
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
        <VStack spacing={3} align="center" p={4} bg={grayBg2} borderRadius="lg">
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
                          {progressAnalytics.weight_progress.weight_lost_so_far}
                        </Text>
                      </HStack>
                      <HStack w="full" justify="space-between" bg="cyan.50" p={3} borderRadius="md">
                        <Text fontSize="sm" fontWeight="medium">Remaining</Text>
                        <Text fontSize="lg" fontWeight="bold" color="cyan.600">
                          {progressAnalytics.weight_progress.remaining_weight}
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
                    <Box p={4} borderWidth="1px" borderRadius="md" bg={grayBg}>
                      <VStack spacing={3} align="stretch">
                        {progressAnalytics.ai_insights.milestone_projections.map((milestone: { milestone: string; estimated_date: string }, index: number) => (
                          <HStack key={index} justify="space-between" p={2} bg={whiteBg} borderRadius="md" boxShadow="sm">
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
const QuickLoggingButtons = ({
  isMobile,
  isWaterModalOpen,
  onWaterModalOpen,
  onWaterModalClose,
  isWeightModalOpen,
  onWeightModalOpen,
  onWeightModalClose,
  isFoodModalOpen,
  onFoodModalOpen,
  onFoodModalClose
}: {
  isMobile: boolean | undefined;
  isWaterModalOpen: boolean;
  onWaterModalOpen: () => void;
  onWaterModalClose: () => void;
  isWeightModalOpen: boolean;
  onWeightModalOpen: () => void;
  onWeightModalClose: () => void;
  isFoodModalOpen: boolean;
  onFoodModalOpen: () => void;
  onFoodModalClose: () => void;
}) => {
  // Removed hooks - now using props

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
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - BEFORE ANY RETURNS OR CONDITIONAL LOGIC
  const [loading, setLoading] = useState(true)
  const [isNutritionDetailModalOpen, setIsNutritionDetailModalOpen] = useState(false)
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, lg: false })

  // Move hooks from child components to ensure consistent hook order
  const { nutrition: nutritionData, loading: nutritionLoading, error: nutritionError } = useSmartNutrition()
  const nutritionTrackColor = useColorModeValue('gray.100', 'gray.700')

  // Move hooks from CompactHealthScore to parent
  const { healthScore, loading: basicLoading, error: basicError } = useHealthScore()
  const { enhancedHealthScore, loading: enhancedLoading, error: enhancedError, refreshHealthScore } = useEnhancedHealthScore()
  const { isOpen: isHealthDetailOpen, onOpen: onHealthDetailOpen, onClose: onHealthDetailClose } = useDisclosure()
  const healthTrackColor = useColorModeValue('gray.100', 'gray.700')
  const scoreBreakdownBg = useColorModeValue('gray.50', 'gray.700')
  const healthRedBg = useColorModeValue('red.50', 'red.900')
  const healthPurpleBg = useColorModeValue('purple.50', 'purple.900')

  // Move hooks from CompactAIHealthCoach to parent
  const { coaching, loading: coachingLoading, error: coachingError } = useAICoaching()
  const coachingBgColor = useColorModeValue('purple.50', 'purple.900')
  const coachingBorderColor = useColorModeValue('purple.200', 'purple.700')

  // Move hooks from QuickLoggingButtons to parent
  const { isOpen: isWaterModalOpen, onOpen: onWaterModalOpen, onClose: onWaterModalClose } = useDisclosure()
  const { isOpen: isWeightModalOpen, onOpen: onWeightModalOpen, onClose: onWeightModalClose } = useDisclosure()
  const { isOpen: isFoodModalOpen, onOpen: onFoodModalOpen, onClose: onFoodModalClose } = useDisclosure()
  const { isOpen: isOCRModalOpen, onOpen: onOCRModalOpen, onClose: onOCRModalClose } = useDisclosure()

  // Move hooks from QuickActionsCard to parent
  const { activity, loading: activityLoading, error: activityError } = useTodayActivity()
  
  // Add hooks for new cards
  const { weeklyProgress, loading: weeklyLoading, error: weeklyError } = useWeeklyProgress()
  const { nutritionStreak, loading: streakLoading, error: streakError } = useNutritionStreak()

  // Move hooks from ProgressGoalsCard to parent
  const { isOpen: isProgressDetailOpen, onOpen: onProgressDetailOpen, onClose: onProgressDetailClose } = useDisclosure()
  const { progressAnalytics, loading: progressLoading, error: progressError } = useProgressAnalytics()

  // ProgressGoalsCard color mode values - moved to parent
  const progressGrayBg = useColorModeValue('gray.50', 'gray.800')
  const progressGrayBg2 = useColorModeValue('gray.50', 'gray.700')
  const progressPurpleBg = useColorModeValue('purple.50', 'purple.900')
  const progressBlueBg = useColorModeValue('blue.50', 'blue.900')
  const progressGreenBg = useColorModeValue('green.50', 'green.900')
  const progressWhiteBg = useColorModeValue('white', 'gray.700')

  // Predefine all useColorModeValue hooks to avoid hook order issues in conditional rendering
  const cardBg = useColorModeValue('white', 'gray.800')
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700')
  const greenHeaderBg = useColorModeValue('green.50', 'green.900')
  const greenBorderColor = useColorModeValue('green.100', 'green.700')
  const greenIconBg = useColorModeValue('green.100', 'green.700')
  const greenTextColor = useColorModeValue('green.600', 'green.200')
  const purpleHeaderBg = useColorModeValue('purple.50', 'purple.900')
  const purpleBorderColor = useColorModeValue('purple.100', 'purple.700')
  const purpleIconBg = useColorModeValue('purple.100', 'purple.700')
  const purpleTextColor = useColorModeValue('purple.600', 'purple.200')
  const blueHeaderBg = useColorModeValue('blue.50', 'blue.900')
  const blueBorderColor = useColorModeValue('blue.100', 'blue.700')
  const blueIconBg = useColorModeValue('blue.100', 'blue.700')
  const blueTextColor = useColorModeValue('blue.600', 'blue.200')
  const redHeaderBg = useColorModeValue('red.50', 'red.900')
  const redBorderColor = useColorModeValue('red.100', 'red.700')
  const redIconBg = useColorModeValue('red.100', 'red.700')
  const redTextColor = useColorModeValue('red.600', 'red.200')
  const orangeHeaderBg = useColorModeValue('orange.50', 'orange.900')
  const orangeBorderColor = useColorModeValue('orange.100', 'orange.700')
  const orangeIconBg = useColorModeValue('orange.100', 'orange.700')
  const orangeTextColor = useColorModeValue('orange.600', 'orange.200')
  const tealHeaderBg = useColorModeValue('teal.50', 'teal.900')
  const tealBorderColor = useColorModeValue('teal.100', 'teal.700')
  const tealIconBg = useColorModeValue('teal.100', 'teal.700')
  const tealTextColor = useColorModeValue('teal.600', 'teal.200')
  const yellowHeaderBg = useColorModeValue('yellow.50', 'yellow.900')
  const yellowBorderColor = useColorModeValue('yellow.100', 'yellow.700')
  const yellowIconBg = useColorModeValue('yellow.100', 'yellow.700')
  const yellowTextColor = useColorModeValue('yellow.600', 'yellow.200')

  // Quick action handlers
  const handleScanFood = useCallback(() => {
    onOCRModalOpen()
  }, [onOCRModalOpen])

  const handleMealPlan = useCallback(() => {
    navigate('/meal-plans')
  }, [navigate])

  const handleHealthReport = useCallback(() => {
    navigate('/analytics')
  }, [navigate])

  const handleAskAI = useCallback(() => {
    navigate('/ai-chat')
  }, [navigate])

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
    <ErrorBoundary>
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
                      bg={cardBg}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={greenHeaderBg} borderBottom="1px" borderColor={greenBorderColor}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={greenIconBg} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiTarget} color={greenTextColor} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={greenTextColor}>
                            Today's Nutrition - {new Date().toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <CompactNutritionDisplay 
                          onOpenDetailModal={() => setIsNutritionDetailModalOpen(true)}
                          nutrition={nutritionData}
                          loading={nutritionLoading}
                          error={nutritionError}
                          isMobile={isMobile}
                          trackColor={nutritionTrackColor}
                        />
                      </CardBody>
                    </Card>
                  </Box>
                  
                  {/* Quick Logging Buttons - Outside of nutrition component */}
                  <QuickLoggingButtons
                    isMobile={isMobile}
                    isWaterModalOpen={isWaterModalOpen}
                    onWaterModalOpen={onWaterModalOpen}
                    onWaterModalClose={onWaterModalClose}
                    isWeightModalOpen={isWeightModalOpen}
                    onWeightModalOpen={onWeightModalOpen}
                    onWeightModalClose={onWeightModalClose}
                    isFoodModalOpen={isFoodModalOpen}
                    onFoodModalOpen={onFoodModalOpen}
                    onFoodModalClose={onFoodModalClose}
                  />
                  
                  {/* AI Health Coach - Full Component */}
                  <Box w="full">
                    <Card 
                      bg={cardBg}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={purpleHeaderBg} borderBottom="1px" borderColor={purpleBorderColor}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={purpleIconBg} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiActivity} color={purpleTextColor} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={purpleTextColor}>AI Health Coach</Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <CompactAIHealthCoach 
                          coaching={coaching}
                          loading={coachingLoading}
                          error={coachingError}
                          isMobile={isMobile}
                          bgColor={coachingBgColor}
                          borderColor={coachingBorderColor}
                        />
                      </CardBody>
                    </Card>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Stats Tab */}
              <TabPanel p={2}>
                <VStack spacing={4}>
                  {/* Quick Logging Buttons */}
                  <QuickLoggingButtons
                    isMobile={isMobile}
                    isWaterModalOpen={isWaterModalOpen}
                    onWaterModalOpen={onWaterModalOpen}
                    onWaterModalClose={onWaterModalClose}
                    isWeightModalOpen={isWeightModalOpen}
                    onWeightModalOpen={onWeightModalOpen}
                    onWeightModalClose={onWeightModalClose}
                    isFoodModalOpen={isFoodModalOpen}
                    onFoodModalOpen={onFoodModalOpen}
                    onFoodModalClose={onFoodModalClose}
                  />
                  
                  {/* Health Score - Full Component */}
                  <Box w="full">
                    <Card 
                      bg={cardBg}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={redHeaderBg} borderBottom="1px" borderColor={redBorderColor}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={redIconBg} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiHeart} color={redTextColor} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={redTextColor}>Health Score</Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <CompactHealthScore 
                          healthScore={healthScore}
                          enhancedHealthScore={enhancedHealthScore}
                          basicLoading={basicLoading}
                          enhancedLoading={enhancedLoading}
                          basicError={basicError}
                          enhancedError={enhancedError}
                          refreshHealthScore={refreshHealthScore}
                          isMobile={isMobile}
                          isHealthDetailOpen={isHealthDetailOpen}
                          onHealthDetailOpen={onHealthDetailOpen}
                          onHealthDetailClose={onHealthDetailClose}
                          trackColor={healthTrackColor}
                          scoreBreakdownBg={scoreBreakdownBg}
                          redBg={healthRedBg}
                          purpleBg={healthPurpleBg}
                        />
                      </CardBody>
                    </Card>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Quick Actions Tab */}
              <TabPanel p={2}>
                <VStack spacing={4}>
                  {/* Quick Logging Buttons */}
                  <QuickLoggingButtons
                    isMobile={isMobile}
                    isWaterModalOpen={isWaterModalOpen}
                    onWaterModalOpen={onWaterModalOpen}
                    onWaterModalClose={onWaterModalClose}
                    isWeightModalOpen={isWeightModalOpen}
                    onWeightModalOpen={onWeightModalOpen}
                    onWeightModalClose={onWeightModalClose}
                    isFoodModalOpen={isFoodModalOpen}
                    onFoodModalOpen={onFoodModalOpen}
                    onFoodModalClose={onFoodModalClose}
                  />
                  
                  {/* Quick Actions */}
                  <Box w="full">
                    <Card 
                      bg={cardBg}
                      borderWidth={1}
                      borderRadius="xl"
                      boxShadow="md"
                    >
                      <CardHeader pb={3} bg={orangeHeaderBg} borderBottom="1px" borderColor={orangeBorderColor}>
                        <HStack spacing={3}>
                          <Box w={8} h={8} borderRadius="full" bg={orangeIconBg} display="flex" alignItems="center" justifyContent="center">
                            <Icon as={FiZap} color={orangeTextColor} w={5} h={5} />
                          </Box>
                          <Heading size="sm" color={orangeTextColor}>Quick Actions</Heading>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <QuickActionsCard 
                          handleScanFood={handleScanFood}
                          handleMealPlan={handleMealPlan}
                          handleHealthReport={handleHealthReport}
                          handleAskAI={handleAskAI}
                          isMobile={isMobile}
                          activity={activity}
                          activityLoading={activityLoading}
                          activityError={activityError}
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
              bg={cardBg}
              borderColor={cardBorderColor}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)', cursor: 'pointer' }}
              transition="all 0.3s ease"
              w="full"
              onClick={() => setIsNutritionDetailModalOpen(true)}
            >
              <CardHeader pb={3} bg={greenHeaderBg} borderBottom="1px" borderColor={greenBorderColor}>
                <HStack spacing={4} justify="space-between" w="full">
                  <HStack spacing={4}>
                    <Box w={10} h={10} borderRadius="full" bg={greenIconBg} display="flex" alignItems="center" justifyContent="center">
                      <Icon as={FiTarget} color={greenTextColor} w={6} h={6} />
                    </Box>
                    <Heading size={isMobile ? "sm" : "md"} color={greenTextColor}>Today's Nutrition</Heading>
                  </HStack>
                  <Badge colorScheme="green" variant="outline" fontSize="xs">
                    Click for Details
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <CompactNutritionDisplay 
                  onOpenDetailModal={() => setIsNutritionDetailModalOpen(true)}
                  nutrition={nutritionData}
                  loading={nutritionLoading}
                  error={nutritionError}
                  isMobile={isMobile}
                  trackColor={nutritionTrackColor}
                />
              </CardBody>
            </MotionCard>

            {/* Quick Logging Buttons - Below Today's Nutrition */}
            <Box w="full">
              <QuickLoggingButtons
                isMobile={isMobile}
                isWaterModalOpen={isWaterModalOpen}
                onWaterModalOpen={onWaterModalOpen}
                onWaterModalClose={onWaterModalClose}
                isWeightModalOpen={isWeightModalOpen}
                onWeightModalOpen={onWeightModalOpen}
                onWeightModalClose={onWeightModalClose}
                isFoodModalOpen={isFoodModalOpen}
                onFoodModalOpen={onFoodModalOpen}
                onFoodModalClose={onFoodModalClose}
              />
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
              bg={cardBg}
              borderColor={cardBorderColor}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={purpleHeaderBg} borderBottom="1px" borderColor={purpleBorderColor}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={purpleIconBg} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiActivity} color={purpleTextColor} w={6} h={6} />
                  </Box>
                  <Heading size={isMobile ? "sm" : "md"} color={purpleTextColor}>AI Health Coach</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <CompactAIHealthCoach 
                  coaching={coaching}
                  loading={coachingLoading}
                  error={coachingError}
                  isMobile={isMobile}
                  bgColor={coachingBgColor}
                  borderColor={coachingBorderColor}
                />
              </CardBody>
            </MotionCard>
            
            {/* Progress & Goals - New Card */}
            <MotionCard 
              bg={cardBg}
              borderColor={cardBorderColor}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={blueHeaderBg} borderBottom="1px" borderColor={blueBorderColor}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={blueIconBg} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiTrendingUp} color={blueTextColor} w={6} h={6} />
                  </Box>
                  <Heading size={isMobile ? "sm" : "md"} color={blueTextColor}>Progress & Goals</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <ProgressGoalsCard 
                  isMobile={isMobile}
                  isProgressDetailOpen={isProgressDetailOpen}
                  onProgressDetailOpen={onProgressDetailOpen}
                  onProgressDetailClose={onProgressDetailClose}
                  progressAnalytics={progressAnalytics}
                  progressLoading={progressLoading}
                  progressError={progressError}
                  nutrition={nutritionData}
                  grayBg={progressGrayBg}
                  grayBg2={progressGrayBg2}
                  purpleBg={progressPurpleBg}
                  blueBg={progressBlueBg}
                  greenBg={progressGreenBg}
                  whiteBg={progressWhiteBg}
                />
              </CardBody>
            </MotionCard>

            {/* Health Score - Large Card */}
            <MotionCard 
              bg={cardBg}
              borderColor={cardBorderColor}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={redHeaderBg} borderBottom="1px" borderColor={redBorderColor}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={redIconBg} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiHeart} color={redTextColor} w={6} h={6} />
                  </Box>
                  <Heading size={isMobile ? "sm" : "md"} color={redTextColor}>Health Score</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <CompactHealthScore 
                  healthScore={healthScore}
                  enhancedHealthScore={enhancedHealthScore}
                  basicLoading={basicLoading}
                  enhancedLoading={enhancedLoading}
                  basicError={basicError}
                  enhancedError={enhancedError}
                  refreshHealthScore={refreshHealthScore}
                  isMobile={isMobile}
                  isHealthDetailOpen={isHealthDetailOpen}
                  onHealthDetailOpen={onHealthDetailOpen}
                  onHealthDetailClose={onHealthDetailClose}
                  trackColor={healthTrackColor}
                  scoreBreakdownBg={scoreBreakdownBg}
                  redBg={healthRedBg}
                  purpleBg={healthPurpleBg}
                />
              </CardBody>
            </MotionCard>
            
            {/* Quick Actions - Large Card */}
            <MotionCard 
              bg={cardBg}
              borderColor={cardBorderColor}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={orangeHeaderBg} borderBottom="1px" borderColor={orangeBorderColor}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={orangeIconBg} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiZap} color={orangeTextColor} w={6} h={6} />
                  </Box>
                  <Heading size={isMobile ? "sm" : "md"} color={orangeTextColor}>Quick Actions</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <QuickActionsCard 
                  handleScanFood={handleScanFood}
                  handleMealPlan={handleMealPlan}
                  handleHealthReport={handleHealthReport}
                  handleAskAI={handleAskAI}
                  isMobile={isMobile}
                  activity={activity}
                  activityLoading={activityLoading}
                  activityError={activityError}
                />
              </CardBody>
            </MotionCard>

            {/* Weekly Progress Summary - New Engaging Card */}
            <MotionCard 
              bg={cardBg}
              borderColor={cardBorderColor}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={tealHeaderBg} borderBottom="1px" borderColor={tealBorderColor}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={tealIconBg} display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FiTrendingUp} color={tealTextColor} w={6} h={6} />
                  </Box>
                  <Heading size={isMobile ? "sm" : "md"} color={tealTextColor}>Weekly Progress</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4}>
                  {weeklyLoading ? (
                    <Spinner size="md" />
                  ) : weeklyError || !weeklyProgress ? (
                    <Text fontSize="sm" color="red.500">Unable to load weekly progress</Text>
                  ) : (
                    <>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        Your week at a glance
                      </Text>
                      
                      <SimpleGrid columns={2} spacing={4} w="full">
                        <VStack spacing={2} p={3} bg={progressGreenBg} borderRadius="md">
                          <Text fontSize="2xl" fontWeight="bold" color="green.600">🔥</Text>
                          <Text fontSize="lg" fontWeight="bold" color="green.600">{weeklyProgress.streak_days}</Text>
                          <Text fontSize="xs" color="gray.600" textAlign="center">Day Streak</Text>
                        </VStack>
                        <VStack spacing={2} p={3} bg={progressBlueBg} borderRadius="md">
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">📈</Text>
                          <Text fontSize="lg" fontWeight="bold" color="blue.600">{weeklyProgress.goal_achievement}%</Text>
                          <Text fontSize="xs" color="gray.600" textAlign="center">Goal Achievement</Text>
                        </VStack>
                        <VStack spacing={2} p={3} bg={progressPurpleBg} borderRadius="md">
                          <Text fontSize="2xl" fontWeight="bold" color="purple.600">🎯</Text>
                          <Text fontSize="lg" fontWeight="bold" color="purple.600">{weeklyProgress.meals_logged}</Text>
                          <Text fontSize="xs" color="gray.600" textAlign="center">Meals Logged</Text>
                        </VStack>
                        <VStack spacing={2} p={3} bg={orangeHeaderBg} borderRadius="md">
                          <Text fontSize="2xl" fontWeight="bold" color="orange.600">💧</Text>
                          <Text fontSize="lg" fontWeight="bold" color="orange.600">{weeklyProgress.water_intake}</Text>
                          <Text fontSize="xs" color="gray.600" textAlign="center">Water Intake</Text>
                        </VStack>
                      </SimpleGrid>
                      
                      <Box w="full" p={3} bg={progressGrayBg2} borderRadius="md">
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="sm" fontWeight="medium">Weekly Trend</Text>
                          <Badge colorScheme={weeklyProgress.trend === 'improving' ? 'green' : 'orange'} variant="solid">
                            {weeklyProgress.trend === 'improving' ? '📈 Improving' : '📊 Stable'}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {weeklyProgress.consistency_score}% consistency this week. 
                          {weeklyProgress.trend === 'improving' 
                            ? " Great progress! Keep it up." 
                            : " Stay consistent for better results."}
                        </Text>
                      </Box>
                    </>
                  )}
                </VStack>
              </CardBody>
            </MotionCard>

            {/* Nutrition Streak Counter - New Engaging Card */}
            <MotionCard 
              bg={cardBg}
              borderColor={cardBorderColor}
              borderWidth={1} 
              borderRadius="xl"
              overflow="hidden"
              boxShadow="md"
              _hover={{ boxShadow: 'lg', transform: 'translateY(-2px)' }}
              transition="all 0.3s ease"
              height="100%"
            >
              <CardHeader pb={3} bg={yellowHeaderBg} borderBottom="1px" borderColor={yellowBorderColor}>
                <HStack spacing={4}>
                  <Box w={10} h={10} borderRadius="full" bg={yellowIconBg} display="flex" alignItems="center" justifyContent="center">
                    <Text fontSize="xl">🔥</Text>
                  </Box>
                  <Heading size={isMobile ? "sm" : "md"} color={yellowTextColor}>Nutrition Streak</Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4}>
                  {streakLoading ? (
                    <Spinner size="md" />
                  ) : streakError || !nutritionStreak ? (
                    <Text fontSize="sm" color="red.500">Unable to load nutrition streak</Text>
                  ) : (
                    <>
                      <VStack spacing={2}>
                        <Text fontSize="5xl" fontWeight="bold" color="orange.500">{nutritionStreak.current_streak}</Text>
                        <Text fontSize="lg" fontWeight="bold" color="gray.700">Days in a row!</Text>
                        <Text fontSize="sm" color="gray.600" textAlign="center">
                          {nutritionStreak.streak_status === 'on_fire' 
                            ? "You're on fire! Keep logging your meals to maintain your streak." 
                            : nutritionStreak.streak_status === 'building'
                            ? "Building momentum! Keep it up to reach your next milestone."
                            : "Start your streak by logging meals consistently!"}
                        </Text>
                      </VStack>
                      
                      <Box w="full">
                        <Text fontSize="sm" fontWeight="medium" mb={2}>Streak Progress</Text>
                        <Progress value={nutritionStreak.progress_to_milestone} colorScheme="orange" size="lg" borderRadius="full" />
                        <Text fontSize="xs" color="gray.500" mt={1} textAlign="center">
                          {nutritionStreak.next_milestone - nutritionStreak.current_streak} more days to unlock "{nutritionStreak.milestone_name}"!
                        </Text>
                      </Box>
                      
                      <HStack spacing={2} w="full" justify="center">
                        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
                          <Box
                            key={day}
                            w={8}
                            h={8}
                            borderRadius="full"
                            bg={day <= nutritionStreak.current_streak ? "orange.100" : "gray.200"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontSize="sm" color={day <= nutritionStreak.current_streak ? "orange.600" : "gray.400"}>
                              {day <= nutritionStreak.current_streak ? "🔥" : "⭕"}
                            </Text>
                          </Box>
                        ))}
                      </HStack>
                      
                      {nutritionStreak.best_streak > nutritionStreak.current_streak && (
                        <Box w="full" p={2} bg={progressBlueBg} borderRadius="md">
                          <Text fontSize="xs" color="blue.600" textAlign="center">
                            🏆 Your best streak: {nutritionStreak.best_streak} days
                          </Text>
                        </Box>
                      )}
                    </>
                  )}
                </VStack>
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
        
        {/* OCR Nutrition Label Modal */}
        <Modal isOpen={isOCRModalOpen} onClose={onOCRModalClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Scan Nutrition Label</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <NutritionLabelScanner />
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
    </ErrorBoundary>
  )
}
