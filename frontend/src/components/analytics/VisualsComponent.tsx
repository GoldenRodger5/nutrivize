import { useState, useEffect } from 'react'
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
  Select,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  useColorModeValue,
  SimpleGrid,
  Icon,
  Flex,
  Spacer,
  Badge,
} from '@chakra-ui/react'
import { FiTrendingUp, FiBarChart, FiDownload, FiCalendar } from 'react-icons/fi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { motion } from 'framer-motion'
import api from '../../utils/api'

const MotionCard = motion(Card)

interface AnalyticsData {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  weight?: number
  water?: number
}

interface VisualsComponentProps {}

const VisualsComponent: React.FC<VisualsComponentProps> = () => {
  const [data, setData] = useState<AnalyticsData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Chart configuration
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'pie'>('line')
  const [xAxis, setXAxis] = useState('date')
  const [yAxis, setYAxis] = useState('calories')
  const [timeRange, setTimeRange] = useState('30') // days
  const [secondaryMetric, setSecondaryMetric] = useState<string>('')

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Chart colors
  const colors = {
    calories: '#FF6B6B',
    protein: '#4ECDC4',
    carbs: '#45B7D1', 
    fat: '#96CEB4',
    fiber: '#FFEAA7',
    weight: '#DDA0DD',
    water: '#87CEEB'
  }

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(timeRange))

      // Fetch food logs
      const foodLogsResponse = await api.get('/food-logs/range', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      })

      // Fetch weight logs
      const weightLogsResponse = await api.get('/weight-logs/range', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      }).catch(() => ({ data: [] })) // Handle if endpoint doesn't exist

      // Fetch water logs
      const waterLogsResponse = await api.get('/water-logs/range', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      }).catch(() => ({ data: [] })) // Handle if endpoint doesn't exist

      // Process and combine data
      const processedData = processAnalyticsData(
        foodLogsResponse.data || [],
        weightLogsResponse.data || [],
        waterLogsResponse.data || []
      )

      setData(processedData)
    } catch (err: any) {
      console.error('Error fetching analytics data:', err)
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (foodLogs: any[], weightLogs: any[], waterLogs: any[]): AnalyticsData[] => {
    const dataMap = new Map<string, AnalyticsData>()

    // Process food logs
    foodLogs.forEach(log => {
      const date = log.date
      const nutrition = log.nutrition || {}
      
      if (!dataMap.has(date)) {
        dataMap.set(date, {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        })
      }

      const dayData = dataMap.get(date)!
      dayData.calories += nutrition.calories || 0
      dayData.protein += nutrition.protein || 0
      dayData.carbs += nutrition.carbs || nutrition.carbohydrates || 0
      dayData.fat += nutrition.fat || 0
      dayData.fiber += nutrition.fiber || 0
    })

    // Process weight logs
    weightLogs.forEach(log => {
      const date = log.date
      if (dataMap.has(date)) {
        dataMap.get(date)!.weight = log.weight
      } else {
        dataMap.set(date, {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          weight: log.weight
        })
      }
    })

    // Process water logs
    const waterByDate = new Map<string, number>()
    waterLogs.forEach(log => {
      const date = log.date
      const current = waterByDate.get(date) || 0
      waterByDate.set(date, current + (log.amount || 0))
    })

    waterByDate.forEach((amount, date) => {
      if (dataMap.has(date)) {
        dataMap.get(date)!.water = amount
      } else {
        dataMap.set(date, {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          water: amount
        })
      }
    })

    // Convert to sorted array
    return Array.from(dataMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        // Format date for display
        date: new Date(item.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }))
  }

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <Box h="400px" display="flex" alignItems="center" justifyContent="center">
          <Text color="gray.500">No data available for the selected time range</Text>
        </Box>
      )
    }

    const chartProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={yAxis} 
                stroke={colors[yAxis as keyof typeof colors]} 
                strokeWidth={3}
                dot={{ fill: colors[yAxis as keyof typeof colors], strokeWidth: 2, r: 4 }}
                name={yAxis.charAt(0).toUpperCase() + yAxis.slice(1)}
              />
              {secondaryMetric && (
                <Line 
                  type="monotone" 
                  dataKey={secondaryMetric} 
                  stroke={colors[secondaryMetric as keyof typeof colors]} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={secondaryMetric.charAt(0).toUpperCase() + secondaryMetric.slice(1)}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey={yAxis} 
                fill={colors[yAxis as keyof typeof colors]}
                name={yAxis.charAt(0).toUpperCase() + yAxis.slice(1)}
              />
              {secondaryMetric && (
                <Bar 
                  dataKey={secondaryMetric} 
                  fill={colors[secondaryMetric as keyof typeof colors]}
                  name={secondaryMetric.charAt(0).toUpperCase() + secondaryMetric.slice(1)}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={yAxis} 
                stroke={colors[yAxis as keyof typeof colors]}
                fill={colors[yAxis as keyof typeof colors]}
                fillOpacity={0.6}
                name={yAxis.charAt(0).toUpperCase() + yAxis.slice(1)}
              />
              {secondaryMetric && (
                <Area 
                  type="monotone" 
                  dataKey={secondaryMetric} 
                  stroke={colors[secondaryMetric as keyof typeof colors]}
                  fill={colors[secondaryMetric as keyof typeof colors]}
                  fillOpacity={0.4}
                  name={secondaryMetric.charAt(0).toUpperCase() + secondaryMetric.slice(1)}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie':
        // For pie charts, show average values across the time period
        const avgData = Object.keys(colors).map(key => {
          const values = data.map(d => d[key as keyof AnalyticsData] as number).filter(v => v > 0)
          const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
          return {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: Math.round(avg * 100) / 100,
            color: colors[key as keyof typeof colors]
          }
        }).filter(item => item.value > 0)

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={avgData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {avgData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const exportData = () => {
    const csvContent = [
      // Header
      Object.keys(data[0] || {}).join(','),
      // Data rows
      ...data.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nutrivize-analytics-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8}>
          <Spinner size="xl" />
          <Text>Loading analytics data...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>
            Failed to load analytics: {error}
            <Button ml={4} size="sm" onClick={fetchAnalyticsData}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" mb={2}>Nutrition Analytics & Visuals</Heading>
            <Text color="gray.500">Comprehensive insights into your nutrition journey</Text>
          </Box>
          <Button leftIcon={<FiDownload />} onClick={exportData} variant="outline">
            Export Data
          </Button>
        </Flex>

        {/* Controls */}
        <MotionCard
          bg={cardBg}
          borderColor={borderColor}
          borderWidth={1}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CardHeader>
            <HStack>
              <Icon as={FiBarChart} />
              <Heading size="md">Chart Configuration</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Time Range</Text>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  size="sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="14">Last 2 weeks</option>
                  <option value="30">Last 30 days</option>
                  <option value="60">Last 2 months</option>
                  <option value="90">Last 3 months</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Chart Type</Text>
                <Select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                  size="sm"
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>X-Axis</Text>
                <Select
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value)}
                  size="sm"
                  disabled={chartType === 'pie'}
                >
                  <option value="date">Date</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Primary Metric</Text>
                <Select
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  size="sm"
                >
                  <option value="calories">Calories</option>
                  <option value="protein">Protein (g)</option>
                  <option value="carbs">Carbs (g)</option>
                  <option value="fat">Fat (g)</option>
                  <option value="fiber">Fiber (g)</option>
                  <option value="weight">Weight</option>
                  <option value="water">Water (fl oz)</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Secondary Metric</Text>
                <Select
                  value={secondaryMetric}
                  onChange={(e) => setSecondaryMetric(e.target.value)}
                  size="sm"
                  disabled={chartType === 'pie'}
                >
                  <option value="">None</option>
                  <option value="calories">Calories</option>
                  <option value="protein">Protein (g)</option>
                  <option value="carbs">Carbs (g)</option>
                  <option value="fat">Fat (g)</option>
                  <option value="fiber">Fiber (g)</option>
                  <option value="weight">Weight</option>
                  <option value="water">Water (fl oz)</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Data Points</Text>
                <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                  {data.length} days
                </Badge>
              </Box>
            </SimpleGrid>
          </CardBody>
        </MotionCard>

        {/* Chart */}
        <MotionCard
          bg={cardBg}
          borderColor={borderColor}
          borderWidth={1}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <CardHeader>
            <HStack>
              <Icon as={FiTrendingUp} />
              <Heading size="md">
                {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart: {yAxis.charAt(0).toUpperCase() + yAxis.slice(1)}
                {secondaryMetric && ` vs ${secondaryMetric.charAt(0).toUpperCase() + secondaryMetric.slice(1)}`}
              </Heading>
              <Spacer />
              <HStack>
                <Icon as={FiCalendar} color="gray.500" />
                <Text fontSize="sm" color="gray.500">
                  Last {timeRange} days
                </Text>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            {renderChart()}
          </CardBody>
        </MotionCard>

        {/* Summary Statistics */}
        <MotionCard
          bg={cardBg}
          borderColor={borderColor}
          borderWidth={1}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <CardHeader>
            <Heading size="md">Summary Statistics</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4, lg: 7 }} spacing={6}>
              {Object.keys(colors).map(metric => {
                const values = data.map(d => d[metric as keyof AnalyticsData] as number).filter(v => v > 0)
                if (values.length === 0) return null

                const avg = values.reduce((a, b) => a + b, 0) / values.length
                const max = Math.max(...values)
                const min = Math.min(...values)

                return (
                  <VStack key={metric} spacing={2} align="center">
                    <Box
                      w={4}
                      h={4}
                      bg={colors[metric as keyof typeof colors]}
                      borderRadius="sm"
                    />
                    <Text fontSize="xs" fontWeight="medium" textTransform="uppercase">
                      {metric}
                    </Text>
                    <VStack spacing={0}>
                      <Text fontSize="lg" fontWeight="bold">
                        {Math.round(avg * 10) / 10}
                      </Text>
                      <Text fontSize="xs" color="gray.500">avg</Text>
                    </VStack>
                    <HStack spacing={2}>
                      <VStack spacing={0}>
                        <Text fontSize="sm">{Math.round(min * 10) / 10}</Text>
                        <Text fontSize="xs" color="gray.500">min</Text>
                      </VStack>
                      <VStack spacing={0}>
                        <Text fontSize="sm">{Math.round(max * 10) / 10}</Text>
                        <Text fontSize="xs" color="gray.500">max</Text>
                      </VStack>
                    </HStack>
                  </VStack>
                )
              })}
            </SimpleGrid>
          </CardBody>
        </MotionCard>
      </VStack>
    </Container>
  )
}

export default VisualsComponent
