import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import api from '../../utils/api.ts';
import { getUserData, isAuthenticated } from '../../utils/auth.ts';

// Import individual step components
import BasicInfoStep from './BasicInfoStep.jsx';
import WeightGoalStep from './WeightGoalStep.jsx';
import NutritionGoalsStep from './NutritionGoalsStep.jsx';
import DietaryPreferencesStep from './DietaryPreferencesStep.jsx';
import ConfirmationStep from './ConfirmationStep.jsx';

const steps = ['Basic Information', 'Weight Goals', 'Nutrition Goals', 'Dietary Preferences', 'Review & Confirm'];

const SetupWizard = () => {
  const history = useHistory();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
  const [userData, setUserData] = useState({
    // Basic info
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: 'moderate',
    
    // Weight goal
    goalType: 'maintain',
    targetWeight: '',
    weeklyWeightLossTarget: 0.5,
    weeklyWeightGainTarget: 0.3,
    
    // Nutrition
    calorieTarget: '',
    useCalculatedCalories: true,
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatPercentage: 30,
    additionalNutritionGoals: '',
    
    // Dietary preferences
    dietaryStyle: 'omnivore',
    allergies: [],
    foodAvoidances: [],
    otherAvoidances: '',
    favoriteFoods: '',
    mealsPerDay: 3,
    additionalPreferences: ''
  });
  
  // Calculated values
  const [calculatedValues, setCalculatedValues] = useState({
    bmr: 0,
    tdee: 0,
    goalCalories: 0
  });

  // Get current user on mount
  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        history.push('/login');
        return;
      }
      
      // Get user data from local storage
      const userData = getUserData();
      if (!userData) {
        history.push('/login');
        return;
      }
      
      setUser(userData);
    };
    
    checkAuth();
  }, [history]);

  // Check if user already has a profile
  useEffect(() => {
    if (!user?.uid) return;
    
    const checkProfile = async () => {
      try {
        const res = await api.get('/user/profile');
        
        // If profile exists, redirect to dashboard
        if (res.data && Object.keys(res.data).length > 0) {
          history.push('/dashboard');
        }
      } catch (error) {
        // 404 error means no profile found, continue with setup
        if (error.response?.status !== 404) {
          console.error('Error checking profile:', error);
          setError('Failed to check profile status. Please try again.');
        }
      }
    };
    
    checkProfile();
  }, [user, history]);

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = () => {
    const { age, gender, height, weight } = userData;
    
    // Check if we have all required values
    if (!age || !gender || !height || !weight) {
      return 0;
    }
    
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (gender === 'female') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      // Use average for non-binary
      const maleBMR = 10 * weight + 6.25 * height - 5 * age + 5;
      const femaleBMR = 10 * weight + 6.25 * height - 5 * age - 161;
      bmr = (maleBMR + femaleBMR) / 2;
    }
    
    return Math.round(bmr);
  };

  // Calculate TDEE (Total Daily Energy Expenditure)
  const calculateTDEE = (bmr) => {
    const { activityLevel } = userData;
    let activityMultiplier;
    
    switch (activityLevel) {
      case 'sedentary':
        activityMultiplier = 1.2;
        break;
      case 'light':
        activityMultiplier = 1.375;
        break;
      case 'moderate':
        activityMultiplier = 1.55;
        break;
      case 'active':
        activityMultiplier = 1.725;
        break;
      case 'very_active':
        activityMultiplier = 1.9;
        break;
      default:
        activityMultiplier = 1.2;
    }
    
    return Math.round(bmr * activityMultiplier);
  };

  // Calculate goal calories based on weight goal
  const calculateGoalCalories = (tdee) => {
    const { goalType, weeklyWeightLossTarget, weeklyWeightGainTarget } = userData;
    
    // Return TDEE for maintenance
    if (goalType === 'maintain') {
      return tdee;
    }
    
    // 7700 calories = 1kg of body weight (approximately)
    const dailyCalorieAdjustment = Math.round((goalType === 'lose' ? weeklyWeightLossTarget : weeklyWeightGainTarget) * 7700 / 7);
    
    // Subtract calories for weight loss, add for weight gain
    return goalType === 'lose' 
      ? Math.max(1200, tdee - dailyCalorieAdjustment) // Ensure minimum 1200 calories
      : tdee + dailyCalorieAdjustment;
  };

  // Update all calculated nutrition values
  const updateCalculatedValues = () => {
    const bmr = calculateBMR();
    const tdee = calculateTDEE(bmr);
    const goalCalories = calculateGoalCalories(tdee);
    
    setCalculatedValues({
      bmr,
      tdee,
      goalCalories
    });
    
    // Update calorie target if using calculated values
    if (userData.useCalculatedCalories) {
      setUserData(prev => ({
        ...prev,
        calorieTarget: goalCalories
      }));
    }
  };

  // Update calculations when relevant user data changes
  useEffect(() => {
    if (userData.age && userData.gender && userData.height && userData.weight) {
      updateCalculatedValues();
    }
  }, [
    userData.age, 
    userData.gender, 
    userData.height, 
    userData.weight, 
    userData.activityLevel,
    userData.goalType,
    userData.weeklyWeightLossTarget,
    userData.weeklyWeightGainTarget
  ]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleUpdateData = (data) => {
    setUserData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      setError('User not authenticated. Please log in again.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Format data for the API in the expected structure
      const profileData = {
        basicInfo: {
          age: parseInt(userData.age),
          gender: userData.gender,
          height: parseFloat(userData.height),
          weight: parseFloat(userData.weight),
          activityLevel: userData.activityLevel
        },
        weightGoal: {
          goalType: userData.goalType,
          targetWeight: parseFloat(userData.targetWeight || userData.weight),
          weeklyRate: userData.goalType === 'lose' 
            ? parseFloat(userData.weeklyWeightLossTarget) 
            : parseFloat(userData.weeklyWeightGainTarget)
        },
        nutritionGoal: {
          dailyCalories: parseInt(userData.calorieTarget),
          macroDistribution: {
            protein: parseInt(userData.proteinPercentage),
            carbs: parseInt(userData.carbsPercentage),
            fat: parseInt(userData.fatPercentage)
          }
        },
        dietaryPreferences: {
          dietType: userData.dietaryStyle,
          allergies: userData.allergies,
          excludedFoods: userData.foodAvoidances.concat(
            userData.otherAvoidances ? userData.otherAvoidances.split(',').map(item => item.trim()) : []
          ),
          preferredFoods: userData.favoriteFoods 
            ? userData.favoriteFoods.split(',').map(item => item.trim()) 
            : []
        },
        calculatedValues
      };
      
      // Send data to the API
      console.log('Submitting profile data:', profileData);
      const response = await api.post('/user/profile', profileData);
      console.log('Profile created successfully:', response.data);
      
      // Redirect to dashboard
      history.push('/dashboard');
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.msg || 
        'Failed to create profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoStep 
            data={userData} 
            updateData={handleUpdateData} 
          />
        );
      case 1:
        return (
          <WeightGoalStep 
            data={userData}
            updateData={handleUpdateData}
            currentWeight={userData.weight}
          />
        );
      case 2:
        return (
          <NutritionGoalsStep
            data={userData}
            updateData={handleUpdateData}
            calculatedValues={calculatedValues}
          />
        );
      case 3:
        return (
          <DietaryPreferencesStep 
            data={userData} 
            updateData={handleUpdateData} 
          />
        );
      case 4:
        return (
          <ConfirmationStep 
            data={userData}
            updateData={handleUpdateData}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  // If not authenticated, show loading or redirect
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Nutrivize Setup
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" paragraph>
          Let's personalize your nutrition journey
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, mt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box>
          {getStepContent(activeStep)}
          
          {error && (
            <Box 
              sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: 'error.light', 
                color: 'error.contrastText',
                borderRadius: 1
              }}
            >
              <Typography>{error}</Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0 || isLoading}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  sx={{ minWidth: 100 }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Finish'}
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SetupWizard; 