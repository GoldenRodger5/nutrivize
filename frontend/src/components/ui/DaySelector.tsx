import React, { useState } from 'react'
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Icon,
  useColorModeValue,
  Divider,
  RadioGroup,
  Radio,
  Stack,
  Tooltip,
  SimpleGrid,
  useBreakpointValue
} from '@chakra-ui/react'
import { CalendarIcon, TimeIcon } from '@chakra-ui/icons'
import { format, addDays, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

interface DaySelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
  mealPlanStartDate?: string
  mealPlanDays?: number
  isDisabled?: boolean
  showMealPlanContext?: boolean
}

const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDate,
  onDateChange,
  mealPlanStartDate,
  mealPlanDays = 7,
  isDisabled = false,
  showMealPlanContext = false
}) => {
  const [viewMode, setViewMode] = useState<'quick' | 'calendar' | 'mealplan'>('quick')
  
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBg = useColorModeValue('blue.50', 'blue.900')
  const selectedColor = useColorModeValue('blue.600', 'blue.200')
  const columns = useBreakpointValue({ base: 1, md: showMealPlanContext ? 2 : 3, lg: 3 })

  const today = new Date()
  const yesterday = addDays(today, -1)
  const tomorrow = addDays(today, 1)

  const getQuickDayOptions = () => {
    const options = []
    
    // Yesterday
    options.push({
      value: format(yesterday, 'yyyy-MM-dd'),
      label: 'Yesterday',
      sublabel: format(yesterday, 'MMM dd'),
      badge: null
    })
    
    // Today
    options.push({
      value: format(today, 'yyyy-MM-dd'),
      label: 'Today',
      sublabel: format(today, 'MMM dd'),
      badge: 'Today'
    })
    
    // Tomorrow
    options.push({
      value: format(tomorrow, 'yyyy-MM-dd'),
      label: 'Tomorrow',
      sublabel: format(tomorrow, 'MMM dd'),
      badge: null
    })

    return options
  }

  const getMealPlanDayOptions = () => {
    if (!mealPlanStartDate) return []
    
    const startDate = parseISO(mealPlanStartDate)
    const options = []
    
    for (let i = 0; i < mealPlanDays; i++) {
      const date = addDays(startDate, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      
      let label = `Day ${i + 1}`
      let sublabel = format(date, 'MMM dd')
      let badge = null
      
      if (isToday(date)) {
        badge = 'Today'
      } else if (isTomorrow(date)) {
        badge = 'Tomorrow'
      } else if (isYesterday(date)) {
        badge = 'Yesterday'
      }
      
      options.push({
        value: dateStr,
        label,
        sublabel,
        badge,
        dayNumber: i + 1
      })
    }
    
    return options
  }

  const getDateDisplayName = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'MMM dd, yyyy')
  }

  const handleDateSelect = (dateStr: string) => {
    onDateChange(dateStr)
  }

  return (
    <Box>
      <FormControl>
        <FormLabel>
          <HStack>
            <Icon as={CalendarIcon} />
            <Text>Select Day for Meal Logging</Text>
          </HStack>
        </FormLabel>
        
        {showMealPlanContext && mealPlanStartDate && (
          <VStack spacing={3} align="stretch">
            {/* View Mode Selector */}
            <RadioGroup value={viewMode} onChange={(value) => setViewMode(value as any)}>
              <Stack direction="row" spacing={4}>
                <Radio value="quick" size="sm">Quick Select</Radio>
                <Radio value="mealplan" size="sm">Meal Plan Days</Radio>
              </Stack>
            </RadioGroup>
            
            <Divider />
            
            {viewMode === 'mealplan' && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Select from your meal plan days:
                </Text>
                <SimpleGrid columns={columns} spacing={2}>
                  {getMealPlanDayOptions().map((option) => (
                    <Button
                      key={option.value}
                      variant={selectedDate === option.value ? 'solid' : 'outline'}
                      colorScheme={selectedDate === option.value ? 'blue' : 'gray'}
                      size="sm"
                      onClick={() => handleDateSelect(option.value)}
                      isDisabled={isDisabled}
                      bg={selectedDate === option.value ? selectedBg : 'transparent'}
                      color={selectedDate === option.value ? selectedColor : 'inherit'}
                      borderColor={borderColor}
                      _hover={{
                        bg: selectedDate === option.value ? selectedBg : bgColor
                      }}
                      h="auto"
                      py={2}
                      px={3}
                    >
                      <VStack spacing={0}>
                        <Text fontWeight="medium" fontSize="sm">
                          {option.label}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {option.sublabel}
                        </Text>
                        {option.badge && (
                          <Badge size="xs" colorScheme="blue" mt={1}>
                            {option.badge}
                          </Badge>
                        )}
                      </VStack>
                    </Button>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        )}

        {(viewMode === 'quick' || !showMealPlanContext) && (
          <Box>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Quick day selection:
            </Text>
            <SimpleGrid columns={columns} spacing={2}>
              {getQuickDayOptions().map((option) => (
                <Button
                  key={option.value}
                  variant={selectedDate === option.value ? 'solid' : 'outline'}
                  colorScheme={selectedDate === option.value ? 'blue' : 'gray'}
                  size="sm"
                  onClick={() => handleDateSelect(option.value)}
                  isDisabled={isDisabled}
                  bg={selectedDate === option.value ? selectedBg : 'transparent'}
                  color={selectedDate === option.value ? selectedColor : 'inherit'}
                  borderColor={borderColor}
                  _hover={{
                    bg: selectedDate === option.value ? selectedBg : bgColor
                  }}
                  h="auto"
                  py={2}
                  px={3}
                >
                  <VStack spacing={0}>
                    <Text fontWeight="medium" fontSize="sm">
                      {option.label}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {option.sublabel}
                    </Text>
                    {option.badge && (
                      <Badge size="xs" colorScheme="blue" mt={1}>
                        {option.badge}
                      </Badge>
                    )}
                  </VStack>
                </Button>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Custom Date Selector */}
        <Box mt={4}>
          <Text fontSize="sm" color="gray.600" mb={2}>
            Or select a specific date:
          </Text>
          <HStack>
            <Select
              value={selectedDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              placeholder="Select custom date"
              isDisabled={isDisabled}
              size="sm"
              maxW="200px"
            >
              {/* Generate options for the next 30 days */}
              {Array.from({ length: 30 }, (_, i) => {
                const date = addDays(new Date(), i - 7) // Start from 7 days ago
                const dateStr = format(date, 'yyyy-MM-dd')
                const displayName = getDateDisplayName(dateStr)
                return (
                  <option key={dateStr} value={dateStr}>
                    {displayName}
                  </option>
                )
              })}
            </Select>
            <Tooltip label={`Currently selected: ${getDateDisplayName(selectedDate)}`}>
              <Icon as={TimeIcon} color="gray.400" />
            </Tooltip>
          </HStack>
        </Box>

        <FormHelperText>
          Choose the day you want to log meals for. This will be used for all meal logging during this session.
        </FormHelperText>
      </FormControl>
    </Box>
  )
}

export default DaySelector
