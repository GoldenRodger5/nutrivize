import React from 'react'
import {
  Box,
  HStack,
  Text,
  IconButton,
  useColorModeValue,
  Badge,
  useBreakpointValue,
  Flex,
} from '@chakra-ui/react'
import { 
  FiBell, 
  FiMenu, 
  FiUser,
  FiSearch,
} from 'react-icons/fi'
import { useNavigate, useLocation } from 'react-router-dom'

interface MobileHeaderProps {
  title?: string
  showNotifications?: boolean
  showSearch?: boolean
  showMenu?: boolean
  onMenuOpen?: () => void
  onNotificationsOpen?: () => void
  onSearchOpen?: () => void
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showNotifications = true,
  showSearch = false,
  showMenu = true,
  onMenuOpen,
  onNotificationsOpen,
  onSearchOpen,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  
  const bg = useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)')
  const borderColor = useColorModeValue('rgba(79, 172, 254, 0.15)', 'gray.700')
  const textColor = useColorModeValue('gray.800', 'white')
  
  if (!isMobile) return null
  
  // Get page title based on route
  const getPageTitle = () => {
    if (title) return title
    
    const routeTitles: { [key: string]: string } = {
      '/': 'Dashboard',
      '/ai-dashboard': 'AI Dashboard',
      '/food-log': 'Food Log',
      '/food-index': 'Food Database',
      '/favorites': 'Favorites',
      '/goals': 'Goals',
      '/ai': 'AI Assistant',
      '/meal-planning': 'Meal Planning',
      '/analytics': 'Analytics',
      '/settings': 'Settings',
    }
    
    return routeTitles[location.pathname] || 'Nutrivize'
  }
  
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bg={bg}
      backdropFilter="blur(20px)"
      borderBottomWidth={1}
      borderColor={borderColor}
      zIndex={1000}
      pt="env(safe-area-inset-top)"
      boxShadow="0 2px 16px rgba(0, 0, 0, 0.1)"
    >
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        h="60px"
      >
        {/* Left side - Menu or Back */}
        <HStack spacing={3}>
          {showMenu && (
            <IconButton
              aria-label="Open menu"
              icon={<FiMenu />}
              variant="ghost"
              size="md"
              onClick={onMenuOpen}
              color={textColor}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            />
          )}
        </HStack>
        
        {/* Center - Title */}
        <Text
          fontSize="lg"
          fontWeight="bold"
          color={textColor}
          textAlign="center"
          flex={1}
          mx={4}
          noOfLines={1}
        >
          {getPageTitle()}
        </Text>
        
        {/* Right side - Actions */}
        <HStack spacing={2}>
          {showSearch && (
            <IconButton
              aria-label="Search"
              icon={<FiSearch />}
              variant="ghost"
              size="md"
              onClick={onSearchOpen}
              color={textColor}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
            />
          )}
          
          {showNotifications && (
            <Box position="relative">
              <IconButton
                aria-label="Notifications"
                icon={<FiBell />}
                variant="ghost"
                size="md"
                onClick={onNotificationsOpen}
                color={textColor}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
              />
              {/* Notification badge */}
              <Badge
                position="absolute"
                top="2px"
                right="2px"
                fontSize="2xs"
                colorScheme="red"
                borderRadius="full"
                minW="6px"
                h="6px"
                p={0}
              />
            </Box>
          )}
          
          <IconButton
            aria-label="Profile"
            icon={<FiUser />}
            variant="ghost"
            size="md"
            onClick={() => navigate('/settings')}
            color={textColor}
            _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
          />
        </HStack>
      </Flex>
    </Box>
  )
}

export default MobileHeader
