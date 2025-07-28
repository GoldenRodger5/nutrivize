import {
  Box,
  Flex,
  Heading,
  HStack,
  Button,
  Spacer,
  useColorModeValue,
  Container,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  Text,
  useBreakpointValue,
  Icon,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

// Icons for navigation items
const HomeIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </Icon>
)

const FoodLogIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </Icon>
)

const IndexIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </Icon>
)

const MealIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.20-1.10-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
  </Icon>
)

const RestaurantIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
  </Icon>
)

const ChatIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
  </Icon>
)

const GoalsIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </Icon>
)

const AnalyticsIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
  </Icon>
)

const SettingsIcon = () => (
  <Icon viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
  </Icon>
)

interface NavBarProps {
  isDrawerOpen?: boolean
  onDrawerOpen?: () => void
  onDrawerClose?: () => void
}

export default function NavBar(props: NavBarProps = {}) {
  const { isDrawerOpen: externalIsOpen, onDrawerOpen: externalOnOpen, onDrawerClose: externalOnClose } = props
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isOpen: internalIsOpen, onOpen: internalOnOpen, onClose: internalOnClose } = useDisclosure()
  const bg = useColorModeValue('linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,252,255,0.98) 100%)', 'gray.800')
  const borderColor = useColorModeValue('rgba(79, 172, 254, 0.15)', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, lg: false })

  // Use external controls if provided, otherwise use internal
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const onOpen = externalOnOpen || internalOnOpen
  const onClose = externalOnClose || internalOnClose

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    onClose()
  }

  const navItems = [
    { path: '/', label: 'AI Dashboard', icon: HomeIcon, emoji: '🚀' },
    { path: '/food-log', label: 'Food Log', icon: FoodLogIcon },
    { path: '/food-index', label: 'Food Index', icon: IndexIcon },
    { path: '/favorites', label: 'Favorites', icon: IndexIcon, emoji: '⭐' },
    { path: '/food-stats', label: 'Food Stats', icon: IndexIcon, emoji: '📊' },
    { path: '/nutrition-scanner', label: 'Label Scanner', icon: IndexIcon, emoji: '📱' },
    { path: '/meal-suggestions', label: 'Meal Ideas', icon: MealIcon },
    { path: '/meal-plans', label: 'Meal Plans', icon: MealIcon },
    { path: '/manual-meal-planning', label: 'Manual Meal Planning', icon: MealIcon, emoji: '📝' },
    { path: '/restaurant-ai', label: 'RestaurantAI', icon: RestaurantIcon, emoji: '🍽️' },
    { path: '/ai', label: 'AI Chat', icon: ChatIcon },
    { path: '/goals', label: 'Goals', icon: GoalsIcon },
    { path: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
    { path: '/onboarding', label: 'Setup Wizard', icon: SettingsIcon, emoji: '🌱' },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  const isActivePath = (path: string) => {
    if (path === '/' || path === '/ai-dashboard') {
      return location.pathname === '/' || location.pathname === '/ai-dashboard'
    }
    return location.pathname === path
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) {
      onClose()
    }
  }

  return (
    <>
      <Box bg={bg} borderBottomWidth={1} borderColor={borderColor} position="sticky" top={0} zIndex={1000}>
        <Container maxW="container.xl">
          <Flex h={isMobile ? 14 : 16} alignItems="center">
            <Heading 
              size={isMobile ? "sm" : "md"} 
              color="green.600" 
              cursor="pointer" 
              onClick={() => navigate('/')}
            >
              {isMobile ? "Nutrivize" : "Nutrivize V2"}
            </Heading>
            
            <Spacer />
            
            {!isMobile ? (
              // Desktop Navigation
              <HStack spacing={1}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={isActivePath(item.path) ? 'solid' : 'ghost'}
                    colorScheme={isActivePath(item.path) ? 'green' : 'gray'}
                    onClick={() => navigate(item.path)}
                    size="sm"
                    fontSize="xs"
                  >
                    {item.emoji && `${item.emoji} `}{item.label}
                  </Button>
                ))}
              </HStack>
            ) : (
              // Mobile hamburger menu
              <IconButton
                aria-label="Open navigation menu"
                icon={<HamburgerIcon />}
                variant="ghost"
                onClick={onOpen}
                size="sm"
              />
            )}
            
            {!isMobile && (
              <>
                <Spacer />
                
                <Menu>
                  <MenuButton as={Button} variant="ghost" p={0}>
                    <Avatar size="sm" name={user?.name} />
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => navigate('/settings')}>Profile</MenuItem>
                    <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={handleLogout}>Sign Out</MenuItem>
                  </MenuList>
                </Menu>
              </>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <HStack>
              <Avatar size="sm" name={user?.name} />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="bold">{user?.name || 'User'}</Text>
                <Text fontSize="xs" color="gray.500">{user?.email}</Text>
              </VStack>
            </HStack>
          </DrawerHeader>

          <DrawerBody p={0}>
            <VStack spacing={0} align="stretch">
              {navItems.map((item) => {
                const IconComponent = item.icon
                const isActive = isActivePath(item.path)
                
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    justifyContent="flex-start"
                    leftIcon={<IconComponent />}
                    onClick={() => handleNavigation(item.path)}
                    colorScheme={isActive ? 'green' : 'gray'}
                    bg={isActive ? 'green.50' : 'transparent'}
                    borderRadius={0}
                    py={6}
                    fontSize="md"
                    fontWeight={isActive ? 'semibold' : 'normal'}
                  >
                    {item.emoji && `${item.emoji} `}{item.label}
                  </Button>
                )
              })}
            </VStack>
          </DrawerBody>

          <DrawerFooter borderTopWidth="1px" flexDirection="column" gap={2}>
            <Button
              variant="outline"
              w="full"
              onClick={() => handleNavigation('/settings')}
              leftIcon={<SettingsIcon />}
            >
              Settings
            </Button>
            <Button
              colorScheme="red"
              variant="ghost"
              w="full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
