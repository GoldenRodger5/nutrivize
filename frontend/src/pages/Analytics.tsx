import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Divider,
  useBreakpointValue,
  Icon,
  IconButton,
  Collapse,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { 
  FiTrendingUp, 
  FiPieChart, 
  FiChevronDown, 
  FiChevronUp,
  FiBarChart,
  FiClock
} from 'react-icons/fi'
import { useAppState } from '../contexts/AppStateContext'
import { useFoodIndex } from '../contexts/FoodIndexContext'
import AnalyticsInsights from '../components/analytics/AnalyticsInsights'
import { analyticsService, type Insight, type TrendData } from '../services/analyticsService'

const MotionCard = motion(Card)

// Collapsible Card Component for Analytics
const CollapsibleAnalyticsCard = ({ 
  title, 
  icon, 
  children, 
  defaultExpanded = false,
  colorScheme = 'blue',
  size = 'md',
  ...props 
}: any) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const isMobile = useBreakpointValue({ base: true, md: false })
  
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
        cursor="pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
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
            <Heading size={isMobile ? "sm" : "md"} color={`${colorScheme}.600`}>
              {title}
            </Heading>
          </HStack>
          <IconButton
            icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
            size="sm"
            variant="ghost"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            color={`${colorScheme}.600`}
          />
        </HStack>
      </CardHeader>
      <Collapse in={isExpanded} animateOpacity>
        <CardBody pt={0}>
          {children}
        </CardBody>
      </Collapse>
    </MotionCard>
  )
}

