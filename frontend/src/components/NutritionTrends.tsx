import React, { useState, useEffect } from 'react';
import '../styles/NutritionTrends.css';

// Modern SVG Icons
const icons = {
  nutrition: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 11C5.11929 11 4 9.88071 4 8.5C4 7.11929 5.11929 6 6.5 6C7.88071 6 9 7.11929 9 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 8C18.8807 8 20 6.88071 20 5.5C20 4.11929 18.8807 3 17.5 3C16.1193 3 15 4.11929 15 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 15.5C20 19.0899 16.9706 22 12 22C7.02944 22 4 19.0899 4 15.5C4 11.9101 7.02944 9 12 9C16.9706 9 20 11.9101 20 15.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.1334 5.64C17.8749 4.30583 16.2051 3.42 14.3799 3.1262C12.5546 2.83239 10.6835 3.14229 9.04432 4.01147C7.40518 4.88064 6.09086 6.26784 5.28515 7.95452C4.47943 9.6412 4.22429 11.5364 4.56026 13.3743C4.89624 15.2121 5.80519 16.8958 7.15703 18.1853C8.50887 19.4748 10.2321 20.3024 12.0775 20.5453C13.9229 20.7882 15.8061 20.4342 17.4458 19.5336C19.0855 18.633 20.3883 17.2186 21.1734 15.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.1667 8.38V3.88H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calories: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 22V15M5 15L3 17L5 15ZM5 15L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 22V12M12 12L10 14L12 12ZM12 12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 22V9M19 9L17 11L19 9ZM19 9L21 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 8V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 6V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M19 6V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  protein: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 15L3 9C3 5.68629 5.68629 3 9 3L15 3C18.3137 3 21 5.68629 21 9V15C21 18.3137 18.3137 21 15 21H9C5.68629 21 3 18.3137 3 15Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M3 15C7 13 8 12 9.5 9.5C11 7 13.5 5 17.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 11C7 11 9.5 11 12 9.5C14.5 8 16 7 21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  carbs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 9C3 5.68629 5.68629 3 9 3H15C18.3137 3 21 5.68629 21 9V14C21 14 19.5 12 17.5 12C15.5 12 13.5 14 12 14C10.5 14 8.5 12 6.5 12C4.5 12 3 14 3 14V9Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 20C18 21.1046 17.1046 22 16 22H8C6.89543 22 6 21.1046 6 20V19C6 17.8954 6.89543 17 8 17H16C17.1046 17 18 17.8954 18 19V20Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  fat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.6569 14.3431C19.781 12.219 19.781 8.78104 17.6569 6.65685C15.5327 4.53266 12.0948 4.53266 9.97056 6.65685C7.84637 8.78104 7.84637 12.219 9.97056 14.3431L13.8137 18.1863L17.6569 14.3431Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14.5" cy="9.5" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  breakdown: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6L6 6M21 6L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 12L16 12M21 12L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 18L8 18M21 18L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

interface NutritionDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  completed_meals: number;
  water_intake: number;
  activity_level: string;
}

interface NutritionSummary {
  average_calories: number;
  average_protein: number;
  average_carbs: number;
  average_fat: number;
  average_fiber: number;
  total_days: number;
}

interface NutritionApiResponse {
  data: NutritionDataPoint[];
  summary: NutritionSummary;
}

interface NutritionTrendsProps {
  userId: string;
  days?: number;
}

