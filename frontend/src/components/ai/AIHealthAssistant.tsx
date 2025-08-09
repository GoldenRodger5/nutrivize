import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Alert,
  AlertIcon,
  Spinner,
  Icon,
  useColorModeValue,
  Divider,
  Badge,
} from '@chakra-ui/react'
import { FiSend, FiZap, FiUser } from 'react-icons/fi'
import { useAIHealthChat } from '../../hooks/useEnhancedAIHealth'

interface ChatMessage {
  type: 'user' | 'ai'
  content: string
  timestamp: string
}

const AIHealthAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      content: "Hi! I'm your AI Health Assistant. Ask me anything about your nutrition, goals, or health insights!",
      timestamp: new Date().toISOString()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const { askQuestion, loading, error } = useAIHealthChat()
  
  const bg = useColorModeValue('white', 'gray.800')
  const messageBg = useColorModeValue('gray.50', 'gray.700')
  const userMessageBg = useColorModeValue('blue.500', 'blue.600')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const userMessage: ChatMessage = {
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')

    try {
      const response = await askQuestion(inputValue.trim())
      const aiMessage: ChatMessage = {
        type: 'ai',
        content: response.answer,
        timestamp: response.generated_at
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      const errorMessage: ChatMessage = {
        type: 'ai',
        content: "I'm sorry, I encountered an error processing your question. Please try again later.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card bg={bg} borderColor={borderColor} borderWidth={1} h="500px" display="flex" flexDirection="column">
      <CardHeader pb={2}>
        <HStack spacing={3}>
          <Icon as={FiZap} color="blue.500" boxSize={6} />
          <Heading size="md">AI Health Assistant</Heading>
          <Badge colorScheme="green" variant="subtle">Live</Badge>
        </HStack>
      </CardHeader>
      
      <CardBody flex={1} display="flex" flexDirection="column" p={0}>
        {error && (
          <Alert status="error" size="sm" mx={4} mb={2}>
            <AlertIcon />
            <Text fontSize="sm">Unable to connect to AI assistant</Text>
          </Alert>
        )}

        {/* Messages Area */}
        <Box 
          flex={1} 
          overflowY="auto" 
          px={4} 
          pb={2}
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '24px',
            },
          }}
        >
          <VStack spacing={3} align="stretch">
            {messages.map((message, index) => (
              <HStack
                key={index}
                justify={message.type === 'user' ? 'flex-end' : 'flex-start'}
                align="flex-start"
                spacing={2}
              >
                {message.type === 'ai' && (
                  <Icon as={FiZap} color="blue.500" mt={1} flexShrink={0} />
                )}
                
                <Box
                  bg={message.type === 'user' ? userMessageBg : messageBg}
                  color={message.type === 'user' ? 'white' : undefined}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  maxW="70%"
                  borderBottomRightRadius={message.type === 'user' ? 'sm' : 'lg'}
                  borderBottomLeftRadius={message.type === 'ai' ? 'sm' : 'lg'}
                >
                  <Text fontSize="sm" lineHeight="1.4">
                    {message.content}
                  </Text>
                </Box>
                
                {message.type === 'user' && (
                  <Icon as={FiUser} color="gray.500" mt={1} flexShrink={0} />
                )}
              </HStack>
            ))}
            
            {loading && (
              <HStack justify="flex-start" align="center" spacing={2}>
                <Icon as={FiZap} color="blue.500" />
                <Box bg={messageBg} px={3} py={2} borderRadius="lg">
                  <HStack spacing={2}>
                    <Spinner size="xs" />
                    <Text fontSize="sm" color="gray.600">
                      AI is thinking...
                    </Text>
                  </HStack>
                </Box>
              </HStack>
            )}
          </VStack>
        </Box>

        <Divider />

        {/* Input Area */}
        <Box p={4}>
          <HStack spacing={2}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your nutrition, goals, or health..."
              size="sm"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              colorScheme="blue"
              size="sm"
              isLoading={loading}
              disabled={!inputValue.trim()}
              leftIcon={<FiSend />}
            >
              Send
            </Button>
          </HStack>
          
          <Text fontSize="xs" color="gray.500" mt={1}>
            Press Enter to send • AI responses are for informational purposes only
          </Text>
        </Box>
      </CardBody>
    </Card>
  )
}

export default AIHealthAssistant
