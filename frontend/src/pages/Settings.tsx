import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
  CheckboxGroup,
  Divider,
  Badge,
  SimpleGrid,
  Wrap,
  WrapItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Flex,
  Spacer,
  useColorModeValue,
} from '@chakra-ui/react'
import { EditIcon, CheckIcon, CloseIcon, AddIcon, DeleteIcon } from '@chakra-ui/icons'
import { useUserPreferences, DietaryPreferences, NutritionPreferences, AppPreferences } from '../hooks/useUserPreferences'
import { useColorModeContext } from '../contexts/ColorModeContext'

interface SettingsPageProps {}

const dietaryRestrictionOptions = [
  'vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 
  'nut-free', 'soy-free', 'low-carb', 'keto', 'paleo', 'mediterranean'
]

const allergenOptions = [
  'nuts', 'shellfish', 'dairy', 'eggs', 'soy', 'gluten', 'fish', 'sesame'
]

const cuisineOptions = [
  'italian', 'mexican', 'asian', 'indian', 'mediterranean', 'american', 
  'french', 'thai', 'chinese', 'japanese', 'greek', 'middle-eastern'
]

const cookingSkillOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
]

const budgetOptions = [
  { value: 'low', label: 'Budget-Conscious' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'Premium' }
]

const strictnessOptions = [
  { value: 'flexible', label: 'Flexible' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'strict', label: 'Strict' }
]

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' }
]

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const unitsOptions = [
  { value: 'metric', label: 'Metric (kg, cm)' },
  { value: 'imperial', label: 'Imperial (lbs, ft)' }
]

const mealTypeOptions = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
]

const dashboardWidgetOptions = [
  { value: 'nutrition_summary', label: 'Nutrition Summary' },
  { value: 'recent_meals', label: 'Recent Meals' },
  { value: 'goals_progress', label: 'Goals Progress' },
  { value: 'water_intake', label: 'Water Intake' },
  { value: 'weekly_trends', label: 'Weekly Trends' },
  { value: 'meal_suggestions', label: 'Meal Suggestions' }
]

