import { useEffect, useRef, useState } from 'react'
import { useToast } from '@chakra-ui/react'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  autoReconnect?: boolean
  reconnectDelay?: number
  maxReconnectAttempts?: number
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const toast = useToast()

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setConnectionStatus('connecting')
      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        onConnect?.()
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          onMessage?.(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        setConnectionStatus('disconnected')
        onDisconnect?.()

        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay)
        }
      }

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error')
        onError?.(error)
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    
    toast({
      title: 'Connection Error',
      description: 'WebSocket connection is not available',
      status: 'warning',
      duration: 3000,
      isClosable: true,
    })
    return false
  }

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [url])

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
  }
}

// Hook specifically for nutrition tracking updates
export const useNutritionWebSocket = () => {
  const toast = useToast()
  
  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'food_logged':
        toast({
          title: 'Food Logged',
          description: `${message.data.food_name} has been logged`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
        break
      case 'goal_updated':
        toast({
          title: 'Goal Updated',
          description: 'Your nutrition goal has been updated',
          status: 'info',
          duration: 2000,
          isClosable: true,
        })
        break
      case 'weight_logged':
        toast({
          title: 'Weight Logged',
          description: `New weight: ${message.data.weight} lbs`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
        break
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  const handleConnect = () => {
    console.log('WebSocket connected')
  }

  const handleDisconnect = () => {
    console.log('WebSocket disconnected')
  }

  const handleError = (error: Event) => {
    console.error('WebSocket error:', error)
  }

  // In a real app, this would be the actual WebSocket server URL
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws'

  return useWebSocket(wsUrl, {
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    autoReconnect: true,
    reconnectDelay: 3000,
    maxReconnectAttempts: 5
  })
}
