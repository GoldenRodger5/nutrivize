import React, { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Card,
  CardBody,
  Badge,
  IconButton,
  SimpleGrid,
  Divider,
  useToast,
  useColorModeValue,
  Checkbox,
  Stat,
  StatLabel,
  StatNumber,
  ButtonGroup,
  useDisclosure,
  Spinner
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import { MdContentCopy, MdSchedule } from 'react-icons/md'
import api from '../utils/api'
import { FoodItem, NutritionInfo } from '../types'
import DaySelector from './DaySelector'

interface BatchFoodEntry {
  id: string
  food_item: FoodItem
  serving_size: number
  meal_type: string
  date: string
  notes?: string
  logged: boolean
}

interface BatchFoodLoggingProps {
  initialDate?: string
  initialMealType?: string
  onComplete?: (entries: BatchFoodEntry[]) => void
  onCancel?: () => void
}

const BatchFoodLogging: React.FC<BatchFoodLoggingProps> = ({
  initialDate = new Date().toISOString().split('T')[0],
  initialMealType = 'breakfast',
  onComplete,
  onCancel
}) => {
  const [entries, setEntries] = useState<BatchFoodEntry[]>([])
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [batchMealType, setBatchMealType] = useState(initialMealType)
  const [showNutritionSummary, setShowNutritionSummary] = useState(false)
  
  const toast = useToast()
  const { onOpen: onTemplateOpen } = useDisclosure()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const timeoutId = setTimeout(() => {
        searchFoods()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchFoods = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await api.get(`/food/search`, {
        params: { query: searchQuery.trim(), limit: 20 }
      })
      setSearchResults(response.data || [])
    } catch (err: any) {
      console.error('Search error:', err)
      toast({
        title: 'Search Error',
        description: 'Failed to search foods',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsSearching(false)
    }
  }

  const addFoodEntry = (food: FoodItem) => {
    const newEntry: BatchFoodEntry = {
      id: `${Date.now()}-${Math.random()}`,
      food_item: food,
      serving_size: 1,
      meal_type: batchMealType,
      date: selectedDate,
      logged: false
    }
    setEntries(prev => [...prev, newEntry])
    setSearchQuery('')
    setSearchResults([])
  }

  const updateEntry = (entryId: string, updates: Partial<BatchFoodEntry>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, ...updates } : entry
    ))
  }

  const removeEntry = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId))
    setSelectedEntries(prev => prev.filter(id => id !== entryId))
  }

  const duplicateEntry = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId)
    if (entry) {
      const newEntry: BatchFoodEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random()}`,
        logged: false
      }
      setEntries(prev => [...prev, newEntry])
    }
  }

  const calculateTotalNutrition = (selectedOnly: boolean = false): NutritionInfo => {
    const relevantEntries = selectedOnly 
      ? entries.filter(entry => selectedEntries.includes(entry.id))
      : entries
    
    return relevantEntries.reduce((total, entry) => {
      const multiplier = entry.serving_size
      return {
        calories: total.calories + (entry.food_item.nutrition.calories * multiplier),
        protein: total.protein + (entry.food_item.nutrition.protein * multiplier),
        carbs: total.carbs + (entry.food_item.nutrition.carbs * multiplier),
        fat: total.fat + (entry.food_item.nutrition.fat * multiplier),
        fiber: (total.fiber || 0) + ((entry.food_item.nutrition.fiber || 0) * multiplier),
        sugar: (total.sugar || 0) + ((entry.food_item.nutrition.sugar || 0) * multiplier),
        sodium: (total.sodium || 0) + ((entry.food_item.nutrition.sodium || 0) * multiplier)
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 })
  }

  const logSelectedEntries = async () => {
    if (selectedEntries.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select entries to log',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setIsLogging(true)
    try {
      const entriesToLog = entries.filter(entry => selectedEntries.includes(entry.id))
      
      const logPromises = entriesToLog.map(entry => {
        const logData = {
          food_item_id: entry.food_item.id,
          serving_size: entry.serving_size,
          meal_type: entry.meal_type,
          date: entry.date,
          notes: entry.notes
        }
        return api.post('/food/log', logData)
      })

      await Promise.all(logPromises)
      
      // Mark entries as logged
      setEntries(prev => prev.map(entry => 
        selectedEntries.includes(entry.id) 
          ? { ...entry, logged: true }
          : entry
      ))
      
      setSelectedEntries([])
      
      toast({
        title: 'Success',
        description: `${entriesToLog.length} entries logged successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err: any) {
      console.error('Logging error:', err)
      toast({
        title: 'Error',
        description: 'Failed to log some entries',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsLogging(false)
    }
  }

  const logAllEntries = async () => {
    const unloggedEntries = entries.filter(entry => !entry.logged)
    if (unloggedEntries.length === 0) {
      toast({
        title: 'Nothing to Log',
        description: 'All entries have already been logged',
        status: 'info',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setSelectedEntries(unloggedEntries.map(entry => entry.id))
    await logSelectedEntries()
  }

  const applyBatchChanges = () => {
    if (selectedEntries.length === 0) return
    
    setEntries(prev => prev.map(entry => 
      selectedEntries.includes(entry.id) 
        ? { ...entry, meal_type: batchMealType, date: selectedDate }
        : entry
    ))
    
    toast({
      title: 'Applied Changes',
      description: `Updated ${selectedEntries.length} entries`,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  const totalNutrition = calculateTotalNutrition()
  const selectedNutrition = calculateTotalNutrition(true)
  const unloggedCount = entries.filter(entry => !entry.logged).length

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={0}>
            <Text fontSize="xl" fontWeight="bold">
              Batch Food Logging
            </Text>
            <Text fontSize="sm" color="gray.500">
              Add multiple foods and log them together
            </Text>
          </VStack>
          <ButtonGroup size="sm">
            <Button
              leftIcon={<MdSchedule />}
              onClick={onTemplateOpen}
              variant="outline"
            >
              Templates
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => setShowNutritionSummary(!showNutritionSummary)}
            >
              {showNutritionSummary ? 'Hide' : 'Show'} Summary
            </Button>
          </ButtonGroup>
        </HStack>

        {/* Day and Meal Type Selection */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <DaySelector
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                isDisabled={false}
              />
            </CardBody>
          </Card>

          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <FormControl>
                <FormLabel>Default Meal Type</FormLabel>
                <Select
                  value={batchMealType}
                  onChange={(e) => setBatchMealType(e.target.value)}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </Select>
              </FormControl>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Food Search */}
        <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
          <CardBody>
            <FormControl>
              <FormLabel>Search Foods</FormLabel>
              <HStack>
                <Input
                  placeholder="Search for foods to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {isSearching && <Spinner size="sm" />}
              </HStack>
            </FormControl>
            
            {searchResults.length > 0 && (
              <VStack mt={4} spacing={2} align="stretch">
                {searchResults.map((food) => (
                  <HStack
                    key={food.id}
                    p={2}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="md"
                    justify="space-between"
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {food.name}
                      </Text>
                      <HStack fontSize="xs" color="gray.500">
                        <Text>{food.nutrition.calories} cal</Text>
                        <Text>•</Text>
                        <Text>{food.serving_size} {food.serving_unit}</Text>
                      </HStack>
                    </VStack>
                    <IconButton
                      icon={<AddIcon />}
                      size="sm"
                      onClick={() => addFoodEntry(food)}
                      colorScheme="blue"
                      aria-label="Add food"
                    />
                  </HStack>
                ))}
              </VStack>
            )}
          </CardBody>
        </Card>

        {/* Nutrition Summary */}
        {showNutritionSummary && (
          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4}>
                <Text fontSize="lg" fontWeight="semibold">
                  Nutrition Summary
                </Text>
                
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
                  <Stat>
                    <StatLabel>Total Calories</StatLabel>
                    <StatNumber>{totalNutrition.calories.toFixed(0)}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Protein</StatLabel>
                    <StatNumber>{totalNutrition.protein.toFixed(1)}g</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Carbs</StatLabel>
                    <StatNumber>{totalNutrition.carbs.toFixed(1)}g</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Fat</StatLabel>
                    <StatNumber>{totalNutrition.fat.toFixed(1)}g</StatNumber>
                  </Stat>
                </SimpleGrid>
                
                {selectedEntries.length > 0 && (
                  <>
                    <Divider />
                    <VStack spacing={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        Selected Items ({selectedEntries.length})
                      </Text>
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
                        <Stat size="sm">
                          <StatLabel>Calories</StatLabel>
                          <StatNumber>{selectedNutrition.calories.toFixed(0)}</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Protein</StatLabel>
                          <StatNumber>{selectedNutrition.protein.toFixed(1)}g</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Carbs</StatLabel>
                          <StatNumber>{selectedNutrition.carbs.toFixed(1)}g</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Fat</StatLabel>
                          <StatNumber>{selectedNutrition.fat.toFixed(1)}g</StatNumber>
                        </Stat>
                      </SimpleGrid>
                    </VStack>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Batch Actions */}
        {entries.length > 0 && (
          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    Batch Actions
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {selectedEntries.length} of {entries.length} items selected
                  </Text>
                </VStack>
                <ButtonGroup size="sm">
                  <Button
                    onClick={applyBatchChanges}
                    isDisabled={selectedEntries.length === 0}
                    variant="outline"
                  >
                    Apply Date/Meal Type
                  </Button>
                  <Button
                    onClick={logSelectedEntries}
                    isLoading={isLogging}
                    isDisabled={selectedEntries.length === 0}
                    colorScheme="blue"
                  >
                    Log Selected
                  </Button>
                  <Button
                    onClick={logAllEntries}
                    isLoading={isLogging}
                    isDisabled={unloggedCount === 0}
                    colorScheme="green"
                  >
                    Log All ({unloggedCount})
                  </Button>
                </ButtonGroup>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Food Entries */}
        {entries.length > 0 && (
          <Card bg={bgColor} borderWidth={1} borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="lg" fontWeight="semibold">
                    Food Entries ({entries.length})
                  </Text>
                  <Checkbox
                    isChecked={selectedEntries.length === entries.length}
                    isIndeterminate={selectedEntries.length > 0 && selectedEntries.length < entries.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEntries(entries.map(entry => entry.id))
                      } else {
                        setSelectedEntries([])
                      }
                    }}
                  >
                    Select All
                  </Checkbox>
                </HStack>

                <VStack spacing={3} align="stretch">
                  {entries.map((entry) => (
                    <Box
                      key={entry.id}
                      p={4}
                      bg={entry.logged ? useColorModeValue('green.50', 'green.900') : useColorModeValue('gray.50', 'gray.700')}
                      borderRadius="md"
                      borderWidth={1}
                      borderColor={selectedEntries.includes(entry.id) ? 'blue.300' : 'transparent'}
                    >
                      <HStack align="start" spacing={3}>
                        <Checkbox
                          isChecked={selectedEntries.includes(entry.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntries(prev => [...prev, entry.id])
                            } else {
                              setSelectedEntries(prev => prev.filter(id => id !== entry.id))
                            }
                          }}
                          mt={1}
                        />
                        
                        <VStack align="stretch" spacing={3} flex={1}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium">{entry.food_item.name}</Text>
                              <HStack fontSize="sm" color="gray.500">
                                <Text>{entry.food_item.nutrition.calories} cal per {entry.food_item.serving_size} {entry.food_item.serving_unit}</Text>
                                {entry.logged && <Badge colorScheme="green">Logged</Badge>}
                              </HStack>
                            </VStack>
                            <HStack>
                              <IconButton
                                icon={<MdContentCopy />}
                                size="sm"
                                onClick={() => duplicateEntry(entry.id)}
                                aria-label="Duplicate entry"
                                variant="ghost"
                              />
                              <IconButton
                                icon={<DeleteIcon />}
                                size="sm"
                                onClick={() => removeEntry(entry.id)}
                                aria-label="Remove entry"
                                variant="ghost"
                                colorScheme="red"
                              />
                            </HStack>
                          </HStack>

                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                            <FormControl size="sm">
                              <FormLabel fontSize="xs">Serving Size</FormLabel>
                              <NumberInput
                                value={entry.serving_size}
                                onChange={(_, num) => updateEntry(entry.id, { serving_size: num || 1 })}
                                min={0.1}
                                max={20}
                                step={0.1}
                                size="sm"
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </FormControl>

                            <FormControl size="sm">
                              <FormLabel fontSize="xs">Meal Type</FormLabel>
                              <Select
                                value={entry.meal_type}
                                onChange={(e) => updateEntry(entry.id, { meal_type: e.target.value })}
                                size="sm"
                              >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                              </Select>
                            </FormControl>

                            <FormControl size="sm">
                              <FormLabel fontSize="xs">Date</FormLabel>
                              <Input
                                type="date"
                                value={entry.date}
                                onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                                size="sm"
                              />
                            </FormControl>

                            <FormControl size="sm">
                              <FormLabel fontSize="xs">Notes</FormLabel>
                              <Input
                                value={entry.notes || ''}
                                onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                                placeholder="Optional notes"
                                size="sm"
                              />
                            </FormControl>
                          </SimpleGrid>

                          {/* Nutrition for this entry */}
                          <HStack fontSize="xs" color="gray.600" spacing={4}>
                            <Text>Total: {(entry.food_item.nutrition.calories * entry.serving_size).toFixed(0)} cal</Text>
                            <Text>•</Text>
                            <Text>P: {(entry.food_item.nutrition.protein * entry.serving_size).toFixed(1)}g</Text>
                            <Text>•</Text>
                            <Text>C: {(entry.food_item.nutrition.carbs * entry.serving_size).toFixed(1)}g</Text>
                            <Text>•</Text>
                            <Text>F: {(entry.food_item.nutrition.fat * entry.serving_size).toFixed(1)}g</Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Action Buttons */}
        <HStack justify="space-between">
          <Button
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onComplete?.(entries)}
            colorScheme="blue"
            isDisabled={entries.length === 0}
          >
            Complete
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}

export default BatchFoodLogging
