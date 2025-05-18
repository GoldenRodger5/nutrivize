import React, { useState, useEffect } from 'react';
import '../styles/WeeklyGoalInsights.css';
import api from '../utils/api';

interface WeeklyInsightsProps {
  userId: string;
  goalType: 'lose' | 'maintain' | 'gain';
  days?: number; // Number of days to analyze, defaults to 7
  onRefresh?: () => void;
}

interface DailyData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  weight?: number;
}

interface WeeklyInsights {
  adherencePercentage: number;
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  message: string;
  daysOnTrack: number;
  totalDays: number;
  streakDays: number; // Number of consecutive days meeting goal
  trendDirection: 'improving' | 'maintaining' | 'declining';
}

const WeeklyGoalInsights: React.FC<WeeklyInsightsProps> = ({
  userId,
  goalType,
  days = 7,
  onRefresh
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [insights, setInsights] = useState<WeeklyInsights | null>(null);
  const [userGoal, setUserGoal] = useState({
    type: goalType,
    targetCalories: 0,
    targetProtein: 0,
    targetCarbs: 0,
    targetFat: 0
  });

  useEffect(() => {
    fetchWeeklyData();
  }, [userId, days]);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the end date (today) and start date (7 days ago)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1);

      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get user profile for goals
      const profileResponse = await api.get('/profile');
      const userProfile = profileResponse.data;

      setUserGoal({
        type: goalType,
        targetCalories: userProfile.nutritionGoal.dailyCalories,
        targetProtein: (userProfile.nutritionGoal.macroDistribution.protein / 100) * userProfile.nutritionGoal.dailyCalories / 4,
        targetCarbs: (userProfile.nutritionGoal.macroDistribution.carbs / 100) * userProfile.nutritionGoal.dailyCalories / 4,
        targetFat: (userProfile.nutritionGoal.macroDistribution.fat / 100) * userProfile.nutritionGoal.dailyCalories / 9
      });

      // Get nutrition data for the date range
      const nutritionResponse = await api.get(`/nutrition/aggregates?start_date=${startDateStr}&end_date=${endDateStr}`);
      const nutritionData = nutritionResponse.data.data;

      setWeeklyData(nutritionData);

      // Generate insights based on the data and goal
      const generatedInsights = generateInsights(nutritionData, userGoal);
      setInsights(generatedInsights);

    } catch (err) {
      console.error('Error fetching weekly insights data:', err);
      setError('Unable to load weekly insights');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (dailyData: DailyData[], goal: any): WeeklyInsights => {
    // Calculate averages
    const totalDays = dailyData.length;
    const avgCalories = dailyData.reduce((sum, day) => sum + day.calories, 0) / totalDays;
    const avgProtein = dailyData.reduce((sum, day) => sum + day.protein, 0) / totalDays;
    const avgCarbs = dailyData.reduce((sum, day) => sum + day.carbs, 0) / totalDays;
    const avgFat = dailyData.reduce((sum, day) => sum + day.fat, 0) / totalDays;

    // Calculate adherence to calorie goal
    const daysOnTrack = dailyData.filter(day => {
      if (goal.type === 'lose') return day.calories <= goal.targetCalories * 1.05;
      if (goal.type === 'gain') return day.calories >= goal.targetCalories * 0.95;
      return day.calories >= goal.targetCalories * 0.9 && day.calories <= goal.targetCalories * 1.1;
    }).length;

    const adherencePercentage = (daysOnTrack / totalDays) * 100;

    // Calculate streak (consecutive days on track)
    let streakDays = 0;
    let currentStreak = 0;

    // Sort days by date descending (newest first)
    const sortedDays = [...dailyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const day of sortedDays) {
      const isOnTrack = (goal.type === 'lose' && day.calories <= goal.targetCalories * 1.05) ||
                        (goal.type === 'gain' && day.calories >= goal.targetCalories * 0.95) ||
                        (goal.type === 'maintain' && day.calories >= goal.targetCalories * 0.9 && day.calories <= goal.targetCalories * 1.1);

      if (isOnTrack) {
        currentStreak++;
      } else {
        break;
      }
    }
    streakDays = currentStreak;

    // Determine trend direction
    // Compare first half vs second half of the period
    const halfPoint = Math.floor(totalDays / 2);
    const firstHalfDays = dailyData.slice(0, halfPoint);
    const secondHalfDays = dailyData.slice(halfPoint);

    const firstHalfAvg = firstHalfDays.reduce((sum, day) => sum + day.calories, 0) / firstHalfDays.length;
    const secondHalfAvg = secondHalfDays.reduce((sum, day) => sum + day.calories, 0) / secondHalfDays.length;

    let trendDirection: 'improving' | 'maintaining' | 'declining';

    if (Math.abs(firstHalfAvg - secondHalfAvg) < goal.targetCalories * 0.05) {
      trendDirection = 'maintaining';
    } else if ((goal.type === 'lose' && secondHalfAvg < firstHalfAvg) ||
               (goal.type === 'gain' && secondHalfAvg > firstHalfAvg) ||
               (goal.type === 'maintain' && Math.abs(secondHalfAvg - goal.targetCalories) < Math.abs(firstHalfAvg - goal.targetCalories))) {
      trendDirection = 'improving';
    } else {
      trendDirection = 'declining';
    }

    // Generate motivational message
    let message = '';
    if (goal.type === 'lose') {
      if (avgProtein >= goal.targetProtein * 0.9) {
        message = "You're consistently hitting your protein goal—this supports fat loss while maintaining muscle.";
      } else if (adherencePercentage >= 80) {
        message = "Great job staying within your calorie targets! Consistency is key for sustainable weight loss.";
      } else if (trendDirection === 'improving') {
        message = "Your trend is heading in the right direction! Keep focusing on your calorie goal.";
      } else {
        message = "Focus on hitting your calorie targets more consistently to accelerate progress toward your weight loss goal.";
      }
    } else if (goal.type === 'gain') {
      if (avgCalories >= goal.targetCalories * 0.95) {
        message = "You're consistently hitting your calorie surplus, which is essential for muscle gain and weight gain.";
      } else if (avgProtein >= goal.targetProtein * 0.9) {
        message = "Your protein intake is good, but try to increase your overall calories to support your weight gain goal.";
      } else if (trendDirection === 'improving') {
        message = "You're making progress toward your calorie goals. Keep pushing to hit your targets consistently.";
      } else {
        message = "Aim to increase both calories and protein to maximize your progress toward your weight gain goal.";
      }
    } else { // maintain
      if (adherencePercentage >= 80) {
        message = "You're doing a great job maintaining balance in your diet, which supports your weight maintenance goal.";
      } else if (Math.abs(avgCalories - goal.targetCalories) <= 200) {
        message = "Your weekly calorie average is close to your maintenance target. Keep up the consistent tracking!";
      } else if (trendDirection === 'improving') {
        message = "You're getting closer to your maintenance targets. Consistency will help stabilize your weight.";
      } else {
        message = "Try to keep your daily calories closer to your maintenance target for more stable weight maintenance.";
      }
    }

    return {
      adherencePercentage: Math.round(adherencePercentage),
      averages: {
        calories: Math.round(avgCalories),
        protein: Math.round(avgProtein),
        carbs: Math.round(avgCarbs),
        fat: Math.round(avgFat)
      },
      message,
      daysOnTrack,
      totalDays,
      streakDays,
      trendDirection
    };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <div className="weekly-insights-loading">Loading weekly insights...</div>;
  }

  if (error) {
    return <div className="weekly-insights-error">{error}</div>;
  }

  if (!insights || weeklyData.length === 0) {
    return (
      <div className="weekly-insights-empty">
        <h3>No weekly data available</h3>
        <p>Start tracking your nutrition to get weekly insights.</p>
        <button onClick={fetchWeeklyData}>Refresh</button>
      </div>
    );
  }

  return (
    <div className="weekly-goal-insights">
      <div className="insights-header">
        <h2>Weekly Insights</h2>
        <div className="date-range">
          {weeklyData.length > 0 ? (
            <>
              <span>{formatDate(weeklyData[0].date)}</span>
              <span> - </span>
              <span>{formatDate(weeklyData[weeklyData.length - 1].date)}</span>
            </>
          ) : (
            <span>No data available</span>
          )}
        </div>
      </div>

      <div className="insights-summary">
        <div className="summary-card adherence">
          <h3>Adherence</h3>
          <div className="adherence-display">
            <div className="adherence-percentage">{insights.adherencePercentage}%</div>
            <div className="adherence-label">On Target Days</div>
          </div>
          <div className="adherence-detail">
            <span>{insights.daysOnTrack} of {insights.totalDays} days</span>
          </div>
        </div>

        <div className="summary-card streak">
          <h3>Current Streak</h3>
          <div className="streak-display">
            <div className="streak-count">{insights.streakDays}</div>
            <div className="streak-label">Days</div>
          </div>
          <div className="streak-detail">
            <span>Consecutive days on target</span>
          </div>
        </div>

        <div className="summary-card trend">
          <h3>Trend</h3>
          <div className="trend-display">
            <div className={`trend-icon ${insights.trendDirection}`}>
              {insights.trendDirection === 'improving' ? '↗' : 
               insights.trendDirection === 'declining' ? '↘' : '→'}
            </div>
            <div className="trend-status">
              {insights.trendDirection.charAt(0).toUpperCase() + insights.trendDirection.slice(1)}
            </div>
          </div>
          <div className="trend-detail">
            <span>Compared to last week</span>
          </div>
        </div>
      </div>

      <div className="insights-averages">
        <h3>Weekly Averages</h3>
        <div className="averages-grid">
          <div className="average-item calories">
            <div className="average-value">{insights.averages.calories}</div>
            <div className="average-label">Calories</div>
            <div className="average-target">
              Target: {userGoal.targetCalories}
            </div>
          </div>
          <div className="average-item protein">
            <div className="average-value">{insights.averages.protein}g</div>
            <div className="average-label">Protein</div>
            <div className="average-target">
              Target: {Math.round(userGoal.targetProtein)}g
            </div>
          </div>
          <div className="average-item carbs">
            <div className="average-value">{insights.averages.carbs}g</div>
            <div className="average-label">Carbs</div>
            <div className="average-target">
              Target: {Math.round(userGoal.targetCarbs)}g
            </div>
          </div>
          <div className="average-item fat">
            <div className="average-value">{insights.averages.fat}g</div>
            <div className="average-label">Fat</div>
            <div className="average-target">
              Target: {Math.round(userGoal.targetFat)}g
            </div>
          </div>
        </div>
      </div>

      <div className="insights-message">
        <h3>Personalized Insight</h3>
        <div className="message-content">
          {insights.message}
        </div>
      </div>

      <div className="insights-data-visualization">
        <h3>Daily Calories vs Target</h3>
        <div className="calories-chart">
          {weeklyData.map((day) => (
            <div key={day.date} className="chart-column">
              <div className="chart-bar-container">
                <div 
                  className={`chart-bar ${day.calories > userGoal.targetCalories ? 'over' : 
                              day.calories < userGoal.targetCalories * 0.9 ? 'under' : 'on-target'}`}
                  style={{ height: `${Math.min(100, (day.calories / (userGoal.targetCalories * 1.5)) * 100)}%` }}
                >
                  <div className="bar-value">{Math.round(day.calories)}</div>
                </div>
                <div 
                  className="target-line"
                  style={{ bottom: `${Math.min(100, (userGoal.targetCalories / (userGoal.targetCalories * 1.5)) * 100)}%` }}
                ></div>
              </div>
              <div className="chart-label">{formatDate(day.date)}</div>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color on-target"></div>
            <div className="legend-label">On Target</div>
          </div>
          <div className="legend-item">
            <div className="legend-color under"></div>
            <div className="legend-label">Under Target</div>
          </div>
          <div className="legend-item">
            <div className="legend-color over"></div>
            <div className="legend-label">Over Target</div>
          </div>
          <div className="legend-item">
            <div className="legend-line"></div>
            <div className="legend-label">Target ({Math.round(userGoal.targetCalories)} cal)</div>
          </div>
        </div>
      </div>

      <button 
        className="refresh-insights-button"
        onClick={() => {
          fetchWeeklyData();
          if (onRefresh) onRefresh();
        }}
      >
        Refresh Insights
      </button>
    </div>
  );
};

export default WeeklyGoalInsights; 