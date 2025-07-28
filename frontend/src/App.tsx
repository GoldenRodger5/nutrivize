import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ChakraProvider, Box, Spinner, Center, extendTheme } from '@chakra-ui/react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ColorModeProvider } from './contexts/ColorModeContext'
import { AppStateProvider } from './contexts/AppStateContext'
import { FoodIndexProvider } from './contexts/FoodIndexContext'
import { UserDataProvider } from './contexts/UserDataContext'
import { OnboardingProvider } from './contexts/OnboardingContext'
import LoginPage from './components/auth/LoginPage'
import OnboardingGuard from './components/auth/OnboardingGuard'
import MainLayout from './components/ui/MainLayout'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'linear-gradient(135deg, #f6f9fc 0%, #e9f4f9 100%)',
      },
    }),
  },
})

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="green.500" />
      </Center>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Main App Layout
function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="green.500" />
      </Center>
    )
  }

  return (
    <Box minH="100vh">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <OnboardingProvider>
                <OnboardingGuard>
                  <ColorModeProvider>
                    <AppStateProvider>
                      <FoodIndexProvider>
                        <MainLayout />
                      </FoodIndexProvider>
                    </AppStateProvider>
                  </ColorModeProvider>
                </OnboardingGuard>
              </OnboardingProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Box>
  )
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ErrorBoundary>
        <AuthProvider>
          <UserDataProvider>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <AppLayout />
            </Router>
          </UserDataProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ChakraProvider>
  )
}

export default App
