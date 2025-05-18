import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../../context/UserContext';
import api from '../../utils/api';
import '../../styles/SetupWizard.css';

// Step components
import BasicInfoStep from './BasicInfoStep';
import WeightGoalStep from './WeightGoalStep';
import NutritionGoalStep from './NutritionGoalStep';
import DietaryPreferencesStep from './DietaryPreferencesStep';
import ConfirmationStep from './ConfirmationStep';

// Wizard step types
export type WizardStep = 'basic-info' | 'weight-goal' | 'nutrition-goal' | 'dietary-preferences' | 'confirmation';

// User profile data structure
export interface UserProfileData {
  // Basic info
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  
  // Weight goal info
  goalType: 'lose' | 'maintain' | 'gain';
  targetWeight: number;
  weeklyRate: number; // in kg per week
  
  // Nutrition goals
  caloriesPerDay: number;
  macroDistribution: {
    proteins: number; // percentage
    carbs: number; // percentage
    fats: number; // percentage
  };
  
  // Dietary preferences
  dietType: string;
  allergies: string[];
  excludedFoods: string[];
  preferredFoods: string[];
}

const SetupWizard: React.FC = () => {
  const { user } = useUserContext();
  const history = useHistory();
  
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  
  // Form data state
  const [formData, setFormData] = useState<UserProfileData>({
    // Default values
    age: 30,
    gender: 'not-specified',
    height: 170, // in cm
    weight: 70, // in kg
    activityLevel: 'moderate',
    
    goalType: 'maintain',
    targetWeight: 70,
    weeklyRate: 0.5,
    
    caloriesPerDay: 2000,
    macroDistribution: {
      proteins: 30,
      carbs: 40,
      fats: 30
    },
    
    dietType: 'none',
    allergies: [],
    excludedFoods: [],
    preferredFoods: []
  });
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handler for updating form data
  const updateFormData = (data: Partial<UserProfileData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };
  
  // Navigate to next step
  const goToNextStep = () => {
    switch (currentStep) {
      case 'basic-info':
        setCurrentStep('weight-goal');
        break;
      case 'weight-goal':
        setCurrentStep('nutrition-goal');
        break;
      case 'nutrition-goal':
        setCurrentStep('dietary-preferences');
        break;
      case 'dietary-preferences':
        setCurrentStep('confirmation');
        break;
      case 'confirmation':
        handleSubmit();
        break;
      default:
        break;
    }
  };
  
  // Navigate to previous step
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'weight-goal':
        setCurrentStep('basic-info');
        break;
      case 'nutrition-goal':
        setCurrentStep('weight-goal');
        break;
      case 'dietary-preferences':
        setCurrentStep('nutrition-goal');
        break;
      case 'confirmation':
        setCurrentStep('dietary-preferences');
        break;
      default:
        break;
    }
  };
  
  // Calculate BMR and TDEE based on user data
  const calculateNutritionValues = () => {
    // Mifflin-St Jeor Equation for BMR
    let bmr = 0;
    if (formData.gender === 'male') {
      bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5;
    } else if (formData.gender === 'female') {
      bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age - 161;
    } else {
      // Use average for non-binary/not specified
      const maleBmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5;
      const femaleBmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age - 161;
      bmr = (maleBmr + femaleBmr) / 2;
    }
    
    // Activity multiplier
    let activityMultiplier = 1.2; // sedentary
    switch (formData.activityLevel) {
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
      case 'very-active':
        activityMultiplier = 1.9;
        break;
      default:
        activityMultiplier = 1.2;
    }
    
    // Total Daily Energy Expenditure
    let tdee = Math.round(bmr * activityMultiplier);
    
    // Adjust based on goal
    let goalCalories = tdee;
    if (formData.goalType === 'lose') {
      // 500-1000 calorie deficit for weight loss
      goalCalories = Math.max(1200, tdee - (formData.weeklyRate * 1000));
    } else if (formData.goalType === 'gain') {
      // 300-500 calorie surplus for weight gain
      goalCalories = tdee + (formData.weeklyRate * 500);
    }
    
    return {
      bmr: Math.round(bmr),
      tdee,
      goalCalories
    };
  };
  
  // Auto-calculate nutrition values when changing steps
  const handleNutritionCalculation = () => {
    if (currentStep === 'weight-goal') {
      const { goalCalories } = calculateNutritionValues();
      
      // Update the formData with calculated values
      updateFormData({
        caloriesPerDay: goalCalories
      });
    }
  };
  
  // Submit the form to create user profile and goals
  const handleSubmit = async () => {
    if (!user?.uid) {
      setError('User not authenticated. Please login.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting user profile data:', formData);
      
      // Create user profile
      const userProfileResponse = await api.post('/user/profile', {
        userId: user.uid,
        age: formData.age,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        activityLevel: formData.activityLevel,
        dietaryPreferences: {
          dietType: formData.dietType,
          allergies: formData.allergies,
          excludedFoods: formData.excludedFoods,
          preferredFoods: formData.preferredFoods
        }
      });
      
      console.log('Profile creation response:', userProfileResponse.data);
      
      // Calculate nutrition values
      const { goalCalories } = calculateNutritionValues();
      
      // Create user goal
      const userGoalResponse = await api.post('/goals', {
        type: formData.goalType,
        weight_target: {
          current: formData.weight,
          goal: formData.targetWeight,
          weekly_rate: formData.weeklyRate
        },
        nutrition_targets: [{
          name: 'Default',
          daily_calories: goalCalories,
          proteins: Math.round(goalCalories * (formData.macroDistribution.proteins / 100) / 4), // 4 calories per gram of protein
          carbs: Math.round(goalCalories * (formData.macroDistribution.carbs / 100) / 4), // 4 calories per gram of carbs
          fats: Math.round(goalCalories * (formData.macroDistribution.fats / 100) / 9), // 9 calories per gram of fat
          fiber: Math.round(formData.macroDistribution.carbs * 0.1), // estimate fiber as 10% of carbs
          applies_to: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] // Apply to all days
        }]
      });
      
      console.log('Goal creation response:', userGoalResponse.data);
      
      // Verify the profile was created successfully by making a GET request
      try {
        const verifyProfileResponse = await api.get('/user/profile');
        console.log('Profile verification:', verifyProfileResponse.data);
        if (!verifyProfileResponse.data) {
          console.error('Profile was not properly saved');
          setError('Profile was created but could not be verified. Please try refreshing the page.');
          setIsSubmitting(false);
          return;
        }
      } catch (verifyError) {
        console.error('Error verifying profile:', verifyError);
        // Continue anyway - the profile might still have been created successfully
      }
      
      // Redirect to dashboard
      history.push('/dashboard');
    } catch (err: any) {
      console.error('Error submitting user data:', err);
      
      // Handle different types of errors
      if (err.response) {
        // Server responded with an error
        const status = err.response.status;
        const errorMsg = err.response.data?.message || err.response.data?.detail || 'Server error';
        
        if (status === 401) {
          setError('Authentication error. Please log in again.');
        } else if (status === 400) {
          setError(`Invalid data: ${errorMsg}`);
        } else {
          setError(`Server error (${status}): ${errorMsg}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        setError('No response from server. Please check your connection and try again.');
      } else {
        // Error in setting up the request
        setError(err.message || 'Failed to save user data. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'basic-info':
        return (
          <BasicInfoStep 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={goToNextStep} 
          />
        );
      case 'weight-goal':
        return (
          <WeightGoalStep 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={() => {
              handleNutritionCalculation();
              goToNextStep();
            }} 
            onBack={goToPreviousStep} 
          />
        );
      case 'nutrition-goal':
        return (
          <NutritionGoalStep 
            formData={formData} 
            updateFormData={updateFormData} 
            calculatedValues={calculateNutritionValues()}
            onNext={goToNextStep} 
            onBack={goToPreviousStep} 
          />
        );
      case 'dietary-preferences':
        return (
          <DietaryPreferencesStep 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={goToNextStep} 
            onBack={goToPreviousStep} 
          />
        );
      case 'confirmation':
        return (
          <ConfirmationStep 
            formData={formData} 
            calculatedValues={calculateNutritionValues()}
            onSubmit={handleSubmit} 
            onBack={goToPreviousStep}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };
  
  // Progress indicator
  const steps = [
    { id: 'basic-info', label: 'Basic Info' },
    { id: 'weight-goal', label: 'Weight Goal' },
    { id: 'nutrition-goal', label: 'Nutrition' },
    { id: 'dietary-preferences', label: 'Preferences' },
    { id: 'confirmation', label: 'Review' }
  ];
  
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="setup-wizard">
      <div className="setup-wizard-header">
        <h1>Welcome to Nutrivize</h1>
        <p>Let's set up your personalized nutrition profile</p>
      </div>
      
      <div className="setup-wizard-progress">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className={`progress-step ${index <= currentStepIndex ? 'completed' : ''} ${index === currentStepIndex ? 'active' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">{step.label}</div>
          </div>
        ))}
      </div>
      
      <div className="setup-wizard-content">
        {renderStep()}
      </div>
      
      {error && (
        <div className="setup-wizard-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default SetupWizard; 