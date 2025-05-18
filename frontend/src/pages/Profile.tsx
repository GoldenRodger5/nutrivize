import React, { useState } from 'react';
import { useUserContext } from '../context/UserContext';
import api from '../utils/api';

interface User {
  uid: string;
  name: string;
  email: string;
  preferences?: {
    units?: string;
    theme?: string;
    dietaryPreferences?: string[];
    dailyTargets?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    allergies?: string[];
  };
}

interface HealthStatus {
  connected: boolean;
  last_sync: string | null;
}

interface ProfileProps {
  user: User | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const { logout } = useUserContext();
  const [healthConnected, setHealthConnected] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({ connected: false, last_sync: null });
  const [showConnectInstructions, setShowConnectInstructions] = useState(false);
  
  // Check Apple Health connection status on component mount
  React.useEffect(() => {
    if (user) {
      checkHealthConnection();
    }
  }, [user]);

  // Function to check if the user has connected Apple Health
  const checkHealthConnection = async () => {
    try {
      const response = await api.get('/api/health/status');
      setHealthStatus(response.data);
      setHealthConnected(response.data.connected);
    } catch (error) {
      console.error('Error checking Apple Health connection:', error);
    }
  };
  
  // Function to handle the Apple Health connection
  const handleConnectHealth = () => {
    setShowConnectInstructions(true);
  };
  
  if (!user) {
    return (
      <div className="no-data-message">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <div className="card user-info">
        <h3>Profile</h3>
        
        <div className="profile-section">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="profile-details">
            <div className="profile-name">{user.name}</div>
            <div className="profile-email">{user.email}</div>
          </div>
        </div>
      </div>
      
      <div className="card preferences">
        <h3>Preferences</h3>
        
        <div className="preference-item">
          <span className="label">Units</span>
          <span className="value">{user.preferences?.units || 'Metric'}</span>
        </div>
        
        <div className="preference-item">
          <span className="label">Theme</span>
          <span className="value">{user.preferences?.theme || 'Light'}</span>
        </div>
        
        {user.preferences?.dietaryPreferences && user.preferences.dietaryPreferences.length > 0 && (
          <div className="preference-item">
            <span className="label">Dietary Preferences</span>
            <div className="tags">
              {user.preferences.dietaryPreferences.map((pref, index) => (
                <span className="tag" key={index}>{pref}</span>
              ))}
            </div>
          </div>
        )}
        
        {user.preferences?.allergies && user.preferences.allergies.length > 0 && (
          <div className="preference-item">
            <span className="label">Allergies</span>
            <div className="tags">
              {user.preferences.allergies.map((allergy, index) => (
                <span className="tag" key={index}>{allergy}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="card health-connections">
        <h3>Health Connections</h3>
        
        <div className="health-connection-item">
          <div className="health-connection-info">
            <span className="health-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7V12L14.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <div className="health-connection-details">
              <span className="connection-name">Apple Health</span>
              <span className="connection-status">
                {healthConnected 
                  ? `Connected · Last synced: ${new Date(healthStatus.last_sync || '').toLocaleString()}` 
                  : 'Not connected'}
              </span>
            </div>
          </div>
          
          <button 
            className={`health-connection-button ${healthConnected ? 'connected' : ''}`}
            onClick={handleConnectHealth}
          >
            {healthConnected ? 'Connected' : 'Connect'}
          </button>
        </div>
        
        {showConnectInstructions && (
          <div className="health-connection-instructions">
            <h4>Connect to Apple Health</h4>
            <p>To connect Nutrivize with Apple Health, please follow these steps:</p>
            <ol>
              <li>Install the Nutrivize iOS app from the App Store.</li>
              <li>Open the iOS app and sign in with your account.</li>
              <li>When prompted, allow Nutrivize to access your health data.</li>
              <li>Select which health metrics you want to share (steps, calories burned, exercise minutes).</li>
              <li>Confirm your selection.</li>
            </ol>
            <div className="instruction-note">
              <p>Note: For this demo version, we'll simulate the connection. In a real app, you would need to implement native iOS integration with HealthKit.</p>
              <div className="instruction-buttons">
                <button 
                  className="action-button primary"
                  onClick={async () => {
                    // Simulate sending mock data to demonstrate the feature
                    try {
                      const today = new Date().toISOString();
                      const mockData = {
                        entries: [
                          {
                            date: today,
                            data_type: "steps",
                            value: 8432,
                            unit: "count",
                            source: "Apple Health"
                          },
                          {
                            date: today,
                            data_type: "activeEnergy",
                            value: 320,
                            unit: "kcal",
                            source: "Apple Health"
                          },
                          {
                            date: today,
                            data_type: "exerciseTime",
                            value: 45,
                            unit: "min",
                            source: "Apple Health"
                          }
                        ]
                      };
                      
                      await api.post('/api/health/batch', mockData);
                      setHealthConnected(true);
                      setHealthStatus({
                        connected: true,
                        last_sync: new Date().toISOString()
                      });
                      setShowConnectInstructions(false);
                    } catch (error) {
                      console.error('Error simulating health data:', error);
                    }
                  }}
                >
                  Simulate Connection
                </button>
                <button 
                  className="action-button secondary"
                  onClick={() => setShowConnectInstructions(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="card app-actions">
        <h3>App Settings</h3>
        
        <div className="action-buttons">
          <button className="action-button">
            Edit Profile
          </button>
          
          <button className="action-button">
            Notification Settings
          </button>
          
          <button className="action-button">
            Privacy Settings
          </button>
          
          <button 
            className="action-button"
            onClick={() => logout()}
          >
            Log Out
          </button>
        </div>
      </div>
      
      <div className="app-info">
        <p>Nutrivize v2.0.0</p>
        <p>© 2023 Nutrivize</p>
      </div>
    </div>
  );
};

export default Profile; 