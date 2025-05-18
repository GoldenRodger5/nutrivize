import React from 'react';
import '../styles/Sidebar.css';

// Modern Icon SVGs
const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 5C4 4.44772 4.44772 4 5 4H9C9.55228 4 10 4.44772 10 5V9C10 9.55228 9.55228 10 9 10H5C4.44772 10 4 9.55228 4 9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 5C14 4.44772 14.4477 4 15 4H19C19.5523 4 20 4.44772 20 5V9C20 9.55228 19.5523 10 19 10H15C14.4477 10 14 9.55228 14 9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 15C4 14.4477 4.44772 14 5 14H9C9.55228 14 10 14.4477 10 15V19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 15C14 14.4477 14.4477 14 15 14H19C19.5523 14 20 14.4477 20 15V19C20 19.5523 19.5523 20 19 20H15C14.4477 20 14 19.5523 14 19V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  logs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  foods: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 11C5.11929 11 4 9.88071 4 8.5C4 7.11929 5.11929 6 6.5 6C7.88071 6 9 7.11929 9 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 8C18.8807 8 20 6.88071 20 5.5C20 4.11929 18.8807 3 17.5 3C16.1193 3 15 4.11929 15 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 15.5C20 19.0899 16.9706 22 12 22C7.02944 22 4 19.0899 4 15.5C4 11.9101 7.02944 9 12 9C16.9706 9 20 11.9101 20 15.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  goals: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  insights: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15L11 10L16 15L21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  visuals: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  mealPlans: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M4 11H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 3L8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  mealIdeas: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.6568 8.3432C19.1046 9.79092 19.1046 12.2091 17.6569 13.6569C16.9524 14.3613 16.0431 14.714 15.134 14.714C14.225 14.714 13.3156 14.3614 12.6111 13.6569L12.0464 13.0921C11.7097 12.7553 11.9731 12.4919 12.3099 12.1552C12.6468 11.8184 12.9534 11.5118 13.2902 11.1751L13.8529 10.6124C14.2132 10.2521 14.6777 10.0527 15.1338 10.0526C15.1339 10.0526 15.1339 10.0526 15.134 10.0526C15.5901 10.0525 16.0546 10.2518 16.4149 10.6121C17.1496 11.3467 17.1497 12.5346 16.4151 13.2692C16.0947 13.5897 15.6877 13.75 15.2807 13.75C14.8738 13.75 14.4668 13.5898 14.1464 13.2694L13.8512 12.9742" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 10.0002H6.5M19 10.0002H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 14.0002H8M19 14.0002H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 19C16 20.1046 16.8954 21 18 21C19.1046 21 20 20.1046 20 19C20 17.8954 19.1046 17 18 17C16.8954 17 16 17.8954 16 19Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16 19H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C10.5 22 9.05759 21.6698 7.74516 21.0635L3.45101 21.9759C3.18097 22.0494 2.9509 21.819 3.02439 21.549L3.93196 17.2503C3.32462 15.9369 3 14.5028 3 13C3 12.6674 3.01949 12.3387 3.05738 12.0149" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 10L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M20 21C20 16.0294 16.4183 12 12 12C7.58172 12 4 16.0294 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
};

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Dashboard', icon: icons.dashboard },
    { id: 'logs', label: 'Food Log', icon: icons.logs },
    { id: 'foods', label: 'Food Index', icon: icons.foods },
    { id: 'goals', label: 'Goals', icon: icons.goals },
    { id: 'health', label: 'Apple Health', icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 16.5H5a5 5 0 0 1 0-10h3m8 10h3a5 5 0 0 0 0-10h-3m-3 10V6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ) },
    { id: 'insights-trends', label: 'Insights', icon: icons.insights },
    { id: 'visuals', label: 'Visuals', icon: icons.visuals },
    { id: 'meal-plans', label: 'Meal Plans', icon: icons.mealPlans },
    { id: 'meal-suggestions', label: 'Meal Ideas', icon: icons.mealIdeas },
    { id: 'chat', label: 'AI Assistant', icon: icons.chat },
    { id: 'profile', label: 'Profile', icon: icons.profile }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="app-logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L15.5 4.5M12 1L8.5 4.5M12 1V8.5M17 3L19.5 7.5M7 3L4.5 7.5M21 9L17 12M3 9L7 12M12 23C16.4183 23 20 19.4183 20 15C20 10.5817 16.4183 7 12 7C7.58172 7 4 10.5817 4 15C4 19.4183 7.58172 23 12 23Z" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="15" r="3" stroke="url(#paint1_linear)" strokeWidth="2"/>
              <defs>
                <linearGradient id="paint0_linear" x1="3" y1="1" x2="21" y2="23" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8E2DE2"/>
                  <stop offset="1" stopColor="#4A00E0"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="9" y1="12" x2="15" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8E2DE2"/>
                  <stop offset="1" stopColor="#4A00E0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2>Nutrivize</h2>
        </div>
        <div className="ai-badge">AI Powered</div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {tabs.map(tab => (
            <li 
              key={tab.id} 
              className={tab.id === activeTab ? 'active' : ''}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.id === 'chat' && (
                <span className="ai-dot">
                  <span className="pulse"></span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <div className="app-version">v2.0</div>
      </div>
    </div>
  );
};

export default Sidebar; 