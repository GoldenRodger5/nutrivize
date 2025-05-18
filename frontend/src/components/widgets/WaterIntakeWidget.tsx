import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { WidgetSize } from '../../types/widgets';

interface WaterIntakeWidgetProps {
  size?: WidgetSize;
}

export const WaterIntakeWidget: React.FC<WaterIntakeWidgetProps> = ({ size = 'medium' }) => {
  const history = useHistory();
  const [glasses, setGlasses] = useState(3);
  const targetGlasses = 8;
  
  const handleAddGlass = () => {
    if (glasses < targetGlasses) {
      setGlasses(glasses + 1);
    }
  };
  
  const navigateToWaterLog = () => {
    history.push('/dashboard?tab=logs&type=water');
  };
  
  // Small size simplifies the display
  if (size === 'small') {
    return (
      <div className="water-intake-container small">
        <div className="water-mini">
          <div className="water-level" style={{ height: `${(glasses / targetGlasses) * 100}%` }}></div>
          <div className="water-glass">💧</div>
        </div>
        <div className="water-count">{glasses}/{targetGlasses}</div>
        <button onClick={handleAddGlass} className="add-water-mini">+</button>
      </div>
    );
  }
  
  // Large size shows detailed stats
  if (size === 'large') {
    return (
      <div className="water-intake-container large">
        <div className="water-progress">
          <div className="water-level" style={{ height: `${(glasses / targetGlasses) * 100}%` }}></div>
          <div className="water-glass">🥛</div>
        </div>
        
        <div className="water-stats">
          <div className="water-header">
            <h4>Water Intake</h4>
          </div>
          <div className="water-details">
            <div className="stat">
              <span className="stat-label">Glasses:</span>
              <span className="stat-value">{glasses} of {targetGlasses}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Progress:</span>
              <span className="stat-value">{Math.round((glasses / targetGlasses) * 100)}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Remaining:</span>
              <span className="stat-value">{targetGlasses - glasses} glasses</span>
            </div>
          </div>
          
          <div className="water-actions">
            <button onClick={handleAddGlass} className="add-water-button" disabled={glasses >= targetGlasses}>
              Add Glass
            </button>
            <button onClick={navigateToWaterLog} className="widget-link">View Water Log</button>
          </div>
        </div>
      </div>
    );
  }
  
  // Default medium size
  return (
    <div className="water-intake-container">
      <div className="water-progress">
        <div className="water-level" style={{ height: `${(glasses / targetGlasses) * 100}%` }}></div>
        <div className="water-glass">🥛</div>
      </div>
      
      <div className="water-stats">
        <span className="current-glasses">{glasses} of {targetGlasses} glasses</span>
        <span className="percentage">{Math.round((glasses / targetGlasses) * 100)}%</span>
      </div>
      
      <button onClick={handleAddGlass} className="add-water-button" disabled={glasses >= targetGlasses}>
        Add Glass
      </button>
      
      <button onClick={navigateToWaterLog} className="widget-link">View History</button>
    </div>
  );
}; 