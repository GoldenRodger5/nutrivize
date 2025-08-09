import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Alert,
  AlertIcon,
  Spinner,
  Icon,
  useColorModeValue,
  SimpleGrid,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Divider,
} from '@chakra-ui/react'
import { FiTrendingUp, FiTarget, FiHeart, FiActivity, FiRefreshCw, FiCheckCircle } from 'react-icons/fi'
import api from '../../utils/api'

interface HealthInsights {
  goal_progress?: any
  nutrition_trends?: any
  weekly_summary?: any
  summary?: string
}

interface AIInsightsData {
  success: boolean
  insights: HealthInsights
  generated_at: string
  user_id: string
}

const EnhancedAIInsights: React.FC = () => {
  const [insights, setInsights] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const highlightBg = useColorModeValue('blue.50', 'blue.900')

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/ai-dashboard/health-insights')
      setInsights(response.data)
    } catch (err: any) {
      console.error('Error fetching AI insights:', err)
      setError(err.message || 'Failed to load AI insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'green'
    if (percentage >= 70) return 'yellow'
    if (percentage >= 50) return 'orange'
    return 'red'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <Card bg={bg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Spinner color="blue.500" size="lg" />
            <Text color="gray.600">Loading AI insights...</Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  if (error || !insights) {
    return (
      <Card bg={bg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">Unable to load AI insights</Text>
              <Text fontSize="sm">{error}</Text>
              <Button size="sm" onClick={fetchInsights} leftIcon={<FiRefreshCw />}>
                Retry
              </Button>
            </VStack>
          </Alert>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card bg={bg} borderColor={borderColor} borderWidth={1}>
      <CardHeader>
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Icon as={FiHeart} color="red.500" boxSize={6} />
            <Heading size="md">Enhanced AI Health Insights</Heading>
            <Badge colorScheme="blue" variant="subtle">AI Generated</Badge>
          </HStack>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchInsights}
            leftIcon={<FiRefreshCw />}
          >
            Refresh
          </Button>
        </HStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Summary */}
          {insights.insights.summary && (
            <Box p={4} bg={highlightBg} borderRadius="lg" borderLeft="4px solid" borderLeftColor="blue.400">
              <HStack spacing={2} mb={2}>
                <Icon as={FiCheckCircle} color="blue.500" />
                <Text fontWeight="bold">AI Summary</Text>
              </HStack>
              <Text>{insights.insights.summary}</Text>
            </Box>
          )}

          <Accordion allowToggle>
            {/* Goal Progress */}
            {insights.insights.goal_progress && (
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Icon as={FiTarget} color="green.500" />
                      <Text fontWeight="medium">Goal Progress Analysis</Text>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {Object.entries(insights.insights.goal_progress.daily_progress || {}).map(([goal, progress]: [string, any]) => (
                      <Box key={goal} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <Text fontWeight="medium" mb={2} textTransform="capitalize">
                          {goal.replace('_', ' ')}
                        </Text>
                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.600">
                            {progress.current}/{progress.target}
                          </Text>
                          <Badge colorScheme={getProgressColor(progress.percentage)}>
                            {progress.percentage}%
                          </Badge>
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </AccordionPanel>
              </AccordionItem>
            )}

            {/* Nutrition Trends */}
            {insights.insights.nutrition_trends && (
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Icon as={FiTrendingUp} color="blue.500" />
                      <Text fontWeight="medium">Nutrition Trends</Text>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack align="stretch" spacing={3}>
                    {insights.insights.nutrition_trends.trends?.map((trend: any, index: number) => (
                      <Box key={index} p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <HStack justify="space-between" mb={1}>
                          <Text fontWeight="medium">{trend.nutrient}</Text>
                          <Badge 
                            colorScheme={trend.trend === 'increasing' ? 'green' : trend.trend === 'decreasing' ? 'red' : 'yellow'}
                          >
                            {trend.trend}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          Average: {trend.average} {trend.unit}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            )}

            {/* Weekly Summary */}
            {insights.insights.weekly_summary && (
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Icon as={FiActivity} color="purple.500" />
                      <Text fontWeight="medium">Weekly Summary</Text>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack align="stretch" spacing={3}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontWeight="medium" mb={2}>Achievements</Text>
                        <List spacing={1}>
                          {insights.insights.weekly_summary.achievements?.map((achievement: string, index: number) => (
                            <ListItem key={index} fontSize="sm">
                              <ListIcon as={FiCheckCircle} color="green.500" />
                              {achievement}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                      
                      <Box>
                        <Text fontWeight="medium" mb={2}>Key Metrics</Text>
                        <VStack align="stretch" spacing={2}>
                          {Object.entries(insights.insights.weekly_summary.totals || {}).map(([metric, value]: [string, any]) => (
                            <HStack key={metric} justify="space-between">
                              <Text fontSize="sm" textTransform="capitalize">
                                {metric.replace('_', ' ')}
                              </Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {typeof value === 'number' ? Math.round(value) : value}
                              </Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            )}
          </Accordion>

          <Divider />
          
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Generated: {formatDate(insights.generated_at)}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default EnhancedAIInsights
