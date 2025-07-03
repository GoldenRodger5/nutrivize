import React, { useState, useRef } from 'react';
import { FiUpload, FiCamera, FiX, FiSave } from 'react-icons/fi';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Heading,
  Flex,
  Image,
  Grid,
  GridItem,
  Spinner,
} from '@chakra-ui/react';
import api from '../utils/api';

interface NutritionInfo {
  name: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturated_fat: number;
  trans_fat: number;
  cholesterol: number;
}

interface ScanResult {
  success: boolean;
  ocr_text: string;
  nutrition_info: NutritionInfo;
}

interface NutritionLabelScannerProps {
  onScanComplete?: (nutritionInfo: NutritionInfo) => void;
  onCreateFood?: (nutritionInfo: NutritionInfo) => void;
  showCreateButton?: boolean;
  className?: string;
}

const NutritionLabelScanner: React.FC<NutritionLabelScannerProps> = ({
  onScanComplete,
  onCreateFood,
  showCreateButton = true,
  className = ""
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [nutritionInfo, setNutritionInfo] = useState<NutritionInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsScanning(true);
    setScanResult(null);
    setNutritionInfo(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/nutrition-labels/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result: ScanResult = response.data;
      setScanResult(result);
      setNutritionInfo(result.nutrition_info);
      setIsEditing(true);

      if (onScanComplete) {
        onScanComplete(result.nutrition_info);
      }
    } catch (error) {
      console.error('Error scanning nutrition label:', error);
      alert('Failed to scan nutrition label. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleNutritionChange = (field: keyof NutritionInfo, value: string | number) => {
    if (!nutritionInfo) return;
    
    setNutritionInfo({
      ...nutritionInfo,
      [field]: field === 'name' || field === 'serving_size' ? value : parseFloat(value.toString()) || 0
    });
  };

  const handleSave = () => {
    if (!nutritionInfo) return;
    
    if (onScanComplete) {
      onScanComplete(nutritionInfo);
    }
    setIsEditing(false);
  };

  const handleCreateFood = async () => {
    if (!nutritionInfo) return;
    
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      // Re-upload the image for scan-and-create
      if (fileInputRef.current?.files?.[0]) {
        formData.append('file', fileInputRef.current.files[0]);
        formData.append('food_name', nutritionInfo.name);

        const response = await api.post('/nutrition-labels/scan-and-create', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const result = response.data;
        alert('Food item created successfully!');
        
        if (onCreateFood) {
          onCreateFood(result.food);
        }
      }
    } catch (error) {
      console.error('Error creating food:', error);
      alert('Failed to create food item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setNutritionInfo(null);
    setIsEditing(false);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box className={className}>
      {!scanResult && (
        <Box
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="md"
          p={8}
          textAlign="center"
          _hover={{ borderColor: "blue.500" }}
          transition="border-color 0.2s"
          cursor="pointer"
          onDrop={handleDragDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            display="none"
          />
          
          {isScanning ? (
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" />
              <Text color="gray.600">Scanning nutrition label...</Text>
            </VStack>
          ) : (
            <VStack spacing={4}>
              <HStack spacing={4}>
                <FiUpload size={32} color="gray.400" />
                <FiCamera size={32} color="gray.400" />
              </HStack>
              <Box>
                <Text fontSize="lg" fontWeight="medium" color="gray.900">
                  Scan Nutrition Label
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Click to upload or drag and drop an image
                </Text>
              </Box>
            </VStack>
          )}
        </Box>
      )}

      {previewImage && (
        <Box mt={4} textAlign="center">
          <Image
            src={previewImage}
            alt="Nutrition label preview"
            maxW="xs"
            mx="auto"
            borderRadius="md"
            shadow="md"
          />
        </Box>
      )}

      {scanResult && nutritionInfo && (
        <VStack mt={6} spacing={4} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="md">Scanned Nutrition Information</Heading>
            <HStack spacing={2}>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="outline"
              >
                {isEditing ? 'View' : 'Edit'}
              </Button>
              <Button
                onClick={resetScanner}
                size="sm"
                variant="outline"
              >
                <FiX />
              </Button>
            </HStack>
          </Flex>

          {isEditing ? (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              <GridItem>
                <FormControl>
                  <FormLabel>Food Name</FormLabel>
                  <Input
                    value={nutritionInfo.name}
                    onChange={(e) => handleNutritionChange('name', e.target.value)}
                  />
                </FormControl>
              </GridItem>
              
              <GridItem>
                <FormControl>
                  <FormLabel>Serving Size</FormLabel>
                  <Input
                    value={nutritionInfo.serving_size}
                    onChange={(e) => handleNutritionChange('serving_size', e.target.value)}
                  />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Calories</FormLabel>
                  <NumberInput value={nutritionInfo.calories} onChange={(_, value) => handleNutritionChange('calories', value)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Protein (g)</FormLabel>
                  <NumberInput value={nutritionInfo.protein} onChange={(_, value) => handleNutritionChange('protein', value)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Carbs (g)</FormLabel>
                  <NumberInput value={nutritionInfo.carbs} onChange={(_, value) => handleNutritionChange('carbs', value)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Fat (g)</FormLabel>
                  <NumberInput value={nutritionInfo.fat} onChange={(_, value) => handleNutritionChange('fat', value)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Fiber (g)</FormLabel>
                  <NumberInput value={nutritionInfo.fiber} onChange={(_, value) => handleNutritionChange('fiber', value)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Sugar (g)</FormLabel>
                  <NumberInput value={nutritionInfo.sugar} onChange={(_, value) => handleNutritionChange('sugar', value)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Sodium (mg)</FormLabel>
                  <NumberInput value={nutritionInfo.sodium} onChange={(_, value) => handleNutritionChange('sodium', value)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Saturated Fat (g)</FormLabel>
                  <NumberInput value={nutritionInfo.saturated_fat} onChange={(_, value) => handleNutritionChange('saturated_fat', value)}>
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </GridItem>
            </Grid>
          ) : (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              <GridItem colSpan={2}>
                <HStack>
                  <Text fontWeight="medium">{nutritionInfo.name}</Text>
                  <Text color="gray.600">({nutritionInfo.serving_size})</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text>Calories:</Text>
                  <Text fontWeight="medium">{nutritionInfo.calories}</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text>Protein:</Text>
                  <Text fontWeight="medium">{nutritionInfo.protein}g</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text>Carbs:</Text>
                  <Text fontWeight="medium">{nutritionInfo.carbs}g</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text>Fat:</Text>
                  <Text fontWeight="medium">{nutritionInfo.fat}g</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text>Fiber:</Text>
                  <Text fontWeight="medium">{nutritionInfo.fiber}g</Text>
                </HStack>
              </GridItem>
              <GridItem>
                <HStack justify="space-between">
                  <Text>Sugar:</Text>
                  <Text fontWeight="medium">{nutritionInfo.sugar}g</Text>
                </HStack>
              </GridItem>
            </Grid>
          )}

          <HStack spacing={3} pt={4}>
            {isEditing && (
              <Button
                onClick={handleSave}
                colorScheme="blue"
                leftIcon={<FiSave />}
              >
                Save Changes
              </Button>
            )}
            
            {showCreateButton && (
              <Button
                onClick={handleCreateFood}
                isLoading={isSaving}
                colorScheme="green"
                leftIcon={isSaving ? <Spinner size="sm" /> : <FiSave />}
              >
                Create Food Item
              </Button>
            )}
          </HStack>

          {scanResult.ocr_text && (
            <Box mt={4}>
              <Text fontSize="sm" color="gray.600" cursor="pointer" onClick={() => setIsEditing(!isEditing)}>
                View Raw OCR Text
              </Text>
              {isEditing && (
                <Box mt={2} p={3} bg="gray.100" borderRadius="md" fontSize="xs" whiteSpace="pre-wrap">
                  {scanResult.ocr_text}
                </Box>
              )}
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default NutritionLabelScanner;
