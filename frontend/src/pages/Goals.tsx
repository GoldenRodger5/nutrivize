import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import '../styles/Goals.css';
import WeightProgressForm from '../components/WeightProgressForm';
import WeightProgressHistory from '../components/WeightProgressHistory';

interface NutritionTarget {
  name: string;
  daily_calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface WeightProgress {
  date: string;
  weight: number;
  notes?: string;
}

interface Goal {
  _id?: string;
  type: string;
  weight_target: {
    current: number;
    goal: number;
    weekly_rate: number;
  };
  nutrition_targets: NutritionTarget[];
  active?: boolean;
  progress?: WeightProgress[];
}

interface DailyNutrition {
  date: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

interface GoalsProps {
  goal: Goal | null;
  onAddGoal: () => void;
  onEditGoal: (id: string) => void;
  onRefresh: () => Promise<any>;
}

const Goals: React.FC<GoalsProps> = ({ goal, onAddGoal, onEditGoal, onRefresh }) => {
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition[]>([]);
  const [projectedCompletion, setProjectedCompletion] = useState<Date | null>(null);
  const [actualProgress, setActualProgress] = useState<number>(0);

  useEffect(() => {
    fetchAllGoals();
    if (goal) {
      fetchNutritionData();
    }
  }, [goal]);

  const fetchAllGoals = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/goals');
      console.log('All goals response:', response.data);
      if (response.status === 200) {
        const goalsData = Array.isArray(response.data) ? response.data : [];
        setAllGoals(goalsData);
      }
    } catch (error) {
      console.error('Error fetching all goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNutritionData = async () => {
    if (!goal) return;
    
    try {
      // Get last 30 days of nutrition data
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const response = await api.get(`/logs/range?start_date=${startDate}&end_date=${endDate}`);
      
      if (response.status === 200 && response.data.date_range) {
        // Process logs to get daily nutrition totals
        const dailyTotals: DailyNutrition[] = response.data.date_range.map((dayData: any) => {
          const logs = dayData.logs || [];
          return {
            date: dayData.date,
            calories: logs.reduce((sum: number, log: any) => sum + (log.calories || 0), 0),
            proteins: logs.reduce((sum: number, log: any) => sum + (log.proteins || 0), 0),
            carbs: logs.reduce((sum: number, log: any) => sum + (log.carbs || 0), 0),
            fats: logs.reduce((sum: number, log: any) => sum + (log.fats || 0), 0)
          };
        });
        
        setDailyNutrition(dailyTotals);
        
        // Calculate projected completion based on actual calorie intake
        calculateProjectedCompletion(dailyTotals);
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    }
  };

  const calculateProjectedCompletion = (nutritionData: DailyNutrition[]) => {
    if (!goal || !nutritionData.length) return;
    
    try {
      // Calculate average daily caloric deficit/surplus
      const calorieTarget = goal.nutrition_targets[0]?.daily_calories || 0;
      const maintenanceCalories = goal.type === 'weight loss' 
        ? calorieTarget + 500  // For weight loss, maintenance is higher than target
        : goal.type === 'weight gain' 
          ? calorieTarget - 500  // For weight gain, maintenance is lower than target
          : calorieTarget;
      
      // Calculate average daily deficit/surplus based on actual intake
      const validDays = nutritionData.filter(day => day.calories > 0);
      if (!validDays.length) return;
      
      const avgDailyCalories = validDays.reduce((sum, day) => sum + day.calories, 0) / validDays.length;
      const dailyCalorieDelta = maintenanceCalories - avgDailyCalories; // positive for deficit, negative for surplus
      
      // Calculate if we're ahead or behind schedule
      const expectedDailyDelta = goal.type === 'weight loss' ? 500 : goal.type === 'weight gain' ? -500 : 0;
      const progressRatio = dailyCalorieDelta / expectedDailyDelta;
      
      // Update progress percentage
      const progressPercentage = Math.min(100, Math.max(0, progressRatio * 100));
      setActualProgress(progressPercentage);
      
      // 3500 calories = 1 pound (approximately)
      // Calculate how many days it will take to reach the goal
      const weightDeltaLbs = Math.abs(goal.weight_target.current - goal.weight_target.goal) * 2.20462; // Convert kg to lbs
      const totalCaloriesNeeded = weightDeltaLbs * 3500;
      const daysToGoal = Math.abs(Math.round(totalCaloriesNeeded / dailyCalorieDelta));
      
      // Calculate projected completion date
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + daysToGoal);
      setProjectedCompletion(completionDate);
      
    } catch (error) {
      console.error('Error calculating projected completion:', error);
    }
  };

  const activateGoal = async (goalId: string) => {
    try {
      console.log(`Activating goal ${goalId}`);
      setIsLoading(true);
      
      const response = await api.post(`/goals/${goalId}/activate`);
      
      if (response.status === 200) {
        console.log("Goal activated successfully");
        
        // Refresh both the active goal and all goals list
        await onRefresh();
        await fetchAllGoals();
        
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Goal activated successfully!';
        document.body.appendChild(successMessage);
        
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
      } else {
        console.error("Failed to activate goal:", response.status);
        alert("There was a problem activating the goal. Please try again.");
      }
    } catch (error) {
      console.error('Error activating goal:', error);
      alert("There was a problem activating the goal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate calorie deficit/surplus
  const getCalorieStatus = (currentGoal: Goal) => {
    if (!currentGoal) return null;
    
    const calorieTarget = currentGoal.nutrition_targets[0]?.daily_calories || 0;
    const maintenanceCalories = currentGoal.type === 'weight loss' 
      ? calorieTarget + 500 
      : currentGoal.type === 'weight gain' 
        ? calorieTarget - 500 
        : calorieTarget;
    
    return {
      maintenance: maintenanceCalories,
      target: calorieTarget,
      difference: maintenanceCalories - calorieTarget,
      direction: currentGoal.type === 'weight loss' ? 'deficit' : currentGoal.type === 'weight gain' ? 'surplus' : 'maintenance'
    };
  };
  
  const formatWeight = (weight: number) => {
    return weight.toFixed(1);
  };
  
  const getLbsFromKg = (kg: number) => {
    return (kg * 2.20462).toFixed(1);
  };
  
  const getWeightTrendClass = (current: number, goal: number) => {
    return current > goal ? 'down-trend' : current < goal ? 'up-trend' : 'maintain-trend';
  };
  
  const getProgressPercentage = (currentGoal: Goal) => {
    // If we have actual progress calculated, use that
    if (currentGoal === goal && actualProgress > 0) {
      return actualProgress;
    }
    
    // Otherwise calculate based on weight targets
    return Math.min(
      100, 
      Math.max(
        0, 
        ((currentGoal.weight_target.current - currentGoal.weight_target.goal) / 
        Math.abs(currentGoal.weight_target.current - currentGoal.weight_target.goal)) * 100
      )
    );
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const getExpectedWeeks = (currentGoal: Goal) => {
    return Math.abs(
      Math.round(
        (currentGoal.weight_target.current - currentGoal.weight_target.goal) / 
        currentGoal.weight_target.weekly_rate
      )
    );
  };
  
  const renderGoalCard = (currentGoal: Goal, isActiveGoal: boolean = false) => {
    const calorieStatus = getCalorieStatus(currentGoal);
    const trendClass = getWeightTrendClass(currentGoal.weight_target.current, currentGoal.weight_target.goal);
    const progressPercentage = getProgressPercentage(currentGoal);
    const weightDiffKg = Math.abs(currentGoal.weight_target.current - currentGoal.weight_target.goal);
    const weightDiffLbs = Number(getLbsFromKg(weightDiffKg));
    
    return (
      <div className={`goal-card ${isActiveGoal ? 'active-goal' : ''}`} key={currentGoal._id}>
        {isActiveGoal && <div className="active-badge">Active</div>}
        <h3>{currentGoal.type.charAt(0).toUpperCase() + currentGoal.type.slice(1)} Goal</h3>
        
        <div className="goal-type">
          <span className="label">Type:</span>
          <span className="value">{currentGoal.type.charAt(0).toUpperCase() + currentGoal.type.slice(1)}</span>
        </div>
        
        <div className="weight-target">
          <div className="current-weight">
            <span className="label">Current</span>
            <span className="value">{formatWeight(currentGoal.weight_target.current)} kg</span>
            <span className="imperial">({getLbsFromKg(currentGoal.weight_target.current)} lb)</span>
          </div>
          
          <div className={`target-arrow ${trendClass}`}>→</div>
          
          <div className="goal-weight">
            <span className="label">Goal</span>
            <span className="value">{formatWeight(currentGoal.weight_target.goal)} kg</span>
            <span className="imperial">({getLbsFromKg(currentGoal.weight_target.goal)} lb)</span>
          </div>
          
          <div className="weight-difference">
            <span className="label">Total</span>
            <span className="value">{weightDiffKg.toFixed(1)} kg</span>
            <span className="imperial">({weightDiffLbs.toFixed(1)} lb)</span>
          </div>
          
          <div className="weekly-rate">
            <span className="label">Rate</span>
            <span className="value">{currentGoal.weight_target.weekly_rate} kg/week</span>
            <span className="imperial">({(currentGoal.weight_target.weekly_rate * 2.20462).toFixed(1)} lb/week)</span>
          </div>
        </div>
        
        {/* Progress visualization */}
        <div className="progress-container">
          <div className="progress-label">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress ${trendClass}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <div className="expected-completion">
          <span className="label">Expected timeline:</span>
          <span className="value">
            {getExpectedWeeks(currentGoal)} weeks
          </span>
          
          {isActiveGoal && projectedCompletion && (
            <div className="projected-completion">
              <span className="label">Projected completion date:</span>
              <span className="value">{formatDate(projectedCompletion)}</span>
              <span className="note">Based on your actual calorie intake</span>
            </div>
          )}
        </div>
        
        {isActiveGoal && (
          <WeightProgressForm 
            goalId={currentGoal._id as string}
            currentWeight={currentGoal.weight_target.current}
            onWeightUpdate={(newWeight) => {
              // Create a new goal object with updated weight
              const updatedGoal = {
                ...currentGoal,
                weight_target: {
                  ...currentGoal.weight_target,
                  current: newWeight
                }
              };
              
              // Fetch updated progress data
              fetchNutritionData();
              
              // Refresh the goal data through the parent component
              onRefresh();
            }}
          />
        )}
        
        {isActiveGoal && currentGoal.progress && currentGoal.progress.length > 0 && (
          <WeightProgressHistory 
            entries={currentGoal.progress}
            goalWeight={currentGoal.weight_target.goal}
            goalType={currentGoal.type}
          />
        )}
        
        {/* Nutrition Targets */}
        <div className="nutrition-targets">
          <h4>Nutrition Targets</h4>
          
          {currentGoal.nutrition_targets.map((target, index) => (
            <div className="target-details" key={index}>
              <div className="calorie-target">
                <span className="label">Daily Calories</span>
                <span className="value">{Math.round(target.daily_calories)} kcal</span>
              </div>
              
              {calorieStatus && (
                <div className="calorie-context">
                  {calorieStatus.direction === 'deficit' ? (
                    <div className="deficit-info">
                      <span className="label">Daily deficit:</span>
                      <span className="value">{Math.round(calorieStatus.difference)} kcal</span>
                      <span className="note">
                        To lose {(currentGoal.weight_target.weekly_rate * 2.20462).toFixed(1)} pounds/week
                        ({currentGoal.weight_target.weekly_rate} kg/week)
                      </span>
                    </div>
                  ) : calorieStatus.direction === 'surplus' ? (
                    <div className="surplus-info">
                      <span className="label">Daily surplus:</span>
                      <span className="value">{Math.round(calorieStatus.difference)} kcal</span>
                      <span className="note">
                        To gain {(currentGoal.weight_target.weekly_rate * 2.20462).toFixed(1)} pounds/week
                        ({currentGoal.weight_target.weekly_rate} kg/week)
                      </span>
                    </div>
                  ) : (
                    <span>Maintenance calories</span>
                  )}
                </div>
              )}
              
              <div className="macros-grid">
                <div className="macro protein">
                  <span className="label">Protein</span>
                  <span className="value">{Math.round(target.proteins)}g</span>
                  <span className="percentage">
                    {Math.round((target.proteins * 4 / target.daily_calories) * 100)}%
                  </span>
                  <div className="macro-bar">
                    <div 
                      className="macro-progress" 
                      style={{ width: `${Math.round((target.proteins * 4 / target.daily_calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="macro carbs">
                  <span className="label">Carbs</span>
                  <span className="value">{Math.round(target.carbs)}g</span>
                  <span className="percentage">
                    {Math.round((target.carbs * 4 / target.daily_calories) * 100)}%
                  </span>
                  <div className="macro-bar">
                    <div 
                      className="macro-progress" 
                      style={{ width: `${Math.round((target.carbs * 4 / target.daily_calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="macro fats">
                  <span className="label">Fats</span>
                  <span className="value">{Math.round(target.fats)}g</span>
                  <span className="percentage">
                    {Math.round((target.fats * 9 / target.daily_calories) * 100)}%
                  </span>
                  <div className="macro-bar">
                    <div 
                      className="macro-progress" 
                      style={{ width: `${Math.round((target.fats * 9 / target.daily_calories) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {target.fiber > 0 && (
                  <div className="macro fiber">
                    <span className="label">Fiber</span>
                    <span className="value">{Math.round(target.fiber)}g</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isActiveGoal && dailyNutrition.length > 0 && (
            <div className="nutrition-insights">
              <h5>Recent Nutrition Insights</h5>
              <div className="insight">
                <span className="label">Avg. daily calories:</span>
                <span className="value">
                  {Math.round(
                    dailyNutrition.reduce((sum, day) => sum + day.calories, 0) / 
                    dailyNutrition.filter(day => day.calories > 0).length
                  )} kcal
                </span>
              </div>
              <div className="insight">
                <span className="label">Avg. daily protein:</span>
                <span className="value">
                  {Math.round(
                    dailyNutrition.reduce((sum, day) => sum + day.proteins, 0) / 
                    dailyNutrition.filter(day => day.proteins > 0).length
                  )} g
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="goal-actions">
          {!isActiveGoal && (
            <button 
              className="activate-button"
              onClick={() => activateGoal(currentGoal._id as string)}
            >
              Activate Goal
            </button>
          )}
          <button 
            className="edit-button"
            onClick={() => onEditGoal(currentGoal._id as string)}
          >
            Edit Goal
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="goals-page">
      {isLoading ? (
        <div className="loading-message">Loading goals...</div>
      ) : (
        <>
          {/* Active Goal Section */}
          {goal && (
            <div className="active-goal-section">
              <h2>Current Active Goal</h2>
              {renderGoalCard(goal, true)}
            </div>
          )}

          {/* All Goals Section */}
          {allGoals.length > 0 ? (
            <div className="all-goals-section">
              <h2>All Goals</h2>
              <div className="goals-grid">
                {allGoals.map(g => 
                  // Only render if it's not the active goal to avoid duplication
                  (!goal || g._id !== goal._id) && renderGoalCard(g)
                )}
              </div>
            </div>
          ) : !goal && (
            <div className="no-data-message">
              <p>You don't have any goals set up yet.</p>
              <button 
                className="primary-button"
                onClick={onAddGoal}
              >
                Set Your First Goal
              </button>
              <p className="helper-text">
                Setting a goal will help you track your progress and get personalized meal suggestions.
              </p>
            </div>
          )}

          <div className="add-goal-section">
            <button 
              className="primary-button add-goal-button"
              onClick={onAddGoal}
            >
              Add New Goal
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Goals; 