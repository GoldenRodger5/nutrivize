import React, { useState, useRef, useEffect } from 'react'
import {
  Box,
  Input,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  IconButton,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  Divider,
} from '@chakra-ui/react'
import { FiSearch, FiX, FiPlus } from 'react-icons/fi'
import { FaBarcode } from 'react-icons/fa'
import api from '../../utils/api'
import { FoodItem } from '../../types'

// Inline useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface MobileFoodSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelectFood: (food: FoodItem) => void
}

const MobileFoodSearch: React.FC<MobileFoodSearchProps> = ({
  isOpen,
  onClose,
  onSelectFood,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentFoodSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])
  
  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      searchFoods(debouncedSearchTerm)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchTerm])
  
  const searchFoods = async (term: string) => {
    setLoading(true)
    try {
      const response = await api.get(`/foods/search?q=${encodeURIComponent(term)}&limit=20`)
      setSearchResults(response.data || [])
    } catch (error) {
      console.error('Error searching foods:', error)
      toast({
        title: 'Search Error',
        description: 'Could not search foods. Please try again.',
        status: 'error',
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleSelectFood = (food: FoodItem) => {
    // Save to recent searches
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 10)
    setRecentSearches(newRecent)
    localStorage.setItem('recentFoodSearches', JSON.stringify(newRecent))
    
    onSelectFood(food)
    onClose()
  }
  
  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    inputRef.current?.focus()
  }
  
  const useRecentSearch = (term: string) => {
    setSearchTerm(term)
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay bg="rgba(0, 0, 0, 0.6)" />
      <ModalContent 
        bg={bg} 
        m={0} 
        borderRadius={0}
        maxH="100vh"
        overflow="hidden"
      >
        <ModalBody p={0}>
          <VStack spacing={0} h="100vh">
            {/* Search Header */}
            <Box w="full" p={4} borderBottomWidth={1} borderColor={borderColor}>
              <HStack spacing={3}>
                <IconButton
                  aria-label="Close search"
                  icon={<FiX />}
                  variant="ghost"
                  onClick={onClose}
                />
                <InputGroup flex={1}>
                  <InputLeftElement>
                    <FiSearch color="gray.400" />
                  </InputLeftElement>
                  <Input
                    ref={inputRef}
                    placeholder="Search for foods..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outline"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="full"
                  />
                  {searchTerm && (
                    <InputRightElement>
                      {loading ? (
                        <Spinner size="sm" />
                      ) : (
                        <IconButton
                          aria-label="Clear search"
                          icon={<FiX />}
                          size="sm"
                          variant="ghost"
                          onClick={clearSearch}
                        />
                      )}
                    </InputRightElement>
                  )}
                </InputGroup>
                <IconButton
                  aria-label="Scan barcode"
                  icon={<FaBarcode />}
                  variant="outline"
                  colorScheme="blue"
                />
              </HStack>
            </Box>
            
            {/* Search Results */}
            <Box flex={1} w="full" overflow="auto">
              {!searchTerm ? (
                // Recent searches and suggestions
                <VStack spacing={4} p={4} align="stretch">
                  {recentSearches.length > 0 && (
                    <Box>
                      <Text fontWeight="medium" mb={3} color="gray.600">
                        Recent Searches
                      </Text>
                      <VStack spacing={2} align="stretch">
                        {recentSearches.slice(0, 5).map((term, index) => (
                          <Card key={index} variant="outline" cursor="pointer" onClick={() => useRecentSearch(term)}>
                            <CardBody py={3}>
                              <HStack justify="space-between">
                                <HStack>
                                  <FiSearch color="gray.400" />
                                  <Text>{term}</Text>
                                </HStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </Box>
                  )}
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="medium" mb={3} color="gray.600">
                      Quick Actions
                    </Text>
                    <VStack spacing={2} align="stretch">
                      <Card variant="outline" cursor="pointer">
                        <CardBody py={3}>
                          <HStack>
                            <FaBarcode color="blue.500" />
                            <Text>Scan Nutrition Label</Text>
                          </HStack>
                        </CardBody>
                      </Card>
                    </VStack>
                  </Box>
                </VStack>
              ) : searchResults.length > 0 ? (
                // Search results
                <VStack spacing={2} p={4} align="stretch">
                  {searchResults.map((food) => (
                    <Card 
                      key={food.id} 
                      variant="outline" 
                      cursor="pointer"
                      onClick={() => handleSelectFood(food)}
                      _hover={{ borderColor: 'green.300', shadow: 'md' }}
                      transition="all 0.2s"
                    >
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between" align="start">
                            <Box flex={1}>
                              <Text fontWeight="medium" fontSize="md" mb={1}>
                                {food.name}
                              </Text>
                              <Text fontSize="sm" color="gray.600">
                                Per {food.serving_size} {food.serving_unit}
                              </Text>
                            </Box>
                            <IconButton
                              aria-label="Add food"
                              icon={<FiPlus />}
                              size="sm"
                              colorScheme="green"
                              variant="ghost"
                            />
                          </HStack>
                          
                          <HStack spacing={4} fontSize="sm">
                            <Badge colorScheme="orange" variant="subtle">
                              {Math.round(food.nutrition?.calories || 0)} cal
                            </Badge>
                            <Text color="gray.500">
                              P: {Math.round(food.nutrition?.protein || 0)}g
                            </Text>
                            <Text color="gray.500">
                              C: {Math.round(food.nutrition?.carbs || 0)}g
                            </Text>
                            <Text color="gray.500">
                              F: {Math.round(food.nutrition?.fat || 0)}g
                            </Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              ) : searchTerm.length >= 2 && !loading ? (
                // No results
                <VStack spacing={4} py={20} px={4}>
                  <Text color="gray.500" textAlign="center">
                    No foods found for "{searchTerm}"
                  </Text>
                  <Button 
                    colorScheme="green" 
                    variant="outline"
                    size="sm"
                  >
                    Add Custom Food
                  </Button>
                </VStack>
              ) : null}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default MobileFoodSearch
