// Weight and height conversion utilities

// Weight conversions
export const kgToLbs = (kg: number): number => kg * 2.20462
export const lbsToKg = (lbs: number): number => lbs * 0.453592

// Height conversions
export const cmToFt = (cm: number): number => cm * 0.0328084
export const ftToCm = (ft: number): number => ft * 30.48
export const cmToInches = (cm: number): number => cm * 0.393701
export const inchesToCm = (inches: number): number => inches * 2.54

// Format height in feet and inches
export const formatHeightImperial = (cm: number): string => {
  const totalInches = cmToInches(cm)
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${inches}"`
}

// Convert feet and inches to cm
export const parseImperialHeight = (feet: number, inches: number = 0): number => {
  const totalInches = feet * 12 + inches
  return inchesToCm(totalInches)
}

// Unit display helpers
export const formatWeight = (weight: number, units: 'metric' | 'imperial'): string => {
  if (units === 'imperial') {
    return `${weight.toFixed(1)} lbs`
  }
  return `${weight.toFixed(1)} kg`
}

export const formatHeight = (height: number, units: 'metric' | 'imperial'): string => {
  if (units === 'imperial') {
    return formatHeightImperial(height)
  }
  return `${height.toFixed(0)} cm`
}

// Convert weights based on unit preference
export const convertWeight = (weight: number, fromUnits: 'metric' | 'imperial', toUnits: 'metric' | 'imperial'): number => {
  if (fromUnits === toUnits) return weight
  
  if (fromUnits === 'metric' && toUnits === 'imperial') {
    return kgToLbs(weight)
  }
  
  if (fromUnits === 'imperial' && toUnits === 'metric') {
    return lbsToKg(weight)
  }
  
  return weight
}

// Convert heights based on unit preference
export const convertHeight = (height: number, fromUnits: 'metric' | 'imperial', toUnits: 'metric' | 'imperial'): number => {
  if (fromUnits === toUnits) return height
  
  if (fromUnits === 'metric' && toUnits === 'imperial') {
    return cmToInches(height)
  }
  
  if (fromUnits === 'imperial' && toUnits === 'metric') {
    return inchesToCm(height)
  }
  
  return height
}
