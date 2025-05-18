import React from 'react';
import { useHistory } from 'react-router-dom';
import { WidgetSize } from '../../types/widgets';

interface TodayNutritionWidgetProps {
  todaysLogs: any[] | null | undefined;
  goal: any;
  size?: WidgetSize;
}

export const TodayNutritionWidget: React.FC<TodayNutritionWidgetProps> = ({ 
  todaysLogs = [], 
  goal,
  size = 'medium'
}) => {
  const history = useHistory();
  
  // Ensure todaysLogs is always an array
  const logs = Array.isArray(todaysLogs) ? todaysLogs : [];
  
  // Calculate nutrition totals for today
  const todaysTotals = logs.reduce((acc, log) => {
    return {
      calories: acc.calories + (log.calories || 0),
      proteins: acc.proteins + (log.proteins || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fats: acc.fats + (log.fats || 0),
      fiber: acc.fiber + (log.fiber || 0)
    };
  }, { calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0 });

  // Calculate remaining nutrition for today
  const remainingNutrition = goal?.nutrition_targets?.[0] ? {
    calories: goal.nutrition_targets[0].daily_calories - todaysTotals.calories,
    proteins: goal.nutrition_targets[0].proteins - todaysTotals.proteins,
    carbs: goal.nutrition_targets[0].carbs - todaysTotals.carbs,
    fats: goal.nutrition_targets[0].fats - todaysTotals.fats,
    fiber: goal.nutrition_targets[0].fiber - todaysTotals.fiber
  } : null;

  // Calculate percentage of goal reached
  const goalPercentages = goal?.nutrition_targets?.[0] ? {
    calories: Math.min(100, Math.round((todaysTotals.calories / goal.nutrition_targets[0].daily_calories) * 100)) || 0,
    proteins: Math.min(100, Math.round((todaysTotals.proteins / goal.nutrition_targets[0].proteins) * 100)) || 0,
    carbs: Math.min(100, Math.round((todaysTotals.carbs / goal.nutrition_targets[0].carbs) * 100)) || 0,
    fats: Math.min(100, Math.round((todaysTotals.fats / goal.nutrition_targets[0].fats) * 100)) || 0
  } : { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  
  const navigateToLogs = () => {
    history.push('/dashboard?tab=logs');
  };
  
  // Render small widget
  if (size === 'small' && logs.length > 0) {
    return (
      <div className="nutrition-summary small">
        <div className="macro-circle calories small">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path
              className="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="circle"
              strokeDasharray={`${goalPercentages.calories}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20.35" className="percentage">{goalPercentages.calories}%</text>
          </svg>
          <div className="macro-value">{todaysTotals.calories.toFixed(0)}</div>
        </div>
        <button onClick={navigateToLogs} className="widget-link">View Log</button>
      </div>
    );
  }
  
  // Render large widget with more details
  if (size === 'large' && logs.length > 0) {
    return (
      <div className="nutrition-summary large">
        <div className="macro-circles">
          <div className="macro-circle calories">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle"
                strokeDasharray={`${goalPercentages.calories}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{goalPercentages.calories}%</text>
            </svg>
            <div className="macro-label">Calories</div>
            <div className="macro-value">{todaysTotals.calories.toFixed(0)}</div>
          </div>
          
          <div className="macro-circle protein">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle protein"
                strokeDasharray={`${goalPercentages.proteins}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{goalPercentages.proteins}%</text>
            </svg>
            <div className="macro-label">Protein</div>
            <div className="macro-value">{todaysTotals.proteins.toFixed(1)}g</div>
          </div>
        </div>

        <div className="macro-details">
          <div className="macro-item">
            <div className="macro-name">Protein</div>
            <div className="progress-bar">
              <div 
                className="progress-fill protein" 
                style={{ width: `${goalPercentages.proteins}%` }}
              ></div>
            </div>
            <div className="macro-value">{todaysTotals.proteins.toFixed(1)}g</div>
          </div>
          
          <div className="macro-item">
            <div className="macro-name">Carbs</div>
            <div className="progress-bar">
              <div 
                className="progress-fill carbs" 
                style={{ width: `${goalPercentages.carbs}%` }}
              ></div>
            </div>
            <div className="macro-value">{todaysTotals.carbs.toFixed(1)}g</div>
          </div>
          
          <div className="macro-item">
            <div className="macro-name">Fats</div>
            <div className="progress-bar">
              <div 
                className="progress-fill fats" 
                style={{ width: `${goalPercentages.fats}%` }}
              ></div>
            </div>
            <div className="macro-value">{todaysTotals.fats.toFixed(1)}g</div>
          </div>
          
          <div className="macro-item">
            <div className="macro-name">Fiber</div>
            <div className="progress-bar">
              <div 
                className="progress-fill fiber" 
                style={{ width: `${Math.min(100, todaysTotals.fiber / (goal?.nutrition_targets?.[0]?.fiber || 25) * 100)}%` }}
              ></div>
            </div>
            <div className="macro-value">{todaysTotals.fiber.toFixed(1)}g</div>
          </div>
        </div>
        
        <div className="nutrition-summary-footer">
          <div className="remaining-calories">
            <span className="label">Remaining:</span>
            <span className="value">{remainingNutrition?.calories.toFixed(0) || 0} cal</span>
          </div>
          <button onClick={navigateToLogs} className="widget-link">View Full Log</button>
        </div>
      </div>
    );
  }
  
  // Default medium widget
  return (
    <>
      {logs.length > 0 ? (
        <div className="nutrition-summary">
          <div className="macro-circle calories">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="circle"
                strokeDasharray={`${goalPercentages.calories}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{goalPercentages.calories}%</text>
            </svg>
            <div className="macro-label">Calories</div>
            <div className="macro-value">{todaysTotals.calories.toFixed(0)}</div>
          </div>

          <div className="macro-details">
            <div className="macro-item">
              <div className="macro-name">Protein</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill protein" 
                  style={{ width: `${goalPercentages.proteins}%` }}
                ></div>
              </div>
              <div className="macro-value">{todaysTotals.proteins.toFixed(1)}g</div>
            </div>
            
            <div className="macro-item">
              <div className="macro-name">Carbs</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill carbs" 
                  style={{ width: `${goalPercentages.carbs}%` }}
                ></div>
              </div>
              <div className="macro-value">{todaysTotals.carbs.toFixed(1)}g</div>
            </div>
            
            <div className="macro-item">
              <div className="macro-name">Fats</div>
              <div className="progress-bar">
                <div 
                  className="progress-fill fats" 
                  style={{ width: `${goalPercentages.fats}%` }}
                ></div>
              </div>
              <div className="macro-value">{todaysTotals.fats.toFixed(1)}g</div>
            </div>
          </div>
          
          <button onClick={navigateToLogs} className="widget-link">View Full Log</button>
        </div>
      ) : (
        <div className="empty-nutrition">
          <p>No foods logged today</p>
          <button onClick={navigateToLogs} className="widget-button">Log Your First Meal</button>
        </div>
      )}
    </>
  );
}; 