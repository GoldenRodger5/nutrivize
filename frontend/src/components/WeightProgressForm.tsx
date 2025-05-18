import React, { useState } from 'react';
import api from '../utils/api';
import '../styles/WeightProgressForm.css';

interface WeightProgressFormProps {
  goalId: string;
  currentWeight: number;
  onWeightUpdate: (newWeight: number) => void;
}

const WeightProgressForm: React.FC<WeightProgressFormProps> = ({ 
  goalId, 
  currentWeight, 
  onWeightUpdate 
}) => {
  const [weight, setWeight] = useState<number>(currentWeight);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight) {
      setMessage({
        text: 'Please enter a valid weight',
        type: 'error'
      });
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Format current date as ISO string
      const today = new Date().toISOString().split('T')[0];
      
      // Post the progress update
      const response = await api.post(`/goals/${goalId}/progress`, {
        date: today,
        weight,
        notes: notes.trim() || undefined
      });
      
      if (response.status === 200) {
        setMessage({
          text: 'Weight progress recorded successfully!',
          type: 'success'
        });
        
        // Clear notes field
        setNotes('');
        
        // Notify parent component about the weight update
        onWeightUpdate(weight);
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating weight progress:', error);
      setMessage({
        text: 'Failed to update weight progress. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="weight-progress-form">
      <h4>Update Current Weight</h4>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group weight-input">
            <label htmlFor="weight">Current Weight (kg)</label>
            <input
              id="weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              min="20"
              max="300"
              required
            />
            <span className="imperial-conversion">
              {(weight * 2.20462).toFixed(1)} lb
            </span>
          </div>
          
          <div className="form-group notes-input">
            <label htmlFor="notes">Notes (optional)</label>
            <input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any changes to diet or exercise?"
              maxLength={100}
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Progress'}
        </button>
      </form>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="helper-text">
        <p>Track your weight regularly for more accurate progress visualization</p>
      </div>
    </div>
  );
};

export default WeightProgressForm; 