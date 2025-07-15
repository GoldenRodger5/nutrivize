import { useState, useEffect } from 'react'
import {
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  FormControl,
  FormLabel,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react'
import { 
  convertUnit, 
  areUnitsCompatible, 
  formatQuantity, 
  ALL_UNITS, 
  getUnitCategory,
  getSuggestedUnits 
} from '../utils/unitConversion'

interface QuantityUnitInputProps {
  quantity: number
  unit: string
  onQuantityChange: (quantity: number) => void
  onUnitChange: (unit: string) => void
  onConvertedChange?: (quantity: number, unit: string) => void
  baseNutrition?: Record<string, number>
  onNutritionChange?: (nutrition: Record<string, number>) => void
  size?: 'sm' | 'md' | 'lg'
  isDisabled?: boolean
  showConversionHint?: boolean
  allowDecimals?: boolean
  min?: number
  label?: string
}

export default function QuantityUnitInput({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  onConvertedChange,
  baseNutrition,
  onNutritionChange,
  size = 'md',
  isDisabled = false,
  showConversionHint = true,
  allowDecimals = true,
  min = 0.01,
  label
}: QuantityUnitInputProps) {
  const [internalQuantity, setInternalQuantity] = useState(quantity)
  const [conversionHint, setConversionHint] = useState<string>('')
  const toast = useToast()

  // Update internal state when props change
  useEffect(() => {
    setInternalQuantity(quantity)
  }, [quantity])

  // Get appropriate units for the current unit category
  const currentCategory = getUnitCategory(unit)
  const suggestedUnits = currentCategory !== 'unknown' 
    ? getSuggestedUnits(currentCategory)
    : ALL_UNITS.slice(0, 20) // Limit to first 20 units if unknown category

  // All units for dropdown (categorized + all others)
  const allUnitsForDropdown = [
    ...new Set([...suggestedUnits, unit, ...ALL_UNITS])
  ].filter(Boolean)

  const handleUnitChange = (newUnit: string) => {
    if (!newUnit || newUnit === unit) return

    // Check if conversion is possible
    if (!areUnitsCompatible(unit, newUnit)) {
      // If units are incompatible, just change the unit without conversion
      onUnitChange(newUnit)
      if (onConvertedChange) {
        onConvertedChange(internalQuantity, newUnit)
      }
      
      if (showConversionHint) {
        setConversionHint(`Changed unit to ${newUnit} (no conversion applied)`)
      }
      return
    }

    // Perform conversion
    const conversion = convertUnit(internalQuantity, unit, newUnit)
    
    if (conversion.isValid) {
      const convertedQuantity = formatQuantity(conversion.value)
      setInternalQuantity(convertedQuantity)
      onQuantityChange(convertedQuantity)
      onUnitChange(newUnit)
      
      if (onConvertedChange) {
        onConvertedChange(convertedQuantity, newUnit)
      }
      
      if (showConversionHint && internalQuantity !== convertedQuantity) {
        setConversionHint(
          `Converted: ${internalQuantity} ${unit} = ${convertedQuantity} ${newUnit}`
        )
        
        // Clear hint after 3 seconds
        setTimeout(() => setConversionHint(''), 3000)
      }

      // Calculate new nutrition values if provided
      if (baseNutrition && onNutritionChange) {
        const originalConversion = convertUnit(convertedQuantity, newUnit, unit)
        if (originalConversion.isValid) {
          const scaleFactor = originalConversion.value / quantity
          const newNutrition: Record<string, number> = {}
          
          for (const [nutrient, value] of Object.entries(baseNutrition)) {
            newNutrition[nutrient] = Math.round((value * scaleFactor) * 100) / 100
          }
          
          onNutritionChange(newNutrition)
        }
      }
    } else {
      // Show error toast
      toast({
        title: 'Conversion Error',
        description: conversion.error || 'Unable to convert units',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const handleQuantityBlur = () => {
    // Ensure minimum value on blur (only if greater than 0)
    if (internalQuantity > 0 && internalQuantity < min) {
      const correctedValue = min
      setInternalQuantity(correctedValue)
      onQuantityChange(correctedValue)
      
      if (onConvertedChange) {
        onConvertedChange(correctedValue, unit)
      }
    }
  }

  return (
    <VStack spacing={2} align="stretch">
      <HStack spacing={2}>
        <FormControl flex={2}>
          {label && <FormLabel mb={1} fontSize="sm">{label} Quantity</FormLabel>}
          <NumberInput
            value={internalQuantity === 0 ? '' : internalQuantity}
            onChange={(valueString, valueNumber) => {
              if (valueString === '' || valueString === '0') {
                setInternalQuantity(0)
                onQuantityChange(0)
                if (onConvertedChange) {
                  onConvertedChange(0, unit)
                }
              } else if (!isNaN(valueNumber) && valueNumber >= 0) {
                const formattedValue = formatQuantity(valueNumber)
                setInternalQuantity(formattedValue)
                onQuantityChange(formattedValue)
                if (onConvertedChange) {
                  onConvertedChange(formattedValue, unit)
                }
              }
            }}
            onBlur={handleQuantityBlur}
            min={0}
            step={allowDecimals ? 0.1 : 1}
            precision={allowDecimals ? 3 : 0}
            size={size}
            isDisabled={isDisabled}
            allowMouseWheel
          >
            <NumberInputField 
              onFocus={(e) => e.target.select()} // Select all on focus for easy editing
              placeholder="0.0"
            />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
        
        <FormControl flex={1}>
          {label && <FormLabel mb={1} fontSize="sm">Unit</FormLabel>}
          <Select
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value)}
            size={size}
            isDisabled={isDisabled}
          >
            {/* Suggested units first */}
            {suggestedUnits.map(unitOption => (
              <option key={unitOption} value={unitOption}>
                {unitOption}
              </option>
            ))}
            
            {/* Separator if there are more units */}
            {suggestedUnits.length < allUnitsForDropdown.length && (
              <option disabled>──────────</option>
            )}
            
            {/* All other units */}
            {allUnitsForDropdown
              .filter(unitOption => !suggestedUnits.includes(unitOption))
              .map(unitOption => (
                <option key={unitOption} value={unitOption}>
                  {unitOption}
                </option>
              ))}
          </Select>
        </FormControl>
      </HStack>
      
      {/* Conversion hint */}
      {showConversionHint && conversionHint && (
        <Text fontSize="xs" color="green.600" fontStyle="italic">
          {conversionHint}
        </Text>
      )}
    </VStack>
  )
}
