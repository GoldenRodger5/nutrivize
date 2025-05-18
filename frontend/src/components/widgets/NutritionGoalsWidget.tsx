import React from 'react';
import { useHistory } from 'react-router-dom';
import { WidgetSize } from '../../types/widgets';

interface NutritionGoalsWidgetProps {
  goal: any;
  size?: WidgetSize;
}

export const NutritionGoalsWidget: React.FC<NutritionGoalsWidgetProps> = ({ 
  goal,
  size = 'medium' 
}) => {
  const history = useHistory();
  
  const navigateToGoals = () => {
    history.push('/dashboard?tab=goals');
  };
  
  if (!goal?.nutrition_targets || goal.nutrition_targets.length === 0) {
    return (
      <div className="empty-nutrition-goals">
        <p>No nutrition goals set</p>
        <button onClick={navigateToGoals} className="widget-button">Set Nutrition Goals</button>
      </div>
    );
  }
  
  const nutritionTarget = goal.nutrition_targets[0]; // Use the primary nutrition target
  
  // For small widget
  if (size === 'small') {
    return (
      <div className="nutrition-goals-container small">
        <div className="primary-goal">
          <span className="goal-value">{nutritionTarget.daily_calories}</span>
          <span className="goal-label">cal/day</span>
        </div>
        <button onClick={navigateToGoals} className="widget-link">Details</button>
      </div>
    );
  }
  
  // For large widget
  if (size === 'large') {
    return (
      <div className="nutrition-goals-container large">
        <div className="nutrition-goals-header">
          <h4>Nutrition Targets</h4>
        </div>
        
        <div className="nutrition-target-details">
          <div className="target-item primary">
            <span className="item-label">Daily Calories:</span>
            <span className="item-value">{nutritionTarget.daily_calories} cal</span>
          </div>
          
          <div className="macros-distribution">
            <div className="target-item">
              <div className="macro-label">Proteins</div>
              <div className="macro-bar-container">
                <div 
                  className="macro-bar protein"
                  style={{ 
                    width: `${(nutritionTarget.proteins * 4 / nutritionTarget.daily_calories) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="macro-value">{nutritionTarget.proteins}g</div>
              <div className="macro-percent">
                {Math.round((nutritionTarget.proteins * 4 / nutritionTarget.daily_calories) * 100)}%
              </div>
            </div>
            
            <div className="target-item">
              <div className="macro-label">Carbs</div>
              <div className="macro-bar-container">
                <div 
                  className="macro-bar carbs"
                  style={{ 
                    width: `${(nutritionTarget.carbs * 4 / nutritionTarget.daily_calories) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="macro-value">{nutritionTarget.carbs}g</div>
              <div className="macro-percent">
                {Math.round((nutritionTarget.carbs * 4 / nutritionTarget.daily_calories) * 100)}%
              </div>
            </div>
            
            <div className="target-item">
              <div className="macro-label">Fats</div>
              <div className="macro-bar-container">
                <div 
                  className="macro-bar fats"
                  style={{ 
                    width: `${(nutritionTarget.fats * 9 / nutritionTarget.daily_calories) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="macro-value">{nutritionTarget.fats}g</div>
              <div className="macro-percent">
                {Math.round((nutritionTarget.fats * 9 / nutritionTarget.daily_calories) * 100)}%
              </div>
            </div>
          </div>
          
          <div className="goal-type-info">
            {goal.type === 'weight loss' ? 'Weight Loss Plan' : 
             goal.type === 'weight gain' ? 'Weight Gain Plan' : 'Weight Maintenance Plan'}
          </div>
        </div>
        
        <button onClick={navigateToGoals} className="widget-link">Update Nutrition Goals</button>
      </div>
    );
  }
  
  // Default medium widget
  return (
    <div className="nutrition-goals-container">
      <div className="nutrition-targets-summary">
        <div className="calorie-target">
          <span className="target-label">Daily Calories</span>
          <span className="target-value">{nutritionTarget.daily_calories}</span>
        </div>
        
        <div className="macros-breakdown">
          <div className="macro">
            <span className="macro-label">Protein</span>
            <span className="macro-value">{nutritionTarget.proteins}g</span>
          </div>
          <div className="macro">
            <span className="macro-label">Carbs</span>
            <span className="macro-value">{nutritionTarget.carbs}g</span>
          </div>
          <div className="macro">
            <span className="macro-label">Fats</span>
            <span className="macro-value">{nutritionTarget.fats}g</span>
          </div>
        </div>
      </div>
      
      <button onClick={navigateToGoals} className="widget-link">Edit Nutrition Goals</button>
    </div>
  );
}; 