const NutritionTrends = ({ userId, days = 7 }: NutritionTrendsProps) => {
  const [nutritionData, setNutritionData] = useState<NutritionDataPoint[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNutritionData();
  }, [userId, days]);

  const fetchNutritionData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range (last N days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1); // Include today
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Try the nutrition endpoint directly without /api prefix
      const response = await fetch(
        `/nutrition/aggregates?user_id=${userId}&start_date=${startDateStr}&end_date=${endDateStr}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition data');
      }
      
      const responseData = await response.json() as NutritionApiResponse;
      
      setNutritionData(responseData.data);
      setSummary(responseData.summary);
      setError('');
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setError('Error fetching nutrition data');
    } finally {
      setLoading(false);
    }
  };

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if we have data
  const hasData = nutritionData.length > 0;

  return (
    <div className="nutrition-trends">
      <h2>
        <span className="header-icon">{icons.nutrition}</span>
        Nutrition Trends (Last {days} Days)
      </h2>
      
      {loading ? (
        <div className="nutrition-loading">
          <div className="nutrition-loading-text">Loading nutrition data...</div>
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="nutrition-error">
          {error}
        </div>
      ) : !hasData ? (
        <div className="no-data-container">
          <div className="no-data-title">No Nutrition Data Available</div>
          <div className="no-data-description">
            Start logging your meals to see your nutrition trends and progress over time.
          </div>
          
          <div className="macro-placeholder-grid">
            <div className="macro-placeholder">
              <div className="macro-label">Calories</div>
              <div className="macro-value calories-value">--</div>
            </div>
            <div className="macro-placeholder">
              <div className="macro-label">Protein</div>
              <div className="macro-value protein-value">--g</div>
            </div>
            <div className="macro-placeholder">
              <div className="macro-label">Carbs</div>
              <div className="macro-value carbs-value">--g</div>
            </div>
            <div className="macro-placeholder">
              <div className="macro-label">Fat</div>
              <div className="macro-value fat-value">--g</div>
            </div>
          </div>
          
          <div className="chart-placeholder">
            <div className="chart-placeholder-content">
              <div className="chart-placeholder-title">Daily Calories Chart</div>
              <div>Log meals to see your calorie trends</div>
            </div>
          </div>
          
          <div className="chart-placeholder">
            <div className="chart-placeholder-content">
              <div className="chart-placeholder-title">Macronutrient Breakdown</div>
              <div>Track your protein, carbs, and fat intake</div>
            </div>
          </div>
          
          <div className="action-container">
            <button className="action-button" onClick={fetchNutritionData}>
              <span className="refresh-icon">{icons.refresh}</span>
              Start Logging Meals
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          {summary && (
            <div className="summary-section">
              <h3>Nutrition Summary</h3>
              <div className="summary-grid">
                <div className="summary-item calories-item">
                  <div className="summary-item-label">Avg. Calories</div>
                  <div className="summary-item-value calories-value">{summary.average_calories}</div>
                </div>
                <div className="summary-item protein-item">
                  <div className="summary-item-label">Avg. Protein</div>
                  <div className="summary-item-value protein-value">{summary.average_protein}g</div>
                </div>
                <div className="summary-item carbs-item">
                  <div className="summary-item-label">Avg. Carbs</div>
                  <div className="summary-item-value carbs-value">{summary.average_carbs}g</div>
                </div>
                <div className="summary-item fat-item">
                  <div className="summary-item-label">Avg. Fat</div>
                  <div className="summary-item-value fat-value">{summary.average_fat}g</div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Calorie Chart */}
          <div className="chart-section">
            <h3>
              <span className="header-icon">{icons.calories}</span>
              Daily Calories
            </h3>
            <div className="calorie-bars">
              {nutritionData
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((data) => (
                  <div key={data.date} className="bar-container">
                    <div 
                      className="calorie-bar"
                      style={{ height: `${Math.min((data.calories / 3000) * 200, 200)}px` }}
                    >
                      <div className="bar-value">{data.calories}</div>
                    </div>
                    <div className="bar-date">{formatDate(data.date)}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* Macronutrient Breakdown */}
          <div className="chart-section">
            <h3>
              <span className="header-icon">{icons.breakdown}</span>
              Macronutrient Breakdown
            </h3>
            <div className="macro-breakdown">
              {nutritionData
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((data) => (
                  <div key={data.date} className="day-breakdown">
                    <div className="day-date">{formatDate(data.date)}</div>
                    <div className="macro-bar">
                      <div 
                        className="protein-segment"
                        style={{ width: `${(data.protein / (data.protein + data.carbs + data.fat)) * 100}%` }}
                      >
                        {data.protein}g
                      </div>
                      <div 
                        className="carbs-segment"
                        style={{ width: `${(data.carbs / (data.protein + data.carbs + data.fat)) * 100}%` }}
                      >
                        {data.carbs}g
                      </div>
                      <div 
                        className="fat-segment"
                        style={{ width: `${(data.fat / (data.protein + data.carbs + data.fat)) * 100}%` }}
                      >
                        {data.fat}g
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="macro-legend">
              <div className="legend-item">
                <div className="legend-color protein-color"></div>
                <span className="legend-text">Protein</span>
              </div>
              <div className="legend-item">
                <div className="legend-color carbs-color"></div>
                <span className="legend-text">Carbs</span>
              </div>
              <div className="legend-item">
                <div className="legend-color fat-color"></div>
                <span className="legend-text">Fat</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {hasData && (
        <div className="action-container">
          <button 
            className="action-button" 
            onClick={fetchNutritionData} 
            disabled={loading}
          >
            <span className="refresh-icon">{icons.refresh}</span>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NutritionTrends; 