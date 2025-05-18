import React from 'react';
import { UserProfileData } from './SetupWizard';

interface BasicInfoStepProps {
  formData: UserProfileData;
  updateFormData: (data: Partial<UserProfileData>) => void;
  onNext: () => void;
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, updateFormData, onNext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert numeric values
    if (name === 'age' || name === 'height' || name === 'weight') {
      updateFormData({ [name]: Number(value) });
    } else {
      updateFormData({ [name]: value });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };
  
  return (
    <form className="wizard-step" onSubmit={handleSubmit}>
      <h2>Tell us about yourself</h2>
      <p className="step-description">
        We'll use this information to calculate your personalized nutrition recommendations.
      </p>
      
      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          type="number"
          id="age"
          name="age"
          min="13"
          max="120"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="gender">Gender</label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
        >
          <option value="not-specified">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
        </select>
        <small>Used for metabolic calculations only</small>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="height">Height (cm)</label>
          <input
            type="number"
            id="height"
            name="height"
            min="100"
            max="250"
            value={formData.height}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="weight">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            min="30"
            max="300"
            step="0.1"
            value={formData.weight}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="activityLevel">Activity Level</label>
        <select
          id="activityLevel"
          name="activityLevel"
          value={formData.activityLevel}
          onChange={handleChange}
        >
          <option value="sedentary">Sedentary (little or no exercise)</option>
          <option value="light">Light (light exercise 1-3 days/week)</option>
          <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
          <option value="active">Active (hard exercise 6-7 days/week)</option>
          <option value="very-active">Very Active (physical job or training twice a day)</option>
        </select>
      </div>
      
      <div className="wizard-step-buttons">
        <button type="submit" className="btn-primary">Next</button>
      </div>
    </form>
  );
};

export default BasicInfoStep; 