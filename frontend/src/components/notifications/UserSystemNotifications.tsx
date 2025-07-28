import { useEffect, useState } from 'react'
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
  VStack,
  useColorModeValue,
  Box,
  IconButton,
  Collapse,
} from '@chakra-ui/react'
import { FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

interface SystemNotification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  description: string
  actionText?: string
  actionPath?: string
  dismissible: boolean
  priority: number
}

interface UserSystemNotificationsProps {
  onNotificationCount?: (count: number) => void
}

export default function UserSystemNotifications({ onNotificationCount }: UserSystemNotificationsProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    const checkSystemNotifications = async () => {
      try {
        setLoading(true)
        const systemNotifications: SystemNotification[] = []

        // Check onboarding status
        try {
          const onboardingResponse = await api.get('/preferences/onboarding-status')
          const status = onboardingResponse.data

          if (!status.onboarding_completed) {
            systemNotifications.push({
              id: 'onboarding-incomplete',
              type: 'info',
              title: 'Complete Your Setup',
              description: `Your profile is ${Math.round(status.profile_completeness_score)}% complete. Finish setup to unlock all features.`,
              actionText: 'Continue Setup',
              actionPath: '/onboarding',
              dismissible: true,
              priority: 1
            })
          }
        } catch (error) {
          // If no onboarding status, suggest starting
          systemNotifications.push({
            id: 'onboarding-new',
            type: 'info',
            title: 'Welcome to Nutrivize! 🌱',
            description: 'Get started with our 5-minute setup to personalize your nutrition journey.',
            actionText: 'Start Setup',
            actionPath: '/onboarding',
            dismissible: true,
            priority: 1
          })
        }

        // Check for missing goals
        try {
          const goalsResponse = await api.get('/goals/user-goals')
          const goals = goalsResponse.data
          
          if (!goals || goals.length === 0) {
            systemNotifications.push({
              id: 'no-goals',
              type: 'warning',
              title: 'Set Your Goals',
              description: 'Define your nutrition goals to get personalized recommendations.',
              actionText: 'Set Goals',
              actionPath: '/goals',
              dismissible: true,
              priority: 2
            })
          }
        } catch (error) {
          // Goals endpoint might not be available
        }

        // Check for recent activity
        try {
          const todayData = await api.get('/analytics/daily-summary')
          const today = todayData.data

          if (today && today.meals && today.meals.length === 0) {
            const now = new Date()
            const hour = now.getHours()
            
            if (hour >= 12 && hour < 20) { // Afternoon/evening reminder
              systemNotifications.push({
                id: 'log-food-reminder',
                type: 'info',
                title: 'Log Your Meals',
                description: "Haven't logged any meals today? Track your nutrition to stay on top of your goals.",
                actionText: 'Log Food',
                actionPath: '/food-log',
                dismissible: true,
                priority: 3
              })
            }
          }
        } catch (error) {
          // Analytics might not be available
        }

        // Sort by priority and filter dismissed
        const activeNotifications = systemNotifications
          .sort((a, b) => a.priority - b.priority)
          .filter(n => !dismissedIds.includes(n.id))

        setNotifications(activeNotifications)
        
        if (onNotificationCount) {
          onNotificationCount(activeNotifications.length)
        }
        
      } catch (error) {
        console.error('Failed to check system notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSystemNotifications()
  }, [dismissedIds, onNotificationCount])

  const handleAction = (notification: SystemNotification) => {
    if (notification.actionPath) {
      navigate(notification.actionPath)
    }
  }

  const handleDismiss = (notificationId: string) => {
    setDismissedIds(prev => [...prev, notificationId])
  }

  if (loading || notifications.length === 0) {
    return null
  }

  return (
    <VStack spacing={3} align="stretch">
      {notifications.map((notification) => (
        <Collapse key={notification.id} in={!dismissedIds.includes(notification.id)}>
          <Alert 
            status={notification.type} 
            bg={bg} 
            borderColor={borderColor} 
            borderWidth={1} 
            borderRadius="lg"
            boxShadow="sm"
          >
            <AlertIcon />
            <Box flex="1">
              <HStack justify="space-between" align="start" w="full">
                <VStack align="start" spacing={1} flex={1}>
                  <AlertTitle fontSize="sm" fontWeight="semibold">
                    {notification.title}
                  </AlertTitle>
                  <AlertDescription fontSize="sm">
                    {notification.description}
                  </AlertDescription>
                  {notification.actionText && (
                    <HStack spacing={2} mt={2}>
                      <Button
                        size="xs"
                        colorScheme={notification.type === 'warning' ? 'orange' : 'blue'}
                        onClick={() => handleAction(notification)}
                      >
                        {notification.actionText}
                      </Button>
                      {notification.dismissible && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleDismiss(notification.id)}
                        >
                          Maybe Later
                        </Button>
                      )}
                    </HStack>
                  )}
                </VStack>
                {notification.dismissible && (
                  <IconButton
                    aria-label="Dismiss notification"
                    icon={<FiX />}
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDismiss(notification.id)}
                  />
                )}
              </HStack>
            </Box>
          </Alert>
        </Collapse>
      ))}
    </VStack>
  )
}
