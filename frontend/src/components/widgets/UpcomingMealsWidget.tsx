import React from 'react';
import { useHistory } from 'react-router-dom';
import { WidgetSize } from '../../types/widgets';

interface UpcomingMealsWidgetProps {
  size?: WidgetSize;
}

export const UpcomingMealsWidget: React.FC<UpcomingMealsWidgetProps> = ({ size = 'medium' }) => {
  const history = useHistory();
  
  // Sample data for upcoming meals - in real app this would be fetched from API
  const upcomingMeals = [
    {
      id: '1',
      name: 'Greek Yogurt Bowl',
      time: '8:00 AM',
      day: 'Today',
      type: 'breakfast',
      calories: 320,
      protein: 24,
      carbs: 35,
      fat: 8
    },
    {
      id: '2',
      name: 'Grilled Chicken Salad',
      time: '12:30 PM',
      day: 'Today',
      type: 'lunch',
      calories: 450,
      protein: 35,
      carbs: 20,
      fat: 15
    },
    {
      id: '3',
      name: 'Salmon with Vegetables',
      time: '6:30 PM',
      day: 'Today',
      type: 'dinner',
      calories: 520,
      protein: 40,
      carbs: 25,
      fat: 22
    },
    {
      id: '4',
      name: 'Protein Smoothie',
      time: '8:00 AM',
      day: 'Tomorrow',
      type: 'breakfast',
      calories: 350,
      protein: 30,
      carbs: 40,
      fat: 5
    }
  ];
  
  const navigateToMealPlanner = () => {
    history.push('/dashboard?tab=meal-plans');
  };
  
  const getTotalNutrition = (meals: typeof upcomingMeals) => {
    return meals.reduce(
      (acc, meal) => {
        return {
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          carbs: acc.carbs + meal.carbs,
          fat: acc.fat + meal.fat
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };
  
  const todaysMeals = upcomingMeals.filter(meal => meal.day === 'Today');
  const todaysNutrition = getTotalNutrition(todaysMeals);
  
  // For small widget
  if (size === 'small') {
    const nextMeal = upcomingMeals[0];
    
    return (
      <div className="upcoming-meals-container small">
        <div className="next-meal">
          <div className="next-meal-time">{nextMeal.time}</div>
          <div className="next-meal-name">{nextMeal.name}</div>
        </div>
        <button onClick={navigateToMealPlanner} className="widget-link">Plan</button>
      </div>
    );
  }
  
  // For large widget
  if (size === 'large') {
    return (
      <div className="upcoming-meals-container large">
        <div className="upcoming-meals-header">
          <h4>Meal Plan</h4>
          <div className="day-selector">
            <button className="day-option active">Today</button>
            <button className="day-option">Tomorrow</button>
          </div>
        </div>
        
        <div className="today-nutrition-summary">
          <div className="nutrition-total">
            <span className="total-label">Total</span>
            <span className="total-value">{todaysNutrition.calories} cal</span>
          </div>
          <div className="macros-pills">
            <span className="pill protein">{todaysNutrition.protein}g P</span>
            <span className="pill carbs">{todaysNutrition.carbs}g C</span>
            <span className="pill fats">{todaysNutrition.fat}g F</span>
          </div>
        </div>
        
        <div className="meal-time-list">
          {todaysMeals.map(meal => (
            <div key={meal.id} className="meal-time-item">
              <div className="meal-time-header">
                <div className="meal-time">{meal.time}</div>
                <div className="meal-type">{meal.type}</div>
                <div className="meal-calories">{meal.calories} cal</div>
              </div>
              <div className="meal-details">
                <div className="meal-name">{meal.name}</div>
                <div className="meal-macros">
                  <span className="macro-pill">{meal.protein}g P</span>
                  <span className="macro-pill">{meal.carbs}g C</span>
                  <span className="macro-pill">{meal.fat}g F</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="meal-plan-actions">
          <button onClick={navigateToMealPlanner} className="widget-button">Edit Meal Plan</button>
          <button onClick={() => history.push('/dashboard?tab=meal-suggestions')} className="widget-link">
            Get New Suggestions
          </button>
        </div>
      </div>
    );
  }
  
  // Default medium widget
  return (
    <div className="upcoming-meals-container">
      <div className="upcoming-meals-list">
        {upcomingMeals.slice(0, 3).map(meal => (
          <div key={meal.id} className="upcoming-meal-item">
            <div className="meal-time-info">
              <span className="meal-day">{meal.day}</span>
              <span className="meal-time">{meal.time}</span>
            </div>
            <div className="meal-details">
              <div className="meal-name">{meal.name}</div>
              <div className="meal-calories">{meal.calories} cal</div>
            </div>
          </div>
        ))}
      </div>
      
      <button onClick={navigateToMealPlanner} className="widget-link">View Full Meal Plan</button>
    </div>
  );
}; 