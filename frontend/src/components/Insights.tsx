import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie, Radar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend } from 'chart.js';
import '../styles/Insights.css';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend
);

// Define interfaces for the insight data
interface Insight {
  title: string;
  content: string;
  category: string;
  importance: number;
}

interface Statistic {
  name: string;
  value: number;
  unit: string;
  trend?: number;
  trend_direction?: 'up' | 'down' | 'same';
}

interface ChartData {
  chart_type: string;
  title: string;
  data: any;
}

interface InsightsData {
  insights: Insight[];
  statistics: Statistic[];
  charts: ChartData[];
  generated_at: string;
  is_cached: boolean;
}

interface InsightsProps {
  userId: string;
}

const Insights: React.FC<InsightsProps> = ({ userId }) => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<number>(7); // Default to 7 days
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch insights when component mounts or when timeframe changes
  useEffect(() => {
    fetchInsights(false);
  }, [timeframe]);

  // Function to fetch insights
  const fetchInsights = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    setRefreshing(forceRefresh);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          force_refresh: forceRefresh,
          days_to_analyze: timeframe
        }),
      });

      if (!response.ok) {
        throw new Error(`Error fetching insights: ${response.statusText}`);
      }

      const data = await response.json();
      setInsights(data);
      
      // Format date for display
      const generatedDate = new Date(data.generated_at);
      setLastRefreshed(generatedDate.toLocaleString());
      
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to render the appropriate chart based on type
  const renderChart = (chartData: ChartData) => {
    const { chart_type, title, data } = chartData;
    
    // Common chart options
    const options = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title
        },
        legend: {
          position: 'bottom' as const,
        }
      }
    };
    
    switch (chart_type.toLowerCase()) {
      case 'line':
        return <Line data={data} options={options} />;
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'pie':
        return <Pie data={data} options={options} />;
      case 'radar':
        return <Radar data={data} options={options} />;
      default:
        return <div>Unsupported chart type: {chart_type}</div>;
    }
  };

  // Render trend indicators for statistics
  const renderTrendIndicator = (trend?: number, direction?: string) => {
    if (trend === undefined || direction === undefined) return null;
    
    const trendClass = direction === 'up' ? 'trend-up' : direction === 'down' ? 'trend-down' : 'trend-same';
    const trendSymbol = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
    
    return (
      <span className={`trend-indicator ${trendClass}`}>
        {trendSymbol} {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  // Format value with appropriate unit
  const formatValue = (value: number, unit: string) => {
    // Handle special formatting for percentages, calories, etc.
    if (unit === '%') {
      return `${value.toFixed(1)}${unit}`;
    } else if (unit === 'kcal' || unit === 'calories') {
      return `${Math.round(value)} ${unit}`;
    } else if (unit === 'g') {
      return `${value.toFixed(1)}${unit}`;
    }
    
    // Default formatting
    return `${value} ${unit}`;
  };

  if (loading && !insights) {
    return (
      <div className="insights-container">
        <div className="insights-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your nutrition data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-container">
        <div className="insights-error">
          <h3>Unable to load insights</h3>
          <p>{error}</p>
          <button onClick={() => fetchInsights(false)}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!insights || !insights.statistics || insights.statistics.length === 0) {
    return (
      <div className="insights-container">
        <div className="insights-header">
          <h2>Nutrition Insights</h2>
          <div className="insights-controls">
            <div className="timeframe-selector">
              <label>Analysis Period:</label>
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(parseInt(e.target.value))}
                disabled={loading}
              >
                <option value={7}>Last 7 Days</option>
                <option value={14}>Last 14 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="no-data-container">
          <h3>No Insights Available Yet</h3>
          <p>We need more data to generate meaningful insights about your nutrition habits.</p>
          
          <div className="insights-placeholder">
            <div className="placeholder-statistics">
              <div className="statistic-card">
                <div className="statistic-name">Average Calories</div>
                <div className="statistic-value">-- kcal</div>
              </div>
              <div className="statistic-card">
                <div className="statistic-name">Protein Intake</div>
                <div className="statistic-value">-- g</div>
              </div>
              <div className="statistic-card">
                <div className="statistic-name">Carb Intake</div>
                <div className="statistic-value">-- g</div>
              </div>
              <div className="statistic-card">
                <div className="statistic-name">Fat Intake</div>
                <div className="statistic-value">-- g</div>
              </div>
            </div>
            
            <div className="placeholder-charts">
              <div className="chart-container">
                <h4>Nutrition Trends</h4>
                <div className="no-data-message">
                  Log at least 3 days of meals to see your nutrition trends
                </div>
              </div>
              <div className="chart-container">
                <h4>Macronutrient Distribution</h4>
                <div className="no-data-message">
                  Track your meals to see your macronutrient balance
                </div>
              </div>
            </div>
            
            <div className="placeholder-insights">
              <div className="insight-card">
                <div className="insight-category">Getting Started</div>
                <h3 className="insight-title">Start Your Nutrition Journey</h3>
                <p className="insight-content">
                  Begin by logging your meals for at least 3 days. This will help us understand your eating patterns and provide personalized insights about your nutrition habits.
                </p>
              </div>
              <div className="insight-card">
                <div className="insight-category">Tips</div>
                <h3 className="insight-title">How to Get Started</h3>
                <p className="insight-content">
                  1. Log your meals as you eat them<br/>
                  2. Include all meals and snacks<br/>
                  3. Be as accurate as possible with portions<br/>
                  4. Track for at least 3 days to see trends
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h2>Nutrition Insights</h2>
        <div className="insights-controls">
          <div className="timeframe-selector">
            <label>Analysis Period:</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(parseInt(e.target.value))}
              disabled={loading}
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
          
          <button 
            className="refresh-button" 
            onClick={() => fetchInsights(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Insights'}
          </button>
        </div>
      </div>
      
      {insights && (
        <>
          <div className="insights-meta">
            <div className="last-updated">
              Last updated: {lastRefreshed}
              {insights.is_cached && <span className="cached-indicator"> (Cached)</span>}
            </div>
          </div>
          
          {/* Statistics Section */}
          {insights.statistics && insights.statistics.length > 0 && (
            <div className="insights-statistics">
              {insights.statistics.map((stat, index) => (
                <div key={index} className="statistic-card">
                  <div className="statistic-name">{stat.name}</div>
                  <div className="statistic-value">
                    {formatValue(stat.value, stat.unit)}
                    {renderTrendIndicator(stat.trend, stat.trend_direction)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Charts Section */}
          {insights.charts && insights.charts.length > 0 && (
            <div className="insights-charts">
              {insights.charts.map((chart, index) => (
                <div key={index} className="chart-container">
                  {renderChart(chart)}
                </div>
              ))}
            </div>
          )}
          
          {/* Insights Section */}
          <div className="insights-list">
            {insights.insights.sort((a, b) => b.importance - a.importance).map((insight, index) => (
              <div key={index} className={`insight-card importance-${insight.importance}`}>
                <div className="insight-category">{insight.category}</div>
                <h3 className="insight-title">{insight.title}</h3>
                <p className="insight-content">{insight.content}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Insights; 