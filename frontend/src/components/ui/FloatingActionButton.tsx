import React from 'react'
import {
  Box,
  IconButton,
  VStack,
  HStack,
  useDisclosure,
  useColorModeValue,
  Tooltip,
  useBreakpointValue,
  Portal,
  Slide,
  Text,
} from '@chakra-ui/react'
import { FaPlus, FaTint, FaWeight, FaCamera, FaRobot } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import WaterLogModal from '../nutrition/WaterLogModal'
import WeightLogModal from '../nutrition/WeightLogModal'

const FloatingActionButton: React.FC = () => {
  const { isOpen: isMenuOpen, onToggle: onMenuToggle, onClose: onMenuClose } = useDisclosure()
  const { isOpen: isWaterOpen, onOpen: onWaterOpen, onClose: onWaterClose } = useDisclosure()
  const { isOpen: isWeightOpen, onOpen: onWeightOpen, onClose: onWeightClose } = useDisclosure()
  
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  
  const bg = useColorModeValue('white', 'gray.800')
  const shadow = useColorModeValue('lg', 'dark-lg')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Don't show on desktop since there's already full navigation
  if (!isMobile) return null

  const quickActions = [
    {
      icon: FaRobot,
      label: 'AI Chat',
      colorScheme: 'purple',
      action: () => {
        navigate('/ai')
        onMenuClose()
      }
    },
    {
      icon: FaCamera,
      label: 'Scan Label',
      colorScheme: 'blue',
      action: () => {
        navigate('/nutrition-scanner')
        onMenuClose()
      }
    },
    {
      icon: FaTint,
      label: 'Log Water',
      colorScheme: 'cyan',
      action: () => {
        onWaterOpen()
        onMenuClose()
      }
    },
    {
      icon: FaWeight,
      label: 'Log Weight',
      colorScheme: 'orange',
      action: () => {
        onWeightOpen()
        onMenuClose()
      }
    }
  ]

  return (
    <>
      <Portal>
        <Box
          position="fixed"
          bottom="110px" // Above bottom nav with more space
          right="20px"
          zIndex={1500}
        >
          {/* Quick Actions Menu */}
          <Slide direction="bottom" in={isMenuOpen} style={{ zIndex: 10 }}>
            <VStack spacing={3} align="stretch" pb={3}>
              {quickActions.map((action, index) => (
                <HStack
                  key={action.label}
                  spacing={3}
                  justify="flex-end"
                  opacity={isMenuOpen ? 1 : 0}
                  transform={isMenuOpen ? 'translateY(0)' : 'translateY(20px)'}
                  transition={`all 0.3s ease ${index * 0.1}s`}
                >
                  <Box
                    bg={bg}
                    px={3}
                    py={2}
                    borderRadius="full"
                    shadow={shadow}
                    borderWidth={1}
                    borderColor={borderColor}
                  >
                    <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
                      {action.label}
                    </Text>
                  </Box>
                  <Tooltip label={action.label} placement="left">
                    <IconButton
                      aria-label={action.label}
                      icon={<action.icon />}
                      colorScheme={action.colorScheme}
                      size="lg"
                      borderRadius="full"
                      shadow={shadow}
                      onClick={action.action}
                      _hover={{ transform: 'scale(1.1)' }}
                      transition="all 0.3s"
                      w="52px"
                      h="52px"
                      fontSize="20px"
                    />
                  </Tooltip>
                </HStack>
              ))}
            </VStack>
          </Slide>

          {/* Main FAB - Larger Touch Target */}
          <Tooltip label={isMenuOpen ? 'Close' : 'Quick Actions'} placement="left">
            <IconButton
              aria-label="Quick Actions"
              icon={<FaPlus style={{ transform: isMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)' }} />}
              colorScheme="green"
              size="lg"
              borderRadius="full"
              shadow={shadow}
              onClick={onMenuToggle}
              transition="all 0.3s"
              _hover={{ transform: 'scale(1.1)' }}
              bg="green.500"
              color="white"
              _dark={{
                bg: 'green.400',
                color: 'gray.900'
              }}
              w="60px"
              h="60px"
              fontSize="24px"
            />
          </Tooltip>
        </Box>
      </Portal>

      {/* Modals */}
      <WaterLogModal
        isOpen={isWaterOpen}
        onClose={onWaterClose}
        onSuccess={() => {
          onWaterClose()
          // Could show a success toast
        }}
      />
      
      <WeightLogModal
        isOpen={isWeightOpen}
        onClose={onWeightClose}
        onSuccess={() => {
          onWeightClose()
          // Could show a success toast
        }}
      />
    </>
  )
}

export default FloatingActionButton
