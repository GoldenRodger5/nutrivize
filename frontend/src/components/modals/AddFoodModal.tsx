import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FoodItem } from '../../types';
import BaseModal from './BaseModal';
import '../../styles/modal.css';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded: () => void;
  editFoodId?: string | null;
  foods: FoodItem[];
}

// Common food units
const FOOD_UNITS = [
  "g", "ml", "oz", "fl oz", "cup", "tbsp", "tsp", "piece", "slice", "serving", "scoop", "packet"
];

const AddFoodModal: React.FC<AddFoodModalProps> = ({ 
  isOpen, 
  onClose, 
  onFoodAdded, 
  editFoodId,
  foods 
}) => {
  console.log("AddFoodModal component rendering with isOpen:", isOpen, "editFoodId:", editFoodId);
  
  // Add console logging for prop changes
  useEffect(() => {
    console.log("AddFoodModal isOpen prop changed:", isOpen);
  }, [isOpen]);
  
  const [name, setName] = useState<string>('');
  const [servingSize, setServingSize] = useState<number>(100);
  const [servingUnit, setServingUnit] = useState<string>('g');
  const [calories, setCalories] = useState<number>(0);
  const [proteins, setProteins] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fats, setFats] = useState<number>(0);
  const [fiber, setFiber] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isImageUpload, setIsImageUpload] = useState<boolean>(false);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  
  // For image upload and OCR
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Reset form when modal opens/closes
    if (!isOpen) {
      resetForm();
      return;
    }
    
    // If editing an existing food, populate the form
    if (editFoodId) {
      const foodToEdit = foods.find(f => f._id === editFoodId);
      if (foodToEdit) {
        setName(foodToEdit.name || '');
        setServingSize(foodToEdit.serving_size || 100);
        setServingUnit(foodToEdit.serving_unit || 'g');
        setCalories(foodToEdit.calories || 0);
        setProteins(foodToEdit.proteins || 0);
        setCarbs(foodToEdit.carbs || 0);
        setFats(foodToEdit.fats || 0);
        setFiber(foodToEdit.fiber || 0);
      }
    }
  }, [isOpen, editFoodId, foods]);
  
  const resetForm = () => {
    setName('');
    setServingSize(100);
    setServingUnit('g');
    setCalories(0);
    setProteins(0);
    setCarbs(0);
    setFats(0);
    setFiber(0);
    setError('');
    setIsImageUpload(false);
    setImage(null);
    setPreviewUrl(null);
    setOcrResult(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Food name is required');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    const foodData = {
      name,
      serving_size: servingSize,
      serving_unit: servingUnit,
      calories,
      proteins,
      carbs,
      fats,
      fiber
    };
    
    try {
      let response;
      
      if (editFoodId) {
        response = await api.put(`/foods/${editFoodId}`, foodData);
      } else {
        response = await api.post('/foods/', foodData);
      }
      
      if (response.status === 200 || response.status === 201) {
        onFoodAdded();
        resetForm();
      } else {
        setError('Failed to save food data');
      }
    } catch (error) {
      console.error('Error saving food:', error);
      setError('An error occurred while saving food data');
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
  
  const handleProcessImage = async () => {
    if (!image) return;
    
    setIsProcessingImage(true);
    
    // Create form data for the API request
    const formData = new FormData();
    formData.append('file', image);
    
    try {
      const response = await fetch('/api/nutrition-label/test-upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setOcrResult(result);
        
        // Update the form with OCR results
        if (result && result.nutrition) {
          setName(result.product_name || '');
          setServingSize(result.serving_size?.amount || 100);
          setServingUnit(result.serving_size?.unit || 'g');
          setCalories(result.nutrition.calories || 0);
          setProteins(result.nutrition.protein || 0);
          setCarbs(result.nutrition.carbohydrates || 0);
          setFats(result.nutrition.fat || 0);
          setFiber(result.nutrition.fiber || 0);
        }
      } else {
        setError('Failed to process image');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Error processing nutrition label image');
    } finally {
      setIsProcessingImage(false);
    }
  };
  
  const toggleImageUpload = () => {
    setIsImageUpload(!isImageUpload);
    if (!isImageUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  if (!isOpen) {
    console.log("AddFoodModal not rendering because isOpen is false");
    return null;
  }
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={editFoodId ? 'Edit Food' : 'Add New Food'}
    >
      <form onSubmit={handleSubmit} className="modal-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="modal-tabs">
          <button 
            type="button"
            className={!isImageUpload ? "modal-tab active" : "modal-tab"}
            onClick={() => setIsImageUpload(false)}
          >
            Manual Entry
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
                
                <button 
                  type="button" 
                  className="modal-button modal-button-primary"
                  onClick={handleProcessImage}
                  disabled={isProcessingImage}
                >
                  {isProcessingImage ? 'Processing...' : 'Process Nutrition Label'}
                </button>
              </div>
            )}
            
            {ocrResult && (
              <div className="ocr-results">
                <h4>Detected Information</h4>
                <p>Product: {ocrResult.product_name || 'Unknown'}</p>
                <p>Serving Size: {ocrResult.serving_size?.amount || '??'} {ocrResult.serving_size?.unit || '??'}</p>
                <p>Calories: {ocrResult.nutrition?.calories || '??'}</p>
                <p>Review and adjust the values below if needed</p>
              </div>
            )}
          </div>
        ) : null}
        
        <div className="modal-form-group">
          <label htmlFor="name">Food Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter food name"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="modal-form-group">
            <label htmlFor="servingSize">Serving Size</label>
            <input
              id="servingSize"
              type="number"
              min="0"
              step="0.1"
              value={servingSize}
              onChange={(e) => setServingSize(parseFloat(e.target.value) || 0)}
              placeholder="Serving size"
            />
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="servingUnit">Unit</label>
            <select
              id="servingUnit"
              value={servingUnit}
              onChange={(e) => setServingUnit(e.target.value)}
            >
              {FOOD_UNITS.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="modal-form-group">
          <label htmlFor="calories">Calories</label>
          <input
            id="calories"
            type="number"
            min="0"
            step="1"
            value={calories}
            onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
            placeholder="Calories per serving"
          />
        </div>
        
        <div className="form-row">
          <div className="modal-form-group">
            <label htmlFor="proteins">Protein (g)</label>
            <input
              id="proteins"
              type="number"
              min="0"
              step="0.1"
              value={proteins}
              onChange={(e) => setProteins(parseFloat(e.target.value) || 0)}
              placeholder="Protein"
            />
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="carbs">Carbs (g)</label>
            <input
              id="carbs"
              type="number"
              min="0"
              step="0.1"
              value={carbs}
              onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
              placeholder="Carbohydrates"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="modal-form-group">
            <label htmlFor="fats">Fat (g)</label>
            <input
              id="fats"
              type="number"
              min="0"
              step="0.1"
              value={fats}
              onChange={(e) => setFats(parseFloat(e.target.value) || 0)}
              placeholder="Fat"
            />
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="fiber">Fiber (g)</label>
            <input
              id="fiber"
              type="number"
              min="0"
              step="0.1"
              value={fiber}
              onChange={(e) => setFiber(parseFloat(e.target.value) || 0)}
              placeholder="Fiber"
            />
          </div>
        </div>
        
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
            {isSaving ? 'Saving...' : editFoodId ? 'Update Food' : 'Add Food'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default AddFoodModal; 