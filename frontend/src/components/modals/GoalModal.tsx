import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Goal } from '../../types';
import BaseModal from './BaseModal';
import '../../styles/modal.css';

interface NutritionTarget {
  name: string;
  daily_calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalAdded: () => void;
  editGoalId?: string | null;
  currentGoal: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ 
  isOpen, 
  onClose, 
  onGoalAdded, 
  editGoalId,
  currentGoal 
}) => {
  console.log("GoalModal rendering with isOpen:", isOpen, "editGoalId:", editGoalId);
  
  const [goalType, setGoalType] = useState<string>('weight loss');
  const [currentWeight, setCurrentWeight] = useState<number>(70);
  const [targetWeight, setTargetWeight] = useState<number>(65);
  const [weeklyRate, setWeeklyRate] = useState<number>(0.5);
  const [dailyCalories, setDailyCalories] = useState<number>(2000);
  const [protein, setProtein] = useState<number>(150);
  const [carbs, setCarbs] = useState<number>(200);
  const [fats, setFats] = useState<number>(65);
  const [fiber, setFiber] = useState<number>(25);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }
    
    // If editing an existing goal, populate the form
    if (editGoalId) {
      fetchGoalData();
    } else if (currentGoal) {
      // If creating a new goal, use the current goal as a starting point
      populateFromGoal(currentGoal);
    }
  }, [isOpen, editGoalId, currentGoal]);
  
  const fetchGoalData = async () => {
    try {
      const response = await api.get(`/goals/${editGoalId}`);
      if (response.status === 200) {
        populateFromGoal(response.data);
      }
    } catch (error) {
      console.error('Error fetching goal data:', error);
      setError('Failed to load goal data');
    }
  };
  
  const populateFromGoal = (goal: Goal) => {
    setGoalType(goal.type || 'weight loss');
    
    if (goal.weight_target) {
      setCurrentWeight(goal.weight_target.current || 70);
      setTargetWeight(goal.weight_target.goal || 65);
      setWeeklyRate(goal.weight_target.weekly_rate || 0.5);
    }
    
    if (goal.nutrition_targets && goal.nutrition_targets.length > 0) {
      const targets = goal.nutrition_targets[0];
      setDailyCalories(targets.daily_calories || 2000);
      setProtein(targets.proteins || 150);
      setCarbs(targets.carbs || 200);
      setFats(targets.fats || 65);
      setFiber(targets.fiber || 25);
    }
  };
  
  const resetForm = () => {
    setGoalType('weight loss');
    setCurrentWeight(70);
    setTargetWeight(65);
    setWeeklyRate(0.5);
    setDailyCalories(2000);
    setProtein(150);
    setCarbs(200);
    setFats(65);
    setFiber(25);
    setError('');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setError('');
    
    // Prepare the goal data
    const goalData = {
      type: goalType,
      weight_target: {
        current: currentWeight,
        goal: targetWeight,
        weekly_rate: weeklyRate
      },
      nutrition_targets: [{
        name: 'Default',
        daily_calories: dailyCalories,
        proteins: protein,
        carbs,
        fats,
        fiber
      }]
    };
    
    console.log("Submitting goal data:", goalData);
    
    try {
      let success = false;
      
      if (editGoalId) {
        console.log(`Updating goal ${editGoalId}`);
        const response = await api.put(`/goals/${editGoalId}`, goalData);
        success = response.status === 200;
      } else {
        console.log("Creating new goal");
        const response = await api.post('/goals/', goalData);
        success = response.status === 200 || response.status === 201;
      }
      
      if (success) {
        console.log("Goal saved successfully");
        onGoalAdded();
        onClose();
      } else {
        setError('Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('An error occurred while saving the goal');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={editGoalId ? 'Edit Goal' : 'Add New Goal'}
    >
      <form onSubmit={handleSubmit} className="modal-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="modal-form-group">
          <label htmlFor="goal-type">Goal Type</label>
          <select
            id="goal-type"
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
          >
            <option value="weight loss">Weight Loss</option>
            <option value="weight gain">Weight Gain</option>
            <option value="maintain">Maintain Weight</option>
          </select>
        </div>
        
        <h4>Weight Target</h4>
        
        <div className="form-row">
          <div className="modal-form-group">
            <label htmlFor="current-weight">Current Weight (kg)</label>
            <input
              id="current-weight"
              type="number"
              min="30"
              step="0.1"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 70)}
            />
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="target-weight">Target Weight (kg)</label>
            <input
              id="target-weight"
              type="number"
              min="30"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 65)}
            />
          </div>
        </div>
        
        <div className="modal-form-group">
          <label htmlFor="weekly-rate">Weekly Rate (kg)</label>
          <input
            id="weekly-rate"
            type="number"
            min="0.1"
            max="1"
            step="0.1"
            value={weeklyRate}
            onChange={(e) => setWeeklyRate(parseFloat(e.target.value) || 0.5)}
          />
          <small>Recommended: 0.5-1kg per week for weight loss/gain</small>
        </div>
        
        <h4>Nutrition Targets</h4>
        
        <div className="modal-form-group">
          <label htmlFor="daily-calories">Daily Calories</label>
          <input
            id="daily-calories"
            type="number"
            min="1000"
            step="50"
            value={dailyCalories}
            onChange={(e) => setDailyCalories(parseInt(e.target.value) || 2000)}
          />
        </div>
        
        <div className="form-row">
          <div className="modal-form-group">
            <label htmlFor="protein">Protein (g)</label>
            <input
              id="protein"
              type="number"
              min="20"
              step="5"
              value={protein}
              onChange={(e) => setProtein(parseInt(e.target.value) || 150)}
            />
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="carbs">Carbs (g)</label>
            <input
              id="carbs"
              type="number"
              min="20"
              step="5"
              value={carbs}
              onChange={(e) => setCarbs(parseInt(e.target.value) || 200)}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="modal-form-group">
            <label htmlFor="fats">Fats (g)</label>
            <input
              id="fats"
              type="number"
              min="20"
              step="5"
              value={fats}
              onChange={(e) => setFats(parseInt(e.target.value) || 65)}
            />
          </div>
          
          <div className="modal-form-group">
            <label htmlFor="fiber">Fiber (g)</label>
            <input
              id="fiber"
              type="number"
              min="10"
              step="5"
              value={fiber}
              onChange={(e) => setFiber(parseInt(e.target.value) || 25)}
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
            {isSaving ? 'Saving...' : editGoalId ? 'Update Goal' : 'Add Goal'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default GoalModal; 