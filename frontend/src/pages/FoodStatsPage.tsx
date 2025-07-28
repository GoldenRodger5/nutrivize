import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
  Progress,
} from '@chakra-ui/react'
import { FiDatabase, FiTrendingUp, FiUsers, FiClock } from 'react-icons/fi'
import api from '../utils/api'

interface FoodStatsData {
  total_foods: number
  user_foods: number
  public_foods: number
  categories: { [key: string]: number }
  recent_additions: number
  avg_calories_per_food: number
  nutrition_completeness: number
  popular_categories: Array<{ category: string; count: number }>
  user_activity: {
    foods_logged_today: number
    foods_logged_this_week: number
    favorite_foods_count: number
  }
}

const FoodStatsPage: React.FC = () => {
  const [stats, setStats] = useState<FoodStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const statBg = useColorModeValue('gray.50', 'gray.700')

  useEffect(() => {
    fetchFoodStats()
  }, [])

  const fetchFoodStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/food-stats/stats')
      setStats(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch food statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4} align="center" justify="center" minH="40vh">
          <Spinner size="xl" color="blue.500" />
          <Text>Loading food statistics...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Container>
    )
  }

  if (!stats) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <AlertDescription>No statistics available</AlertDescription>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" color="blue.500" mb={2}>
            📊 Food Database Statistics
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Comprehensive insights into the Nutrivize food database
          </Text>
        </Box>

        {/* Main Statistics Grid */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
          <GridItem>
            <Card bg={bg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Foods</StatLabel>
                  <StatNumber color="blue.500">{stats.total_foods.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    <HStack>
                      <FiDatabase />
                      <Text>Available in database</Text>
                    </HStack>
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg={bg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Your Foods</StatLabel>
                  <StatNumber color="green.500">{stats.user_foods.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    <HStack>
                      <FiUsers />
                      <Text>Custom foods created</Text>
                    </HStack>
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg={bg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Recent Additions</StatLabel>
                  <StatNumber color="purple.500">{stats.recent_additions.toLocaleString()}</StatNumber>
                  <StatHelpText>
                    <HStack>
                      <FiClock />
                      <Text>Added this week</Text>
                    </HStack>
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem>
            <Card bg={bg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Avg Calories</StatLabel>
                  <StatNumber color="orange.500">{Math.round(stats.avg_calories_per_food)}</StatNumber>
                  <StatHelpText>
                    <HStack>
                      <FiTrendingUp />
                      <Text>Per food item</Text>
                    </HStack>
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* User Activity Section */}
        <Card bg={bg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="green.500">Your Activity</Heading>
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                <Box p={4} bg={statBg} borderRadius="md">
                  <Text fontSize="sm" color="gray.600">Foods Logged Today</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {stats.user_activity.foods_logged_today}
                  </Text>
                </Box>
                <Box p={4} bg={statBg} borderRadius="md">
                  <Text fontSize="sm" color="gray.600">Foods Logged This Week</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {stats.user_activity.foods_logged_this_week}
                  </Text>
                </Box>
                <Box p={4} bg={statBg} borderRadius="md">
                  <Text fontSize="sm" color="gray.600">Favorite Foods</Text>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                    {stats.user_activity.favorite_foods_count}
                  </Text>
                </Box>
              </Grid>
            </VStack>
          </CardBody>
        </Card>

        {/* Popular Categories */}
        {stats.popular_categories && stats.popular_categories.length > 0 && (
          <Card bg={bg} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="purple.500">Popular Food Categories</Heading>
                <VStack spacing={3} align="stretch">
                  {stats.popular_categories.slice(0, 10).map((category, index) => (
                    <Box key={category.category}>
                      <HStack justify="space-between" mb={1}>
                        <HStack>
                          <Badge colorScheme="purple" variant="subtle">#{index + 1}</Badge>
                          <Text fontWeight="medium">{category.category}</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          {category.count.toLocaleString()} foods
                        </Text>
                      </HStack>
                      <Progress
                        value={(category.count / stats.popular_categories[0].count) * 100}
                        colorScheme="purple"
                        size="sm"
                        borderRadius="full"
                      />
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Data Quality */}
        <Card bg={bg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="orange.500">Data Quality</Heading>
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text>Nutrition Data Completeness</Text>
                  <Badge colorScheme={stats.nutrition_completeness > 80 ? "green" : "orange"}>
                    {Math.round(stats.nutrition_completeness)}%
                  </Badge>
                </HStack>
                <Progress
                  value={stats.nutrition_completeness}
                  colorScheme={stats.nutrition_completeness > 80 ? "green" : "orange"}
                  size="lg"
                  borderRadius="full"
                />
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Percentage of foods with complete nutritional information
                </Text>
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Actions */}
        <Card bg={bg} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md">Quick Actions</Heading>
              <HStack spacing={4} wrap="wrap" justify="center">
                <Button colorScheme="blue" onClick={fetchFoodStats}>
                  Refresh Statistics
                </Button>
                <Button colorScheme="green" variant="outline" onClick={() => window.open('/food-index', '_self')}>
                  Browse Foods
                </Button>
                <Button colorScheme="purple" variant="outline" onClick={() => window.open('/analytics', '_self')}>
                  View Analytics
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}

export default FoodStatsPage
