import { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  CardHeader,
  useToast,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Textarea,
  Badge,
  useColorModeValue
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiDroplet, FiTrendingUp } from 'react-icons/fi'
import api from '../utils/api'

const MotionCard = motion(Card)

interface QuickLoggingProps {
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

export default function QuickLogging({ size = 'md', showTitle = true }: QuickLoggingProps) {
  const [waterAmount, setWaterAmount] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [loadingWater, setLoadingWater] = useState(false)
  const [loadingWeight, setLoadingWeight] = useState(false)
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const logWater = async () => {
    if (!waterAmount || parseFloat(waterAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid water amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoadingWater(true)
    try {
      await api.post('/water-logs/', {
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(waterAmount),
        notes: notes || ''
      })

      toast({
        title: 'Success! 💧',
        description: `Logged ${waterAmount} fl oz of water`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      setWaterAmount('')
      setNotes('')
    } catch (error) {
      console.error('Error logging water:', error)
      toast({
        title: 'Error',
        description: 'Failed to log water intake',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setLoadingWater(false)
  }

  const logWeight = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      toast({
        title: 'Invalid Weight',
        description: 'Please enter a valid weight',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoadingWeight(true)
    try {
      await api.post('/weight-logs/', {
        date: new Date().toISOString().split('T')[0],
        weight: parseFloat(weight),
        notes: notes || ''
      })

      toast({
        title: 'Success! ⚖️',
        description: `Logged weight: ${weight} lbs`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      setWeight('')
      setNotes('')
    } catch (error) {
      console.error('Error logging weight:', error)
      toast({
        title: 'Error',
        description: 'Failed to log weight',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setLoadingWeight(false)
  }

  const cardSize = size === 'sm' ? { p: 3 } : size === 'lg' ? { p: 6 } : { p: 4 }
  const spacing = size === 'sm' ? 3 : size === 'lg' ? 6 : 4

  return (
    <MotionCard
      bg={cardBg}
      borderColor={borderColor}
      borderWidth={1}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {showTitle && (
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="bold">
            ⚡ Quick Logging
          </Text>
        </CardHeader>
      )}
      <CardBody {...cardSize}>
        <VStack spacing={spacing} align="stretch">
          {/* Water Logging */}
          <Box>
            <HStack mb={3}>
              <FiDroplet color="blue" />
              <Text fontWeight="medium" color="blue.600">
                Water Intake
              </Text>
              <Badge colorScheme="blue" size="sm">
                fl oz
              </Badge>
            </HStack>
            <SimpleGrid columns={size === 'sm' ? 1 : 2} spacing={3}>
              <FormControl>
                <NumberInput
                  value={waterAmount}
                  onChange={(valueString) => setWaterAmount(valueString)}
                  min={0}
                  step={0.1}
                  precision={2}
                  size={size}
                  allowMouseWheel={false}
                >
                  <NumberInputField placeholder="64 fl oz" />
                </NumberInput>
              </FormControl>
              <Button
                colorScheme="blue"
                onClick={logWater}
                isLoading={loadingWater}
                size={size}
                leftIcon={<FiDroplet />}
              >
                Log Water
              </Button>
            </SimpleGrid>
          </Box>

          {/* Weight Logging */}
          <Box>
            <HStack mb={3}>
              <FiTrendingUp color="purple" />
              <Text fontWeight="medium" color="purple.600">
                Weight
              </Text>
              <Badge colorScheme="purple" size="sm">
                lbs
              </Badge>
            </HStack>
            <SimpleGrid columns={size === 'sm' ? 1 : 2} spacing={3}>
              <FormControl>
                <NumberInput
                  value={weight}
                  onChange={(valueString) => setWeight(valueString)}
                  min={0}
                  step={0.1}
                  precision={2}
                  size={size}
                  allowMouseWheel={false}
                >
                  <NumberInputField placeholder="150.0 lbs" />
                </NumberInput>
              </FormControl>
              <Button
                colorScheme="purple"
                onClick={logWeight}
                isLoading={loadingWeight}
                size={size}
                leftIcon={<FiTrendingUp />}
              >
                Log Weight
              </Button>
            </SimpleGrid>
          </Box>

          {/* Notes (only show for medium/large sizes) */}
          {size !== 'sm' && (
            <FormControl>
              <FormLabel fontSize="sm" color="gray.600">
                Notes (optional)
              </FormLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                size="sm"
                rows={2}
                resize="vertical"
              />
            </FormControl>
          )}
        </VStack>
      </CardBody>
    </MotionCard>
  )
}
