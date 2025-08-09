import {
  Box,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'

// Enhanced icons for better mobile visibility
const HomeIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={6} h={6}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </Icon>
)

const FoodLogIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={6} h={6}>
    <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm7 18c.55 0 1-.45 1-1v-1c0-1.1-.9-2-2-2h-.5v-2c0-1.1-.9-2-2-2H15v-2h1.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H7.5c-.28 0-.5.22-.5.5s.22.5.5.5H9v2H6.5c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v1c0 .55.45 1 1 1h18z"/>
  </Icon>
)

const IndexIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={6} h={6}>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
  </Icon>
)

const AIIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={6} h={6}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </Icon>
)

const GoalsIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={6} h={6}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </Icon>
)

interface MobileBottomNavProps {
  onMenuOpen?: () => void  // Make optional since we're not using menu anymore
}

export default function MobileBottomNav({ }: MobileBottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const bg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)')
  const borderColor = useColorModeValue('rgba(79, 172, 254, 0.15)', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const activeColor = useColorModeValue('blue.500', 'blue.300')
  const activeBg = useColorModeValue('blue.50', 'blue.900')
  const isMobile = useBreakpointValue({ base: true, lg: false })

  if (!isMobile) return null

  const bottomNavItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/food-log', label: 'Log', icon: FoodLogIcon },
    { path: '/food-index', label: 'Foods', icon: IndexIcon },
    { path: '/goals', label: 'Goals', icon: GoalsIcon },
    { path: '/ai', label: 'AI', icon: AIIcon },
  ]

  const isActivePath = (path: string) => {
    if (path === '/' || path === '/ai-dashboard') {
      return location.pathname === '/' || location.pathname === '/ai-dashboard'
    }
    return location.pathname === path
  }

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action()
    } else if (item.path) {
      navigate(item.path)
    }
  }

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bg}
      backdropFilter="blur(20px)"
      borderTopWidth={1}
      borderColor={borderColor}
      zIndex={1000}
      pb="env(safe-area-inset-bottom)"
      boxShadow="0 -2px 16px rgba(0, 0, 0, 0.1)"
    >
      <HStack spacing={0} justify="space-around" py={2}>
        {bottomNavItems.map((item, index) => {
          const IconComponent = item.icon
          const isActive = isActivePath(item.path)
          
          return (
            <VStack
              key={index}
              spacing={1}
              flex={1}
              cursor="pointer"
              onClick={() => handleItemClick(item)}
              color={isActive ? activeColor : textColor}
              transition="all 0.3s ease"
              py={2}
              px={2}
              position="relative"
              minH="60px"
              justify="center"
              borderRadius="xl"
              bg={isActive ? activeBg : 'transparent'}
              _active={{ transform: 'scale(0.95)' }}
            >
              <Box 
                position="relative"
                transition="all 0.3s ease"
                transform={isActive ? 'scale(1.1)' : 'scale(1)'}
              >
                <IconComponent />
                {/* Active indicator */}
                {isActive && (
                  <Box
                    position="absolute"
                    top="-2px"
                    left="50%"
                    transform="translateX(-50%)"
                    w="4px"
                    h="4px"
                    bg={activeColor}
                    borderRadius="full"
                  />
                )}
              </Box>
              <Text
                fontSize="xs"
                fontWeight={isActive ? 'semibold' : 'medium'}
                lineHeight="1"
                opacity={isActive ? 1 : 0.8}
              >
                {item.label}
              </Text>
            </VStack>
          )
        })}
      </HStack>
    </Box>
  )
}
