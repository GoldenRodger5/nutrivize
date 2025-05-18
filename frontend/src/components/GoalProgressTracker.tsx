import React, { useState, useEffect } from 'react';
import '../styles/GoalProgressTracker.css';
import api from '../utils/api';

interface WeightEntry {
  date: string;
  weight: number;
}

interface GoalProgressTrackerProps {
  userId: string;
  goalType: 'lose' | 'maintain' | 'gain';
  targetWeight: number;
  startWeight: number;
  startDate: string;
  weeklyRate?: number;
}

// Modern SVG Icons
const icons = {
  add: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  weight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.5 20H5.5C4.83696 20 4.20107 19.7366 3.73223 19.2678C3.26339 18.7989 3 18.163 3 17.5V6.5C3 5.83696 3.26339 5.20107 3.73223 4.73223C4.20107 4.26339 4.83696 4 5.5 4H18.5C19.163 4 19.7989 4.26339 20.2678 4.73223C20.7366 5.20107 21 5.83696 21 6.5V17.5C21 18.163 20.7366 18.7989 20.2678 19.2678C19.7989 19.7366 19.163 20 18.5 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 20V15C8 13.9391 8.42143 12.9217 9.17157 12.1716C9.92172 11.4214 10.9391 11 12 11C13.0609 11 14.0783 11.4214 14.8284 12.1716C15.5786 12.9217 16 13.9391 16 15V20" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 9C13.1046 9 14 8.10457 14 7C14 5.89543 13.1046 5 12 5C10.8954 5 10 5.89543 10 7C10 8.10457 10.8954 9 12 9Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  streak: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 16L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 10H21V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  days: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 11H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 3L8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  completion: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 6V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C9.3345 3 6.93964 4.15875 5.29168 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 8L5 5M5 5L8 8M5 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  recommendation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.5 9.5C9.5 8.11929 10.6193 7 12 7C13.3807 7 14.5 8.11929 14.5 9.5C14.5 10.8807 13.3807 12 12 12C10.6193 12 9.5 10.8807 9.5 9.5Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M15.2981 20.0003C13.6108 20.6236 12.8672 21 12 21C10.5194 21 9.22273 19.8659 7.62939 17.5978C6.03605 15.3297 5.23938 14.1956 5.07295 13.0228C4.90652 11.85 5.32861 10.8546 6.17278 8.86371L6.99736 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8.7019 20.0003C10.3892 20.6236 11.1328 21 12 21C13.4806 21 14.7773 19.8659 16.3706 17.5978C17.964 15.3297 18.7606 14.1956 18.9271 13.0228C19.0935 11.85 18.6714 10.8546 17.8272 8.86371L17.0026 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14.5 9.5C14.5 10.8807 13.3807 12 12 12C10.6193 12 9.5 10.8807 9.5 9.5C9.5 8.11929 10.6193 7 12 7C13.3807 7 14.5 8.11929 14.5 9.5Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.1334 5.64C17.8749 4.30583 16.2051 3.42 14.3799 3.1262C12.5546 2.83239 10.6835 3.14229 9.04432 4.01147C7.40518 4.88064 6.09086 6.26784 5.28515 7.95452C4.47943 9.6412 4.22429 11.5364 4.56026 13.3743C4.89624 15.2121 5.80519 16.8958 7.15703 18.1853C8.50887 19.4748 10.2321 20.3024 12.0775 20.5453C13.9229 20.7882 15.8061 20.4342 17.4458 19.5336C19.0855 18.633 20.3883 17.2186 21.1734 15.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M21.1667 8.38V3.88H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

const GoalProgressTracker: React.FC<GoalProgressTrackerProps> = ({
  userId,
  goalType,
  targetWeight,
  startWeight,
  startDate,
  weeklyRate = 0.5
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [consistencyStreak, setConsistencyStreak] = useState(0);
  const [daysOnTrack, setDaysOnTrack] = useState(0);
  const [projectedCompletion, setProjectedCompletion] = useState<string | null>(null);
  const [currentWeight, setCurrentWeight] = useState(startWeight);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [weightChange, setWeightChange] = useState(0);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        if (isMounted) setLoading(true);
        await fetchWeightData(isMounted);
      } catch (err) {
        console.error('Error in weight data loading:', err);
        if (isMounted) setError('Unable to load weight tracking data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const fetchWeightData = async (isMounted = true) => {
    try {
      if (isMounted) {
        setLoading(true);
        setError('');
      }

      // Get weight entries from the API
      const response = await api.get(`/weights?userId=${userId}`);
      const weightData = response.data.sort((a: WeightEntry, b: WeightEntry) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (!isMounted) return;

      setWeightEntries(weightData);

      // Set current weight if there are entries
      if (weightData.length > 0) {
        const latestEntry = weightData[weightData.length - 1];
        setCurrentWeight(latestEntry.weight);
      }

      // Calculate progress percentage
      calculateProgress(weightData);

      // Calculate consistency streak
      calculateConsistencyStreak(weightData);

      // Calculate projected completion date
      calculateProjectedCompletion(weightData);

    } catch (err) {
      console.error('Error fetching weight data:', err);
      if (isMounted) setError('Unable to load weight tracking data');
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  const calculateProgress = (entries: WeightEntry[]) => {
    if (entries.length === 0) {
      setProgressPercentage(0);
      setWeightChange(0);
      return;
    }

    const latestWeight = entries[entries.length - 1].weight;
    const totalWeightToChange = Math.abs(targetWeight - startWeight);
    const currentChange = Math.abs(latestWeight - startWeight);
    
    // Calculate progress as a percentage of the total goal
    const progress = Math.min(100, Math.max(0, (currentChange / totalWeightToChange) * 100));
    setProgressPercentage(Math.round(progress));
    
    // Calculate total weight change
    const change = startWeight - latestWeight;
    setWeightChange(change);
  };

  const calculateConsistencyStreak = (entries: WeightEntry[]) => {
    if (entries.length === 0) {
      setConsistencyStreak(0);
      setDaysOnTrack(0);
      return;
    }

    // Calculate days with entries (on track)
    setDaysOnTrack(entries.length);

    // Calculate the current streak (consecutive days with entries)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 1;
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day

    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const currentDate = new Date(sortedEntries[i].date);
      const prevDate = new Date(sortedEntries[i + 1].date);
      
      // Check if entries are consecutive days
      const daysDiff = Math.round(Math.abs((currentDate.getTime() - prevDate.getTime()) / oneDay));
      
      if (daysDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    setConsistencyStreak(streak);
  };

  const calculateProjectedCompletion = (entries: WeightEntry[]) => {
    if (entries.length < 2) {
      // Not enough data to project completion
      const weeksToGoal = Math.abs(targetWeight - startWeight) / weeklyRate;
      const projectedDate = new Date(startDate);
      projectedDate.setDate(projectedDate.getDate() + Math.round(weeksToGoal * 7));
      
      setProjectedCompletion(projectedDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
      return;
    }

    // Calculate average weight change per day based on actual data
    const firstEntry = entries[0];
    const lastEntry = entries[entries.length - 1];
    const firstDate = new Date(firstEntry.date);
    const lastDate = new Date(lastEntry.date);
    const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));
    const weightDiff = lastEntry.weight - firstEntry.weight;
    const avgWeightChangePerDay = weightDiff / daysDiff;

    // Calculate days until goal is reached
    const remainingChange = targetWeight - lastEntry.weight;
    const daysToGoal = Math.abs(remainingChange / avgWeightChangePerDay);
    
    // Check if the direction is correct (losing or gaining as needed)
    const correctDirection = (goalType === 'lose' && avgWeightChangePerDay < 0) || 
                             (goalType === 'gain' && avgWeightChangePerDay > 0) ||
                             (goalType === 'maintain' && Math.abs(avgWeightChangePerDay) < 0.05);
    
    if (!correctDirection || isNaN(daysToGoal) || !isFinite(daysToGoal)) {
      setProjectedCompletion('Trend not aligned with goal');
      return;
    }

    // Calculate projected completion date
    const projectedDate = new Date(lastDate);
    projectedDate.setDate(lastDate.getDate() + Math.round(daysToGoal));
    
    setProjectedCompletion(projectedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      return;
    }
    
    try {
      const weightEntry = {
        date: new Date().toISOString().split('T')[0],
        weight: parseFloat(newWeight),
        userId
      };
      
      await api.post('/weights', weightEntry);
      
      setNewWeight('');
      setShowAddWeight(false);
      
      // Refresh data
      fetchWeightData();
    } catch (err) {
      console.error('Error adding weight entry:', err);
      setError('Failed to add weight entry');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="goal-tracker-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <p>Loading goal progress...</p>
      </div>
    );
  }

  if (error) {
    return <div className="goal-tracker-error">{error}</div>;
  }

  return (
    <div className="goal-progress-tracker">
      <div className="tracker-header">
        <h2>Goal Progress</h2>
        <button 
          className="add-weight-button"
          onClick={() => setShowAddWeight(!showAddWeight)}
        >
          <span className="button-icon">{icons.add}</span>
          {showAddWeight ? 'Cancel' : 'Add Weight'}
        </button>
      </div>
      
      {showAddWeight && (
        <div className="add-weight-form">
          <div className="form-header">
            <span className="form-icon">{icons.weight}</span>
            <h3>Record Current Weight</h3>
          </div>
          
          <form onSubmit={handleAddWeight}>
            <div className="form-group">
              <label htmlFor="new-weight">Current Weight (kg)</label>
              <input
                type="number"
                id="new-weight"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                step="0.1"
                min="20"
                max="500"
                placeholder="Enter your weight"
                required
              />
            </div>
            <button type="submit" className="submit-weight">Save Weight</button>
          </form>
        </div>
      )}
      
      <div className="weight-goal-summary">
        <div className="summary-header">
          <span className="summary-icon">{icons.weight}</span>
          <h3>Weight Target Progress</h3>
        </div>
        
        <div className="weight-progress">
          <div className="current-weight">
            <span className="weight-label">Starting</span>
            <span className="weight-value">{startWeight} kg</span>
          </div>
          
          <div className="progress-container">
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
              <div 
                className="current-marker"
                style={{ left: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="target-weight">
            <span className="weight-label">Target</span>
            <span className="weight-value">{targetWeight} kg</span>
          </div>
        </div>
        
        <div className="progress-stats">
          <div className="progress-stat">
            <span className="stat-label">Current</span>
            <span className="stat-value">{currentWeight} kg</span>
          </div>
          
          <div className="progress-stat">
            <span className="stat-label">Change</span>
            <span className={`stat-value ${weightChange > 0 ? 'positive' : weightChange < 0 ? 'negative' : ''}`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
            </span>
          </div>
          
          <div className="progress-stat">
            <span className="stat-label">Progress</span>
            <span className="stat-value">{progressPercentage}%</span>
          </div>
        </div>
      </div>
      
      <div className="goal-metrics">
        <div className="metric-box consistency">
          <div className="metric-icon">{icons.streak}</div>
          <div className="metric-value">{consistencyStreak}</div>
          <div className="metric-label">Day Streak</div>
        </div>
        
        <div className="metric-box on-track">
          <div className="metric-icon">{icons.days}</div>
          <div className="metric-value">{daysOnTrack}</div>
          <div className="metric-label">Total Tracking Days</div>
        </div>
        
        {projectedCompletion && (
          <div className="metric-box completion">
            <div className="metric-icon">{icons.completion}</div>
            <div className="metric-value-text">{projectedCompletion}</div>
            <div className="metric-label">Projected Completion</div>
          </div>
        )}
      </div>
      
      {weightEntries.length > 0 && (
        <div className="weight-history">
          <div className="history-header">
            <span className="history-icon">{icons.history}</span>
            <h3>Weight History</h3>
          </div>
          
          <div className="weight-chart">
            {weightEntries.map((entry, index) => (
              <div key={entry.date} className="weight-point">
                <div className="point-connector">
                  {index > 0 && (
                    <div 
                      className={`connector-line ${
                        entry.weight < weightEntries[index - 1].weight ? 'decreasing' :
                        entry.weight > weightEntries[index - 1].weight ? 'increasing' : 'stable'
                      }`}
                    ></div>
                  )}
                </div>
                <div className="weight-date">{formatDate(entry.date)}</div>
                <div className="weight-dot"></div>
                <div className="weight-value">{entry.weight} kg</div>
                
                {index > 0 && (
                  <div className="weight-change">
                    {entry.weight - weightEntries[index - 1].weight > 0 ? '+' : ''}
                    {(entry.weight - weightEntries[index - 1].weight).toFixed(1)} kg
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="goal-recommendations">
        <div className="recommendation-header">
          <span className="recommendation-icon">{icons.recommendation}</span>
          <h3>Personalized Recommendations</h3>
        </div>
        
        <div className="recommendation-content">
          {goalType === 'lose' && (
            <>
              {weightEntries.length < 3 ? (
                <p>Track your weight consistently for more personalized recommendations. Aim to log at least 3 times per week.</p>
              ) : weightChange > 0 ? (
                <p>Your current trend shows weight gain rather than loss. Consider reviewing your calorie intake and increasing your activity level.</p>
              ) : weightChange < -2 * weeklyRate && Math.abs(weightChange) / weightEntries.length * 7 > weeklyRate * 2 ? (
                <p>You're losing weight faster than your goal rate. While this might seem positive, losing too quickly can lead to muscle loss and be harder to maintain.</p>
              ) : (
                <p>You're making good progress toward your weight loss goal. Maintain your consistency and keep tracking your nutrition.</p>
              )}
            </>
          )}
          
          {goalType === 'gain' && (
            <>
              {weightEntries.length < 3 ? (
                <p>Track your weight consistently for more personalized recommendations. Aim to log at least 3 times per week.</p>
              ) : weightChange < 0 ? (
                <p>Your current trend shows weight loss rather than gain. Consider increasing your calorie intake to create a surplus.</p>
              ) : weightChange > 2 * weeklyRate && Math.abs(weightChange) / weightEntries.length * 7 > weeklyRate * 2 ? (
                <p>You're gaining weight faster than your goal rate. For optimal muscle growth with minimal fat gain, consider adjusting your calorie surplus.</p>
              ) : (
                <p>You're making good progress toward your weight gain goal. Keep focusing on protein intake and resistance training.</p>
              )}
            </>
          )}
          
          {goalType === 'maintain' && (
            <>
              {weightEntries.length < 3 ? (
                <p>Track your weight consistently for more personalized recommendations. Aim to log at least 3 times per week.</p>
              ) : Math.abs(weightChange) > 2 ? (
                <p>Your weight has changed by {Math.abs(weightChange).toFixed(1)} kg, which is more than expected for maintenance. Consider adjusting your calorie intake.</p>
              ) : (
                <p>You're doing a great job maintaining your weight. Continue with your current nutrition and exercise routine.</p>
              )}
            </>
          )}
        </div>
      </div>
      
      <button 
        className="refresh-tracker"
        onClick={() => fetchWeightData(true)}
      >
        <span className="refresh-icon">{icons.refresh}</span>
        Refresh Goal Data
      </button>
    </div>
  );
};

export default GoalProgressTracker; 