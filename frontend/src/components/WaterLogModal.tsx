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
  Divider,
  Badge,
  SimpleGrid,
  Box
} from '@chakra-ui/react';
import api from '../utils/api';

interface WaterLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const WaterLogModal: React.FC<WaterLogModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<number>(8); // Default 8 fl oz
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Quick amount buttons (in fl oz)
  const quickAmounts = [4, 8, 12, 16, 20, 24, 32];

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid water amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      // Use local date to ensure consistency with user's timezone
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      await api.post('/water-logs/', {
        date: localDate,
        amount: amount,
        notes: ""
      });

      toast({
        title: 'Water Logged!',
        description: `Successfully logged ${amount} fl oz of water`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess?.();
      onClose();
      setAmount(8); // Reset to default
    } catch (error) {
      console.error('Error logging water:', error);
      toast({
        title: 'Error',
        description: 'Failed to log water. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay zIndex={1200} />
      <ModalContent zIndex={1300}>
        <ModalHeader>
          <HStack>
            <Text fontSize="xl">💧 Log Water Intake</Text>
            <Badge colorScheme="blue" variant="subtle">fl oz</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6}>
            {/* Amount Input */}
            <VStack spacing={3} w="full">
              <Text fontSize="md" fontWeight="medium">Amount (fl oz)</Text>
              <NumberInput 
                value={amount} 
                onChange={(_, valueNumber) => setAmount(valueNumber || 0)}
                min={0}
                max={100}
                step={0.1}
                precision={2}
                size="lg"
                w="full"
                allowMouseWheel={false}
              >
                <NumberInputField textAlign="center" fontSize="xl" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </VStack>

            <Divider />

            {/* Quick Amount Buttons */}
            <VStack spacing={3} w="full">
              <Text fontSize="sm" color="gray.600">Quick Select (fl oz)</Text>
              <SimpleGrid columns={4} spacing={2} w="full">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    size="sm"
                    variant={amount === quickAmount ? "solid" : "outline"}
                    colorScheme="blue"
                    onClick={() => setAmount(quickAmount)}
                  >
                    {quickAmount}
                  </Button>
                ))}
              </SimpleGrid>
            </VStack>

            {/* Current Selection Display */}
            <Box 
              p={4} 
              bg="blue.50" 
              borderRadius="md" 
              w="full" 
              textAlign="center"
            >
              <Text fontSize="lg" fontWeight="bold" color="blue.700">
                Logging: {amount} fl oz
              </Text>
              <Text fontSize="sm" color="blue.600">
                ≈ {(amount * 29.5735).toFixed(0)} ml
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="Logging..."
          >
            Log Water
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WaterLogModal;
