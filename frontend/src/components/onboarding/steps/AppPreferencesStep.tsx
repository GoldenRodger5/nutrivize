import { useState } from 'react'
import {
  VStack,
  Button,
  HStack,
  Text,
  Select,
  Switch,
  Alert,
  AlertIcon,
  Box,
  Icon
} from '@chakra-ui/react'
import { FaBell, FaUtensils, FaChartLine, FaPalette, FaRuler } from 'react-icons/fa'
import OnboardingCard from '../OnboardingCard'
import { useOnboarding } from '../../../contexts/OnboardingContext'

interface AppPreferencesStepProps {
  onNext: () => void
  onBack: () => void
}

export default function AppPreferencesStep({ onNext, onBack }: AppPreferencesStepProps) {
  const { onboardingData, updateStepData, saveStepData } = useOnboarding()
  
  const [formData, setFormData] = useState({
    units: onboardingData.appPreferences?.units || 'metric',
    notifications_enabled: onboardingData.appPreferences?.notifications_enabled ?? true,
    meal_reminders: onboardingData.appPreferences?.meal_reminders ?? true,
    weekly_insights: onboardingData.appPreferences?.weekly_insights ?? true,
    theme: onboardingData.appPreferences?.theme || 'light'
  })
  
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    try {
      setLoading(true)
      
      const appPrefsData = {
        units: formData.units,
        notifications_enabled: formData.notifications_enabled,
        meal_reminders: formData.meal_reminders,
        weekly_insights: formData.weekly_insights,
        theme: formData.theme
      }

      // Update local context
      updateStepData({ appPreferences: appPrefsData })
      
      // Save to backend
      await saveStepData(5, { app_preferences: appPrefsData })
      
      onNext()
    } catch (error) {
      console.error('Failed to save app preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const preferenceOptions = [
    {
      icon: FaRuler,
      title: 'Units',
      description: 'Measurement system for weight, height, and nutrition',
      component: (
        <Select
          value={formData.units}
          onChange={(e) => setFormData(prev => ({ ...prev, units: e.target.value }))}
        >
          <option value="metric">Metric (kg, cm, grams)</option>
          <option value="imperial">Imperial (lbs, ft/in, ounces)</option>
        </Select>
      )
    },
    {
      icon: FaPalette,
      title: 'Theme',
      description: 'App appearance preference',
      component: (
        <Select
          value={formData.theme}
          onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
        >
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </Select>
      )
    },
    {
      icon: FaBell,
      title: 'Push Notifications',
      description: 'General app notifications',
      component: (
        <Switch
          isChecked={formData.notifications_enabled}
          onChange={(e) => setFormData(prev => ({ ...prev, notifications_enabled: e.target.checked }))}
          colorScheme="green"
          size="lg"
        />
      )
    },
    {
      icon: FaUtensils,
      title: 'Meal Reminders',
      description: 'Reminders to log your meals',
      component: (
        <Switch
          isChecked={formData.meal_reminders}
          onChange={(e) => setFormData(prev => ({ ...prev, meal_reminders: e.target.checked }))}
          colorScheme="green"
          size="lg"
        />
      )
    },
    {
      icon: FaChartLine,
      title: 'Weekly Insights',
      description: 'AI-generated weekly progress reports',
      component: (
        <Switch
          isChecked={formData.weekly_insights}
          onChange={(e) => setFormData(prev => ({ ...prev, weekly_insights: e.target.checked }))}
          colorScheme="green"
          size="lg"
        />
      )
    }
  ]

  return (
    <OnboardingCard title="App Preferences" icon="⚙️">
      <VStack spacing={6} align="stretch">
        <Text textAlign="center" color="gray.600">
          Customize your Nutrivize experience. You can change these settings anytime in your profile.
        </Text>

        <VStack spacing={4} align="stretch">
          {preferenceOptions.map((option, index) => (
            <Box
              key={index}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              bg="gray.50"
              _dark={{ bg: "gray.700" }}
            >
              <HStack justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon as={option.icon} color="green.500" />
                  <Box>
                    <Text fontWeight="bold">{option.title}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {option.description}
                    </Text>
                  </Box>
                </HStack>
                <Box minW="200px">
                  {option.component}
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>

        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontSize="sm">
              <strong>Privacy Note:</strong> Notifications are stored locally on your device. 
              We never share your personal data with third parties.
            </Text>
          </Box>
        </Alert>

        <HStack spacing={4} justify="space-between">
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
          >
            Back
          </Button>
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={loading}
            size="lg"
            px={8}
          >
            Continue
          </Button>
        </HStack>
      </VStack>
    </OnboardingCard>
  )
}
