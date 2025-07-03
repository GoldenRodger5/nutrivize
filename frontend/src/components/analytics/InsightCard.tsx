import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Badge,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import { 
  FiTrendingUp, 
  FiTarget, 
  FiHeart, 
  FiStar,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi'

export interface Insight {
  id: string
  title: string
  content: string
  category: 'nutrition' | 'habits' | 'progress' | 'recommendation'
  importance: 1 | 2 | 3
}

interface InsightCardProps {
  insight: Insight
}

const getCategoryConfig = (category: string, importance: number) => {
  const configs = {
    nutrition: {
      icon: FiHeart,
      color: 'green',
      bgColor: 'green.50',
      borderColor: 'green.200',
    },
    habits: {
      icon: FiTrendingUp,
      color: 'blue',
      bgColor: 'blue.50',
      borderColor: 'blue.200',
    },
    progress: {
      icon: FiTarget,
      color: 'purple',
      bgColor: 'purple.50',
      borderColor: 'purple.200',
    },
    recommendation: {
      icon: importance === 3 ? FiAlertCircle : FiInfo,
      color: importance === 3 ? 'red' : 'orange',
      bgColor: importance === 3 ? 'red.50' : 'orange.50',
      borderColor: importance === 3 ? 'red.200' : 'orange.200',
    }
  }

  return configs[category as keyof typeof configs] || configs.recommendation
}

const getImportanceLabel = (importance: number) => {
  switch (importance) {
    case 3: return { label: 'High Priority', color: 'red' }
    case 2: return { label: 'Medium', color: 'orange' }
    case 1: return { label: 'Low', color: 'gray' }
    default: return { label: 'Info', color: 'gray' }
  }
}

export default function InsightCard({ insight }: InsightCardProps) {
  const { icon: IconComponent, color, bgColor, borderColor } = getCategoryConfig(insight.category, insight.importance)
  const { label: importanceLabel, color: importanceColor } = getImportanceLabel(insight.importance)
  
  const cardBg = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColorMode = useColorModeValue(borderColor, 'gray.600')
  const categoryBg = useColorModeValue(bgColor, `${color}.900`)

  return (
    <Card 
      bg={cardBg}
      borderWidth={2}
      borderColor={borderColorMode}
      _hover={{ 
        transform: 'translateY(-2px)',
        shadow: 'lg',
        borderColor: `${color}.300`
      }}
      transition="all 0.2s"
    >
      <CardBody>
        <HStack spacing={3} align="start" mb={3}>
          <Box
            p={2}
            bg={categoryBg}
            borderRadius="md"
            color={`${color}.600`}
          >
            <Icon as={IconComponent} boxSize={4} />
          </Box>
          <Box flex={1}>
            <HStack justify="space-between" align="start" mb={2}>
              <Heading size="sm" lineHeight="short">
                {insight.title}
              </Heading>
              <Badge
                colorScheme={importanceColor}
                variant="subtle"
                size="sm"
              >
                {importanceLabel}
              </Badge>
            </HStack>
            <HStack mb={3}>
              <Badge 
                colorScheme={color} 
                variant="outline" 
                size="sm"
                textTransform="capitalize"
              >
                {insight.category}
              </Badge>
              {insight.importance === 3 && (
                <HStack spacing={1}>
                  <Icon as={FiStar} color="yellow.500" boxSize={3} />
                  <Text fontSize="xs" color="yellow.600" fontWeight="medium">
                    Action Needed
                  </Text>
                </HStack>
              )}
            </HStack>
          </Box>
        </HStack>
        
        <Text color={textColor} fontSize="sm" lineHeight="relaxed">
          {insight.content}
        </Text>
      </CardBody>
    </Card>
  )
}
