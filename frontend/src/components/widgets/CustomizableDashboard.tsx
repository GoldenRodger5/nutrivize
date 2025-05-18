import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useWidgetContext } from '../../context/WidgetContext';
import { Widget } from './Widget';
import { WidgetLibrary } from './WidgetLibrary';
import { TodayNutritionWidget } from './TodayNutritionWidget';
import { WeightGoalWidget } from './WeightGoalWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { RecentMealsWidget } from './RecentMealsWidget';
import { WeeklyTrendsWidget } from './WeeklyTrendsWidget';
import { WaterIntakeWidget } from './WaterIntakeWidget';
import { ActivityLogWidget } from './ActivityLogWidget';
import { NutritionGoalsWidget } from './NutritionGoalsWidget';
import { UpcomingMealsWidget } from './UpcomingMealsWidget';
import { WidgetSize } from '../../types/widgets';

interface CustomizableDashboardProps {
  user: any;
  goal: any;
  todaysLogs: any[];
  onRefresh: () => void;
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({ 
  user, 
  goal, 
  todaysLogs, 
  onRefresh 
}) => {
  const { widgets, reorderWidgets, resetToDefaults } = useWidgetContext();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  
  // Get visible widgets sorted by position
  const visibleWidgets = widgets
    .filter(widget => widget.visible)
    .sort((a, b) => a.position - b.position);
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    // Reorder widgets
    reorderWidgets(result.source.index, result.destination.index);
  };
  
  // Helper to render the appropriate widget component based on type
  const renderWidgetContent = (widgetType: string, widgetData: any, widgetSize: WidgetSize) => {
    switch (widgetType) {
      case 'today-nutrition':
        return <TodayNutritionWidget todaysLogs={todaysLogs} goal={goal} size={widgetSize} />;
      case 'weight-goal':
        return <WeightGoalWidget goal={goal} />;
      case 'quick-actions':
        return <QuickActionsWidget />;
      case 'recent-meals':
        return <RecentMealsWidget todaysLogs={todaysLogs} size={widgetSize} />;
      case 'weekly-trends':
        return <WeeklyTrendsWidget size={widgetSize} />;
      case 'water-intake':
        return <WaterIntakeWidget size={widgetSize} />;
      case 'activity-log':
        return <ActivityLogWidget size={widgetSize} />;
      case 'nutrition-goals':
        return <NutritionGoalsWidget goal={goal} size={widgetSize} />;
      case 'upcoming-meals':
        return <UpcomingMealsWidget size={widgetSize} />;
      default:
        return <div>Widget content not available</div>;
    }
  };
  
  return (
    <div className="customizable-dashboard">
      <div className="dashboard-controls">
        <button
          className={`customize-toggle ${isCustomizing ? 'active' : ''}`}
          onClick={() => setIsCustomizing(!isCustomizing)}
        >
          {isCustomizing ? 'Done Customizing' : 'Customize Dashboard'}
        </button>
        
        {isCustomizing && (
          <>
            <button
              className="add-widget-btn"
              onClick={() => setShowLibrary(true)}
            >
              Add Widget
            </button>
            
            <button
              className="reset-btn"
              onClick={() => {
                if (window.confirm('Reset dashboard to default layout?')) {
                  resetToDefaults();
                }
              }}
            >
              Reset to Default
            </button>
          </>
        )}
      </div>
      
      {showLibrary && (
        <div className="modal-overlay">
          <WidgetLibrary onClose={() => setShowLibrary(false)} />
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" direction="vertical">
          {(provided) => (
            <div 
              className={`widget-grid ${isCustomizing ? 'customizing' : ''}`}
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {visibleWidgets.map((widget, index) => (
                <Draggable 
                  key={widget.id} 
                  draggableId={widget.id} 
                  index={index}
                  isDragDisabled={!isCustomizing}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Widget widget={widget}>
                        {renderWidgetContent(widget.type, { user, goal, todaysLogs }, widget.size)}
                      </Widget>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {isCustomizing && (
                <div 
                  className="add-widget-slot"
                  onClick={() => setShowLibrary(true)}
                >
                  <button className="add-widget-button">
                    +
                    <span>Add Widget</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}; 