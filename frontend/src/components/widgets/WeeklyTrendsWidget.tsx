import React from 'react';
import { useHistory } from 'react-router-dom';
import { WidgetSize } from '../../types/widgets';

interface WeeklyTrendsWidgetProps {
  size?: WidgetSize;
}

export const WeeklyTrendsWidget: React.FC<WeeklyTrendsWidgetProps> = ({ size = 'medium' }) => {
  const history = useHistory();
  
  const navigateToTrends = () => {
    history.push('/dashboard?tab=insights-trends');
  };

  // Sample data - in a real app, this would come from API
  const weeklyData = [65, 80, 45, 70, 90, 60, 75];
  const weeklyLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weeklyAverage = Math.round(weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length * 19.5); // Simulating calorie calculation
  
  // Simplified display for small size
  if (size === 'small') {
    return (
      <div className="trends-container small">
        <div className="mini-chart">
          {weeklyData.slice(-4).map((value, index) => (
            <div key={index} className="mini-bar-container">
              <div 
                className="mini-bar" 
                style={{ height: `${value}%` }}
              ></div>
            </div>
          ))}
        </div>
        <button onClick={navigateToTrends} className="widget-link">View Trends</button>
      </div>
    );
  }
  
  // Enhanced display for large size
  if (size === 'large') {
    return (
      <div className="trends-container large">
        <div className="chart-placeholder">
          <div className="chart-bars">
            {weeklyData.map((value, index) => (
              <div key={index} className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{ height: `${value}%` }}
                ></div>
                <div className="chart-label">{weeklyLabels[index]}</div>
                <div className="chart-value">{value * 19.5}cal</div>
              </div>
            ))}
          </div>
        </div>
        <div className="trend-details">
          <div className="trend-stat">
            <span className="stat-label">Weekly Average:</span>
            <span className="stat-value">{weeklyAverage} calories</span>
          </div>
          <div className="trend-stat">
            <span className="stat-label">Highest Day:</span>
            <span className="stat-value">{Math.max(...weeklyData) * 19.5} calories</span>
          </div>
          <div className="trend-stat">
            <span className="stat-label">Lowest Day:</span>
            <span className="stat-value">{Math.min(...weeklyData) * 19.5} calories</span>
          </div>
        </div>
        <button onClick={navigateToTrends} className="widget-link">View Detailed Analysis</button>
      </div>
    );
  }
  
  // Default medium size
  return (
    <div className="trends-container">
      <div className="chart-placeholder">
        <div className="chart-bars">
          {weeklyData.map((value, index) => (
            <div key={index} className="chart-bar-container">
              <div 
                className="chart-bar" 
                style={{ height: `${value}%` }}
              ></div>
              <div className="chart-label">{weeklyLabels[index]}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="trend-info">Weekly average: {weeklyAverage} calories</p>
      <button onClick={navigateToTrends} className="widget-link">View Detailed Trends</button>
    </div>
  );
}; 