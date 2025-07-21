import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
  Badge,
  Box,
  Radio,
  RadioGroup,
  Stack
} from '@chakra-ui/react';
import api from '../../utils/api';

interface WeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const WeightLogModal: React.FC<WeightLogModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [weight, setWeight] = useState<number>(150);
  const [unit, setUnit] = useState<string>('lbs');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (weight <= 0) {
      toast({
        title: 'Invalid Weight',
        description: 'Please enter a valid weight',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Convert to lbs if needed
      const weightInLbs = unit === 'kg' ? weight * 2.20462 : weight;
      
      await api.post('/weight-logs/', {
        date: today,
        weight_lbs: weightInLbs,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Weight Logged!',
        description: `Successfully logged ${weight} ${unit}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error logging weight:', error);
      toast({
        title: 'Error',
        description: 'Failed to log weight. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const convertedWeight = unit === 'lbs' 
    ? (weight * 0.453592).toFixed(1) 
    : (weight * 2.20462).toFixed(1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay zIndex={1200} />
      <ModalContent zIndex={1300}>
        <ModalHeader>
          <HStack>
            <Text fontSize="xl">⚖️ Log Weight</Text>
            <Badge colorScheme="purple" variant="subtle">{unit}</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6}>
            {/* Unit Selection */}
            <VStack spacing={3} w="full">
              <Text fontSize="md" fontWeight="medium">Unit</Text>
              <RadioGroup value={unit} onChange={setUnit}>
                <Stack direction="row" spacing={6}>
                  <Radio value="lbs" colorScheme="purple">
                    Pounds (lbs)
                  </Radio>
                  <Radio value="kg" colorScheme="purple">
                    Kilograms (kg)
                  </Radio>
                </Stack>
              </RadioGroup>
            </VStack>

            {/* Weight Input */}
            <VStack spacing={3} w="full">
              <Text fontSize="md" fontWeight="medium">Weight ({unit})</Text>
              <NumberInput 
                value={weight} 
                onChange={(_, value) => setWeight(value || 0)}
                min={0}
                max={1000}
                step={0.1}
                size="lg"
                w="full"
              >
                <NumberInputField textAlign="center" fontSize="xl" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </VStack>

            {/* Conversion Display */}
            <Box 
              p={4} 
              bg="purple.50" 
              borderRadius="md" 
              w="full" 
              textAlign="center"
            >
              <Text fontSize="lg" fontWeight="bold" color="purple.700">
                Logging: {weight} {unit}
              </Text>
              <Text fontSize="sm" color="purple.600">
                ≈ {convertedWeight} {unit === 'lbs' ? 'kg' : 'lbs'}
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="purple" 
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Logging..."
          >
            Log Weight
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WeightLogModal;
