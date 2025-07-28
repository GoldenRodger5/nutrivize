import React from 'react'
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  useDisclosure,
  useColorModeValue,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react'
import { FaWeight, FaTint } from 'react-icons/fa'
import WaterLogModal from '../nutrition/WaterLogModal'
import WeightLogModal from '../nutrition/WeightLogModal'

const QuickActionsWidget: React.FC = () => {
  const { isOpen: isWaterOpen, onOpen: onWaterOpen, onClose: onWaterClose } = useDisclosure()
  const { isOpen: isWeightOpen, onOpen: onWeightOpen, onClose: onWeightClose } = useDisclosure()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const isMobile = useBreakpointValue({ base: true, md: false })

  const handleWaterSuccess = () => {
    onWaterClose()
    // Could trigger a refresh of water data
  }

  const handleWeightSuccess = () => {
    onWeightClose()
    // Could trigger a refresh of weight data
  }

  return (
    <>
      <Box
        bg={bg}
        borderWidth={1}
        borderColor={borderColor}
        borderRadius="xl"
        p={4}
        shadow="sm"
      >
        <VStack spacing={4} align="stretch">
          <Text fontWeight="bold" fontSize="lg" textAlign="center">
            ⚡ Quick Actions
          </Text>
          
          <HStack spacing={3} justify="center">
            <Button
              leftIcon={<Icon as={FaTint} />}
              colorScheme="blue"
              variant="outline"
              onClick={onWaterOpen}
              size={isMobile ? "sm" : "md"}
              flex={1}
            >
              Log Water
            </Button>
            
            <Button
              leftIcon={<Icon as={FaWeight} />}
              colorScheme="purple"
              variant="outline"
              onClick={onWeightOpen}
              size={isMobile ? "sm" : "md"}
              flex={1}
            >
              Log Weight
            </Button>
          </HStack>
          
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Quick logging for daily tracking
          </Text>
        </VStack>
      </Box>

      <WaterLogModal
        isOpen={isWaterOpen}
        onClose={onWaterClose}
        onSuccess={handleWaterSuccess}
      />
      
      <WeightLogModal
        isOpen={isWeightOpen}
        onClose={onWeightClose}
        onSuccess={handleWeightSuccess}
      />
    </>
  )
}

export default QuickActionsWidget
