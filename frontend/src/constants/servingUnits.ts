// Common serving units for food items
export const SERVING_UNITS = [
  // Volume measurements
  'cup',
  'cups',
  'fl oz',
  'ml',
  'l',
  'liter',
  'tsp',
  'teaspoon',
  'tbsp',
  'tablespoon',
  'pint',
  'quart',
  'gallon',
  
  // Weight measurements
  'g',
  'gram',
  'grams',
  'kg',
  'kilogram',
  'oz',
  'ounce',
  'ounces',
  'lb',
  'pound',
  'pounds',
  
  // Count/piece measurements
  'piece',
  'pieces',
  'item',
  'items',
  'serving',
  'servings',
  'portion',
  'portions',
  'slice',
  'slices',
  'can',
  'cans',
  'bottle',
  'bottles',
  'package',
  'packages',
  'container',
  'containers',
  
  // Specific food measurements
  'scoop',
  'scoops',
  'handful',
  'handfuls',
  'stick',
  'sticks',
  'pat',
  'pats',
  'clove',
  'cloves',
  'bulb',
  'bulbs',
  'head',
  'heads',
  'bunch',
  'bunches',
  'stalk',
  'stalks',
  
  // Common food-specific units
  'small',
  'medium',
  'large',
  'extra large',
  'thin slice',
  'thick slice',
  'wedge',
  'wedges',
  'fillet',
  'fillets',
  'breast',
  'breasts',
  'thigh',
  'thighs',
  'wing',
  'wings',
  'leg',
  'legs',
  
  // Generic
  'unit',
  'units'
] as const

export type ServingUnit = typeof SERVING_UNITS[number]

// Helper function to normalize serving units
export const normalizeServingUnit = (unit: string): string => {
  const normalized = unit.toLowerCase().trim()
  
  // Common conversions
  const conversions: Record<string, string> = {
    'c': 'cup',
    'tsp.': 'tsp',
    'tbsp.': 'tbsp',
    'fl. oz': 'fl oz',
    'fluid ounce': 'fl oz',
    'fluid ounces': 'fl oz',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liters': 'l',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'ounce': 'oz',
    'pound': 'lb',
    'each': 'piece',
    'whole': 'piece',
    'container': 'container',
    'pkg': 'package',
    'pcs': 'pieces',
    'pcs.': 'pieces',
    'pc': 'piece',
    'pc.': 'piece'
  }
  
  return conversions[normalized] || normalized
}
