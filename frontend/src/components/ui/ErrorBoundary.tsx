import React from 'react'
import { Box, Heading, Text, Button, VStack, Alert, AlertIcon } from '@chakra-ui/react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={8} maxW="md" mx="auto" mt={16}>
          <VStack spacing={6}>
            <Alert status="error">
              <AlertIcon />
              <Box>
                <Heading size="md" mb={2}>Something went wrong</Heading>
                <Text fontSize="sm">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Text>
              </Box>
            </Alert>
            
            <Button
              colorScheme="green"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
            
            <Text fontSize="sm" color="gray.600" textAlign="center">
              If this error persists, please contact support.
            </Text>
          </VStack>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
