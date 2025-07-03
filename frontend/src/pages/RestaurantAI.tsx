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
  useToast,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  SimpleGrid,
  Badge,
  Center,
  Progress,
  Tag,
  Wrap,
  WrapItem,
  Collapse,
  IconButton,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Textarea,
  AspectRatio,
  ModalFooter,
} from '@chakra-ui/react'
import { 
  FiUpload, 
  FiChevronDown, 
  FiChevronUp, 
  FiInfo, 
  FiClock, 
  FiMapPin, 
  FiCamera, 
  FiPlus, 
  FiSave 
} from 'react-icons/fi'
import api from '../utils/api'
import AIResponseFormatter from '../components/AIResponseFormatter'

// Types for restaurant menu analysis
interface MenuAnalysisRequest {
  source_type: 'url' | 'image' | 'pdf'
  source_data: string // URL or base64 encoded data
  restaurant_name?: string
  menu_name?: string
}

interface EstimatedNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sodium?: number
  sugar?: number
  confidence_score: number // 0-100
}

interface MenuRecommendation {
  id: string
  name: string
  description: string
  category: 'appetizer' | 'main_course' | 'side' | 'dessert' | 'beverage' | 'other'
  estimated_nutrition: EstimatedNutrition
  dietary_attributes: {
    dietary_restrictions: string[]
    allergens: string[]
    food_categories: string[]
  }
  price?: string
  recommendations_score: number // 0-100 based on user filters
  reasoning: string // AI explanation for recommendation
  modifications_suggested?: string[]
}

interface MenuAnalysisResult {
  id: string
  restaurant_name: string
  menu_name: string
  source_type: string
  recommendations: MenuRecommendation[]
  total_items_found: number
  analysis_confidence: number
  created_at: string
}

// Visual nutrition interfaces
interface VisualNutritionRequest {
  item_id: string
  image_data: string // base64 encoded image
  menu_analysis_id: string
}

interface VisualNutritionResult {
  item_id: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sodium?: number
  confidence_score: number
  portion_notes: string
  reference_objects: string[]
}

// Food logging interfaces
interface FoodLogData {
  food_name: string
  brand?: string
  amount: number
  unit: string
  meal_type: string
  notes?: string
}

// Filter interface
interface RecommendationFilters {
  meal_types: string[]
  dietary_preferences: string[]
  max_calories?: number
  min_protein?: number
  max_carbs?: number
  max_sodium?: number
  allergen_exclusions: string[]
  price_range?: 'low' | 'medium' | 'high' | 'any'
  include_modifications: boolean
}

