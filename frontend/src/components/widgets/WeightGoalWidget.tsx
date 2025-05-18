import React from 'react';
import { useHistory } from 'react-router-dom';

interface WeightGoalWidgetProps {
  goal: any;
}

export const WeightGoalWidget: React.FC<WeightGoalWidgetProps> = ({ goal }) => {
  const history = useHistory();
  
  const navigateToGoals = () => {
    history.push('/dashboard?tab=goals');
  };

  if (!goal?.weight_target) {
    return (
      <div className="empty-goal">
        <p>No weight goal set</p>
        <button onClick={navigateToGoals} className="widget-button">Set a Goal</button>
      </div>
    );
  }
  
  // Calculate progress percentage
  const goalDiff = Math.abs(goal.weight_target.current - goal.weight_target.goal);
  const progressDiff = goal.type === 'weight loss' 
    ? Math.abs(goal.weight_target.current - goal.weight_target.goal)
    : Math.abs(goal.weight_target.goal - goal.weight_target.current);
  
  const progressPercent = Math.min(100, Math.max(0, (progressDiff / goalDiff) * 100));
  
  return (
    <div className="goal-summary">
      <div className="weight-progress">
        <div className="current-weight">
          <span className="weight-label">Current</span>
          <span className="weight-value">{goal.weight_target.current} kg</span>
        </div>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        
        <div className="goal-weight">
          <span className="weight-label">Goal</span>
          <span className="weight-value">{goal.weight_target.goal} kg</span>
        </div>
      </div>
      
      <div className="goal-details">
        <div className="goal-type">
          {goal.type === 'weight loss' ? 'Weight Loss' : 
           goal.type === 'weight gain' ? 'Weight Gain' : 'Weight Maintenance'}
        </div>
        <div className="weekly-rate">
          {goal.weight_target.weekly_rate} kg / week
        </div>
      </div>
      
      <button onClick={navigateToGoals} className="widget-link">Track Progress</button>
    </div>
  );
}; 