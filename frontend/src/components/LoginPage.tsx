import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Card,
  CardHeader,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔑 Starting login process...')
      await login(email, password)
      console.log('✅ Login function completed successfully')
      // Note: Navigation will happen automatically via AuthContext when user state changes
    } catch (error: any) {
      console.error('❌ Login failed:', error)
      setError(error.message || 'Login failed')
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(email, password, name)
    } catch (error: any) {
      setError(error.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      px={4}
    >
      <Card maxW="md" w="full">
        <CardHeader>
          <VStack spacing={2}>
            <Heading size="lg" color="green.600">
              Nutrivize V2
            </Heading>
            <Text color="gray.600">Your Smart Nutrition Tracker</Text>
          </VStack>
        </CardHeader>
        
        <CardBody>
          <Tabs isFitted variant="enclosed">
            <TabList mb={4}>
              <Tab>Login</Tab>
              <Tab>Register</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel p={0}>
                <form onSubmit={handleLogin}>
                  <VStack spacing={4}>
                    {error && (
                      <Alert status="error">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}
                    
                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Password</FormLabel>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                    </FormControl>
                    
                    <Button
                      type="submit"
                      colorScheme="green"
                      size="lg"
                      w="full"
                      isLoading={loading}
                    >
                      Sign In
                    </Button>
                  </VStack>
                </form>
              </TabPanel>
              
              <TabPanel p={0}>
                <form onSubmit={handleRegister}>
                  <VStack spacing={4}>
                    {error && (
                      <Alert status="error">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}
                    
                    <FormControl isRequired>
                      <FormLabel>Name</FormLabel>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Password</FormLabel>
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                      />
                    </FormControl>
                    
                    <Button
                      type="submit"
                      colorScheme="green"
                      size="lg"
                      w="full"
                      isLoading={loading}
                    >
                      Sign Up
                    </Button>
                  </VStack>
                </form>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    </Box>
  )
}