export default function RestaurantAI() {
  const [analysisResults, setAnalysisResults] = useState<MenuAnalysisResult[]>([])
  const [filteredResults, setFilteredResults] = useState<MenuAnalysisResult[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<MenuAnalysisResult | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Camera and visual nutrition state
  const [selectedItem, setSelectedItem] = useState<MenuRecommendation | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [visualNutrition, setVisualNutrition] = useState<VisualNutritionResult | null>(null)
  const [isAnalyzingVisual, setIsAnalyzingVisual] = useState(false)
  
  // Food logging state
  const [foodLogData, setFoodLogData] = useState<FoodLogData>({
    food_name: '',
    brand: '',
    amount: 1,
    unit: 'serving',
    meal_type: 'lunch',
    notes: ''
  })
  const [editableNutrition, setEditableNutrition] = useState<EstimatedNutrition | null>(null)
  const [baseNutritionPerServing, setBaseNutritionPerServing] = useState<EstimatedNutrition | null>(null)
  const [isLoggingFood, setIsLoggingFood] = useState(false)
  
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure()
  const { isOpen: isCameraOpen, onOpen: onCameraOpen, onClose: onCameraClose } = useDisclosure()
  const { isOpen: isFoodLogOpen, onOpen: onFoodLogOpen, onClose: onFoodLogClose } = useDisclosure()
  const { onClose: onFilterClose } = useDisclosure()
  const toast = useToast()
  const isMobile = useBreakpointValue({ base: true, lg: false })
  
  // Refs for camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Filter state
  const [filters] = useState<RecommendationFilters>({
    meal_types: [],
    dietary_preferences: [],
    max_calories: undefined,
    max_sodium: undefined,
    allergen_exclusions: [],
    include_modifications: true
  })

  // Form states for menu analysis
  const [menuUrl, setMenuUrl] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [menuFile, setMenuFile] = useState<File | null>(null)
  const [analysisType, setAnalysisType] = useState<'url' | 'image'>('url')

  // Load previous analyses
  useEffect(() => {
    loadAnalyses()
  }, [])

  // Apply filters when they change
  useEffect(() => {
    if (analysisResults.length > 0) {
      applyFilters()
    }
  }, [filters, analysisResults])

  // Update nutrition when amount or base nutrition changes
  useEffect(() => {
    if (baseNutritionPerServing && foodLogData.amount) {
      setEditableNutrition({
        calories: baseNutritionPerServing.calories * foodLogData.amount,
        protein: baseNutritionPerServing.protein * foodLogData.amount,
        carbs: baseNutritionPerServing.carbs * foodLogData.amount,
        fat: baseNutritionPerServing.fat * foodLogData.amount,
        fiber: baseNutritionPerServing.fiber ? baseNutritionPerServing.fiber * foodLogData.amount : undefined,
        sodium: baseNutritionPerServing.sodium ? baseNutritionPerServing.sodium * foodLogData.amount : undefined,
        sugar: baseNutritionPerServing.sugar ? baseNutritionPerServing.sugar * foodLogData.amount : undefined,
        confidence_score: baseNutritionPerServing.confidence_score
      })
    }
  }, [baseNutritionPerServing, foodLogData.amount])

  const loadAnalyses = async () => {
    setIsAnalyzing(true)
    try {
      const response = await api.get('/restaurant-ai/analyses')
      const analyses = response.data || []
      setAnalysisResults(analyses)
      setFilteredResults(analyses) // Initially show all results
    } catch (error) {
      console.error('Error loading analyses:', error)
      toast({
        title: 'Loading Error',
        description: 'Failed to load previous menu analyses.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setIsAnalyzing(false)
  }

  const analyzeMenu = async () => {
    if (!menuUrl.trim() && !menuFile) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a menu URL or upload an image/PDF.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const analysisData: MenuAnalysisRequest = {
        source_type: menuFile ? (menuFile.type.includes('pdf') ? 'pdf' : 'image') : 'url',
        source_data: menuFile ? await fileToBase64(menuFile) : menuUrl,
        restaurant_name: restaurantName,
        menu_name: ''
      }

      const response = await api.post('/restaurant-ai/analyze', analysisData)
      const analysis = response.data

      // Add to analyses list
      const newAnalyses = [analysis, ...analysisResults]
      setAnalysisResults(newAnalyses)
      setFilteredResults(newAnalyses) // Update filtered results too
      
      toast({
        title: 'Menu Analyzed Successfully!',
        description: `Found ${analysis.total_items_found} menu items with ${analysis.analysis_confidence}% confidence.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      
      // Reset form
      setMenuUrl('')
      setRestaurantName('')
      setMenuFile(null)
      setAnalysisType('url')
      
      // Close filters drawer if open
      onFilterClose()
    } catch (error: any) {
      console.error('Error analyzing menu:', error)
      toast({
        title: 'Analysis Failed',
        description: error.response?.data?.detail || 'Failed to analyze menu. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
    setIsAnalyzing(false)
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }

  // Visual nutrition analysis
  const analyzeVisualNutrition = async (item: MenuRecommendation, analysisId: string) => {
    if (!capturedImage) {
      toast({
        title: 'No Image',
        description: 'Please capture a photo first.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsAnalyzingVisual(true)
    try {
      const visualRequest: VisualNutritionRequest = {
        item_id: item.id,
        image_data: capturedImage.split(',')[1], // Remove data URL prefix
        menu_analysis_id: analysisId
      }

      const response = await api.post('/restaurant-ai/visual-nutrition', visualRequest)
      const result: VisualNutritionResult = response.data
      setVisualNutrition(result)
      
      toast({
        title: 'Visual Analysis Complete!',
        description: `Analyzed portion with ${result.confidence_score}% confidence.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error: any) {
      console.error('Error analyzing visual nutrition:', error)
      toast({
        title: 'Analysis Failed',
        description: error.response?.data?.detail || 'Failed to analyze meal image.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setIsAnalyzingVisual(false)
  }

  // Food logging functions
  const openFoodLog = (item: MenuRecommendation, nutrition?: VisualNutritionResult) => {
    setFoodLogData({
      food_name: item.name,
      brand: selectedAnalysis?.restaurant_name || '',
      amount: 1,
      unit: 'serving',
      meal_type: getCurrentMealType(),
      notes: item.description
    })
    
    // Set base nutrition per serving from either visual analysis or menu item
    const baseNutrition = nutrition ? {
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      sodium: nutrition.sodium,
      sugar: undefined,
      confidence_score: nutrition.confidence_score
    } : item.estimated_nutrition
    
    setBaseNutritionPerServing(baseNutrition)
    onFoodLogOpen()
  }

  const getCurrentMealType = () => {
    const hour = new Date().getHours()
    if (hour < 11) return 'breakfast'
    if (hour < 15) return 'lunch'
    if (hour < 18) return 'snack'
    return 'dinner'
  }

  const logFood = async () => {
    setIsLoggingFood(true)
    try {
      if (!editableNutrition) {
        throw new Error('No nutrition data available')
      }

      const logData = {
        food_name: foodLogData.food_name,
        brand: foodLogData.brand,
        amount: foodLogData.amount,
        unit: foodLogData.unit,
        meal_type: foodLogData.meal_type,
        notes: foodLogData.notes,
        nutrition: {
          calories: editableNutrition.calories,
          protein: editableNutrition.protein,
          carbs: editableNutrition.carbs,
          fat: editableNutrition.fat,
          fiber: editableNutrition.fiber,
          sodium: editableNutrition.sodium,
        },
        date: new Date().toISOString().split('T')[0]
      }

      await api.post('/food-logs', logData)
      
      toast({
        title: 'Food Logged!',
        description: `${foodLogData.food_name} has been added to your food log.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onFoodLogClose()
      setCapturedImage(null)
      setVisualNutrition(null)
    } catch (error: any) {
      console.error('Error logging food:', error)
      toast({
        title: 'Logging Failed',
        description: error.response?.data?.detail || 'Failed to log food.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
    setIsLoggingFood(false)
  }

  const applyFilters = () => {
    if (analysisResults.length === 0) {
      setFilteredResults([])
      return
    }

    // Since analysisResults contains MenuAnalysisResult objects with recommendations arrays,
    // we need to filter at the recommendation level, not the analysis level
    let filtered = analysisResults.map(analysis => ({
      ...analysis,
      recommendations: analysis.recommendations.filter(item => {
        // Filter by meal types
        if (filters.meal_types.length > 0 && !filters.meal_types.includes(item.category)) {
          return false
        }

        // Filter by dietary preferences
        if (filters.dietary_preferences.length > 0) {
          const hasMatchingPreference = filters.dietary_preferences.some(pref => 
            item.dietary_attributes.dietary_restrictions.includes(pref)
          )
          if (!hasMatchingPreference) return false
        }

        // Filter by nutritional criteria
        if (filters.max_calories && item.estimated_nutrition.calories > filters.max_calories) {
          return false
        }

        if (filters.min_protein && item.estimated_nutrition.protein < filters.min_protein) {
          return false
        }

        if (filters.max_carbs && item.estimated_nutrition.carbs > filters.max_carbs) {
          return false
        }

        if (filters.max_sodium && item.estimated_nutrition.sodium && item.estimated_nutrition.sodium > filters.max_sodium) {
          return false
        }

        // Filter by allergen exclusions
        if (filters.allergen_exclusions.length > 0) {
          const hasExcludedAllergen = filters.allergen_exclusions.some(allergen => 
            item.dietary_attributes.allergens.includes(allergen)
          )
          if (hasExcludedAllergen) return false
        }

        return true
      }).sort((a, b) => b.recommendations_score - a.recommendations_score)
    })).filter(analysis => analysis.recommendations.length > 0) // Only keep analyses with remaining recommendations

    setFilteredResults(filtered)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPEG, PNG, or PDF file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setMenuFile(file)
  }

  return (
    <Box bg="gray.50" minH="100vh" overflowX="hidden">
      <Container 
        maxW={isMobile ? "100vw" : "container.xl"} 
        py={isMobile ? 2 : 8} 
        px={isMobile ? 3 : 8}
        w="full"
      >
        <VStack spacing={isMobile ? 3 : 6} align="stretch" w="full">
          {/* Mobile Header */}
          {isMobile && (
            <Box bg="white" p={4} borderRadius="lg" shadow="sm" w="full" maxW="100%">
              <VStack spacing={3} w="full">
                <Heading size="md" textAlign="center">
                  🍽️ Restaurant AI
                </Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Analyze restaurant menus and get personalized recommendations
                </Text>
              </VStack>
            </Box>
          )}

          {/* Desktop Header */}
          {!isMobile && (
            <Box>
              <Heading size="xl" mb={2} textAlign="center">
                🍽️ Restaurant AI
              </Heading>
              <Text color="gray.600" textAlign="center" fontSize="lg">
                Smart menu analysis with personalized nutrition recommendations
              </Text>
            </Box>
          )}

          {/* Menu Analysis Input */}
          <Card size={isMobile ? "sm" : "md"} w="full" maxW="100%">
            <CardBody>
              <VStack spacing={4} w="full">
                <Heading size={isMobile ? "sm" : "md"}>Analyze Restaurant Menu</Heading>
                
                {/* Analysis Type Toggle */}
                <HStack 
                  spacing={isMobile ? 2 : 4} 
                  w="full" 
                  justify="center"
                  flexWrap={isMobile ? "wrap" : "nowrap"}
                >
                  <Button
                    size={isMobile ? "sm" : "md"}
                    variant={analysisType === 'url' ? 'solid' : 'outline'}
                    colorScheme="green"
                    onClick={() => setAnalysisType('url')}
                    flex={isMobile ? 1 : 0}
                    minW={isMobile ? "120px" : "auto"}
                  >
                    🔗 Website URL
                  </Button>
                  <Button
                    size={isMobile ? "sm" : "md"}
                    variant={analysisType === 'image' ? 'solid' : 'outline'}
                    colorScheme="green"
                    onClick={() => setAnalysisType('image')}
                    flex={isMobile ? 1 : 0}
                    minW={isMobile ? "120px" : "auto"}
                  >
                    📸 Upload Image
                  </Button>
                </HStack>

                {/* Input Fields */}
                <VStack spacing={3} w="full" maxW="100%">
                  <FormControl w="full">
                    <FormLabel fontSize={isMobile ? "sm" : "md"}>Restaurant Name</FormLabel>
                    <Input
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="e.g., McDonald's, Chipotle, Local Diner"
                      size={isMobile ? "sm" : "md"}
                      w="full"
                    />
                  </FormControl>

                  {analysisType === 'url' ? (
                    <FormControl w="full">
                      <FormLabel fontSize={isMobile ? "sm" : "md"}>Menu URL</FormLabel>
                      <Input
                        value={menuUrl}
                        onChange={(e) => setMenuUrl(e.target.value)}
                        placeholder="https://restaurant.com/menu"
                        size={isMobile ? "sm" : "md"}
                        w="full"
                      />
                    </FormControl>
                  ) : (
                    <FormControl w="full">
                      <FormLabel fontSize={isMobile ? "sm" : "md"}>Menu Image</FormLabel>
                      <Button
                        leftIcon={<FiUpload />}
                        onClick={() => document.getElementById('menu-upload')?.click()}
                        variant="outline"
                        w="full"
                        size={isMobile ? "sm" : "md"}
                      >
                        {menuFile ? menuFile.name : 'Choose Image'}
                      </Button>
                      <input
                        id="menu-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </FormControl>
                  )}
                  
                  {/* Analyze Button */}
                  <Button
                    colorScheme="green"
                    size={isMobile ? "sm" : "md"}
                    w="full"
                    onClick={analyzeMenu}
                    isLoading={isAnalyzing}
                    loadingText="Analyzing Menu..."
                    isDisabled={!menuUrl.trim() && !menuFile}
                  >
                    🔍 Analyze Menu
                  </Button>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Results Display - Clickable Restaurant Cards */}
          {filteredResults.length > 0 && (
            <VStack spacing={isMobile ? 3 : 6} align="stretch" w="full">
              <Heading size={isMobile ? "md" : "lg"} textAlign="center">
                🍽️ Analyzed Restaurants ({filteredResults.length})
              </Heading>
              
              <SimpleGrid columns={isMobile ? 1 : { base: 1, md: 2, lg: 3 }} spacing={isMobile ? 3 : 4}>
                {filteredResults.map((analysis) => (
                  <Card 
                    key={analysis.id} 
                    size={isMobile ? "sm" : "md"} 
                    w="full" 
                    maxW="100%"
                    _hover={{ shadow: 'lg', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    cursor="pointer"
                    onClick={() => {
                      setSelectedAnalysis(analysis)
                      onDetailsOpen()
                    }}
                  >
                    <CardBody>
                      <VStack spacing={3} align="stretch" w="full">
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={1} flex={1}>
                            <Heading size={isMobile ? "sm" : "md"} noOfLines={2}>
                              {analysis.restaurant_name}
                            </Heading>
                            <HStack spacing={2} wrap="wrap">
                              <Badge colorScheme="green" variant="subtle">
                                {analysis.total_items_found} items
                              </Badge>
                              <Badge colorScheme="blue" variant="subtle">
                                {analysis.analysis_confidence}% confidence
                              </Badge>
                            </HStack>
                          </VStack>
                          <IconButton
                            icon={<FiInfo />}
                            size="sm"
                            variant="ghost"
                            aria-label="View details"
                          />
                        </HStack>
                        
                        {/* Quick Preview */}
                        <VStack spacing={2} align="start" w="full">
                          <HStack spacing={2} fontSize="xs" color="gray.600">
                            <FiClock />
                            <Text>{new Date(analysis.created_at).toLocaleDateString()}</Text>
                            <FiMapPin />
                            <Text>{analysis.source_type}</Text>
                          </HStack>
                          
                          {analysis.recommendations.length > 0 && (
                            <Box w="full">
                              <Text fontSize="sm" fontWeight="medium" mb={2}>
                                Top Recommendations:
                              </Text>
                              <VStack spacing={1} align="start" w="full">
                                {analysis.recommendations.slice(0, 3).map((item) => (
                                  <HStack key={item.id} justify="space-between" w="full" fontSize="xs">
                                    <Text color="gray.700" noOfLines={1} flex={1}>
                                      {item.name}
                                    </Text>
                                    <Badge size="sm" colorScheme="green" variant="outline">
                                      {item.recommendations_score}%
                                    </Badge>
                                  </HStack>
                                ))}
                                {analysis.recommendations.length > 3 && (
                                  <Text fontSize="xs" color="gray.500">
                                    +{analysis.recommendations.length - 3} more items
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          )}
                        </VStack>
                        
                        <Button size="sm" colorScheme="green" variant="outline" w="full">
                          View Full Analysis
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </VStack>
          )}
          
          {/* Restaurant Details Modal */}
          <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size={isMobile ? "full" : "6xl"}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>
                <VStack align="start" spacing={2}>
                  <Heading size="lg">{selectedAnalysis?.restaurant_name}</Heading>
                  <HStack wrap="wrap" spacing={2}>
                    <Badge colorScheme="green">{selectedAnalysis?.total_items_found} items found</Badge>
                    <Badge colorScheme="blue">{selectedAnalysis?.analysis_confidence}% confidence</Badge>
                    <Badge colorScheme="purple">{selectedAnalysis?.source_type}</Badge>
                    <Text fontSize="sm" color="gray.500">
                      Analyzed on {selectedAnalysis && new Date(selectedAnalysis.created_at).toLocaleDateString()}
                    </Text>
                  </HStack>
                </VStack>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody pb={6}>
                {selectedAnalysis && selectedAnalysis.recommendations.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>AI Analysis Complete!</AlertTitle>
                        <AlertDescription>
                          Found {selectedAnalysis.recommendations.length} recommended items based on nutritional analysis.
                        </AlertDescription>
                      </Box>
                    </Alert>
                    
                    <VStack spacing={3} align="stretch">
                      {selectedAnalysis.recommendations.map((item, index) => (
                        <Card key={item.id} size="sm" bg="gray.50">
                          <CardBody>
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between" align="start">
                                <VStack align="start" spacing={1} flex={1}>
                                  <HStack spacing={2}>
                                    <Badge colorScheme="blue" variant="solid">#{index + 1}</Badge>
                                    <Heading size="sm">{item.name}</Heading>
                                  </HStack>
                                  <Box fontSize="sm" color="gray.600" noOfLines={2}>
                                    <AIResponseFormatter 
                                      content={item.description}
                                      isMobile={isMobile}
                                      fontSize="sm"
                                    />
                                  </Box>
                                  {item.price && (
                                    <Badge colorScheme="green" variant="outline">
                                      {item.price}
                                    </Badge>
                                  )}
                                </VStack>
                                <VStack spacing={1} align="end">
                                  <Badge 
                                    colorScheme={item.recommendations_score >= 80 ? 'green' : item.recommendations_score >= 60 ? 'yellow' : 'red'} 
                                    variant="solid"
                                  >
                                    {item.recommendations_score}% Match
                                  </Badge>
                                  <Text fontSize="sm" color="gray.500">
                                    {Math.round(item.estimated_nutrition.calories)} cal
                                  </Text>
                                </VStack>
                              </HStack>
                              
                              {/* Nutrition Grid */}
                              <SimpleGrid columns={4} spacing={3} fontSize="sm">
                                <VStack spacing={0}>
                                  <Text fontWeight="bold">{item.estimated_nutrition.protein}g</Text>
                                  <Text color="gray.500" fontSize="xs">Protein</Text>
                                </VStack>
                                <VStack spacing={0}>
                                  <Text fontWeight="bold">{item.estimated_nutrition.carbs}g</Text>
                                  <Text color="gray.500" fontSize="xs">Carbs</Text>
                                </VStack>
                                <VStack spacing={0}>
                                  <Text fontWeight="bold">{item.estimated_nutrition.fat}g</Text>
                                  <Text color="gray.500" fontSize="xs">Fat</Text>
                                </VStack>
                                <VStack spacing={0}>
                                  <Text fontWeight="bold">{item.estimated_nutrition.confidence_score}%</Text>
                                  <Text color="gray.500" fontSize="xs">Accuracy</Text>
                                </VStack>
                              </SimpleGrid>
                              
                              {/* Action Buttons */}
                              <HStack spacing={2} w="full">
                                <Button 
                                  size="sm" 
                                  leftIcon={<FiCamera />}
                                  colorScheme="blue"
                                  variant="outline"
                                  flex={1}
                                  onClick={() => {
                                    setSelectedItem(item)
                                    onCameraOpen()
                                    startCamera()
                                  }}
                                >
                                  Analyze Photo
                                </Button>
                                <Button 
                                  size="sm" 
                                  leftIcon={<FiPlus />}
                                  colorScheme="green"
                                  flex={1}
                                  onClick={() => openFoodLog(item)}
                                >
                                  Log Food
                                </Button>
                              </HStack>
                              
                              {/* Expandable Section */}
                              <Collapse in={expandedCards.has(item.id)}>
                                <VStack spacing={3} align="stretch" pt={3}>
                                  <Divider />
                                  
                                  {/* AI Reasoning */}
                                  <Box>
                                    <Text fontSize="sm" fontWeight="bold" color="blue.600" mb={2}>
                                      🤖 AI Analysis:
                                    </Text>
                                    <Box fontSize="sm" color="gray.700">
                                      <AIResponseFormatter 
                                        content={item.reasoning}
                                        isMobile={isMobile}
                                        fontSize="sm"
                                      />
                                    </Box>
                                  </Box>

                                  {/* Dietary Attributes */}
                                  {item.dietary_attributes.dietary_restrictions.length > 0 && (
                                    <Box>
                                      <Text fontSize="sm" fontWeight="bold" color="green.600" mb={2}>
                                        🌱 Dietary Info:
                                      </Text>
                                      <Wrap spacing={1}>
                                        {item.dietary_attributes.dietary_restrictions.map((restriction) => (
                                          <WrapItem key={restriction}>
                                            <Tag size="sm" colorScheme="green" variant="solid">
                                              {restriction}
                                            </Tag>
                                          </WrapItem>
                                        ))}
                                      </Wrap>
                                    </Box>
                                  )}

                                  {/* Allergen Info */}
                                  {item.dietary_attributes.allergens.length > 0 && (
                                    <Box>
                                      <Text fontSize="sm" fontWeight="bold" color="red.600" mb={2}>
                                        ⚠️ Contains Allergens:
                                      </Text>
                                      <Wrap spacing={1}>
                                        {item.dietary_attributes.allergens.map((allergen) => (
                                          <WrapItem key={allergen}>
                                            <Tag size="sm" colorScheme="red" variant="solid">
                                              {allergen}
                                            </Tag>
                                          </WrapItem>
                                        ))}
                                      </Wrap>
                                    </Box>
                                  )}

                                  {/* Modifications */}
                                  {item.modifications_suggested && item.modifications_suggested.length > 0 && (
                                    <Box>
                                      <Text fontSize="sm" fontWeight="bold" color="orange.600" mb={2}>
                                        💡 Suggested Modifications:
                                      </Text>
                                      <VStack spacing={1} align="start">
                                        {item.modifications_suggested.map((mod, idx) => (
                                          <Text key={idx} fontSize="sm" color="gray.700">
                                            • {mod}
                                          </Text>
                                        ))}
                                      </VStack>
                                    </Box>
                                  )}

                                  {/* Nutrition Confidence */}
                                  <Box>
                                    <HStack justify="space-between" mb={2}>
                                      <Text fontSize="sm" fontWeight="bold" color="purple.600">
                                        📊 Nutrition Confidence:
                                      </Text>
                                      <Text fontSize="sm" fontWeight="bold">
                                        {item.estimated_nutrition.confidence_score}%
                                      </Text>
                                    </HStack>
                                    <Progress 
                                      value={item.estimated_nutrition.confidence_score} 
                                      size="sm" 
                                      colorScheme={item.estimated_nutrition.confidence_score > 70 ? 'green' : 'orange'}
                                      borderRadius="full"
                                    />
                                  </Box>
                                </VStack>
                              </Collapse>
                              
                              {/* Toggle Details Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={expandedCards.has(item.id) ? <FiChevronUp /> : <FiChevronDown />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedCards(prev => {
                                    const newSet = new Set(prev)
                                    if (newSet.has(item.id)) {
                                      newSet.delete(item.id)
                                    } else {
                                      newSet.add(item.id)
                                    }
                                    return newSet
                                  })
                                }}
                                w="full"
                              >
                                {expandedCards.has(item.id) ? 'Show Less' : 'Show More Details'}
                              </Button>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </VStack>
                ) : (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <Text fontSize="lg" color="gray.500">
                        No recommendations found
                      </Text>
                      <Text fontSize="sm" color="gray.400" textAlign="center">
                        This menu analysis didn't yield any recommendations based on current filters.
                      </Text>
                    </VStack>
                  </Center>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
          
          {/* No Results Message */}
          {!isAnalyzing && filteredResults.length === 0 && (
            <Card size={isMobile ? "sm" : "md"} w="full" maxW="100%">
              <CardBody>
                <VStack spacing={3} py={8}>
                  <Text fontSize="lg" color="gray.500">
                    🍽️ No menu analyses yet
                  </Text>
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    Upload a menu image or provide a restaurant menu URL to get started with AI-powered nutrition analysis.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
      
      {/* Camera Modal */}
      <Modal isOpen={isCameraOpen} onClose={() => {
        onCameraClose()
        stopCamera()
        setCapturedImage(null)
      }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            📸 Capture Meal Photo
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {!capturedImage ? (
                <>
                  <AspectRatio ratio={4/3} w="full">
                    <Box>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  </AspectRatio>
                  <Button colorScheme="blue" onClick={capturePhoto} w="full">
                    📸 Capture Photo
                  </Button>
                </>
              ) : (
                <>
                  <Image src={capturedImage} alt="Captured meal" borderRadius="md" />
                  <HStack spacing={2} w="full">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCapturedImage(null)
                        startCamera()
                      }}
                      flex={1}
                    >
                      Retake
                    </Button>
                    <Button 
                      colorScheme="green" 
                      onClick={() => {
                        if (selectedItem && selectedAnalysis) {
                          analyzeVisualNutrition(selectedItem, selectedAnalysis.id)
                        }
                      }}
                      isLoading={isAnalyzingVisual}
                      flex={1}
                    >
                      Analyze Nutrition
                    </Button>
                  </HStack>
                  {visualNutrition && (
                    <Card w="full" bg="green.50">
                      <CardBody>
                        <VStack spacing={2} align="start">
                          <Text fontWeight="bold" color="green.700">
                            🎯 Visual Analysis Complete! ({visualNutrition.confidence_score}% confidence)
                          </Text>
                          <SimpleGrid columns={2} spacing={4} w="full">
                            <VStack spacing={0}>
                              <Text fontWeight="bold">{Math.round(visualNutrition.calories)} cal</Text>
                              <Text fontSize="xs" color="gray.600">Calories</Text>
                            </VStack>
                            <VStack spacing={0}>
                              <Text fontWeight="bold">{Math.round(visualNutrition.protein)}g</Text>
                              <Text fontSize="xs" color="gray.600">Protein</Text>
                            </VStack>
                            <VStack spacing={0}>
                              <Text fontWeight="bold">{Math.round(visualNutrition.carbs)}g</Text>
                              <Text fontSize="xs" color="gray.600">Carbs</Text>
                            </VStack>
                            <VStack spacing={0}>
                              <Text fontWeight="bold">{Math.round(visualNutrition.fat)}g</Text>
                              <Text fontSize="xs" color="gray.600">Fat</Text>
                            </VStack>
                          </SimpleGrid>
                          <Text fontSize="sm" color="gray.700">
                            {visualNutrition.portion_notes}
                          </Text>
                          <Button 
                            colorScheme="green" 
                            size="sm" 
                            w="full"
                            leftIcon={<FiPlus />}
                            onClick={() => {
                              onCameraClose()
                              openFoodLog(selectedItem!, visualNutrition)
                            }}
                          >
                            Log This Food
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Food Logging Modal */}
      <Modal isOpen={isFoodLogOpen} onClose={onFoodLogClose} size="lg" scrollBehavior="outside">
        <ModalOverlay />
        <ModalContent maxH="90vh" display="flex" flexDirection="column">
          <ModalHeader flexShrink={0}>
            📝 Log Food Entry
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} flex="1" overflowY="auto">
            <VStack spacing={4} w="full" align="stretch">
              <FormControl>
                <FormLabel>Food Name</FormLabel>
                <Input
                  value={foodLogData.food_name}
                  onChange={(e) => setFoodLogData(prev => ({ ...prev, food_name: e.target.value }))}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Restaurant/Brand</FormLabel>
                <Input
                  value={foodLogData.brand}
                  onChange={(e) => setFoodLogData(prev => ({ ...prev, brand: e.target.value }))}
                />
              </FormControl>
              
              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Amount</FormLabel>
                  <NumberInput
                    value={foodLogData.amount}
                    onChange={(_, valueNumber) => setFoodLogData(prev => ({ ...prev, amount: valueNumber || 1 }))}
                    min={0.1}
                    step={0.1}
                    precision={2}
                    allowMouseWheel={false}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    value={foodLogData.unit}
                    onChange={(e) => setFoodLogData(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="serving">serving</option>
                    <option value="cup">cup</option>
                    <option value="piece">piece</option>
                    <option value="slice">slice</option>
                    <option value="bowl">bowl</option>
                    <option value="plate">plate</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Meal Type</FormLabel>
                <Select
                  value={foodLogData.meal_type}
                  onChange={(e) => setFoodLogData(prev => ({ ...prev, meal_type: e.target.value }))}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Notes (Optional)</FormLabel>
                <Textarea
                  value={foodLogData.notes}
                  onChange={(e) => setFoodLogData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any modifications or additional notes..."
                  size="sm"
                />
              </FormControl>
              
              {/* Editable Nutrition */}
              {editableNutrition && (
                <Card w="full" bg="blue.50">
                  <CardBody>
                    <VStack spacing={4}>
                      <Text fontWeight="bold" color="blue.700">
                        Nutrition per {foodLogData.amount} {foodLogData.unit}(s) - All Values Editable
                      </Text>
                      <SimpleGrid columns={2} spacing={4} w="full">
                        <FormControl>
                          <FormLabel fontSize="xs" color="gray.600">Calories</FormLabel>                          <NumberInput
                            value={editableNutrition.calories}
                            onChange={(_, valueNumber) => {
                              if (valueNumber !== undefined) {
                                setEditableNutrition(prev => prev ? {
                                  ...prev,
                                  calories: valueNumber
                                } : null)
                              }
                            }}
                            precision={1}
                            min={0}
                            step={0.1}
                            size="sm"
                            allowMouseWheel={false}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>                          <FormControl>
                          <FormLabel fontSize="xs" color="gray.600">Protein (g)</FormLabel>
                          <NumberInput
                            value={editableNutrition.protein}
                            onChange={(_, valueNumber) => {
                              if (valueNumber !== undefined) {
                                setEditableNutrition(prev => prev ? {
                                  ...prev,
                                  protein: valueNumber
                                } : null)
                              }
                            }}
                            precision={1}
                            min={0}
                            step={0.1}
                            size="sm"
                            allowMouseWheel={false}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>                          <FormControl>
                          <FormLabel fontSize="xs" color="gray.600">Carbs (g)</FormLabel>
                          <NumberInput
                            value={editableNutrition.carbs}
                            onChange={(_, valueNumber) => {
                              if (valueNumber !== undefined) {
                                setEditableNutrition(prev => prev ? {
                                  ...prev,
                                  carbs: valueNumber
                                } : null)
                              }
                            }}
                            precision={1}
                            min={0}
                            step={0.1}
                            size="sm"
                            allowMouseWheel={false}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>                          <FormControl>
                          <FormLabel fontSize="xs" color="gray.600">Fat (g)</FormLabel>
                          <NumberInput
                            value={editableNutrition.fat}
                            onChange={(_, valueNumber) => {
                              if (valueNumber !== undefined) {
                                setEditableNutrition(prev => prev ? {
                                  ...prev,
                                  fat: valueNumber
                                } : null)
                              }
                            }}
                            precision={1}
                            min={0}
                            step={0.1}
                            size="sm"
                            allowMouseWheel={false}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>
                        {editableNutrition.fiber !== undefined && (                            <FormControl>
                              <FormLabel fontSize="xs" color="gray.600">Fiber (g)</FormLabel>
                              <NumberInput
                                value={(editableNutrition.fiber || 0)}
                                onChange={(_, valueNumber) => {
                                  setEditableNutrition(prev => prev ? {
                                    ...prev,
                                    fiber: valueNumber
                                  } : null)
                                }}
                                precision={1}
                                min={0}
                                step={0.1}
                                size="sm"
                                allowMouseWheel={false}
                              >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        )}
                        {editableNutrition.sodium !== undefined && (                            <FormControl>
                              <FormLabel fontSize="xs" color="gray.600">Sodium (mg)</FormLabel>
                              <NumberInput
                                value={editableNutrition.sodium || 0}
                                onChange={(_, valueNumber) => {
                                  setEditableNutrition(prev => prev ? {
                                    ...prev,
                                    sodium: valueNumber
                                  } : null)
                                }}
                                precision={1}
                                min={0}
                                step={1}
                                size="sm"
                                allowMouseWheel={false}
                              >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                          </FormControl>
                        )}
                      </SimpleGrid>
                      {editableNutrition.confidence_score && (
                        <Box w="full">
                          <Text fontSize="xs" color="gray.600" mb={1}>
                            AI Confidence: {editableNutrition.confidence_score}%
                          </Text>
                          <Progress 
                            value={editableNutrition.confidence_score} 
                            size="xs" 
                            colorScheme={editableNutrition.confidence_score > 70 ? 'green' : 'yellow'}
                          />
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter flexShrink={0} borderTop="1px solid" borderColor="gray.200">
            <HStack spacing={2} w="full" justify="flex-end">
              <Button variant="outline" onClick={onFoodLogClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="green" 
                leftIcon={<FiSave />}
                onClick={logFood}
                isLoading={isLoggingFood}
              >
                Log Food
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  )
}