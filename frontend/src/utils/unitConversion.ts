// Unit conversion utilities for food quantities
// Supports common food measurement units and conversions

export interface ConversionResult {
  value: number;
  unit: string;
  isValid: boolean;
  error?: string;
}

// Weight conversions (based on 1 gram)
const WEIGHT_CONVERSIONS: Record<string, number> = {
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000,
  'oz': 28.3495,
  'ounce': 28.3495,
  'ounces': 28.3495,
  'lb': 453.592,
  'pound': 453.592,
  'pounds': 453.592,
  'mg': 0.001,
  'milligram': 0.001,
  'milligrams': 0.001,
}

// Volume conversions (based on 1 ml)
const VOLUME_CONVERSIONS: Record<string, number> = {
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  'cup': 236.588,
  'cups': 236.588,
  'tbsp': 14.7868,
  'tablespoon': 14.7868,
  'tablespoons': 14.7868,
  'tsp': 4.92892,
  'teaspoon': 4.92892,
  'teaspoons': 4.92892,
  'fl oz': 29.5735,
  'fluid ounce': 29.5735,
  'fluid ounces': 29.5735,
  'pint': 473.176,
  'pints': 473.176,
  'quart': 946.353,
  'quarts': 946.353,
  'gallon': 3785.41,
  'gallons': 3785.41,
}

// Piece/count units (no conversion, but standardized)
const PIECE_UNITS = [
  'piece', 'pieces', 'item', 'items', 'serving', 'servings', 
  'slice', 'slices', 'unit', 'units', 'each', 'whole', 'can', 'cans',
  'bottle', 'bottles', 'package', 'packages', 'pack', 'packs'
]

// All available units organized by category
export const UNIT_CATEGORIES = {
  weight: Object.keys(WEIGHT_CONVERSIONS),
  volume: Object.keys(VOLUME_CONVERSIONS),
  pieces: PIECE_UNITS
}

// Get all available units in a flat array
export const ALL_UNITS = [
  ...UNIT_CATEGORIES.weight,
  ...UNIT_CATEGORIES.volume,
  ...UNIT_CATEGORIES.pieces
].sort()

// Determine unit category
export function getUnitCategory(unit: string): 'weight' | 'volume' | 'pieces' | 'unknown' {
  const normalizedUnit = unit.toLowerCase().trim()
  
  if (WEIGHT_CONVERSIONS[normalizedUnit]) return 'weight'
  if (VOLUME_CONVERSIONS[normalizedUnit]) return 'volume'
  if (PIECE_UNITS.includes(normalizedUnit)) return 'pieces'
  
  return 'unknown'
}

// Check if two units are compatible for conversion
export function areUnitsCompatible(fromUnit: string, toUnit: string): boolean {
  const fromCategory = getUnitCategory(fromUnit)
  const toCategory = getUnitCategory(toUnit)
  
  // Same category units are compatible
  if (fromCategory === toCategory && fromCategory !== 'unknown') {
    return true
  }
  
  // Pieces are only compatible with pieces
  if (fromCategory === 'pieces' || toCategory === 'pieces') {
    return fromCategory === toCategory
  }
  
  return false
}

