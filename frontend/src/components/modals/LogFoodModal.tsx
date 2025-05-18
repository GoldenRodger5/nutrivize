import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { FoodItem } from '../../types';
import BaseModal from './BaseModal';
import '../../styles/modal.css';

interface LogFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogAdded: () => void;
  foods: FoodItem[];
  editLogId?: string | null;
}

const FOOD_UNITS = [
  "g", "ml", "oz", "fl oz", "cup", "tbsp", "tsp", "piece", "slice", "serving", "scoop", "packet"
];

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];

const LogFoodModal: React.FC<LogFoodModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogAdded, 
  foods,
  editLogId 
}) => {
  console.log("LogFoodModal rendering with isOpen:", isOpen);
  
  // Form state
  const [foodId, setFoodId] = useState<string>('');
  const [amount, setAmount] = useState<number>(1);
  const [unit, setUnit] = useState<string>('serving');
  const [mealType, setMealType] = useState<string>('breakfast');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Nutrition values
  const [calories, setCalories] = useState<number>(0);
  const [proteins, setProteins] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fats, setFats] = useState<number>(0);
  const [fiber, setFiber] = useState<number>(0);
  
  // Image upload state
  const [isImageUpload, setIsImageUpload] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }
    
    if (editLogId) {
      // If editing a log, fetch its data
      fetchLogData();
    } else {
      // Set today's date by default for new logs
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, editLogId]);
  
  const fetchLogData = async () => {
    try {
      const response = await api.get(`/logs/${editLogId}`);
      if (response.status === 200) {
        const log = response.data;
        
        setFoodId(log.food_id || '');
        setAmount(log.amount || 1);
        setUnit(log.unit || 'serving');
        setMealType(log.meal_type || 'breakfast');
        setDate(log.date || new Date().toISOString().split('T')[0]);
        setNotes(log.notes || '');
        
        setCalories(log.calories || 0);
        setProteins(log.proteins || 0);
        setCarbs(log.carbs || 0);
        setFats(log.fats || 0);
        setFiber(log.fiber || 0);
      }
    } catch (error) {
      console.error('Error fetching log data:', error);
      setError('Failed to load food log data');
    }
  };
  
  const resetForm = () => {
    setFoodId('');
    setAmount(1);
    setUnit('serving');
    setMealType('breakfast');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    
    setCalories(0);
    setProteins(0);
    setCarbs(0);
    setFats(0);
    setFiber(0);
    
    setError('');
    setIsImageUpload(false);
    setImage(null);
    setPreviewUrl(null);
  };
  
  const handleFoodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFoodId = e.target.value;
    setFoodId(selectedFoodId);
    
    if (selectedFoodId) {
      const selectedFood = foods.find(food => food._id === selectedFoodId);
      if (selectedFood) {
        setUnit(selectedFood.serving_unit);
        updateNutritionValues(selectedFood, amount, selectedFood.serving_unit);
      }
    } else {
      setCalories(0);
      setProteins(0);
      setCarbs(0);
      setFats(0);
      setFiber(0);
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value) || 0;
    setAmount(newAmount);
    
    if (foodId) {
      const selectedFood = foods.find(food => food._id === foodId);
      if (selectedFood) {
        updateNutritionValues(selectedFood, newAmount, unit);
      }
    }
  };
  
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    setUnit(newUnit);
    
    if (foodId) {
      const selectedFood = foods.find(food => food._id === foodId);
      if (selectedFood) {
        updateNutritionValues(selectedFood, amount, newUnit);
      }
    }
  };
  
  const updateNutritionValues = (food: FoodItem, newAmount: number, newUnit: string) => {
    let ratio = newAmount / food.serving_size;
    
    // If units are different, apply conversions (simplified)
    if (newUnit !== food.serving_unit) {
      // Basic conversion factors (this is simplified and should be expanded in a real app)
      if (newUnit === 'oz' && food.serving_unit === 'g') {
        ratio = (newAmount * 28.35) / food.serving_size;
      } else if (newUnit === 'g' && food.serving_unit === 'oz') {
        ratio = newAmount / (food.serving_size * 28.35);
      }
      // Add more conversion factors as needed
    }
    
    setCalories(Math.round(food.calories * ratio));
    setProteins(Math.round(food.proteins * ratio * 10) / 10);
    setCarbs(Math.round(food.carbs * ratio * 10) / 10);
    setFats(Math.round(food.fats * ratio * 10) / 10);
    setFiber(Math.round((food.fiber || 0) * ratio * 10) / 10);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!foodId) {
      setError('Please select a food');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    const selectedFood = foods.find(food => food._id === foodId);
    
    const logData = {
      food_id: foodId,
      name: selectedFood?.name || '',
      date,
      meal_type: mealType,
      amount,
      unit,
      calories,
      proteins,
      carbs,
      fats,
      fiber,
      notes
    };
    
    try {
      let response;
      
      if (editLogId) {
        response = await api.put(`/logs/${editLogId}`, logData);
      } else {
        response = await api.post('/logs/', logData);
      }
      
      if (response.status === 200 || response.status === 201) {
        onLogAdded();
        resetForm();
        onClose();
      } else {
        setError('Failed to save food log');
      }
    } catch (error) {
      console.error('Error saving food log:', error);
      setError('An error occurred while saving the food log');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const toggleImageUpload = () => {
    setIsImageUpload(!isImageUpload);
    if (!isImageUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleProcessImage = async () => {
    if (!image) return;
    
    setIsProcessingImage(true);
    
    // Create form data for the API request
    const formData = new FormData();
    formData.append('file', image);
    formData.append('meal_type', mealType);
    formData.append('amount', amount.toString());
    formData.append('date', date);
    if (notes) formData.append('notes', notes);
    
    try {
      const response = await fetch('/api/nutrition-label/upload-and-log', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        onLogAdded();
        resetForm();
        onClose();
      } else {
        setError('Failed to process image and log food');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Error processing nutrition label image');
    } finally {
      setIsProcessingImage(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={editLogId ? 'Edit Food Log' : 'Log Food'}
    >
      <div className="modal-tabs">
        <button 
          type="button"
          className={!isImageUpload ? "modal-tab active" : "modal-tab"}
          onClick={() => setIsImageUpload(false)}
        >
          Select from Index
        </button>
        <button 
          type="button"
          className={isImageUpload ? "modal-tab active" : "modal-tab"}
          onClick={toggleImageUpload}
        >
          Scan Nutrition Label
        </button>
      </div>
      
      {isImageUpload ? (
        <div className="image-upload-section">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageSelect} 
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          
          <button 
            type="button" 
            className="modal-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Image
          </button>
          
          {previewUrl && (
            <div className="preview-container">
              <img src={previewUrl} alt="Nutrition label preview" className="image-preview" />
              
              <div className="form-row">
                <div className="modal-form-group">
                  <label htmlFor="img-meal-type">Meal Type</label>
                  <select
                    id="img-meal-type"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                  >
                    {MEAL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="modal-form-group">
                  <label htmlFor="img-amount">Amount</label>
                  <input
                    id="img-amount"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 1)}
                  />
                </div>
              </div>
              
              <div className="modal-form-group">
                <label htmlFor="img-date">Date</label>
                <input
                  id="img-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              
              <div className="modal-form-group">
                <label htmlFor="img-notes">Notes</label>
                <textarea
                  id="img-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  rows={2}
                ></textarea>
              </div>
              
              <button 
                type="button" 
                className="modal-button modal-button-primary"
                onClick={handleProcessImage}
                disabled={isProcessingImage}
              >
                {isProcessingImage ? 'Processing...' : 'Process & Log Food'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="modal-form-group">
            <label htmlFor="food">Food</label>
            <select
              id="food"
              value={foodId}
              onChange={handleFoodSelect}
              required
            >
              <option value="">Select a food</option>
              {foods.map(food => (
                <option key={food._id} value={food._id}>{food.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="modal-form-group">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                min="0.1"
                step="0.1"
                value={amount}
                onChange={handleAmountChange}
                required
              />
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="unit">Unit</label>
              <select
                id="unit"
                value={unit}
                onChange={handleUnitChange}
                required
              >
                {FOOD_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="modal-form-group">
              <label htmlFor="meal-type">Meal Type</label>
              <select
                id="meal-type"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                required
              >
                {MEAL_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div className="modal-form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
            ></textarea>
          </div>
          
          {foodId && (
            <div className="nutrition-summary">
              <h4>Nutrition Information</h4>
              <div className="nutrition-values">
                <div>Calories: {calories}</div>
                <div>Protein: {proteins}g</div>
                <div>Carbs: {carbs}g</div>
                <div>Fat: {fats}g</div>
                <div>Fiber: {fiber}g</div>
              </div>
            </div>
          )}
          
          <div className="modal-buttons">
            <button 
              type="button" 
              className="modal-button modal-button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="modal-button modal-button-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : editLogId ? 'Update Log' : 'Log Food'}
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
};

export default LogFoodModal; 