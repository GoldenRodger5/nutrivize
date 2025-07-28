import { useState } from 'react'
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Avatar,
  useDisclosure,
  useColorModeValue,
  Flex,
  Spacer,
  Badge,
  Spinner,
} from '@chakra-ui/react'
import { FiMessageCircle, FiSend } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import api from '../../utils/api'

const MotionBox = motion(Box)

interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface PersistentAIChatProps {}

const PersistentAIChat: React.FC<PersistentAIChatProps> = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const aiMessageBg = useColorModeValue('blue.50', 'blue.900')
  const userMessageBg = useColorModeValue('gray.100', 'gray.700')

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        content: "Hi! I'm your AI nutrition assistant. I can help you with meal suggestions, nutrition questions, food logging tips, and analyze your dietary patterns. What would you like to know?",
        sender: 'ai',
        timestamp: new Date()
      }])
    }
  }, [isOpen, messages.length])

  // Mark messages as read when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false)
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Send to AI service
      const response = await api.post('/ai/chat', {
        message: userMessage.content,
        context: 'nutrition_assistant' // Specify this is a general nutrition assistance chat
      })

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.data.response || "I'm sorry, I couldn't process that request right now. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      
      // If modal is closed, show unread indicator
      if (!isOpen) {
        setHasUnread(true)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <>
      {/* Floating Chat Button */}
      <MotionBox
        position="fixed"
        bottom="24px"
        right="24px"
        zIndex={1000}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="lg"
          borderRadius="full"
          colorScheme="blue"
          leftIcon={<FiMessageCircle />}
          onClick={onOpen}
          shadow="lg"
          position="relative"
          _hover={{
            transform: 'translateY(-2px)',
            shadow: 'xl'
          }}
          transition="all 0.2s"
        >
          AI Assistant
          <AnimatePresence>
            {hasUnread && (
              <MotionBox
                position="absolute"
                top="-2px"
                right="-2px"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Badge colorScheme="red" variant="solid" borderRadius="full">
                  !
                </Badge>
              </MotionBox>
            )}
          </AnimatePresence>
        </Button>
      </MotionBox>

      {/* Chat Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent maxH="80vh" bg={bgColor}>
          <ModalHeader borderBottom="1px" borderColor={borderColor}>
            <HStack>
              <Avatar size="sm" bg="blue.500" name="AI" />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">AI Nutrition Assistant</Text>
                <Text fontSize="xs" color="gray.500">
                  Always here to help with your nutrition journey
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody p={0}>
            {/* Messages */}
            <Box h="400px" overflowY="auto" p={4}>
              <VStack spacing={4} align="stretch">
                {messages.map((message) => (
                  <Flex
                    key={message.id}
                    justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                  >
                    <Box maxW="80%">
                      <HStack spacing={2} mb={1}>
                        {message.sender === 'ai' && (
                          <Avatar size="xs" bg="blue.500" name="AI" />
                        )}
                        <Text fontSize="xs" color="gray.500">
                          {message.sender === 'ai' ? 'AI Assistant' : 'You'}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {formatTimestamp(message.timestamp)}
                        </Text>
                        <Spacer />
                        {message.sender === 'user' && (
                          <Avatar size="xs" bg="green.500" />
                        )}
                      </HStack>
                      <Box
                        bg={message.sender === 'ai' ? aiMessageBg : userMessageBg}
                        p={3}
                        borderRadius="lg"
                        borderBottomLeftRadius={message.sender === 'ai' ? 'sm' : 'lg'}
                        borderBottomRightRadius={message.sender === 'user' ? 'sm' : 'lg'}
                      >
                        <Text fontSize="sm" whiteSpace="pre-wrap">
                          {message.content}
                        </Text>
                      </Box>
                    </Box>
                  </Flex>
                ))}
                
                {isLoading && (
                  <Flex justify="flex-start">
                    <Box maxW="80%">
                      <HStack spacing={2} mb={1}>
                        <Avatar size="xs" bg="blue.500" name="AI" />
                        <Text fontSize="xs" color="gray.500">AI Assistant</Text>
                        <Text fontSize="xs" color="gray.400">typing...</Text>
                      </HStack>
                      <Box bg={aiMessageBg} p={3} borderRadius="lg" borderBottomLeftRadius="sm">
                        <HStack spacing={1}>
                          <Spinner size="xs" />
                          <Text fontSize="sm" color="gray.600">AI is thinking...</Text>
                        </HStack>
                      </Box>
                    </Box>
                  </Flex>
                )}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* Input */}
            <Box p={4} borderTop="1px" borderColor={borderColor}>
              <HStack spacing={2}>
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about nutrition..."
                  disabled={isLoading}
                  size="sm"
                />
                <IconButton
                  aria-label="Send message"
                  icon={<FiSend />}
                  onClick={sendMessage}
                  isLoading={isLoading}
                  disabled={!inputMessage.trim()}
                  colorScheme="blue"
                  size="sm"
                />
              </HStack>
              <Text fontSize="xs" color="gray.500" mt={2}>
                💡 Try asking: "What should I eat for breakfast?" or "Analyze my protein intake"
              </Text>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default PersistentAIChat
