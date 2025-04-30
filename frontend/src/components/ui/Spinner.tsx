import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium', 
  color = '#3182CE', 
  className = '' 
}) => {
  const sizeMap = {
    small: { width: '16px', height: '16px', borderWidth: '2px' },
    medium: { width: '24px', height: '24px', borderWidth: '3px' },
    large: { width: '32px', height: '32px', borderWidth: '4px' }
  };
  
  const { width, height, borderWidth } = sizeMap[size];
  
  const spinnerStyle = {
    display: 'inline-block',
    width,
    height,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth,
    borderColor: `${color}30`,
    borderTopColor: color,
    animation: 'spin 1s linear infinite'
  };
  
  return (
    <div className={`spinner ${className}`} style={spinnerStyle}>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}; 