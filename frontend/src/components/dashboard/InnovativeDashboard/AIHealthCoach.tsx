import { useState, useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  Badge,
  Button,
  Avatar,
  IconButton,
  useColorModeValue,
  Flex,
  useToast,
  Textarea
} from '@chakra-ui/react'
import { FaMicrophone, FaPaperPlane, FaChartLine } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import AIResponseFormatter from '../AIResponseFormatter'

const MotionBox = motion(Box)
const MotionText = motion(Text)

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'insight' | 'warning' | 'success' | 'question'
  metadata?: any
}

interface AIHealthCoachProps {
  coaching: any
  onAskQuestion: (question: string) => Promise<any>
}

export default function AIHealthCoach({ coaching, onAskQuestion }: AIHealthCoachProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const aiGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  // Initialize with AI greeting
  useEffect(() => {
    if (coaching && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        text: `Hey there! 👋 I'm your AI Health Coach. ${coaching.personalizedInsight}`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'insight'
      }
      setMessages([welcomeMessage])
    }
  }, [coaching])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {
      const response = await onAskQuestion(inputText)
      
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.answer || "I'm analyzing your nutrition data to provide the best advice. Could you be more specific about what you'd like to know?",
          sender: 'ai',
          timestamp: new Date(),
          type: response.type || 'insight'
        }
        setMessages(prev => [...prev, aiMessage])
        setIsTyping(false)
      }, 1500) // Simulate thinking time
    } catch (error) {
      setIsTyping(false)
      toast({
        title: "Sorry, I'm having trouble right now",
        description: "Please try again in a moment",
        status: "error",
        duration: 3000
      })
    }
  }

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice recognition",
        status: "warning",
        duration: 3000
      })
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputText(transcript)
    }

    recognition.start()
  }

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'warning': return '⚠️'
      case 'success': return '✅'
      case 'question': return '❓'
      default: return '💡'
    }
  }

  const quickActions = [
    "How can I improve my protein intake?",
    "What should I eat for my next meal?",
    "Am I on track with my goals?",
    "Analyze my eating patterns",
    "Create a meal plan for tomorrow"
  ]

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth={1} boxShadow="2xl" overflow="hidden">
      <CardBody p={0}>
        {/* Header */}
        <Box p={6} bg={aiGradient} color="white">
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Avatar
                size="lg"
                bg="whiteAlpha.200"
                icon={<Text fontSize="2xl">🤖</Text>}
              />
              <VStack align="start" spacing={1}>
                <Heading size="md">AI Health Coach</Heading>
                <HStack>
                  <Badge colorScheme="green" variant="solid">Live Analysis</Badge>
                  <Badge colorScheme="purple" variant="solid">
                    {coaching?.aiConfidence || 94}% Confidence
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
            <Button
              colorScheme="whiteAlpha"
              variant="outline"
              onClick={() => setShowChat(!showChat)}
            >
              {showChat ? 'Hide Chat' : 'Chat with AI'}
            </Button>
          </HStack>
        </Box>

        {/* Health Insights Panel */}
        <Box p={6}>
          <VStack spacing={4} align="stretch">
            {/* Urgent Actions */}
            {coaching?.urgentAction && (
              <MotionBox
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  p={4}
                  borderRadius="xl"
                  bg="orange.50"
                  border="2px"
                  borderColor="orange.200"
                  position="relative"
                  overflow="hidden"
                >
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    h="3px"
                    bg="linear-gradient(90deg, orange.400, red.400)"
                  />
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="bold" color="orange.600">
                        🚨 Urgent Action Needed
                      </Text>
                      <Text fontSize="sm">{coaching.urgentAction}</Text>
                    </VStack>
                    <Button size="sm" colorScheme="orange">
                      Fix Now
                    </Button>
                  </HStack>
                </Box>
              </MotionBox>
            )}

            {/* Weekly Trend */}
            <HStack justify="space-between" p={4} borderRadius="lg" bg={useColorModeValue('green.50', 'green.900')}>
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="green.600" fontWeight="bold">Weekly Trend</Text>
                <MotionText
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {coaching?.weeklyTrend || "Your consistency is improving!"}
                </MotionText>
              </VStack>
              <IconButton
                aria-label="View trends"
                icon={<FaChartLine />}
                size="sm"
                colorScheme="green"
                variant="outline"
              />
            </HStack>

            {/* Next Optimization */}
            <Box p={4} borderRadius="lg" bg={useColorModeValue('blue.50', 'blue.900')}>
              <Text fontSize="sm" color="blue.600" fontWeight="bold" mb={2}>
                🎯 Tomorrow's Optimization
              </Text>
              <Text fontSize="sm">{coaching?.nextOptimization || "Keep tracking your meals!"}</Text>
            </Box>
          </VStack>
        </Box>

        {/* Chat Interface */}
        <AnimatePresence>
          {showChat && (
            <MotionBox
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              borderTop="1px"
              borderColor={borderColor}
            >
              {/* Quick Actions */}
              <Box p={4} borderBottom="1px" borderColor={borderColor}>
                <Text fontSize="sm" fontWeight="bold" mb={3}>Quick Questions:</Text>
                <HStack spacing={2} overflowX="auto" pb={2}>
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      size="xs"
                      variant="outline"
                      colorScheme="purple"
                      minW="fit-content"
                      onClick={() => setInputText(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </HStack>
              </Box>

              {/* Messages */}
              <Box h="300px" overflowY="auto" p={4}>
                <VStack spacing={3} align="stretch">
                  {messages.map((message, index) => (
                    <MotionBox
                      key={message.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Flex justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}>
                        <Box
                          maxW="80%"
                          p={3}
                          borderRadius="xl"
                          bg={message.sender === 'user' 
                            ? 'purple.500' 
                            : useColorModeValue('gray.100', 'gray.700')
                          }
                          color={message.sender === 'user' ? 'white' : 'inherit'}
                        >
                          {message.sender === 'ai' && (
                            <HStack mb={1}>
                              <Text fontSize="xs">{getMessageIcon(message.type)}</Text>
                              <Text fontSize="xs" fontWeight="bold">AI Coach</Text>
                            </HStack>
                          )}
                          {message.sender === 'ai' ? (
                            <AIResponseFormatter 
                              content={message.text}
                              fontSize="sm"
                            />
                          ) : (
                            <Text fontSize="sm">{message.text}</Text>
                          )}
                        </Box>
                      </Flex>
                    </MotionBox>
                  ))}
                  
                  {isTyping && (
                    <Flex justify="flex-start">
                      <Box
                        p={3}
                        borderRadius="xl"
                        bg={useColorModeValue('gray.100', 'gray.700')}
                      >
                        <HStack>
                          <Text fontSize="xs">🤖</Text>
                          <Text fontSize="sm">AI is thinking...</Text>
                        </HStack>
                      </Box>
                    </Flex>
                  )}
                  <div ref={messagesEndRef} />
                </VStack>
              </Box>

              {/* Input */}
              <Box p={4} borderTop="1px" borderColor={borderColor}>
                <HStack spacing={2}>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask your AI health coach anything..."
                    size="sm"
                    resize="none"
                    rows={1}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  />
                  <VStack spacing={1}>
                    <IconButton
                      aria-label="Voice input"
                      icon={<FaMicrophone />}
                      size="sm"
                      colorScheme={isListening ? "red" : "gray"}
                      onClick={startVoiceRecognition}
                      isLoading={isListening}
                    />
                    <IconButton
                      aria-label="Send message"
                      icon={<FaPaperPlane />}
                      size="sm"
                      colorScheme="purple"
                      onClick={handleSendMessage}
                      disabled={!inputText.trim()}
                    />
                  </VStack>
                </HStack>
              </Box>
            </MotionBox>
          )}
        </AnimatePresence>
      </CardBody>
    </Card>
  )
}
