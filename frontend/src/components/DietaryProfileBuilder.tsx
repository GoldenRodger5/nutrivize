import { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Progress,
  Heading,
  useColorModeValue
} from '@chakra-ui/react'

// Dietary restriction categories with AI-powered compatibility scoring
const DIETARY_CATEGORIES = {
  lifestyle: {
    name: 'Lifestyle',
    options: ['vegetarian', 'vegan', 'pescatarian', 'flexitarian'],
    icon: '🌱',
    description: 'Your dietary lifestyle choice'
  },
  religious: {
    name: 'Religious/Cultural',
    options: ['halal', 'kosher', 'jain'],
    icon: '🕊️',
    description: 'Religious or cultural dietary requirements'
  },
  health: {
    name: 'Health Requirements',
    options: ['gluten-free', 'dairy-free', 'keto', 'paleo', 'low-sodium'],
    icon: '🏥',
    description: 'Health-based dietary needs'
  },
  fitness: {
    name: 'Health & Fitness Goals',
    options: ['high-protein', 'low-carb', 'low-sugar', 'whole-foods', 'heart-healthy', 'anti-inflammatory', 'high-fiber'],
    icon: '💪',
    description: 'Nutritional goals for health and fitness'
  },
  allergens: {
    name: 'Allergens to Avoid',
    options: ['nuts', 'shellfish', 'eggs', 'soy', 'fish', 'sesame'],
    icon: '⚠️',
    description: 'Foods that cause allergic reactions'
  }
}

interface DietaryProfileBuilderProps {
  currentProfile: any
  onProfileUpdate: (profile: any) => void
}

export default function DietaryProfileBuilder({ currentProfile, onProfileUpdate }: DietaryProfileBuilderProps) {
  const [selectedRestrictions, setSelectedRestrictions] = useState(currentProfile?.dietary_restrictions || [])
  const [selectedAllergens, setSelectedAllergens] = useState(currentProfile?.allergens || [])
  const [strictnessLevel, setStrictnessLevel] = useState(currentProfile?.strictness_level || 'moderate')

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const toggleRestriction = (restriction: string) => {
    setSelectedRestrictions((prev: string[]) => 
      prev.includes(restriction) 
        ? prev.filter((r: string) => r !== restriction)
        : [...prev, restriction]
    )
  }

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev: string[]) => 
      prev.includes(allergen) 
        ? prev.filter((a: string) => a !== allergen)
        : [...prev, allergen]
    )
  }

  const calculateCompatibilityScore = () => {
    // AI-powered scoring based on dietary complexity
    const baseScore = 100
    const restrictionPenalty = selectedRestrictions.length * 5
    const allergenPenalty = selectedAllergens.length * 10
    const strictnessPenalty = strictnessLevel === 'strict' ? 15 : strictnessLevel === 'moderate' ? 5 : 0
    
    return Math.max(0, baseScore - restrictionPenalty - allergenPenalty - strictnessPenalty)
  }

  const getStrictnessColor = () => {
    const score = calculateCompatibilityScore()
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'red'
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="md" mb={2}>🎯 Build Your Dietary Profile</Heading>
        <Text color="gray.600" fontSize="sm">
          Help us find foods that perfectly match your lifestyle
        </Text>
      </Box>

      {/* Compatibility Score */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <VStack spacing={3}>
            <HStack justify="space-between" w="full">
              <Text fontWeight="bold">Food Compatibility Score</Text>
              <Badge colorScheme={getStrictnessColor()} size="lg">
                {calculateCompatibilityScore()}%
              </Badge>
            </HStack>
            <Progress 
              value={calculateCompatibilityScore()} 
              colorScheme={getStrictnessColor()} 
              w="full" 
              borderRadius="md"
            />
            <Text fontSize="sm" color="gray.600">
              Higher scores mean more food options available
            </Text>
          </VStack>
        </CardBody>
      </Card>

      {/* Dietary Categories */}
      {Object.entries(DIETARY_CATEGORIES).map(([key, category]) => (
        <Card key={key} bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Text fontSize="2xl">{category.icon}</Text>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">{category.name}</Text>
                  <Text fontSize="sm" color="gray.600">{category.description}</Text>
                </VStack>
              </HStack>
              
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                {category.options.map(option => {
                  const isSelected = key === 'allergens' 
                    ? selectedAllergens.includes(option)
                    : selectedRestrictions.includes(option)
                  
                  return (
                    <Button
                      key={option}
                      size="sm"
                      variant={isSelected ? 'solid' : 'outline'}
                      colorScheme={key === 'allergens' ? 'red' : 'green'}
                      onClick={() => key === 'allergens' ? toggleAllergen(option) : toggleRestriction(option)}
                      textTransform="capitalize"
                    >
                      {option}
                    </Button>
                  )
                })}
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      ))}

      {/* Strictness Level */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Text fontSize="2xl">🎚️</Text>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold">Strictness Level</Text>
                <Text fontSize="sm" color="gray.600">How strictly do you follow your dietary preferences?</Text>
              </VStack>
            </HStack>
            
            <HStack spacing={2}>
              {['flexible', 'moderate', 'strict'].map(level => (
                <Button
                  key={level}
                  flex={1}
                  size="sm"
                  variant={strictnessLevel === level ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => setStrictnessLevel(level)}
                  textTransform="capitalize"
                >
                  {level}
                </Button>
              ))}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Save Profile */}
      <Button
        colorScheme="green"
        size="lg"
        onClick={() => onProfileUpdate({
          dietary_restrictions: selectedRestrictions,
          allergens: selectedAllergens,
          strictness_level: strictnessLevel,
          compatibility_score: calculateCompatibilityScore()
        })}
      >
        💾 Save Dietary Profile
      </Button>
    </VStack>
  )
}
