import React, { useState, useEffect } from 'react'
import {
  Input,
  Button,
  HStack,
  useColorModeValue
} from '@chakra-ui/react'
import { AddIcon, MinusIcon } from '@chakra-ui/icons'

interface NumberInputFieldProps {
  value: number | string
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  placeholder?: string
  size?: string
  allowDecimal?: boolean
  showSteppers?: boolean
  isDisabled?: boolean
}

export const NumberInputField: React.FC<NumberInputFieldProps> = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  precision = 2,
  placeholder = "",
  size = "md",
  allowDecimal = true,
  showSteppers = false,
  isDisabled = false
}) => {
  const [internalValue, setInternalValue] = useState<string>('')
  const borderColor = useColorModeValue('gray.300', 'gray.600')

  // Sync internal value with prop value
  useEffect(() => {
    if (value !== undefined && value !== null) {
      setInternalValue(String(value))
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Allow empty string for clearing
    if (inputValue === '') {
      setInternalValue('')
      onChange(0)
      return
    }

    // Create regex pattern based on decimal allowance
    const pattern = allowDecimal 
      ? /^-?\d*\.?\d*$/ 
      : /^-?\d*$/

    // Only allow valid number characters
    if (pattern.test(inputValue)) {
      setInternalValue(inputValue)
      
      // Parse and validate the number
      const numValue = parseFloat(inputValue)
      if (!isNaN(numValue)) {
        // Apply min/max constraints
        const constrainedValue = Math.max(min, Math.min(max, numValue))
        
        // Apply precision if it's a complete number
        if (!inputValue.endsWith('.')) {
          const roundedValue = allowDecimal 
            ? Math.round(constrainedValue * Math.pow(10, precision)) / Math.pow(10, precision)
            : Math.round(constrainedValue)
          onChange(roundedValue)
        } else {
          onChange(constrainedValue)
        }
      }
    }
  }

  const handleBlur = () => {
    // On blur, ensure we have a valid number
    if (internalValue === '' || isNaN(parseFloat(internalValue))) {
      const defaultValue = Math.max(min, 0)
      setInternalValue(String(defaultValue))
      onChange(defaultValue)
    } else {
      const numValue = parseFloat(internalValue)
      const constrainedValue = Math.max(min, Math.min(max, numValue))
      const finalValue = allowDecimal 
        ? Math.round(constrainedValue * Math.pow(10, precision)) / Math.pow(10, precision)
        : Math.round(constrainedValue)
      setInternalValue(String(finalValue))
      onChange(finalValue)
    }
  }

  const increment = () => {
    const currentValue = parseFloat(internalValue) || 0
    const newValue = Math.min(max, currentValue + step)
    const finalValue = allowDecimal 
      ? Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision)
      : Math.round(newValue)
    setInternalValue(String(finalValue))
    onChange(finalValue)
  }

  const decrement = () => {
    const currentValue = parseFloat(internalValue) || 0
    const newValue = Math.max(min, currentValue - step)
    const finalValue = allowDecimal 
      ? Math.round(newValue * Math.pow(10, precision)) / Math.pow(10, precision)
      : Math.round(newValue)
    setInternalValue(String(finalValue))
    onChange(finalValue)
  }

  if (showSteppers) {
    return (
      <HStack>
        <Button
          size="sm"
          onClick={decrement}
          isDisabled={isDisabled || parseFloat(internalValue) <= min}
          variant="outline"
        >
          <MinusIcon />
        </Button>
        <Input
          value={internalValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          size={size}
          textAlign="center"
          isDisabled={isDisabled}
          inputMode="decimal"
          borderColor={borderColor}
        />
        <Button
          size="sm"
          onClick={increment}
          isDisabled={isDisabled || parseFloat(internalValue) >= max}
          variant="outline"
        >
          <AddIcon />
        </Button>
      </HStack>
    )
  }

  return (
    <Input
      value={internalValue}
      onChange={handleInputChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      size={size}
      isDisabled={isDisabled}
      inputMode="decimal"
      borderColor={borderColor}
    />
  )
}

export default NumberInputField
