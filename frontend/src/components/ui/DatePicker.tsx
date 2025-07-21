import React, { useState } from 'react'
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  FormControl,
  FormLabel,
  FormHelperText,
  Icon,
  useColorModeValue,
  Text,
  VStack,
  Grid,
  GridItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  PopoverArrow,
  useDisclosure,
  IconButton,
  Center,
  Flex,
  Portal
} from '@chakra-ui/react'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
         addDays, addMonths, subMonths, isSameMonth, isSameDay, 
         isToday, isBefore, parseISO } from 'date-fns'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  helperText?: string
  label?: string
  minDate?: string
  maxDate?: string
  isDisabled?: boolean
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  helperText,
  label,
  minDate,
  maxDate,
  isDisabled = false
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      try {
        return parseISO(value)
      } catch {
        return new Date()
      }
    }
    return new Date()
  })

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const selectedBg = useColorModeValue('blue.500', 'blue.300')
  const todayBg = useColorModeValue('blue.50', 'blue.900')
  const disabledColor = useColorModeValue('gray.300', 'gray.600')

  const selectedDate = value ? parseISO(value) : null
  const minDateObj = minDate ? parseISO(minDate) : null
  const maxDateObj = maxDate ? parseISO(maxDate) : null

  const startDate = startOfWeek(startOfMonth(currentMonth))
  const endDate = endOfWeek(endOfMonth(currentMonth))

  const days = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const handleDateClick = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    onClose()
  }

  const isDateDisabled = (date: Date) => {
    if (isDisabled) return true
    if (minDateObj && isBefore(date, minDateObj)) return true
    if (maxDateObj && isBefore(maxDateObj, date)) return true
    return false
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = parseISO(dateStr)
      return format(date, 'MMM dd, yyyy')
    } catch {
      return dateStr
    }
  }

  const getQuickDateOptions = () => {
    const today = new Date()
    const tomorrow = addDays(today, 1)
    const nextWeek = addDays(today, 7)
    const nextMonth = addMonths(today, 1)

    return [
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: tomorrow },
      { label: 'Next Week', date: nextWeek },
      { label: 'Next Month', date: nextMonth }
    ].filter(option => !isDateDisabled(option.date))
  }

  return (
    <FormControl>
      {label && <FormLabel>{label}</FormLabel>}
      <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom-start">
        <PopoverTrigger>
          <InputGroup>
            <Input
              value={formatDisplayDate(value)}
              placeholder={placeholder}
              readOnly
              cursor="pointer"
              onClick={onOpen}
              isDisabled={isDisabled}
              _hover={{
                borderColor: isDisabled ? borderColor : 'blue.300'
              }}
            />
            <InputRightElement>
              <Icon as={CalendarIcon} color="gray.400" />
            </InputRightElement>
          </InputGroup>
        </PopoverTrigger>
        
        <Portal>
          <PopoverContent w="320px" bg={bg} borderColor={borderColor}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>
              <Flex align="center" justify="space-between">
                <IconButton
                  icon={<ChevronLeftIcon />}
                  aria-label="Previous month"
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                />
                <Text fontWeight="medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </Text>
                <IconButton
                  icon={<ChevronRightIcon />}
                  aria-label="Next month"
                  size="sm"
                  variant="ghost"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                />
              </Flex>
            </PopoverHeader>
            
            <PopoverBody p={0}>
              <VStack spacing={0}>
                {/* Quick date options */}
                <Box w="full" p={3} borderBottomWidth={1} borderColor={borderColor}>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Quick Select</Text>
                  <Flex wrap="wrap" gap={1}>
                    {getQuickDateOptions().map((option) => (
                      <Button
                        key={option.label}
                        size="xs"
                        variant="outline"
                        onClick={() => handleDateClick(option.date)}
                        colorScheme={selectedDate && isSameDay(selectedDate, option.date) ? 'blue' : 'gray'}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Flex>
                </Box>

                {/* Calendar grid */}
                <Box w="full" p={3}>
                  {/* Day headers */}
                  <Grid templateColumns="repeat(7, 1fr)" gap={1} mb={2}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <GridItem key={day}>
                        <Center h="8">
                          <Text fontSize="xs" fontWeight="medium" color="gray.500">
                            {day}
                          </Text>
                        </Center>
                      </GridItem>
                    ))}
                  </Grid>

                  {/* Calendar days */}
                  <Grid templateColumns="repeat(7, 1fr)" gap={1}>
                    {days.map((day) => {
                      const isSelected = selectedDate && isSameDay(day, selectedDate)
                      const isCurrentMonth = isSameMonth(day, currentMonth)
                      const isTodayDate = isToday(day)
                      const disabled = isDateDisabled(day)

                      return (
                        <GridItem key={day.toString()}>
                          <Button
                            size="sm"
                            variant={isSelected ? 'solid' : 'ghost'}
                            colorScheme={isSelected ? 'blue' : 'gray'}
                            bg={
                              isSelected 
                                ? selectedBg 
                                : isTodayDate 
                                  ? todayBg 
                                  : 'transparent'
                            }
                            color={
                              isSelected 
                                ? 'white' 
                                : !isCurrentMonth 
                                  ? disabledColor 
                                  : 'inherit'
                            }
                            _hover={{
                              bg: isSelected ? selectedBg : hoverBg
                            }}
                            h="8"
                            w="8"
                            minW="8"
                            fontSize="sm"
                            fontWeight={isTodayDate ? 'bold' : 'normal'}
                            onClick={() => handleDateClick(day)}
                            isDisabled={disabled || !isCurrentMonth}
                          >
                            {format(day, 'd')}
                          </Button>
                        </GridItem>
                      )
                    })}
                  </Grid>
                </Box>
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
      
      {helperText && (
        <FormHelperText>{helperText}</FormHelperText>
      )}
    </FormControl>
  )
}

export default DatePicker
