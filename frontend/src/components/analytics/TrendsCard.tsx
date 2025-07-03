import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Progress,
  HStack,
  Badge,
} from '@chakra-ui/react'

export interface TrendData {
  name: string
  value: number
  unit: string
  trend?: number
  trend_direction?: 'up' | 'down' | 'same'
  target?: number
  target_unit?: string
}

interface TrendsCardProps {
  title: string
  trends: TrendData[]
  timeframe: string
}

export default function TrendsCard({ title, trends, timeframe }: TrendsCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const getProgressValue = (current: number, target?: number) => {
    if (!target || target === 0) return 0
    return Math.min((current / target) * 100, 100)
  }

  const getProgressColorScheme = (current: number, target?: number) => {
    if (!target) return 'gray'
    const percentage = (current / target) * 100
    if (percentage >= 90) return 'green'
    if (percentage >= 70) return 'yellow'
    return 'red'
  }

  return (
    <Card bg={cardBg} borderColor={borderColor}>
      <CardBody>
        <Box mb={4}>
          <HStack justify="space-between" align="center" mb={2}>
            <Heading size="md">{title}</Heading>
            <Badge colorScheme="blue" variant="subtle">
              {timeframe}
            </Badge>
          </HStack>
          <Text color="gray.600" fontSize="sm">
            Track your nutrition metrics over time
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: trends.length > 3 ? 4 : trends.length }} spacing={4}>
          {trends.map((trend, index) => (
            <Stat key={index}>
              <StatLabel fontSize="sm" color="gray.600">
                {trend.name}
              </StatLabel>
              <StatNumber fontSize="2xl">
                {typeof trend.value === 'number' ? trend.value.toFixed(1) : trend.value}
                <Text as="span" fontSize="sm" color="gray.500" ml={1}>
                  {trend.unit}
                </Text>
              </StatNumber>
              
              {/* Trend Information */}
              {trend.trend !== undefined && trend.trend_direction && (
                <StatHelpText>
                  <StatArrow type={trend.trend_direction === 'up' ? 'increase' : 'decrease'} />
                  {Math.abs(trend.trend).toFixed(1)}% from last period
                </StatHelpText>
              )}

              {/* Target Progress */}
              {trend.target && (
                <Box mt={2}>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Target: {trend.target} {trend.target_unit || trend.unit}
                  </Text>
                  <Progress
                    value={getProgressValue(trend.value, trend.target)}
                    colorScheme={getProgressColorScheme(trend.value, trend.target)}
                    size="sm"
                    borderRadius="md"
                  />
                </Box>
              )}
            </Stat>
          ))}
        </SimpleGrid>

        {trends.length === 0 && (
          <Text color="gray.500" textAlign="center" py={8}>
            No trend data available for this period. Keep logging your meals to see meaningful trends!
          </Text>
        )}
      </CardBody>
    </Card>
  )
}
