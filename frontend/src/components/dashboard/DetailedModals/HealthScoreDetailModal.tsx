import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Progress,
  Badge,
  CircularProgress,
  CircularProgressLabel,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useColorModeValue,
  Divider,
  List,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useBreakpointValue,
} from '@chakra-ui/react'
import { FiHeart, FiTrendingUp, FiTarget, FiInfo, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'
import { useEnhancedHealthScore } from '../../../hooks/useEnhancedAIHealth'

interface HealthScoreDetailModalProps {
  isOpen: boolean
  onClose: () => void
}

const HealthScoreDetailModal: React.FC<HealthScoreDetailModalProps> = ({ isOpen, onClose }) => {
  // All hooks must be called at the top level, before any conditional returns
  const { enhancedHealthScore, loading, error, refreshHealthScore } = useEnhancedHealthScore()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const trackColor = useColorModeValue('gray.100', 'gray.700')
  const scoreBg = useColorModeValue('gray.50', 'gray.700')
  const yellowBg = useColorModeValue('yellow.50', 'yellow.900')
  const isMobile = useBreakpointValue({ base: true, lg: false })
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'red'
  }
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Very Good'
    if (score >= 70) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <FiTrendingUp color="green" />
      case 'declining':
        return <FiTrendingUp color="red" style={{ transform: 'rotate(180deg)' }} />
      default:
        return <FiTarget color="gray" />
    }
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"}>
        <ModalOverlay />
        <ModalContent m={isMobile ? 0 : undefined} maxH={isMobile ? "100vh" : undefined}>
          <ModalHeader>Health Score Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} py={8}>
              <CircularProgress isIndeterminate color="blue.400" />
              <Text>Analyzing your health data...</Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  if (error || !enhancedHealthScore) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"}>
        <ModalOverlay />
        <ModalContent m={isMobile ? 0 : undefined} maxH={isMobile ? "100vh" : undefined}>
          <ModalHeader>Health Score Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Unable to load health score data</AlertTitle>
              <AlertDescription>
                Please make sure you have logged some nutrition data and try again.
              </AlertDescription>
            </Alert>
          </ModalBody>
        </ModalContent>
      </Modal>
    )
  }

  const score = enhancedHealthScore.overall_score
  const colorScheme = getScoreColor(score)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={isMobile ? "full" : "xl"} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent 
        maxW={isMobile ? "100vw" : "900px"}
        m={isMobile ? 0 : undefined}
        maxH={isMobile ? "100vh" : undefined}
        borderRadius={isMobile ? 0 : "lg"}
      >
        <ModalHeader>
          <HStack spacing={3}>
            <FiHeart color={`var(--chakra-colors-${colorScheme}-500)`} />
            <Text fontSize={isMobile ? "lg" : "xl"}>Health Score Analysis</Text>
            {getTrendIcon(enhancedHealthScore.trend)}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={isMobile ? 4 : 6} align="stretch">
            {/* Overall Score */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <VStack spacing={4}>
                  <HStack spacing={isMobile ? 4 : 6} w="full" justify="center" flexDirection={isMobile ? "column" : "row"}>
                    <CircularProgress 
                      value={score} 
                      size={isMobile ? "100px" : "120px"} 
                      thickness="8px"
                      color={`${colorScheme}.400`}
                      trackColor={trackColor}
                    >
                      <CircularProgressLabel>
                        <VStack spacing={0}>
                          <Text fontSize={isMobile ? "2xl" : "3xl"} fontWeight="bold" color={`${colorScheme}.600`}>
                            {score}
                          </Text>
                          <Text fontSize="sm" color="gray.500">/100</Text>
                        </VStack>
                      </CircularProgressLabel>
                    </CircularProgress>
                    
                    <VStack align="start" spacing={2}>
                      <Badge 
                        colorScheme={colorScheme} 
                        variant="solid"
                        fontSize="md"
                        px={3}
                        py={1}
                      >
                        {getScoreLabel(score)}
                      </Badge>
                      <HStack>
                        {getTrendIcon(enhancedHealthScore.trend)}
                        <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                          {enhancedHealthScore.trend} trend
                        </Text>
                      </HStack>
                      <Button
                        size={isMobile ? "sm" : "md"}
                        colorScheme={colorScheme}
                        variant="outline"
                        onClick={refreshHealthScore}
                        leftIcon={<FiTrendingUp />}
                        w={isMobile ? "full" : "auto"}
                      >
                        Refresh Score
                      </Button>
                    </VStack>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Component Scores */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Heading size={isMobile ? "sm" : "md"} mb={4}>Score Breakdown</Heading>
                <SimpleGrid columns={{ base: 1, md: isMobile ? 1 : 2 }} spacing={4}>
                  {Object.entries(enhancedHealthScore.component_scores).map(([component, score]) => (
                    <Box key={component} p={4} borderRadius="lg" bg={scoreBg}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium" textTransform="capitalize">
                          {component.replace('_', ' ')}
                        </Text>
                        <Text fontWeight="bold" color={`${getScoreColor(score)}.600`}>
                          {score}/100
                        </Text>
                      </HStack>
                      <Progress 
                        value={score} 
                        colorScheme={getScoreColor(score)} 
                        size="lg"
                        borderRadius="full"
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* AI Insights */}
            <Card bg={bg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Heading size="md" mb={4}>AI Health Insights</Heading>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <FiInfo />
                          <Text fontWeight="medium">Short-term Insights</Text>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <Text>{enhancedHealthScore.ai_insights.short_term_insights}</Text>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <FiTarget />
                          <Text fontWeight="medium">Long-term Recommendations</Text>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <Text>{enhancedHealthScore.ai_insights.long_term_recommendations}</Text>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <FiHeart />
                          <Text fontWeight="medium">Nutrition Insights</Text>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <Text>{enhancedHealthScore.ai_insights.nutrition_insights}</Text>
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <FiTrendingUp />
                          <Text fontWeight="medium">Lifestyle Insights</Text>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <Text>{enhancedHealthScore.ai_insights.lifestyle_insights}</Text>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </CardBody>
            </Card>

            {/* Improvement Areas */}
            {enhancedHealthScore.improvement_areas.length > 0 && (
              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody>
                  <Heading size="md" mb={4}>Areas for Improvement</Heading>
                  <VStack spacing={4} align="stretch">
                    {enhancedHealthScore.improvement_areas.map((area, index) => (
                      <Box 
                        key={index} 
                        p={4} 
                        borderRadius="lg" 
                        bg={yellowBg}
                        borderLeft="4px solid"
                        borderLeftColor="yellow.400"
                      >
                        <HStack justify="space-between" mb={2}>
                          <Text fontWeight="bold" color="yellow.800">
                            {area.area}
                          </Text>
                          <Badge colorScheme="yellow" variant="subtle">
                            Score: {area.score}/100
                          </Badge>
                        </HStack>
                        <List spacing={1}>
                          {area.recommendations.map((rec, recIndex) => (
                            <ListItem key={recIndex} fontSize="sm">
                              <ListIcon as={FiAlertTriangle} color="yellow.500" />
                              {rec}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Next Steps */}
            {enhancedHealthScore.ai_insights.next_steps.length > 0 && (
              <Card bg={bg} borderColor={borderColor} borderWidth={1}>
                <CardBody>
                  <Heading size="md" mb={4}>Your Next Steps</Heading>
                  <List spacing={2}>
                    {enhancedHealthScore.ai_insights.next_steps.map((step, index) => (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={FiCheckCircle} color="green.500" />
                        <Text>{step}</Text>
                      </ListItem>
                    ))}
                  </List>
                </CardBody>
              </Card>
            )}

            <Divider />
            
            {/* Last Updated */}
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Last updated: {enhancedHealthScore.last_updated ? 
                new Date(enhancedHealthScore.last_updated).toLocaleString() : 
                'Just now'
              }
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default HealthScoreDetailModal
