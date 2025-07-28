import { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Alert,
  AlertIcon,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useBreakpointValue,
  useColorModeValue,
  Center,
  Spinner,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { FiSearch, FiHeart, FiTrendingUp, FiPlus } from 'react-icons/fi'
import { useUserFavorites } from '../hooks/useUserFavorites'
import { useNavigate } from 'react-router-dom'
import FavoriteManagement from '../components/food/FavoriteManagement'

const MotionCard = motion(Card)

const FavoritesPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const { favorites, stats, loading, error } = useUserFavorites()
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.700')

  // Calculate local stats if backend stats not available
  const localStats = {
    total_favorites: favorites.length,
    avgCalories: favorites.reduce((sum, fav) => sum + (fav.nutrition?.calories || 0), 0) / Math.max(favorites.length, 1),
    categories_breakdown: favorites.reduce((acc, fav) => {
      if (!fav.category) return acc
      acc[fav.category] = (acc[fav.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    addedThisWeek: favorites.filter(fav => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(fav.created_at) > weekAgo
    }).length
  }

  const mostCommonCategory = Object.entries(localStats.categories_breakdown)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'

  const displayStats = {
    total_favorites: stats?.total_favorites || localStats.total_favorites,
    avgCalories: localStats.avgCalories,
    mostCommonCategory: stats ? 
      Object.entries(stats.categories_breakdown || {}).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None' 
      : mostCommonCategory,
    addedThisWeek: localStats.addedThisWeek
  }

  // Filter and sort favorites
  const filteredFavorites = favorites
    .filter(fav => {
      const matchesSearch = fav.food_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || fav.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.food_name.localeCompare(b.food_name)
        case 'calories':
          return (b.nutrition?.calories || 0) - (a.nutrition?.calories || 0)
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  const categories = ['all', ...new Set(favorites.map(fav => fav.category).filter(Boolean))]

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #f6f9fc 0%, #e9f4f9 100%)">
      <Container maxW="container.xl" py={isMobile ? 4 : 8} px={isMobile ? 4 : 8}>
        {/* Header Section */}
        <VStack spacing={isMobile ? 4 : 6} align="stretch">
          <VStack align="center" spacing={isMobile ? 2 : 4} textAlign="center">
            <VStack align="center" spacing={2}>
              <Heading 
                size={isMobile ? "lg" : "xl"} 
                color="green.600"
                textAlign="center"
              >
                My Favorite Foods
              </Heading>
              <Text 
                color="gray.600" 
                fontSize={isMobile ? "md" : "lg"}
                textAlign="center"
                maxW="md"
              >
                Quick access to your most-loved nutrition choices
              </Text>
            </VStack>
            
            <Button
              leftIcon={<FiPlus />}
              colorScheme="green"
              size={isMobile ? "md" : "lg"}
              onClick={() => navigate('/food-index')}
              w={isMobile ? "full" : "auto"}
              maxW={isMobile ? "xs" : "none"}
            >
              Add Foods
            </Button>
          </VStack>

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
            <MotionCard
              bg={cardBg}
              borderWidth={1}
              borderColor={borderColor}
              whileHover={{ transform: 'translateY(-2px)' }}
            >
              <CardBody py={isMobile ? 4 : 6}>
                <Stat>
                  <StatLabel fontSize={isMobile ? "xs" : "sm"}>Total Favorites</StatLabel>
                  <StatNumber color="green.600" fontSize={isMobile ? "lg" : "xl"}>
                    {displayStats.total_favorites}
                  </StatNumber>
                  <StatHelpText fontSize={isMobile ? "xs" : "sm"}>
                    <Icon as={FiHeart} color="red.500" mr={1} />
                    Saved foods
                  </StatHelpText>
                </Stat>
              </CardBody>
            </MotionCard>

            <MotionCard
              bg={cardBg}
              borderWidth={1}
              borderColor={borderColor}
              whileHover={{ transform: 'translateY(-2px)' }}
            >
              <CardBody py={isMobile ? 4 : 6}>
                <Stat>
                  <StatLabel fontSize={isMobile ? "xs" : "sm"}>Avg Calories</StatLabel>
                  <StatNumber color="orange.600" fontSize={isMobile ? "lg" : "xl"}>
                    {Math.round(displayStats.avgCalories || 0)}
                  </StatNumber>
                  <StatHelpText fontSize={isMobile ? "xs" : "sm"}>Per serving</StatHelpText>
                </Stat>
              </CardBody>
            </MotionCard>

            <MotionCard
              bg={cardBg}
              borderWidth={1}
              borderColor={borderColor}
              whileHover={{ transform: 'translateY(-2px)' }}
            >
              <CardBody py={isMobile ? 4 : 6}>
                <Stat>
                  <StatLabel fontSize={isMobile ? "xs" : "sm"}>Most Common</StatLabel>
                  <StatNumber 
                    color="blue.600" 
                    fontSize={isMobile ? "sm" : "md"} 
                    textTransform="capitalize"
                  >
                    {displayStats.mostCommonCategory || 'None'}
                  </StatNumber>
                  <StatHelpText fontSize={isMobile ? "xs" : "sm"}>Category</StatHelpText>
                </Stat>
              </CardBody>
            </MotionCard>

            <MotionCard
              bg={cardBg}
              borderWidth={1}
              borderColor={borderColor}
              whileHover={{ transform: 'translateY(-2px)' }}
            >
              <CardBody py={isMobile ? 4 : 6}>
                <Stat>
                  <StatLabel fontSize={isMobile ? "xs" : "sm"}>This Week</StatLabel>
                  <StatNumber color="purple.600" fontSize={isMobile ? "lg" : "xl"}>
                    {displayStats.addedThisWeek || 0}
                  </StatNumber>
                  <StatHelpText fontSize={isMobile ? "xs" : "sm"}>
                    <Icon as={FiTrendingUp} color="green.500" mr={1} />
                    New additions
                  </StatHelpText>
                </Stat>
              </CardBody>
            </MotionCard>
          </SimpleGrid>

          {/* Search and Filter Section */}
          <Card bg={bg} borderWidth={1} borderColor={borderColor}>
            <CardHeader pb={3}>
              <HStack justify="space-between" wrap="wrap" spacing={2}>
                <Heading size={isMobile ? "sm" : "md"} color="gray.700">
                  Search & Filter
                </Heading>
                <Badge colorScheme="green" variant="outline" fontSize={isMobile ? "xs" : "sm"}>
                  {filteredFavorites.length} results
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={4}>
                {/* Search Bar */}
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search your favorite foods..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg={useColorModeValue('white', 'gray.600')}
                    size={isMobile ? "md" : "lg"}
                  />
                </InputGroup>

                {/* Filters */}
                <VStack spacing={3} w="full" align="stretch">
                  <HStack spacing={4} w="full" flexWrap="wrap">
                    <Select
                      placeholder="All Categories"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      flex={isMobile ? "1" : "none"}
                      minW={isMobile ? "full" : "200px"}
                      maxW={isMobile ? "full" : "200px"}
                      bg={useColorModeValue('white', 'gray.600')}
                      size={isMobile ? "md" : "lg"}
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </Select>

                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      flex={isMobile ? "1" : "none"}
                      minW={isMobile ? "full" : "200px"}
                      maxW={isMobile ? "full" : "200px"}
                      bg={useColorModeValue('white', 'gray.600')}
                      size={isMobile ? "md" : "lg"}
                    >
                      <option value="name">Sort by Name</option>
                      <option value="calories">Sort by Calories</option>
                      <option value="recent">Sort by Recent</option>
                    </Select>
                  </HStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Results Section */}
          {loading ? (
            <Center py={8}>
              <Spinner size="xl" color="green.500" />
            </Center>
          ) : error ? (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              Failed to load favorites: {error}
            </Alert>
          ) : filteredFavorites.length === 0 ? (
            <Card bg={bg} borderWidth={1} borderColor={borderColor}>
              <CardBody>
                <Center py={8}>
                  <VStack spacing={4}>
                    <Icon as={FiHeart} w={12} h={12} color="gray.400" />
                    <Heading size="md" color="gray.500">
                      {searchQuery || selectedCategory !== 'all' 
                        ? 'No matching favorites found' 
                        : 'No favorites yet'
                      }
                    </Heading>
                    <Text color="gray.500" textAlign="center">
                      {searchQuery || selectedCategory !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Start building your collection by adding foods from the Food Index'
                      }
                    </Text>
                    <Button
                      colorScheme="green"
                      leftIcon={<FiPlus />}
                      onClick={() => navigate('/food-index')}
                    >
                      Browse Food Index
                    </Button>
                  </VStack>
                </Center>
              </CardBody>
            </Card>
          ) : (
            <Card bg={bg} borderWidth={1} borderColor={borderColor}>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading size="md" color="gray.700">
                    Your Favorite Foods
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    {filteredFavorites.length} of {favorites.length} foods
                  </Text>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <FavoriteManagement />
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </Box>
  )
}

export default FavoritesPage