// Convert quantity from one unit to another
export function convertUnit(
  quantity: number, 
  fromUnit: string, 
  toUnit: string
): ConversionResult {
  const normalizedFromUnit = fromUnit.toLowerCase().trim()
  const normalizedToUnit = toUnit.toLowerCase().trim()
  
  // Check if units are the same
  if (normalizedFromUnit === normalizedToUnit) {
    return {
      value: quantity,
      unit: toUnit,
      isValid: true
    }
  }
  
  // Check compatibility
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    return {
      value: quantity,
      unit: fromUnit,
      isValid: false,
      error: `Cannot convert ${fromUnit} to ${toUnit} - incompatible unit types`
    }
  }
  
  const fromCategory = getUnitCategory(fromUnit)
  
  // Handle piece units (no conversion)
  if (fromCategory === 'pieces') {
    return {
      value: quantity,
      unit: toUnit,
      isValid: true
    }
  }
  
  // Handle weight conversions
  if (fromCategory === 'weight') {
    const fromFactor = WEIGHT_CONVERSIONS[normalizedFromUnit]
    const toFactor = WEIGHT_CONVERSIONS[normalizedToUnit]
    
    if (!fromFactor || !toFactor) {
      return {
        value: quantity,
        unit: fromUnit,
        isValid: false,
        error: `Unknown weight unit: ${!fromFactor ? fromUnit : toUnit}`
      }
    }
    
    // Convert to base unit (grams) then to target unit
    const baseValue = quantity * fromFactor
    const convertedValue = baseValue / toFactor
    
    return {
      value: Math.round(convertedValue * 1000) / 1000, // Round to 3 decimal places
      unit: toUnit,
      isValid: true
    }
  }
  
  // Handle volume conversions
  if (fromCategory === 'volume') {
    const fromFactor = VOLUME_CONVERSIONS[normalizedFromUnit]
    const toFactor = VOLUME_CONVERSIONS[normalizedToUnit]
    
    if (!fromFactor || !toFactor) {
      return {
        value: quantity,
        unit: fromUnit,
        isValid: false,
        error: `Unknown volume unit: ${!fromFactor ? fromUnit : toUnit}`
      }
    }
    
    // Convert to base unit (ml) then to target unit
    const baseValue = quantity * fromFactor
    const convertedValue = baseValue / toFactor
    
    return {
      value: Math.round(convertedValue * 1000) / 1000, // Round to 3 decimal places
      unit: toUnit,
      isValid: true
    }
  }
  
  return {
    value: quantity,
    unit: fromUnit,
    isValid: false,
    error: 'Unknown conversion error'
  }
}

// Get suggested units for a given category
export function getSuggestedUnits(category: 'weight' | 'volume' | 'pieces'): string[] {
  switch (category) {
    case 'weight':
      return ['g', 'kg', 'oz', 'lb']
    case 'volume':
      return ['ml', 'l', 'cup', 'tbsp', 'tsp', 'fl oz']
    case 'pieces':
      return ['piece', 'serving', 'slice', 'can', 'package']
    default:
      return []
  }
}

// Calculate nutrition values when quantity/unit changes
export function calculateNutritionForQuantity(
  baseNutrition: Record<string, number>,
  baseQuantity: number,
  baseUnit: string,
  newQuantity: number,
  newUnit: string
): Record<string, number> | null {
  // Convert new quantity to base units for calculation
  const conversion = convertUnit(newQuantity, newUnit, baseUnit)
  
  if (!conversion.isValid) {
    return null // Cannot convert - return null to indicate error
  }
  
  // Calculate scaling factor
  const scaleFactor = conversion.value / baseQuantity
  
  // Scale all nutrition values
  const scaledNutrition: Record<string, number> = {}
  for (const [nutrient, value] of Object.entries(baseNutrition)) {
    scaledNutrition[nutrient] = Math.round((value * scaleFactor) * 100) / 100 // Round to 2 decimal places
  }
  
  return scaledNutrition
}

// Validate and format quantity input
export function formatQuantity(input: string | number): number {
  if (typeof input === 'number') {
    return Math.max(0, Math.round(input * 1000) / 1000) // Allow up to 3 decimal places, minimum 0
  }
  
  const parsed = parseFloat(input.toString())
  if (isNaN(parsed)) {
    return 0
  }
  
  return Math.max(0, Math.round(parsed * 1000) / 1000) // Allow up to 3 decimal places, minimum 0
}

// Get unit display name (for UI)
export function getUnitDisplayName(unit: string): string {
  const normalizedUnit = unit.toLowerCase().trim()
  
  // Return formatted version
  const displayMap: Record<string, string> = {
    'g': 'g',
    'kg': 'kg',
    'oz': 'oz',
    'lb': 'lb',
    'ml': 'ml',
    'l': 'L',
    'cup': 'cup',
    'tbsp': 'tbsp',
    'tsp': 'tsp',
    'fl oz': 'fl oz',
    'piece': 'piece',
    'serving': 'serving',
    'slice': 'slice'
  }
  
  return displayMap[normalizedUnit] || unit
}
