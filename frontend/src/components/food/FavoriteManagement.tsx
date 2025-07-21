// Favorites Management Component
import React, { useState, useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Select,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Spinner,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay
} from '@chakra-ui/react'
import { FaHeart, FaEdit, FaTrash, FaPlus, FaEllipsisV } from 'react-icons/fa'
import { useUserFavorites } from '../../hooks/useUserFavorites'
import { UserFavorite } from '../../services/userFavoritesService'

const FavoriteManagement = () => {
  const {
    favorites,
    stats,
    loading,
    updateFavorite,
    removeFavorite,
    searchFavorites,
  } = useUserFavorites()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'date'>('name')
  const [editingFavorite, setEditingFavorite] = useState<UserFavorite | null>(null)
  const [deletingFavorite, setDeletingFavorite] = useState<UserFavorite | null>(null)
  const [newTag, setNewTag] = useState('')

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = React.useRef<HTMLButtonElement>(null)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    let filtered = favorites

    // Search filter
    if (searchQuery.trim()) {
      filtered = searchFavorites(searchQuery)
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(fav => fav.category === selectedCategory)
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(fav => 
        selectedTags.every(tag => fav.tags.includes(tag))
      )
    }

    // Sort
    switch (sortBy) {
      case 'usage':
        filtered.sort((a, b) => b.usage_count - a.usage_count)
        break
      case 'date':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'name':
      default:
        filtered.sort((a, b) => (a.custom_name || a.food_name).localeCompare(b.custom_name || b.food_name))
        break
    }

    return filtered
  }, [favorites, searchQuery, selectedCategory, selectedTags, sortBy, searchFavorites])

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    favorites.forEach(fav => fav.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [favorites])

  const handleEditFavorite = (favorite: UserFavorite) => {
    setEditingFavorite(favorite)
    onEditOpen()
  }

  const handleDeleteFavorite = (favorite: UserFavorite) => {
    setDeletingFavorite(favorite)
    onDeleteOpen()
  }

  const handleUpdateFavorite = async () => {
    if (!editingFavorite) return

    try {
      await updateFavorite(editingFavorite.food_id, {
        custom_name: editingFavorite.custom_name,
        category: editingFavorite.category,
        notes: editingFavorite.notes,
        tags: editingFavorite.tags,
        default_serving_size: editingFavorite.default_serving_size,
        default_serving_unit: editingFavorite.default_serving_unit
      })
      onEditClose()
      setEditingFavorite(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingFavorite) return

    try {
      await removeFavorite(deletingFavorite.food_id)
      onDeleteClose()
      setDeletingFavorite(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const addTag = () => {
    if (newTag.trim() && editingFavorite && !editingFavorite.tags.includes(newTag.trim())) {
      setEditingFavorite({
        ...editingFavorite,
        tags: [...editingFavorite.tags, newTag.trim()]
      })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (editingFavorite) {
      setEditingFavorite({
        ...editingFavorite,
        tags: editingFavorite.tags.filter(tag => tag !== tagToRemove)
      })
    }
  }

  const toggleTagFilter = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const FavoriteCard = ({ favorite }: { favorite: UserFavorite }) => (
    <Card variant="outline" bg={cardBg} borderColor={borderColor}>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1} flex={1}>
            <Text fontWeight="bold" fontSize="md" noOfLines={2}>
              {favorite.custom_name || favorite.food_name}
            </Text>
            {favorite.custom_name && (
              <Text fontSize="sm" color="gray.500" noOfLines={1}>
                Original: {favorite.food_name}
              </Text>
            )}
          </VStack>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FaEllipsisV />}
              variant="ghost"
              size="sm"
            />
            <MenuList>
              <MenuItem icon={<FaEdit />} onClick={() => handleEditFavorite(favorite)}>
                Edit
              </MenuItem>
              <MenuItem icon={<FaTrash />} onClick={() => handleDeleteFavorite(favorite)}>
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack align="start" spacing={3}>
          <HStack>
            <Badge colorScheme="blue" variant="outline">
              {favorite.category}
            </Badge>
            <Badge colorScheme="green" variant="outline">
              Used {favorite.usage_count} times
            </Badge>
          </HStack>

          {favorite.tags.length > 0 && (
            <HStack wrap="wrap" spacing={1}>
              {favorite.tags.map(tag => (
                <Tag key={tag} size="sm" colorScheme="purple" variant="subtle">
                  <TagLabel>{tag}</TagLabel>
                </Tag>
              ))}
            </HStack>
          )}

          {favorite.notes && (
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              📝 {favorite.notes}
            </Text>
          )}

          {favorite.default_serving_size && favorite.default_serving_unit && (
            <Text fontSize="sm" color="gray.500">
              Default: {favorite.default_serving_size} {favorite.default_serving_unit}
            </Text>
          )}

          {favorite.nutrition && (
            <SimpleGrid columns={4} spacing={2} w="full">
              <Stat size="sm">
                <StatNumber fontSize="sm" color="green.500">
                  {Math.round(favorite.nutrition.calories)}
                </StatNumber>
                <StatLabel fontSize="xs">cal</StatLabel>
              </Stat>
              <Stat size="sm">
                <StatNumber fontSize="sm" color="blue.500">
                  {favorite.nutrition.protein}g
                </StatNumber>
                <StatLabel fontSize="xs">protein</StatLabel>
              </Stat>
              <Stat size="sm">
                <StatNumber fontSize="sm" color="orange.500">
                  {favorite.nutrition.carbs}g
                </StatNumber>
                <StatLabel fontSize="xs">carbs</StatLabel>
              </Stat>
              <Stat size="sm">
                <StatNumber fontSize="sm" color="purple.500">
                  {favorite.nutrition.fat}g
                </StatNumber>
                <StatLabel fontSize="xs">fat</StatLabel>
              </Stat>
            </SimpleGrid>
          )}
        </VStack>
      </CardBody>
    </Card>
  )

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading your favorites...</Text>
      </Box>
    )
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl" fontWeight="bold">
              <FaHeart color="red" style={{ display: 'inline', marginRight: '8px' }} />
              My Favorite Foods
            </Text>
            <Text color="gray.500">
              {favorites.length} favorites • {stats?.total_favorites || 0} total
            </Text>
          </VStack>
        </HStack>

        {/* Stats Cards */}
        {stats && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Stat>
              <StatLabel>Total Favorites</StatLabel>
              <StatNumber>{stats.total_favorites}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Most Used</StatLabel>
              <StatNumber>{stats.most_used_favorites[0]?.usage_count || 0}</StatNumber>
              <StatHelpText>{stats.most_used_favorites[0]?.food_name || 'None'}</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Categories</StatLabel>
              <StatNumber>{Object.keys(stats.categories_breakdown).length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Tags</StatLabel>
              <StatNumber>{Object.keys(stats.tags_summary).length}</StatNumber>
            </Stat>
          </SimpleGrid>
        )}

        <Divider />

        {/* Filters */}
        <HStack spacing={4} wrap="wrap">
          <FormControl maxW="300px">
            <FormLabel fontSize="sm">Search</FormLabel>
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
            />
          </FormControl>

          <FormControl maxW="150px">
            <FormLabel fontSize="sm">Category</FormLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              size="sm"
            >
              <option value="all">All Categories</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
              <option value="dessert">Dessert</option>
              <option value="drink">Drink</option>
              <option value="ingredient">Ingredient</option>
              <option value="general">General</option>
            </Select>
          </FormControl>

          <FormControl maxW="150px">
            <FormLabel fontSize="sm">Sort by</FormLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'date')}
              size="sm"
            >
              <option value="name">Name</option>
              <option value="usage">Usage Count</option>
              <option value="date">Date Added</option>
            </Select>
          </FormControl>
        </HStack>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" fontWeight="medium">Filter by Tags:</Text>
            <HStack wrap="wrap" spacing={2}>
              {allTags.map(tag => (
                <Tag
                  key={tag}
                  size="sm"
                  colorScheme={selectedTags.includes(tag) ? 'purple' : 'gray'}
                  variant={selectedTags.includes(tag) ? 'solid' : 'outline'}
                  cursor="pointer"
                  onClick={() => toggleTagFilter(tag)}
                >
                  <TagLabel>{tag}</TagLabel>
                </Tag>
              ))}
            </HStack>
          </VStack>
        )}

        {/* Favorites Grid */}
        {filteredFavorites.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredFavorites.map((favorite) => (
              <FavoriteCard key={favorite.id} favorite={favorite} />
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" color="gray.500">
              {searchQuery || selectedCategory !== 'all' || selectedTags.length > 0 
                ? 'No favorites match your filters'
                : 'No favorites yet'
              }
            </Text>
            <Text fontSize="sm" color="gray.400" mt={2}>
              {searchQuery || selectedCategory !== 'all' || selectedTags.length > 0 
                ? 'Try adjusting your filters'
                : 'Start adding foods to your favorites using the ❤️ button in the food logger'
              }
            </Text>
          </Box>
        )}

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Favorite</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {editingFavorite && (
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Custom Name</FormLabel>
                    <Input
                      value={editingFavorite.custom_name || ''}
                      onChange={(e) => setEditingFavorite({
                        ...editingFavorite,
                        custom_name: e.target.value
                      })}
                      placeholder={editingFavorite.food_name}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={editingFavorite.category}
                      onChange={(e) => setEditingFavorite({
                        ...editingFavorite,
                        category: e.target.value as UserFavorite['category']
                      })}
                    >
                      <option value="general">General</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                      <option value="dessert">Dessert</option>
                      <option value="drink">Drink</option>
                      <option value="ingredient">Ingredient</option>
                    </Select>
                  </FormControl>

                  <SimpleGrid columns={2} spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Default Serving Size</FormLabel>
                      <Input
                        type="number"
                        value={editingFavorite.default_serving_size || ''}
                        onChange={(e) => setEditingFavorite({
                          ...editingFavorite,
                          default_serving_size: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Default Serving Unit</FormLabel>
                      <Input
                        value={editingFavorite.default_serving_unit || ''}
                        onChange={(e) => setEditingFavorite({
                          ...editingFavorite,
                          default_serving_unit: e.target.value
                        })}
                        placeholder="e.g., g, oz, cup"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={editingFavorite.notes || ''}
                      onChange={(e) => setEditingFavorite({
                        ...editingFavorite,
                        notes: e.target.value
                      })}
                      placeholder="Add any notes about this favorite..."
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Tags</FormLabel>
                    <HStack spacing={2} mb={2}>
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        size="sm"
                      />
                      <Button size="sm" onClick={addTag} leftIcon={<FaPlus />}>
                        Add
                      </Button>
                    </HStack>
                    <HStack wrap="wrap" spacing={2}>
                      {editingFavorite.tags.map(tag => (
                        <Tag key={tag} size="sm" colorScheme="purple">
                          <TagLabel>{tag}</TagLabel>
                          <TagCloseButton onClick={() => removeTag(tag)} />
                        </Tag>
                      ))}
                    </HStack>
                  </FormControl>

                  <HStack justify="flex-end" w="full" pt={4}>
                    <Button variant="ghost" onClick={onEditClose}>
                      Cancel
                    </Button>
                    <Button colorScheme="blue" onClick={handleUpdateFavorite}>
                      Save Changes
                    </Button>
                  </HStack>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Favorite
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to remove "{deletingFavorite?.custom_name || deletingFavorite?.food_name}" from your favorites?
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Box>
  )
}

export default FavoriteManagement
