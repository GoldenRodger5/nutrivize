import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Widget, WidgetType, WidgetSize, DEFAULT_WIDGETS } from '../types/widgets';
import api from '../utils/api';

interface WidgetContextType {
  widgets: Widget[];
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidgetVisibility: (id: string, visible: boolean) => void;
  updateWidgetSize: (id: string, size: WidgetSize) => void;
  updateWidgetPosition: (id: string, position: number) => void;
  reorderWidgets: (startIndex: number, endIndex: number) => void;
  resetToDefaults: () => void;
}

const WidgetContext = createContext<WidgetContextType | undefined>(undefined);

export const useWidgetContext = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgetContext must be used within a WidgetProvider');
  }
  return context;
};

interface WidgetProviderProps {
  children: ReactNode;
}

export const WidgetProvider: React.FC<WidgetProviderProps> = ({ children }) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);

  useEffect(() => {
    // Load user's widget preferences from localStorage first
    const savedWidgets = localStorage.getItem('userWidgets');
    
    if (savedWidgets) {
      setWidgets(JSON.parse(savedWidgets));
    } else {
      // If no saved preferences, use defaults
      setWidgets(DEFAULT_WIDGETS);
    }
    
    // Try to fetch from backend - if available
    const fetchWidgetPreferences = async () => {
      try {
        const response = await api.get('/user/widgets');
        if (response.data && response.data.widgets) {
          setWidgets(response.data.widgets);
          // Save to localStorage for offline/faster access
          localStorage.setItem('userWidgets', JSON.stringify(response.data.widgets));
        }
      } catch (error) {
        console.error('Error fetching widget preferences:', error);
      }
    };
    
    fetchWidgetPreferences();
  }, []);

  // Save changes to localStorage and attempt to update backend
  const saveWidgets = async (updatedWidgets: Widget[]) => {
    setWidgets(updatedWidgets);
    
    // Save to localStorage
    localStorage.setItem('userWidgets', JSON.stringify(updatedWidgets));
    
    // Try to save to backend
    try {
      await api.post('/user/widgets', { widgets: updatedWidgets });
    } catch (error) {
      console.error('Error saving widget preferences:', error);
    }
  };

  const addWidget = (type: WidgetType) => {
    const existingWidget = widgets.find(w => w.type === type);
    
    if (existingWidget) {
      // If widget exists but is hidden, make it visible
      if (!existingWidget.visible) {
        const updatedWidgets = widgets.map(w => 
          w.id === existingWidget.id ? { ...w, visible: true } : w
        );
        saveWidgets(updatedWidgets);
      }
      return;
    }
    
    // Find a default configuration for this widget type
    const defaultWidget = DEFAULT_WIDGETS.find(w => w.type === type);
    
    if (!defaultWidget) return;
    
    // Add new widget at the end of the visible widgets
    const newWidget = {
      ...defaultWidget,
      visible: true,
      position: widgets.filter(w => w.visible).length
    };
    
    saveWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    // Instead of actually removing, just hide it
    const updatedWidgets = widgets.map(widget => 
      widget.id === id ? { ...widget, visible: false } : widget
    );
    
    saveWidgets(updatedWidgets);
  };

  const updateWidgetVisibility = (id: string, visible: boolean) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === id ? { ...widget, visible } : widget
    );
    
    saveWidgets(updatedWidgets);
  };

  const updateWidgetSize = (id: string, size: WidgetSize) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === id ? { ...widget, size } : widget
    );
    
    saveWidgets(updatedWidgets);
  };

  const updateWidgetPosition = (id: string, position: number) => {
    const updatedWidgets = widgets.map(widget => 
      widget.id === id ? { ...widget, position } : widget
    );
    
    saveWidgets(updatedWidgets);
  };

  const reorderWidgets = (startIndex: number, endIndex: number) => {
    // Only consider visible widgets for reordering
    const visibleWidgets = widgets.filter(w => w.visible)
      .sort((a, b) => a.position - b.position);
    
    // Move the widget
    const [movedWidget] = visibleWidgets.splice(startIndex, 1);
    visibleWidgets.splice(endIndex, 0, movedWidget);
    
    // Update positions
    const reorderedVisible = visibleWidgets.map((widget, index) => ({
      ...widget,
      position: index
    }));
    
    // Combine with hidden widgets
    const hiddenWidgets = widgets.filter(w => !w.visible);
    const updatedWidgets = [...reorderedVisible, ...hiddenWidgets];
    
    saveWidgets(updatedWidgets);
  };

  const resetToDefaults = () => {
    saveWidgets(DEFAULT_WIDGETS);
  };

  const value: WidgetContextType = {
    widgets,
    addWidget,
    removeWidget,
    updateWidgetVisibility,
    updateWidgetSize,
    updateWidgetPosition,
    reorderWidgets,
    resetToDefaults
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
}; 