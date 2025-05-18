import React, { useState, useEffect } from 'react';
import '../styles/DailyProgressFeedback.css';
import api from '../utils/api';

interface MacroProgress {
  consumed: number;
  target: number;
  percentage: number;
  status: 'under' | 'on-track' | 'over';
}

interface DailyProgressProps {
  userId: string;
  goalType: 'lose' | 'maintain' | 'gain';
  date?: string; // Optional: defaults to today
  onRefresh?: () => void;
}

// Modern SVG Icons
const icons = {
  calories: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  protein: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 11C5.11929 11 4 9.88071 4 8.5C4 7.11929 5.11929 6 6.5 6C7.88071 6 9 7.11929 9 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 8C18.8807 8 20 6.88071 20 5.5C20 4.11929 18.8807 3 17.5 3C16.1193 3 15 4.11929 15 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 15.5C20 19.0899 16.9706 22 12 22C7.02944 22 4 19.0899 4 15.5C4 11.9101 7.02944 9 12 9C16.9706 9 20 11.9101 20 15.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  carbs: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9C3 7.89543 3.89543 7 5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 21V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 4H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  fat: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 7C14 9.76142 11.7614 12 9 12C6.23858 12 4 9.76142 4 7C4 4.23858 6.23858 2 9 2C11.7614 2 14 4.23858 14 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M20 17.5C20 19.433 18.433 21 16.5 21C14.567 21 13 19.433 13 17.5C13 15.567 14.567 14 16.5 14C18.433 14 20 15.567 20 17.5Z" stroke="currentColor" strokeWidth="2" />
      <path d="M13.5 7.5L16.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.1334 5.64C17.8749 4.30583 16.2051 3.42 14.3799 3.1262C12.5546 2.83239 10.6835 3.14229 9.04432 4.01147C7.40518 4.88064 6.09086 6.26784 5.28515 7.95452C4.47943 9.6412 4.22429 11.5364 4.56026 13.3743C4.89624 15.2121 5.80519 16.8958 7.15703 18.1853C8.50887 19.4748 10.2321 20.3024 12.0775 20.5453C13.9229 20.7882 15.8061 20.4342 17.4458 19.5336C19.0855 18.633 20.3883 17.2186 21.1734 15.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.1667 8.38V3.88H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

const DailyProgressFeedback: React.FC<DailyProgressProps> = ({ 
  userId, 
  goalType,
  date,
  onRefresh 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calorieProgress, setCalorieProgress] = useState<{
    consumed: number;
    target: number;
    percentage: number;
    message: string;
    status: 'under' | 'on-track' | 'over';
    recommendation: string;
  } | null>(null);
  
  const [proteinProgress, setProteinProgress] = useState<MacroProgress | null>(null);
  const [carbsProgress, setCarbsProgress] = useState<MacroProgress | null>(null);
  const [fatProgress, setFatProgress] = useState<MacroProgress | null>(null);
  
  // Format current date as YYYY-MM-DD
  const today = date || new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    fetchDailyProgress();
  }, [userId, date]);
  
  const fetchDailyProgress = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get the user's nutrition targets
      const profileResponse = await api.get(`/profile`);
      const userProfile = profileResponse.data;
      
      // Get today's food logs
      const logsResponse = await api.get(`/logs?date=${today}`);
      const logs = logsResponse.data;
      
      // Calculate consumed macros
      const consumed = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
      
      logs.forEach((log: any) => {
        consumed.calories += log.calories || 0;
        consumed.protein += log.proteins || 0;
        consumed.carbs += log.carbs || 0;
        consumed.fat += log.fats || 0;
      });
      
      // Get targets from user profile
      const targets = {
        calories: userProfile.nutritionGoal.dailyCalories,
        protein: (userProfile.nutritionGoal.macroDistribution.protein / 100) * userProfile.nutritionGoal.dailyCalories / 4, // Convert % to grams
        carbs: (userProfile.nutritionGoal.macroDistribution.carbs / 100) * userProfile.nutritionGoal.dailyCalories / 4,
        fat: (userProfile.nutritionGoal.macroDistribution.fat / 100) * userProfile.nutritionGoal.dailyCalories / 9
      };
      
      // Calculate percentages
      const percentages = {
        calories: (consumed.calories / targets.calories) * 100,
        protein: (consumed.protein / targets.protein) * 100,
        carbs: (consumed.carbs / targets.carbs) * 100,
        fat: (consumed.fat / targets.fat) * 100
      };
      
      // Determine status for each macro
      const calorieStatus = getStatus(percentages.calories, goalType === 'lose');
      const proteinStatus = getStatus(percentages.protein, false);
      const carbsStatus = getStatus(percentages.carbs, goalType === 'lose');
      const fatStatus = getStatus(percentages.fat, goalType === 'lose');
      
      // Set state for each macro
      setCalorieProgress({
        consumed: Math.round(consumed.calories),
        target: Math.round(targets.calories),
        percentage: Math.round(percentages.calories),
        status: calorieStatus,
        message: getCalorieMessage(percentages.calories, goalType),
        recommendation: getCalorieRecommendation(percentages.calories, goalType)
      });
      
      setProteinProgress({
        consumed: Math.round(consumed.protein),
        target: Math.round(targets.protein),
        percentage: Math.round(percentages.protein),
        status: proteinStatus
      });
      
      setCarbsProgress({
        consumed: Math.round(consumed.carbs),
        target: Math.round(targets.carbs),
        percentage: Math.round(percentages.carbs),
        status: carbsStatus
      });
      
      setFatProgress({
        consumed: Math.round(consumed.fat),
        target: Math.round(targets.fat),
        percentage: Math.round(percentages.fat),
        status: fatStatus
      });
      
    } catch (err) {
      console.error('Error fetching daily progress:', err);
      setError('Unable to load your daily progress data');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine status
  const getStatus = (percentage: number, isDeficitGood: boolean): 'under' | 'on-track' | 'over' => {
    if (isDeficitGood) {
      // For weight loss, under target is good
      if (percentage <= 90) return 'under';
      if (percentage <= 100) return 'on-track';
      return 'over';
    } else {
      // For maintenance or gain, hitting target is good
      if (percentage < 80) return 'under';
      if (percentage <= 120) return 'on-track';
      return 'over';
    }
  };
  
  // Helper function to get calorie message
  const getCalorieMessage = (percentage: number, goalType: 'lose' | 'maintain' | 'gain'): string => {
    if (goalType === 'lose') {
      return `You're at ${Math.round(percentage)}% of your calorie target for weight loss.`;
    } else if (goalType === 'gain') {
      return `You're at ${Math.round(percentage)}% of your calorie target for weight gain.`;
    } else {
      return `You're at ${Math.round(percentage)}% of your calorie target for maintenance.`;
    }
  };
  
  // Helper function to get calorie recommendation
  const getCalorieRecommendation = (percentage: number, goalType: 'lose' | 'maintain' | 'gain'): string => {
    if (goalType === 'lose') {
      if (percentage < 80) {
        return "You're under your target. While a deficit is good for weight loss, eating too little can slow metabolism.";
      } else if (percentage <= 100) {
        return "You're on track with your weight loss calorie goal. Great job balancing nutrition and creating a healthy deficit.";
      } else {
        return "You've exceeded your calorie target. Consider balancing with some light activity or adjusting tomorrow's intake.";
      }
    } else if (goalType === 'gain') {
      if (percentage < 90) {
        return "You're under your calorie target for muscle gain. Try adding calorie-dense foods like nuts, avocados, or a protein shake.";
      } else if (percentage <= 110) {
        return "You're right on track with your calorie surplus for muscle gain. Keep focusing on quality protein and nutrient-dense foods.";
      } else {
        return "You've exceeded your calorie target. While a surplus is needed for weight gain, too much may lead to excess fat gain.";
      }
    } else { // maintain
      if (percentage < 90) {
        return "You're under your maintenance calories. Consider adding a balanced snack to meet your energy needs.";
      } else if (percentage <= 110) {
        return "You're right on track with your maintenance calories. This balance will help sustain your current weight.";
      } else {
        return "You've exceeded your maintenance calories. Consider balancing with some activity or adjusting tomorrow's intake.";
      }
    }
  };
  
  // Helper function to get status badge text
  const getStatusBadge = (status: 'under' | 'on-track' | 'over') => {
    switch (status) {
      case 'under':
        return 'Under Target';
      case 'on-track':
        return 'On Track';
      case 'over':
        return 'Over Target';
    }
  };
  
  if (loading) {
    return (
      <div className="daily-progress-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p>Loading today's progress...</p>
      </div>
    );
  }
  
  if (error) {
    return <div className="daily-progress-error">{error}</div>;
  }
  
  return (
    <div className="daily-progress-feedback">
      <div className="progress-header-section">
        <h2>Today's Progress</h2>
        <div className="today-date">{new Date(today).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      </div>
      
      {calorieProgress && (
        <div className={`calorie-progress status-${calorieProgress.status}`}>
          <div className="progress-header">
            <div className="progress-title">
              <span className="progress-icon">{icons.calories}</span>
              <h3>Calories</h3>
            </div>
            <div className="progress-numbers">
              <span className="consumed">{calorieProgress.consumed}</span>
              <span className="divider">/</span>
              <span className="target">{calorieProgress.target}</span>
              <span className={`status-badge ${calorieProgress.status}`}>
                {getStatusBadge(calorieProgress.status)}
              </span>
            </div>
          </div>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${Math.min(100, calorieProgress.percentage)}%` }}
            ></div>
          </div>
          
          <div className="progress-detail">
            <div className="progress-message">
              {calorieProgress.message}
            </div>
            
            <div className="progress-recommendation">
              {calorieProgress.recommendation}
            </div>
          </div>
        </div>
      )}
      
      <div className="macros-progress">
        {proteinProgress && (
          <div className={`macro-progress protein status-${proteinProgress.status}`}>
            <div className="macro-header">
              <div className="macro-title">
                <span className="macro-icon">{icons.protein}</span>
                <h4>Protein</h4>
              </div>
              <div className="macro-numbers">
                <span className="consumed">{proteinProgress.consumed}g</span>
                <span className="divider">/</span>
                <span className="target">{proteinProgress.target}g</span>
              </div>
            </div>
            
            <div className="macro-bar-container">
              <div 
                className="macro-bar-fill" 
                style={{ width: `${Math.min(100, proteinProgress.percentage)}%` }}
              ></div>
            </div>
            
            <div className="macro-footer">
              <div className={`macro-status ${proteinProgress.status}`}>
                {getStatusBadge(proteinProgress.status)}
              </div>
              <div className="macro-percentage">{proteinProgress.percentage}%</div>
            </div>
          </div>
        )}
        
        {carbsProgress && (
          <div className={`macro-progress carbs status-${carbsProgress.status}`}>
            <div className="macro-header">
              <div className="macro-title">
                <span className="macro-icon">{icons.carbs}</span>
                <h4>Carbs</h4>
              </div>
              <div className="macro-numbers">
                <span className="consumed">{carbsProgress.consumed}g</span>
                <span className="divider">/</span>
                <span className="target">{carbsProgress.target}g</span>
              </div>
            </div>
            
            <div className="macro-bar-container">
              <div 
                className="macro-bar-fill" 
                style={{ width: `${Math.min(100, carbsProgress.percentage)}%` }}
              ></div>
            </div>
            
            <div className="macro-footer">
              <div className={`macro-status ${carbsProgress.status}`}>
                {getStatusBadge(carbsProgress.status)}
              </div>
              <div className="macro-percentage">{carbsProgress.percentage}%</div>
            </div>
          </div>
        )}
        
        {fatProgress && (
          <div className={`macro-progress fat status-${fatProgress.status}`}>
            <div className="macro-header">
              <div className="macro-title">
                <span className="macro-icon">{icons.fat}</span>
                <h4>Fat</h4>
              </div>
              <div className="macro-numbers">
                <span className="consumed">{fatProgress.consumed}g</span>
                <span className="divider">/</span>
                <span className="target">{fatProgress.target}g</span>
              </div>
            </div>
            
            <div className="macro-bar-container">
              <div 
                className="macro-bar-fill" 
                style={{ width: `${Math.min(100, fatProgress.percentage)}%` }}
              ></div>
            </div>
            
            <div className="macro-footer">
              <div className={`macro-status ${fatProgress.status}`}>
                {getStatusBadge(fatProgress.status)}
              </div>
              <div className="macro-percentage">{fatProgress.percentage}%</div>
            </div>
          </div>
        )}
      </div>
      
      <button 
        className="refresh-button" 
        onClick={() => {
          fetchDailyProgress();
          if (onRefresh) onRefresh();
        }}
      >
        <span className="refresh-icon">{icons.refresh}</span>
        Refresh Progress
      </button>
    </div>
  );
};

export default DailyProgressFeedback; 