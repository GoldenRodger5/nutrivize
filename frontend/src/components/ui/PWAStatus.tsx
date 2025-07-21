import React, { useState, useEffect } from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  VStack,
  useToast,
  Box,
  Flex
} from '@chakra-ui/react'
import { FiWifi, FiWifiOff, FiRefreshCw } from 'react-icons/fi'

const PWAStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const toast = useToast()

  useEffect(() => {
    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: 'Back Online',
        description: 'Your connection has been restored.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top'
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: 'You\'re Offline',
        description: 'Some features may be limited while offline.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Service Worker update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setRegistration(registration)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })
      })

      // Listen for new service worker controlling the page
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setUpdateAvailable(false)
    }
  }

  return (
    <>
      {/* Offline Status */}
      {!isOnline && (
        <Box position="fixed" top="0" left="0" right="0" zIndex="1000">
          <Alert status="warning" justifyContent="center" py={2}>
            <AlertIcon as={FiWifiOff} />
            <AlertTitle fontSize="sm">Offline Mode</AlertTitle>
            <AlertDescription fontSize="xs" ml={2}>
              Some features are limited
            </AlertDescription>
          </Alert>
        </Box>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <Box position="fixed" bottom="20px" left="20px" right="20px" zIndex="1000">
          <Alert
            status="info"
            borderRadius="12px"
            boxShadow="lg"
            bg="blue.50"
            border="1px solid"
            borderColor="blue.200"
          >
            <AlertIcon />
            <VStack align="stretch" spacing={2} flex="1">
              <AlertTitle fontSize="sm">Update Available</AlertTitle>
              <AlertDescription fontSize="xs">
                A new version of Nutrivize is ready to install.
              </AlertDescription>
              <HStack spacing={2}>
                <Button
                  size="xs"
                  colorScheme="blue"
                  onClick={handleUpdate}
                  leftIcon={<FiRefreshCw />}
                >
                  Update Now
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setUpdateAvailable(false)}
                >
                  Later
                </Button>
              </HStack>
            </VStack>
          </Alert>
        </Box>
      )}

      {/* PWA Install Indicator */}
      <Box position="fixed" top="env(safe-area-inset-top)" right="20px" zIndex="999">
        <Flex
          align="center"
          justify="center"
          w="40px"
          h="20px"
          bg={isOnline ? 'green.500' : 'red.500'}
          borderRadius="full"
          opacity={0.7}
          transition="all 0.3s"
        >
          {isOnline ? (
            <FiWifi size="12px" color="white" />
          ) : (
            <FiWifiOff size="12px" color="white" />
          )}
        </Flex>
      </Box>
    </>
  )
}

export default PWAStatus
