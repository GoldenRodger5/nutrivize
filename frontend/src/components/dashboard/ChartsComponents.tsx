import { Box, Heading, VStack, HStack, Text, useColorModeValue, useBreakpointValue, Spinner, Alert, AlertIcon } from '@chakra-ui/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { useState, useEffect } from 'react'
import api from '../../utils/api'

interface WeightData {
  date: string
  weight: number
  bodyFat?: number
}

interface NutritionTrend {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export const WeightTrendChart = () => {
  const [data, setData] = useState<WeightData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, md: false })

  useEffect(() => {
    const fetchWeightData = async () => {
      try {
        setLoading(true)
        const response = await api.get('/weight-logs/')
        const weightLogs = response.data || []
        
        // Transform data for chart
        const chartData = weightLogs
          .slice(-30) // Last 30 entries
          .map((log: any) => ({
            date: new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weight: log.weight_lbs,
            bodyFat: log.body_fat_percentage
          }))
        
        setData(chartData)
      } catch (err: any) {
        console.error('Error fetching weight data:', err)
        setError('Failed to load weight data')
      } finally {
        setLoading(false)
      }
    }

    fetchWeightData()
  }, [])

  if (loading) return <Spinner />
  if (error) return (
    <Alert status="error">
      <AlertIcon />
      {error}
    </Alert>
  )

  return (
    <Box bg={bg} p={isMobile ? 4 : 6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
      <VStack spacing={4} align="stretch">
        <Heading size={isMobile ? "sm" : "md"} color="blue.600">
          Weight Trend ({isMobile ? "30d" : "30 Days"})
        </Heading>
        
        {data.length > 0 ? (
          <Box h={isMobile ? "250px" : "300px"}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value}${name === 'weight' ? ' lbs' : '%'}`, 
                    name === 'weight' ? 'Weight' : 'Body Fat'
                  ]}
                  contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#3182ce" 
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ fill: '#3182ce', strokeWidth: 2, r: isMobile ? 3 : 4 }}
                />
                {data.some(d => d.bodyFat) && (
                  <Line 
                    type="monotone" 
                    dataKey="bodyFat" 
                    stroke="#e53e3e" 
                    strokeWidth={isMobile ? 1.5 : 2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#e53e3e', strokeWidth: 2, r: isMobile ? 2 : 3 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Text color="gray.500" textAlign="center" py={8}>
            No weight data available. Start logging your weight to see trends!
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export const NutritionTrendChart = () => {
  const [data, setData] = useState<NutritionTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    const fetchNutritionTrends = async () => {
      try {
        setLoading(true)
        const response = await api.get('/analytics/nutrition-trends?days=7')
        const trends = response.data || []
        
        setData(trends)
      } catch (err: any) {
        console.error('Error fetching nutrition trends:', err)
        setError('Failed to load nutrition trends')
      } finally {
        setLoading(false)
      }
    }

    fetchNutritionTrends()
  }, [])

  if (loading) return <Spinner />
  if (error) return (
    <Alert status="error">
      <AlertIcon />
      {error}
    </Alert>
  )

  return (
    <Box bg={bg} p={6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
      <VStack spacing={4} align="stretch">
        <Heading size="md" color="green.600">Nutrition Trends (7 Days)</Heading>
        
        {data.length > 0 ? (
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value}${name === 'calories' ? ' cal' : 'g'}`, 
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Bar dataKey="calories" fill="#38a169" />
                <Bar dataKey="protein" fill="#3182ce" />
                <Bar dataKey="carbs" fill="#d69e2e" />
                <Bar dataKey="fat" fill="#e53e3e" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Text color="gray.500" textAlign="center" py={8}>
            No nutrition data available. Start logging meals to see trends!
          </Text>
        )}
      </VStack>
    </Box>
  )
}

export const MacroDistributionChart = ({ nutrition }: { nutrition: any }) => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  if (!nutrition) return null

  const data = [
    { name: 'Protein', value: nutrition.protein?.current || 0, color: '#3182ce' },
    { name: 'Carbs', value: nutrition.carbs?.current || 0, color: '#d69e2e' },
    { name: 'Fat', value: nutrition.fat?.current || 0, color: '#e53e3e' }
  ]

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Box bg={bg} p={6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
      <VStack spacing={4} align="stretch">
        <Heading size="md" color="purple.600">Today's Macro Distribution</Heading>
        
        {total > 0 ? (
          <HStack spacing={6} align="center">
            <Box h="200px" flex="1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}g`}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}g`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            
            <VStack spacing={2} align="start">
              {data.map((item) => (
                <HStack key={item.name} spacing={2}>
                  <Box w={4} h={4} bg={item.color} borderRadius="sm" />
                  <Text fontSize="sm">
                    <Text as="span" fontWeight="bold">{item.name}:</Text> {item.value}g
                  </Text>
                </HStack>
              ))}
            </VStack>
          </HStack>
        ) : (
          <Text color="gray.500" textAlign="center" py={8}>
            No macro data available for today. Start logging meals!
          </Text>
        )}
      </VStack>
    </Box>
  )
}
