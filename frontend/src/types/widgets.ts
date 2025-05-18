export type WidgetSize = 'small' | 'medium' | 'large';
export type WidgetType = 
  | 'today-nutrition' 
  | 'weight-goal' 
  | 'quick-actions' 
  | 'recent-meals'
  | 'weekly-trends'
  | 'water-intake'
  | 'activity-log'
  | 'nutrition-goals'
  | 'upcoming-meals';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: number;
  visible: boolean;
}

// Default widget configurations
export const DEFAULT_WIDGETS: Widget[] = [
  {
    id: 'today-nutrition',
    type: 'today-nutrition',
    title: "Today's Nutrition",
    size: 'medium',
    position: 0,
    visible: true
  },
  {
    id: 'weight-goal',
    type: 'weight-goal',
    title: 'Weight Goal',
    size: 'medium',
    position: 1,
    visible: true
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Quick Actions',
    size: 'small',
    position: 2,
    visible: true
  },
  {
    id: 'recent-meals',
    type: 'recent-meals',
    title: 'Recent Meals',
    size: 'medium',
    position: 3,
    visible: true
  },
  {
    id: 'weekly-trends',
    type: 'weekly-trends',
    title: 'Weekly Trends',
    size: 'medium',
    position: 4,
    visible: false
  },
  {
    id: 'water-intake',
    type: 'water-intake',
    title: 'Water Intake',
    size: 'small',
    position: 5,
    visible: false
  },
  {
    id: 'activity-log',
    type: 'activity-log',
    title: 'Activity Log',
    size: 'small',
    position: 6,
    visible: false
  },
  {
    id: 'nutrition-goals',
    type: 'nutrition-goals',
    title: 'Nutrition Goals',
    size: 'medium',
    position: 7,
    visible: false
  },
  {
    id: 'upcoming-meals',
    type: 'upcoming-meals',
    title: 'Upcoming Meals',
    size: 'medium',
    position: 8,
    visible: false
  }
];

// Helper function to get widget config by type
export const getWidgetByType = (type: WidgetType, widgets: Widget[]): Widget | undefined => {
  return widgets.find(widget => widget.type === type);
}; 