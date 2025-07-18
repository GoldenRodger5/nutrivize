import { useState, useEffect, useRef } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  SimpleGrid,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Switch,
  FormHelperText,
  Textarea,
  useBreakpointValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Progress,
} from '@chakra-ui/react'
import { EditIcon, DeleteIcon, SettingsIcon, RepeatIcon } from '@chakra-ui/icons'
import { useAppState } from '../contexts/AppStateContext'
import api from '../utils/api'

// Weight conversion utilities
const lbsToKg = (lbs: number) => lbs * 0.453592
const kgToLbs = (kg: number) => kg * 2.20462

// Weight bounds (in lbs)
const MIN_WEIGHT = 80 // 80 lbs
const MAX_WEIGHT = 600 // 600 lbs
const MIN_WEEKLY_RATE = 0.5 // 0.5 lbs per week
const MAX_WEEKLY_RATE = 3 // 3 lbs per week (safe maximum)

// Nutrition bounds
const NUTRITION_BOUNDS = {
  calories: { min: 1000, max: 5000 },
  protein: { min: 30, max: 400 },
  carbs: { min: 50, max: 800 },
  fat: { min: 20, max: 300 },
  fiber: { min: 10, max: 80 },
  sugar: { min: 0, max: 200 },
  sodium: { min: 500, max: 4000 },
  water_target: { min: 32, max: 200 }, // fl oz per day
}

// Calculate expected completion date
const calculateCompletionDate = (currentWeight: number, targetWeight: number, weeklyRate: number, startDate: string) => {
  if (!currentWeight || !targetWeight || !weeklyRate || currentWeight === targetWeight) {
    return ''
  }
  
  const weightDifference = Math.abs(targetWeight - currentWeight)
  const weeksToGoal = Math.ceil(weightDifference / weeklyRate)
  
  const start = new Date(startDate)
  const completion = new Date(start)
  completion.setDate(start.getDate() + (weeksToGoal * 7))
  
  return completion.toISOString().split('T')[0]
}

// Validate weight within bounds
const isValidWeight = (weight: number) => weight >= MIN_WEIGHT && weight <= MAX_WEIGHT

// Validate nutrition values
const isValidNutrition = (key: keyof typeof NUTRITION_BOUNDS, value: number) => {
  const bounds = NUTRITION_BOUNDS[key]
  return value >= bounds.min && value <= bounds.max
}

// Calculate macros from percentages and calories
const calculateMacrosFromPercentages = (calories: number, percentages: { protein: number, carbs: number, fat: number }) => {
  // Protein and carbs: 4 calories per gram
  // Fat: 9 calories per gram
  const proteinGrams = Math.round((calories * percentages.protein / 100) / 4)
  const carbsGrams = Math.round((calories * percentages.carbs / 100) / 4)
  const fatGrams = Math.round((calories * percentages.fat / 100) / 9)
  
  return {
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
  }
}

// Validate that percentages add up to 100
const validatePercentageTotal = (percentages: { protein: number, carbs: number, fat: number }) => {
  const total = percentages.protein + percentages.carbs + percentages.fat
  return Math.abs(total - 100) < 0.1 // Allow small floating point differences
}

