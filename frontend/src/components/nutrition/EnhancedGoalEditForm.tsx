import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Button,
  ButtonGroup,
  Divider,
  SimpleGrid,
  Badge,
  Icon,
  Tooltip,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { InfoIcon, CheckIcon } from '@chakra-ui/icons'
import { Goal, NutritionInfo } from '../../types'

interface EnhancedGoalEditFormProps {
  goal: Goal
  onSave: (updatedGoal: Goal) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const EnhancedGoalEditForm: React.FC<EnhancedGoalEditFormProps> = ({
  goal,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Goal>(goal)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    setFormData(goal)
  }, [goal])

  const validateForm = (): boolean => {
    const errors: string[] = []
    
    if (!formData.title?.trim()) {
      errors.push('Goal title is required')
    }
    
    if (!formData.start_date) {
      errors.push('Start date is required')
    }
    
    if (formData.nutrition_targets) {
      const targets = formData.nutrition_targets
      if (targets.calories && targets.calories < 800) {
        errors.push('Calorie target should be at least 800')
      }
      if (targets.calories && targets.calories > 5000) {
        errors.push('Calorie target should not exceed 5000')
      }
      if (targets.protein && targets.protein < 0) {
        errors.push('Protein target cannot be negative')
      }
      if (targets.carbs && targets.carbs < 0) {
        errors.push('Carbs target cannot be negative')
      }
      if (targets.fat && targets.fat < 0) {
        errors.push('Fat target cannot be negative')
      }
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving goal:', error)
    }
  }

  const handleNutritionTargetChange = (field: keyof NutritionInfo, value: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      nutrition_targets: {
        ...prev.nutrition_targets,
        [field]: value
      }
    }))
  }

  const getGoalTypeOptions = () => [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'weight_gain', label: 'Weight Gain' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'maintenance', label: 'Maintenance' }
  ]

  const getMacroPresets = () => [
    { name: 'Balanced', protein: 30, carbs: 40, fat: 30 },
    { name: 'Low Carb', protein: 35, carbs: 25, fat: 40 },
    { name: 'High Protein', protein: 40, carbs: 35, fat: 25 },
    { name: 'Keto', protein: 25, carbs: 5, fat: 70 },
    { name: 'Endurance', protein: 20, carbs: 55, fat: 25 }
  ]

  const applyMacroPreset = (preset: { protein: number; carbs: number; fat: number }) => {
    const calories = formData.nutrition_targets?.calories || 2000
    handleNutritionTargetChange('protein', Math.round((calories * preset.protein / 100) / 4))
    handleNutritionTargetChange('carbs', Math.round((calories * preset.carbs / 100) / 4))
    handleNutritionTargetChange('fat', Math.round((calories * preset.fat / 100) / 9))
  }

  return (
    <Box p={6} borderWidth={1} borderRadius="lg" borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={4}>
            Edit Goal: {goal.title}
          </Text>
          
          {validationErrors.length > 0 && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              <VStack align="start" spacing={1}>
                {validationErrors.map((error, index) => (
                  <Text key={index} fontSize="sm">{error}</Text>
                ))}
              </VStack>
            </Alert>
          )}
        </Box>

        {/* Basic Information */}
        <VStack spacing={4} align="stretch">
          <Text fontSize="md" fontWeight="semibold">Basic Information</Text>
          
          <FormControl isRequired>
            <FormLabel>Goal Title</FormLabel>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter goal title"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Start Date</FormLabel>
            <Input
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </FormControl>

          <FormControl>
            <FormLabel>End Date</FormLabel>
            <Input
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Goal Type</FormLabel>
            <Select
              value={formData.goal_type || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, goal_type: e.target.value as Goal['goal_type'] }))}
            >
              {getGoalTypeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </VStack>

        <Divider />

        {/* Nutrition Targets */}
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="md" fontWeight="semibold">Nutrition Targets</Text>
            <Badge colorScheme="blue">Daily Goals</Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>
                <HStack>
                  <Text>Calories</Text>
                  <Tooltip label="Total daily calorie target">
                    <Icon as={InfoIcon} color="gray.400" />
                  </Tooltip>
                </HStack>
              </FormLabel>
              <NumberInput
                value={formData.nutrition_targets?.calories || ''}
                onChange={(_, num) => handleNutritionTargetChange('calories', num)}
                min={800}
                max={5000}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>
                <HStack>
                  <Text>Protein (g)</Text>
                  <Tooltip label="Daily protein target in grams">
                    <Icon as={InfoIcon} color="gray.400" />
                  </Tooltip>
                </HStack>
              </FormLabel>
              <NumberInput
                value={formData.nutrition_targets?.protein || ''}
                onChange={(_, num) => handleNutritionTargetChange('protein', num)}
                min={0}
                max={500}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>
                <HStack>
                  <Text>Carbs (g)</Text>
                  <Tooltip label="Daily carbohydrate target in grams">
                    <Icon as={InfoIcon} color="gray.400" />
                  </Tooltip>
                </HStack>
              </FormLabel>
              <NumberInput
                value={formData.nutrition_targets?.carbs || ''}
                onChange={(_, num) => handleNutritionTargetChange('carbs', num)}
                min={0}
                max={1000}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>
                <HStack>
                  <Text>Fat (g)</Text>
                  <Tooltip label="Daily fat target in grams">
                    <Icon as={InfoIcon} color="gray.400" />
                  </Tooltip>
                </HStack>
              </FormLabel>
              <NumberInput
                value={formData.nutrition_targets?.fat || ''}
                onChange={(_, num) => handleNutritionTargetChange('fat', num)}
                min={0}
                max={300}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </SimpleGrid>

          {/* Macro Presets */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Quick Macro Presets</Text>
            <HStack spacing={2} flexWrap="wrap">
              {getMacroPresets().map(preset => (
                <Button
                  key={preset.name}
                  size="sm"
                  variant="outline"
                  onClick={() => applyMacroPreset(preset)}
                  isDisabled={!formData.nutrition_targets?.calories}
                >
                  {preset.name}
                </Button>
              ))}
            </HStack>
            <FormHelperText>
              Presets automatically calculate macro targets based on your calorie goal
            </FormHelperText>
          </Box>
        </VStack>

        <Divider />

        {/* Advanced Settings */}
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Text fontSize="md" fontWeight="semibold">Additional Nutrition Targets</Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Fiber (g)</FormLabel>
                  <NumberInput
                    value={formData.nutrition_targets?.fiber || ''}
                    onChange={(_, num) => handleNutritionTargetChange('fiber', num)}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Sugar (g)</FormLabel>
                  <NumberInput
                    value={formData.nutrition_targets?.sugar || ''}
                    onChange={(_, num) => handleNutritionTargetChange('sugar', num)}
                    min={0}
                    max={200}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Sodium (mg)</FormLabel>
                  <NumberInput
                    value={formData.nutrition_targets?.sodium || ''}
                    onChange={(_, num) => handleNutritionTargetChange('sodium', num)}
                    min={0}
                    max={5000}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <Divider />

        {/* Action Buttons */}
        <ButtonGroup spacing={4} justifyContent="flex-end">
          <Button
            variant="outline"
            onClick={onCancel}
            isDisabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isLoading}
            loadingText="Saving..."
            leftIcon={<CheckIcon />}
          >
            Save Changes
          </Button>
        </ButtonGroup>
      </VStack>
    </Box>
  )
}

export default EnhancedGoalEditForm
