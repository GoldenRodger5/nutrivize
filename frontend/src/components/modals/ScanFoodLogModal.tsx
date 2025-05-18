import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import api from '../../utils/api';
import '../../styles/NutritionLabelScanner.css';

interface ScanFoodLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentDate: Date;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const ScanFoodLogModal: React.FC<ScanFoodLogModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  currentDate
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>("breakfast");
  const [amount, setAmount] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
      
      // Reset any errors
      setScanError(null);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Check if it's an image
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        
        // Create a preview URL
        const fileReader = new FileReader();
        fileReader.onload = () => {
          setPreviewUrl(fileReader.result as string);
        };
        fileReader.readAsDataURL(file);
        
        // Reset any errors
        setScanError(null);
      } else {
        setScanError('Please select an image file.');
      }
    }
  };
  
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setScanError('Please select an image of a nutrition label first.');
      return;
    }
    
    setIsProcessing(true);
    setScanError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('meal_type', mealType);
      formData.append('amount', amount.toString());
      formData.append('notes', notes);
      formData.append('date', currentDate.toISOString());
      
      const response = await api.post('/nutrition-label/upload-and-log', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 200) {
        console.log('Food scanned and logged successfully:', response.data);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error scanning and logging food:', error);
      setScanError('Error processing the nutrition label. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanError(null);
    setMealType("breakfast");
    setAmount(1);
    setNotes("");
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Scan Food and Log</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="scan-food-log-form">
          <div className="form-group">
            <label htmlFor="meal-type">Meal Type</label>
            <select
              id="meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              required
            >
              {MEAL_TYPES.map(type => (
                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="serving-amount">Amount</label>
            <input
              type="number"
              id="serving-amount"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 1)}
              min="0.1"
              step="0.1"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <input
              type="text"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this food"
            />
          </div>
          
          <div className="form-group">
            <label>Date</label>
            <div className="date-display">
              {format(currentDate, 'MMMM d, yyyy')}
            </div>
          </div>
          
          <div 
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            {!previewUrl ? (
              <div className="upload-prompt">
                <div className="upload-icon">📷</div>
                <p>Drag and drop a nutrition label image here, or click to select</p>
              </div>
            ) : (
              <div className="image-preview">
                <img src={previewUrl} alt="Nutrition label preview" />
              </div>
            )}
          </div>
          
          {scanError && (
            <div className="error-message">
              {scanError}
            </div>
          )}
          
          <div className="form-action-buttons">
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="primary-button"
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Scan and Log Food'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScanFoodLogModal; 