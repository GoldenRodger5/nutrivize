import React, { useState, useEffect } from 'react'
import {
  Box,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormHelperText,
  Badge
} from '@chakra-ui/react'

interface MacroDistributionSliderProps {
  protein: number
  carbs: number
  fat: number
  onChange: (macros: { protein: number; carbs: number; fat: number }) => void
  isDisabled?: boolean
}

export const MacroDistributionSlider: React.FC<MacroDistributionSliderProps> = ({
  protein,
  carbs,
  fat,
  onChange,
  isDisabled = false
}) => {
  const [localMacros, setLocalMacros] = useState({ protein, carbs, fat })

  // Sync with props
  useEffect(() => {
    setLocalMacros({ protein, carbs, fat })
  }, [protein, carbs, fat])

  // Normalize macros to total 100%
  const normalizeMacros = (newProtein: number, newCarbs: number, newFat: number) => {
    const total = newProtein + newCarbs + newFat
    if (total === 0) return { protein: 30, carbs: 40, fat: 30 }
    
    return {
      protein: Math.round((newProtein / total) * 100),
      carbs: Math.round((newCarbs / total) * 100),
      fat: Math.round((newFat / total) * 100)
    }
  }

  const handleProteinChange = (value: number) => {
    // Distribute remaining percentage between carbs and fat proportionally
    const remaining = 100 - value
    const carbsFatTotal = localMacros.carbs + localMacros.fat
    
    let newCarbs, newFat
    if (carbsFatTotal === 0) {
      newCarbs = remaining / 2
      newFat = remaining / 2
    } else {
      const carbsRatio = localMacros.carbs / carbsFatTotal
      newCarbs = remaining * carbsRatio
      newFat = remaining * (1 - carbsRatio)
    }

    const normalized = normalizeMacros(value, newCarbs, newFat)
    setLocalMacros(normalized)
    onChange(normalized)
  }

  const handleCarbsChange = (value: number) => {
    // Distribute remaining percentage between protein and fat proportionally
    const remaining = 100 - value
    const proteinFatTotal = localMacros.protein + localMacros.fat
    
    let newProtein, newFat
    if (proteinFatTotal === 0) {
      newProtein = remaining / 2
      newFat = remaining / 2
    } else {
      const proteinRatio = localMacros.protein / proteinFatTotal
      newProtein = remaining * proteinRatio
      newFat = remaining * (1 - proteinRatio)
    }

    const normalized = normalizeMacros(newProtein, value, newFat)
    setLocalMacros(normalized)
    onChange(normalized)
  }

  const handleFatChange = (value: number) => {
    // Distribute remaining percentage between protein and carbs proportionally
    const remaining = 100 - value
    const proteinCarbsTotal = localMacros.protein + localMacros.carbs
    
    let newProtein, newCarbs
    if (proteinCarbsTotal === 0) {
      newProtein = remaining / 2
      newCarbs = remaining / 2
    } else {
      const proteinRatio = localMacros.protein / proteinCarbsTotal
      newProtein = remaining * proteinRatio
      newCarbs = remaining * (1 - proteinRatio)
    }

    const normalized = normalizeMacros(newProtein, newCarbs, value)
    setLocalMacros(normalized)
    onChange(normalized)
  }

  return (
    <FormControl>
      <FormLabel>Macro Distribution</FormLabel>
      
      <VStack spacing={4} align="stretch">
        {/* Protein Slider */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Protein</Text>
            <Badge colorScheme="blue" fontSize="sm">
              {localMacros.protein}%
            </Badge>
          </HStack>
          <Slider
            value={localMacros.protein}
            onChange={handleProteinChange}
            min={10}
            max={50}
            step={1}
            isDisabled={isDisabled}
            colorScheme="blue"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        {/* Carbs Slider */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Carbohydrates</Text>
            <Badge colorScheme="orange" fontSize="sm">
              {localMacros.carbs}%
            </Badge>
          </HStack>
          <Slider
            value={localMacros.carbs}
            onChange={handleCarbsChange}
            min={15}
            max={70}
            step={1}
            isDisabled={isDisabled}
            colorScheme="orange"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        {/* Fat Slider */}
        <Box>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="sm" fontWeight="medium">Fat</Text>
            <Badge colorScheme="purple" fontSize="sm">
              {localMacros.fat}%
            </Badge>
          </HStack>
          <Slider
            value={localMacros.fat}
            onChange={handleFatChange}
            min={15}
            max={45}
            step={1}
            isDisabled={isDisabled}
            colorScheme="purple"
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        {/* Total Display */}
        <Box>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">Total:</Text>
            <Badge 
              colorScheme={localMacros.protein + localMacros.carbs + localMacros.fat === 100 ? "green" : "red"}
              fontSize="sm"
            >
              {localMacros.protein + localMacros.carbs + localMacros.fat}%
            </Badge>
          </HStack>
        </Box>
      </VStack>

      <FormHelperText>
        Adjust sliders to set your macro distribution. The percentages will automatically balance to 100%.
      </FormHelperText>
    </FormControl>
  )
}

export default MacroDistributionSlider
