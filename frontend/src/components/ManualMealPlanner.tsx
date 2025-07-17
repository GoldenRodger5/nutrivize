import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Heading,
  SimpleGrid,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { FaPlus, FaTrash, FaPlay, FaStop, FaCopy, FaShoppingCart, FaLightbulb, FaFileExport } from 'react-icons/fa';
import api from '../utils/api';
import MealDetailView from './MealDetailView';

interface MealPlan {
  plan_id: string;
  name: string;
  duration_days: number;
  is_active: boolean;
  start_date: string | null;
  days: Day[];
  target_nutrition: Record<string, number>;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Day {
  day_number: number;
  date: string | null;
  meals: {
    breakfast: Food[];
    lunch: Food[];
    dinner: Food[];
    snacks: Food[];
  };
  daily_totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

interface Food {
  food_id: string;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface Template {
  plan_id: string;
  name: string;
  duration_days: number;
  target_nutrition: Record<string, number>;
  notes: string;
}

const ManualMealPlanner: React.FC = () => {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<{
    planId: string;
    dayNumber: number;
    mealType: string;
  } | null>(null);
  const toast = useToast();
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isTemplateOpen, onOpen: onTemplateOpen, onClose: onTemplateClose } = useDisclosure();
  const { isOpen: isAllPlansOpen, onOpen: onAllPlansOpen, onClose: onAllPlansClose } = useDisclosure();

  // Toggle function for collapsible plans view
  const toggleAllPlans = () => {
    if (isAllPlansOpen) {
      onAllPlansClose()
    } else {
      onAllPlansOpen()
    }
  }
  
  const [newPlan, setNewPlan] = useState({
    name: '',
    duration_days: 7,
    target_nutrition: {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65
    },
    notes: ''
  });

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadPlans();
    loadTemplates();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/meal-planning/manual/plans');
      const planData = response.data.plans || [];
      setPlans(planData);
      setActivePlan(planData.find((p: MealPlan) => p.is_active) || null);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error loading plans',
        description: 'Failed to load meal plans. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/meal-planning/manual/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const createPlan = async () => {
    try {
      const response = await api.post('/meal-planning/manual/create', newPlan);
      if (response.data.success) {
        toast({
          title: 'Plan created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadPlans();
        onCreateClose();
        setNewPlan({
          name: '',
          duration_days: 7,
          target_nutrition: {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 65
          },
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: 'Error creating plan',
        description: 'Failed to create meal plan. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const activatePlan = async (planId: string) => {
    try {
      const response = await api.post(`/meal-planning/manual/plans/${planId}/activate`);
      if (response.data.success) {
        toast({
          title: 'Plan activated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadPlans();
      }
    } catch (error) {
      console.error('Error activating plan:', error);
      toast({
        title: 'Error activating plan',
        description: 'Failed to activate meal plan. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deactivatePlan = async (planId: string) => {
    try {
      const response = await api.post(`/meal-planning/manual/plans/${planId}/deactivate`);
      if (response.data.success) {
        toast({
          title: 'Plan deactivated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadPlans();
      }
    } catch (error) {
      console.error('Error deactivating plan:', error);
      toast({
        title: 'Error deactivating plan',
        description: 'Failed to deactivate meal plan. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const response = await api.delete(`/meal-planning/manual/plans/${planId}`);
      if (response.data.success) {
        toast({
          title: 'Plan deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadPlans();
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: 'Error deleting plan',
        description: 'Failed to delete meal plan. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const saveAsTemplate = async (planId: string, templateName: string) => {
    try {
      const response = await api.post(`/meal-planning/manual/plans/${planId}/save-template`, null, {
        params: { template_name: templateName }
      });
      if (response.data.success) {
        toast({
          title: 'Template saved successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadTemplates();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error saving template',
        description: 'Failed to save template. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const createFromTemplate = async (templateId: string, planName: string) => {
    try {
      const response = await api.post('/meal-planning/manual/create-from-template', null, {
        params: { template_id: templateId, plan_name: planName }
      });
      if (response.data.success) {
        toast({
          title: 'Plan created from template successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadPlans();
        onTemplateClose();
      }
    } catch (error) {
      console.error('Error creating from template:', error);
      toast({
        title: 'Error creating from template',
        description: 'Failed to create plan from template. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const generateInsights = async (planId: string) => {
    try {
      const response = await api.post(`/meal-planning/manual/plans/${planId}/insights`);
      if (response.data.success) {
        // Show insights in a modal or toast
        toast({
          title: 'Insights generated',
          description: 'Check the insights panel for AI recommendations.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: 'Error generating insights',
        description: 'Failed to generate insights. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const exportGroceryList = async (planId: string) => {
    try {
      const response = await api.get(`/meal-planning/manual/plans/${planId}/export/grocery-list`);
      if (response.data.success) {
        // Handle grocery list export
        const groceryList = response.data.grocery_list;
        const planName = response.data.plan_name;
        
        // Create a simple text format for the grocery list
        const listText = groceryList.map((item: any) => 
          `${item.name} - ${item.quantity} ${item.unit}`
        ).join('\n');
        
        // Create a downloadable file
        const blob = new Blob([listText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${planName}-grocery-list.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Grocery list exported',
          description: 'Your grocery list has been downloaded.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error exporting grocery list:', error);
      toast({
        title: 'Error exporting grocery list',
        description: 'Failed to export grocery list. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box p={6} maxW="7xl" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Heading size="lg" color="blue.600">
            Manual Meal Planning
          </Heading>
          <HStack spacing={3}>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              onClick={onCreateOpen}
            >
              Create Plan
            </Button>
            <Button
              leftIcon={<FaFileExport />}
              variant="outline"
              colorScheme="green"
              onClick={onTemplateOpen}
            >
              Templates
            </Button>
          </HStack>
        </HStack>

        {/* Active Plan Alert */}
        {activePlan && (
          <Alert status="info" rounded="md">
            <AlertIcon />
            <AlertTitle>Active Plan:</AlertTitle>
            <AlertDescription>
              {activePlan.name} is currently active
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Plans Management Controls */}
        {plans.length > 0 && (
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="semibold" color="gray.700">
              All Manual Plans ({plans.length})
            </Text>
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onClick={toggleAllPlans}
            >
              {isAllPlansOpen ? 'Hide All Plans' : 'View All Plans'}
            </Button>
          </HStack>
        )}

        {/* Plans Grid */}
        {isAllPlansOpen && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {plans.map((plan) => (
            <Card
              key={plan.plan_id}
              bg={cardBg}
              border="1px"
              borderColor={plan.is_active ? "blue.300" : borderColor}
              shadow={plan.is_active ? "lg" : "md"}
              _hover={{ shadow: "lg" }}
              transition="all 0.2s"
            >
              <CardHeader pb={2}>
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="lg">
                      {plan.name}
                    </Text>
                    <Badge colorScheme={plan.is_active ? "green" : "gray"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </VStack>
                  <IconButton
                    aria-label="Delete plan"
                    icon={<FaTrash />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => deletePlan(plan.plan_id)}
                  />
                </HStack>
              </CardHeader>
              
              <CardBody pt={0}>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      Duration: {plan.duration_days} days
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Target: {plan.target_nutrition.calories || 0} cal
                    </Text>
                  </HStack>
                  
                  <Divider />
                  
                  <VStack spacing={2}>
                    {/* Action Buttons */}
                    <HStack spacing={2} w="full">
                      <Button
                        size="sm"
                        colorScheme={plan.is_active ? "red" : "green"}
                        leftIcon={plan.is_active ? <FaStop /> : <FaPlay />}
                        onClick={() => plan.is_active ? deactivatePlan(plan.plan_id) : activatePlan(plan.plan_id)}
                        flex={1}
                      >
                        {plan.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <IconButton
                        aria-label="Generate insights"
                        icon={<FaLightbulb />}
                        size="sm"
                        colorScheme="yellow"
                        onClick={() => generateInsights(plan.plan_id)}
                      />
                    </HStack>
                    
                    <HStack spacing={2} w="full">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<FaShoppingCart />}
                        onClick={() => exportGroceryList(plan.plan_id)}
                        flex={1}
                      >
                        Grocery List
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<FaCopy />}
                        onClick={() => {
                          const templateName = prompt('Enter template name:');
                          if (templateName) saveAsTemplate(plan.plan_id, templateName);
                        }}
                        flex={1}
                      >
                        Save as Template
                      </Button>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
        )}

        {/* Active Plan Daily View */}
        {activePlan && (
          <VStack spacing={6} align="stretch">
            <Heading size="md" color="blue.600">
              {activePlan.name} - Daily Meal View
            </Heading>
            
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {activePlan.days.map((day) => (
                <Card key={day.day_number} bg={cardBg} border="1px" borderColor={borderColor}>
                  <CardHeader>
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="lg">
                        Day {day.day_number}
                      </Text>
                      <Badge colorScheme="blue">
                        {day.daily_totals.calories.toFixed(0)} cal
                      </Badge>
                    </HStack>
                  </CardHeader>
                  
                  <CardBody>
                    <SimpleGrid columns={2} spacing={3}>
                      {/* Breakfast */}
                      <Card
                        bg="orange.50"
                        border="1px"
                        borderColor="orange.200"
                        cursor="pointer"
                        _hover={{ bg: "orange.100", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        onClick={() => setSelectedMeal({
                          planId: activePlan.plan_id,
                          dayNumber: day.day_number,
                          mealType: 'breakfast'
                        })}
                      >
                        <CardBody p={3}>
                          <VStack spacing={2}>
                            <Text fontSize="sm" fontWeight="bold" color="orange.700">
                              🍳 Breakfast
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {day.meals.breakfast.length} items
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {day.meals.breakfast.reduce((sum, food) => sum + food.calories, 0).toFixed(0)} cal
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Lunch */}
                      <Card
                        bg="green.50"
                        border="1px"
                        borderColor="green.200"
                        cursor="pointer"
                        _hover={{ bg: "green.100", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        onClick={() => setSelectedMeal({
                          planId: activePlan.plan_id,
                          dayNumber: day.day_number,
                          mealType: 'lunch'
                        })}
                      >
                        <CardBody p={3}>
                          <VStack spacing={2}>
                            <Text fontSize="sm" fontWeight="bold" color="green.700">
                              🥗 Lunch
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {day.meals.lunch.length} items
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {day.meals.lunch.reduce((sum, food) => sum + food.calories, 0).toFixed(0)} cal
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Dinner */}
                      <Card
                        bg="purple.50"
                        border="1px"
                        borderColor="purple.200"
                        cursor="pointer"
                        _hover={{ bg: "purple.100", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        onClick={() => setSelectedMeal({
                          planId: activePlan.plan_id,
                          dayNumber: day.day_number,
                          mealType: 'dinner'
                        })}
                      >
                        <CardBody p={3}>
                          <VStack spacing={2}>
                            <Text fontSize="sm" fontWeight="bold" color="purple.700">
                              🍽️ Dinner
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {day.meals.dinner.length} items
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {day.meals.dinner.reduce((sum, food) => sum + food.calories, 0).toFixed(0)} cal
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Snacks */}
                      <Card
                        bg="yellow.50"
                        border="1px"
                        borderColor="yellow.200"
                        cursor="pointer"
                        _hover={{ bg: "yellow.100", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        onClick={() => setSelectedMeal({
                          planId: activePlan.plan_id,
                          dayNumber: day.day_number,
                          mealType: 'snacks'
                        })}
                      >
                        <CardBody p={3}>
                          <VStack spacing={2}>
                            <Text fontSize="sm" fontWeight="bold" color="yellow.700">
                              🥜 Snacks
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {day.meals.snacks.length} items
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {day.meals.snacks.reduce((sum, food) => sum + food.calories, 0).toFixed(0)} cal
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        )}

        {/* Empty State */}
        {plans.length === 0 && (
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Center py={12}>
                <VStack spacing={4}>
                  <Text fontSize="lg" color="gray.500">
                    No meal plans yet
                  </Text>
                  <Button
                    leftIcon={<FaPlus />}
                    colorScheme="blue"
                    onClick={onCreateOpen}
                  >
                    Create Your First Plan
                  </Button>
                </VStack>
              </Center>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Create Plan Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Meal Plan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Plan Name</FormLabel>
                <Input
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="Enter plan name"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Duration (days)</FormLabel>
                <NumberInput
                  value={newPlan.duration_days}
                  onChange={(_, val) => setNewPlan({ ...newPlan, duration_days: val || 7 })}
                  min={1}
                  max={30}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel>Target Calories</FormLabel>
                <NumberInput
                  value={newPlan.target_nutrition.calories}
                  onChange={(_, val) => setNewPlan({ 
                    ...newPlan, 
                    target_nutrition: { ...newPlan.target_nutrition, calories: val || 2000 }
                  })}
                  min={1000}
                  max={5000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input
                  value={newPlan.notes}
                  onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })}
                  placeholder="Optional notes about this plan"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={createPlan}>
              Create Plan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Templates Modal */}
      <Modal isOpen={isTemplateOpen} onClose={onTemplateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Meal Plan Templates</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {templates.length === 0 ? (
                <Center py={8}>
                  <Text color="gray.500">No templates available</Text>
                </Center>
              ) : (
                templates.map((template) => (
                  <Card key={template.plan_id} bg={cardBg} border="1px" borderColor={borderColor}>
                    <CardBody>
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">{template.name}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {template.duration_days} days • {template.target_nutrition.calories || 0} cal
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => {
                            const planName = prompt('Enter new plan name:');
                            if (planName) createFromTemplate(template.plan_id, planName);
                          }}
                        >
                          Use Template
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onTemplateClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Meal Detail View */}
      {selectedMeal && (
        <MealDetailView
          planId={selectedMeal.planId}
          dayNumber={selectedMeal.dayNumber}
          mealType={selectedMeal.mealType}
          onClose={() => setSelectedMeal(null)}
          onUpdate={loadPlans}
        />
      )}
    </Box>
  );
};

export default ManualMealPlanner;
