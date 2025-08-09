import { Routes, Route } from 'react-router-dom'
import { Box, useBreakpointValue, useDisclosure } from '@chakra-ui/react'
import NavBar from './NavBar'
import MobileBottomNav from './MobileBottomNav'
import MobileHeader from './MobileHeader'
import PWAStatus from './PWAStatus'
import PWAInstall from './PWAInstall'
import FloatingActionButton from './FloatingActionButton'
import PersistentAIChat from '../ai/PersistentAIChat'
import Dashboard from '../../pages/Dashboard'
import AIDashboard from '../../pages/AIDashboardNew'
import FoodLog from '../../pages/FoodLogEnhanced'
import FoodIndex from '../../pages/FoodIndex'
import MealSuggestions from '../../pages/MealSuggestions'
import MealPlans from '../../pages/MealPlans'
import AIChat from '../../pages/AIChat'
import Goals from '../../pages/Goals'
import Settings from '../../pages/Settings'
import SettingsEnhanced from '../../pages/SettingsEnhanced'
import VisualsComponent from '../analytics/VisualsComponent'
import Analytics from '../../pages/Analytics'
import RestaurantAI from '../../pages/RestaurantAI'
import RestaurantMenuAnalysis from '../../pages/RestaurantMenuAnalysis'
import HealthInsights from '../../pages/HealthInsights'
import NutritionCoaching from '../../pages/NutritionCoaching'
import ManualMealPlanner from '../../pages/ManualMealPlanner'
import MealPlanningHub from '../../pages/MealPlanningHub'
import FavoritesPage from '../../pages/Favorites'
import NutritionScannerPage from '../../pages/NutritionScannerPage'
import FoodStatsPage from '../../pages/FoodStatsPage'
import OnboardingPage from '../../pages/OnboardingPage'
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
      
      {/* Mobile Header */}
      <MobileHeader 
        showNotifications={true}
        showSearch={false}
        showMenu={true}
        onMenuOpen={onOpen}
      />
      
      {/* Desktop Navigation */}
      <NavBar isDrawerOpen={isOpen} onDrawerOpen={onOpen} onDrawerClose={onClose} />
      
      <Box pb={isMobile ? "80px" : 0} pt={isMobile ? "60px" : 0}>
        <Routes>
          <Route path="/" element={<AIDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-dashboard" element={<AIDashboard />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/food-log" element={<FoodLog />} />
          <Route path="/food-index" element={<FoodIndex />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/food-stats" element={<FoodStatsPage />} />
          <Route path="/nutrition-scanner" element={<NutritionScannerPage />} />
          <Route path="/meal-suggestions" element={<MealSuggestions />} />
          <Route path="/meal-planning" element={<MealPlanningHub />} />
          <Route path="/meal-plans" element={<MealPlans />} />
          <Route path="/manual-meal-planning" element={<ManualMealPlanner />} />
          <Route path="/restaurant-ai" element={<RestaurantAI />} />
          <Route path="/restaurant-menu-analysis" element={<RestaurantMenuAnalysis />} />
          <Route path="/health-insights" element={<HealthInsights />} />
          <Route path="/nutrition-coaching" element={<NutritionCoaching />} />
          <Route path="/ai" element={<AIChat />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<SettingsEnhanced />} />
          <Route path="/settings-legacy" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/visuals" element={<VisualsComponent />} />
        </Routes>
      </Box>
      <MobileBottomNav onMenuOpen={onOpen} />
      
      {/* Floating Action Button for Mobile Quick Actions */}
      <FloatingActionButton />
      
      {/* Persistent AI Chat - Available on all pages */}
      <PersistentAIChat />
      
      <PWAInstall 
        isOpen={showPWAInstall} 
        onClose={() => setShowPWAInstall(false)} 
      />
    </Box>
  )
}
