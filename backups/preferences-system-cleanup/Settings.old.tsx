import { useState, useEffect, useRef } from 'react'
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
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Checkbox,
  CheckboxGroup,
  Divider,
  Badge,
  useBreakpointValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Wrap,
  WrapItem,
  Textarea,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react'
import { EditIcon } from '@chakra-ui/icons'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { useColorModeContext } from '../contexts/ColorModeContext'
import { saveTimezonePreference } from '../utils/timezone'
import { useFoodIndex } from '../contexts/FoodIndexContext'
import { useUserPreferences } from '../hooks/useUserPreferences'

export default function Settings() {
  const { user } = useAuth()
  const { colorMode, setColorMode } = useColorModeContext()
  const { triggerRefresh } = useFoodIndex()
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Use our comprehensive preferences hook
  const {
    preferences,
    loading: preferencesLoading,
    error: preferencesError,
    updateDietaryPreferences,
    updateNutritionPreferences,
    updateAppPreferences,
    addDislikedFood,
    removeDislikedFood,
    resetPreferences,
    refreshPreferences
  } = useUserPreferences()

  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local state for form editing
  const [editingDietary, setEditingDietary] = useState(false)
  const [editingNutrition, setEditingNutrition] = useState(false)
  const [editingApp, setEditingApp] = useState(false)

  const [localDietaryPrefs, setLocalDietaryPrefs] = useState({
    dietary_restrictions: [] as string[],
    allergens: [] as string[],
    disliked_foods: [] as string[],
    preferred_cuisines: [] as string[],
    cooking_skill_level: 'intermediate',
    max_prep_time: 45,
    budget_preference: 'moderate',
    strictness_level: 'moderate'
  })

  const [localNutritionPrefs, setLocalNutritionPrefs] = useState({
    calorie_goal: 2000,
    protein_goal: 150,
    carb_goal: 250,
    fat_goal: 65,
    fiber_goal: 30,
    meal_frequency: 3,
    snack_frequency: 1
  })

  const [localAppPrefs, setLocalAppPrefs] = useState({
    units: 'metric',
    language: 'en',
    theme: 'light',
    notifications_enabled: true,
    meal_reminders: true,
    weekly_insights: true,
    default_meal_type: 'lunch',
    dashboard_widgets: [] as string[]
  })

  const [userProfile, setUserProfile] = useState({
    name: '',
    about_me: '',
    profile_photo: '',
  })

  const [sessionHistory, setSessionHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      if (preferences.dietary) {
        setLocalDietaryPrefs(prev => ({ ...prev, ...preferences.dietary }))
      }
      if (preferences.nutrition) {
        setLocalNutritionPrefs(prev => ({ ...prev, ...preferences.nutrition }))
      }
      if (preferences.app) {
        setLocalAppPrefs(prev => ({ ...prev, ...preferences.app }))
      }
    }
  }, [preferences])

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const profileResponse = await api.get('/auth/profile')
      if (profileResponse.data) {
        setUserProfile(prev => ({ 
          ...prev, 
          name: profileResponse.data.name || '',
          about_me: profileResponse.data.about_me || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const saveDietaryPreferences = async () => {
    setSaving(true)
    const success = await updateDietaryPreferences(localDietaryPrefs)
    if (success) {
      setEditingDietary(false)
      triggerRefresh() // Trigger refresh in Food Index to update compatibility immediately
    }
    setSaving(false)
  }

  const saveNutritionPreferences = async () => {
    setSaving(true)
    const success = await updateNutritionPreferences(localNutritionPrefs)
    if (success) {
      setEditingNutrition(false)
    }
    setSaving(false)
  }

  const saveAppPreferences = async () => {
    setSaving(true)
    const success = await updateAppPreferences(localAppPrefs)
    if (success) {
      setEditingApp(false)
      // Update color mode if theme changed
      if (localAppPrefs.theme !== colorMode) {
        setColorMode(localAppPrefs.theme as 'light' | 'dark')
      }
    }
    setSaving(false)
  }

  const exportToCSV = async () => {
    setExporting(true)
    try {
      const response = await api.get('/preferences/export', {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `nutrivize-data-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Export Successful',
        description: 'Your data has been downloaded as CSV.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: 'Export Error',
        description: 'Failed to export data. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setExporting(false)
  }

  const exportToPDF = async () => {
    setExporting(true)
    try {
      // For now, we'll export the same data but with different filename
      // In future, we can add a separate PDF endpoint
      const response = await api.get('/preferences/export', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `nutrivize-preferences-${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: 'Export Successful',
        description: 'Your preferences have been downloaded.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: 'Export Error',
        description: 'Failed to export data. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setExporting(false)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setUploadingPhoto(true)
    try {
      // Convert to base64 for simple storage
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        
        try {
          await api.put('/users/profile', {
            ...userProfile,
            profile_photo: base64
          })
          
          setUserProfile(prev => ({ ...prev, profile_photo: base64 }))
          
          toast({
            title: 'Photo Updated',
            description: 'Your profile photo has been updated.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        } catch (error) {
          console.error('Error uploading photo:', error)
          toast({
            title: 'Upload Error',
            description: 'Failed to upload photo. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          })
        }
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing photo:', error)
      toast({
        title: 'Processing Error',
        description: 'Failed to process photo. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setUploadingPhoto(false)
    }
  }

  const saveNutritionPreferences = async () => {
    setSaving(true)
    try {
      await api.put('/preferences/nutrition', nutritionPrefs)
      // Save timezone preference locally for immediate use
      saveTimezonePreference(nutritionPrefs.timezone)
      toast({
        title: 'Preferences Saved',
        description: 'Your nutrition preferences have been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error saving nutrition preferences:', error)
      toast({
        title: 'Save Error',
        description: 'Failed to save nutrition preferences. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setSaving(false)
  }

  const saveUserProfile = async () => {
    setSaving(true)
    try {
      await api.put('/auth/profile', userProfile)
      toast({
        title: 'Profile Saved',
        description: 'Your profile information has been updated.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error saving user profile:', error)
      toast({
        title: 'Save Error',
        description: 'Failed to save profile. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setSaving(false)
  }

  const fetchSessionHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await api.get('/ai/chat/history')
      if (response.data) {
        setSessionHistory(response.data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching session history:', error)
      toast({
        title: 'Fetch Error',
        description: 'Failed to load session history.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setLoadingHistory(false)
  }

  const dietaryRestrictionOptions = [
    'vegetarian',
    'vegan',
    'keto',
    'paleo',
    'gluten-free',
    'dairy-free',
    'low-carb',
    'low-fat',
    'mediterranean',
  ]

  const allergenOptions = [
    'nuts',
    'shellfish',
    'fish',
    'eggs',
    'milk',
    'soy',
    'wheat',
    'sesame',
  ]

  const cuisineOptions = [
    'mediterranean',
    'asian',
    'mexican',
    'italian',
    'indian',
    'american',
    'french',
    'thai',
    'japanese',
    'middle-eastern',
  ]

  if (loading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Loading preferences...</Text>
      </Container>
    )
  }

  return (
    <Container maxW={isMobile ? "100%" : "container.lg"} py={isMobile ? 4 : 8} px={isMobile ? 3 : 8}>
      <VStack spacing={isMobile ? 4 : 8} align="stretch">
        {/* Header */}
        <Box textAlign={isMobile ? "center" : "left"}>
          <Heading size={isMobile ? "md" : "lg"} mb={2}>
            Settings ⚙️
          </Heading>
          <Text color="gray.600" fontSize={isMobile ? "sm" : "md"}>
            Customize your nutrition tracking experience
          </Text>
        </Box>

        {/* User Info */}
        <Card size={isMobile ? "sm" : "md"}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="sm">Account Information</Heading>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between" flexDirection={isMobile ? "column" : "row"} align={isMobile ? "start" : "center"}>
                  <Text fontWeight="medium" fontSize={isMobile ? "sm" : "md"}>Email:</Text>
                  <Text color="gray.600" fontSize={isMobile ? "sm" : "md"}>{user?.email}</Text>
                </HStack>
                <HStack justify="space-between" flexDirection={isMobile ? "column" : "row"} align={isMobile ? "start" : "center"}>
                  <Text fontWeight="medium" fontSize={isMobile ? "sm" : "md"}>Account Type:</Text>
                  <Badge colorScheme="green" fontSize={isMobile ? "xs" : "sm"}>Premium</Badge>
                </HStack>
                
                <Divider />
                
                {/* Profile Photo Section */}
                <VStack spacing={4}>
                  <Heading size="sm">Profile Photo</Heading>
                  <HStack spacing={4} align="center">
                    <Avatar 
                      size="xl" 
                      src={userProfile.profile_photo} 
                      name={userProfile.name}
                    />
                    <VStack spacing={2}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<EditIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={uploadingPhoto}
                        loadingText="Uploading..."
                      >
                        Change Photo
                      </Button>
                      <Text fontSize="xs" color="gray.500" textAlign="center">
                        Max 5MB, JPG/PNG
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
                
                <Divider />
                
                {/* User Profile Fields */}
                <FormControl>
                  <FormLabel fontSize={isMobile ? "sm" : "md"} fontWeight="medium">Display Name</FormLabel>
                  <Input
                    value={userProfile.name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your name"
                    size={isMobile ? "sm" : "md"}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize={isMobile ? "sm" : "md"} fontWeight="medium">About Me</FormLabel>
                  <Textarea
                    value={userProfile.about_me}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, about_me: e.target.value }))}
                    placeholder="Tell the AI about yourself, your goals, preferences, or any other relevant information for personalized recommendations"
                    resize="vertical"
                    minH={isMobile ? "80px" : "100px"}
                    size={isMobile ? "sm" : "md"}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    This information helps the AI provide more personalized nutrition advice
                  </Text>
                </FormControl>
                
                <Button 
                  colorScheme="green" 
                  onClick={saveUserProfile} 
                  isLoading={saving}
                  size={isMobile ? "sm" : "md"}
                >
                  Save Profile
                </Button>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Settings Tabs - Mobile uses Accordion, Desktop uses Tabs */}
        {isMobile ? (
          <Accordion defaultIndex={[0]} allowMultiple>
            {/* Dietary Preferences */}
            <AccordionItem>
              <AccordionButton py={4}>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="semibold">🥗 Dietary Preferences</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={4} align="stretch">
                  {/* Dietary Restrictions */}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">Dietary Restrictions</FormLabel>
                    <CheckboxGroup
                      value={dietaryPrefs.dietary_restrictions}
                      onChange={(values) => setDietaryPrefs(prev => ({ ...prev, dietary_restrictions: values as string[] }))}
                    >
                      <Wrap spacing={2}>
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
                    <FormLabel fontSize="sm" fontWeight="medium">Allergens to Avoid</FormLabel>
                    <CheckboxGroup
                      value={dietaryPrefs.allergens}
                      onChange={(values) => setDietaryPrefs(prev => ({ ...prev, allergens: values as string[] }))}
                    >
                      <Wrap spacing={2}>
                        {allergenOptions.map(option => (
                          <WrapItem key={option}>
                            <Checkbox value={option} size="sm" colorScheme="red">
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </Checkbox>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </CheckboxGroup>
                  </FormControl>

                  {/* Additional Settings */}
                  <SimpleGrid columns={1} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="sm">Cooking Skill Level</FormLabel>
                      <Select
                        value={dietaryPrefs.cooking_skill_level}
                        onChange={(e) => setDietaryPrefs(prev => ({ ...prev, cooking_skill_level: e.target.value }))}
                        size="sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Max Prep Time (minutes)</FormLabel>
                      <Select
                        value={dietaryPrefs.max_prep_time}
                        onChange={(e) => setDietaryPrefs(prev => ({ ...prev, max_prep_time: parseInt(e.target.value) }))}
                        size="sm"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <Button 
                    colorScheme="green" 
                    onClick={saveDietaryPreferences} 
                    isLoading={saving}
                    size="sm"
                    w="full"
                  >
                    Save Dietary Preferences
                  </Button>
                </VStack>
              </AccordionPanel>
            </AccordionItem>

            {/* App Preferences */}
            <AccordionItem>
              <AccordionButton py={4}>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="semibold">⚙️ App Preferences</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={1} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="sm">Units</FormLabel>
                      <Select
                        value={nutritionPrefs.units}
                        onChange={(e) => setNutritionPrefs(prev => ({ ...prev, units: e.target.value }))}
                        size="sm"
                      >
                        <option value="metric">Metric (kg, cm)</option>
                        <option value="imperial">Imperial (lbs, ft)</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Theme</FormLabel>
                      <Select
                        value={colorMode}
                        onChange={(e) => setColorMode(e.target.value as 'light' | 'dark')}
                        size="sm"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Timezone</FormLabel>
                      <Select
                        value={nutritionPrefs.timezone}
                        onChange={(e) => setNutritionPrefs(prev => ({ ...prev, timezone: e.target.value }))}
                        size="sm"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <VStack spacing={3} align="stretch">
                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel htmlFor="notifications" mb="0" fontSize="sm">
                        Push Notifications
                      </FormLabel>
                      <Switch
                        id="notifications"
                        isChecked={nutritionPrefs.notifications_enabled}
                        onChange={(e) => setNutritionPrefs(prev => ({ ...prev, notifications_enabled: e.target.checked }))}
                        colorScheme="green"
                        size="sm"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                      <FormLabel htmlFor="reports" mb="0" fontSize="sm">
                        Weekly Reports
                      </FormLabel>
                      <Switch
                        id="reports"
                        isChecked={nutritionPrefs.weekly_reports}
                        onChange={(e) => setNutritionPrefs(prev => ({ ...prev, weekly_reports: e.target.checked }))}
                        colorScheme="green"
                        size="sm"
                      />
                    </FormControl>
                  </VStack>

                  <Button 
                    colorScheme="blue" 
                    onClick={saveNutritionPreferences} 
                    isLoading={saving}
                    size="sm"
                    w="full"
                  >
                    Save App Preferences
                  </Button>
                </VStack>
              </AccordionPanel>
            </AccordionItem>

            {/* Session History */}
            <AccordionItem>
              <AccordionButton py={4}>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="semibold">💬 Session History</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      View your AI chat sessions
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchSessionHistory}
                      isLoading={loadingHistory}
                    >
                      Load History
                    </Button>
                  </HStack>
                  
                  {sessionHistory.length > 0 ? (
                    <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto">
                      {sessionHistory.slice(0, 10).map((session: any, index: number) => (
                        <Card key={index} size="sm" variant="outline">
                          <CardBody p={3}>
                            <VStack spacing={1} align="stretch">
                              <HStack justify="space-between">
                                <Text fontSize="xs" fontWeight="medium">
                                  {new Date(session.created_at).toLocaleDateString()}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {session.message_count} messages
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                {session.preview || 'No preview available'}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                      No session history available
                    </Text>
                  )}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        ) : (
          // Desktop version with Tabs
          <Tabs variant="enclosed" colorScheme="green">
            <TabList>
              <Tab>🥗 Dietary Preferences</Tab>
              <Tab>⚙️ App Preferences</Tab>
              <Tab>💬 Session History</Tab>
              <Tab>🍎 Custom Foods</Tab>
              <Tab>📊 Data & Privacy</Tab>
            </TabList>

            <TabPanels>
              {/* Dietary Preferences Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Dietary Restrictions</Heading>
                        <CheckboxGroup
                          value={dietaryPrefs.dietary_restrictions}
                          onChange={(values) =>
                            setDietaryPrefs({
                              ...dietaryPrefs,
                              dietary_restrictions: values as string[],
                            })
                          }
                        >
                          <Wrap spacing={2}>
                            {dietaryRestrictionOptions.map((option) => (
                              <WrapItem key={option}>
                                <Checkbox value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </CheckboxGroup>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Allergies & Intolerances</Heading>
                        <CheckboxGroup
                          value={dietaryPrefs.allergens}
                          onChange={(values) =>
                            setDietaryPrefs({
                              ...dietaryPrefs,
                              allergens: values as string[],
                            })
                          }
                        >
                          <Wrap spacing={2}>
                            {allergenOptions.map((option) => (
                              <WrapItem key={option}>
                                <Checkbox value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </CheckboxGroup>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Cuisine Preferences</Heading>
                        <CheckboxGroup
                          value={dietaryPrefs.preferred_cuisines}
                          onChange={(values) =>
                            setDietaryPrefs({
                              ...dietaryPrefs,
                              preferred_cuisines: values as string[],
                            })
                          }
                        >
                          <Wrap spacing={2}>
                            {cuisineOptions.map((option) => (
                              <WrapItem key={option}>
                                <Checkbox value={option}>
                                  {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                                </Checkbox>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </CheckboxGroup>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Cooking Preferences</Heading>
                        <HStack spacing={4} w="full">
                          <FormControl>
                            <FormLabel>Cooking Skill Level</FormLabel>
                            <Select
                              value={dietaryPrefs.cooking_skill_level}
                              onChange={(e) =>
                                setDietaryPrefs({
                                  ...dietaryPrefs,
                                  cooking_skill_level: e.target.value,
                                })
                              }
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Max Prep Time (minutes)</FormLabel>
                            <Select
                              value={dietaryPrefs.max_prep_time.toString()}
                              onChange={(e) =>
                                setDietaryPrefs({
                                  ...dietaryPrefs,
                                  max_prep_time: parseInt(e.target.value),
                                })
                              }
                            >
                              <option value="15">15 minutes</option>
                              <option value="30">30 minutes</option>
                              <option value="45">45 minutes</option>
                              <option value="60">1 hour</option>
                              <option value="90">1.5 hours</option>
                              <option value="120">2 hours</option>
                            </Select>
                          </FormControl>
                        </HStack>
                        <FormControl>
                          <FormLabel>Budget Preference</FormLabel>
                          <Select
                            value={dietaryPrefs.budget_preference}
                            onChange={(e) =>
                              setDietaryPrefs({
                                ...dietaryPrefs,
                                budget_preference: e.target.value,
                              })
                            }
                          >
                            <option value="budget">Budget-friendly</option>
                            <option value="moderate">Moderate</option>
                            <option value="premium">Premium</option>
                          </Select>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card border="2px solid" borderColor="red.200" bg="red.50">
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Heading size="md" color="red.700">🚫 Foods to Avoid</Heading>
                            <Text fontSize="sm" color="red.600">
                              Foods you dislike will be excluded from all meal plans and suggestions
                            </Text>
                          </VStack>
                          <Badge colorScheme="red" variant="subtle">
                            {dietaryPrefs.disliked_foods.length} foods avoided
                          </Badge>
                        </HStack>
                        
                        {dietaryPrefs.disliked_foods.length > 0 && (
                          <Box>
                            <Text fontSize="sm" fontWeight="medium" mb={2}>Currently avoiding:</Text>
                            <HStack spacing={2} wrap="wrap">
                              {dietaryPrefs.disliked_foods.map((food, index) => (
                                <Badge
                                  key={index}
                                  colorScheme="red"
                                  variant="solid"
                                  cursor="pointer"
                                  onClick={() => {
                                    const newFoods = dietaryPrefs.disliked_foods.filter((_, i) => i !== index)
                                    setDietaryPrefs({
                                      ...dietaryPrefs,
                                      disliked_foods: newFoods
                                    })
                                  }}
                                  title="Click to remove"
                                >
                                  {food} ✕
                                </Badge>
                              ))}
                            </HStack>
                          </Box>
                        )}
                        
                        <VStack spacing={2} align="stretch">
                          <Text fontSize="sm" fontWeight="medium">Add foods to avoid:</Text>
                          <Input
                            value={dietaryPrefs.disliked_foods.join(', ')}
                            onChange={(e) =>
                              setDietaryPrefs({
                                ...dietaryPrefs,
                                disliked_foods: e.target.value
                                  .split(',')
                                  .map((food) => food.trim())
                                  .filter((food) => food.length > 0),
                              })
                            }
                            placeholder="e.g., mushrooms, olives, cilantro, shrimp"
                            bg="white"
                          />
                          <Text fontSize="xs" color="gray.500">
                            💡 Tip: The AI will automatically add foods you mention disliking in conversations
                          </Text>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Button
                    colorScheme="green"
                    onClick={saveDietaryPreferences}
                    isLoading={saving}
                    loadingText="Saving..."
                    size="lg"
                  >
                    Save Dietary Preferences
                  </Button>
                </VStack>
              </TabPanel>

              {/* App Preferences Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Units & Display</Heading>
                        <HStack spacing={4} w="full">
                          <FormControl>
                            <FormLabel>Measurement Units</FormLabel>
                            <Select
                              value={nutritionPrefs.units}
                              onChange={(e) =>
                                setNutritionPrefs({
                                  ...nutritionPrefs,
                                  units: e.target.value,
                                })
                              }
                            >
                              <option value="metric">Metric (kg, cm, °C)</option>
                              <option value="imperial">Imperial (lb, ft, °F)</option>
                            </Select>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Theme</FormLabel>
                            <Select
                              value={colorMode}
                              onChange={(e) => setColorMode(e.target.value as 'light' | 'dark')}
                            >
                              <option value="light">Light</option>
                              <option value="dark">Dark</option>
                            </Select>
                          </FormControl>
                        </HStack>
                        
                        <FormControl>
                          <FormLabel>Timezone</FormLabel>
                          <Text fontSize="sm" color="gray.600" mb={2}>
                            Used for accurate meal logging and date calculations
                          </Text>
                          <Select
                            value={nutritionPrefs.timezone}
                            onChange={(e) =>
                              setNutritionPrefs({
                                ...nutritionPrefs,
                                timezone: e.target.value,
                              })
                            }
                          >
                            <optgroup label="US & Canada">
                              <option value="America/New_York">Eastern Time (ET)</option>
                              <option value="America/Chicago">Central Time (CT)</option>
                              <option value="America/Denver">Mountain Time (MT)</option>
                              <option value="America/Los_Angeles">Pacific Time (PT)</option>
                              <option value="America/Anchorage">Alaska Time (AKT)</option>
                              <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                              <option value="America/Toronto">Toronto (ET)</option>
                              <option value="America/Vancouver">Vancouver (PT)</option>
                            </optgroup>
                            <optgroup label="Europe">
                              <option value="Europe/London">London (GMT/BST)</option>
                              <option value="Europe/Paris">Paris (CET/CEST)</option>
                              <option value="Europe/Berlin">Berlin (CET/CEST)</option>
                              <option value="Europe/Madrid">Madrid (CET/CEST)</option>
                              <option value="Europe/Rome">Rome (CET/CEST)</option>
                              <option value="Europe/Amsterdam">Amsterdam (CET/CEST)</option>
                              <option value="Europe/Stockholm">Stockholm (CET/CEST)</option>
                              <option value="Europe/Moscow">Moscow (MSK)</option>
                            </optgroup>
                            <optgroup label="Asia">
                              <option value="Asia/Tokyo">Tokyo (JST)</option>
                              <option value="Asia/Shanghai">Shanghai (CST)</option>
                              <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                              <option value="Asia/Singapore">Singapore (SGT)</option>
                              <option value="Asia/Seoul">Seoul (KST)</option>
                              <option value="Asia/Mumbai">Mumbai (IST)</option>
                              <option value="Asia/Dubai">Dubai (GST)</option>
                            </optgroup>
                            <optgroup label="Australia & Oceania">
                              <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                              <option value="Australia/Melbourne">Melbourne (AEST/AEDT)</option>
                              <option value="Australia/Perth">Perth (AWST)</option>
                              <option value="Pacific/Auckland">Auckland (NZST/NZDT)</option>
                            </optgroup>
                            <optgroup label="Other">
                              <option value="UTC">UTC (Coordinated Universal Time)</option>
                              <option value="America/Sao_Paulo">São Paulo (BRT/BRST)</option>
                              <option value="Africa/Cairo">Cairo (EET/EEST)</option>
                              <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                            </optgroup>
                          </Select>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Notifications</Heading>
                        <HStack justify="space-between">
                          <Box>
                            <Text fontWeight="medium">Enable Notifications</Text>
                            <Text fontSize="sm" color="gray.600">
                              Get reminders about logging meals and progress updates
                            </Text>
                          </Box>
                          <Switch
                            isChecked={nutritionPrefs.notifications_enabled}
                            onChange={(e) =>
                              setNutritionPrefs({
                                ...nutritionPrefs,
                                notifications_enabled: e.target.checked,
                              })
                            }
                          />
                        </HStack>
                        <Divider />
                        <HStack justify="space-between">
                          <Box>
                            <Text fontWeight="medium">Weekly Reports</Text>
                            <Text fontSize="sm" color="gray.600">
                              Receive weekly nutrition and progress summaries
                            </Text>
                          </Box>
                          <Switch
                            isChecked={nutritionPrefs.weekly_reports}
                            onChange={(e) =>
                              setNutritionPrefs({
                                ...nutritionPrefs,
                                weekly_reports: e.target.checked,
                              })
                            }
                          />
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Button
                    colorScheme="green"
                    onClick={saveNutritionPreferences}
                    isLoading={saving}
                    loadingText="Saving..."
                    size="lg"
                  >
                    Save App Settings
                  </Button>
                </VStack>
              </TabPanel>

              {/* Session History Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <HStack justify="space-between">
                          <Box>
                            <Heading size="sm">AI Chat Sessions</Heading>
                            <Text fontSize="sm" color="gray.600">
                              View your conversation history with the AI assistant
                            </Text>
                          </Box>
                          <Button
                            variant="outline"
                            onClick={fetchSessionHistory}
                            isLoading={loadingHistory}
                            loadingText="Loading..."
                          >
                            Refresh History
                          </Button>
                        </HStack>
                        
                        {sessionHistory.length > 0 ? (
                          <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                            {sessionHistory.map((session: any, index: number) => (
                              <Card key={index} variant="outline" size="sm">
                                <CardBody>
                                  <HStack justify="space-between" mb={2}>
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" fontSize="sm">
                                        Session {index + 1}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {new Date(session.created_at).toLocaleDateString('en-US', {
                                          weekday: 'short',
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </Text>
                                    </VStack>
                                    <Badge colorScheme="blue" fontSize="xs">
                                      {session.message_count} messages
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600" noOfLines={3}>
                                    {session.preview || 'No preview available'}
                                  </Text>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        ) : (
                          <Text textAlign="center" color="gray.500" py={8}>
                            No chat sessions found. Start a conversation with the AI to see your history here.
                          </Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Custom Foods Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Custom Foods</Heading>
                        <Text fontSize="sm" color="gray.600">
                          Add your frequently eaten foods that aren't in our database.
                          This feature is coming soon!
                        </Text>
                        <Badge colorScheme="blue" alignSelf="start">
                          Coming Soon
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Export Data</Heading>
                        <Text fontSize="sm" color="gray.600">
                          Download your nutrition data and food logs.
                        </Text>
                        <HStack>
                          <Button 
                            variant="outline" 
                            onClick={exportToCSV}
                            isLoading={exporting}
                            loadingText="Exporting..."
                          >
                            Export to CSV
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={exportToPDF}
                            isLoading={exporting}
                            loadingText="Exporting..."
                          >
                            Export Preferences
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Data & Privacy Tab */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="sm">Data & Privacy</Heading>
                        <Text fontSize="sm" color="gray.600">
                          Manage your data sharing and privacy settings.
                        </Text>
                        <Divider />
                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm">Share data with partners</Text>
                          <Switch
                            isChecked={true}
                            onChange={() => {}}
                            colorScheme="green"
                            size="sm"
                          />
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm">Allow AI to suggest foods</Text>
                          <Switch
                            isChecked={true}
                            onChange={() => {}}
                            colorScheme="green"
                            size="sm"
                          />
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text fontSize="sm">Receive personalized ads</Text>
                          <Switch
                            isChecked={false}
                            onChange={() => {}}
                            colorScheme="green"
                            size="sm"
                          />
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Button
                    colorScheme="red"
                    onClick={() => {}}
                    size="lg"
                    w="full"
                  >
                    Delete Account
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </VStack>
    </Container>
  )
}
