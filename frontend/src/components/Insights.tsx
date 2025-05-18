import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie, Radar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend } from 'chart.js';
import '../styles/Insights.css';
import { useUserContext } from '../context/UserContext';
import { getToken } from '../utils/auth';

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

// Modern SVG Icons
const icons = {
  insights: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.5 14C8.5 14 9.875 16 12 16C14.125 16 15.5 14 15.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.5 9C8.5 9 8 9.5 8 10C8 10.5 8.5 11 8.5 11C8.5 11 9 10.5 9 10C9 9.5 8.5 9 8.5 9Z" fill="currentColor"/>
      <path d="M15.5 9C15.5 9 15 9.5 15 10C15 10.5 15.5 11 15.5 11C15.5 11 16 10.5 16 10C16 9.5 15.5 9 15.5 9Z" fill="currentColor"/>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  time: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  cache: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 16L20 18C20 19.1046 19.1046 20 18 20L6 20C4.89543 20 4 19.1046 4 18L4 6C4 4.89543 4.89543 4 6 4L18 4C19.1046 4 20 4.89543 20 6L20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 10L15.7716 9.5858C15.9144 9.5051 16.086 9.5 16.2321 9.57165C16.659 9.77393 16.659 10.4023 16.2321 10.6046C16.086 10.6762 15.9144 10.6711 15.7716 10.5905L15 10.1762L15 12C15 12.5523 15.4477 13 16 13L20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 18C15.5523 18 16 17.5523 16 17C16 16.4477 15.5523 16 15 16C14.4477 16 14 16.4477 14 17C14 17.5523 14.4477 18 15 18Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.1334 5.64C17.8749 4.30583 16.2051 3.42 14.3799 3.1262C12.5546 2.83239 10.6835 3.14229 9.04432 4.01147C7.40518 4.88064 6.09086 6.26784 5.28515 7.95452C4.47943 9.6412 4.22429 11.5364 4.56026 13.3743C4.89624 15.2121 5.80519 16.8958 7.15703 18.1853C8.50887 19.4748 10.2321 20.3024 12.0775 20.5453C13.9229 20.7882 15.8061 20.4342 17.4458 19.5336C19.0855 18.633 20.3883 17.2186 21.1734 15.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.1667 8.38V3.88H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  up: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 16L12 8M12 8L16 12M12 8L8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  down: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8L12 16M12 16L16 12M12 16L8 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  flat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12H20M4 12H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

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
  const { user } = useUserContext();
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
      const token = getToken();
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
    
    // Common chart options with our new design system colors
    const options = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 16,
            weight: 600
          },
          color: '#1E293B' // var(--text-primary)
        },
        legend: {
          position: 'bottom' as const,
          labels: {
            font: {
              family: "'Outfit', sans-serif",
              size: 12
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.8)', // var(--neutral-950) with opacity
          titleFont: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 14
          },
          bodyFont: {
            family: "'Outfit', sans-serif",
            size: 13
          },
          padding: 12,
          cornerRadius: 8,
          boxPadding: 6
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: "'Outfit', sans-serif",
              size: 12
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(226, 232, 240, 0.5)' // var(--neutral-300) with opacity
          },
          ticks: {
            font: {
              family: "'Outfit', sans-serif",
              size: 12
            }
          }
        }
      }
    };
    
    // Use our design system colors for datasets if not already set
    if (data.datasets) {
      const designColors = [
        'rgba(142, 45, 226, 0.8)',  // Primary color
        'rgba(6, 182, 212, 0.8)',   // Secondary color
        'rgba(248, 113, 113, 0.8)', // Accent color
        'rgba(16, 185, 129, 0.8)',  // Success color
        'rgba(245, 158, 11, 0.8)'   // Warning color
      ];

      // Apply custom colors to datasets if they don't have backgroundColor set
      data.datasets = data.datasets.map((dataset: any, index: number) => {
        if (!dataset.backgroundColor) {
          return {
            ...dataset,
            backgroundColor: chart_type.toLowerCase() === 'line' 
              ? 'rgba(142, 45, 226, 0.1)' 
              : designColors[index % designColors.length],
            borderColor: chart_type.toLowerCase() === 'line' 
              ? designColors[index % designColors.length]
              : undefined,
            borderWidth: 2,
            pointBackgroundColor: designColors[index % designColors.length],
            pointBorderColor: '#FFFFFF',
            pointHoverBackgroundColor: '#FFFFFF',
            pointHoverBorderColor: designColors[index % designColors.length],
            pointBorderWidth: 2,
            pointHoverBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          };
        }
        return dataset;
      });
    }
    
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
    const trendIcon = direction === 'up' ? icons.up : direction === 'down' ? icons.down : icons.flat;
    
    return (
      <span className={`trend-indicator ${trendClass}`}>
        <span>{trendIcon}</span> {Math.abs(trend).toFixed(1)}%
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
          <button onClick={() => fetchInsights(false)}>
            <span className="refresh-icon">{icons.refresh}</span>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insights || !insights.statistics || insights.statistics.length === 0) {
    return (
      <div className="insights-container">
        <div className="insights-header">
          <h2>
            <span className="header-icon">{icons.insights}</span>
            Nutrition Insights
          </h2>
          <div className="insights-controls">
            <div className="timeframe-selector">
              <label>
                <span className="meta-icon" style={{marginRight: '0.5rem'}}>{icons.time}</span>
                Analysis Period:
              </label>
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
        <h2>
          <span className="header-icon">{icons.insights}</span>
          Nutrition Insights
        </h2>
        <div className="insights-controls">
          <div className="timeframe-selector">
            <label>
              <span className="meta-icon" style={{marginRight: '0.5rem'}}>{icons.time}</span>
              Analysis Period:
            </label>
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
            <span className="refresh-icon">{icons.refresh}</span>
            {refreshing ? 'Refreshing...' : 'Refresh Insights'}
          </button>
        </div>
      </div>
      
      {insights && (
        <>
          <div className="insights-meta">
            <span className="meta-icon">{icons.time}</span>
            Last updated: {lastRefreshed}
            {insights.is_cached && (
              <span className="cached-indicator">
                <span className="meta-icon">{icons.cache}</span>
                Cached
              </span>
            )}
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