import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  Box,
  Icon,
  useColorModeValue,
  Badge
} from '@chakra-ui/react'
import { FiDownload, FiSmartphone, FiShare, FiPlus } from 'react-icons/fi'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface PWAInstallProps {
  isOpen: boolean
  onClose: () => void
}

const PWAInstall: React.FC<PWAInstallProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    // Check if app is already installed (running in standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(isInStandaloneMode)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        onClose()
      }
    }
  }

  const iosInstructions = [
    { icon: FiShare, text: 'Tap the Share button' },
    { icon: FiPlus, text: 'Scroll down and tap "Add to Home Screen"' },
    { icon: FiSmartphone, text: 'Tap "Add" to install Nutrivize' }
  ]

  const benefits = [
    'Faster loading and better performance',
    'Works offline with cached data',
    'Quick access from your home screen',
    'Optimized for iPhone and Dynamic Island',
    'Push notifications for meal reminders'
  ]

  if (isStandalone) {
    return null // App is already installed
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="20px">
        <ModalHeader>
          <VStack spacing={3} align="center">
            <Image
              src="/icons/icon-192x192.png"
              alt="Nutrivize"
              boxSize="80px"
              borderRadius="18px"
              shadow="lg"
            />
            <VStack spacing={1}>
              <Text fontSize="xl" fontWeight="bold">
                Install Nutrivize
              </Text>
              <Badge colorScheme="green" borderRadius="full" px={3}>
                PWA App
              </Badge>
            </VStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Benefits */}
            <Box>
              <Text fontSize="md" fontWeight="medium" mb={3}>
                Why install the app?
              </Text>
              <VStack spacing={2} align="stretch">
                {benefits.map((benefit, index) => (
                  <HStack key={index} spacing={3}>
                    <Box
                      w="6px"
                      h="6px"
                      borderRadius="full"
                      bg="green.500"
                      flexShrink={0}
                      mt={2}
                    />
                    <Text fontSize="sm" color={textColor}>
                      {benefit}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Instructions */}
            {isIOS ? (
              <Box>
                <Text fontSize="md" fontWeight="medium" mb={3}>
                  How to install on iPhone:
                </Text>
                <VStack spacing={3} align="stretch">
                  {iosInstructions.map((instruction, index) => (
                    <HStack key={index} spacing={3}>
                      <Box
                        w="32px"
                        h="32px"
                        borderRadius="8px"
                        bg="green.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        <Icon as={instruction.icon} color="green.600" />
                      </Box>
                      <Text fontSize="sm" color={textColor}>
                        {instruction.text}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            ) : deferredPrompt ? (
              <Box textAlign="center">
                <Text fontSize="sm" color={textColor} mb={4}>
                  Click the button below to install Nutrivize on your device.
                </Text>
                <Button
                  colorScheme="green"
                  size="lg"
                  leftIcon={<FiDownload />}
                  onClick={handleInstallClick}
                  borderRadius="12px"
                  w="full"
                >
                  Install App
                </Button>
              </Box>
            ) : (
              <Box textAlign="center">
                <Text fontSize="sm" color={textColor}>
                  Your browser doesn't support app installation.
                  You can still use Nutrivize in your browser!
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} borderRadius="12px">
            Maybe Later
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default PWAInstall
