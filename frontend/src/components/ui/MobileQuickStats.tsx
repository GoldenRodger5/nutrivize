import React from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  CircularProgress,
  CircularProgressLabel,
  Card,
  CardBody,
  Badge,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  IconButton,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react'
import { 
  FiTarget, 
  FiTrendingUp, 
  FiDroplet, 
  FiChevronRight 
} from 'react-icons/fi'
import { FaFire, FaBolt } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

interface NutritionTarget {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MobileQuickStatsProps {
  nutritionData?: NutritionData
  nutritionTargets?: NutritionTarget
  waterIntake?: number
  waterTarget?: number
  streakDays?: number
  isLoading?: boolean
}

const MobileQuickStats: React.FC<MobileQuickStatsProps> = ({
  nutritionData,
  nutritionTargets,
  waterIntake = 0,
  waterTarget = 2000,
  streakDays = 0,
  isLoading = false,
}) => {
  const navigate = useNavigate()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.100', 'gray.700')
  const accent = useColorModeValue('blue.500', 'blue.300')

  const caloriesPercent = nutritionTargets?.calories ? 
    Math.min(((nutritionData?.calories || 0) / nutritionTargets.calories) * 100, 100) : 0
  
  const proteinPercent = nutritionTargets?.protein ? 
    Math.min(((nutritionData?.protein || 0) / nutritionTargets.protein) * 100, 100) : 0

  const waterPercent = waterTarget ? 
    Math.min((waterIntake / waterTarget) * 100, 100) : 0

  if (isLoading) {
    return (
      <Card bg={bg} borderWidth={1} borderColor={borderColor}>
        <CardBody p={4}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Skeleton height="20px" width="120px" />
              <SkeletonCircle size="12" />
            </HStack>
            <SimpleGrid columns={2} spacing={4}>
              <SkeletonCircle size="20" />
              <SkeletonCircle size="20" />
            </SimpleGrid>
            <SimpleGrid columns={3} spacing={2}>
              <Skeleton height="60px" />
              <Skeleton height="60px" />
              <Skeleton height="60px" />
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card 
      bg={bg} 
      borderWidth={1} 
      borderColor={borderColor}
      shadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
    >
      <CardBody p={4}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold">
                Today's Progress
              </Text>
              <Text fontSize="sm" color="gray.500">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </VStack>
            
            <HStack spacing={2}>
              {streakDays > 0 && (
                <Badge colorScheme="orange" variant="subtle" px={2} py={1}>
                  <HStack spacing={1}>
                    <FaBolt size="12px" />
                    <Text fontSize="xs">{streakDays}d streak</Text>
                  </HStack>
                </Badge>
              )}
              <IconButton
                aria-label="View details"
                icon={<FiChevronRight />}
                size="sm"
                variant="ghost"
                onClick={() => navigate('/analytics')}
              />
            </HStack>
          </HStack>

          {/* Main Progress Circles */}
          <SimpleGrid columns={2} spacing={6}>
            {/* Calories */}
            <VStack spacing={3}>
              <Box position="relative">
                <CircularProgress 
                  value={caloriesPercent} 
                  size="90px" 
                  thickness="8px"
                  color="orange.400"
                  trackColor={useColorModeValue('gray.100', 'gray.600')}
                >
                  <CircularProgressLabel>
                    <VStack spacing={0}>
                      <Icon as={FaFire} color="orange.400" />
                      <Text fontSize="xs" fontWeight="bold">
                        {Math.round(caloriesPercent)}%
                      </Text>
                    </VStack>
                  </CircularProgressLabel>
                </CircularProgress>
              </Box>
              <VStack spacing={0}>
                <Text fontSize="sm" fontWeight="medium">
                  {nutritionData?.calories || 0} / {nutritionTargets?.calories || 0}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Calories
                </Text>
              </VStack>
            </VStack>

            {/* Water */}
            <VStack spacing={3}>
              <Box position="relative">
                <CircularProgress 
                  value={waterPercent} 
                  size="90px" 
                  thickness="8px"
                  color="blue.400"
                  trackColor={useColorModeValue('gray.100', 'gray.600')}
                >
                  <CircularProgressLabel>
                    <VStack spacing={0}>
                      <Icon as={FiDroplet} color="blue.400" />
                      <Text fontSize="xs" fontWeight="bold">
                        {Math.round(waterPercent)}%
                      </Text>
                    </VStack>
                  </CircularProgressLabel>
                </CircularProgress>
              </Box>
              <VStack spacing={0}>
                <Text fontSize="sm" fontWeight="medium">
                  {Math.round(waterIntake)} / {waterTarget}ml
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Water
                </Text>
              </VStack>
            </VStack>
          </SimpleGrid>

          {/* Macros Mini Stats */}
          <SimpleGrid columns={3} spacing={3}>
            <Card variant="outline" size="sm">
              <CardBody p={3} textAlign="center">
                <Stat size="sm">
                  <StatLabel fontSize="xs" color="gray.500">Protein</StatLabel>
                  <StatNumber fontSize="sm" color="green.500">
                    {nutritionData?.protein || 0}g
                  </StatNumber>
                  <StatHelpText fontSize="xs" m={0}>
                    {Math.round(proteinPercent)}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card variant="outline" size="sm">
              <CardBody p={3} textAlign="center">
                <Stat size="sm">
                  <StatLabel fontSize="xs" color="gray.500">Carbs</StatLabel>
                  <StatNumber fontSize="sm" color="blue.500">
                    {nutritionData?.carbs || 0}g
                  </StatNumber>
                  <StatHelpText fontSize="xs" m={0}>
                    {nutritionTargets?.carbs ? Math.round(((nutritionData?.carbs || 0) / nutritionTargets.carbs) * 100) : 0}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card variant="outline" size="sm">
              <CardBody p={3} textAlign="center">
                <Stat size="sm">
                  <StatLabel fontSize="xs" color="gray.500">Fat</StatLabel>
                  <StatNumber fontSize="sm" color="purple.500">
                    {nutritionData?.fat || 0}g
                  </StatNumber>
                  <StatHelpText fontSize="xs" m={0}>
                    {nutritionTargets?.fat ? Math.round(((nutritionData?.fat || 0) / nutritionTargets.fat) * 100) : 0}%
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Quick Actions */}
          <SimpleGrid columns={2} spacing={3}>
            <Card 
              variant="outline" 
              cursor="pointer" 
              onClick={() => navigate('/food-log')}
              _hover={{ borderColor: accent, shadow: 'md' }}
              transition="all 0.2s"
            >
              <CardBody p={3}>
                <HStack>
                  <Icon as={FiTarget} color={accent} />
                  <Text fontSize="sm" fontWeight="medium">
                    Log Food
                  </Text>
                </HStack>
              </CardBody>
            </Card>

            <Card 
              variant="outline" 
              cursor="pointer" 
              onClick={() => navigate('/goals')}
              _hover={{ borderColor: accent, shadow: 'md' }}
              transition="all 0.2s"
            >
              <CardBody p={3}>
                <HStack>
                  <Icon as={FiTrendingUp} color={accent} />
                  <Text fontSize="sm" fontWeight="medium">
                    View Goals
                  </Text>
                </HStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </CardBody>
    </Card>
  )
}

export default MobileQuickStats
