import React, { useState } from 'react';
import { DEFAULT_WIDGETS, WidgetType } from '../../types/widgets';
import { useWidgetContext } from '../../context/WidgetContext';

interface WidgetLibraryProps {
  onClose: () => void;
}

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onClose }) => {
  const { widgets, addWidget } = useWidgetContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Filter available widgets that aren't already visible
  const availableWidgets = DEFAULT_WIDGETS.filter(defaultWidget => {
    // Check if this widget is already visible in the user's dashboard
    const existingWidget = widgets.find(w => 
      w.type === defaultWidget.type && w.visible
    );
    
    // Include in available list if it's not visible or if widget isn't in dashboard at all
    return !existingWidget;
  });
  
  // Widget category mapping
  const widgetCategories = {
    'nutrition': ['today-nutrition', 'nutrition-goals'],
    'goals': ['weight-goal'],
    'meals': ['recent-meals', 'upcoming-meals'],
    'activities': ['activity-log', 'water-intake'],
    'analytics': ['weekly-trends'],
    'actions': ['quick-actions']
  };
  
  // Get category for a widget
  const getWidgetCategory = (type: WidgetType): string => {
    for (const [category, types] of Object.entries(widgetCategories)) {
      if (types.includes(type)) {
        return category;
      }
    }
    return 'other';
  };
  
  // Widget icon and description mapping
  const widgetDetails = {
    'today-nutrition': {
      icon: '📊',
      description: 'Track your daily macros and nutrition'
    },
    'weight-goal': {
      icon: '⚖️',
      description: 'Monitor progress toward your weight goal'
    },
    'quick-actions': {
      icon: '⚡',
      description: 'Quick access to common actions'
    },
    'recent-meals': {
      icon: '🍽️',
      description: 'View your recently logged meals'
    },
    'weekly-trends': {
      icon: '📈',
      description: 'Analyze your nutrition trends over time'
    },
    'water-intake': {
      icon: '💧',
      description: 'Track your daily water consumption'
    },
    'activity-log': {
      icon: '🏃',
      description: 'Log and view your physical activities'
    },
    'nutrition-goals': {
      icon: '🎯',
      description: 'Monitor your nutrition targets'
    },
    'upcoming-meals': {
      icon: '🗓️',
      description: 'View your planned meals'
    }
  };
  
  // Filter by search term and category
  const filteredWidgets = availableWidgets.filter(widget => {
    const matchesSearch = widget.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || getWidgetCategory(widget.type) === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  const handleAddWidget = (type: WidgetType) => {
    addWidget(type);
    onClose();
  };
  
  return (
    <div className="widget-library">
      <div className="library-header">
        <h2>Add Widgets</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="library-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="widget-search"
          />
        </div>
        
        <div className="category-filter">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="category-select"
          >
            <option value="all">All Categories</option>
            <option value="nutrition">Nutrition</option>
            <option value="goals">Goals</option>
            <option value="meals">Meals</option>
            <option value="activities">Activities</option>
            <option value="analytics">Analytics</option>
            <option value="actions">Actions</option>
          </select>
        </div>
      </div>
      
      <div className="available-widgets">
        {filteredWidgets.length > 0 ? (
          filteredWidgets.map(widget => (
            <div key={widget.id} className={`widget-option widget-${widget.size}`}>
              <div className="widget-option-icon">
                {widgetDetails[widget.type]?.icon || '🔄'}
              </div>
              <div className="widget-option-info">
                <h4>{widget.title}</h4>
                <p className="widget-description">{widgetDetails[widget.type]?.description || 'Widget description'}</p>
                <div className="widget-meta">
                  <span className="widget-size-tag">{widget.size}</span>
                  <span className="widget-category-tag">{getWidgetCategory(widget.type)}</span>
                </div>
              </div>
              <button 
                className="add-widget-btn"
                onClick={() => handleAddWidget(widget.type)}
              >
                Add
              </button>
            </div>
          ))
        ) : (
          <div className="no-widgets">
            <p>No widgets available to add</p>
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 