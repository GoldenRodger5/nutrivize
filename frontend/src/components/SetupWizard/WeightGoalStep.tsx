import React, { useState, useEffect } from 'react';
import { UserProfileData } from './SetupWizard';

interface WeightGoalStepProps {
  formData: UserProfileData;
  updateFormData: (data: Partial<UserProfileData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const WeightGoalStep: React.FC<WeightGoalStepProps> = ({ 
  formData, 
  updateFormData, 
  onNext, 
  onBack 
}) => {
  // Local state for weekly rate display
  const [weeklyRateDisplay, setWeeklyRateDisplay] = useState<string>('0.5');
  
  // Update the local weekly rate display whenever formData changes
  useEffect(() => {
    setWeeklyRateDisplay(formData.weeklyRate.toString());
  }, [formData.weeklyRate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric values
    if (name === 'targetWeight' || name === 'weeklyRate') {
      updateFormData({ [name]: Number(value) });
    } else {
      updateFormData({ [name]: value });
    }
  };
  
  const handleGoalTypeChange = (goalType: 'lose' | 'maintain' | 'gain') => {
    updateFormData({ goalType });
    
    // If it's maintain, set target weight equal to current weight
    if (goalType === 'maintain') {
      updateFormData({ targetWeight: formData.weight });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };
  
  return (
    <form className="wizard-step" onSubmit={handleSubmit}>
      <h2>What's your weight goal?</h2>
      <p className="step-description">
        Tell us what you want to achieve, and we'll create a plan to help you get there.
      </p>
      
      <div className="weight-goal-options">
        <div 
          className={`goal-option ${formData.goalType === 'lose' ? 'selected' : ''}`}
          onClick={() => handleGoalTypeChange('lose')}
        >
          <div className="goal-icon">⬇️</div>
          <h3>Lose Weight</h3>
          <p>I want to lose weight and improve my health</p>
        </div>
        
        <div 
          className={`goal-option ${formData.goalType === 'maintain' ? 'selected' : ''}`}
          onClick={() => handleGoalTypeChange('maintain')}
        >
          <div className="goal-icon">⚖️</div>
          <h3>Maintain Weight</h3>
          <p>I want to maintain my current weight</p>
        </div>
        
        <div 
          className={`goal-option ${formData.goalType === 'gain' ? 'selected' : ''}`}
          onClick={() => handleGoalTypeChange('gain')}
        >
          <div className="goal-icon">⬆️</div>
          <h3>Gain Weight</h3>
          <p>I want to gain weight and build muscle</p>
        </div>
      </div>
      
      {formData.goalType !== 'maintain' && (
        <>
          <div className="form-group">
            <label htmlFor="targetWeight">Target Weight (kg)</label>
            <input
              type="number"
              id="targetWeight"
              name="targetWeight"
              min={formData.goalType === 'lose' ? 30 : formData.weight}
              max={formData.goalType === 'gain' ? 300 : formData.weight}
              step="0.1"
              value={formData.targetWeight}
              onChange={handleChange}
              required
            />
            <small>
              {formData.goalType === 'lose' 
                ? `You want to lose ${(formData.weight - formData.targetWeight).toFixed(1)} kg`
                : `You want to gain ${(formData.targetWeight - formData.weight).toFixed(1)} kg`}
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="weeklyRate">
              {formData.goalType === 'lose' ? 'Weekly Weight Loss Rate (kg)' : 'Weekly Weight Gain Rate (kg)'}
            </label>
            <input
              type="range"
              id="weeklyRate"
              name="weeklyRate"
              min={formData.goalType === 'lose' ? 0.25 : 0.1}
              max={formData.goalType === 'lose' ? 1 : 0.5}
              step="0.05"
              value={formData.weeklyRate}
              onChange={handleChange}
            />
            <div className="range-value">{formData.weeklyRate} kg per week</div>
            <small>
              {formData.goalType === 'lose' 
                ? 'A safe and sustainable weight loss is usually 0.5-1 kg per week' 
                : 'A healthy weight gain is usually 0.25-0.5 kg per week'}
            </small>
          </div>
          
          {formData.goalType === 'lose' && formData.weeklyRate > 0.75 && (
            <div className="info-box warning">
              <p>
                <strong>Note:</strong> Losing more than 0.75 kg per week may be challenging to sustain.
                For better long-term results, consider a more moderate rate.
              </p>
            </div>
          )}
          
          <div className="estimated-time">
            <h4>Estimated Time to Goal</h4>
            <p>
              {formData.goalType === 'lose' 
                ? `About ${Math.ceil((formData.weight - formData.targetWeight) / formData.weeklyRate)} weeks`
                : formData.goalType === 'gain'
                  ? `About ${Math.ceil((formData.targetWeight - formData.weight) / formData.weeklyRate)} weeks`
                  : 'Ongoing maintenance'}
            </p>
          </div>
        </>
      )}
      
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

export default WeightGoalStep; 