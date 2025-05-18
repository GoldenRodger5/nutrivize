import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper
} from '@mui/material';

// Import individual step components
import BasicInfoStep from './wizard/BasicInfoStep';
import WeightGoalStep from './wizard/WeightGoalStep';
import DietaryPreferencesStep from './wizard/DietaryPreferencesStep';
import ResultsStep from './wizard/ResultsStep';

const steps = ['Basic Information', 'Weight Goals', 'Dietary Preferences', 'Results'];

const SetupWizard = ({ auth }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [userData, setUserData] = useState({
    basicInfo: {
      age: '',
      gender: '',
      height: '',
      weight: '',
      activityLevel: ''
    },
    weightGoal: {
      goalType: 'maintain',
      targetWeight: '',
      weeklyRate: 0.5
    },
    nutritionGoal: {
      dailyCalories: 0,
      macroDistribution: {
        protein: 30,
        carbs: 40,
        fat: 30
      }
    },
    dietaryPreferences: {
      dietType: 'standard',
      allergies: [],
      excludedFoods: [],
      preferredFoods: []
    },
    calculatedValues: {
      bmr: 0,
      tdee: 0,
      goalCalories: 0
    }
  });

  useEffect(() => {
    // Redirect if user is not authenticated
    if (!auth.isAuthenticated) {
      navigate('/login');
    }
    
    // Check if user already has a profile
    const checkProfile = async () => {
      try {
        const res = await axios.get('/api/users/profile');
        if (res.data) {
          // User already has a profile, redirect to dashboard
          navigate('/dashboard');
        }
      } catch (err) {
        // No profile found, continue with setup
      }
    };
    
    checkProfile();
  }, [auth, navigate]);

  // Calculate BMR using Mifflin-St Jeor Equation
  const calculateBMR = () => {
    const { age, gender, height, weight } = userData.basicInfo;
    let bmr;
    
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    return Math.round(bmr);
  };

  // Calculate TDEE (Total Daily Energy Expenditure)
  const calculateTDEE = (bmr) => {
    const { activityLevel } = userData.basicInfo;
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
    const { goalType, weeklyRate } = userData.weightGoal;
    let goalCalories = tdee;
    
    // 1 lb of fat = 3500 calories
    const dailyCalorieAdjustment = (weeklyRate * 3500) / 7;
    
    if (goalType === 'lose') {
      goalCalories -= dailyCalorieAdjustment;
    } else if (goalType === 'gain') {
      goalCalories += dailyCalorieAdjustment;
    }
    
    return Math.round(goalCalories);
  };

  const handleNext = () => {
    if (activeStep === steps.length - 2) {
      // Before the final step, calculate nutrition values
      const bmr = calculateBMR();
      const tdee = calculateTDEE(bmr);
      const goalCalories = calculateGoalCalories(tdee);
      
      setUserData({
        ...userData,
        nutritionGoal: {
          ...userData.nutritionGoal,
          dailyCalories: goalCalories
        },
        calculatedValues: {
          bmr,
          tdee,
          goalCalories
        }
      });
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/users/profile', userData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleUpdateFormData = (step, data) => {
    setUserData(prevData => ({
      ...prevData,
      [step]: {
        ...prevData[step],
        ...data
      }
    }));
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoStep 
            data={userData.basicInfo} 
            updateData={(data) => handleUpdateFormData('basicInfo', data)} 
          />
        );
      case 1:
        return (
          <WeightGoalStep 
            data={userData.weightGoal}
            currentWeight={userData.basicInfo.weight} 
            updateData={(data) => handleUpdateFormData('weightGoal', data)} 
          />
        );
      case 2:
        return (
          <DietaryPreferencesStep 
            data={userData.dietaryPreferences} 
            updateData={(data) => handleUpdateFormData('dietaryPreferences', data)} 
          />
        );
      case 3:
        return (
          <ResultsStep 
            userData={userData}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Setup Your Nutrition Profile
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box>
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
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
                >
                  Finish
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

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(mapStateToProps)(SetupWizard); 