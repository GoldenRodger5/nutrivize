import React, { useEffect } from 'react';
import { UserProfileData } from './SetupWizard';

interface NutritionGoalStepProps {
  formData: UserProfileData;
  updateFormData: (data: Partial<UserProfileData>) => void;
  calculatedValues: {
    bmr: number;
    tdee: number;
    goalCalories: number;
  };
  onNext: () => void;
  onBack: () => void;
}

const NutritionGoalStep: React.FC<NutritionGoalStepProps> = ({
  formData,
  updateFormData,
  calculatedValues,
  onNext,
  onBack
}) => {
  // Set initial calculated values if needed
  useEffect(() => {
    if (formData.caloriesPerDay === 0) {
      updateFormData({
        caloriesPerDay: calculatedValues.goalCalories
      });
    }
  }, [calculatedValues.goalCalories]);
  
  const handleCaloriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const calories = Number(e.target.value);
    updateFormData({ caloriesPerDay: calories });
  };
  
  const handleMacroChange = (macro: 'proteins' | 'carbs' | 'fats', value: number) => {
    const newMacros = { ...formData.macroDistribution };
    
    // Update the changed macro
    newMacros[macro] = value;
    
    // Adjust the remaining macros to ensure total is 100%
    const otherMacros = Object.keys(newMacros).filter(m => m !== macro) as Array<'proteins' | 'carbs' | 'fats'>;
    const remainingPercentage = 100 - value;
    
    // Maintain the ratio between the other two macros
    const currentSum = otherMacros.reduce((sum, m) => sum + newMacros[m], 0);
    if (currentSum === 0) {
      // If both other macros are 0, distribute evenly
      otherMacros.forEach(m => {
        newMacros[m] = remainingPercentage / otherMacros.length;
      });
    } else {
      // Distribute proportionally
      otherMacros.forEach(m => {
        newMacros[m] = Math.round((newMacros[m] / currentSum) * remainingPercentage);
      });
    }
    
    // Ensure the total is exactly 100%
    const total = Object.values(newMacros).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      // Adjust the last macro to make the total exactly 100%
      newMacros[otherMacros[otherMacros.length - 1]] += (100 - total);
    }
    
    updateFormData({
      macroDistribution: newMacros
    });
  };
  
  const handlePresetSelection = (preset: string) => {
    switch (preset) {
      case 'balanced':
        updateFormData({
          macroDistribution: { proteins: 30, carbs: 40, fats: 30 }
        });
        break;
      case 'high-protein':
        updateFormData({
          macroDistribution: { proteins: 40, carbs: 30, fats: 30 }
        });
        break;
      case 'low-carb':
        updateFormData({
          macroDistribution: { proteins: 35, carbs: 25, fats: 40 }
        });
        break;
      case 'keto':
        updateFormData({
          macroDistribution: { proteins: 25, carbs: 5, fats: 70 }
        });
        break;
      default:
        break;
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };
  
  // Calculate macronutrient grams based on calories and distribution
  const proteinGrams = Math.round((formData.caloriesPerDay * (formData.macroDistribution.proteins / 100)) / 4);
  const carbGrams = Math.round((formData.caloriesPerDay * (formData.macroDistribution.carbs / 100)) / 4);
  const fatGrams = Math.round((formData.caloriesPerDay * (formData.macroDistribution.fats / 100)) / 9);
  
  return (
    <form className="wizard-step" onSubmit={handleSubmit}>
      <h2>Nutrition Goals</h2>
      <p className="step-description">
        Set your daily calorie target and macronutrient distribution.
      </p>
      
      <div className="nutrition-info-box">
        <div className="nutrition-info-item">
          <h3>Basal Metabolic Rate</h3>
          <div className="info-value">{calculatedValues.bmr} calories</div>
          <small>Calories your body burns at rest</small>
        </div>
        
        <div className="nutrition-info-item">
          <h3>Total Daily Energy</h3>
          <div className="info-value">{calculatedValues.tdee} calories</div>
          <small>Calories you burn daily with activity</small>
        </div>
        
        <div className="nutrition-info-item">
          <h3>Recommended Target</h3>
          <div className="info-value">{calculatedValues.goalCalories} calories</div>
          <small>
            Based on your {formData.goalType === 'lose' ? 'weight loss' : 
                          formData.goalType === 'gain' ? 'weight gain' : 
                          'weight maintenance'} goal
          </small>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="caloriesPerDay">Your Daily Calorie Target</label>
        <input
          type="number"
          id="caloriesPerDay"
          name="caloriesPerDay"
          min={Math.max(1200, Math.round(calculatedValues.bmr * 0.8))}
          max={Math.round(calculatedValues.tdee * 1.5)}
          value={formData.caloriesPerDay}
          onChange={handleCaloriesChange}
          required
        />
        <div className="range-ticks">
          <span>Min: {Math.max(1200, Math.round(calculatedValues.bmr * 0.8))}</span>
          <span>Recommended: {calculatedValues.goalCalories}</span>
          <span>Max: {Math.round(calculatedValues.tdee * 1.5)}</span>
        </div>
      </div>
      
      <h3>Macronutrient Distribution</h3>
      
      <div className="macro-presets">
        <button 
          type="button" 
          className={`preset-button ${formData.macroDistribution.proteins === 30 && 
                                     formData.macroDistribution.carbs === 40 && 
                                     formData.macroDistribution.fats === 30 ? 'active' : ''}`}
          onClick={() => handlePresetSelection('balanced')}
        >
          Balanced
        </button>
        <button 
          type="button" 
          className={`preset-button ${formData.macroDistribution.proteins === 40 && 
                                     formData.macroDistribution.carbs === 30 && 
                                     formData.macroDistribution.fats === 30 ? 'active' : ''}`}
          onClick={() => handlePresetSelection('high-protein')}
        >
          High Protein
        </button>
        <button 
          type="button" 
          className={`preset-button ${formData.macroDistribution.proteins === 35 && 
                                     formData.macroDistribution.carbs === 25 && 
                                     formData.macroDistribution.fats === 40 ? 'active' : ''}`}
          onClick={() => handlePresetSelection('low-carb')}
        >
          Low Carb
        </button>
        <button 
          type="button" 
          className={`preset-button ${formData.macroDistribution.proteins === 25 && 
                                     formData.macroDistribution.carbs === 5 && 
                                     formData.macroDistribution.fats === 70 ? 'active' : ''}`}
          onClick={() => handlePresetSelection('keto')}
        >
          Keto
        </button>
      </div>
      
      <div className="macro-distribution">
        <div className="macro-slider">
          <label htmlFor="protein">Protein: {formData.macroDistribution.proteins}% ({proteinGrams}g)</label>
          <input
            type="range"
            id="protein"
            min="10"
            max="60"
            step="1"
            value={formData.macroDistribution.proteins}
            onChange={(e) => handleMacroChange('proteins', Number(e.target.value))}
          />
        </div>
        
        <div className="macro-slider">
          <label htmlFor="carbs">Carbs: {formData.macroDistribution.carbs}% ({carbGrams}g)</label>
          <input
            type="range"
            id="carbs"
            min="5"
            max="70"
            step="1"
            value={formData.macroDistribution.carbs}
            onChange={(e) => handleMacroChange('carbs', Number(e.target.value))}
          />
        </div>
        
        <div className="macro-slider">
          <label htmlFor="fats">Fats: {formData.macroDistribution.fats}% ({fatGrams}g)</label>
          <input
            type="range"
            id="fats"
            min="10"
            max="75"
            step="1"
            value={formData.macroDistribution.fats}
            onChange={(e) => handleMacroChange('fats', Number(e.target.value))}
          />
        </div>
      </div>
      
      <div className="macro-chart">
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
      
      <div className="wizard-step-buttons">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="submit" className="btn-primary">
          Next
        </button>
      </div>
    </form>
  );
};

export default NutritionGoalStep; 