// Smart Unit Assignment Service
// Replaces ambiguous "serving" units with descriptive, convertible units

export interface FoodUnitSuggestion {
  unit: string
  reasoning: string
  category: 'weight' | 'volume' | 'piece'
  convertible: boolean
}

export interface FoodUnitAssignment {
  defaultUnit: string
  defaultSize: number
  reasoning: string
  alternatives: string[]
}

// Smart unit assignment based on food name analysis
export function getSmartUnitAssignment(foodName: string): FoodUnitAssignment {
  const name = foodName.toLowerCase()
  
  // Liquid foods - use volume units
  if (name.includes('milk') || name.includes('juice') || name.includes('water') || 
      name.includes('soda') || name.includes('coffee') || name.includes('tea') ||
      name.includes('smoothie') || name.includes('shake') || name.includes('drink')) {
    return {
      defaultUnit: 'cup',
      defaultSize: 1,
      reasoning: 'Liquid foods are best measured by volume',
      alternatives: ['ml', 'fl oz', 'l']
    }
  }
  
  // Soups and liquid-based foods
  if (name.includes('soup') || name.includes('broth') || name.includes('stew') ||
      name.includes('sauce') || name.includes('dressing') || name.includes('gravy')) {
    return {
      defaultUnit: 'cup',
      defaultSize: 1,
      reasoning: 'Liquid-based foods measured by volume',
      alternatives: ['ml', 'fl oz', 'tbsp']
    }
  }
  
  // Oils and fats - use tablespoons
  if (name.includes('oil') || name.includes('butter') || name.includes('margarine') ||
      name.includes('lard') || name.includes('shortening')) {
    return {
      defaultUnit: 'tbsp',
      defaultSize: 1,
      reasoning: 'Fats and oils typically measured in tablespoons',
      alternatives: ['tsp', 'ml', 'g']
    }
  }
  
  // Spices and seasonings - use teaspoons
  if (name.includes('salt') || name.includes('pepper') || name.includes('spice') ||
      name.includes('herb') || name.includes('seasoning') || name.includes('garlic powder') ||
      name.includes('onion powder') || name.includes('cumin') || name.includes('paprika')) {
    return {
      defaultUnit: 'tsp',
      defaultSize: 1,
      reasoning: 'Spices and seasonings typically measured in teaspoons',
      alternatives: ['tbsp', 'g']
    }
  }
  
  // Meat and poultry - use ounces
  if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
      name.includes('turkey') || name.includes('lamb') || name.includes('meat') ||
      name.includes('steak') || name.includes('ground') || name.includes('patty')) {
    return {
      defaultUnit: 'oz',
      defaultSize: 4,
      reasoning: 'Meat and poultry best measured by weight',
      alternatives: ['g', 'lb', 'piece']
    }
  }
  
  // Fish and seafood - use ounces
  if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') ||
      name.includes('shrimp') || name.includes('crab') || name.includes('lobster') ||
      name.includes('seafood') || name.includes('cod') || name.includes('halibut') || name.includes('trout')) {
    return {
      defaultUnit: 'oz',
      defaultSize: 4,
      reasoning: 'Fish and seafood best measured by weight',
      alternatives: ['g', 'piece']
    }
  }
  
  // Fruits and vegetables - use pieces
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') ||
      name.includes('pear') || name.includes('peach') || name.includes('plum') ||
      name.includes('carrot') || name.includes('pepper') || name.includes('onion')) {
    return {
      defaultUnit: 'piece',
      defaultSize: 1,
      reasoning: 'Whole fruits and vegetables typically counted by pieces',
      alternatives: ['cup', 'oz']
    }
  }
  
  // Berries and small fruits - use cups
  if (name.includes('berry') || name.includes('grape') || name.includes('cherry') ||
      name.includes('strawberry') || name.includes('blueberry') || name.includes('raspberry')) {
    return {
      defaultUnit: 'cup',
      defaultSize: 1,
      reasoning: 'Small fruits typically measured by volume',
      alternatives: ['g', 'oz']
    }
  }
  
  // Leafy greens - use cups
  if (name.includes('spinach') || name.includes('lettuce') || name.includes('kale') ||
      name.includes('arugula') || name.includes('salad') || name.includes('greens')) {
    return {
      defaultUnit: 'cup',
      defaultSize: 1,
      reasoning: 'Leafy greens typically measured by volume',
      alternatives: ['g', 'oz']
    }
  }
  
  // Grains and cereals - use cups
  if (name.includes('rice') || name.includes('quinoa') || name.includes('oats') ||
      name.includes('cereal') || name.includes('grain') || name.includes('barley') ||
      name.includes('bulgur') || name.includes('couscous')) {
    return {
      defaultUnit: 'cup',
      defaultSize: 1,
      reasoning: 'Grains typically measured by volume when cooked',
      alternatives: ['g', 'oz']
    }
  }
  
  // Pasta and noodles - use cups when cooked
  if (name.includes('pasta') || name.includes('noodles') || name.includes('spaghetti') ||
      name.includes('macaroni') || name.includes('penne') || name.includes('linguine')) {
    return {
      defaultUnit: 'cup',
      defaultSize: 1,
      reasoning: 'Cooked pasta typically measured by volume',
      alternatives: ['oz', 'g']
    }
  }
  
  // Nuts and seeds - use ounces
  if (name.includes('nuts') || name.includes('almonds') || name.includes('peanuts') ||
      name.includes('seeds') || name.includes('cashews') || name.includes('walnuts') ||
      name.includes('pecans') || name.includes('pistachios')) {
    return {
      defaultUnit: 'oz',
      defaultSize: 1,
      reasoning: 'Nuts and seeds best measured by weight',
      alternatives: ['g', 'cup']
    }
  }
  
  // Cheese - use ounces
  if (name.includes('cheese') || name.includes('cheddar') || name.includes('mozzarella') ||
      name.includes('swiss') || name.includes('parmesan') || name.includes('gouda')) {
    return {
      defaultUnit: 'oz',
      defaultSize: 1,
      reasoning: 'Cheese typically measured by weight',
      alternatives: ['g', 'cup']
    }
  }
  
  // Yogurt and similar - use cups
  if (name.includes('yogurt') || name.includes('cottage cheese') || name.includes('sour cream') ||
      name.includes('cream cheese') || name.includes('ricotta')) {
    return {
      defaultUnit: 'cup',
      defaultSize: 1,
      reasoning: 'Soft dairy products typically measured by volume',
      alternatives: ['oz', 'g', 'tbsp']
    }
  }
  
  // Eggs - use pieces
  if (name.includes('egg') && !name.includes('eggplant')) {
    return {
      defaultUnit: 'piece',
      defaultSize: 1,
      reasoning: 'Eggs typically counted by pieces',
      alternatives: ['oz', 'g']
    }
  }
  
  // Default fallback - use grams (most universal and convertible)
  return {
    defaultUnit: 'g',
    defaultSize: 100,
    reasoning: 'Default weight unit - universally convertible',
    alternatives: ['oz', 'cup', 'piece']
  }
}

