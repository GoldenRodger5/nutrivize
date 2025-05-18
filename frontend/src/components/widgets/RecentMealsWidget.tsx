import React from 'react';
import { useHistory } from 'react-router-dom';
import { WidgetSize } from '../../types/widgets';

interface RecentMealsWidgetProps {
  todaysLogs: any[] | null | undefined;
  size?: WidgetSize;
}

export const RecentMealsWidget: React.FC<RecentMealsWidgetProps> = ({ 
  todaysLogs = [],
  size = 'medium'
}) => {
  const history = useHistory();
  
  // Ensure todaysLogs is always an array
  const logs = Array.isArray(todaysLogs) ? todaysLogs : [];
  
  // Sort meals by most recent first
  const sortedLogs = [...logs].sort((a, b) => {
    // If log has timestamp, sort by that; otherwise, sort by ID (assuming newer IDs are larger)
    if (a.timestamp && b.timestamp) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return (b._id || '').localeCompare(a._id || '');
  });
  
  const navigateToLogs = () => {
    history.push('/dashboard?tab=logs');
  };
  
  if (logs.length === 0) {
    return (
      <div className="empty-meals">
        <p>No meals logged today</p>
        <button onClick={navigateToLogs} className="widget-button">Log a Meal</button>
      </div>
    );
  }
  
  // For small widget, just show count and last meal
  if (size === 'small') {
    const latestMeal = sortedLogs[0];
    
    return (
      <div className="meals-compact">
        <div className="meal-count">{logs.length} meals today</div>
        {latestMeal && (
          <div className="latest-meal">
            <div className="meal-name">{latestMeal.name}</div>
            <div className="meal-calories">{latestMeal.calories.toFixed(0)} cal</div>
          </div>
        )}
        <button onClick={navigateToLogs} className="widget-link">View</button>
      </div>
    );
  }
  
  // For large widget, show more meals with more detail
  if (size === 'large') {
    return (
      <div className="meals-list large">
        {sortedLogs.slice(0, 5).map((log, index) => (
          <div key={index} className="meal-item">
            <div className="meal-details">
              <div className="meal-name">{log.name}</div>
              <div className="meal-type">{log.meal_type}</div>
              <div className="meal-amount">{log.amount} {log.unit}</div>
            </div>
            <div className="meal-nutrition">
              <span className="calories">{log.calories.toFixed(0)} cal</span>
              <div className="nutrient-pills">
                <span className="pill proteins">{log.proteins.toFixed(1)}g P</span>
                <span className="pill carbs">{log.carbs.toFixed(1)}g C</span>
                <span className="pill fats">{log.fats.toFixed(1)}g F</span>
              </div>
            </div>
          </div>
        ))}
        
        {logs.length > 5 && (
          <div className="more-meals">
            +{logs.length - 5} more meals logged today
          </div>
        )}
        
        <button onClick={navigateToLogs} className="widget-link">View All Meals</button>
      </div>
    );
  }
  
  // Default medium size
  return (
    <div className="meals-list">
      {sortedLogs.slice(0, 3).map((log, index) => (
        <div key={index} className="meal-item">
          <div className="meal-details">
            <div className="meal-name">{log.name}</div>
            <div className="meal-type">{log.meal_type}</div>
          </div>
          <div className="meal-nutrition">
            <span className="calories">{log.calories.toFixed(0)} cal</span>
            <span className="proteins">{log.proteins.toFixed(1)}g P</span>
            <span className="carbs">{log.carbs.toFixed(1)}g C</span>
            <span className="fats">{log.fats.toFixed(1)}g F</span>
          </div>
        </div>
      ))}
      
      {logs.length > 3 && (
        <div className="more-meals">
          +{logs.length - 3} more meals logged today
        </div>
      )}
      
      <button onClick={navigateToLogs} className="widget-link">View All Meals</button>
    </div>
  );
}; 