import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/WeightProgressHistory.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface WeightEntry {
  date: string;
  weight: number;
  notes?: string;
}

interface WeightProgressHistoryProps {
  entries: WeightEntry[];
  goalWeight: number;
  goalType: string;
}

const WeightProgressHistory: React.FC<WeightProgressHistoryProps> = ({ 
  entries, 
  goalWeight,
  goalType
}) => {
  // Sort entries by date (oldest to newest)
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Function to format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Prepare data for chart
  const chartData = {
    labels: sortedEntries.map(entry => formatDate(entry.date)),
    datasets: [
      {
        label: 'Weight (kg)',
        data: sortedEntries.map(entry => entry.weight),
        borderColor: goalType === 'weight loss' ? '#10b981' : goalType === 'weight gain' ? '#ef4444' : '#6366f1',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        tension: 0.3,
        fill: false,
        pointBackgroundColor: sortedEntries.map(entry => 
          entry.weight > goalWeight && goalType === 'weight loss' ? '#10b981' : 
          entry.weight < goalWeight && goalType === 'weight gain' ? '#ef4444' :
          '#6366f1'
        ),
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        label: 'Goal Weight',
        data: sortedEntries.map(() => goalWeight),
        borderColor: '#9ca3af',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: {
          display: true,
          text: 'Weight (kg)'
        },
        ticks: {
          precision: 1
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const entryIndex = context.dataIndex;
            const entry = sortedEntries[entryIndex];
            
            if (entry && entry.notes) {
              return `Notes: ${entry.notes}`;
            }
            return '';
          }
        }
      }
    }
  };
  
  // Calculate total weight change
  const firstWeight = sortedEntries.length > 0 ? sortedEntries[0].weight : 0;
  const lastWeight = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].weight : 0;
  const totalChange = lastWeight - firstWeight;
  const changeText = totalChange > 0 ? `+${totalChange.toFixed(1)}` : totalChange.toFixed(1);
  const changeClass = totalChange > 0 ? 'weight-gain' : totalChange < 0 ? 'weight-loss' : 'weight-maintain';
  
  // Check if change is in the right direction
  const isRightDirection = 
    (goalType === 'weight loss' && totalChange < 0) ||
    (goalType === 'weight gain' && totalChange > 0) ||
    (goalType === 'maintenance' && Math.abs(totalChange) < 1);
  
  return (
    <div className="weight-progress-history">
      <h4>Weight Progress History</h4>
      
      {sortedEntries.length > 0 ? (
        <>
          <div className="weight-summary">
            <div className="summary-item">
              <span className="label">Starting</span>
              <span className="value">{firstWeight.toFixed(1)} kg</span>
              <span className="imperial">{(firstWeight * 2.20462).toFixed(1)} lb</span>
            </div>
            
            <div className="summary-arrow">→</div>
            
            <div className="summary-item">
              <span className="label">Current</span>
              <span className="value">{lastWeight.toFixed(1)} kg</span>
              <span className="imperial">{(lastWeight * 2.20462).toFixed(1)} lb</span>
            </div>
            
            <div className={`summary-change ${changeClass}`}>
              <span className="value">{changeText} kg</span>
              <span className="imperial">{(totalChange * 2.20462).toFixed(1)} lb</span>
              {isRightDirection && <span className="right-direction">✓</span>}
            </div>
          </div>
          
          <div className="chart-container">
            <Line data={chartData} options={chartOptions as any} />
          </div>
          
          <div className="history-entries">
            <h5>Recent Entries</h5>
            <div className="entries-list">
              {sortedEntries.slice(-5).reverse().map((entry, index) => (
                <div className="entry" key={index}>
                  <div className="entry-date">{formatDate(entry.date)}</div>
                  <div className="entry-weight">{entry.weight.toFixed(1)} kg</div>
                  {entry.notes && <div className="entry-notes">{entry.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="no-data-message">
          <p>No weight entries recorded yet. Use the form above to start tracking your progress.</p>
        </div>
      )}
    </div>
  );
};

export default WeightProgressHistory; 