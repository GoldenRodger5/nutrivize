import React, { useState, useEffect } from 'react';
import '../styles/GoalBasedMealSuggestions.css';
import api from '../utils/api';

interface MealSuggestion {
  _id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
  serving_size: number;
  serving_unit: string;
  is_favorite?: boolean;
  match_score?: number;
}

interface RemainingMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface GoalBasedMealSuggestionsProps {
  userId: string;
  goalType: 'lose' | 'maintain' | 'gain';
  remainingMacros: RemainingMacros;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onMealSelected?: (meal: MealSuggestion) => void;
}

const GoalBasedMealSuggestions: React.FC<GoalBasedMealSuggestionsProps> = ({
  userId,
  goalType,
  remainingMacros,
  mealType = 'snack',
  onMealSelected
}) => {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, [userId, goalType, remainingMacros, mealType]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch available foods from the database
      const response = await api.get('/foods');
      const foods = response.data;

      // Apply goal-specific filtering and sorting
      const filteredSuggestions = filterFoodsByGoal(foods, goalType, remainingMacros);
      
      // Set match scores based on how well they fit the user's goals
      const suggestionsWithScores = calculateMatchScores(filteredSuggestions, goalType, remainingMacros);
      
      setSuggestions(suggestionsWithScores.slice(0, 5)); // Top 5 suggestions
    } catch (err) {
      console.error('Error fetching meal suggestions:', err);
      setError('Unable to load meal suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Filter foods based on the user's goal
  const filterFoodsByGoal = (foods: MealSuggestion[], goalType: string, remaining: RemainingMacros) => {
    let filtered = foods.filter(food => food.calories <= remaining.calories * 0.8);
    
    if (goalType === 'lose') {
      // For weight loss: Prioritize high protein, low calorie foods
      filtered = filtered.filter(food => 
        food.calories <= remaining.calories * 0.5 && 
        food.proteins >= 5 && 
        food.proteins / food.calories >= 0.05 // At least 5g protein per 100 calories
      );
    } else if (goalType === 'gain') {
      // For weight gain: Prioritize calorie-dense, protein-rich foods
      filtered = filtered.filter(food => 
        food.calories >= 150 && 
        food.proteins >= 10
      );
    } else {
      // For maintenance: Balanced macros
      filtered = filtered.filter(food => 
        food.calories >= 100 && 
        food.calories <= remaining.calories * 0.6
      );
    }
    
    return filtered;
  };

  // Calculate match scores for each food
  const calculateMatchScores = (foods: MealSuggestion[], goalType: string, remaining: RemainingMacros) => {
    return foods.map(food => {
      let score = 0;
      
      // Base score on how well the food fits within remaining macros
      const caloriePercentage = food.calories / remaining.calories;
      score += (1 - Math.min(1, caloriePercentage)) * 50; // Higher score for using less of remaining calories
      
      if (goalType === 'lose') {
        // For weight loss: Prioritize protein-to-calorie ratio
        score += (food.proteins / Math.max(1, food.calories)) * 1000;
        score += (1 - (food.fats / Math.max(1, food.calories)) * 9) * 20; // Lower fat per calorie is better
      } else if (goalType === 'gain') {
        // For weight gain: Prioritize total protein and good calories
        score += (food.proteins / 30) * 50; // Higher protein is better
        score += (food.calories / 300) * 50; // Higher calories (up to a point) is better
      } else {
        // For maintenance: Prioritize balanced macros
        const proteinCals = food.proteins * 4;
        const carbCals = food.carbs * 4;
        const fatCals = food.fats * 9;
        const totalCals = food.calories;
        
        // Ideal distribution: ~30% protein, ~40% carbs, ~30% fat
        const proteinPct = proteinCals / totalCals;
        const carbPct = carbCals / totalCals;
        const fatPct = fatCals / totalCals;
        
        // Lower score for deviation from ideal
        score += (1 - Math.abs(0.3 - proteinPct)) * 30;
        score += (1 - Math.abs(0.4 - carbPct)) * 30;
        score += (1 - Math.abs(0.3 - fatPct)) * 30;
      }
      
      return { ...food, match_score: Math.round(score) };
    }).sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  };

  const handleMealSelection = (meal: MealSuggestion) => {
    if (onMealSelected) {
      onMealSelected(meal);
    }
  };

  const getGoalSpecificTitle = () => {
    if (goalType === 'lose') {
      if (remainingMacros.calories < 300) {
        return 'Low-Calorie, High-Protein Options';
      }
      return 'Weight Loss Friendly Options';
    } else if (goalType === 'gain') {
      return 'Muscle Building Options';
    } else {
      return 'Balanced Meal Options';
    }
  };

  const getGoalSpecificEmptyMessage = () => {
    if (goalType === 'lose') {
      return "No low-calorie, high-protein options found. Try logging some of your favorite foods to get personalized suggestions.";
    } else if (goalType === 'gain') {
      return "No calorie-dense meal options found. Try logging some of your favorite foods to get personalized suggestions.";
    } else {
      return "No balanced meal options found. Try logging some of your favorite foods to get personalized suggestions.";
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  if (loading) {
    return <div className="meal-suggestions-loading">Loading meal suggestions...</div>;
  }

  return (
    <div className="goal-based-meal-suggestions">
      <div className="suggestions-header">
        <h3>{getGoalSpecificTitle()}</h3>
        <button 
          className="expand-toggle" 
          onClick={toggleExpand}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
      
      {error && <div className="suggestions-error">{error}</div>}
      
      {suggestions.length === 0 ? (
        <div className="no-suggestions-message">
          {getGoalSpecificEmptyMessage()}
        </div>
      ) : (
        <div className={`suggestions-list ${expanded ? 'expanded' : ''}`}>
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion._id} 
              className="suggestion-card"
              onClick={() => handleMealSelection(suggestion)}
            >
              <div className="suggestion-name">
                {suggestion.name}
                <span className="suggestion-match-score">
                  {suggestion.match_score}% match
                </span>
              </div>
              
              <div className="suggestion-macros">
                <div className="macro-pill calories">
                  {suggestion.calories} cal
                </div>
                <div className="macro-pill protein">
                  {suggestion.proteins}g protein
                </div>
                <div className="macro-pill carbs">
                  {suggestion.carbs}g carbs
                </div>
                <div className="macro-pill fat">
                  {suggestion.fats}g fat
                </div>
              </div>
              
              <div className="suggestion-context">
                {goalType === 'lose' && (
                  <span className="context-message">
                    {suggestion.proteins > 15 ? 'High protein option' : 
                     suggestion.calories < 200 ? 'Low calorie option' : 
                     'Moderate calorie option'}
                  </span>
                )}
                
                {goalType === 'gain' && (
                  <span className="context-message">
                    {suggestion.calories > 300 ? 'Calorie-dense option' : 
                     suggestion.proteins > 20 ? 'Protein-rich option' : 
                     'Good building block'}
                  </span>
                )}
                
                {goalType === 'maintain' && (
                  <span className="context-message">
                    {Math.abs((suggestion.proteins * 4 / suggestion.calories) - 0.3) < 0.1 ? 'Well-balanced macros' : 
                     suggestion.fiber > 5 ? 'Good fiber content' : 
                     'Nutrient-dense option'}
                  </span>
                )}
              </div>
              
              <button className="add-meal-button">
                Add to Log
              </button>
            </div>
          ))}
        </div>
      )}
      
      <button 
        className="refresh-suggestions" 
        onClick={fetchSuggestions}
      >
        Refresh Suggestions
      </button>
    </div>
  );
};

export default GoalBasedMealSuggestions; 