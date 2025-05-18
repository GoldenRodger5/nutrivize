import React, { useState } from 'react';
import { Widget as WidgetType, WidgetSize } from '../../types/widgets';
import { useWidgetContext } from '../../context/WidgetContext';
import '../../styles/widgets.css';

interface WidgetProps {
  widget: WidgetType;
  children: React.ReactNode;
}

export const Widget: React.FC<WidgetProps> = ({ widget, children }) => {
  const { removeWidget, updateWidgetSize } = useWidgetContext();
  const [showControls, setShowControls] = useState(false);
  
  const handleSizeChange = (size: WidgetSize) => {
    updateWidgetSize(widget.id, size);
  };
  
  const handleRemove = () => {
    if (window.confirm(`Remove ${widget.title} widget?`)) {
      removeWidget(widget.id);
    }
  };
  
  return (
    <div className={`widget widget-${widget.size} widget-${widget.type}`} data-id={widget.id}>
      <div className="widget-header">
        <h3>{widget.title}</h3>
        
        <div className="widget-actions">
          <button 
            className="widget-customize-btn"
            onClick={() => setShowControls(!showControls)}
            aria-label="Customize widget"
          >
            ⚙️
          </button>
          
          {showControls && (
            <div className="widget-controls">
              <div className="size-controls">
                <button 
                  className={`size-btn ${widget.size === 'small' ? 'active' : ''}`} 
                  onClick={() => handleSizeChange('small')}
                  aria-label="Small size"
                >
                  S
                </button>
                <button 
                  className={`size-btn ${widget.size === 'medium' ? 'active' : ''}`} 
                  onClick={() => handleSizeChange('medium')}
                  aria-label="Medium size"
                >
                  M
                </button>
                <button 
                  className={`size-btn ${widget.size === 'large' ? 'active' : ''}`} 
                  onClick={() => handleSizeChange('large')}
                  aria-label="Large size"
                >
                  L
                </button>
              </div>
              
              <button 
                className="remove-widget-btn" 
                onClick={handleRemove}
                aria-label="Remove widget"
              >
                🗑️ Remove
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="widget-content">
        {children}
      </div>
    </div>
  );
}; 