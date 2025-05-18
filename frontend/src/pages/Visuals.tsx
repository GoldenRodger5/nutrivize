import React, { useState, useEffect } from 'react';
import '../styles/Visuals.css';
import { FoodLogEntry, Goal } from '../types';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartTypeRegistry
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface VisualsProps {
  userId: string;
  logs: FoodLogEntry[];
  goal: Goal | null;
}

interface ChartData {
  calories: Array<{date: string, calories: number}>;
  macros: Array<{name: string, value: number}>;
  trends: Array<{
    date: string;
    calories: {actual: number, goal: number, percentage: number};
    proteins: {actual: number, goal: number, percentage: number};
    carbs: {actual: number, goal: number, percentage: number};
    fats: {actual: number, goal: number, percentage: number};
  }>;
}

// Type for calorie chart data
type CalorieChartData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension?: number;
    borderDash?: number[];
  } | {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    borderDash: number[];
  }>;
};

// Type for macro chart data
type MacroChartData = {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor: string | string[];
  }[];
};

const Visuals: React.FC<VisualsProps> = ({ userId, logs, goal }) => {
  const [chartData, setChartData] = useState<ChartData>({
    calories: [],
    macros: [],
    trends: []
  });
  
  const [chartOptions, setChartOptions] = useState({
    calorieChartType: 'line',
    macroChartType: 'bar',
    dateRange: '7days'
  });

  // Process logs to create chart data
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // Process data for visualizations
    const processedData = {
      calories: processCalorieData(logs, chartOptions.dateRange),
      macros: processMacroData(logs, chartOptions.dateRange),
      trends: processTrendData(logs, goal, chartOptions.dateRange)
    };

    setChartData(processedData);
  }, [logs, goal, chartOptions.dateRange]);

  // Filter logs based on date range
  const filterLogsByDateRange = (logs: FoodLogEntry[], range: string): FoodLogEntry[] => {
    const now = new Date();
    const filtered = logs.filter(log => {
      const logDate = new Date(log.date);
      switch (range) {
        case '7days':
          return (now.getTime() - logDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        case '30days':
          return (now.getTime() - logDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        case 'all':
          return true;
        default:
          return (now.getTime() - logDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      }
    });
    return filtered;
  };

  // Process calorie data for charts
  const processCalorieData = (logs: FoodLogEntry[], dateRange: string): Array<{date: string, calories: number}> => {
    // Filter logs based on date range
    const filteredLogs = filterLogsByDateRange(logs, dateRange);
    
    // Simple data transformation for calories over time
    const caloriesByDay: {[key: string]: number} = {};

    filteredLogs.forEach(log => {
      const date = log.date.split('T')[0];
      if (!caloriesByDay[date]) {
        caloriesByDay[date] = 0;
      }
      caloriesByDay[date] += log.calories || 0;
    });

    return Object.entries(caloriesByDay).map(([date, calories]) => ({
      date,
      calories
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Process macro data for charts
  const processMacroData = (logs: FoodLogEntry[], dateRange: string): Array<{name: string, value: number}> => {
    // Filter logs based on date range
    const filteredLogs = filterLogsByDateRange(logs, dateRange);
    
    // Calculate total macros
    const totalProteins = filteredLogs.reduce((sum, log) => sum + (log.proteins || 0), 0);
    const totalCarbs = filteredLogs.reduce((sum, log) => sum + (log.carbs || 0), 0);
    const totalFats = filteredLogs.reduce((sum, log) => sum + (log.fats || 0), 0);
    
    return [
      { name: 'Proteins', value: totalProteins },
      { name: 'Carbs', value: totalCarbs },
      { name: 'Fats', value: totalFats }
    ];
  };

  // Process trend data for charts
  const processTrendData = (logs: FoodLogEntry[], goal: Goal | null, dateRange: string): Array<{
    date: string;
    calories: {actual: number, goal: number, percentage: number};
    proteins: {actual: number, goal: number, percentage: number};
    carbs: {actual: number, goal: number, percentage: number};
    fats: {actual: number, goal: number, percentage: number};
  }> => {
    // If no goal is set, return empty array
    if (!goal || !goal.nutrition_targets || !goal.nutrition_targets[0]) {
      return [];
    }

    // Filter logs based on date range
    const filteredLogs = filterLogsByDateRange(logs, dateRange);
    
    // Group logs by day
    const logsByDay: {[key: string]: FoodLogEntry[]} = {};
    filteredLogs.forEach(log => {
      const date = log.date.split('T')[0];
      if (!logsByDay[date]) {
        logsByDay[date] = [];
      }
      logsByDay[date].push(log);
    });

    // Calculate daily totals vs goals
    return Object.entries(logsByDay).map(([date, dayLogs]) => {
      const dailyCalories = dayLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
      const dailyProteins = dayLogs.reduce((sum, log) => sum + (log.proteins || 0), 0);
      const dailyCarbs = dayLogs.reduce((sum, log) => sum + (log.carbs || 0), 0);
      const dailyFats = dayLogs.reduce((sum, log) => sum + (log.fats || 0), 0);
      
      return {
        date,
        calories: {
          actual: dailyCalories,
          goal: goal.nutrition_targets[0].daily_calories,
          percentage: (dailyCalories / goal.nutrition_targets[0].daily_calories) * 100
        },
        proteins: {
          actual: dailyProteins,
          goal: goal.nutrition_targets[0].proteins,
          percentage: (dailyProteins / goal.nutrition_targets[0].proteins) * 100
        },
        carbs: {
          actual: dailyCarbs,
          goal: goal.nutrition_targets[0].carbs,
          percentage: (dailyCarbs / goal.nutrition_targets[0].carbs) * 100
        },
        fats: {
          actual: dailyFats,
          goal: goal.nutrition_targets[0].fats,
          percentage: (dailyFats / goal.nutrition_targets[0].fats) * 100
        }
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Handle customization changes
  const handleOptionChange = (option: string, value: string) => {
    setChartOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  // Prepare data for Charts.js
  const prepareCalorieChartData = () => {
    const sortedData = [...chartData.calories].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const datasets = [
      {
        label: 'Calories',
        data: sortedData.map(d => d.calories),
        borderColor: '#5e97f6',
        backgroundColor: 'rgba(94, 151, 246, 0.2)',
        fill: chartOptions.calorieChartType === 'line',
        tension: 0.1
      }
    ];
    
    if (goal && goal.nutrition_targets && goal.nutrition_targets[0]) {
      // @ts-ignore
      datasets.push({
        label: 'Target',
        data: sortedData.map(() => goal.nutrition_targets[0].daily_calories),
        borderColor: '#f87171',
        backgroundColor: 'rgba(248, 113, 113, 0.2)',
        borderDash: [5, 5],
        fill: false
      });
    }
    
    return {
      labels: sortedData.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
      datasets
    };
  };

  const prepareMacroChartData = (): MacroChartData => {
    const macroColors = {
      Proteins: {
        bar: 'rgba(94, 151, 246, 0.7)',
        pie: '#5e97f6'
      },
      Carbs: {
        bar: 'rgba(102, 187, 106, 0.7)',
        pie: '#66bb6a'
      },
      Fats: {
        bar: 'rgba(255, 167, 38, 0.7)',
        pie: '#ffa726'
      }
    };

    if (chartOptions.macroChartType === 'pie') {
      return {
        labels: chartData.macros.map(m => m.name),
        datasets: [
          {
            data: chartData.macros.map(m => m.value),
            backgroundColor: chartData.macros.map(m => macroColors[m.name as keyof typeof macroColors].pie)
          }
        ]
      };
    } else {
      // For bar chart - group by days
      const macrosByDay: Record<string, { proteins: number; carbs: number; fats: number }> = {};
      chartData.trends.forEach(trend => {
        macrosByDay[trend.date] = {
          proteins: trend.proteins.actual,
          carbs: trend.carbs.actual,
          fats: trend.fats.actual
        };
      });

      const sortedDates = Object.keys(macrosByDay).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );

      return {
        labels: sortedDates.map(date => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Proteins (g)',
            data: sortedDates.map(date => macrosByDay[date].proteins),
            backgroundColor: macroColors.Proteins.bar
          },
          {
            label: 'Carbs (g)',
            data: sortedDates.map(date => macrosByDay[date].carbs),
            backgroundColor: macroColors.Carbs.bar
          },
          {
            label: 'Fats (g)',
            data: sortedDates.map(date => macrosByDay[date].fats),
            backgroundColor: macroColors.Fats.bar
          }
        ]
      };
    }
  };

  return (
    <div className="visuals-container">
      <h2>Nutrition Visualizations</h2>
      
      {logs.length > 0 ? (
        <>
          <div className="chart-customization">
            <div className="customization-item">
              <label htmlFor="dateRange">Time Period:</label>
              <select 
                id="dateRange" 
                value={chartOptions.dateRange}
                onChange={(e) => handleOptionChange('dateRange', e.target.value)}
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="customization-item">
              <label htmlFor="calorieChartType">Calorie Chart Type:</label>
              <select 
                id="calorieChartType" 
                value={chartOptions.calorieChartType}
                onChange={(e) => handleOptionChange('calorieChartType', e.target.value)}
              >
                <option value="line">Line Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
            <div className="customization-item">
              <label htmlFor="macroChartType">Macro Chart Type:</label>
              <select 
                id="macroChartType" 
                value={chartOptions.macroChartType}
                onChange={(e) => handleOptionChange('macroChartType', e.target.value)}
              >
                <option value="bar">Bar Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            </div>
          </div>
        
          <div className="charts-grid">
            {/* Calorie Trend Chart */}
            <div className="chart-card">
              <h3>Calorie Intake Trend</h3>
              <div className="chart-container">
                {chartData.calories.length > 0 ? (
                  chartOptions.calorieChartType === 'line' ? (
                    <Line data={prepareCalorieChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
                  ) : (
                    <Bar data={prepareCalorieChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
                  )
                ) : (
                  <div className="no-data-message">
                    <p>Not enough data to display calorie trends</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Macronutrient Distribution Chart */}
            <div className="chart-card">
              <h3>Macronutrient Distribution</h3>
              <div className="chart-container">
                {chartData.macros.length > 0 ? (
                  chartOptions.macroChartType === 'pie' ? (
                    <Pie data={prepareMacroChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
                  ) : (
                    <Bar data={prepareMacroChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
                  )
                ) : (
                  <div className="macro-distribution">
                    {chartData.macros.map((macro, index) => (
                      <div key={index} className="macro-bar-container">
                        <div className="macro-label">{macro.name}</div>
                        <div className="macro-bar-wrapper">
                          <div 
                            className={`macro-bar ${macro.name.toLowerCase()}`}
                            style={{ width: `${Math.min(100, (macro.value / (chartData.macros.reduce((sum, m) => sum + m.value, 0)) * 100))}%` }}
                          ></div>
                        </div>
                        <div className="macro-value">{macro.value.toFixed(1)}g</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Goal Achievement Chart */}
            <div className="chart-card">
              <h3>Goal Achievement</h3>
              <div className="chart-container">
                {goal ? (
                  <div className="goal-achievement">
                    {chartData.trends.length > 0 && (
                      <div className="daily-goals">
                        {chartData.trends.slice(-5).map((day, index) => (
                          <div key={index} className="day-goal">
                            <div className="day-date">{new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                            <div className="goal-progress">
                              <div className="goal-item">
                                <span>Calories</span>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill calories"
                                    style={{ width: `${Math.min(100, day.calories.percentage)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(day.calories.percentage)}%</span>
                              </div>
                              <div className="goal-item">
                                <span>Protein</span>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill proteins"
                                    style={{ width: `${Math.min(100, day.proteins.percentage)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(day.proteins.percentage)}%</span>
                              </div>
                              <div className="goal-item">
                                <span>Carbs</span>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill carbs"
                                    style={{ width: `${Math.min(100, day.carbs.percentage)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(day.carbs.percentage)}%</span>
                              </div>
                              <div className="goal-item">
                                <span>Fats</span>
                                <div className="progress-bar">
                                  <div 
                                    className="progress-fill fats"
                                    style={{ width: `${Math.min(100, day.fats.percentage)}%` }}
                                  ></div>
                                </div>
                                <span>{Math.round(day.fats.percentage)}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-goal-message">
                    <p>Set nutrition goals to see goal achievement visualizations</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Weight Progress Chart */}
            <div className="chart-card">
              <h3>Weight Progress</h3>
              <div className="chart-container">
                {goal?.weight_target ? (
                  <div className="weight-progress-chart">
                    <div className="weight-summary">
                      <div className="weight-stat">
                        <span className="weight-label">Current</span>
                        <span className="weight-value">{goal.weight_target.current} kg</span>
                      </div>
                      <div className="weight-stat">
                        <span className="weight-label">Goal</span>
                        <span className="weight-value">{goal.weight_target.goal} kg</span>
                      </div>
                      <div className="weight-stat">
                        <span className="weight-label">Rate</span>
                        <span className="weight-value">{goal.weight_target.weekly_rate} kg/week</span>
                      </div>
                    </div>
                    <div className="weight-progress-bar">
                      <div 
                        className="weight-progress-fill"
                        style={{ 
                          width: `${Math.min(100, (Math.abs(goal.weight_target.current - goal.weight_target.goal) / 
                          Math.abs(goal.weight_target.current - goal.weight_target.goal)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="no-goal-message">
                    <p>Set a weight goal to see weight progress visualization</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-data-message">
          <h3>No Visualization Data Available</h3>
          <p>Log some meals to see your nutrition visualized</p>
        </div>
      )}
    </div>
  );
};

export default Visuals; 