// Convert existing "serving" entries to smart units
export function convertServingToSmartUnit(foodName: string, currentSize: number = 1): FoodUnitAssignment {
  const smartUnit = getSmartUnitAssignment(foodName)
  
  // If current size is not 1, try to maintain proportional sizing
  if (currentSize !== 1) {
    return {
      ...smartUnit,
      defaultSize: Math.round(smartUnit.defaultSize * currentSize * 10) / 10,
      reasoning: `${smartUnit.reasoning} (adjusted for existing portion size)`
    }
  }
  
  return smartUnit
}

// Get list of all convertible units (essential units only)
export function getConvertibleUnits(): string[] {
  return [
    // Weight units
    'g', 'kg', 'oz', 'lb', 'mg',
    
    // Volume units
    'ml', 'l', 'fl oz', 'cup', 'tbsp', 'tsp', 'pt', 'qt', 'gal',
    
    // Piece-based units
    'piece'
  ]
}

// Check if a unit is convertible/descriptive
export function isConvertibleUnit(unit: string): boolean {
  const convertibleUnits = getConvertibleUnits()
  return convertibleUnits.includes(unit.toLowerCase().trim())
}

// Get replacement suggestions for "serving"
export function getServingReplacements(foodName: string): string[] {
  const smartUnit = getSmartUnitAssignment(foodName)
  return [smartUnit.defaultUnit, ...smartUnit.alternatives]
}

export default {
  getSmartUnitAssignment,
  convertServingToSmartUnit,
  getConvertibleUnits,
  isConvertibleUnit,
  getServingReplacements
}