export default function Analytics() {
  const { 
    dailySummary,
    weightLogs,
    goals,
    loading,
  } = useAppState()

  const { triggerRefresh } = useFoodIndex()

  const isMobile = useBreakpointValue({ base: true, md: false })

  // AI Insights State
  const [insights, setInsights] = useState<Insight[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>()
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')
  
  const toast = useToast()
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const fetchAnalyticsData = async (selectedTimeframe: 'day' | 'week' | 'month' = timeframe) => {
    if (insightsLoading) return
    
    setInsightsLoading(true)
    try {
      console.log('📊 Fetching AI insights and trends...')
      
      // Fetch comprehensive analytics data
      const analyticsData = await analyticsService.getComprehensiveAnalytics(selectedTimeframe)
      
      console.log('✅ Analytics data received:', {
        insightsCount: analyticsData.insights?.insights?.length || 0,
        trendsCount: analyticsData.trends?.trends?.length || 0,
        summary: analyticsData.insights?.summary || 'No summary available'
      })
      
      // Update insights
      setInsights(analyticsData.insights?.insights || [])
      
      // Transform statistics to trends format
      const trendData: TrendData[] = []
      
      if (analyticsData.insights?.statistics) {
        const stats = analyticsData.insights.statistics as any
        
        if (stats.avg_calories) {
          trendData.push({
            name: 'Avg Daily Calories',
            value: stats.avg_calories,
            unit: 'kcal',
            trend: stats.calorie_trend,
            trend_direction: stats.calorie_trend_direction
          })
        }
        
        if (stats.avg_protein) {
          trendData.push({
            name: 'Avg Daily Protein',
            value: stats.avg_protein,
            unit: 'g',
            trend: stats.protein_trend,
            trend_direction: stats.protein_trend_direction
          })
        }
        
        if (stats.avg_carbs) {
          trendData.push({
            name: 'Avg Daily Carbs',
            value: stats.avg_carbs,
            unit: 'g',
            trend: stats.carb_trend,
            trend_direction: stats.carb_trend_direction
          })
        }
        
        if (stats.avg_fat) {
          trendData.push({
            name: 'Avg Daily Fat',
            value: stats.avg_fat,
            unit: 'g',
            trend: stats.fat_trend,
            trend_direction: stats.fat_trend_direction
          })
        }
      }
      
      setTrends(trendData)
      setLastUpdated(new Date().toLocaleString())
      
    } catch (error) {
      console.error('❌ Failed to fetch analytics data:', error)
      toast({
        title: 'Failed to load analytics',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setInsightsLoading(false)
    }
  }

  const handleRefreshInsights = async () => {
    await fetchAnalyticsData(timeframe)
  }

  const handleTimeframeChange = (newTimeframe: 'day' | 'week' | 'month') => {
    setTimeframe(newTimeframe)
    fetchAnalyticsData(newTimeframe)
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [triggerRefresh])

  // Helper functions
  const getNutritionProgress = (current: number, target: number) => {
    return target > 0 ? Math.min((current / target) * 100, 100) : 0
  }

  // Get active goal
  const activeGoal = goals.find(goal => goal.active)

  // Get nutrition targets from active goal or defaults
  const nutritionTargets = activeGoal?.nutrition_targets || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  }

  // Calculate weight progress
  const getWeightProgress = () => {
    if (!activeGoal?.weight_target || !weightLogs.length) return null

    const latestWeight = weightLogs[0]?.weight
    const startWeight = activeGoal.weight_target.current_weight
    const targetWeight = activeGoal.weight_target.target_weight

    if (!latestWeight || !startWeight || !targetWeight) return null

    const weightLost = startWeight - latestWeight
    const totalWeightToLose = startWeight - targetWeight
    const progressPercent = totalWeightToLose > 0 ? (weightLost / totalWeightToLose) * 100 : 0

    return {
      current: latestWeight,
      start: startWeight,
      target: targetWeight,
      lost: weightLost,
      progressPercent
    }
  }

  const weightProgress = getWeightProgress()

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Loading analytics...</Text>
      </Container>
    )
  }

  const nutrition = dailySummary?.total_nutrition || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  }

  return (
    <Container maxW={isMobile ? "100%" : "container.xl"} py={isMobile ? 2 : 8} px={isMobile ? 2 : 8}>
      <VStack spacing={isMobile ? 3 : 6} align="stretch">
        {/* Header - Compact for mobile */}
        <Box textAlign={isMobile ? "center" : "left"}>
          <Heading size={isMobile ? "md" : "lg"} mb={isMobile ? 1 : 2}>
            Analytics 📊
          </Heading>
          {!isMobile && (
            <Text color="gray.600" fontSize="md">
              Track your nutrition progress and get AI-powered insights
            </Text>
          )}
        </Box>

        {/* AI-Powered Analytics & Insights Section */}
        <AnalyticsInsights
          insights={insights}
          trends={trends}
          statistics={[]}
          loading={insightsLoading}
          lastUpdated={lastUpdated}
          onRefresh={handleRefreshInsights}
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
        />

        {!isMobile && <Divider />}

        {/* No data message - Hide on mobile */}
        {!activeGoal && !isMobile && (
          <Alert status="info" size="sm">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle fontSize="sm">No Goals Set</AlertTitle>
              <AlertDescription fontSize="xs">
                Set up your nutrition goals to see detailed analytics.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Today's Nutrition Progress - Collapsible */}
        <CollapsibleAnalyticsCard 
          title="Today's Nutrition" 
          icon={FiPieChart} 
          colorScheme="blue" 
          size={isMobile ? "sm" : "md"}
          defaultExpanded={!isMobile}
        >
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={isMobile ? 3 : 4}>
            <Stat>
              <StatLabel fontSize={isMobile ? "xs" : "sm"}>Calories</StatLabel>
              <StatNumber fontSize={isMobile ? "lg" : "xl"}>{Math.round(nutrition.calories)}</StatNumber>
              <StatHelpText fontSize="xs">of {nutritionTargets.calories} kcal</StatHelpText>
              <Progress 
                value={getNutritionProgress(nutrition.calories, nutritionTargets.calories)}
                colorScheme="blue"
                size="sm"
                mt={2}
              />
            </Stat>

            <Stat>
              <StatLabel fontSize={isMobile ? "xs" : "sm"}>Protein</StatLabel>
              <StatNumber fontSize={isMobile ? "lg" : "xl"}>{Math.round(nutrition.protein)}g</StatNumber>
              <StatHelpText fontSize="xs">of {nutritionTargets.protein}g</StatHelpText>
              <Progress 
                value={getNutritionProgress(nutrition.protein, nutritionTargets.protein)}
                colorScheme="red"
                size="sm"
                mt={2}
              />
            </Stat>

            <Stat>
              <StatLabel fontSize={isMobile ? "xs" : "sm"}>Carbs</StatLabel>
              <StatNumber fontSize={isMobile ? "lg" : "xl"}>{Math.round(nutrition.carbs)}g</StatNumber>
              <StatHelpText fontSize="xs">of {nutritionTargets.carbs}g</StatHelpText>
              <Progress 
                value={getNutritionProgress(nutrition.carbs, nutritionTargets.carbs)}
                colorScheme="green"
                size="sm"
                mt={2}
              />
            </Stat>

            <Stat>
              <StatLabel fontSize={isMobile ? "xs" : "sm"}>Fat</StatLabel>
              <StatNumber fontSize={isMobile ? "lg" : "xl"}>{Math.round(nutrition.fat)}g</StatNumber>
              <StatHelpText fontSize="xs">of {nutritionTargets.fat}g</StatHelpText>
              <Progress 
                value={getNutritionProgress(nutrition.fat, nutritionTargets.fat)}
                colorScheme="yellow"
                size="sm"
                mt={2}
              />
            </Stat>
          </SimpleGrid>
        </CollapsibleAnalyticsCard>

        {/* Weight Progress - Collapsible, hidden on mobile by default */}
        {weightProgress && (
          <CollapsibleAnalyticsCard 
            title="Weight Progress" 
            icon={FiTrendingUp} 
            colorScheme="green" 
            size={isMobile ? "sm" : "md"}
            defaultExpanded={false}
          >
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={isMobile ? 3 : 6}>
              <Stat>
                <StatLabel fontSize={isMobile ? "xs" : "sm"}>Current Weight</StatLabel>
                <StatNumber fontSize={isMobile ? "lg" : "xl"}>{weightProgress.current} lbs</StatNumber>
                <StatHelpText fontSize="xs">Latest measurement</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel fontSize={isMobile ? "xs" : "sm"}>Weight Lost</StatLabel>
                <StatNumber fontSize={isMobile ? "lg" : "xl"}>{weightProgress.lost.toFixed(1)} lbs</StatNumber>
                <StatHelpText fontSize="xs">Since starting ({weightProgress.start} lbs)</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel fontSize={isMobile ? "xs" : "sm"}>Progress</StatLabel>
                <StatNumber fontSize={isMobile ? "lg" : "xl"}>{weightProgress.progressPercent.toFixed(1)}%</StatNumber>
                <StatHelpText fontSize="xs">Target: {weightProgress.target} lbs</StatHelpText>
                <Progress 
                  value={weightProgress.progressPercent}
                  colorScheme="green"
                  size="sm"
                  mt={2}
                />
              </Stat>
            </SimpleGrid>
          </CollapsibleAnalyticsCard>
        )}

        {/* Recent Weight Logs - Compact and hidden on mobile by default */}
        {weightLogs.length > 0 && (
          <CollapsibleAnalyticsCard 
            title="Recent Weights" 
            icon={FiBarChart} 
            colorScheme="purple" 
            size={isMobile ? "sm" : "md"}
            defaultExpanded={false}
          >
            <VStack spacing={2} align="stretch">
              {weightLogs.slice(0, isMobile ? 3 : 5).map((log) => (
                <Box
                  key={log.id}
                  p={3}
                  borderWidth={1}
                  borderColor={borderColor}
                  borderRadius="md"
                  fontSize={isMobile ? "sm" : "md"}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{log.weight} lbs</Text>
                      <Text fontSize="xs" color="gray.600">
                        {new Date(log.date).toLocaleDateString()}
                      </Text>
                    </VStack>
                    {log.notes && (
                      <Text fontSize="xs" color="gray.600" maxW={isMobile ? "120px" : "200px"} noOfLines={2}>
                        {log.notes}
                      </Text>
                    )}
                  </HStack>
                </Box>
              ))}
            </VStack>
          </CollapsibleAnalyticsCard>
        )}

        {/* Today's Meals Summary - Collapsible */}
        {dailySummary?.meals && dailySummary.meals.length > 0 && (
          <CollapsibleAnalyticsCard 
            title={`Today's Meals (${dailySummary.meals.length})`} 
            icon={FiClock} 
            colorScheme="orange" 
            size={isMobile ? "sm" : "md"}
            defaultExpanded={false}
          >
            <VStack spacing={2} align="stretch">
              {dailySummary.meals.slice(0, isMobile ? 3 : 5).map((meal) => (
                <Box
                  key={meal.id}
                  p={3}
                  borderWidth={1}
                  borderColor={borderColor}
                  borderRadius="md"
                  fontSize={isMobile ? "sm" : "md"}
                >
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium" fontSize={isMobile ? "sm" : "md"}>
                        {meal.food_name}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {meal.meal_type} • {meal.amount} {meal.unit}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={1}>
                      <Text fontWeight="medium" fontSize={isMobile ? "sm" : "md"}>
                        {Math.round(meal.nutrition.calories)} cal
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        P: {Math.round(meal.nutrition.protein)}g • 
                        C: {Math.round(meal.nutrition.carbs)}g • 
                        F: {Math.round(meal.nutrition.fat)}g
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
              {dailySummary.meals.length > (isMobile ? 3 : 5) && (
                <Text fontSize="xs" color="gray.500" textAlign="center" pt={2}>
                  +{dailySummary.meals.length - (isMobile ? 3 : 5)} more meals
                </Text>
              )}
            </VStack>
          </CollapsibleAnalyticsCard>
        )}
      </VStack>
    </Container>
  )
}
