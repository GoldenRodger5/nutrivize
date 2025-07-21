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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  useToast,
  useColorModeValue,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  CircularProgress,
  CircularProgressLabel,
  Select,
  FormControl
} from '@chakra-ui/react'
import { 
  InfoIcon
} from '@chakra-ui/icons'
import { 
  MdTrendingUp, 
  MdLightbulb,
  MdFavorite,
  MdWarning,
  MdCheckCircle
} from 'react-icons/md'
import api from '../../utils/api'

interface HealthInsight {
  id: string
  type: 'recommendation' | 'warning' | 'achievement' | 'trend' | 'tip'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  category: 'nutrition' | 'exercise' | 'sleep' | 'hydration' | 'general'
  actionable: boolean
  action_text?: string
  confidence_score: number
  data_points: string[]
  timestamp: string
}

interface NutritionTrend {
  metric: string
  current_value: number
  previous_value: number
  change_percentage: number
  trend_direction: 'up' | 'down' | 'stable'
  goal_alignment: 'on_track' | 'behind' | 'ahead'
}

interface HealthScore {
  overall_score: number
  nutrition_score: number
  hydration_score: number
  consistency_score: number
  goal_progress_score: number
  breakdown: {
    calories: number
    macros: number
    micronutrients: number
    meal_timing: number
    variety: number
  }
}

interface HealthInsightsData {
  insights: HealthInsight[]
  trends: NutritionTrend[]
  health_score: HealthScore
  recommendations: string[]
  warnings: string[]
  achievements: string[]
  generated_at: string
}

