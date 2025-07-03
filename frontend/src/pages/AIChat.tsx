import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Input,
  Avatar,
  useToast,
  useBreakpointValue,
  IconButton,
  Textarea,
  Flex,
  useColorModeValue,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Code,
  useClipboard,
  Button,
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, CopyIcon } from '@chakra-ui/icons'
import { ChatMessage } from '../types'
import api from '../utils/api'

// Quick prompt suggestions for mobile
const quickPrompts = [
  "What should I eat for lunch?",
  "Help me plan a healthy meal",
  "Suggest a high-protein snack",
  "What are good foods for weight loss?",
  "Plan my meals for today",
  "Analyze my nutrition goals"
]

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your nutrition AI assistant. I can help you with meal planning, nutrition questions, diet advice, and food recommendations. What would you like to know?'
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const bg = useColorModeValue('white', 'gray.800')
  const messageBg = useColorModeValue('gray.50', 'gray.700')
  const userMessageBg = useColorModeValue('green.500', 'green.600')

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || newMessage.trim()
    if (!content) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: content
    }

    // Add user message immediately
    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setLoading(true)

    try {
      const response = await api.post('/ai/chat', {
        message: userMessage.content,
        conversation_history: messages.slice(-10) // Send last 10 messages for context
      })

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Chat Error',
        description: 'Failed to send message. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })

      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble responding right now. Please try again in a moment.'
      }
      setMessages(prev => [...prev, errorMessage])
    }
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt)
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your nutrition AI assistant. I can help you with meal planning, nutrition questions, diet advice, and food recommendations. What would you like to know?'
      }
    ])
  }

  // Helper function to detect and parse JSON
  const parseJsonContent = (content: string) => {
    // Look for JSON blocks in the content
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g
    const matches = []
    let match
    
    while ((match = jsonRegex.exec(content)) !== null) {
      try {
        const jsonData = JSON.parse(match[1])
        matches.push({
          original: match[0],
          parsed: jsonData,
          jsonString: match[1]
        })
      } catch (e) {
        // Not valid JSON, skip
      }
    }
    
    return matches
  }

  // Mobile Message Component
  const MessageBubble = ({ message, isUser }: { message: ChatMessage; isUser: boolean }) => {
    const { onCopy, hasCopied } = useClipboard("")
    const jsonBlocks = parseJsonContent(message.content)
    
    return (
      <Flex justify={isUser ? 'flex-end' : 'flex-start'} w="full">
        <HStack
          spacing={2}
          maxW={isMobile ? "85%" : "70%"}
          flexDirection={isUser ? 'row-reverse' : 'row'}
        >
          <Avatar
            size={isMobile ? "sm" : "md"}
            name={isUser ? "You" : "AI"}
            bg={isUser ? "green.500" : "blue.500"}
            color="white"
            fontSize={isMobile ? "xs" : "sm"}
          />
          <Card
            size="sm"
            bg={isUser ? userMessageBg : messageBg}
            color={isUser ? "white" : "inherit"}
            shadow="sm"
            borderRadius="lg"
          >
            <CardBody p={isMobile ? 3 : 4}>
              {jsonBlocks.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {/* Render text content without JSON blocks */}
                  <Text
                    fontSize={isMobile ? "sm" : "md"}
                    lineHeight="1.4"
                    whiteSpace="pre-wrap"
                  >
                    {message.content.replace(/```json\s*[\s\S]*?\s*```/g, '[JSON Response - see below]')}
                  </Text>
                  
                  {/* Render JSON blocks */}
                  {jsonBlocks.map((jsonBlock, index) => (
                    <Box key={index} bg={isUser ? "whiteAlpha.200" : "gray.100"} p={3} borderRadius="md">
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="xs" fontWeight="bold" color={isUser ? "whiteAlpha.800" : "gray.600"}>
                          JSON Response
                        </Text>
                        <Button
                          size="xs"
                          variant="ghost"
                          leftIcon={<CopyIcon />}
                          onClick={() => onCopy(JSON.stringify(jsonBlock.parsed, null, 2))}
                          color={isUser ? "whiteAlpha.800" : "gray.600"}
                        >
                          {hasCopied ? "Copied!" : "Copy"}
                        </Button>
                      </HStack>
                      <Code
                        display="block"
                        whiteSpace="pre"
                        fontSize="xs"
                        p={2}
                        bg={isUser ? "whiteAlpha.300" : "white"}
                        color={isUser ? "gray.800" : "inherit"}
                        borderRadius="sm"
                        maxH="300px"
                        overflowY="auto"
                      >
                        {JSON.stringify(jsonBlock.parsed, null, 2)}
                      </Code>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text
                  fontSize={isMobile ? "sm" : "md"}
                  lineHeight="1.4"
                  whiteSpace="pre-wrap"
                >
                  {message.content}
                </Text>
              )}
            </CardBody>
          </Card>
        </HStack>
      </Flex>
    )
  }

  return (
    <Box bg="gray.50" h={isMobile ? "calc(100vh - 140px)" : "100vh"} position="relative">
      <Container 
        maxW={isMobile ? "100%" : "container.lg"} 
        h="100%" 
        p={0}
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Box bg={bg} p={isMobile ? 3 : 4} borderBottomWidth={1} borderColor="gray.200" flexShrink={0}>
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Heading size={isMobile ? "md" : "lg"}>
                🤖 AI Nutrition Assistant
              </Heading>
              <Text fontSize={isMobile ? "xs" : "sm"} color="gray.600">
                Ask me anything about nutrition and health
              </Text>
            </VStack>
            <IconButton
              aria-label="Clear chat"
              icon={<DeleteIcon />}
              size={isMobile ? "sm" : "md"}
              variant="ghost"
              onClick={clearChat}
            />
          </HStack>
        </Box>

        {/* Messages Area - Scrollable */}
        <Box
          flex={1}
          overflowY="auto"
          p={isMobile ? 3 : 4}
          bg="gray.50"
          minH={0}
          maxH="100%"
        >
          <VStack spacing={isMobile ? 3 : 4} align="stretch">
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                isUser={message.role === 'user'}
              />
            ))}

            {/* Loading indicator */}
            {loading && (
              <Flex justify="flex-start" w="full">
                <HStack spacing={2} maxW="70%">
                  <Avatar
                    size={isMobile ? "sm" : "md"}
                    name="AI"
                    bg="blue.500"
                    color="white"
                    fontSize={isMobile ? "xs" : "sm"}
                  />
                  <Card size="sm" bg={messageBg} shadow="sm" borderRadius="lg">
                    <CardBody p={isMobile ? 3 : 4}>
                      <HStack spacing={1}>
                        <Box w={2} h={2} bg="gray.400" borderRadius="full" animation="pulse 1.5s infinite" />
                        <Box w={2} h={2} bg="gray.400" borderRadius="full" animation="pulse 1.5s infinite 0.5s" />
                        <Box w={2} h={2} bg="gray.400" borderRadius="full" animation="pulse 1.5s infinite 1s" />
                      </HStack>
                    </CardBody>
                  </Card>
                </HStack>
              </Flex>
            )}

            <div ref={messagesEndRef} />
          </VStack>
        </Box>

        {/* Quick Prompts - Mobile Only */}
        {isMobile && messages.length <= 2 && (
          <Box p={3} bg={bg} borderTopWidth={1} borderColor="gray.200" flexShrink={0}>
            <Text fontSize="xs" color="gray.600" mb={2}>
              Quick questions:
            </Text>
            <Wrap spacing={1}>
              {quickPrompts.map((prompt, index) => (
                <WrapItem key={index}>
                  <Tag
                    size="sm"
                    variant="outline"
                    cursor="pointer"
                    onClick={() => handleQuickPrompt(prompt)}
                    _hover={{ bg: "green.50", borderColor: "green.300" }}
                    borderRadius="full"
                  >
                    <TagLabel fontSize="xs">{prompt}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}

        {/* Input Area */}
        <Box p={isMobile ? 3 : 4} bg={bg} borderTopWidth={1} borderColor="gray.200" flexShrink={0}>
          <VStack spacing={2}>
            <HStack spacing={2} w="full">
              {isMobile ? (
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask me about nutrition..."
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  resize="none"
                  minH="40px"
                  maxH="60px"
                  fontSize="sm"
                  flex={1}
                />
              ) : (
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask me about nutrition, meal planning, or diet advice..."
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  size="md"
                />
              )}
              <IconButton
                aria-label="Send message"
                icon={<AddIcon />}
                colorScheme="green"
                onClick={() => sendMessage()}
                isLoading={loading}
                disabled={!newMessage.trim() || loading}
                size={isMobile ? "sm" : "md"}
              />
            </HStack>

            {/* Desktop Quick Prompts */}
            {!isMobile && messages.length <= 2 && (
              <Box w="full">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Try asking:
                </Text>
                <Wrap spacing={2}>
                  {quickPrompts.slice(0, 4).map((prompt, index) => (
                    <WrapItem key={index}>
                      <Tag
                        size="md"
                        variant="outline"
                        cursor="pointer"
                        onClick={() => handleQuickPrompt(prompt)}
                        _hover={{ bg: "green.50", borderColor: "green.300" }}
                        borderRadius="full"
                      >
                        <TagLabel>{prompt}</TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}
