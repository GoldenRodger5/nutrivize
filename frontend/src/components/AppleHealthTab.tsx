import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// HealthDataPoint interface might be removable if not used by a fallback
// interface HealthDataPoint { ... }

// New HealthKit data interface
interface HealthKitDataPoint {
  _id: string;
  user_id: string;
  date: string;
  steps: number;
  calories: number;
  distance: number;
  exercise_minutes: number;
  resting_heart_rate: number;
  walking_heart_rate: number;
  sleep_hours: number;
  source: string;
  created_at: string;
  updated_at: string;
}

// Summary interface for HealthKit data
interface HealthKitSummary {
  date_range: {
    start: string;
    end: string;
    days: number;
  };
  averages: {
    steps: number;
    calories: number;
    distance: number;
    exercise_minutes: number;
    resting_heart_rate: number;
    walking_heart_rate: number;
    sleep_hours: number;
  };
  totals: {
    steps: number;
    calories: number;
    distance: number;
    exercise_minutes: number;
    sleep_hours: number;
  };
  trends?: {
    steps?: number;
    calories?: number;
    distance?: number;
    exercise_minutes?: number;
    sleep_hours?: number;
  };
  daily_data: {
    [date: string]: {
      steps: number;
      calories: number;
      distance: number;
      exercise_minutes: number;
      resting_heart_rate: number;
      walking_heart_rate: number;
      sleep_hours: number;
    }
  };
}

// HealthSummary interface might be removable if not used by a fallback
// interface HealthSummary { ... }

interface AdjustedCalories {
  date: string;
  base_calories: number;
  active_energy: number;
  adjusted_calories: number;
}

interface AppleHealthTabProps {
  userId: string;
}

