import React, { useState } from 'react';
import { UserProfileData } from './SetupWizard';

interface DietaryPreferencesStepProps {
  formData: UserProfileData;
  updateFormData: (data: Partial<UserProfileData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DietaryPreferencesStep: React.FC<DietaryPreferencesStepProps> = ({
  formData,
  updateFormData,
  onNext,
  onBack
}) => {
  // Local state for input fields
  const [allergyInput, setAllergyInput] = useState('');
  const [excludedFoodInput, setExcludedFoodInput] = useState('');
  const [preferredFoodInput, setPreferredFoodInput] = useState('');
  
  // Common diet types
  const dietTypes = [
    { id: 'none', label: 'No Restrictions' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'pescatarian', label: 'Pescatarian' },
    { id: 'paleo', label: 'Paleo' },
    { id: 'keto', label: 'Keto' },
    { id: 'mediterranean', label: 'Mediterranean' },
    { id: 'gluten-free', label: 'Gluten-Free' },
    { id: 'dairy-free', label: 'Dairy-Free' }
  ];
  
  // Common allergens for quick selection
  const commonAllergens = [
    'Peanuts',
    'Tree Nuts',
    'Milk',
    'Eggs',
    'Fish',
    'Shellfish',
    'Soy',
    'Wheat',
    'Gluten'
  ];
  
  const handleDietTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ dietType: e.target.value });
  };
  
  // Handle adding allergies
  const handleAddAllergy = () => {
    if (allergyInput.trim() !== '' && !formData.allergies.includes(allergyInput.trim())) {
      updateFormData({
        allergies: [...formData.allergies, allergyInput.trim()]
      });
      setAllergyInput('');
    }
  };
  
  // Handle common allergen selection
  const handleAllergenToggle = (allergen: string) => {
    if (formData.allergies.includes(allergen)) {
      updateFormData({
        allergies: formData.allergies.filter(a => a !== allergen)
      });
    } else {
      updateFormData({
        allergies: [...formData.allergies, allergen]
      });
    }
  };
  
  // Handle removing allergens
  const handleRemoveAllergy = (allergyToRemove: string) => {
    updateFormData({
      allergies: formData.allergies.filter(allergy => allergy !== allergyToRemove)
    });
  };
  
  // Handle adding excluded foods
  const handleAddExcludedFood = () => {
    if (excludedFoodInput.trim() !== '' && !formData.excludedFoods.includes(excludedFoodInput.trim())) {
      updateFormData({
        excludedFoods: [...formData.excludedFoods, excludedFoodInput.trim()]
      });
      setExcludedFoodInput('');
    }
  };
  
  // Handle removing excluded foods
  const handleRemoveExcludedFood = (foodToRemove: string) => {
    updateFormData({
      excludedFoods: formData.excludedFoods.filter(food => food !== foodToRemove)
    });
  };
  
  // Handle adding preferred foods
  const handleAddPreferredFood = () => {
    if (preferredFoodInput.trim() !== '' && !formData.preferredFoods.includes(preferredFoodInput.trim())) {
      updateFormData({
        preferredFoods: [...formData.preferredFoods, preferredFoodInput.trim()]
      });
      setPreferredFoodInput('');
    }
  };
  
  // Handle removing preferred foods
  const handleRemovePreferredFood = (foodToRemove: string) => {
    updateFormData({
      preferredFoods: formData.preferredFoods.filter(food => food !== foodToRemove)
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };
  
  return (
    <form className="wizard-step" onSubmit={handleSubmit}>
      <h2>Dietary Preferences</h2>
      <p className="step-description">
        Tell us about your dietary preferences to personalize your meal plans and food recommendations.
      </p>
      
      <div className="form-group">
        <label htmlFor="dietType">Diet Type</label>
        <select
          id="dietType"
          name="dietType"
          value={formData.dietType}
          onChange={handleDietTypeChange}
        >
          {dietTypes.map(diet => (
            <option key={diet.id} value={diet.id}>
              {diet.label}
            </option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label>Food Allergies</label>
        <div className="common-allergens">
          {commonAllergens.map(allergen => (
            <button
              key={allergen}
              type="button"
              className={`allergen-tag ${formData.allergies.includes(allergen) ? 'active' : ''}`}
              onClick={() => handleAllergenToggle(allergen)}
            >
              {allergen}
            </button>
          ))}
        </div>
        
        <div className="input-with-button">
          <input
            type="text"
            placeholder="Add other allergies..."
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
          />
          <button 
            type="button" 
            className="add-button"
            onClick={handleAddAllergy}
          >
            Add
          </button>
        </div>
        
        {formData.allergies.length > 0 && (
          <div className="tags-container">
            {formData.allergies.map(allergy => (
              <div key={allergy} className="tag">
                {allergy}
                <button 
                  type="button" 
                  className="remove-tag" 
                  onClick={() => handleRemoveAllergy(allergy)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label>Foods to Avoid</label>
        <p className="form-hint">
          Are there any foods you don't like or want to avoid?
        </p>
        
        <div className="input-with-button">
          <input
            type="text"
            placeholder="E.g., Brussels sprouts, olives..."
            value={excludedFoodInput}
            onChange={(e) => setExcludedFoodInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExcludedFood())}
          />
          <button 
            type="button" 
            className="add-button"
            onClick={handleAddExcludedFood}
          >
            Add
          </button>
        </div>
        
        {formData.excludedFoods.length > 0 && (
          <div className="tags-container">
            {formData.excludedFoods.map(food => (
              <div key={food} className="tag">
                {food}
                <button 
                  type="button" 
                  className="remove-tag" 
                  onClick={() => handleRemoveExcludedFood(food)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label>Favorite Foods</label>
        <p className="form-hint">
          What are some of your favorite foods that you'd like to see more of?
        </p>
        
        <div className="input-with-button">
          <input
            type="text"
            placeholder="E.g., sweet potatoes, salmon..."
            value={preferredFoodInput}
            onChange={(e) => setPreferredFoodInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPreferredFood())}
          />
          <button 
            type="button" 
            className="add-button"
            onClick={handleAddPreferredFood}
          >
            Add
          </button>
        </div>
        
        {formData.preferredFoods.length > 0 && (
          <div className="tags-container">
            {formData.preferredFoods.map(food => (
              <div key={food} className="tag favorite">
                {food}
                <button 
                  type="button" 
                  className="remove-tag" 
                  onClick={() => handleRemovePreferredFood(food)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
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

export default DietaryPreferencesStep; 