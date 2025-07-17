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
  VStack,
  Badge,
  Tooltip,
  Box,
  Flex
} from '@chakra-ui/react'
import { 
  convertUnit, 
  areUnitsCompatible, 
  formatQuantity, 
  ALL_UNITS, 
  getUnitCategory,
  getSuggestedUnits,
  getSmartUnitSuggestions,
  saveUnitPreference,
  getUnitDisplayName,
  getUnitConversionHelp
} from '../utils/unitConversion'

interface QuantityUnitInputProps {
  quantity: number
  unit: string
  onQuantityChange: (quantity: number) => void
  onUnitChange: (unit: string) => void
  onConvertedChange?: (quantity: number, unit: string) => void
  size?: 'sm' | 'md' | 'lg'
  isDisabled?: boolean
  showConversionHint?: boolean
  allowDecimals?: boolean
  min?: number
  label?: string
  foodName?: string
  servingUnit?: string
  showSmartSuggestions?: boolean
}

export default function QuantityUnitInput({
  quantity,
  unit,
  onQuantityChange,
  onUnitChange,
  onConvertedChange,
  size = 'md',
  isDisabled = false,
  showConversionHint = true,
  allowDecimals = true,
  min = 0.01,
  label,
  foodName,
  servingUnit,
  showSmartSuggestions = true
}: QuantityUnitInputProps) {
  const [internalQuantity, setInternalQuantity] = useState(quantity)
  const [conversionHint, setConversionHint] = useState<string>('')
  useEffect(() => {
    setInternalQuantity(quantity)
  }, [quantity])

  const smartSuggestions = foodName && showSmartSuggestions 
    ? getSmartUnitSuggestions(foodName, servingUnit)
    : []

  const currentCategory = getUnitCategory(unit)
  const suggestedUnits = currentCategory !== 'unknown' 
    ? getSuggestedUnits(currentCategory)
    : ALL_UNITS.slice(0, 20)

  const buildUnitOptions = () => {
    const allUnits = new Set<string>()
    
    smartSuggestions.forEach(s => allUnits.add(s.unit))
    suggestedUnits.forEach(u => allUnits.add(u))
    allUnits.add(unit)
    
    const commonUnits = ['g', 'oz', 'cup', 'tbsp', 'tsp', 'ml', 'piece', 'serving']
    commonUnits.forEach(u => allUnits.add(u))
    
    return Array.from(allUnits)
  }

  const unitOptions = buildUnitOptions()

  const handleUnitChange = (newUnit: string) => {
    if (!newUnit || newUnit === unit) return

    if (foodName) {
      saveUnitPreference(foodName, newUnit)
    }

    if (!areUnitsCompatible(unit, newUnit)) {
      onUnitChange(newUnit)
      if (onConvertedChange) {
        onConvertedChange(internalQuantity, newUnit)
      }
      if (showConversionHint) {
        setConversionHint(`Changed unit to ${getUnitDisplayName(newUnit)} (no conversion applied)`)
      }
      return
    }

    const conversion = convertUnit(internalQuantity, unit, newUnit)
    
    if (conversion.isValid) {
      const convertedQuantity = formatQuantity(conversion.value)
      setInternalQuantity(convertedQuantity)
      onQuantityChange(convertedQuantity)
      onUnitChange(newUnit)
      
      if (onConvertedChange) {
        onConvertedChange(convertedQuantity, newUnit)
      }
      
      if (showConversionHint) {
        setConversionHint(`Converted from ${formatQuantity(internalQuantity)} ${getUnitDisplayName(unit)} to ${convertedQuantity} ${getUnitDisplayName(newUnit)}`)
      }
    } else {
      onUnitChange(newUnit)
      if (onConvertedChange) {
        onConvertedChange(internalQuantity, newUnit)
      }
      
      if (showConversionHint) {
        setConversionHint(`Changed unit to ${getUnitDisplayName(newUnit)} (conversion not available)`)
      }
    }
  }

  const handleQuantityBlur = () => {
    if (internalQuantity > 0 && internalQuantity < min) {
      const correctedValue = min
      setInternalQuantity(correctedValue)
      onQuantityChange(correctedValue)
      
      if (onConvertedChange) {
        onConvertedChange(correctedValue, unit)
      }
    }
  }

  const renderUnitOption = (unitValue: string) => {
    const smartSuggestion = smartSuggestions.find(s => s.unit === unitValue)
    const displayName = getUnitDisplayName(unitValue)
    
    if (smartSuggestion) {
      return `${displayName} ${smartSuggestion.isRecommended ? '⭐' : '💡'}`
    }
    
    return displayName
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
              onFocus={(e) => e.target.select()}
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
          <Tooltip label={getUnitConversionHelp(unit)} hasArrow>
            <Select
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value)}
              size={size}
              isDisabled={isDisabled}
            >
              {unitOptions.map(unitOption => (
                <option key={unitOption} value={unitOption}>
                  {renderUnitOption(unitOption)}
                </option>
              ))}
            </Select>
          </Tooltip>
        </FormControl>
      </HStack>
      
      {showSmartSuggestions && smartSuggestions.length > 0 && (
        <Box>
          <Text fontSize="xs" color="gray.600" mb={1}>Suggested units:</Text>
          <Flex wrap="wrap" gap={1}>
            {smartSuggestions.slice(0, 4).map(suggestion => (
              <Badge 
                key={suggestion.unit}
                colorScheme={suggestion.isRecommended ? 'green' : 'blue'}
                cursor="pointer"
                onClick={() => handleUnitChange(suggestion.unit)}
                size="sm"
                variant={suggestion.unit === unit ? 'solid' : 'outline'}
              >
                {getUnitDisplayName(suggestion.unit)}
                {suggestion.isRecommended && ' ⭐'}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}
      
      {showConversionHint && conversionHint && (
        <Text fontSize="xs" color="green.600" fontStyle="italic">
          {conversionHint}
        </Text>
      )}
    </VStack>
  )
}
