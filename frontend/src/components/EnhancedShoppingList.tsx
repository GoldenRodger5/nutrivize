import { useState, useEffect } from 'react'
import {
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Checkbox,
  IconButton,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Tooltip,
  Progress,
  Divider,
  Textarea,
  Spinner,
  Center,
  useColorModeValue,
  Select,
  Container,
  Box,
  Flex,
  useBreakpointValue
} from '@chakra-ui/react'
import { 
  MdEdit, 
  MdSave, 
  MdCancel, 
  MdInfo, 
  MdRestaurant, 
  MdRefresh,
  MdCheckCircle,
  MdDownload,
  MdFileDownload
} from 'react-icons/md'
import { ShoppingList } from '../types'
import api from '../utils/api'

interface EnhancedShoppingListProps {
  shoppingList: ShoppingList
  onUpdate: (updatedList: ShoppingList) => void
  onRefresh: () => void
  isLoading: boolean
}

// Use the ShoppingItem type from the ShoppingList interface and extend it with nutrition
type ShoppingItem = ShoppingList['items'][0] & {
  nutrition?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
}

interface NutritionData {
  item_name: string
  amount: number
  unit: string
  nutrition?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  food_id?: string
  food_name?: string
  used_in_meals?: string[]
}

export default function EnhancedShoppingList({ 
  shoppingList, 
  onUpdate, 
  onRefresh, 
  isLoading 
}: EnhancedShoppingListProps) {
  const [editingItems, setEditingItems] = useState<{ [key: string]: ShoppingItem }>({})
  const [selectedNutrition, setSelectedNutrition] = useState<NutritionData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [listNotes, setListNotes] = useState(shoppingList.notes || '')
  const [isSaving, setIsSaving] = useState(false)
  
  const { isOpen: isNutritionOpen, onOpen: onNutritionOpen, onClose: onNutritionClose } = useDisclosure()
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  // Load nutrition data for food index items on component mount
  useEffect(() => {
    const loadNutritionData = async () => {
      const updatedItems = [...shoppingList.items]
      let hasUpdates = false
      
      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i]
        if (item.food_id && !item.nutrition) {
          try {
            const nutritionResponse = await api.get(`/foods/${item.food_id}/nutrition`, {
              params: {
                amount: item.amount,
                unit: item.unit
              }
            })
            
            updatedItems[i] = {
              ...item,
              nutrition: nutritionResponse.data.nutrition,
              in_food_index: true
            }
            hasUpdates = true
          } catch (error) {
            console.warn(`Could not load nutrition for ${item.name}:`, error)
          }
        }
      }
      
      if (hasUpdates) {
        onUpdate({
          ...shoppingList,
          items: updatedItems
        })
      }
    }
    
    if (shoppingList.items?.length > 0) {
      loadNutritionData()
    }
  }, [shoppingList.shopping_list_id])
  
  // Calculate completion percentage
  const completedItems = shoppingList.items?.filter(item => item.is_checked).length || 0
  const totalItems = shoppingList.items?.length || 0
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  // Unit conversion helper
  const convertAmount = (amount: number, fromUnit: string, toUnit: string): number => {
    // Weight conversions
    const weightConversions: { [key: string]: number } = {
      'g': 1,
      'kg': 1000,
      'oz': 28.3495,
      'lb': 453.592
    }
    
    // Volume conversions (to ml)
    const volumeConversions: { [key: string]: number } = {
      'ml': 1,
      'l': 1000,
      'cup': 236.588,
      'tbsp': 14.7868,
      'tsp': 4.92892
    }
    
    // If same unit, no conversion needed
    if (fromUnit === toUnit) return amount
    
    // Convert within weight units
    if (weightConversions[fromUnit] && weightConversions[toUnit]) {
      const grams = amount * weightConversions[fromUnit]
      return grams / weightConversions[toUnit]
    }
    
    // Convert within volume units
    if (volumeConversions[fromUnit] && volumeConversions[toUnit]) {
      const ml = amount * volumeConversions[fromUnit]
      return ml / volumeConversions[toUnit]
    }
    
    // If no conversion possible, return original amount
    return amount
  }

  // Handle item check/uncheck
  const handleItemCheck = async (itemId: string, checked: boolean) => {
    try {
      await api.patch(`/meal-planning/shopping-lists/${shoppingList.shopping_list_id}/items/${itemId}`, {
        is_checked: checked
      })
      
      // Update local state
      const updatedItems = shoppingList.items.map(item => 
        item.item_id === itemId ? { ...item, is_checked: checked } : item
      )
      
      onUpdate({
        ...shoppingList,
        items: updatedItems,
        updated_at: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Error updating item:', error)
      toast({
        title: 'Error',
        description: 'Failed to update item status',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Handle edit item
  const startEditing = (item: ShoppingItem) => {
    if (!item.item_id) return
    setEditingItems(prev => ({
      ...prev,
      [item.item_id!]: { ...item }
    }))
  }

  const cancelEditing = (itemId: string) => {
    setEditingItems(prev => {
      const updated = { ...prev }
      delete updated[itemId]
      return updated
    })
  }

  // Update nutrition in real-time when editing amount/unit
  const updateNutritionForEdit = async (itemId: string, newAmount: number, newUnit: string) => {
    const item = shoppingList.items.find(i => i.item_id === itemId)
    if (!item || !item.food_id) return

    try {
      const nutritionResponse = await api.get(`/foods/${item.food_id}/nutrition`, {
        params: {
          amount: newAmount,
          unit: newUnit
        }
      })
      
      setEditingItems(prev => ({
        ...prev,
        [itemId]: { 
          ...prev[itemId], 
          nutrition: nutritionResponse.data.nutrition 
        }
      }))
    } catch (error) {
      console.warn('Could not fetch real-time nutrition:', error)
    }
  }

  const handleAmountChange = (itemId: string, newAmount: number) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], amount: newAmount }
    }))
    
    const editedItem = editingItems[itemId]
    if (editedItem) {
      updateNutritionForEdit(itemId, newAmount, editedItem.unit)
    }
  }

  const handleUnitChange = (itemId: string, newUnit: string) => {
    const editedItem = editingItems[itemId]
    if (!editedItem) return
    
    const convertedAmount = convertAmount(editedItem.amount, editedItem.unit, newUnit)
    
    setEditingItems(prev => ({
      ...prev,
      [itemId]: { 
        ...prev[itemId], 
        unit: newUnit,
        amount: Math.round(convertedAmount * 10) / 10 // Round to 1 decimal place
      }
    }))
    
    updateNutritionForEdit(itemId, convertedAmount, newUnit)
  }

  const saveItemEdit = async (itemId: string) => {
    const editedItem = editingItems[itemId]
    if (!editedItem) return

    try {
      setIsSaving(true)
      
      // Update the backend with the new amount/unit/notes
      await api.patch(`/meal-planning/shopping-lists/${shoppingList.shopping_list_id}/items/${itemId}`, {
        amount: editedItem.amount,
        unit: editedItem.unit,
        notes: editedItem.notes
      })
      
      // Update local state with the edited item
      const updatedItems = shoppingList.items.map(item => 
        item.item_id === itemId ? { 
          ...item, 
          amount: editedItem.amount,
          unit: editedItem.unit,
          notes: editedItem.notes,
          nutrition: editedItem.nutrition
        } : item
      )
      
      onUpdate({
        ...shoppingList,
        items: updatedItems,
        updated_at: new Date().toISOString()
      })
      
      cancelEditing(itemId)
      
      toast({
        title: 'Success',
        description: 'Item updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
    } catch (error) {
      console.error('Error saving item edit:', error)
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Save entire list
  const saveList = async () => {
    try {
      setIsSaving(true)
      
      await api.put(`/meal-planning/shopping-lists/${shoppingList.shopping_list_id}`, {
        items: shoppingList.items,
        notes: listNotes
      })
      
      onUpdate({
        ...shoppingList,
        notes: listNotes,
        updated_at: new Date().toISOString()
      })
      
      setIsEditing(false)
      
      toast({
        title: 'Success',
        description: 'Shopping list saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
    } catch (error) {
      console.error('Error saving list:', error)
      toast({
        title: 'Error',
        description: 'Failed to save shopping list',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsSaving(false)
    }
  }

  const viewNutrition = async (item: ShoppingItem) => {
    if (!item.item_id) return
    
    try {
      let nutritionData: NutritionData | null = null
      
      // If item has food_id, get nutrition from food database
      if (item.food_id) {
        try {
          const nutritionResponse = await api.get(`/foods/${item.food_id}/nutrition`, {
            params: {
              amount: item.amount,
              unit: item.unit
            }
          })
          
          nutritionData = {
            item_name: item.name,
            amount: item.amount,
            unit: item.unit,
            nutrition: nutritionResponse.data.nutrition,
            food_id: item.food_id,
            used_in_meals: item.used_in_meals
          }
        } catch (foodError) {
          console.warn('Could not fetch food nutrition:', foodError)
        }
      }
      
      // Fall back to shopping list nutrition endpoint if food lookup failed
      if (!nutritionData) {
        try {
          const response = await api.get(
            `/meal-planning/shopping-lists/${shoppingList.shopping_list_id}/items/${item.item_id}/nutrition`
          )
          nutritionData = response.data
        } catch (error) {
          console.error('Error fetching nutrition:', error)
        }
      }
      
      if (nutritionData) {
        setSelectedNutrition(nutritionData)
        onNutritionOpen()
      } else {
        toast({
          title: 'No Nutrition Data',
          description: 'Nutrition information is not available for this item',
          status: 'warning',
          duration: 3000,
          isClosable: true
        })
      }
    } catch (error) {
      console.error('Error fetching nutrition:', error)
      toast({
        title: 'Error',
        description: 'Could not load nutrition information',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  // Export Functions
  const exportAsText = () => {
    const date = new Date().toLocaleDateString()
    const header = `Shopping List - ${date}\n${'='.repeat(30)}\n`
    const items = shoppingList.items?.map(item => 
      `${item.is_checked ? '✓' : '○'} ${item.name} - ${item.amount} ${item.unit}`
    ).join('\n') || ''
    const footer = `\nTotal Estimated Cost: $${shoppingList.total_estimated_cost?.toFixed(2) || '0.00'}`
    
    const content = header + items + footer
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopping-list-${date}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAsCSV = () => {
    const date = new Date().toLocaleDateString()
    const header = 'Item,Amount,Unit,Category,Checked,Price\n'
    const rows = shoppingList.items?.map(item => 
      `"${item.name}","${item.amount}","${item.unit}","${item.category || 'Other'}","${item.is_checked ? 'Yes' : 'No'}","${item.estimated_price || 0}"`
    ).join('\n') || ''
    
    const content = header + rows
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shopping-list-${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const printList = () => {
    const date = new Date().toLocaleDateString()
    const printContent = `
      <html>
        <head>
          <title>Shopping List - ${date}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .item { display: flex; align-items: center; margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee; }
            .checkbox { margin-right: 10px; }
            .name { flex: 1; font-weight: bold; }
            .amount { margin-left: 10px; color: #666; }
            .total { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
            .category { font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #333; border-bottom: 2px solid #333; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Shopping List</h1>
            <p>${date}</p>
          </div>
          ${Object.entries(groupedItems).map(([category, items]) => `
            <div class="category">${category}</div>
            ${items.map(item => `
              <div class="item">
                <input type="checkbox" class="checkbox" ${item.is_checked ? 'checked' : ''} />
                <span class="name">${item.name}</span>
                <span class="amount">${item.amount} ${item.unit}</span>
              </div>
            `).join('')}
          `).join('')}
          <div class="total">
            Total Estimated Cost: $${shoppingList.total_estimated_cost?.toFixed(2) || '0.00'}
          </div>
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Group items by category
  const groupedItems = shoppingList.items?.reduce((groups, item) => {
    const category = item.category || 'Other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as { [key: string]: ShoppingItem[] }) || {}

  return (
    <Container maxW="8xl" p={0}>
      <VStack spacing={6} align="stretch">
        {/* Header with Progress */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <VStack align="start" spacing={0}>
                  <Text fontSize="xl" fontWeight="bold">Shopping List</Text>
                  <Text fontSize="sm" color="gray.600">
                    {completedItems} of {totalItems} items completed
                  </Text>
                </VStack>
                <VStack align="end" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    ${shoppingList.total_estimated_cost?.toFixed(2) || '0.00'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {shoppingList.store_location}
                  </Text>
                </VStack>
              </HStack>
              
              <Progress 
                value={completionPercentage} 
                colorScheme={completionPercentage === 100 ? 'green' : 'blue'} 
                size="sm"
                borderRadius="md"
              />
              
              <HStack spacing={2} wrap="wrap">
                <Button
                  leftIcon={<MdRefresh />}
                  size="sm"
                  variant="outline"
                  onClick={onRefresh}
                  isLoading={isLoading}
                >
                  Refresh Prices
                </Button>
                <Button
                  leftIcon={isEditing ? <MdSave /> : <MdEdit />}
                  size="sm"
                  colorScheme={isEditing ? 'green' : 'blue'}
                  onClick={isEditing ? saveList : () => setIsEditing(true)}
                  isLoading={isSaving}
                >
                  {isEditing ? 'Save List' : 'Edit List'}
                </Button>
                {isEditing && (
                  <Button
                    leftIcon={<MdCancel />}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false)
                      setListNotes(shoppingList.notes || '')
                    }}
                  >
                    Cancel
                  </Button>
                )}
                
                {/* Export buttons */}
                <Button
                  leftIcon={<MdFileDownload />}
                  size="sm"
                  variant="outline"
                  onClick={exportAsText}
                >
                  Export Text
                </Button>
                <Button
                  leftIcon={<MdDownload />}
                  size="sm"
                  variant="outline"
                  onClick={exportAsCSV}
                >
                  Export CSV
                </Button>
                <Button
                  leftIcon={<MdFileDownload />}
                  size="sm"
                  variant="outline"
                  onClick={printList}
                >
                  Print
                </Button>
              </HStack>
            </VStack>
          </CardHeader>
        </Card>

        {/* List Notes */}
        {isEditing && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Text fontWeight="bold">List Notes</Text>
                <Textarea
                  value={listNotes}
                  onChange={(e) => setListNotes(e.target.value)}
                  placeholder="Add notes about this shopping list..."
                  size="sm"
                />
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Shopping Items by Category */}
        <VStack spacing={1} align="stretch">
          {Object.entries(groupedItems).map(([category, items]) => (
            <Box key={category} borderWidth={1} borderColor="blue.200" borderRadius="md" overflow="hidden">
              {/* Category Header */}
              <Box
                bg="blue.100"
                px={4}
                py={3}
                borderBottom="1px"
                borderBottomColor="blue.200"
              >
                <Flex align="center" justify="space-between">
                  <Text fontSize="lg" fontWeight="bold" color="blue.700">
                    {category}
                  </Text>
                  <Badge variant="solid" colorScheme="blue">
                    {items.length} items
                  </Badge>
                </Flex>
              </Box>
              
              {/* Category Items */}
              <Box bg={cardBg} p={4}>
                <VStack spacing={3} align="stretch">
                  {items.map((item, index) => {
                    const isItemEditing = editingItems[item.item_id || '']
                    
                    return (
                      <Card key={item.item_id || index} variant="outline" size={isMobile ? "xs" : "sm"}>
                          <CardBody p={isMobile ? 2 : 4}>
                            {isMobile ? (
                              /* Mobile Layout - Compact */
                              <VStack spacing={2} align="stretch">
                                <HStack spacing={3} align="start">
                                  <Checkbox
                                    isChecked={item.is_checked || false}
                                    onChange={(e) => handleItemCheck(item.item_id!, e.target.checked)}
                                    colorScheme="green"
                                    size="md"
                                  />
                                  <VStack align="start" spacing={1} flex={1} minW={0}>
                                    <HStack spacing={2} wrap="wrap" align="center" w="full">
                                      <Text 
                                        fontSize="md"
                                        fontWeight="bold" 
                                        textDecoration={item.is_checked ? 'line-through' : 'none'}
                                        color={item.is_checked ? 'gray.500' : 'inherit'}
                                        noOfLines={1}
                                        flex={1}
                                      >
                                        {item.name}
                                      </Text>
                                      {item.estimated_price && (
                                        <Badge colorScheme="green" variant="solid" fontSize="xs">
                                          ${item.estimated_price.toFixed(2)}
                                        </Badge>
                                      )}
                                    </HStack>
                                    
                                    {isItemEditing ? (
                                      <HStack spacing={2} w="full">
                                        <Input
                                          value={isItemEditing.amount.toString()}
                                          onChange={(e) => {
                                            const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                            handleAmountChange(item.item_id!, value)
                                          }}
                                          size="sm"
                                          width="80px"
                                          type="number"
                                          step="0.1"
                                          min="0"
                                        />
                                        <Select
                                          value={isItemEditing.unit}
                                          onChange={(e) => 
                                            handleUnitChange(item.item_id!, e.target.value)
                                          }
                                          size="sm"
                                          width="100px"
                                        >
                                          <option value="g">g</option>
                                          <option value="kg">kg</option>
                                          <option value="oz">oz</option>
                                          <option value="lb">lb</option>
                                          <option value="ml">ml</option>
                                          <option value="l">l</option>
                                          <option value="cup">cups</option>
                                          <option value="tbsp">tbsp</option>
                                          <option value="tsp">tsp</option>
                                          <option value="piece">pcs</option>
                                        </Select>
                                      </HStack>
                                    ) : (
                                      <Text fontSize="sm" color="gray.600" fontWeight="medium">
                                        {item.amount} {item.unit}
                                      </Text>
                                    )}
                                    
                                    {/* Compact nutrition info for mobile */}
                                    {(isItemEditing ? isItemEditing.nutrition : item.nutrition) && (
                                      <HStack spacing={2} fontSize="xs" color="gray.600" w="full" bg="gray.50" p={1} borderRadius="md">
                                        <Text><Text as="span" fontWeight="bold">{Math.round((isItemEditing ? isItemEditing.nutrition?.calories : item.nutrition?.calories) || 0)}</Text>cal</Text>
                                        <Text><Text as="span" fontWeight="bold">{Math.round((isItemEditing ? isItemEditing.nutrition?.protein : item.nutrition?.protein) || 0)}g</Text>P</Text>
                                        <Text><Text as="span" fontWeight="bold">{Math.round((isItemEditing ? isItemEditing.nutrition?.carbs : item.nutrition?.carbs) || 0)}g</Text>C</Text>
                                        <Text><Text as="span" fontWeight="bold">{Math.round((isItemEditing ? isItemEditing.nutrition?.fat : item.nutrition?.fat) || 0)}g</Text>F</Text>
                                      </HStack>
                                    )}
                                    
                                    {/* Compact badges */}
                                    <HStack spacing={1} wrap="wrap">
                                      {item.is_checked && (
                                        <Badge colorScheme="green" size="sm">
                                          <MdCheckCircle />
                                        </Badge>
                                      )}
                                      {item.food_id && (
                                        <Badge colorScheme="purple" size="sm">
                                          Food Index
                                        </Badge>
                                      )}
                                      {item.used_in_meals && item.used_in_meals.length > 0 && (
                                        <Badge size="sm" colorScheme="blue" variant="subtle">
                                          {item.used_in_meals.length} meals
                                        </Badge>
                                      )}
                                    </HStack>
                                  </VStack>
                                  
                                  {/* Compact action buttons */}
                                  <VStack spacing={1}>
                                    {isItemEditing ? (
                                      <>
                                        <IconButton
                                          icon={<MdSave />}
                                          size="xs"
                                          colorScheme="green"
                                          variant="ghost"
                                          onClick={() => saveItemEdit(item.item_id!)}
                                          isLoading={isSaving}
                                          aria-label="Save"
                                        />
                                        <IconButton
                                          icon={<MdCancel />}
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => cancelEditing(item.item_id!)}
                                          aria-label="Cancel"
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <IconButton
                                          icon={<MdInfo />}
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => viewNutrition(item)}
                                          aria-label="Info"
                                        />
                                        <IconButton
                                          icon={<MdEdit />}
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => startEditing(item)}
                                          aria-label="Edit"
                                        />
                                      </>
                                    )}
                                  </VStack>
                                </HStack>
                                
                                {isItemEditing && (
                                  <Input
                                    value={isItemEditing.notes || ''}
                                    onChange={(e) => 
                                      setEditingItems(prev => ({
                                        ...prev,
                                        [item.item_id!]: { ...prev[item.item_id!], notes: e.target.value }
                                      }))
                                    }
                                    placeholder="Add notes..."
                                    size="sm"
                                  />
                                )}
                                
                                {!isItemEditing && item.notes && (
                                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                    {item.notes}
                                  </Text>
                                )}
                              </VStack>
                            ) : (
                              /* Desktop Layout - Original */
                            <HStack spacing={4} align="start">
                              {/* Checkbox */}
                              <Checkbox
                                isChecked={item.is_checked || false}
                                onChange={(e) => handleItemCheck(item.item_id!, e.target.checked)}
                                colorScheme="green"
                                size="lg"
                                mt={1}
                              />
                              
                              {/* Item Details */}
                              <VStack align="start" spacing={2} flex={1}>
                                <HStack spacing={2} wrap="wrap" align="center">
                                  <Text 
                                    fontSize="lg"
                                    fontWeight="bold" 
                                    textDecoration={item.is_checked ? 'line-through' : 'none'}
                                    color={item.is_checked ? 'gray.500' : 'inherit'}
                                  >
                                    {item.name}
                                  </Text>
                                  {item.is_checked && (
                                    <Badge colorScheme="green" size="sm">
                                      <MdCheckCircle />
                                    </Badge>
                                  )}
                                  {item.food_id && (
                                    <Badge colorScheme="purple" size="sm">
                                      Food Index
                                    </Badge>
                                  )}
                                  {/* Price moved here for better visibility */}
                                  {item.estimated_price && (
                                    <Badge colorScheme="green" variant="solid" fontSize="sm">
                                      ${item.estimated_price.toFixed(2)}
                                    </Badge>
                                  )}
                                </HStack>
                              
                              {/* Amount and Unit Editing */}
                              {isItemEditing ? (
                                <HStack spacing={2}>
                                  <Input
                                    value={isItemEditing.amount.toString()}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                      handleAmountChange(item.item_id!, value)
                                    }}
                                    size="sm"
                                    width="100px"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                  />
                                  <Select
                                    value={isItemEditing.unit}
                                    onChange={(e) => 
                                      handleUnitChange(item.item_id!, e.target.value)
                                    }
                                    size="sm"
                                    width="120px"
                                  >
                                    <option value="g">grams (g)</option>
                                    <option value="kg">kilograms (kg)</option>
                                    <option value="oz">ounces (oz)</option>
                                    <option value="lb">pounds (lb)</option>
                                    <option value="ml">milliliters (ml)</option>
                                    <option value="l">liters (l)</option>
                                    <option value="cup">cups</option>
                                    <option value="tbsp">tablespoons</option>
                                    <option value="tsp">teaspoons</option>
                                    <option value="piece">pieces</option>
                                  </Select>
                                </HStack>
                              ) : (
                                <Text fontSize="md" color="gray.600" fontWeight="medium">
                                  {item.amount} {item.unit}
                                </Text>
                              )}
                              
                              {/* Nutrition Info Display */}
                              {(isItemEditing ? isItemEditing.nutrition : item.nutrition) && (
                                <HStack spacing={4} fontSize="sm" color="gray.600">
                                  <Text><strong>{Math.round((isItemEditing ? isItemEditing.nutrition?.calories : item.nutrition?.calories) || 0)}</strong> cal</Text>
                                  <Text><strong>{Math.round((isItemEditing ? isItemEditing.nutrition?.protein : item.nutrition?.protein) || 0)}g</strong> protein</Text>
                                  <Text><strong>{Math.round((isItemEditing ? isItemEditing.nutrition?.carbs : item.nutrition?.carbs) || 0)}g</strong> carbs</Text>
                                  <Text><strong>{Math.round((isItemEditing ? isItemEditing.nutrition?.fat : item.nutrition?.fat) || 0)}g</strong> fat</Text>
                                </HStack>
                              )}
                              
                              {item.used_in_meals && item.used_in_meals.length > 0 && (
                                <HStack spacing={1} wrap="wrap">
                                  <Text fontSize="sm" color="blue.600" fontWeight="medium">Used in:</Text>
                                  {item.used_in_meals.map((meal, idx) => (
                                    <Badge key={idx} size="sm" colorScheme="blue" variant="subtle">
                                      {meal}
                                    </Badge>
                                  ))}
                                </HStack>
                              )}
                              
                              {isItemEditing && (
                                <Input
                                  value={isItemEditing.notes || ''}
                                  onChange={(e) => 
                                    setEditingItems(prev => ({
                                      ...prev,
                                      [item.item_id!]: { ...prev[item.item_id!], notes: e.target.value }
                                    }))
                                  }
                                  placeholder="Add notes..."
                                  size="sm"
                                />
                              )}
                              
                              {!isItemEditing && item.notes && (
                                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                  {item.notes}
                                </Text>
                              )}                              </VStack>
                              
                              {/* Actions Only */}
                              <VStack align="end" spacing={1} minW="80px">
                                {item.store_package_size && (
                                  <Text fontSize="xs" color="gray.500" textAlign="right">
                                    {item.store_package_size}: ${item.store_package_price?.toFixed(2)}
                                  </Text>
                                )}
                                
                                <HStack spacing={1}>
                                  {isItemEditing ? (
                                    <>
                                      <IconButton
                                        icon={<MdSave />}
                                        size="sm"
                                        colorScheme="green"
                                        variant="ghost"
                                        onClick={() => saveItemEdit(item.item_id!)}
                                        isLoading={isSaving}
                                        aria-label="Save changes"
                                      />
                                      <IconButton
                                        icon={<MdCancel />}
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => cancelEditing(item.item_id!)}
                                        aria-label="Cancel editing"
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <Tooltip label="View nutrition info">
                                        <IconButton
                                          icon={<MdInfo />}
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => viewNutrition(item)}
                                          aria-label="View nutrition"
                                        />
                                      </Tooltip>
                                      <Tooltip label="Edit item">
                                        <IconButton
                                          icon={<MdEdit />}
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => startEditing(item)}
                                          aria-label="Edit item"
                                        />
                                      </Tooltip>
                                    </>
                                  )}
                                </HStack>
                              </VStack>
                          </HStack>
                            )}
                        </CardBody>
                      </Card>
                    )
                  })}
                </VStack>
              </Box>
            </Box>
          ))}
        </VStack>

        {/* Nutrition Modal */}
        <Modal isOpen={isNutritionOpen} onClose={onNutritionClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <VStack align="start" spacing={1}>
                <Text>Nutrition Information</Text>
                <Text fontSize="sm" color="gray.600">
                  {selectedNutrition?.item_name}
                </Text>
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedNutrition ? (
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Amount:</Text>
                    <Text>{selectedNutrition.amount} {selectedNutrition.unit}</Text>
                  </HStack>
                  
                  {selectedNutrition.nutrition ? (
                    <VStack spacing={2} align="stretch">
                      <Text fontWeight="bold">Nutrition Facts (per amount):</Text>
                      <Divider />
                      {Object.entries(selectedNutrition.nutrition || {}).map(([key, value]) => (
                        <HStack key={key} justify="space-between">
                          <Text textTransform="capitalize">{key}:</Text>
                          <Text fontWeight="bold">
                            {value}{key === 'calories' ? '' : key === 'sodium' ? 'mg' : 'g'}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="gray.500" textAlign="center">
                      Nutrition data not available for this item
                    </Text>
                  )}
                  
                  {selectedNutrition.used_in_meals && selectedNutrition.used_in_meals.length > 0 && (
                    <VStack spacing={2} align="stretch">
                      <Text fontWeight="bold">Used in meals:</Text>
                      <VStack spacing={1} align="start">
                        {selectedNutrition.used_in_meals.map((meal, idx) => (
                          <HStack key={idx} spacing={2}>
                            <MdRestaurant />
                            <Text>{meal}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </VStack>
                  )}
                </VStack>
              ) : (
                <Center py={8}>
                  <Spinner />
                </Center>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onNutritionClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  )
}
