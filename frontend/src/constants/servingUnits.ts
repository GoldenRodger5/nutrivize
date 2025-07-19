// Essential serving units (streamlined, no duplicates)
export const SERVING_UNITS = [
  // Weight Units
  'g',
  'kg', 
  'oz',
  'lb',
  'mg',
  
  // Volume Units
  'ml',
  'l',
  'fl oz',
  'cup',
  'tbsp',
  'tsp',
  'pt',
  'qt',
  'gal',
  
  // Piece-based Units
  'piece'
] as const

export type ServingUnit = typeof SERVING_UNITS[number]

// Helper function to normalize serving units
export const normalizeServingUnit = (unit: string): string => {
  const normalized = unit.toLowerCase().trim()
  
  // Common conversions to essential units
  const conversions: Record<string, string> = {
    'c': 'cup',
    'cups': 'cup',
    'tsp.': 'tsp',
    'teaspoon': 'tsp',
    'tbsp.': 'tbsp',
    'tablespoon': 'tbsp',
    'fl. oz': 'fl oz',
    'fluid ounce': 'fl oz',
    'fluid ounces': 'fl oz',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liter': 'l',
    'liters': 'l',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'gram': 'g',
    'grams': 'g',
    'ounce': 'oz',
    'ounces': 'oz',
    'pound': 'lb',
    'pounds': 'lb',
    'milligram': 'mg',
    'milligrams': 'mg',
    'pint': 'pt',
    'pints': 'pt',
    'quart': 'qt',
    'quarts': 'qt',
    'gallon': 'gal',
    'gallons': 'gal',
    'each': 'piece',
    'pieces': 'piece',
    'whole': 'piece',
    'item': 'piece',
    'items': 'piece'
  }
  
  return conversions[normalized] || normalized
}
