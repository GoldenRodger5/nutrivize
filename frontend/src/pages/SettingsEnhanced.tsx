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
  CardHeader,
  Button,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  useToast,
  Icon,
} from '@chakra-ui/react'
import { FiSettings, FiUser, FiTarget, FiSmartphone, FiCheck } from 'react-icons/fi'
import { useUserPreferences } from '../hooks/useUserPreferences'
import { motion } from 'framer-motion'

const MotionCard = motion(Card)

interface SettingsEnhancedProps {}

const SettingsEnhanced: React.FC<SettingsEnhancedProps> = () => {
  const {
    preferences,
    loading,
    error,
    updateDietaryPreferences,
    updateNutritionPreferences,
    updateAppPreferences,
  } = useUserPreferences()

  const [localPreferences, setLocalPreferences] = useState<any>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Initialize local preferences when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        dietary: preferences.dietary || {},
        nutrition: preferences.nutrition || {},
        app: preferences.app || {}
      })
    }
  }, [preferences])

  // Handle local preference changes
  const handlePreferenceChange = (section: string, field: string, value: any) => {
    setLocalPreferences((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  // Handle dashboard widget toggles
  const handleDashboardWidgetToggle = (widget: string, enabled: boolean) => {
    const currentWidgets = localPreferences.app?.dashboard_widgets || []
    let newWidgets
    
    if (enabled) {
      newWidgets = [...currentWidgets, widget]
    } else {
      newWidgets = currentWidgets.filter((w: string) => w !== widget)
    }
    
    handlePreferenceChange('app', 'dashboard_widgets', newWidgets)
  }

  // Save all preferences
  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      // Save each section
      await updateDietaryPreferences(localPreferences.dietary)
      await updateNutritionPreferences(localPreferences.nutrition)
      await updateAppPreferences(localPreferences.app)
      
      setHasChanges(false)
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Save Error',
        description: 'Failed to save preferences. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container maxW="6xl" py={8}>
        <VStack spacing={8}>
          <Spinner size="xl" />
          <Text>Loading your settings...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>Failed to load settings: {error}</AlertDescription>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Settings & Preferences</Heading>
          <Text color="gray.500">Customize your Nutrivize experience</Text>
        </Box>

        {/* Save Button */}
        {hasChanges && (
          <Card bg="blue.50" borderColor="blue.200">
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">You have unsaved changes</Text>
                  <Text fontSize="sm" color="gray.600">
                    Save your preferences to apply them across the app
                  </Text>
                </VStack>
                <Button
                  colorScheme="blue"
                  onClick={handleSavePreferences}
                  isLoading={saving}
                  loadingText="Saving..."
                  leftIcon={<FiCheck />}
                >
                  Save Changes
                </Button>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Settings Tabs */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <Icon as={FiUser} mr={2} />
              Dietary Preferences
            </Tab>
            <Tab>
              <Icon as={FiTarget} mr={2} />
              Nutrition Goals
            </Tab>
            <Tab>
              <Icon as={FiSmartphone} mr={2} />
              App Settings
            </Tab>
            <Tab>
              <Icon as={FiSettings} mr={2} />
              Account
            </Tab>
          </TabList>

          <TabPanels>
            {/* Dietary Preferences Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader>
                    <Heading size="md">Dietary Restrictions</Heading>
                  </CardHeader>
                  <CardBody>
                    <CheckboxGroup
                      value={localPreferences.dietary?.dietary_restrictions || []}
                      onChange={(values) => handlePreferenceChange('dietary', 'dietary_restrictions', values)}
                    >
                      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                        {['vegetarian', 'vegan', 'pescatarian', 'gluten-free', 'dairy-free', 'nut-free', 'soy-free', 'low-carb', 'keto', 'paleo', 'mediterranean'].map((restriction) => (
                          <Checkbox key={restriction} value={restriction}>
                            {restriction.charAt(0).toUpperCase() + restriction.slice(1)}
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  </CardBody>
                </MotionCard>

                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <CardHeader>
                    <Heading size="md">Allergens</Heading>
                  </CardHeader>
                  <CardBody>
                    <CheckboxGroup
                      value={localPreferences.dietary?.allergens || []}
                      onChange={(values) => handlePreferenceChange('dietary', 'allergens', values)}
                    >
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        {['nuts', 'shellfish', 'dairy', 'eggs', 'soy', 'gluten', 'fish', 'sesame'].map((allergen) => (
                          <Checkbox key={allergen} value={allergen}>
                            {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  </CardBody>
                </MotionCard>

                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <CardHeader>
                    <Heading size="md">Cooking Preferences</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Cooking Skill Level</FormLabel>
                        <Select
                          value={localPreferences.dietary?.cooking_skill_level || 'intermediate'}
                          onChange={(e) => handlePreferenceChange('dietary', 'cooking_skill_level', e.target.value)}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Budget Preference</FormLabel>
                        <Select
                          value={localPreferences.dietary?.budget_preference || 'moderate'}
                          onChange={(e) => handlePreferenceChange('dietary', 'budget_preference', e.target.value)}
                        >
                          <option value="low">Budget-Conscious</option>
                          <option value="moderate">Moderate</option>
                          <option value="high">Premium</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Maximum Prep Time (minutes)</FormLabel>
                        <NumberInput
                          value={localPreferences.dietary?.max_prep_time || 30}
                          min={5}
                          max={120}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('dietary', 'max_prep_time', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Strictness Level</FormLabel>
                        <Select
                          value={localPreferences.dietary?.strictness_level || 'moderate'}
                          onChange={(e) => handlePreferenceChange('dietary', 'strictness_level', e.target.value)}
                        >
                          <option value="flexible">Flexible</option>
                          <option value="moderate">Moderate</option>
                          <option value="strict">Strict</option>
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </MotionCard>
              </VStack>
            </TabPanel>

            {/* Nutrition Goals Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader>
                    <Heading size="md">Daily Nutrition Targets</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Calorie Goal</FormLabel>
                        <NumberInput
                          value={localPreferences.nutrition?.calorie_goal || 2000}
                          min={1000}
                          max={4000}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('nutrition', 'calorie_goal', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Protein Goal (g)</FormLabel>
                        <NumberInput
                          value={localPreferences.nutrition?.protein_goal || 150}
                          min={50}
                          max={300}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('nutrition', 'protein_goal', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Carbohydrate Goal (g)</FormLabel>
                        <NumberInput
                          value={localPreferences.nutrition?.carb_goal || 250}
                          min={50}
                          max={500}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('nutrition', 'carb_goal', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Fat Goal (g)</FormLabel>
                        <NumberInput
                          value={localPreferences.nutrition?.fat_goal || 65}
                          min={20}
                          max={150}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('nutrition', 'fat_goal', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Fiber Goal (g)</FormLabel>
                        <NumberInput
                          value={localPreferences.nutrition?.fiber_goal || 25}
                          min={10}
                          max={50}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('nutrition', 'fiber_goal', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Sodium Limit (mg)</FormLabel>
                        <NumberInput
                          value={localPreferences.nutrition?.sodium_limit || 2300}
                          min={1000}
                          max={4000}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('nutrition', 'sodium_limit', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </MotionCard>

                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <CardHeader>
                    <Heading size="md">Meal Frequency</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Meals per Day</FormLabel>
                        <NumberInput
                          value={localPreferences.nutrition?.meal_frequency || 3}
                          min={2}
                          max={6}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('nutrition', 'meal_frequency', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Snacks per Day</FormLabel>
                        <NumberInput
                          value={localPreferences.nutrition?.snack_frequency || 1}
                          min={0}
                          max={3}
                          onChange={(_, valueAsNumber) => handlePreferenceChange('nutrition', 'snack_frequency', valueAsNumber)}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </MotionCard>
              </VStack>
            </TabPanel>

            {/* App Settings Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* Display & Localization */}
                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader>
                    <Heading size="md">Display & Localization</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Units</FormLabel>
                        <Select
                          value={localPreferences.app?.units || 'imperial'}
                          onChange={(e) => handlePreferenceChange('app', 'units', e.target.value)}
                        >
                          <option value="metric">Metric (kg, cm)</option>
                          <option value="imperial">Imperial (lbs, ft)</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Language</FormLabel>
                        <Select
                          value={localPreferences.app?.language || 'en'}
                          onChange={(e) => handlePreferenceChange('app', 'language', e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Theme</FormLabel>
                        <Select
                          value={localPreferences.app?.theme || 'light'}
                          onChange={(e) => handlePreferenceChange('app', 'theme', e.target.value)}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Default Meal Type</FormLabel>
                        <Select
                          value={localPreferences.app?.default_meal_type || 'lunch'}
                          onChange={(e) => handlePreferenceChange('app', 'default_meal_type', e.target.value)}
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </Select>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </MotionCard>

                {/* Notifications */}
                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <CardHeader>
                    <Heading size="md">Notifications</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">Notifications Enabled</Text>
                            <Text fontSize="sm" color="gray.500">
                              Receive push notifications from Nutrivize
                            </Text>
                          </VStack>
                          <Switch
                            isChecked={localPreferences.app?.notifications_enabled ?? true}
                            onChange={(e) => handlePreferenceChange('app', 'notifications_enabled', e.target.checked)}
                            size="lg"
                          />
                        </HStack>
                      </FormControl>

                      <FormControl>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">Meal Reminders</Text>
                            <Text fontSize="sm" color="gray.500">
                              Get reminders to log your meals
                            </Text>
                          </VStack>
                          <Switch
                            isChecked={localPreferences.app?.meal_reminders ?? true}
                            onChange={(e) => handlePreferenceChange('app', 'meal_reminders', e.target.checked)}
                            size="lg"
                          />
                        </HStack>
                      </FormControl>

                      <FormControl>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">Weekly Insights</Text>
                            <Text fontSize="sm" color="gray.500">
                              Receive weekly nutrition insights and reports
                            </Text>
                          </VStack>
                          <Switch
                            isChecked={localPreferences.app?.weekly_insights ?? true}
                            onChange={(e) => handlePreferenceChange('app', 'weekly_insights', e.target.checked)}
                            size="lg"
                          />
                        </HStack>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </MotionCard>

                {/* Dashboard Widgets */}
                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <CardHeader>
                    <Heading size="md">Dashboard Widgets</Heading>
                    <Text fontSize="sm" color="gray.500">
                      Choose which widgets to display on your dashboard
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {[
                        { id: 'nutrition_summary', label: 'Nutrition Summary', description: 'Daily calories and macros overview' },
                        { id: 'water_intake', label: 'Water Intake', description: 'Daily hydration tracking' },
                        { id: 'ai_coach', label: 'AI Coach', description: 'Personalized AI coaching and insights' },
                        { id: 'goals_progress', label: 'Goals Progress', description: 'Track your nutrition and health goals' },
                        { id: 'health_score', label: 'Health Score', description: 'Overall health and wellness metrics' },
                        { id: 'recent_meals', label: 'Recent Meals', description: 'Your most recently logged meals' },
                      ].map((widget) => (
                        <FormControl key={widget.id}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">{widget.label}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {widget.description}
                              </Text>
                            </VStack>
                            <Switch
                              isChecked={(localPreferences.app?.dashboard_widgets || []).includes(widget.id)}
                              onChange={(e) => handleDashboardWidgetToggle(widget.id, e.target.checked)}
                              size="lg"
                            />
                          </HStack>
                        </FormControl>
                      ))}
                    </VStack>
                  </CardBody>
                </MotionCard>
              </VStack>
            </TabPanel>

            {/* Account Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <MotionCard
                  bg={cardBg}
                  borderColor={borderColor}
                  borderWidth={1}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader>
                    <Heading size="md">Account Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info">
                        <AlertIcon />
                        <AlertDescription>
                          Account management features will be available soon.
                        </AlertDescription>
                      </Alert>
                    </VStack>
                  </CardBody>
                </MotionCard>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  )
}

export default SettingsEnhanced
