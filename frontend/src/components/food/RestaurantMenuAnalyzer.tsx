import React, { useState, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  Progress,
  Badge,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Icon,
  IconButton,
  useToast,
  useColorModeValue,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select
} from '@chakra-ui/react'
import { 
  AddIcon, 
  SearchIcon, 
  AttachmentIcon, 
  ViewIcon, 
  EditIcon,
  WarningIcon
} from '@chakra-ui/icons'
import { MdRestaurant } from 'react-icons/md'
import api from '../../utils/api'
import { NutritionInfo } from '../../types'

interface AnalyzedMenuItem {
  id: string
  name: string
  description: string
  estimated_nutrition: NutritionInfo
  ingredients: string[]
  allergens: string[]
  dietary_flags: string[]
  price?: number
  category: string
  confidence_score: number
  alternatives?: string[]
}

interface RestaurantInfo {
  name: string
  cuisine_type: string
  location?: string
  website?: string
}

interface MenuAnalysisResult {
  restaurant: RestaurantInfo
  menu_items: AnalyzedMenuItem[]
  analysis_timestamp: string
  total_items_analyzed: number
  confidence_average: number
}

const RestaurantMenuAnalyzer: React.FC = () => {
  const [analysisMode, setAnalysisMode] = useState<'text' | 'image' | 'url'>('text')
  const [menuInput, setMenuInput] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [cuisineType, setCuisineType] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<MenuAnalysisResult | null>(null)
  const [selectedItem, setSelectedItem] = useState<AnalyzedMenuItem | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUsingCamera, setIsUsingCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const toast = useToast()
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure()
  
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const confidenceColor = useColorModeValue('blue.500', 'blue.300')

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    
    // Check file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf'
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isValidType) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported file type. Please upload images or PDF files.`,
          status: 'error',
          duration: 3000,
          isClosable: true
        })
        return false
      }
      
      if (!isValidSize) {
        toast({
          title: 'File too large',
          description: `${file.name} is larger than 10MB. Please upload smaller files.`,
          status: 'error',
          duration: 3000,
          isClosable: true
        })
        return false
      }
      
      return true
    })
    
    if (validFiles.length === 0) return
    
    setUploadedFiles(validFiles)
    setUploadedImage(validFiles[0]) // Keep backwards compatibility
    
    // Generate preview for first image file
    const firstImageFile = validFiles.find(file => file.type.startsWith('image/'))
    if (firstImageFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(firstImageFile)
    } else {
      setPreviewUrl(null)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      setCameraStream(stream)
      setIsUsingCamera(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access to take photos of menus.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setIsUsingCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0)
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
        setUploadedImage(file)
        setUploadedFiles([file])
        
        // Generate preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)
        
        // Stop camera after capture
        stopCamera()
        
        toast({
          title: 'Photo captured',
          description: 'Menu photo has been captured successfully.',
          status: 'success',
          duration: 2000,
          isClosable: true
        })
      }
    }, 'image/jpeg', 0.9)
  }

  const analyzeMenu = async () => {
    if (!menuInput.trim() && !uploadedImage && uploadedFiles.length === 0 && analysisMode !== 'url') {
      toast({
        title: 'Input required',
        description: 'Please provide menu text, image, or URL to analyze',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setIsAnalyzing(true)
    try {
      let response
      
      if (analysisMode === 'text') {
        // Use existing text analysis endpoint
        const formData = new FormData()
        formData.append('analysis_mode', analysisMode)
        formData.append('restaurant_name', restaurantName)
        formData.append('cuisine_type', cuisineType)
        formData.append('menu_text', menuInput)
        
        response = await api.post('/ai/analyze-restaurant-menu', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else if (analysisMode === 'image' && (uploadedFiles.length > 0 || uploadedImage)) {
        // Use new file upload endpoint
        const formData = new FormData()
        
        if (uploadedFiles.length > 0) {
          uploadedFiles.forEach(file => {
            formData.append('files', file)
          })
        } else if (uploadedImage) {
          formData.append('files', uploadedImage)
        }
        
        if (restaurantName) formData.append('restaurant_name', restaurantName)
        if (cuisineType) formData.append('menu_name', cuisineType)
        
        response = await api.post('/restaurant-ai/analyze-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else if (analysisMode === 'url') {
        // Use existing URL analysis endpoint
        const formData = new FormData()
        formData.append('analysis_mode', analysisMode)
        formData.append('restaurant_name', restaurantName)
        formData.append('cuisine_type', cuisineType)
        formData.append('menu_url', menuInput)
        
        response = await api.post('/ai/analyze-restaurant-menu', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      if (response) {
        setAnalysisResult(response.data)
        toast({
          title: 'Menu analyzed successfully',
          description: `Found ${response.data.total_items_analyzed || response.data.menu_items?.length || 0} menu items`,
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      }
    } catch (error: any) {
      console.error('Menu analysis error:', error)
      toast({
        title: 'Analysis failed',
        description: error.response?.data?.detail || 'Failed to analyze menu',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const saveMenuItem = async (item: AnalyzedMenuItem, portion: number = 1) => {
    try {
      const adjustedNutrition = {
        calories: Math.round(item.estimated_nutrition.calories * portion),
        protein: Math.round(item.estimated_nutrition.protein * portion),
        carbs: Math.round(item.estimated_nutrition.carbs * portion),
        fat: Math.round(item.estimated_nutrition.fat * portion),
        fiber: item.estimated_nutrition.fiber ? Math.round(item.estimated_nutrition.fiber * portion) : undefined,
        sugar: item.estimated_nutrition.sugar ? Math.round(item.estimated_nutrition.sugar * portion) : undefined,
        sodium: item.estimated_nutrition.sodium ? Math.round(item.estimated_nutrition.sodium * portion) : undefined
      }

      await api.post('/food-logs', {
        date: new Date().toISOString().split('T')[0],
        meal_type: 'lunch', // Default to lunch, user can change later
        food_name: item.name,
        quantity: portion,
        unit: 'serving',
        nutrition: adjustedNutrition,
        source: 'restaurant_analysis',
        restaurant_name: analysisResult?.restaurant.name,
        notes: `Analyzed from ${analysisResult?.restaurant.name} menu`
      })

      toast({
        title: 'Meal logged successfully',
        description: `${item.name} has been added to your food log`,
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (error: any) {
      console.error('Save meal error:', error)
      toast({
        title: 'Failed to save meal',
        description: error.response?.data?.detail || 'Could not save meal to log',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'green'
    if (score >= 0.6) return 'yellow'
    return 'red'
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High Confidence'
    if (score >= 0.6) return 'Medium Confidence'
    return 'Low Confidence'
  }

  const renderMenuItem = (item: AnalyzedMenuItem) => (
    <Card key={item.id} variant="outline" borderColor={borderColor}>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="lg">{item.name}</Text>
            <Badge colorScheme={getConfidenceColor(item.confidence_score)}>
              {getConfidenceLabel(item.confidence_score)}
            </Badge>
          </VStack>
          <HStack>
            <IconButton
              icon={<ViewIcon />}
              aria-label="View details"
              size="sm"
              onClick={() => {
                setSelectedItem(item)
                onDetailOpen()
              }}
            />
            <IconButton
              icon={<EditIcon />}
              aria-label="Edit nutrition"
              size="sm"
              onClick={() => {
                // Future: Open edit modal
                toast({
                  title: 'Edit Feature',
                  description: 'Edit nutrition feature coming soon',
                  status: 'info',
                  duration: 2000,
                  isClosable: true
                })
              }}
            />
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              size="sm"
              onClick={() => saveMenuItem(item)}
            >
              Log Meal
            </Button>
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <VStack align="start" spacing={3}>
          <Text fontSize="sm" color="gray.600" noOfLines={2}>
            {item.description}
          </Text>
          
          <SimpleGrid columns={4} spacing={4} w="full">
            <Stat size="sm">
              <StatLabel>Calories</StatLabel>
              <StatNumber fontSize="md">{item.estimated_nutrition.calories}</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Protein</StatLabel>
              <StatNumber fontSize="md">{item.estimated_nutrition.protein}g</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Carbs</StatLabel>
              <StatNumber fontSize="md">{item.estimated_nutrition.carbs}g</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Fat</StatLabel>
              <StatNumber fontSize="md">{item.estimated_nutrition.fat}g</StatNumber>
            </Stat>
          </SimpleGrid>

          {item.allergens.length > 0 && (
            <HStack>
              <Icon as={WarningIcon} color="orange.500" />
              <Text fontSize="sm" color="orange.600">
                Contains: {item.allergens.join(', ')}
              </Text>
            </HStack>
          )}

          {item.dietary_flags.length > 0 && (
            <HStack flexWrap="wrap">
              {item.dietary_flags.map(flag => (
                <Badge key={flag} colorScheme="green" variant="subtle">
                  {flag}
                </Badge>
              ))}
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  )

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <HStack mb={4}>
            <Icon as={MdRestaurant} color={confidenceColor} boxSize={6} />
            <Text fontSize="2xl" fontWeight="bold">
              Restaurant Menu Analyzer
            </Text>
          </HStack>
          <Text color="gray.600">
            Analyze restaurant menus to get nutritional information and make informed dining choices
          </Text>
        </Box>

        {/* Input Section */}
        <Card variant="outline" borderColor={borderColor}>
          <CardHeader>
            <Text fontSize="lg" fontWeight="semibold">Menu Input</Text>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Restaurant Name</FormLabel>
                  <Input
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g., Olive Garden"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Cuisine Type</FormLabel>
                  <Select
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value)}
                    placeholder="Select cuisine type"
                  >
                    <option value="american">American</option>
                    <option value="italian">Italian</option>
                    <option value="mexican">Mexican</option>
                    <option value="asian">Asian</option>
                    <option value="indian">Indian</option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="fast_food">Fast Food</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <Tabs 
                index={analysisMode === 'text' ? 0 : analysisMode === 'image' ? 1 : 2}
                onChange={(index) => {
                  const modes = ['text', 'image', 'url'] as const
                  setAnalysisMode(modes[index])
                }}
              >
                <TabList>
                  <Tab>Text Input</Tab>
                  <Tab>Image Upload</Tab>
                  <Tab>Website URL</Tab>
                </TabList>
                
                <TabPanels>
                  <TabPanel>
                    <FormControl>
                      <FormLabel>Menu Text</FormLabel>
                      <Textarea
                        value={menuInput}
                        onChange={(e) => setMenuInput(e.target.value)}
                        placeholder="Paste menu text here..."
                        rows={8}
                        resize="vertical"
                      />
                      <FormHelperText>
                        Copy and paste menu text from restaurant websites or apps
                      </FormHelperText>
                    </FormControl>
                  </TabPanel>
                  
                  <TabPanel>
                    <FormControl>
                      <FormLabel>Menu Files</FormLabel>
                      <VStack spacing={4}>
                        <Input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          onChange={handleImageUpload}
                          ref={fileInputRef}
                          display="none"
                        />
                        
                        <HStack spacing={2} w="full">
                          <Button
                            leftIcon={<AttachmentIcon />}
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            flex={1}
                          >
                            {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) selected` : 'Upload Files'}
                          </Button>
                          
                          <Button
                            onClick={startCamera}
                            variant="outline"
                            isDisabled={isUsingCamera}
                          >
                            📷 Camera
                          </Button>
                        </HStack>
                        
                        {/* Camera view */}
                        {isUsingCamera && (
                          <Box w="full" position="relative">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              style={{
                                width: '100%',
                                maxWidth: '400px',
                                height: 'auto',
                                borderRadius: '8px'
                              }}
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                            <HStack justify="center" mt={2}>
                              <Button colorScheme="blue" onClick={capturePhoto}>
                                Capture Photo
                              </Button>
                              <Button variant="outline" onClick={stopCamera}>
                                Cancel
                              </Button>
                            </HStack>
                          </Box>
                        )}
                        
                        {/* File previews */}
                        {uploadedFiles.length > 0 && (
                          <VStack spacing={2} w="full">
                            {uploadedFiles.map((file, index) => (
                              <HStack key={index} w="full" p={2} borderWidth={1} borderRadius="md">
                                <Text fontSize="sm" flex={1}>
                                  {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
                                </Text>
                                <Badge colorScheme={file.type.startsWith('image/') ? 'blue' : 'red'}>
                                  {file.type.startsWith('image/') ? 'Image' : 'PDF'}
                                </Badge>
                              </HStack>
                            ))}
                          </VStack>
                        )}
                        
                        {previewUrl && (
                          <Image
                            src={previewUrl}
                            alt="Menu preview"
                            maxH="200px"
                            objectFit="contain"
                            borderRadius="md"
                          />
                        )}
                      </VStack>
                      <FormHelperText>
                        Upload menu images (JPG, PNG, WebP) or PDF files (max 10MB each). You can also use the camera to capture menu photos.
                      </FormHelperText>
                    </FormControl>
                  </TabPanel>
                  
                  <TabPanel>
                    <FormControl>
                      <FormLabel>Menu URL</FormLabel>
                      <Input
                        value={menuInput}
                        onChange={(e) => setMenuInput(e.target.value)}
                        placeholder="https://restaurant.com/menu"
                        type="url"
                      />
                      <FormHelperText>
                        Provide a direct link to the restaurant's online menu
                      </FormHelperText>
                    </FormControl>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              <Button
                leftIcon={<SearchIcon />}
                colorScheme="blue"
                onClick={analyzeMenu}
                isLoading={isAnalyzing}
                loadingText="Analyzing..."
                size="lg"
              >
                Analyze Menu
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <Card variant="outline" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4}>
                <HStack w="full" justify="space-between">
                  <Text fontWeight="medium">Analyzing menu...</Text>
                  <Spinner size="sm" />
                </HStack>
                <Progress value={75} colorScheme="blue" w="full" />
                <Text fontSize="sm" color="gray.600">
                  Processing menu items and extracting nutritional information
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <Card variant="outline" borderColor={borderColor}>
            <CardHeader>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="lg" fontWeight="bold">
                    {analysisResult.restaurant.name}
                  </Text>
                  <Badge colorScheme="blue">
                    {analysisResult.restaurant.cuisine_type}
                  </Badge>
                </VStack>
                <VStack align="end" spacing={1}>
                  <Text fontSize="sm" color="gray.600">
                    {analysisResult.total_items_analyzed} items analyzed
                  </Text>
                  <Badge colorScheme={getConfidenceColor(analysisResult.confidence_average)}>
                    {Math.round(analysisResult.confidence_average * 100)}% avg confidence
                  </Badge>
                </VStack>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {analysisResult.menu_items.map(renderMenuItem)}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Item Detail Modal */}
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {selectedItem?.name}
              <Badge ml={2} colorScheme={getConfidenceColor(selectedItem?.confidence_score || 0)}>
                {getConfidenceLabel(selectedItem?.confidence_score || 0)}
              </Badge>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedItem && (
                <VStack spacing={4} align="stretch">
                  <Text>{selectedItem.description}</Text>
                  
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Calories</StatLabel>
                      <StatNumber>{selectedItem.estimated_nutrition.calories}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Protein</StatLabel>
                      <StatNumber>{selectedItem.estimated_nutrition.protein}g</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Carbs</StatLabel>
                      <StatNumber>{selectedItem.estimated_nutrition.carbs}g</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Fat</StatLabel>
                      <StatNumber>{selectedItem.estimated_nutrition.fat}g</StatNumber>
                    </Stat>
                  </SimpleGrid>

                  {selectedItem.ingredients.length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Ingredients:</Text>
                      <Text>{selectedItem.ingredients.join(', ')}</Text>
                    </Box>
                  )}

                  {selectedItem.allergens.length > 0 && (
                    <Alert status="warning">
                      <AlertIcon />
                      <Text>Contains: {selectedItem.allergens.join(', ')}</Text>
                    </Alert>
                  )}

                  {selectedItem.alternatives && selectedItem.alternatives.length > 0 && (
                    <Box>
                      <Text fontWeight="semibold" mb={2}>Healthier Alternatives:</Text>
                      <VStack align="start">
                        {selectedItem.alternatives.map((alt, index) => (
                          <Text key={index}>• {alt}</Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDetailClose}>
                Close
              </Button>
              <Button colorScheme="blue" onClick={() => selectedItem && saveMenuItem(selectedItem)}>
                Log This Meal
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  )
}

export default RestaurantMenuAnalyzer
