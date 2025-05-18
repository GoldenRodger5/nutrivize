import React from 'react';
import { UserProfileData } from './SetupWizard';

interface ConfirmationStepProps {
  formData: UserProfileData;
  calculatedValues: {
    bmr: number;
    tdee: number;
    goalCalories: number;
  };
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  formData,
  calculatedValues,
  onSubmit,
  onBack,
  isSubmitting
}) => {
  // Calculate macronutrient grams
  const proteinGrams = Math.round((formData.caloriesPerDay * (formData.macroDistribution.proteins / 100)) / 4);
  const carbGrams = Math.round((formData.caloriesPerDay * (formData.macroDistribution.carbs / 100)) / 4);
  const fatGrams = Math.round((formData.caloriesPerDay * (formData.macroDistribution.fats / 100)) / 9);
  
  // Get diet type label
  const getDietTypeLabel = () => {
    switch (formData.dietType) {
      case 'none': return 'No Restrictions';
      case 'vegetarian': return 'Vegetarian';
      case 'vegan': return 'Vegan';
      case 'pescatarian': return 'Pescatarian';
      case 'paleo': return 'Paleo';
      case 'keto': return 'Keto';
      case 'mediterranean': return 'Mediterranean';
      case 'gluten-free': return 'Gluten-Free';
      case 'dairy-free': return 'Dairy-Free';
      default: return formData.dietType;
    }
  };
  
  // Get activity level label
  const getActivityLevelLabel = () => {
    switch (formData.activityLevel) {
      case 'sedentary': return 'Sedentary (little or no exercise)';
      case 'light': return 'Light (light exercise 1-3 days/week)';
      case 'moderate': return 'Moderate (moderate exercise 3-5 days/week)';
      case 'active': return 'Active (hard exercise 6-7 days/week)';
      case 'very-active': return 'Very Active (physical job or training twice a day)';
      default: return formData.activityLevel;
    }
  };
  
  return (
    <div className="wizard-step confirmation-step">
      <h2>Review Your Profile</h2>
      <p className="step-description">
        Please review your information before finalizing your profile.
      </p>
      
      <div className="confirmation-section">
        <h3>Basic Information</h3>
        <div className="confirmation-grid">
          <div className="confirmation-item">
            <span className="item-label">Age:</span>
            <span className="item-value">{formData.age} years</span>
          </div>
          <div className="confirmation-item">
            <span className="item-label">Gender:</span>
            <span className="item-value">{formData.gender}</span>
          </div>
          <div className="confirmation-item">
            <span className="item-label">Height:</span>
            <span className="item-value">{formData.height} cm</span>
          </div>
          <div className="confirmation-item">
            <span className="item-label">Weight:</span>
            <span className="item-value">{formData.weight} kg</span>
          </div>
          <div className="confirmation-item">
            <span className="item-label">Activity Level:</span>
            <span className="item-value">{getActivityLevelLabel()}</span>
          </div>
        </div>
      </div>
      
      <div className="confirmation-section">
        <h3>Weight Goal</h3>
        <div className="confirmation-grid">
          <div className="confirmation-item">
            <span className="item-label">Goal Type:</span>
            <span className="item-value">
              {formData.goalType === 'lose' 
                ? 'Lose Weight' 
                : formData.goalType === 'gain' 
                  ? 'Gain Weight' 
                  : 'Maintain Weight'}
            </span>
          </div>
          
          {formData.goalType !== 'maintain' && (
            <>
              <div className="confirmation-item">
                <span className="item-label">Target Weight:</span>
                <span className="item-value">{formData.targetWeight} kg</span>
              </div>
              <div className="confirmation-item">
                <span className="item-label">Weekly Rate:</span>
                <span className="item-value">{formData.weeklyRate} kg per week</span>
              </div>
              <div className="confirmation-item">
                <span className="item-label">Estimated Time:</span>
                <span className="item-value">
                  {formData.goalType === 'lose' 
                    ? `${Math.ceil((formData.weight - formData.targetWeight) / formData.weeklyRate)} weeks` 
                    : `${Math.ceil((formData.targetWeight - formData.weight) / formData.weeklyRate)} weeks`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="confirmation-section">
        <h3>Nutrition Plan</h3>
        <div className="confirmation-grid">
          <div className="confirmation-item">
            <span className="item-label">Daily Calories:</span>
            <span className="item-value">{formData.caloriesPerDay} kcal</span>
          </div>
          <div className="confirmation-item">
            <span className="item-label">Protein:</span>
            <span className="item-value">{formData.macroDistribution.proteins}% ({proteinGrams}g)</span>
          </div>
          <div className="confirmation-item">
            <span className="item-label">Carbs:</span>
            <span className="item-value">{formData.macroDistribution.carbs}% ({carbGrams}g)</span>
          </div>
          <div className="confirmation-item">
            <span className="item-label">Fats:</span>
            <span className="item-value">{formData.macroDistribution.fats}% ({fatGrams}g)</span>
          </div>
        </div>
        
        <div className="macro-chart-preview">
          <div 
            className="macro-chart-protein" 
            style={{ width: `${formData.macroDistribution.proteins}%` }}
          >
            P
          </div>
          <div 
            className="macro-chart-carbs" 
            style={{ width: `${formData.macroDistribution.carbs}%` }}
          >
            C
          </div>
          <div 
            className="macro-chart-fats" 
            style={{ width: `${formData.macroDistribution.fats}%` }}
          >
            F
          </div>
        </div>
      </div>
      
      <div className="confirmation-section">
        <h3>Dietary Preferences</h3>
        <div className="confirmation-grid">
          <div className="confirmation-item">
            <span className="item-label">Diet Type:</span>
            <span className="item-value">{getDietTypeLabel()}</span>
          </div>
          
          <div className="confirmation-item">
            <span className="item-label">Allergies:</span>
            <span className="item-value">
              {formData.allergies.length > 0 
                ? formData.allergies.join(', ') 
                : 'None specified'}
            </span>
          </div>
          
          <div className="confirmation-item">
            <span className="item-label">Foods to Avoid:</span>
            <span className="item-value">
              {formData.excludedFoods.length > 0 
                ? formData.excludedFoods.join(', ') 
                : 'None specified'}
            </span>
          </div>
          
          <div className="confirmation-item">
            <span className="item-label">Favorite Foods:</span>
            <span className="item-value">
              {formData.preferredFoods.length > 0 
                ? formData.preferredFoods.join(', ') 
                : 'None specified'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="wizard-step-buttons">
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </button>
        <button 
          type="button" 
          className="btn-primary" 
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Profile...' : 'Create My Profile'}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationStep; 