const AIHealthInsights: React.FC = () => {
  const [insightsData, setInsightsData] = useState<HealthInsightsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([])
  
  const toast = useToast()
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const successColor = useColorModeValue('green.500', 'green.300')
  const warningColor = useColorModeValue('orange.500', 'orange.300')
  const errorColor = useColorModeValue('red.500', 'red.300')

  useEffect(() => {
    fetchHealthInsights()
  }, [timeRange])

  const fetchHealthInsights = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/ai/health-insights', {
        params: {
          time_range: timeRange,
          include_trends: true,
          include_recommendations: true
        }
      })
      setInsightsData(response.data)
    } catch (error: any) {
      console.error('Health insights error:', error)
      toast({
        title: 'Failed to load insights',
        description: error.response?.data?.detail || 'Could not fetch health insights',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const dismissInsight = (insightId: string) => {
    setDismissedInsights(prev => [...prev, insightId])
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return MdLightbulb
      case 'warning': return MdWarning
      case 'achievement': return MdCheckCircle
      case 'trend': return MdTrendingUp
      case 'tip': return MdFavorite
      default: return InfoIcon
    }
  }

  const getInsightColor = (type: string, priority: string) => {
    if (type === 'warning') return errorColor
    if (type === 'achievement') return successColor
    if (priority === 'high') return errorColor
    if (priority === 'medium') return warningColor
    return 'blue.500'
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'High Priority'
      case 'medium': return 'Medium Priority'
      case 'low': return 'Low Priority'
      default: return 'Normal'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return successColor
    if (score >= 60) return warningColor
    return errorColor
  }

  const getHealthScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 60) return 'Fair'
    if (score >= 40) return 'Poor'
    return 'Needs Improvement'
  }

  const filteredInsights = insightsData?.insights.filter(insight => {
    if (dismissedInsights.includes(insight.id)) return false
    if (selectedCategory === 'all') return true
    return insight.category === selectedCategory
  }) || []

  const renderInsightCard = (insight: HealthInsight) => (
    <Card key={insight.id} variant="outline" borderColor={borderColor}>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <HStack>
            <Icon 
              as={getInsightIcon(insight.type)} 
              color={getInsightColor(insight.type, insight.priority)}
              boxSize={5}
            />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="md">{insight.title}</Text>
              <HStack spacing={2}>
                <Badge colorScheme={insight.priority === 'high' ? 'red' : insight.priority === 'medium' ? 'orange' : 'blue'}>
                  {getPriorityLabel(insight.priority)}
                </Badge>
                <Badge variant="subtle">
                  {insight.category}
                </Badge>
              </HStack>
            </VStack>
          </HStack>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dismissInsight(insight.id)}
          >
            ×
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="start" spacing={3}>
          <Text fontSize="sm" color="gray.600">
            {insight.description}
          </Text>
          
          {insight.actionable && insight.action_text && (
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={() => {
                toast({
                  title: 'Action noted',
                  description: insight.action_text,
                  status: 'info',
                  duration: 3000,
                  isClosable: true
                })
              }}
            >
              {insight.action_text}
            </Button>
          )}
          
          <HStack justify="space-between" w="full">
            <Text fontSize="xs" color="gray.500">
              Confidence: {Math.round(insight.confidence_score * 100)}%
            </Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(insight.timestamp).toLocaleDateString()}
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )

  const renderTrendCard = (trend: NutritionTrend) => (
    <Card key={trend.metric} variant="outline" borderColor={borderColor}>
      <CardBody>
        <Stat>
          <StatLabel>{trend.metric}</StatLabel>
          <StatNumber fontSize="2xl">{trend.current_value}</StatNumber>
          <StatHelpText>
            <StatArrow type={trend.change_percentage > 0 ? 'increase' : 'decrease'} />
            {Math.abs(trend.change_percentage)}%
            <Badge ml={2} colorScheme={
              trend.goal_alignment === 'on_track' ? 'green' :
              trend.goal_alignment === 'ahead' ? 'blue' : 'orange'
            }>
              {trend.goal_alignment.replace('_', ' ')}
            </Badge>
          </StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  )

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Analyzing your health data...</Text>
      </Box>
    )
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="2xl" fontWeight="bold">
                AI Health Insights
              </Text>
              <Text color="gray.600">
                Personalized insights based on your nutrition and health data
              </Text>
            </VStack>
            <HStack>
              <FormControl maxW="200px">
                <Select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  size="sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="14d">Last 14 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </Select>
              </FormControl>
              <Button onClick={fetchHealthInsights} size="sm">
                Refresh
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Health Score Overview */}
        {insightsData?.health_score && (
          <Card variant="outline" borderColor={borderColor}>
            <CardHeader>
              <Text fontSize="lg" fontWeight="bold">Health Score Overview</Text>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Box textAlign="center">
                  <CircularProgress 
                    value={insightsData.health_score.overall_score} 
                    color={getHealthScoreColor(insightsData.health_score.overall_score)}
                    size="120px"
                    thickness="12px"
                  >
                    <CircularProgressLabel fontSize="2xl" fontWeight="bold">
                      {insightsData.health_score.overall_score}
                    </CircularProgressLabel>
                  </CircularProgress>
                  <Text mt={2} fontWeight="semibold">
                    {getHealthScoreLabel(insightsData.health_score.overall_score)}
                  </Text>
                </Box>
                
                <SimpleGrid columns={2} spacing={4}>
                  <Stat size="sm">
                    <StatLabel>Nutrition</StatLabel>
                    <StatNumber>{insightsData.health_score.nutrition_score}</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>Hydration</StatLabel>
                    <StatNumber>{insightsData.health_score.hydration_score}</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>Consistency</StatLabel>
                    <StatNumber>{insightsData.health_score.consistency_score}</StatNumber>
                  </Stat>
                  <Stat size="sm">
                    <StatLabel>Goal Progress</StatLabel>
                    <StatNumber>{insightsData.health_score.goal_progress_score}</StatNumber>
                  </Stat>
                </SimpleGrid>
                
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>Score Breakdown</Text>
                  <VStack spacing={2}>
                    {Object.entries(insightsData.health_score.breakdown).map(([key, value]) => (
                      <HStack key={key} justify="space-between" w="full">
                        <Text fontSize="xs" textTransform="capitalize">{key.replace('_', ' ')}</Text>
                        <Badge colorScheme={value >= 80 ? 'green' : value >= 60 ? 'yellow' : 'red'}>
                          {value}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Insights Tabs */}
        <Tabs>
          <TabList>
            <Tab>All Insights</Tab>
            <Tab>Trends</Tab>
            <Tab>Recommendations</Tab>
            <Tab>Achievements</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <HStack>
                  <FormControl maxW="200px">
                    <Select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      size="sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="exercise">Exercise</option>
                      <option value="sleep">Sleep</option>
                      <option value="hydration">Hydration</option>
                      <option value="general">General</option>
                    </Select>
                  </FormControl>
                  <Text fontSize="sm" color="gray.600">
                    {filteredInsights.length} insights
                  </Text>
                </HStack>
                
                {filteredInsights.length === 0 ? (
                  <Alert status="info">
                    <AlertIcon />
                    No insights available for the selected criteria.
                  </Alert>
                ) : (
                  filteredInsights.map(renderInsightCard)
                )}
              </VStack>
            </TabPanel>
            
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">Nutrition Trends</Text>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {insightsData?.trends.map(renderTrendCard)}
                </SimpleGrid>
              </VStack>
            </TabPanel>
            
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">AI Recommendations</Text>
                {insightsData?.recommendations.map((rec, index) => (
                  <Alert key={index} status="info">
                    <AlertIcon />
                    {rec}
                  </Alert>
                ))}
              </VStack>
            </TabPanel>
            
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Text fontSize="lg" fontWeight="semibold">Recent Achievements</Text>
                {insightsData?.achievements.map((achievement, index) => (
                  <Alert key={index} status="success">
                    <AlertIcon />
                    {achievement}
                  </Alert>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  )
}

export default AIHealthInsights
