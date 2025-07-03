import { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
} from '@chakra-ui/react'
import { FiRefreshCw, FiClock } from 'react-icons/fi'
import InsightCard, { Insight } from './InsightCard'
import TrendsCard, { TrendData } from './TrendsCard'

interface AnalyticsInsightsProps {
  insights: Insight[]
  trends: TrendData[]
  statistics: any[]
  loading: boolean
  lastUpdated?: string
  onRefresh: () => Promise<void>
  timeframe: 'week' | 'month'
  onTimeframeChange: (timeframe: 'week' | 'month') => void
}

export default function AnalyticsInsights({
  insights,
  trends,
  loading,
  lastUpdated,
  onRefresh,
  timeframe,
  onTimeframeChange
}: AnalyticsInsightsProps) {
  const [refreshing, setRefreshing] = useState(false)
  const toast = useToast()

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await onRefresh()
      toast({
        title: 'Insights Updated',
        description: 'Your analytics have been refreshed with the latest data.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to update insights. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setRefreshing(false)
    }
  }

  const formatLastUpdated = (timestamp?: string) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Group insights by importance
  const highPriorityInsights = insights.filter(i => i.importance === 3)
  const mediumPriorityInsights = insights.filter(i => i.importance === 2)
  const lowPriorityInsights = insights.filter(i => i.importance === 1)

  return (
    <VStack spacing={6} align="stretch">
      {/* Header Section */}
      <Box>
        <HStack justify="space-between" align="center" mb={4}>
          <Box>
            <Heading size="lg" mb={2}>
              AI-Powered Analytics & Trends 🤖
            </Heading>
            <Text color="gray.600">
              Personalized insights about your nutrition patterns and progress
            </Text>
          </Box>
          
          <VStack align="end" spacing={2}>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant={timeframe === 'week' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => onTimeframeChange('week')}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={timeframe === 'month' ? 'solid' : 'outline'}
                colorScheme="blue"
                onClick={() => onTimeframeChange('month')}
              >
                Month
              </Button>
            </HStack>
            
            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={refreshing ? <Spinner size="xs" /> : <FiRefreshCw />}
                onClick={handleRefresh}
                isLoading={refreshing}
                loadingText="Updating"
              >
                Refresh
              </Button>
            </HStack>
            
            {lastUpdated && (
              <HStack spacing={1} color="gray.500" fontSize="xs">
                <FiClock />
                <Text>Updated {formatLastUpdated(lastUpdated)}</Text>
              </HStack>
            )}
          </VStack>
        </HStack>
      </Box>

      {/* Loading State */}
      {loading && (
        <Alert status="info">
          <AlertIcon />
          <Box flex="1">
            <Text>Generating AI insights...</Text>
            <Text fontSize="sm" color="gray.600">
              This may take a few moments while we analyze your nutrition data.
            </Text>
          </Box>
        </Alert>
      )}

      {/* Trends Section */}
      {!loading && trends.length > 0 && (
        <TrendsCard
          title="Nutrition Trends"
          trends={trends}
          timeframe={timeframe}
        />
      )}

      {/* High Priority Insights */}
      {!loading && highPriorityInsights.length > 0 && (
        <Box>
          <HStack mb={4} align="center">
            <Heading size="md">🚨 High Priority Insights</Heading>
            <Badge colorScheme="red" variant="solid">
              Action Needed
            </Badge>
          </HStack>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            {highPriorityInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Medium Priority Insights */}
      {!loading && mediumPriorityInsights.length > 0 && (
        <Box>
          <Heading size="md" mb={4}>
            💡 Key Insights
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={4}>
            {mediumPriorityInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Low Priority Insights */}
      {!loading && lowPriorityInsights.length > 0 && (
        <Box>
          <Heading size="md" mb={4}>
            📈 Additional Insights
          </Heading>
          <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} spacing={4}>
            {lowPriorityInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* No Data State */}
      {!loading && insights.length === 0 && (
        <Alert status="info">
          <AlertIcon />
          <Box flex="1">
            <Text fontWeight="medium">Ready to Generate Insights</Text>
            <Text fontSize="sm">
              Start logging your meals to receive personalized AI-powered insights about your nutrition patterns, 
              goal progress, and recommendations for improvement.
            </Text>
          </Box>
        </Alert>
      )}
    </VStack>
  )
}
