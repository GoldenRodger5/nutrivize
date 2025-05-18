import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Visuals from '../pages/Visuals';
import { mockFoodLogs, mockGoal } from '../mockData';

// Mock the chart.js and react-chartjs-2 modules
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>
}));

describe('Visuals Component', () => {
  test('renders without crashing', () => {
    render(<Visuals userId="test-user-id" logs={[]} goal={null} />);
    expect(screen.getByText('Nutrition Visualizations')).toBeInTheDocument();
    expect(screen.getByText('No Visualization Data Available')).toBeInTheDocument();
  });

  test('renders charts when logs are provided', () => {
    render(<Visuals userId="test-user-id" logs={mockFoodLogs} goal={mockGoal} />);
    
    // Headers should be present
    expect(screen.getByText('Calorie Intake Trend')).toBeInTheDocument();
    expect(screen.getByText('Macronutrient Distribution')).toBeInTheDocument();
    expect(screen.getByText('Goal Achievement')).toBeInTheDocument();
    expect(screen.getByText('Weight Progress')).toBeInTheDocument();
    
    // Charts should be rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('changes chart type when customization options change', () => {
    render(<Visuals userId="test-user-id" logs={mockFoodLogs} goal={mockGoal} />);
    
    // Initially should have a line chart for calories
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    
    // Change calorie chart to bar
    fireEvent.change(screen.getByLabelText('Calorie Chart Type:'), { target: { value: 'bar' } });
    
    // Now should have two bar charts (one for calories, one for macros)
    expect(screen.getAllByTestId('bar-chart').length).toBe(2);
    
    // Change macro chart to pie
    fireEvent.change(screen.getByLabelText('Macro Chart Type:'), { target: { value: 'pie' } });
    
    // Should now have a bar chart for calories and a pie chart for macros
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  test('displays goal progress correctly', () => {
    render(<Visuals userId="test-user-id" logs={mockFoodLogs} goal={mockGoal} />);
    
    // Weight progress should show the correct values
    expect(screen.getByText('80 kg')).toBeInTheDocument(); // Current weight
    expect(screen.getByText('70 kg')).toBeInTheDocument(); // Goal weight
    expect(screen.getByText('0.5 kg/week')).toBeInTheDocument(); // Rate
  });

  test('filters data when date range changes', () => {
    render(<Visuals userId="test-user-id" logs={mockFoodLogs} goal={mockGoal} />);
    
    // Change date range to 30 days
    fireEvent.change(screen.getByLabelText('Time Period:'), { target: { value: '30days' } });
    
    // Charts should still be present
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Change to all time
    fireEvent.change(screen.getByLabelText('Time Period:'), { target: { value: 'all' } });
    
    // Charts should still be present
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
}); 