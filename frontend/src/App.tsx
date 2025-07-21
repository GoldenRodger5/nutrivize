import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ChakraProvider, Box, Spinner, Center } from '@chakra-ui/react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppStateProvider } from './contexts/AppStateContext'
import { FoodIndexProvider } from './contexts/FoodIndexContext'
import LoginPage from './components/auth/LoginPage'
import MainLayout from './components/ui/MainLayout'
import ErrorBoundary from './components/ui/ErrorBoundary'

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
    <Box minH="100vh" bg="linear-gradient(135deg, #f6f9fc 0%, #e9f4f9 100%)">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppStateProvider>
                <FoodIndexProvider>
                  <MainLayout />
                </FoodIndexProvider>
              </AppStateProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Box>
  )
}

function App() {
  return (
    <ChakraProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <AppLayout />
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </ChakraProvider>
  )
}

export default App