export default function SettingsPage({}: SettingsPageProps) {
  const { colorMode, setColorMode } = useColorModeContext()
  
  // Use our comprehensive preferences hook
  const {
    preferences,
    loading,
    error,
    updateDietaryPreferences,
    updateNutritionPreferences,
    updateAppPreferences,
    addDislikedFood,
    removeDislikedFood,
    resetPreferences,
  } = useUserPreferences()

  // Local editing states
  const [editingDietary, setEditingDietary] = useState(false)
  const [editingNutrition, setEditingNutrition] = useState(false)
  const [editingApp, setEditingApp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newDislikedFood, setNewDislikedFood] = useState('')

  // Local form states (for editing)
  const [localDietary, setLocalDietary] = useState<Partial<DietaryPreferences>>({})
  const [localNutrition, setLocalNutrition] = useState<Partial<NutritionPreferences>>({})
  const [localApp, setLocalApp] = useState<Partial<AppPreferences>>({})

  // Card styling
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Initialize local states when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalDietary(preferences.dietary || {})
      setLocalNutrition(preferences.nutrition || {})
      setLocalApp(preferences.app || {})
    }
  }, [preferences])

  // Handle saving dietary preferences
  const handleSaveDietary = async () => {
    setSaving(true)
    const success = await updateDietaryPreferences(localDietary)
    if (success) {
      setEditingDietary(false)
    }
    setSaving(false)
  }

  // Handle saving nutrition preferences
  const handleSaveNutrition = async () => {
    setSaving(true)
    const success = await updateNutritionPreferences(localNutrition)
    if (success) {
      setEditingNutrition(false)
    }
    setSaving(false)
  }

  // Handle saving app preferences
  const handleSaveApp = async () => {
    setSaving(true)
    const success = await updateAppPreferences(localApp)
    if (success) {
      setEditingApp(false)
      // Update color mode if changed
      if (localApp.theme && localApp.theme !== colorMode) {
        setColorMode(localApp.theme as 'light' | 'dark')
      }
    }
    setSaving(false)
  }

  // Handle adding disliked food
  const handleAddDislikedFood = async () => {
    if (newDislikedFood.trim()) {
      const success = await addDislikedFood(newDislikedFood.trim())
      if (success) {
        setNewDislikedFood('')
      }
    }
  }

  // Handle removing disliked food
  const handleRemoveDislikedFood = async (foodName: string) => {
    await removeDislikedFood(foodName)
  }

  // Loading state
  if (loading) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack spacing={8}>
          <Spinner size="xl" />
          <Text>Loading your preferences...</Text>
        </VStack>
      </Container>
    )
  }

  // Error state
  if (error) {
    return (
      <Container maxW="4xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Error loading preferences!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Settings & Preferences</Heading>
          <Text color="gray.600">Customize your Nutrivize experience</Text>
        </Box>

        {/* Preferences Tabs */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Dietary Preferences</Tab>
            <Tab>Nutrition Goals</Tab>
            <Tab>App Settings</Tab>
            <Tab>Account</Tab>
          </TabList>

          <TabPanels>
            {/* Dietary Preferences Tab */}
            <TabPanel px={0}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Flex align="center" mb={6}>
                    <Heading size="md">Dietary Preferences</Heading>
                    <Spacer />
                    {!editingDietary ? (
                      <IconButton
                        aria-label="Edit dietary preferences"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingDietary(true)}
                      />
                    ) : (
                      <HStack>
                        <IconButton
                          aria-label="Save changes"
                          icon={<CheckIcon />}
                          size="sm"
                          colorScheme="green"
                          isLoading={saving}
                          onClick={handleSaveDietary}
                        />
                        <IconButton
                          aria-label="Cancel editing"
                          icon={<CloseIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingDietary(false)
                            setLocalDietary(preferences?.dietary || {})
                          }}
                        />
                      </HStack>
                    )}
                  </Flex>

                  <VStack spacing={6} align="stretch">
                    {/* Dietary Restrictions */}
                    <FormControl>
                      <FormLabel fontWeight="semibold">Dietary Restrictions</FormLabel>
                      <CheckboxGroup
                        value={localDietary.dietary_restrictions || []}
                        onChange={(values) => setLocalDietary(prev => ({
                          ...prev,
                          dietary_restrictions: values as string[]
                        }))}
                        isDisabled={!editingDietary}
                      >
                        <Wrap spacing={3}>
                          {dietaryRestrictionOptions.map(option => (
                            <WrapItem key={option}>
                              <Checkbox value={option} size="sm">
                                {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                              </Checkbox>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </CheckboxGroup>
                    </FormControl>

                    {/* Allergens */}
                    <FormControl>
                      <FormLabel fontWeight="semibold">Allergens to Avoid</FormLabel>
                      <CheckboxGroup
                        value={localDietary.allergens || []}
                        onChange={(values) => setLocalDietary(prev => ({
                          ...prev,
                          allergens: values as string[]
                        }))}
                        isDisabled={!editingDietary}
                      >
                        <Wrap spacing={3}>
                          {allergenOptions.map(option => (
                            <WrapItem key={option}>
                              <Checkbox value={option} size="sm">
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                              </Checkbox>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </CheckboxGroup>
                    </FormControl>

                    {/* Disliked Foods */}
                    <FormControl>
                      <FormLabel fontWeight="semibold">Disliked Foods</FormLabel>
                      <VStack spacing={3} align="stretch">
                        {/* Add new disliked food */}
                        <HStack>
                          <Input
                            placeholder="Add a food you dislike..."
                            value={newDislikedFood}
                            onChange={(e) => setNewDislikedFood(e.target.value)}
                            size="sm"
                          />
                          <IconButton
                            aria-label="Add disliked food"
                            icon={<AddIcon />}
                            size="sm"
                            colorScheme="blue"
                            onClick={handleAddDislikedFood}
                            isDisabled={!newDislikedFood.trim()}
                          />
                        </HStack>
                        
                        {/* Current disliked foods */}
                        <Wrap spacing={2}>
                          {(preferences?.dietary?.disliked_foods || []).map((food, index) => (
                            <WrapItem key={index}>
                              <Badge
                                colorScheme="red"
                                variant="subtle"
                                px={3}
                                py={1}
                                borderRadius="full"
                                cursor="pointer"
                                _hover={{ bg: 'red.200' }}
                                onClick={() => handleRemoveDislikedFood(food)}
                              >
                                {food}
                                <DeleteIcon ml={2} boxSize={3} />
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </VStack>
                    </FormControl>

                    {/* Preferred Cuisines */}
                    <FormControl>
                      <FormLabel fontWeight="semibold">Preferred Cuisines</FormLabel>
                      <CheckboxGroup
                        value={localDietary.preferred_cuisines || []}
                        onChange={(values) => setLocalDietary(prev => ({
                          ...prev,
                          preferred_cuisines: values as string[]
                        }))}
                        isDisabled={!editingDietary}
                      >
                        <Wrap spacing={3}>
                          {cuisineOptions.map(option => (
                            <WrapItem key={option}>
                              <Checkbox value={option} size="sm">
                                {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                              </Checkbox>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </CheckboxGroup>
                    </FormControl>

                    {/* Cooking Details */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontWeight="semibold" fontSize="sm">Cooking Skill Level</FormLabel>
                        <Select
                          value={localDietary.cooking_skill_level || 'intermediate'}
                          onChange={(e) => setLocalDietary(prev => ({
                            ...prev,
                            cooking_skill_level: e.target.value
                          }))}
                          size="sm"
                          isDisabled={!editingDietary}
                        >
                          {cookingSkillOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" fontSize="sm">Max Prep Time (min)</FormLabel>
                        <NumberInput
                          value={localDietary.max_prep_time || 30}
                          onChange={(_, num) => setLocalDietary(prev => ({
                            ...prev,
                            max_prep_time: num
                          }))}
                          min={5}
                          max={180}
                          size="sm"
                          isDisabled={!editingDietary}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontWeight="semibold" fontSize="sm">Budget Preference</FormLabel>
                        <Select
                          value={localDietary.budget_preference || 'moderate'}
                          onChange={(e) => setLocalDietary(prev => ({
                            ...prev,
                            budget_preference: e.target.value
                          }))}
                          size="sm"
                          isDisabled={!editingDietary}
                        >
                          {budgetOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </SimpleGrid>

                    {/* Strictness Level */}
                    <FormControl>
                      <FormLabel fontWeight="semibold">Strictness Level</FormLabel>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        How strictly should we follow your dietary preferences?
                      </Text>
                      <Select
                        value={localDietary.strictness_level || 'moderate'}
                        onChange={(e) => setLocalDietary(prev => ({
                          ...prev,
                          strictness_level: e.target.value
                        }))}
                        size="sm"
                        isDisabled={!editingDietary}
                      >
                        {strictnessOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Nutrition Goals Tab */}
            <TabPanel px={0}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Flex align="center" mb={6}>
                    <Heading size="md">Nutrition Goals</Heading>
                    <Spacer />
                    {!editingNutrition ? (
                      <IconButton
                        aria-label="Edit nutrition goals"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingNutrition(true)}
                      />
                    ) : (
                      <HStack>
                        <IconButton
                          aria-label="Save changes"
                          icon={<CheckIcon />}
                          size="sm"
                          colorScheme="green"
                          isLoading={saving}
                          onClick={handleSaveNutrition}
                        />
                        <IconButton
                          aria-label="Cancel editing"
                          icon={<CloseIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNutrition(false)
                            setLocalNutrition(preferences?.nutrition || {})
                          }}
                        />
                      </HStack>
                    )}
                  </Flex>

                  <VStack spacing={6} align="stretch">
                    {/* Daily Targets */}
                    <Box>
                      <Text fontWeight="semibold" mb={4}>Daily Nutrition Targets</Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">Calorie Goal</FormLabel>
                          <NumberInput
                            value={localNutrition.calorie_goal || 2000}
                            onChange={(_, num) => setLocalNutrition(prev => ({
                              ...prev,
                              calorie_goal: num
                            }))}
                            min={1200}
                            max={4000}
                            isDisabled={!editingNutrition}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Protein Goal (g)</FormLabel>
                          <NumberInput
                            value={localNutrition.protein_goal || 150}
                            onChange={(_, num) => setLocalNutrition(prev => ({
                              ...prev,
                              protein_goal: num
                            }))}
                            min={50}
                            max={300}
                            isDisabled={!editingNutrition}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Carbohydrate Goal (g)</FormLabel>
                          <NumberInput
                            value={localNutrition.carb_goal || 250}
                            onChange={(_, num) => setLocalNutrition(prev => ({
                              ...prev,
                              carb_goal: num
                            }))}
                            min={50}
                            max={500}
                            isDisabled={!editingNutrition}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Fat Goal (g)</FormLabel>
                          <NumberInput
                            value={localNutrition.fat_goal || 65}
                            onChange={(_, num) => setLocalNutrition(prev => ({
                              ...prev,
                              fat_goal: num
                            }))}
                            min={20}
                            max={200}
                            isDisabled={!editingNutrition}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Fiber Goal (g)</FormLabel>
                          <NumberInput
                            value={localNutrition.fiber_goal || 30}
                            onChange={(_, num) => setLocalNutrition(prev => ({
                              ...prev,
                              fiber_goal: num
                            }))}
                            min={10}
                            max={60}
                            isDisabled={!editingNutrition}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </SimpleGrid>
                    </Box>

                    <Divider />

                    {/* Meal Frequency */}
                    <Box>
                      <Text fontWeight="semibold" mb={4}>Meal Frequency</Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">Meals per Day</FormLabel>
                          <NumberInput
                            value={localNutrition.meal_frequency || 3}
                            onChange={(_, num) => setLocalNutrition(prev => ({
                              ...prev,
                              meal_frequency: num
                            }))}
                            min={1}
                            max={6}
                            isDisabled={!editingNutrition}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Snacks per Day</FormLabel>
                          <NumberInput
                            value={localNutrition.snack_frequency || 1}
                            onChange={(_, num) => setLocalNutrition(prev => ({
                              ...prev,
                              snack_frequency: num
                            }))}
                            min={0}
                            max={4}
                            isDisabled={!editingNutrition}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                      </SimpleGrid>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* App Settings Tab */}
            <TabPanel px={0}>
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Flex align="center" mb={6}>
                    <Heading size="md">App Settings</Heading>
                    <Spacer />
                    {!editingApp ? (
                      <IconButton
                        aria-label="Edit app settings"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingApp(true)}
                      />
                    ) : (
                      <HStack>
                        <IconButton
                          aria-label="Save changes"
                          icon={<CheckIcon />}
                          size="sm"
                          colorScheme="green"
                          isLoading={saving}
                          onClick={handleSaveApp}
                        />
                        <IconButton
                          aria-label="Cancel editing"
                          icon={<CloseIcon />}
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingApp(false)
                            setLocalApp(preferences?.app || {})
                          }}
                        />
                      </HStack>
                    )}
                  </Flex>

                  <VStack spacing={6} align="stretch">
                    {/* Display Settings */}
                    <Box>
                      <Text fontWeight="semibold" mb={4}>Display & Localization</Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel fontSize="sm">Units</FormLabel>
                          <Select
                            value={localApp.units || 'imperial'}
                            onChange={(e) => setLocalApp(prev => ({
                              ...prev,
                              units: e.target.value
                            }))}
                            isDisabled={!editingApp}
                          >
                            {unitsOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Language</FormLabel>
                          <Select
                            value={localApp.language || 'en'}
                            onChange={(e) => setLocalApp(prev => ({
                              ...prev,
                              language: e.target.value
                            }))}
                            isDisabled={!editingApp}
                          >
                            {languageOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Theme</FormLabel>
                          <Select
                            value={localApp.theme || 'light'}
                            onChange={(e) => setLocalApp(prev => ({
                              ...prev,
                              theme: e.target.value
                            }))}
                            isDisabled={!editingApp}
                          >
                            {themeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl>
                          <FormLabel fontSize="sm">Default Meal Type</FormLabel>
                          <Select
                            value={localApp.default_meal_type || 'lunch'}
                            onChange={(e) => setLocalApp(prev => ({
                              ...prev,
                              default_meal_type: e.target.value
                            }))}
                            isDisabled={!editingApp}
                          >
                            {mealTypeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </SimpleGrid>
                    </Box>

                    <Divider />

                    {/* Notification Settings */}
                    <Box>
                      <Text fontWeight="semibold" mb={4}>Notifications</Text>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Notifications Enabled</Text>
                            <Text fontSize="xs" color="gray.600">Receive push notifications from Nutrivize</Text>
                          </Box>
                          <Switch
                            isChecked={localApp.notifications_enabled ?? true}
                            onChange={(e) => setLocalApp(prev => ({
                              ...prev,
                              notifications_enabled: e.target.checked
                            }))}
                            isDisabled={!editingApp}
                          />
                        </HStack>

                        <HStack justify="space-between">
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Meal Reminders</Text>
                            <Text fontSize="xs" color="gray.600">Get reminders to log your meals</Text>
                          </Box>
                          <Switch
                            isChecked={localApp.meal_reminders ?? true}
                            onChange={(e) => setLocalApp(prev => ({
                              ...prev,
                              meal_reminders: e.target.checked
                            }))}
                            isDisabled={!editingApp}
                          />
                        </HStack>

                        <HStack justify="space-between">
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">Weekly Insights</Text>
                            <Text fontSize="xs" color="gray.600">Receive weekly nutrition insights and reports</Text>
                          </Box>
                          <Switch
                            isChecked={localApp.weekly_insights ?? true}
                            onChange={(e) => setLocalApp(prev => ({
                              ...prev,
                              weekly_insights: e.target.checked
                            }))}
                            isDisabled={!editingApp}
                          />
                        </HStack>
                      </VStack>
                    </Box>

                    <Divider />

                    {/* Dashboard Widgets */}
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Dashboard Widgets</Text>
                      <Text fontSize="sm" color="gray.600" mb={4}>
                        Choose which widgets to display on your dashboard
                      </Text>
                      <CheckboxGroup
                        value={localApp.dashboard_widgets || []}
                        onChange={(values) => setLocalApp(prev => ({
                          ...prev,
                          dashboard_widgets: values as string[]
                        }))}
                        isDisabled={!editingApp}
                      >
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                          {dashboardWidgetOptions.map(option => (
                            <Checkbox key={option.value} value={option.value} size="sm">
                              {option.label}
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </CheckboxGroup>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Account Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                {/* Danger Zone */}
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <Heading size="md" color="red.500" mb={4}>Danger Zone</Heading>
                    <VStack spacing={4} align="stretch">
                      <Box p={4} borderRadius="md" bg="red.50" border="1px" borderColor="red.200">
                        <Text fontWeight="semibold" mb={2}>Reset All Preferences</Text>
                        <Text fontSize="sm" color="gray.700" mb={4}>
                          This will reset all your preferences to their default values. This action cannot be undone.
                        </Text>
                        <Button
                          colorScheme="red"
                          variant="outline"
                          size="sm"
                          onClick={resetPreferences}
                        >
                          Reset All Preferences
                        </Button>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  )
}
