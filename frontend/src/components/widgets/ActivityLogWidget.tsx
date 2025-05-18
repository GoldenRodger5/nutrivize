import React from 'react';
import { useHistory } from 'react-router-dom';
import { WidgetSize } from '../../types/widgets';

interface ActivityLogWidgetProps {
  size?: WidgetSize;
}

export const ActivityLogWidget: React.FC<ActivityLogWidgetProps> = ({ size = 'medium' }) => {
  const history = useHistory();
  
  // Sample activities data
  const activities = [
    { name: 'Morning Run', duration: 30, calories: 320, time: '7:30 AM', type: 'cardio' },
    { name: 'Yoga', duration: 45, calories: 180, time: '6:00 PM', type: 'flexibility' },
    { name: 'Weight Training', duration: 60, calories: 250, time: '12:30 PM', type: 'strength' }
  ];
  
  const navigateToActivity = () => {
    history.push('/dashboard?tab=activity');
  };
  
  // Calculate total calories
  const totalCalories = activities.reduce((total, activity) => total + activity.calories, 0);
  const totalDuration = activities.reduce((total, activity) => total + activity.duration, 0);
  
  // Small size view
  if (size === 'small') {
    return (
      <div className="activity-container small">
        <div className="activity-summary">
          <div className="activity-count">{activities.length} Activities</div>
          <div className="activity-total-calories">{totalCalories} cal</div>
        </div>
        <button onClick={navigateToActivity} className="widget-link">Log</button>
      </div>
    );
  }
  
  // Large size view with more details
  if (size === 'large') {
    return (
      <div className="activity-container large">
        <div className="activity-header">
          <h4>Today's Activities</h4>
          <div className="activity-summary-stats">
            <div className="stat">
              <span className="stat-value">{totalCalories}</span>
              <span className="stat-label">calories</span>
            </div>
            <div className="stat">
              <span className="stat-value">{totalDuration}</span>
              <span className="stat-label">minutes</span>
            </div>
            <div className="stat">
              <span className="stat-value">{activities.length}</span>
              <span className="stat-label">activities</span>
            </div>
          </div>
        </div>
        
        <div className="activity-list">
          {activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-details">
                <div className="activity-type-indicator" data-type={activity.type}></div>
                <div className="activity-name">{activity.name}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
              <div className="activity-stats">
                <span className="activity-duration">{activity.duration} min</span>
                <span className="activity-calories">{activity.calories} cal</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="activity-actions">
          <button onClick={navigateToActivity} className="widget-button">Log New Activity</button>
          <button onClick={navigateToActivity} className="widget-link">View Activity History</button>
        </div>
      </div>
    );
  }
  
  // Default medium view
  return (
    <div className="activity-container">
      {activities.length > 0 ? (
        <>
          <div className="activity-list">
            {activities.slice(0, 2).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-details">
                  <div className="activity-name">{activity.name}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
                <div className="activity-stats">
                  <span className="activity-duration">{activity.duration} min</span>
                  <span className="activity-calories">{activity.calories} cal</span>
                </div>
              </div>
            ))}
            {activities.length > 2 && (
              <div className="more-activities">
                +{activities.length - 2} more activities
              </div>
            )}
          </div>
          <button onClick={navigateToActivity} className="widget-link">Log More Activity</button>
        </>
      ) : (
        <div className="empty-activity">
          <p>No activities logged today</p>
          <button onClick={navigateToActivity} className="widget-button">Log Activity</button>
        </div>
      )}
    </div>
  );
}; 