export default function Goals() {
  const { 
    goals, 
    activeGoal, 
    currentWeight, 
    weightLogs, 
    refreshGoals, 
    refreshWeightLogs, 
    loading: globalLoading 
  } = useAppState()
  
  const isMobile = useBreakpointValue({ base: true, md: false })
  const cancelRef = useRef<HTMLButtonElement>(null)
  
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<any>(null)
  const [autoCalculateNutrition, setAutoCalculateNutrition] = useState(false)
  const [usePercentageMacros, setUsePercentageMacros] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [macroPercentages, setMacroPercentages] = useState({
    protein: 30, // 30% of calories
    carbs: 40,   // 40% of calories  
    fat: 30,     // 30% of calories
  })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isWeightLogOpen, onOpen: onWeightLogOpen, onClose: onWeightLogClose } = useDisclosure()
  const toast = useToast()

  // Real-time update interval
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!refreshing) {
        await refreshGoals()
        await refreshWeightLogs()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [refreshGoals, refreshWeightLogs, refreshing])

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refreshGoals(),
        refreshWeightLogs()
      ])
      toast({
        title: 'Data Refreshed',
        description: 'Goals and weight logs have been updated.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast({
        title: 'Refresh Error',
        description: 'Failed to refresh data. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setRefreshing(false)
    }
  }

  const [newGoal, setNewGoal] = useState({
    title: '',
    goal_type: 'weight_loss' as 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    weight_target: {
      current_weight: 154, // lbs
      target_weight: 140, // lbs
      weekly_rate: 1, // lbs per week
    },
    nutrition_targets: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 65,
      fiber: 30,
      sugar: 50,
      sodium: 2300,
      water_target: 64,
    },
  })

  const [newWeightLog, setNewWeightLog] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: 154, // lbs
    notes: '',
  })

  useEffect(() => {
    // Data is already being fetched by the AppStateProvider
    // We just need to ensure the form reflects the latest current weight
    if (newGoal.weight_target.current_weight === 154 && currentWeight !== 154) {
      setNewGoal(prev => ({
        ...prev,
        weight_target: { ...prev.weight_target, current_weight: currentWeight }
      }))
    }
  }, [currentWeight])

  // Remove old fetch functions since we're using context now
  const createGoal = async () => {
    setCreating(true)
    try {
      await api.post('/goals/', newGoal)
      
      toast({
        title: 'Goal Created',
        description: 'Your new goal has been set successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onClose()
      await refreshGoals() // Refresh global state
      
      // Reset form
      setNewGoal({
        title: '',
        goal_type: 'weight_loss',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        weight_target: {
          current_weight: currentWeight, // Use current weight from context
          target_weight: 140, // lbs
          weekly_rate: 1, // lbs per week
        },
        nutrition_targets: {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 65,
          fiber: 30,
          sugar: 50,
          sodium: 2300,
          water_target: 64,
        },
      })
    } catch (error) {
      console.error('Error creating goal:', error)
      toast({
        title: 'Creation Error',
        description: 'Failed to create goal. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setCreating(false)
  }

  const logWeight = async () => {
    try {
      const weightData = {
        date: newWeightLog.date,
        weight: lbsToKg(newWeightLog.weight), // Convert lbs to kg for backend
        notes: newWeightLog.notes,
      }

      await api.post('/weight-logs/', weightData)
      
      toast({
        title: 'Weight Logged',
        description: 'Your weight has been recorded successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onWeightLogClose()
      await refreshWeightLogs() // Refresh global state
      
      // Reset form
      setNewWeightLog({
        date: new Date().toISOString().split('T')[0],
        weight: currentWeight, // Use current weight as default
        notes: '',
      })
    } catch (error) {
      console.error('Error logging weight:', error)
      toast({
        title: 'Weight Log Error',
        description: 'Failed to log weight. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleEditGoal = (goal: any) => {
    setSelectedGoal(goal)
    setNewGoal({
      title: goal.title,
      goal_type: goal.goal_type,
      start_date: goal.start_date ? new Date(goal.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: goal.end_date ? new Date(goal.end_date).toISOString().split('T')[0] : '',
      weight_target: {
        current_weight: goal.weight_target ? kgToLbs(goal.weight_target.current_weight) : currentWeight,
        target_weight: goal.weight_target ? kgToLbs(goal.weight_target.target_weight) : 140,
        weekly_rate: goal.weight_target ? goal.weight_target.weekly_rate : 1,
      },
      nutrition_targets: {
        calories: goal.nutrition_targets?.calories || 2000,
        protein: goal.nutrition_targets?.protein || 150,
        carbs: goal.nutrition_targets?.carbs || 200,
        fat: goal.nutrition_targets?.fat || 65,
        fiber: goal.nutrition_targets?.fiber || 30,
        sugar: goal.nutrition_targets?.sugar || 50,
        sodium: goal.nutrition_targets?.sodium || 2300,
        water_target: goal.nutrition_targets?.water_target || 64,
      },
    })
    onEditOpen()
  }

  const updateGoal = async () => {
    if (!selectedGoal) return
    
    setEditing(true)
    try {
      await api.put(`/goals/${selectedGoal.id}`, newGoal)
      
      toast({
        title: 'Goal Updated',
        description: 'Your goal has been updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onEditClose()
      await refreshGoals() // Refresh global state
    } catch (error) {
      console.error('Error updating goal:', error)
      toast({
        title: 'Update Error',
        description: 'Failed to update goal. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setEditing(false)
  }

  const handleDeleteGoal = (goal: any) => {
    setSelectedGoal(goal)
    onDeleteOpen()
  }

  const deleteGoal = async () => {
    if (!selectedGoal) return
    
    setDeleting(true)
    
    try {
      await api.delete(`/goals/${selectedGoal.id}`)
      
      toast({
        title: 'Goal Deleted',
        description: 'Your goal has been deleted successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onDeleteClose()
      await refreshGoals() // Refresh global state
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast({
        title: 'Delete Error',
        description: 'Failed to delete goal. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setDeleting(false)
  }

  const calculateNutritionTargets = async () => {
    try {
      const calculationData = {
        age: 30, // This would come from user profile
        weight: lbsToKg(currentWeight), // Use current weight from logs
        height: 175, // This would come from user profile (cm)
        gender: 'male', // This would come from user profile
        activity_level: 'moderate',
        goal_type: newGoal.goal_type,
      }

      const response = await api.post('/goals/calculate-targets', calculationData)
      setNewGoal({
        ...newGoal,
        nutrition_targets: response.data,
      })

      // Don't show success toast for target calculation - it's automatic
      // toast({
      //   title: 'Targets Calculated',
      //   description: 'Nutrition targets have been calculated based on your profile.',
      //   status: 'success',
      //   duration: 3000,
      //   isClosable: true,
      // })
    } catch (error) {
      console.error('Error calculating targets:', error)
      toast({
        title: 'Calculation Error',
        description: 'Failed to calculate nutrition targets.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // Calculate expected completion date when weight targets change
  useEffect(() => {
    const completionDate = calculateCompletionDate(
      currentWeight, // Use actual current weight from logs
      newGoal.weight_target.target_weight,
      newGoal.weight_target.weekly_rate,
      newGoal.start_date
    )
    if (completionDate && completionDate !== newGoal.end_date) {
      setNewGoal(prev => ({ ...prev, end_date: completionDate }))
    }
  }, [
    currentWeight, // Include currentWeight in dependencies
    newGoal.weight_target.target_weight,
    newGoal.weight_target.weekly_rate,
    newGoal.start_date
  ])

  // Auto-calculate nutrition when enabled and weight targets change
  useEffect(() => {
    if (autoCalculateNutrition && currentWeight > 0) {
      calculateNutritionTargets()
    }
  }, [currentWeight, newGoal.goal_type, autoCalculateNutrition])

  // Auto-calculate macros when percentage mode is enabled
  useEffect(() => {
    if (usePercentageMacros && validatePercentageTotal(macroPercentages)) {
      const calculatedMacros = calculateMacrosFromPercentages(
        newGoal.nutrition_targets.calories,
        macroPercentages
      )
      
      setNewGoal(prev => ({
        ...prev,
        nutrition_targets: {
          ...prev.nutrition_targets,
          protein: calculatedMacros.protein,
          carbs: calculatedMacros.carbs,
          fat: calculatedMacros.fat,
        }
      }))
    }
  }, [usePercentageMacros, macroPercentages, newGoal.nutrition_targets.calories])

  const formatGoalType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <Container maxW={isMobile ? "100%" : "container.xl"} py={isMobile ? 4 : 8} px={isMobile ? 3 : 8}>
      <VStack spacing={isMobile ? 4 : 8} align="stretch">
        {/* Header */}
        <Box textAlign={isMobile ? "center" : "left"}>
          <HStack justify="space-between" align="center" mb={2}>
            <Heading size={isMobile ? "md" : "lg"}>
              Goals & Targets 🎯
            </Heading>
            <IconButton
              aria-label="Refresh data"
              icon={<RepeatIcon />}
              size="sm"
              variant="ghost"
              onClick={handleManualRefresh}
              isLoading={refreshing}
              colorScheme="blue"
            />
          </HStack>
          <Text color="gray.600" fontSize={isMobile ? "sm" : "md"}>
            Set and track your nutrition and fitness goals
          </Text>
          
          {/* Mobile Action Buttons */}
          {isMobile && (
            <HStack spacing={2} mt={4} justify="center">
              <Button colorScheme="blue" onClick={onWeightLogOpen} size="sm" flex={1}>
                Log Weight
              </Button>
              <Button colorScheme="green" onClick={onOpen} size="sm" flex={1}>
                New Goal
              </Button>
            </HStack>
          )}
        </Box>

        {/* Desktop Action Buttons */}
        {!isMobile && (
          <HStack justify="space-between">
            <Box />
            <HStack spacing={3}>
              <Button colorScheme="blue" onClick={onWeightLogOpen}>
                Log Weight
              </Button>
              <Button colorScheme="green" onClick={onOpen}>
                Create New Goal
              </Button>
            </HStack>
          </HStack>
        )}

        {/* Current Weight & Progress */}
        <Card bg="blue.50" borderColor="blue.200" borderWidth={2} size={isMobile ? "sm" : "md"}>
          <CardBody>
            <VStack spacing={isMobile ? 3 : 4} align="stretch">
              <VStack spacing={2} align={isMobile ? "center" : "start"}>
                <Heading size={isMobile ? "sm" : "md"}>Current Weight</Heading>
                <Text color="gray.600" fontSize="sm" textAlign={isMobile ? "center" : "left"}>
                  Track your weight progress over time
                </Text>
                <Text fontSize={isMobile ? "xl" : "2xl"} fontWeight="bold" color="blue.600">
                  {currentWeight.toFixed(1)} lbs
                </Text>
                <Text fontSize="sm" color="gray.500" textAlign={isMobile ? "center" : "left"}>
                  {weightLogs.length > 0 ? `Last updated: ${new Date(weightLogs[0].date).toLocaleDateString()}` : 'No weight logs yet'}
                </Text>
              </VStack>

              {/* Weight Progress Chart (Simple) */}
              {weightLogs.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Recent Weight History
                  </Text>
                  <HStack spacing={2} justify="space-between" overflow="auto">
                    {weightLogs.slice(0, 7).reverse().map((log) => (
                      <VStack key={log.id} spacing={1} minW="60px">
                        <Text fontSize="xs" color="gray.500">
                          {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                        <Box
                          bg="blue.400"
                          color="white"
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="medium"
                        >
                          {kgToLbs(log.weight).toFixed(1)}
                        </Box>
                      </VStack>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Active Goal Card - Enhanced with Progress */}
        {activeGoal && (
          <Card bg="green.50" borderColor="green.200" borderWidth={2}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" flexDir={{ base: 'column', sm: 'row' }}>
                  <Box>
                    <HStack>
                      <Heading size="md">{activeGoal.title}</Heading>
                      <Badge colorScheme="green">Active</Badge>
                    </HStack>
                    <Text color="gray.600" fontSize="sm">
                      {formatGoalType(activeGoal.goal_type)}
                    </Text>
                  </Box>
                  <Box textAlign="right">
                    <Text fontSize="sm" color="gray.500">
                      Started: {new Date(activeGoal.start_date).toLocaleDateString()}
                    </Text>
                    {activeGoal.end_date && (
                      <Text fontSize="sm" color="gray.500">
                        Target: {new Date(activeGoal.end_date).toLocaleDateString()}
                      </Text>
                    )}
                  </Box>
                </HStack>

                {/* Weight Progress with Visual Progress Bar */}
                {activeGoal.weight_target && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={3}>
                      Weight Progress
                    </Text>
                    
                    {/* Progress Bar */}
                    <Box mb={3}>
                      {(() => {
                        const startWeight = kgToLbs(activeGoal.weight_target.current_weight)
                        const targetWeight = kgToLbs(activeGoal.weight_target.target_weight)
                        const currentWeightLbs = currentWeight
                        
                        let progressPercentage = 0
                        if (startWeight !== targetWeight) {
                          if (targetWeight < startWeight) {
                            // Weight loss
                            progressPercentage = Math.max(0, Math.min(100, 
                              ((startWeight - currentWeightLbs) / (startWeight - targetWeight)) * 100
                            ))
                          } else {
                            // Weight gain
                            progressPercentage = Math.max(0, Math.min(100, 
                              ((currentWeightLbs - startWeight) / (targetWeight - startWeight)) * 100
                            ))
                          }
                        }
                        
                        return (
                          <VStack spacing={2} align="stretch">
                            <HStack justify="space-between" fontSize="sm">
                              <Text color="gray.600">
                                {startWeight.toFixed(1)} lbs (start)
                              </Text>
                              <Text color="gray.600">
                                {targetWeight.toFixed(1)} lbs (target)
                              </Text>
                            </HStack>
                            <Progress 
                              value={progressPercentage} 
                              colorScheme={progressPercentage >= 100 ? "green" : "blue"}
                              size="lg"
                              hasStripe
                              isAnimated
                            />
                            <Text fontSize="sm" color="gray.600" textAlign="center">
                              {progressPercentage.toFixed(1)}% complete
                            </Text>
                          </VStack>
                        )
                      })()}
                    </Box>
                    
                    <HStack spacing={4}>
                      <Stat size="sm">
                        <StatLabel>Current</StatLabel>
                        <StatNumber>{currentWeight.toFixed(1)} lbs</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Target</StatLabel>
                        <StatNumber>{kgToLbs(activeGoal.weight_target.target_weight).toFixed(1)} lbs</StatNumber>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Weekly Rate</StatLabel>
                        <StatNumber>{kgToLbs(activeGoal.weight_target.weekly_rate).toFixed(1)} lbs/week</StatNumber>
                      </Stat>
                    </HStack>
                  </Box>
                )}

                <Divider />

                {/* Daily Nutrition Targets */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={3}>
                    Daily Nutrition Targets
                  </Text>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Stat size="sm">
                      <StatLabel>Calories</StatLabel>
                      <StatNumber>{Math.round(activeGoal.nutrition_targets.calories)}</StatNumber>
                      <StatHelpText>kcal</StatHelpText>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Protein</StatLabel>
                      <StatNumber>{Math.round(activeGoal.nutrition_targets.protein)}</StatNumber>
                      <StatHelpText>grams</StatHelpText>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Carbs</StatLabel>
                      <StatNumber>{Math.round(activeGoal.nutrition_targets.carbs)}</StatNumber>
                      <StatHelpText>grams</StatHelpText>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Fat</StatLabel>
                      <StatNumber>{Math.round(activeGoal.nutrition_targets.fat)}</StatNumber>
                      <StatHelpText>grams</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* All Goals */}
        <Box>
          <Heading size="md" mb={4}>
            All Goals ({goals.length})
          </Heading>
          
          {globalLoading ? (
            <Text>Loading goals...</Text>
          ) : goals.length === 0 ? (
            <Card>
              <CardBody textAlign="center" py={12}>
                <Text fontSize="lg" color="gray.500">
                  No goals yet
                </Text>
                <Text fontSize="sm" color="gray.400" mt={2}>
                  Create your first goal to get started
                </Text>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {goals.map((goal) => (
                <Card key={goal.id} _hover={{ shadow: 'md' }}>
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <Box>
                          <Heading size="sm">{goal.title}</Heading>
                          <Text fontSize="sm" color="gray.600">
                            {formatGoalType(goal.goal_type)}
                          </Text>
                        </Box>
                        <HStack spacing={2}>
                          <Badge colorScheme={goal.active ? 'green' : 'gray'}>
                            {goal.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label="Goal options"
                              icon={<SettingsIcon />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem
                                icon={<EditIcon />}
                                onClick={() => handleEditGoal(goal)}
                              >
                                Edit Goal
                              </MenuItem>
                              <MenuItem
                                icon={<DeleteIcon />}
                                onClick={() => handleDeleteGoal(goal)}
                                color="red.500"
                              >
                                Delete Goal
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </HStack>
                      </HStack>

                      <Text fontSize="sm" color="gray.500">
                        Created: {new Date(goal.created_at).toLocaleDateString()}
                      </Text>

                      {goal.weight_target && (
                        <Text fontSize="sm">
                          Target: {kgToLbs(goal.weight_target.current_weight).toFixed(1)} lbs → {kgToLbs(goal.weight_target.target_weight).toFixed(1)} lbs
                        </Text>
                      )}

                      <Text fontSize="sm">
                        Daily calories: {goal.nutrition_targets ? Math.round(goal.nutrition_targets.calories) : 'Not set'} kcal
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>

      {/* Create Goal Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Goal</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Goal Title</FormLabel>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Lose weight for summer"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Goal Type</FormLabel>
                <Select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value as any })}
                >
                  <option value="weight_loss">Weight Loss</option>
                  <option value="weight_gain">Weight Gain</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="muscle_gain">Muscle Gain</option>
                </Select>
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={newGoal.start_date}
                    onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })}
                  />
                </FormControl>
              <FormControl>
                <FormLabel>End Date (Expected Completion)</FormLabel>
                <Input
                  type="date"
                  value={newGoal.end_date}
                  onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                  isReadOnly
                  bg="gray.50"
                />
                <FormHelperText>
                  Automatically calculated based on your weight targets and weekly rate
                </FormHelperText>
              </FormControl>
              </HStack>

              <Heading size="sm" alignSelf="start">Weight Targets (Imperial - lbs)</Heading>

              <SimpleGrid columns={3} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Current Weight (lbs)</FormLabel>
                  <NumberInput
                    value={currentWeight}
                    onChange={(_, value) => {
                      if (value && isValidWeight(value)) {
                        // Update the form state with the new weight
                        setNewGoal({
                          ...newGoal,
                          weight_target: { ...newGoal.weight_target, current_weight: value }
                        })
                      }
                    }}
                    min={MIN_WEIGHT}
                    max={MAX_WEIGHT}
                    step={0.1}
                    precision={1}
                    allowMouseWheel={false}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>Current weight from your logs: {currentWeight.toFixed(1)} lbs</FormHelperText>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Target Weight (lbs)</FormLabel>
                  <NumberInput
                    value={newGoal.weight_target.target_weight}
                    onChange={(_, value) => {
                      if (value && isValidWeight(value)) {
                        setNewGoal({
                          ...newGoal,
                          weight_target: { ...newGoal.weight_target, target_weight: value }
                        })
                      }
                    }}
                    min={MIN_WEIGHT}
                    max={MAX_WEIGHT}
                    step={0.1}
                    precision={1}
                    allowMouseWheel={false}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>Range: {MIN_WEIGHT}-{MAX_WEIGHT} lbs</FormHelperText>
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Weekly Rate (lbs/week)</FormLabel>
                  <NumberInput
                    value={newGoal.weight_target.weekly_rate}
                    onChange={(_, value) => {
                      if (value && value >= MIN_WEEKLY_RATE && value <= MAX_WEEKLY_RATE) {
                        setNewGoal({
                          ...newGoal,
                          weight_target: { ...newGoal.weight_target, weekly_rate: value }
                        })
                      }
                    }}
                    min={MIN_WEEKLY_RATE}
                    max={MAX_WEEKLY_RATE}
                    step={0.1}
                    precision={1}
                    allowMouseWheel={false}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>Safe range: {MIN_WEEKLY_RATE}-{MAX_WEEKLY_RATE} lbs/week</FormHelperText>
                </FormControl>
              </SimpleGrid>

              {/* Weight Difference Display */}
              <Card bg="blue.50" borderColor="blue.200">
                <CardBody py={3}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium">
                      Weight Change: {Math.abs(newGoal.weight_target.target_weight - currentWeight).toFixed(1)} lbs
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      Direction: {newGoal.weight_target.target_weight > currentWeight ? 'Gain' : 'Loss'}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      Expected Duration: {Math.ceil(Math.abs(newGoal.weight_target.target_weight - currentWeight) / newGoal.weight_target.weekly_rate)} weeks
                    </Text>
                  </HStack>
                </CardBody>
              </Card>

              <HStack justify="space-between" w="full">
                <Heading size="sm">Nutrition Targets</Heading>
                <HStack>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="percentage-mode" mb="0" fontSize="sm">
                      Percentage Mode
                    </FormLabel>
                    <Switch
                      id="percentage-mode"
                      isChecked={usePercentageMacros}
                      onChange={(e) => setUsePercentageMacros(e.target.checked)}
                      colorScheme="purple"
                      isDisabled={autoCalculateNutrition}
                    />
                  </FormControl>
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="auto-calculate" mb="0" fontSize="sm">
                      Auto-calculate nutrition targets
                    </FormLabel>
                    <Switch
                      id="auto-calculate"
                      isChecked={autoCalculateNutrition}
                      onChange={(e) => setAutoCalculateNutrition(e.target.checked)}
                      colorScheme="green"
                    />
                  </FormControl>
                  {!autoCalculateNutrition && (
                    <FormHelperText fontSize="xs" color="blue.600">
                      Manual mode: You can edit nutrition targets directly
                    </FormHelperText>
                  )}
                  {autoCalculateNutrition && (
                    <FormHelperText fontSize="xs" color="green.600">
                      Auto mode: Nutrition targets calculated based on your weight goals
                    </FormHelperText>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={calculateNutritionTargets}
                    isDisabled={autoCalculateNutrition}
                  >
                    Manual Calculate
                  </Button>
                </HStack>
              </HStack>

              {/* Percentage Mode Inputs */}
              {usePercentageMacros && !autoCalculateNutrition && (
                <>
                  <Box p={3} bg={validatePercentageTotal(macroPercentages) ? "green.50" : "orange.50"} borderRadius="md">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold">Macro Percentages</Text>
                        <Text fontSize="sm" color={validatePercentageTotal(macroPercentages) ? "green.600" : "orange.600"}>
                          {validatePercentageTotal(macroPercentages) 
                            ? `Total: ${(macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat).toFixed(1)}% ✓`
                            : `Total: ${(macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat).toFixed(1)}% - Must equal 100%`
                          }
                        </Text>
                      </VStack>
                      {!validatePercentageTotal(macroPercentages) && (
                        <Button
                          size="sm"
                          colorScheme="orange"
                          onClick={() => {
                            const total = macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat
                            const scaleFactor = 100 / total
                            setMacroPercentages({
                              protein: Math.round(macroPercentages.protein * scaleFactor),
                              carbs: Math.round(macroPercentages.carbs * scaleFactor),
                              fat: Math.round(macroPercentages.fat * scaleFactor),
                            })
                          }}
                        >
                          Auto-Balance
                        </Button>
                      )}
                    </HStack>
                  </Box>

                  <SimpleGrid columns={3} spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Protein (%)</FormLabel>
                      <NumberInput
                        value={macroPercentages.protein}
                        onChange={(_, value) => {
                          if (value !== undefined && value >= 0 && value <= 100) {
                            setMacroPercentages(prev => ({ ...prev, protein: value }))
                          }
                        }}
                        min={0}
                        max={100}
                        step={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <FormHelperText>
                        {Math.round((newGoal.nutrition_targets.calories * macroPercentages.protein / 100) / 4)}g
                      </FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Carbs (%)</FormLabel>
                      <NumberInput
                        value={macroPercentages.carbs}
                        onChange={(_, value) => {
                          if (value !== undefined && value >= 0 && value <= 100) {
                            setMacroPercentages(prev => ({ ...prev, carbs: value }))
                          }
                        }}
                        min={0}
                        max={100}
                        step={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <FormHelperText>
                        {Math.round((newGoal.nutrition_targets.calories * macroPercentages.carbs / 100) / 4)}g
                      </FormHelperText>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Fat (%)</FormLabel>
                      <NumberInput
                        value={macroPercentages.fat}
                        onChange={(_, value) => {
                          if (value !== undefined && value >= 0 && value <= 100) {
                            setMacroPercentages(prev => ({ ...prev, fat: value }))
                          }
                        }}
                        min={0}
                        max={100}
                        step={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <FormHelperText>
                        {Math.round((newGoal.nutrition_targets.calories * macroPercentages.fat / 100) / 9)}g
                      </FormHelperText>
                    </FormControl>
                  </SimpleGrid>

                  {/* Macro Preset Buttons */}
                  <HStack spacing={2} w="full" justify="center">
                    <Text fontSize="sm" color="gray.600">Quick Presets:</Text>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setMacroPercentages({ protein: 30, carbs: 40, fat: 30 })}
                    >
                      Balanced (30/40/30)
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setMacroPercentages({ protein: 40, carbs: 30, fat: 30 })}
                    >
                      High Protein (40/30/30)
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setMacroPercentages({ protein: 20, carbs: 15, fat: 65 })}
                    >
                      Keto (20/15/65)
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setMacroPercentages({ protein: 25, carbs: 55, fat: 20 })}
                    >
                      Low Fat (25/55/20)
                    </Button>
                  </HStack>
                </>
              )}

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isInvalid={!autoCalculateNutrition && !isValidNutrition('calories', newGoal.nutrition_targets.calories)}>
                  <FormLabel>Calories</FormLabel>
                  <NumberInput
                    value={newGoal.nutrition_targets.calories}
                    onChange={(_, value) => {
                      if (value && isValidNutrition('calories', value)) {
                        setNewGoal({
                          ...newGoal,
                          nutrition_targets: { ...newGoal.nutrition_targets, calories: value }
                        })
                      }
                    }}
                    min={NUTRITION_BOUNDS.calories.min}
                    max={NUTRITION_BOUNDS.calories.max}
                    step={50}
                    isDisabled={autoCalculateNutrition}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>Range: {NUTRITION_BOUNDS.calories.min}-{NUTRITION_BOUNDS.calories.max} kcal</FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Protein (g)</FormLabel>
                  <NumberInput
                    value={newGoal.nutrition_targets.protein}
                    onChange={(_, value) => {
                      if (value && isValidNutrition('protein', value)) {
                        setNewGoal({
                          ...newGoal,
                          nutrition_targets: { ...newGoal.nutrition_targets, protein: value }
                        })
                      }
                    }}
                    min={NUTRITION_BOUNDS.protein.min}
                    max={NUTRITION_BOUNDS.protein.max}
                    step={5}
                    isDisabled={autoCalculateNutrition || usePercentageMacros}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    {usePercentageMacros 
                      ? `${((newGoal.nutrition_targets.protein * 4 / newGoal.nutrition_targets.calories) * 100).toFixed(1)}% of calories`
                      : `Range: ${NUTRITION_BOUNDS.protein.min}-${NUTRITION_BOUNDS.protein.max} g`
                    }
                  </FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Carbs (g)</FormLabel>
                  <NumberInput
                    value={newGoal.nutrition_targets.carbs}
                    onChange={(_, value) => {
                      if (value && isValidNutrition('carbs', value)) {
                        setNewGoal({
                          ...newGoal,
                          nutrition_targets: { ...newGoal.nutrition_targets, carbs: value }
                        })
                      }
                    }}
                    min={NUTRITION_BOUNDS.carbs.min}
                    max={NUTRITION_BOUNDS.carbs.max}
                    step={5}
                    isDisabled={autoCalculateNutrition || usePercentageMacros}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    {usePercentageMacros 
                      ? `${((newGoal.nutrition_targets.carbs * 4 / newGoal.nutrition_targets.calories) * 100).toFixed(1)}% of calories`
                      : `Range: ${NUTRITION_BOUNDS.carbs.min}-${NUTRITION_BOUNDS.carbs.max} g`
                    }
                  </FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Fat (g)</FormLabel>
                  <NumberInput
                    value={newGoal.nutrition_targets.fat}
                    onChange={(_, value) => {
                      if (value && isValidNutrition('fat', value)) {
                        setNewGoal({
                          ...newGoal,
                          nutrition_targets: { ...newGoal.nutrition_targets, fat: value }
                        })
                      }
                    }}
                    min={NUTRITION_BOUNDS.fat.min}
                    max={NUTRITION_BOUNDS.fat.max}
                    step={5}
                    isDisabled={autoCalculateNutrition || usePercentageMacros}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>
                    {usePercentageMacros 
                      ? `${((newGoal.nutrition_targets.fat * 9 / newGoal.nutrition_targets.calories) * 100).toFixed(1)}% of calories`
                      : `Range: ${NUTRITION_BOUNDS.fat.min}-${NUTRITION_BOUNDS.fat.max} g`
                    }
                  </FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Fiber (g)</FormLabel>
                  <NumberInput
                    value={newGoal.nutrition_targets.fiber || 25}
                    onChange={(_, value) => {
                      if (value && isValidNutrition('fiber', value)) {
                        setNewGoal({
                          ...newGoal,
                          nutrition_targets: { ...newGoal.nutrition_targets, fiber: value }
                        })
                      }
                    }}
                    min={NUTRITION_BOUNDS.fiber.min}
                    max={NUTRITION_BOUNDS.fiber.max}
                    step={1}
                    isDisabled={autoCalculateNutrition}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>Range: {NUTRITION_BOUNDS.fiber.min}-{NUTRITION_BOUNDS.fiber.max} g</FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Sodium (mg)</FormLabel>
                  <NumberInput
                    value={newGoal.nutrition_targets.sodium || 2300}
                    onChange={(_, value) => {
                      if (value && isValidNutrition('sodium', value)) {
                        setNewGoal({
                          ...newGoal,
                          nutrition_targets: { ...newGoal.nutrition_targets, sodium: value }
                        })
                      }
                    }}
                    min={NUTRITION_BOUNDS.sodium.min}
                    max={NUTRITION_BOUNDS.sodium.max}
                    step={100}
                    isDisabled={autoCalculateNutrition}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>Range: {NUTRITION_BOUNDS.sodium.min}-{NUTRITION_BOUNDS.sodium.max} mg</FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Water Target (fl oz)</FormLabel>
                  <NumberInput
                    value={newGoal.nutrition_targets.water_target || 64}
                    onChange={(_, value) => {
                      if (value && isValidNutrition('water_target', value)) {
                        setNewGoal({
                          ...newGoal,
                          nutrition_targets: { ...newGoal.nutrition_targets, water_target: value }
                        })
                      }
                    }}
                    min={NUTRITION_BOUNDS.water_target.min}
                    max={NUTRITION_BOUNDS.water_target.max}
                    step={1}
                    isDisabled={autoCalculateNutrition}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormHelperText>Range: {NUTRITION_BOUNDS.water_target.min}-{NUTRITION_BOUNDS.water_target.max} fl oz per day</FormHelperText>
                </FormControl>
              </SimpleGrid>

              <Button
                colorScheme="green"
                onClick={createGoal}
                isLoading={creating}
                loadingText="Creating goal..."
                w="full"
                size="lg"
                isDisabled={usePercentageMacros && !validatePercentageTotal(macroPercentages)}
              >
                Create Goal
                {usePercentageMacros && !validatePercentageTotal(macroPercentages) && (
                  <Text fontSize="xs" color="gray.400" ml={2}>
                    (Balance percentages to 100%)
                  </Text>
                )}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Weight Log Modal */}
      <Modal isOpen={isWeightLogOpen} onClose={onWeightLogClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Log Your Weight</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={newWeightLog.date}
                  onChange={(e) => setNewWeightLog({ ...newWeightLog, date: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Weight (lbs)</FormLabel>
                <NumberInput
                  value={newWeightLog.weight}
                  onChange={(_, value) => {
                    if (value && isValidWeight(value)) {
                      setNewWeightLog({ ...newWeightLog, weight: value })
                    }
                  }}
                  min={MIN_WEIGHT}
                  max={MAX_WEIGHT}
                  step={0.1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>Range: {MIN_WEIGHT}-{MAX_WEIGHT} lbs</FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Notes (Optional)</FormLabel>
                <Textarea
                  value={newWeightLog.notes}
                  onChange={(e) => setNewWeightLog({ ...newWeightLog, notes: e.target.value })}
                  placeholder="e.g., Morning weight, after workout, etc."
                  rows={3}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                onClick={logWeight}
                isLoading={creating}
                loadingText="Logging weight..."
                w="full"
                size="lg"
              >
                Log Weight
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Goal</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Goal Title</FormLabel>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g., Lose weight for summer"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Goal Type</FormLabel>
                <Select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value as any })}
                >
                  <option value="weight_loss">Weight Loss</option>
                  <option value="weight_gain">Weight Gain</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="muscle_gain">Muscle Gain</option>
                </Select>
              </FormControl>

              <Button
                colorScheme="green"
                onClick={updateGoal}
                isLoading={editing}
                loadingText="Updating goal..."
                w="full"
                size="lg"
              >
                Update Goal
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Goal Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Goal
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{selectedGoal?.title}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={deleteGoal}
                isLoading={deleting}
                loadingText="Deleting..."
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
}
