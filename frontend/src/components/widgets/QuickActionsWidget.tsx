import React from 'react';
import { useHistory } from 'react-router-dom';

export const QuickActionsWidget: React.FC = () => {
  const history = useHistory();
  
  const navigateTo = (path: string, action?: string) => {
    if (action) {
      history.push(`/dashboard?tab=${path}&action=${action}`);
    } else {
      history.push(`/dashboard?tab=${path}`);
    }
  };
  
  return (
    <div className="actions-grid">
      <button onClick={() => navigateTo('logs', 'logFood')} className="action-button">
        <span className="action-icon">📝</span>
        <span className="action-label">Log Food</span>
      </button>
      
      <button onClick={() => navigateTo('foods', 'addFood')} className="action-button">
        <span className="action-icon">🍎</span>
        <span className="action-label">Add Food</span>
      </button>
      
      <button onClick={() => navigateTo('meal-suggestions')} className="action-button">
        <span className="action-icon">🍽️</span>
        <span className="action-label">Get Meal Ideas</span>
      </button>
      
      <button onClick={() => navigateTo('insights-trends')} className="action-button">
        <span className="action-icon">📊</span>
        <span className="action-label">View Insights</span>
      </button>
    </div>
  );
}; 