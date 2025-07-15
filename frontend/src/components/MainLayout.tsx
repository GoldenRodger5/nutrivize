import { Routes, Route } from 'react-router-dom'
import { Box, useBreakpointValue, useDisclosure } from '@chakra-ui/react'
import NavBar from './NavBar'
import MobileBottomNav from './MobileBottomNav'
import PWAStatus from './PWAStatus'
import PWAInstall from './PWAInstall'
import Dashboard from '../pages/Dashboard'
import AIDashboardNew from '../pages/AIDashboardNew'
import FoodLog from '../pages/FoodLogEnhanced'
import FoodIndex from '../pages/FoodIndex'
import MealSuggestions from '../pages/MealSuggestions'
import MealPlans from '../pages/MealPlans'
import AIChat from '../pages/AIChat'
import Goals from '../pages/Goals'
import Settings from '../pages/Settings'
import Analytics from '../pages/Analytics'
import RestaurantAI from '../pages/RestaurantAI'
import ManualMealPlanner from '../pages/ManualMealPlanner'
import { useState, useEffect } from 'react'

export default function MainLayout() {
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [showPWAInstall, setShowPWAInstall] = useState(false)

  useEffect(() => {
    // Check if we should show PWA install prompt
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    
    // Show install prompt after a delay if not already installed
    if (!isStandalone) {
      const timer = setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen')
        if (!hasSeenPrompt) {
          setShowPWAInstall(true)
          localStorage.setItem('pwa-install-prompt-seen', 'true')
        }
      }, 5000) // Show after 5 seconds
      
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #f6f9fc 0%, #e9f4f9 100%)">
      <PWAStatus />
      <NavBar isDrawerOpen={isOpen} onDrawerOpen={onOpen} onDrawerClose={onClose} />
      <Box pb={isMobile ? "80px" : 0}>
        <Routes>
          <Route path="/" element={<AIDashboardNew />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-dashboard" element={<AIDashboardNew />} />
          <Route path="/food-log" element={<FoodLog />} />
          <Route path="/food-index" element={<FoodIndex />} />
          <Route path="/meal-suggestions" element={<MealSuggestions />} />
          <Route path="/meal-planning" element={<MealSuggestions />} />
          <Route path="/meal-plans" element={<MealPlans />} />
          <Route path="/manual-meal-planning" element={<ManualMealPlanner />} />
          <Route path="/restaurant-ai" element={<RestaurantAI />} />
          <Route path="/ai" element={<AIChat />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Box>
      <MobileBottomNav onMenuOpen={onOpen} />
      
      <PWAInstall 
        isOpen={showPWAInstall} 
        onClose={() => setShowPWAInstall(false)} 
      />
    </Box>
  )
}
