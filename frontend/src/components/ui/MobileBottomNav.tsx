import {
  Box,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Badge,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'

// Icons for bottom navigation
const HomeIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={5} h={5}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </Icon>
)

const FoodLogIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={5} h={5}>
    <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm6 16H8a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h2v1a1 1 0 0 0 2 0V9h2v12a1 1 0 0 1-1 1z"/>
  </Icon>
)

const IndexIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={5} h={5}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </Icon>
)

const AIIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={5} h={5}>
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
  </Icon>
)

const MenuIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor" w={5} h={5}>
    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
  </Icon>
)

interface MobileBottomNavProps {
  onMenuOpen: () => void
}

export default function MobileBottomNav({ onMenuOpen }: MobileBottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const bg = useColorModeValue('linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,252,255,0.98) 100%)', 'gray.800')
  const borderColor = useColorModeValue('rgba(79, 172, 254, 0.15)', 'gray.700')
  const textColor = useColorModeValue('gray.600', 'gray.400')
  const activeColor = useColorModeValue('green.500', 'green.300')
  const isMobile = useBreakpointValue({ base: true, lg: false })

  if (!isMobile) return null

  const bottomNavItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/food-log', label: 'Log', icon: FoodLogIcon },
    { path: '/food-index', label: 'Foods', icon: IndexIcon },
    { path: '/ai', label: 'AI', icon: AIIcon, badge: 'AI' },
    { label: 'Menu', icon: MenuIcon, action: onMenuOpen },
  ]

  const isActivePath = (path?: string) => {
    if (!path) return false
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
      borderTopWidth={1}
      borderColor={borderColor}
      zIndex={1000}
      pb="env(safe-area-inset-bottom)"
    >
      <HStack spacing={0} justify="space-around" py={2}>
        {bottomNavItems.map((item, index) => {
          const IconComponent = item.icon
          const isActive = item.path ? isActivePath(item.path) : false
          
          return (
            <VStack
              key={index}
              spacing={1}
              flex={1}
              cursor="pointer"
              onClick={() => handleItemClick(item)}
              color={isActive ? activeColor : textColor}
              transition="color 0.2s"
              py={1}
              position="relative"
            >
              <Box position="relative">
                <IconComponent />
                {item.badge && (
                  <Badge
                    position="absolute"
                    top="-8px"
                    right="-8px"
                    fontSize="2xs"
                    colorScheme="green"
                    borderRadius="full"
                    minW="16px"
                    h="16px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Box>
              <Text
                fontSize="2xs"
                fontWeight={isActive ? 'semibold' : 'normal'}
                lineHeight="1"
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
