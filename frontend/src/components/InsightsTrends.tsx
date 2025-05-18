import React, { useState, useEffect } from 'react';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie, Radar } from 'react-chartjs-2';
import { getToken } from '../utils/auth';
import '../styles/InsightsTrends.css';

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
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.1334 5.64C17.8749 4.30583 16.2051 3.42 14.3799 3.1262C12.5546 2.83239 10.6835 3.14229 9.04432 4.01147C7.40518 4.88064 6.09086 6.26784 5.28515 7.95452C4.47943 9.6412 4.22429 11.5364 4.56026 13.3743C4.89624 15.2121 5.80519 16.8958 7.15703 18.1853C8.50887 19.4748 10.2321 20.3024 12.0775 20.5453C13.9229 20.7882 15.8061 20.4342 17.4458 19.5336C19.0855 18.633 20.3883 17.2186 21.1734 15.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.1667 8.38V3.88H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  insight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.5 14C8.5 14 9.875 16 12 16C14.125 16 15.5 14 15.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.5 9C8.5 9 8 9.5 8 10C8 10.5 8.5 11 8.5 11C8.5 11 9 10.5 9 10C9 9.5 8.5 9 8.5 9Z" fill="currentColor"/>
      <path d="M15.5 9C15.5 9 15 9.5 15 10C15 10.5 15.5 11 15.5 11C15.5 11 16 10.5 16 10C16 9.5 15.5 9 15.5 9Z" fill="currentColor"/>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  trend: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15L12 9L17 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  all: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 5C4 4.44772 4.44772 4 5 4H9C9.55228 4 10 4.44772 10 5V9C10 9.55228 9.55228 10 9 10H5C4.44772 10 4 9.55228 4 9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 15C4 14.4477 4.44772 14 5 14H9C9.55228 14 10 14.4477 10 15V19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 5C14 4.44772 14.4477 4 15 4H19C19.5523 4 20 4.44772 20 5V9C20 9.55228 19.5523 10 19 10H15C14.4477 10 14 9.55228 14 9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 15C14 14.4477 14.4477 14 15 14H19C19.5523 14 20 14.4477 20 15V19C20 19.5523 19.5523 20 19 20H15C14.4477 20 14 19.5523 14 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ai: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 8L16 10.5M12 8L8 10.5M12 8V4M16 10.5V15.5L12 18L8 15.5V10.5M16 10.5L12 13L8 10.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
};

interface InsightsTrendsProps {
  userId: string;
}

interface AIInsight {
  title: string;
  content: string;
  type: 'insight' | 'trend';
  importance: number;
  category?: string;
}

interface ChartData {
  chart_type: string;
  title: string;
  data: any;
  type: 'insight' | 'trend';
}

interface InsightsTrendsData {
  insights: AIInsight[];
  charts: ChartData[];
  generated_at: string;
  is_cached: boolean;
}

