import { useState } from 'react'
import { Select, NumberInput, NumberInputField, Box, Text } from '@chakra-ui/react'

export default function TestPage() {
  const [ingredient, setIngredient] = useState({
    name: 'Test Ingredient',
    amount: 100,
    unit: 'g',
    calories: 150
  })

  const updateIngredient = (field: string, value: any) => {
    console.log('updateIngredient called:', { field, value })
    setIngredient(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Box p={4}>
      <Text mb={4}>Test Ingredient Editing</Text>
      
      <Box mb={4}>
        <Text>Amount: {ingredient.amount}</Text>
        <NumberInput
          value={ingredient.amount}
          onChange={(_, value) => updateIngredient('amount', value || 0)}
          min={0}
          size="sm"
        >
          <NumberInputField />
        </NumberInput>
      </Box>

      <Box mb={4}>
        <Text>Unit: {ingredient.unit}</Text>
        <Select
          value={ingredient.unit}
          onChange={(e) => updateIngredient('unit', e.target.value)}
          size="sm"
        >
          <option value="serving">serving</option>
          <option value="cup">cup</option>
          <option value="g">g</option>
          <option value="oz">oz</option>
          <option value="piece">piece</option>
        </Select>
      </Box>

      <Box mb={4}>
        <Text>Calories: {ingredient.calories}</Text>
        <NumberInput
          value={ingredient.calories}
          onChange={(_, value) => updateIngredient('calories', value || 0)}
          min={0}
          size="sm"
        >
          <NumberInputField />
        </NumberInput>
      </Box>

      <Box>
        <Text>Current State:</Text>
        <pre>{JSON.stringify(ingredient, null, 2)}</pre>
      </Box>
    </Box>
  )
}
