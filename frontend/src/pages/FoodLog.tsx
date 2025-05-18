import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { FoodItem, FoodLogEntry } from '../types';
import ScanFoodLogModal from '../components/modals/ScanFoodLogModal';
import '../styles/FoodLog.css';

interface FoodLogProps {
  logs: FoodLogEntry[];
  foods: FoodItem[];
  onAddLog: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => Promise<any>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  viewMode: 'day' | 'week';
  onViewModeChange: (mode: 'day' | 'week') => void;
  weekLogs: {[date: string]: FoodLogEntry[]};
  weekRange: {start: string, end: string};
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onSwitchToDay: () => void;
}

const FoodLog: React.FC<FoodLogProps> = ({ 
  logs, 
  foods, 
  onAddLog, 
  onEdit, 
  onDelete, 
  onRefresh,
  selectedDate,
  onDateChange,
  onPrevDay,
  onNextDay,
  viewMode,
  onViewModeChange,
  weekLogs,
  weekRange,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  onSwitchToDay
}) => {
  const [dateDisplayText, setDateDisplayText] = useState("Today's Food Log");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  // Group logs by meal type
  const logsByMealType = logs.reduce((acc, log) => {
    const mealType = log.meal_type;
    if (!acc[mealType]) {
      acc[mealType] = [];
    }
    acc[mealType].push(log);
    return acc;
  }, {} as Record<string, FoodLogEntry[]>);
  
  // Order meal types
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  // Calculate totals
  const totals = logs.reduce((acc, log) => {
    acc.calories += log.calories || 0;
    acc.proteins += log.proteins || 0;
    acc.carbs += log.carbs || 0;
    acc.fats += log.fats || 0;
    acc.fiber += log.fiber || 0;
    return acc;
  }, { calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0 });
  
  // Add a memoized refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshed(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);
  
  // Auto-refresh data at regular intervals
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing food log data");
      handleRefresh();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [handleRefresh, autoRefreshEnabled]);

  // Refresh when the selected date changes
  useEffect(() => {
    console.log("Selected date changed, refreshing data");
    handleRefresh();
  }, [selectedDate, handleRefresh]);
  
  // Refresh when component mounts
  useEffect(() => {
    console.log("FoodLog component mounted, fetching initial data");
    handleRefresh();
  }, [handleRefresh]);
  
  const handleDeleteLog = async (logId: string) => {
    try {
      onDelete(logId);
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };
  
  const updateDateDisplay = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) {
      setDateDisplayText("Today's Food Log");
    } else if (dateStr === yesterday) {
      setDateDisplayText("Yesterday's Food Log");
    } else {
      const date = new Date(dateStr);
      setDateDisplayText(`Food Log: ${date.toLocaleDateString()}`);
    }
  };

  const handleOpenScanModal = () => {
    setShowScanModal(true);
  };
  
  const handleScanModalSuccess = () => {
    // Refresh the logs after successful scan and log
    onRefresh();
  };

  // Update date display when selectedDate changes
  React.useEffect(() => {
    updateDateDisplay(selectedDate);
  }, [selectedDate]);
  
  return (
    <div className="food-log-page">
      {/* Scan Food Modal */}
      <ScanFoodLogModal 
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onSuccess={handleScanModalSuccess}
        currentDate={new Date(selectedDate)}
      />
    
      {/* View Mode Toggle */}
      <div className="view-mode-toggle">
        <button 
          className={`toggle-button ${viewMode === 'day' ? 'active' : ''}`}
          onClick={onSwitchToDay}
        >
          Day View
        </button>
        <button 
          className={`toggle-button ${viewMode === 'week' ? 'active' : ''}`}
          onClick={onCurrentWeek}
        >
          Week View
        </button>
      </div>

      {viewMode === 'day' ? (
        <>
          {/* Summary Stats */}
          <div className="card nutrition-summary">
            <h3>Nutrition Summary</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="summary-label">Calories</span>
                <span className="summary-value">{Math.round(totals.calories)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Protein</span>
                <span className="summary-value">{Math.round(totals.proteins)}g</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Carbs</span>
                <span className="summary-value">{Math.round(totals.carbs)}g</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Fat</span>
                <span className="summary-value">{Math.round(totals.fats)}g</span>
              </div>
            </div>
            <div className="refresh-info">
              <small>Last updated: {lastRefreshed.toLocaleTimeString()}</small>
              <button 
                className="refresh-button" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
              >
                {isRefreshing ? 'Refreshing...' : '↻ Refresh'}
              </button>
              <label className="auto-refresh-toggle">
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                />
                Auto-refresh
              </label>
            </div>
          </div>
          
          {/* Date Navigation */}
          <div className="date-navigation">
            <button className="nav-button" onClick={onPrevDay}>&lt;</button>
            <span className="date-display">{dateDisplayText}</span>
            <button className="nav-button" onClick={onNextDay}>&gt;</button>
          </div>
          
          {/* Food Logs by Meal */}
          {logs.length === 0 ? (
            <div className="no-data-message">
              <p>No foods logged for this day.</p>
              <div className="action-buttons">
                <button className="primary-button" onClick={onAddLog}>Log Food</button>
                <button className="secondary-button" onClick={handleOpenScanModal}>Scan Label</button>
              </div>
            </div>
          ) : (
            <div className="meal-logs">
              {mealOrder.map(mealType => {
                const mealLogs = logsByMealType[mealType] || [];
                if (mealLogs.length === 0) return null;
                
                return (
                  <div className="card meal-group" key={mealType}>
                    <h3 className="meal-title">
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </h3>
                    
                    {mealLogs.map(log => (
                      <div className="log-item" key={log._id}>
                        <div className="log-item-header">
                          <span className="log-item-name">{log.name}</span>
                          <span className="log-item-calories">{Math.round(log.calories)} cal</span>
                        </div>
                        
                        <div className="log-item-amount">
                          {log.amount} {log.unit}
                        </div>
                        
                        <div className="log-item-macros">
                          <span>P: {log.proteins?.toFixed(1)}g</span>
                          <span>C: {log.carbs?.toFixed(1)}g</span>
                          <span>F: {log.fats?.toFixed(1)}g</span>
                        </div>
                        
                        <div className="log-item-actions">
                          <button 
                            className="action-button edit-btn" 
                            onClick={() => onEdit(log._id as string)}
                          >
                            Edit
                          </button>
                          <button 
                            className="action-button delete-btn"
                            onClick={() => handleDeleteLog(log._id as string)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              
              {/* Pull to refresh indicator */}
              {isRefreshing && (
                <div className="refresh-indicator">
                  <div className="spinner"></div>
                  <span>Refreshing...</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Week View */
        <div className="week-view">
          <div className="week-navigation">
            <button className="nav-button" onClick={onPrevWeek}>&lt;</button>
            <span className="date-display">
              {weekRange.start && weekRange.end ? 
                `${new Date(weekRange.start).toLocaleDateString()} - ${new Date(weekRange.end).toLocaleDateString()}` : 
                'This Week'}
            </span>
            <button className="nav-button" onClick={onNextWeek}>&gt;</button>
          </div>
          
          <div className="week-grid">
            {Object.keys(weekLogs).length === 0 ? (
              <div className="no-data-message">
                <p>No logs available for this week.</p>
              </div>
            ) : (
              Object.entries(weekLogs).map(([date, dailyLogs]) => {
                const dayTotals = dailyLogs.reduce((acc, log) => {
                  acc.calories += log.calories || 0;
                  acc.proteins += log.proteins || 0;
                  acc.carbs += log.carbs || 0;
                  acc.fats += log.fats || 0;
                  return acc;
                }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });
                
                const formattedDate = new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                
                return (
                  <div 
                    key={date} 
                    className="day-card"
                    onClick={() => {
                      onDateChange(date);
                      onSwitchToDay();
                    }}
                  >
                    <h3 className="day-title">{formattedDate}</h3>
                    <div className="day-totals">
                      <div className="total-item">
                        <span className="total-label">Calories</span>
                        <span className="total-value">{Math.round(dayTotals.calories)}</span>
                      </div>
                      <div className="macro-totals">
                        <span>P: {Math.round(dayTotals.proteins)}g</span>
                        <span>C: {Math.round(dayTotals.carbs)}g</span>
                        <span>F: {Math.round(dayTotals.fats)}g</span>
                      </div>
                    </div>
                    <div className="meal-summary">
                      {dailyLogs.length === 0 ? (
                        <p className="no-meals">No meals logged</p>
                      ) : (
                        <p>{dailyLogs.length} meal{dailyLogs.length !== 1 ? 's' : ''} logged</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fab-container">
        <button className="fab scan-button" onClick={handleOpenScanModal} title="Scan Nutrition Label">
          📷
        </button>
        <button className="fab add-button" onClick={onAddLog} title="Log Food">
          +
        </button>
      </div>
    </div>
  );
};

export default FoodLog; 