const InsightsTrends: React.FC<InsightsTrendsProps> = ({ userId }) => {
  const [data, setData] = useState<InsightsTrendsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<number>(14); // Default to 14 days
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'all' | 'insights' | 'trends'>('all');

  // Fetch data when component mounts or when timeframe changes
  useEffect(() => {
    fetchInsightsTrends(false);
  }, [timeframe, userId]);

  const fetchInsightsTrends = async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    setRefreshing(forceRefresh);

    try {
      const token = getToken();
      const response = await fetch('/api/insights-trends', {
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
        throw new Error(`Error fetching insights and trends: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // Make sure each chart has a type property (insight or trend)
      // This is needed for filtering charts based on the active tab
      if (responseData.charts) {
        responseData.charts = responseData.charts.map((chart: any) => {
          // If the chart doesn't have a type, infer it from the title or set a default
          if (!chart.type) {
            // Check if the title contains trend-related keywords
            const isTrend = chart.title.toLowerCase().includes('trend') || 
                           chart.title.toLowerCase().includes('over time') || 
                           chart.title.toLowerCase().includes('progress') ||
                           chart.chart_type.toLowerCase() === 'line';
            chart.type = isTrend ? 'trend' : 'insight';
          }
          return chart;
        });
      }
      
      setData(responseData);
      
      // Format date for display
      const generatedDate = new Date(responseData.generated_at);
      setLastRefreshed(generatedDate.toLocaleString());
      
    } catch (err) {
      console.error('Error fetching insights and trends:', err);
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

  const filteredInsights = () => {
    if (!data?.insights) return [];
    if (activeSection === 'all') return data.insights;
    return data.insights.filter(insight => 
      activeSection === 'insights' ? insight.type === 'insight' : insight.type === 'trend'
    );
  };
  
  const filteredCharts = () => {
    if (!data?.charts) return [];
    if (activeSection === 'all') return data.charts;
    return data.charts.filter(chart => 
      activeSection === 'insights' ? chart.type === 'insight' : chart.type === 'trend'
    );
  };

  if (loading && !data) {
    return (
      <div className="insights-trends-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Analyzing your nutrition data with AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-trends-container">
        <div className="error-state">
          <h3>Unable to load insights and trends</h3>
          <p>{error}</p>
          <button onClick={() => fetchInsightsTrends(false)}>
            <span className="refresh-icon">{icons.refresh}</span>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.insights || data.insights.length === 0) {
    return (
      <div className="insights-trends-container">
        <div className="insights-trends-header">
          <h2>
            <span className="header-icon">{icons.ai}</span>
            AI Nutrition Insights & Trends
          </h2>
          <div className="insights-trends-controls">
            <div className="timeframe-selector">
              <label htmlFor="timeframe-select">
                <span className="selector-icon">{icons.time}</span>
                Analysis Period:
              </label>
              <select 
                id="timeframe-select"
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
          <h3>Not Enough Data Available</h3>
          <p>We need more data to generate meaningful insights and trends about your nutrition habits.</p>
          
          <div className="placeholder-content">
            <div className="placeholder-card">
              <h4>How to Get Started</h4>
              <ol>
                <li>Log your meals and snacks daily</li>
                <li>Be consistent with tracking for at least 7 days</li>
                <li>Include a variety of foods in your logs</li>
                <li>Track for at least a week to see AI-generated insights</li>
              </ol>
            </div>
            
            <div className="placeholder-visuals">
              <div className="placeholder-chart">
                <div className="placeholder-chart-title">Calorie Trends</div>
                <div className="placeholder-chart-content">
                  <p>Start logging to see AI-analyzed patterns</p>
                </div>
              </div>
              
              <div className="placeholder-chart">
                <div className="placeholder-chart-title">Macro Distribution</div>
                <div className="placeholder-chart-content">
                  <p>Log meals to see your nutrition balance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-trends-container">
      <div className="insights-trends-header">
        <h2>
          <span className="header-icon">{icons.ai}</span>
          AI Nutrition Insights & Trends
        </h2>
        <div className="insights-trends-controls">
          <div className="timeframe-selector">
            <label htmlFor="timeframe-select">
              <span className="selector-icon">{icons.time}</span>
              Analysis Period:
            </label>
            <select 
              id="timeframe-select"
              value={timeframe} 
              onChange={(e) => setTimeframe(parseInt(e.target.value))}
              disabled={loading || refreshing}
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
          <button 
            className="refresh-button" 
            onClick={() => fetchInsightsTrends(true)}
            disabled={loading || refreshing}
            aria-label="Refresh analysis data"
          >
            <span className="refresh-icon">{icons.refresh}</span>
            {refreshing ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>
      
      <div className="insights-trends-meta">
        <span className="meta-icon">{icons.time}</span>
        Last updated: {lastRefreshed}
        {data.is_cached && (
          <span className="cached-indicator">
            <span className="cache-icon">{icons.cache}</span>
            Cached
          </span>
        )}
      </div>
      
      <div className="insights-trends-tabs" role="tablist">
        <button 
          className={activeSection === 'all' ? 'active' : ''} 
          onClick={() => setActiveSection('all')}
          role="tab"
          aria-selected={activeSection === 'all'}
          aria-controls="all-tab-content"
          id="all-tab"
        >
          <span className="tab-icon">{icons.all}</span>
          All
        </button>
        <button 
          className={activeSection === 'insights' ? 'active' : ''} 
          onClick={() => setActiveSection('insights')}
          role="tab"
          aria-selected={activeSection === 'insights'}
          aria-controls="insights-tab-content"
          id="insights-tab"
        >
          <span className="tab-icon">{icons.insight}</span>
          Insights
        </button>
        <button 
          className={activeSection === 'trends' ? 'active' : ''} 
          onClick={() => setActiveSection('trends')}
          role="tab"
          aria-selected={activeSection === 'trends'}
          aria-controls="trends-tab-content"
          id="trends-tab"
        >
          <span className="tab-icon">{icons.trend}</span>
          Trends
        </button>
      </div>
      
      {/* Charts Section */}
      {filteredCharts().length > 0 && (
        <div 
          className="charts-section"
          id={`${activeSection}-tab-content`}
          role="tabpanel"
          aria-labelledby={`${activeSection}-tab`}
        >
          {filteredCharts().map((chart, index) => (
            <div key={`chart-${index}`} className="chart-container">
              {renderChart(chart)}
            </div>
          ))}
        </div>
      )}
      
      {/* AI Insights & Trends */}
      <div className="ai-content-section">
        {filteredInsights().sort((a, b) => b.importance - a.importance).map((item, index) => (
          <div 
            key={`insight-${index}`} 
            className={`ai-card ${item.type === 'insight' ? 'insight-card' : 'trend-card'}`}
          >
            <div className="ai-card-header">
              <h3>{item.title}</h3>
              <div className="ai-card-badge" role="status">
                <span className="badge-icon">
                  {item.type === 'insight' ? icons.insight : icons.trend}
                </span>
                {item.type === 'insight' ? 'Insight' : 'Trend'}
              </div>
            </div>
            <div className="ai-card-content">
              {item.content}
            </div>
            {item.category && (
              <div className="ai-card-category">
                {item.category}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsTrends; 