const AppleHealthTab: React.FC<AppleHealthTabProps> = ({ userId }) => {
  // const [isConnected, setIsConnected] = useState(false); // Removed
  const [lastSync, setLastSync] = useState<string | null>(null);
  // const [healthData, setHealthData] = useState<HealthDataPoint[]>([]); // Removed
  const [healthKitData, setHealthKitData] = useState<HealthKitDataPoint[]>([]);
  const [healthKitSummary, setHealthKitSummary] = useState<HealthKitSummary | null>(null);
  // const [healthSummary, setHealthSummary] = useState<HealthSummary>({}); // Removed
  const [adjustedCalories, setAdjustedCalories] = useState<AdjustedCalories | null>(null);
  const [dateRange, setDateRange] = useState<string>('7d');
  const [isLoading, setIsLoading] = useState(true);
  // const [dataSource, setDataSource] = useState<'healthApi' | 'healthKit'>('healthKit'); // Removed, will default to healthKit logic
  // const history = useHistory(); // Removed

  // Simplified useEffect to only fetch HealthKit data
  useEffect(() => {
    let isMounted = true;
    console.log("AppleHealthTab useEffect triggered. Fetching HealthKit data. DateRange:", dateRange, "userId:", userId);
    
    const loadHealthKitData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        // Directly call fetchHealthKitData, no more check or alternate data source logic
        await fetchHealthKitData(isMounted);
      } catch (error) {
        console.error('Error in HealthKit data loading during useEffect:', error);
        // Optionally set an error state here to display to the user
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (userId) { // Only fetch if userId is available
        loadHealthKitData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [userId, dateRange]);

  // Function to fetch HealthKit data from iOS companion app (Keep and ensure it doesn't rely on removed states)
  const fetchHealthKitData = async (isMounted = true) => {
    console.log("fetchHealthKitData called");
    try {
      const { startDate, endDate } = calculateDateRange(dateRange);
      const timestamp = new Date().getTime(); 
      
      console.log(`Fetching HealthKit data for range: ${startDate} to ${endDate}`);
      debugDates(); // Add debug call

      // Remove the call to /api/swift/healthkit/data since it's failing with 401 errors
      
      const summaryResponse = await api.get('/api/healthkit/summary', {
        params: { start_date: startDate, end_date: endDate, _t: timestamp }
      });
      console.log("HealthKit summary response:", summaryResponse.data);
      if (isMounted) setHealthKitSummary(summaryResponse.data || null);
      
      // We also need to get the detailed data to access the timestamps
      const detailResponse = await api.get('/api/healthkit/data', {
        params: { start_date: startDate, end_date: endDate, _t: timestamp }
      });
      console.log("HealthKit detail response:", detailResponse.data);
      
      // Set healthKitData directly from the detail data
      if (detailResponse.data && detailResponse.data.data && detailResponse.data.data.length > 0) {
        if (isMounted) setHealthKitData(detailResponse.data.data || []);
        
        // Find the most recent record by updated_at timestamp
        const sortedData = [...detailResponse.data.data].sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        
        // Use the most recent record's actual timestamp
        const mostRecentRecord = sortedData[0];
        console.log("Most recent record:", mostRecentRecord);
        
        if (mostRecentRecord && mostRecentRecord.updated_at) {
          console.log("Setting lastSync to actual record timestamp:", mostRecentRecord.updated_at);
          
          // Ensure we're handling the date_key properly for display purposes
          if (mostRecentRecord.date_key) {
            console.log("Using date_key for display:", mostRecentRecord.date_key);
          }
          
          if (isMounted) setLastSync(mostRecentRecord.updated_at);
        }
      } else if (summaryResponse.data && summaryResponse.data.daily_data) {
        // Transform the summary data into the format expected by the component
        // Only if we don't have detailed data
        const transformedData = Object.entries(summaryResponse.data.daily_data).map(([date, metrics]: [string, any]) => ({
          _id: date,
          user_id: userId,
          date: date,
          steps: metrics.steps,
          calories: metrics.calories,
          distance: metrics.distance,
          exercise_minutes: metrics.exercise_minutes,
          resting_heart_rate: metrics.resting_heart_rate,
          walking_heart_rate: metrics.walking_heart_rate,
          sleep_hours: metrics.sleep_hours,
          source: "Apple HealthKit",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        if (isMounted) setHealthKitData(transformedData);
      }
      
      // Get adjusted calories
      try {
        const caloriesResponse = await api.get('/api/calories/adjusted', {
          params: { _t: timestamp } 
        });
        if (isMounted) setAdjustedCalories(caloriesResponse.data);
      } catch (error) {
        console.error('Error fetching adjusted calories:', error);
      }
      
    } catch (error) {
      console.error('Error fetching HealthKit data overall:', error);
      if (isMounted) {
        setHealthKitData([]);
        setHealthKitSummary(null);
        // Potentially set an error state here to display to the user for feedback
      }
    }
  };

  // Helper function to calculate date range
  const calculateDateRange = (range: string): { startDate: string, endDate: string } => {
    // Create a date object for today that will match our server data format
    const now = new Date();
    // Format date as YYYY-MM-DD
    const todayFormatted = now.toISOString().split('T')[0];
    console.log("Today's date (ISO format):", todayFormatted);
    
    // Set endDate to today in YYYY-MM-DD format
    const endDate = todayFormatted;
    
    // For start date, we'll create a new date based on today and then adjust it
    let startDate: string;
    
    // Calculate start date based on the selected range
    switch (range) {
      case '1d':
        // For "Today", use today's date for both start and end
        console.log('Using today for date range (1d):', todayFormatted);
        startDate = todayFormatted;
        break;
      case '7d': {
        // Create a date object 6 days before today
        const tempDate = new Date(now);
        tempDate.setDate(tempDate.getDate() - 6);
        startDate = tempDate.toISOString().split('T')[0];
        break;
      }
      case '30d': {
        // Create a date object 29 days before today
        const tempDate = new Date(now);
        tempDate.setDate(tempDate.getDate() - 29);
        startDate = tempDate.toISOString().split('T')[0];
        break;
      }
      case '90d': {
        // Create a date object 89 days before today
        const tempDate = new Date(now);
        tempDate.setDate(tempDate.getDate() - 89);
        startDate = tempDate.toISOString().split('T')[0];
        break;
      }
      default: {
        // Default to 7 days (6 days before today)
        const tempDate = new Date(now);
        tempDate.setDate(tempDate.getDate() - 6);
        startDate = tempDate.toISOString().split('T')[0];
      }
    }

    const result = {
      startDate: startDate,
      endDate: endDate
    };
    console.log("Calculated date range:", result);
    return result;
  };

  // Helper function to generate an array of date strings between two dates
  const generateDateRange = (startDate: string, endDate: string): string[] => {
    console.log(`Generating date range from ${startDate} to ${endDate}`);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateArray: string[] = [];
    
    // Clone the start date
    let currentDate = new Date(start);
    
    // Loop through each day and add to array
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateArray.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log("Generated date range:", dateArray);
    return dateArray;
  };

  // Helper function to correctly format a date string with proper timezone handling
  const formatDateString = (dateString: string) => {
    // Parse the YYYY-MM-DD format string into year, month, day components
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a UTC date at noon to avoid timezone-related date shifting
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    // Format using the browser's locale
    return date.toLocaleDateString(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get today's summary data - fix to ensure using correct date
  const getTodaysData = () => {
    if (healthKitSummary && healthKitSummary.daily_data && Object.keys(healthKitSummary.daily_data).length > 0) {
      // Get the actual today's date in the correct format
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      console.log("Today's date for HealthKit data (getTodaysData):", today);
      console.log("Today formatted:", formatDateString(today));
      console.log("Available dates in daily_data:", Object.keys(healthKitSummary.daily_data));
      
      // Check explicitly if today exists in the data
      if (healthKitSummary.daily_data[today]) {
        console.log(`Found today's data (${today}):`, healthKitSummary.daily_data[today]);
        return {
          ...healthKitSummary.daily_data[today],
          displayDate: formatDateString(today)
        };
      } else {
        console.log(`No data found for today (${today}) in available dates`);
      }
      
      // If we don't have today's data, get the most recent date's data
      const availableDates = Object.keys(healthKitSummary.daily_data).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      console.log("Available dates sorted by recency:", availableDates);
      
      if (availableDates.length > 0) {
        const mostRecentDate = availableDates[0];
        console.log(`Using most recent date (${mostRecentDate}) data:`, healthKitSummary.daily_data[mostRecentDate]);
        console.log("Most recent date formatted:", formatDateString(mostRecentDate));
        return {
          ...healthKitSummary.daily_data[mostRecentDate],
          displayDate: formatDateString(mostRecentDate)
        };
      }
    }
    
    return { 
      steps: 0, 
      calories: 0, 
      exercise_minutes: 0, 
      distance: 0, 
      resting_heart_rate: 0, 
      walking_heart_rate: 0, 
      sleep_hours: 0,
      displayDate: 'No data'
    };
  };

  const todayData = getTodaysData();

  // Add a debug function for showing current dates
  const debugDates = () => {
    // Current system time
    const now = new Date();
    console.log("--- DATE DEBUG INFO ---");
    console.log("Current system time:", now.toString());
    console.log("Current ISO string:", now.toISOString());
    console.log("Current ISO date part:", now.toISOString().split('T')[0]);
    console.log("Current toLocaleDateString:", now.toLocaleDateString());
    
    // UTC date at noon today
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
    console.log("Current UTC noon time:", nowUTC.toString());
    console.log("Current UTC noon toLocaleDateString:", nowUTC.toLocaleDateString());
    
    // Available data dates
    if (healthKitSummary && healthKitSummary.daily_data) {
      console.log("Available dates in healthKitSummary:", Object.keys(healthKitSummary.daily_data));
    }
    console.log("--- END DEBUG INFO ---");
  };
  
  // Call debug at component load time
  useEffect(() => {
    debugDates();
  }, [healthKitSummary]); // Re-run when health data changes

  // Generate chart data for steps
  const getStepsChartData = () => {
    // Simplified to only use healthKitSummary
    if (healthKitSummary && healthKitSummary.daily_data) {
      const { startDate, endDate } = calculateDateRange(dateRange);
      
      // Generate all dates in the range to ensure all days are shown, even with zero values
      const allDatesInRange = generateDateRange(startDate, endDate);
      
      // Map each date to its data (or default to 0 if no data exists)
      const values = allDatesInRange.map(date => {
        return healthKitSummary.daily_data[date]?.steps || 0;
      });
      
      return {
        labels: allDatesInRange.map(date => formatDateString(date)),
        datasets: [
          {
            label: 'Steps',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: true,
          },
        ],
      };
    } 
    // Fallback for no data
    return { labels: [], datasets: [{ label: 'Steps', data: [], backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1, fill: true }] };
  };

  // Generate chart data for active energy
  const getActiveEnergyChartData = () => {
    // Simplified to only use healthKitSummary
    if (healthKitSummary && healthKitSummary.daily_data) {
      const { startDate, endDate } = calculateDateRange(dateRange);
      const allDatesInRange = generateDateRange(startDate, endDate);
      
      const values = allDatesInRange.map(date => {
        return healthKitSummary.daily_data[date]?.calories || 0;
      });
      
      return {
        labels: allDatesInRange.map(date => formatDateString(date)),
        datasets: [
          {
            label: 'Active Calories',
            data: values,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: true,
          },
        ],
      };
    }
    // Fallback for no data
    return { labels: [], datasets: [{ label: 'Active Calories', data: [], backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1, fill: true }] };
  };

  // Generate chart data for exercise time
  const getExerciseTimeChartData = () => {
    // Simplified to only use healthKitSummary
    if (healthKitSummary && healthKitSummary.daily_data) {
      const { startDate, endDate } = calculateDateRange(dateRange);
      const allDatesInRange = generateDateRange(startDate, endDate);
      
      const values = allDatesInRange.map(date => {
        return healthKitSummary.daily_data[date]?.exercise_minutes || 0;
      });
      
      return {
        labels: allDatesInRange.map(date => formatDateString(date)),
        datasets: [
          {
            label: 'Exercise Minutes',
            data: values,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: true,
          },
        ],
      };
    }
    // Fallback for no data
    return { labels: [], datasets: [{ label: 'Exercise Minutes', data: [], backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1, fill: true }] };
  };

  // Generate chart data for heart rate
  const getHeartRateChartData = () => {
    // Simplified to only use healthKitSummary
    if (healthKitSummary && healthKitSummary.daily_data) {
      const { startDate, endDate } = calculateDateRange(dateRange);
      const allDatesInRange = generateDateRange(startDate, endDate);
      
      const restingValues = allDatesInRange.map(date => {
        return healthKitSummary.daily_data[date]?.resting_heart_rate || 0;
      });
      
      const walkingValues = allDatesInRange.map(date => {
        return healthKitSummary.daily_data[date]?.walking_heart_rate || 0;
      });
      
      return {
        labels: allDatesInRange.map(date => formatDateString(date)),
        datasets: [
          {
            label: 'Resting Heart Rate',
            data: restingValues,
            backgroundColor: 'rgba(75, 192, 92, 0.2)',
            borderColor: 'rgba(75, 192, 92, 1)',
            borderWidth: 1,
            fill: false,
          },
          {
            label: 'Walking Heart Rate',
            data: walkingValues,
            backgroundColor: 'rgba(192, 75, 75, 0.2)',
            borderColor: 'rgba(192, 75, 75, 1)',
            borderWidth: 1,
            fill: false,
          }
        ],
      };
    }
    // Fallback for no data
    return { labels: [], datasets: [
        { label: 'Resting Heart Rate', data: [], backgroundColor: 'rgba(75, 192, 92, 0.2)', borderColor: 'rgba(75, 192, 92, 1)', borderWidth: 1, fill: false },
        { label: 'Walking Heart Rate', data: [], backgroundColor: 'rgba(192, 75, 75, 0.2)', borderColor: 'rgba(192, 75, 75, 1)', borderWidth: 1, fill: false }
    ] };
  };

  // Generate chart data for sleep hours
  const getSleepChartData = () => {
    // Simplified to only use healthKitSummary
    if (healthKitSummary && healthKitSummary.daily_data) {
      const { startDate, endDate } = calculateDateRange(dateRange);
      const allDatesInRange = generateDateRange(startDate, endDate);
      
      const values = allDatesInRange.map(date => {
        return healthKitSummary.daily_data[date]?.sleep_hours || 0;
      });
      
      return {
        labels: allDatesInRange.map(date => formatDateString(date)),
        datasets: [
          {
            label: 'Sleep Hours',
            data: values,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1,
            fill: true,
          },
        ],
      };
    }
    // Fallback for no data
    return { labels: [], datasets: [{ label: 'Sleep Hours', data: [], backgroundColor: 'rgba(153, 102, 255, 0.2)', borderColor: 'rgba(153, 102, 255, 1)', borderWidth: 1, fill: true }] };
  };

  // Generate doughnut chart for calorie adjustment
  const getCalorieAdjustmentChartData = () => {
    if (!adjustedCalories) return {
      labels: ['No Data Available'],
      datasets: [{ data: [1], backgroundColor: ['rgba(200, 200, 200, 0.6)'], borderColor: ['rgba(200, 200, 200, 1)'], borderWidth: 1 }],
    };
    return {
      labels: ['Base Calories', 'Activity Calories'],
      datasets: [{
        data: [adjustedCalories.base_calories, adjustedCalories.active_energy],
        backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
        borderWidth: 1,
      }],
    };
  };

  if (isLoading) {
    return (
      <div className="health-tab loading">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading health data...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && (!healthKitSummary || !healthKitSummary.daily_data || Object.keys(healthKitSummary.daily_data).length === 0)) {
    return (
      <div className="health-tab no-data">
        <div className="connection-prompt">
          <h2>Apple HealthKit Data</h2>
          <p>No Apple HealthKit data found for the selected period, or data is still syncing.</p>
          <p>Ensure your iOS companion app has recently synced with Apple Health and then refresh here.</p>
          <button 
            className="refresh-button"
            onClick={() => {
              setIsLoading(true);
              fetchHealthKitData().finally(() => setIsLoading(false));
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/></svg>
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="health-tab">
      <div className="health-header">
        <h1>Apple HealthKit Data</h1>
        <div className="health-sync-info">
          <span>Last synced: {lastSync ? new Date(lastSync).toLocaleString() : 'Checking...'}</span>
          <span className="data-source-badge">Data from iOS Companion App</span>
          {healthKitSummary && healthKitSummary.daily_data && todayData && (
            <span className="current-date-badge">
              Showing data for: {
                dateRange === '1d' 
                  ? todayData.displayDate
                  : `${dateRange} range`
              }
            </span>
          )}
          <button 
            className="refresh-button"
            onClick={() => {
              setIsLoading(true);
              fetchHealthKitData().finally(() => setIsLoading(false));
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/></svg>
            Refresh Data
          </button>
        </div>
        <div className="date-range-selector">
          <button className={dateRange === '1d' ? 'active' : ''} onClick={() => setDateRange('1d')}>Today</button>
          <button className={dateRange === '7d' ? 'active' : ''} onClick={() => setDateRange('7d')}>Week</button>
          <button className={dateRange === '30d' ? 'active' : ''} onClick={() => setDateRange('30d')}>Month</button>
          <button className={dateRange === '90d' ? 'active' : ''} onClick={() => setDateRange('90d')}>3 Months</button>
        </div>
      </div>

      <div className="health-dashboard">
        <div className="health-summary-row">
          <div className="health-summary-card">
            <div className="health-summary-icon steps"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C10.9 3 10 3.9 10 5C10 6.1 10.9 7 12 7C13.1 7 14 6.1 14 5C14 3.9 13.1 3 12 3ZM12 17C10.9 17 10 17.9 10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19C14 17.9 13.1 17 12 17ZM8 7C6.9 7 6 7.9 6 9C6 10.1 6.9 11 8 11C9.1 11 10 10.1 10 9C10 7.9 9.1 7 8 7ZM16 7C14.9 7 14 7.9 14 9C14 10.1 14.9 11 16 11C17.1 11 18 10.1 18 9C18 7.9 17.1 7 16 7ZM5 13C3.9 13 3 13.9 3 15C3 16.1 3.9 17 5 17C6.1 17 7 16.1 7 15C7 13.9 6.1 13 5 13ZM19 13C17.9 13 17 13.9 17 15C17 16.1 17.9 17 19 17C20.1 17 21 16.1 21 15C21 13.9 20.1 13 19 13Z" fill="currentColor"/></svg></div>
            <div className="health-summary-content">
              <h3>Steps</h3>
              <div className="health-summary-value">{todayData.steps.toLocaleString()}</div>
              <div className="health-summary-unit">steps today</div>
              {healthKitSummary?.trends?.steps !== undefined && (
                <div className={`trend-indicator ${healthKitSummary.trends.steps > 0 ? 'positive' : healthKitSummary.trends.steps < 0 ? 'negative' : 'neutral'}`}>
                  {healthKitSummary.trends.steps > 0 ? '↑' : healthKitSummary.trends.steps < 0 ? '↓' : '→'} {Math.abs(healthKitSummary.trends.steps).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
          <div className="health-summary-card">
            <div className="health-summary-icon energy"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="currentColor"/></svg></div>
            <div className="health-summary-content">
              <h3>Active Energy</h3>
              <div className="health-summary-value">{todayData.calories.toLocaleString()}</div>
              <div className="health-summary-unit">kcal today</div>
              {healthKitSummary?.trends?.calories !== undefined && (
                <div className={`trend-indicator ${healthKitSummary.trends.calories > 0 ? 'positive' : healthKitSummary.trends.calories < 0 ? 'negative' : 'neutral'}`}>
                  {healthKitSummary.trends.calories > 0 ? '↑' : healthKitSummary.trends.calories < 0 ? '↓' : '→'} {Math.abs(healthKitSummary.trends.calories).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
          <div className="health-summary-card">
            <div className="health-summary-icon exercise"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.8 8C10.8 8.66 10.25 9.2 9.6 9.2C8.94 9.2 8.4 8.66 8.4 8C8.4 7.34 8.94 6.8 9.6 6.8C10.25 6.8 10.8 7.34 10.8 8ZM16.4 12.93C16.09 13.21 15.77 13.5 15.46 13.8C14.28 15 13.1 16.2 11.56 16.59C10.67 16.81 9.76 16.75 8.87 16.59C7.98 16.44 7.12 16.18 6.24 15.91C5.22 15.61 4.24 15.35 3.16 15.22C2.46 15.14 2 15.93 2 16.63V17.04C2 17.43 2.28 17.76 2.65 17.86C4.97 18.46 7.32 19 9.69 19C12.32 19 14.96 18.21 17.35 17C17.76 16.84 18 16.44 18 16V15.55C18 14.84 17.15 14.47 16.4 12.93ZM22 11.5C21.27 11.5 20 12.28 20 12.28V6.72C20 6.72 21.27 7.5 22 7.5C22.55 7.5 23 7.05 23 6.5C23 5.95 22.55 5.5 22 5.5C20.97 5.5 19.28 4.54 19.03 4.38C18.95 4.33 18.86 4.31 18.77 4.31C18.54 4.31 18.33 4.42 18.2 4.61L12.41 12.39C12.33 12.5 12.28 12.63 12.28 12.78C12.28 13.17 12.61 13.5 13 13.5H14.69L11.85 17.4C11.54 17.83 11.82 18.5 12.36 18.5C12.61 18.5 12.85 18.37 13 18.15L16.31 13.43C16.44 13.25 16.63 13.12 16.83 13.07L18.3 12.71C18.57 12.64 18.84 12.79 18.92 13.06C19.01 13.32 18.88 13.6 18.63 13.69L17.55 14.02L17.71 14.21C17.81 14.32 17.92 14.44 18 14.52C18.38 14.91 18.89 15.35 19.31 15.73C19.85 16.23 20.89 15.85 20.89 15.85C21.35 15.63 21.7 15.2 21.9 14.7C22.08 14.24 22.23 13.7 22.32 13.33C22.43 12.93 22.59 12.5 22.72 12.14C22.83 11.88 22.63 11.5 22 11.5Z" fill="currentColor"/></svg></div>
            <div className="health-summary-content">
              <h3>Exercise Time</h3>
              <div className="health-summary-value">{todayData.exercise_minutes.toLocaleString()}</div>
              <div className="health-summary-unit">minutes today</div>
              {healthKitSummary?.trends?.exercise_minutes !== undefined && (
                <div className={`trend-indicator ${healthKitSummary.trends.exercise_minutes > 0 ? 'positive' : healthKitSummary.trends.exercise_minutes < 0 ? 'negative' : 'neutral'}`}>
                  {healthKitSummary.trends.exercise_minutes > 0 ? '↑' : healthKitSummary.trends.exercise_minutes < 0 ? '↓' : '→'} {Math.abs(healthKitSummary.trends.exercise_minutes).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
          {healthKitSummary && healthKitSummary.daily_data && Object.keys(healthKitSummary.daily_data).length > 0 && (
            <div className="health-summary-card">
              <div className="health-summary-icon sleep"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4ZM13 16.94C11.07 16.73 9.47 15.13 9.26 13.19C9.01 10.9 10.83 9 13 9V7L16 10L13 13V11C11.89 11 11 11.89 11 13C11 13.97 11.72 14.77 12.66 14.95C13.09 15.04 13.54 14.97 13.92 14.76C14.3 14.55 14.6 14.21 14.75 13.8C14.89 13.36 14.85 12.89 14.63 12.5C14.42 12.12 14.05 11.84 13.6 11.75L14.06 10.17C14.96 10.37 15.7 10.97 16.06 11.83C16.42 12.68 16.33 13.68 15.82 14.44C15.31 15.21 14.44 15.68 13.5 15.72C13.35 15.77 13.17 15.81 13 15.82V16.94Z" fill="currentColor"/></svg></div>
              <div className="health-summary-content">
                <h3>Sleep</h3>
                <div className="health-summary-value">{todayData.sleep_hours.toFixed(1)}</div>
                <div className="health-summary-unit">hours today</div>
                {healthKitSummary?.trends?.sleep_hours !== undefined && (
                  <div className={`trend-indicator ${healthKitSummary.trends.sleep_hours > 0 ? 'positive' : healthKitSummary.trends.sleep_hours < 0 ? 'negative' : 'neutral'}`}>
                    {healthKitSummary.trends.sleep_hours > 0 ? '↑' : healthKitSummary.trends.sleep_hours < 0 ? '↓' : '→'} {Math.abs(healthKitSummary.trends.sleep_hours).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="health-charts-row">
          <div className="health-chart-card">
            <h3>Steps History</h3>
            <div className="chart-container"><Bar data={getStepsChartData()} options={{ responsive: true, plugins: { legend: { position: 'top' as const }, title: { display: false }}}} /></div>
          </div>
          <div className="health-chart-card">
            <h3>Active Energy History</h3>
            <div className="chart-container"><Line data={getActiveEnergyChartData()} options={{ responsive: true, plugins: { legend: { position: 'top' as const }, title: { display: false }}}} /></div>
          </div>
        </div>

        <div className="health-charts-row">
          <div className="health-chart-card">
            <h3>Exercise Time History</h3>
            <div className="chart-container"><Bar data={getExerciseTimeChartData()} options={{ responsive: true, plugins: { legend: { position: 'top' as const }, title: { display: false }}}} /></div>
          </div>

          {healthKitSummary && healthKitSummary.daily_data && Object.keys(healthKitSummary.daily_data).length > 0 ? (
            <div className="health-chart-card heart-rate">
              <h3>Heart Rate History</h3>
              <div className="chart-container">
                <Line data={getHeartRateChartData()} options={{ responsive: true, plugins: { legend: { position: 'top' as const }, title: { display: false }}, scales: { y: { beginAtZero: false, title: { display: true, text: 'BPM'}}}}}/>
              </div>
            </div>
          ) : (
            <div className="health-chart-card calories-adjustment">
              <h3>Calories Adjustment</h3>
              {adjustedCalories ? (
                <div className="calories-adjustment-content">
                  <div className="chart-container"><Doughnut data={getCalorieAdjustmentChartData()} options={{ responsive: true, plugins: { legend: { position: 'top' as const }}}} /></div>
                  <div className="calories-info">
                    <div className="calories-info-item"><span className="label">Base Target:</span><span className="value">{adjustedCalories.base_calories} kcal</span></div>
                    <div className="calories-info-item"><span className="label">Activity Bonus:</span><span className="value">+{adjustedCalories.active_energy} kcal</span></div>
                    <div className="calories-info-item total"><span className="label">Adjusted Target:</span><span className="value">{adjustedCalories.adjusted_calories} kcal</span></div>
                    <div className="calories-info-explanation"><p>Your daily calorie target is automatically adjusted based on your activity level from HealthKit.</p></div>
                  </div>
                </div>
              ) : (
                <div className="no-data-placeholder"><p>No calorie adjustment data available.</p></div>
              )}
            </div>
          )}
        </div>
        
        {healthKitSummary && healthKitSummary.daily_data && Object.keys(healthKitSummary.daily_data).length > 0 && (
          <div className="health-charts-row">
            <div className="health-chart-card sleep">
              <h3>Sleep Hours History</h3>
              <div className="chart-container">
                <Bar data={getSleepChartData()} options={{ responsive: true, plugins: { legend: { position: 'top' as const }, title: { display: false }}, scales: { y: { beginAtZero: false, title: { display: true, text: 'Hours'}}}}}/>
              </div>
            </div>
            
            <div className="health-chart-card calories-adjustment"> 
              <h3>Calories Adjustment</h3>
              {adjustedCalories ? (
                 <div className="calories-adjustment-content">
                  <div className="chart-container"><Doughnut data={getCalorieAdjustmentChartData()} options={{ responsive: true, plugins: { legend: { position: 'top' as const }}}} /></div>
                  <div className="calories-info">
                    <div className="calories-info-item"><span className="label">Base Target:</span><span className="value">{adjustedCalories.base_calories} kcal</span></div>
                    <div className="calories-info-item"><span className="label">Activity Bonus:</span><span className="value">+{adjustedCalories.active_energy} kcal</span></div>
                    <div className="calories-info-item total"><span className="label">Adjusted Target:</span><span className="value">{adjustedCalories.adjusted_calories} kcal</span></div>
                    <div className="calories-info-explanation"><p>Your daily calorie target is automatically adjusted based on your activity level from HealthKit.</p></div>
                  </div>
                </div>
              ) : (
                <div className="no-data-placeholder"><p>No calorie adjustment data available.</p></div>
              )}
            </div>
          </div>
        )}
        
        {healthKitSummary && (
          <div className="healthkit-info">
            <h3>HealthKit Integration Details</h3>
             <p>
              The data shown above is synchronized from your iOS device using the Nutrivize companion app. 
              Make sure to keep your companion app running regularly to sync the latest health data.
            </p>
            <div className="averages-summary">
              <h4>Your {dateRange === '1d' ? 'Today\'s' : dateRange === '7d' ? 'Weekly' : dateRange === '30d' ? 'Monthly' : '3-Month'} Averages</h4>
              <div className="averages-grid">
                <div className="average-item"><span className="label">Steps:</span><span className="value">{healthKitSummary?.averages.steps.toLocaleString()} steps/day</span></div>
                <div className="average-item"><span className="label">Active Energy:</span><span className="value">{healthKitSummary?.averages.calories.toLocaleString()} kcal/day</span></div>
                <div className="average-item"><span className="label">Exercise:</span><span className="value">{healthKitSummary?.averages.exercise_minutes.toLocaleString()} min/day</span></div>
                <div className="average-item"><span className="label">Sleep:</span><span className="value">{healthKitSummary?.averages.sleep_hours.toFixed(1)} hours/day</span></div>
                <div className="average-item"><span className="label">Resting Heart Rate:</span><span className="value">{healthKitSummary?.averages.resting_heart_rate.toFixed(0)} BPM</span></div>
                <div className="average-item"><span className="label">Walking Heart Rate:</span><span className="value">{healthKitSummary?.averages.walking_heart_rate.toFixed(0)} BPM</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppleHealthTab; 