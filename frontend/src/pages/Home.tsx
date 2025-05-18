import React from 'react';
import '../styles/Home.css';
import { CustomizableDashboard } from '../components/widgets/CustomizableDashboard';
import { WidgetProvider } from '../context/WidgetContext';
import { User, Goal, FoodLogEntry } from '../types';

interface HomeProps {
  user: User;
  goal: Goal | null;
  todaysLogs: FoodLogEntry[];
  onRefresh: () => void;
}

const Home: React.FC<HomeProps> = ({ user, goal, todaysLogs, onRefresh }) => {
  return (
    <div className="home-container">
      <div className="welcome-panel">
        <h2>Welcome, {user?.name || 'Nutrition Tracker'}</h2>
        <p>Track your nutrition goals and stay healthy</p>
        <button onClick={onRefresh} className="refresh-button">
          Refresh Data
        </button>
      </div>

      <WidgetProvider>
        <CustomizableDashboard 
          user={user}
          goal={goal}
          todaysLogs={todaysLogs}
          onRefresh={onRefresh}
        />
      </WidgetProvider>
    </div>
  );
};

export default Home; 