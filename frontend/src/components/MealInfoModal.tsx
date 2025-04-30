import React from 'react';

// Define types locally to avoid missing module errors
interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Ingredient {
  name: string;
  amount: number;  // This represents servings
  unit: string;
  in_food_index: boolean;
  macros?: MacroNutrients;
  needs_indexing?: boolean;
}

interface MealSuggestion {
  title: string;
  name: string;
  macros: MacroNutrients;
  description: string;
  serving_info: string;
  ingredients: Ingredient[];
  instructions: string[];
  cooking_time: number;
}

interface FoodItem {
  _id: string;
  name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  serving_size: number;
  serving_unit: string;
}

// Mock user context - you can replace this with the actual implementation
const useUserContext = () => {
  return {
    user: {
      dailyTargets: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 70,
      }
    }
  };
};

interface MealInfoModalProps {
  meal: MealSuggestion;
  onClose: () => void;
  userFoodIndex: FoodItem[];
}

const MealInfoModal: React.FC<MealInfoModalProps> = ({ meal, onClose, userFoodIndex }) => {
  const { user } = useUserContext();
  
  // Check if an ingredient is in the user's food index
  const isIngredientAvailable = (ingredientName: string): boolean => {
    // First check if the ingredient is already marked as in_food_index
    if (meal.ingredients.find(ing => ing.name === ingredientName)?.in_food_index) {
      return true;
    }
    
    // Then do a more flexible search in the user's food index
    return userFoodIndex.some(food => 
      food.name.toLowerCase() === ingredientName.toLowerCase() || 
      food.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
      ingredientName.toLowerCase().includes(food.name.toLowerCase())
    );
  };

  // Calculate total macros from meal
  const calculateTotalMacros = (): MacroNutrients => {
    return {
      calories: meal.macros.calories,
      protein: meal.macros.protein,
      carbs: meal.macros.carbs,
      fat: meal.macros.fat
    };
  };
  
  // Calculate remaining macros if the meal is logged
  const calculateRemainingMacros = (): MacroNutrients => {
    if (!user || !user.dailyTargets) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    
    const mealMacros = calculateTotalMacros();
    
    return {
      calories: user.dailyTargets.calories - mealMacros.calories,
      protein: user.dailyTargets.protein - mealMacros.protein,
      carbs: user.dailyTargets.carbs - mealMacros.carbs,
      fat: user.dailyTargets.fat - mealMacros.fat
    };
  };
  
  const remainingMacros = calculateRemainingMacros();
  const totalMacros = calculateTotalMacros();

  // Handle modal click to prevent closing when clicking inside the modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="meal-info-modal-overlay" onClick={onClose}>
      <div className="meal-info-modal" onClick={handleModalClick}>
        <div className="modal-header">
          <h3>{meal.title || meal.name}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-content">
          <div className="meal-info-section">
            <h4>Overview</h4>
            <p><strong>Serving Size:</strong> {meal.serving_info}</p>
            <p><strong>Cooking Time:</strong> {meal.cooking_time} minutes</p>
            <p>{meal.description}</p>
          </div>
          
          <div className="meal-info-section">
            <h4>Macro Nutrients</h4>
            <div className="macros-table">
              <div className="macro-item">
                <span className="macro-value">{totalMacros.calories}</span>
                <span className="macro-label">Calories</span>
              </div>
              <div className="macro-item">
                <span className="macro-value">{totalMacros.protein}g</span>
                <span className="macro-label">Protein</span>
              </div>
              <div className="macro-item">
                <span className="macro-value">{totalMacros.carbs}g</span>
                <span className="macro-label">Carbs</span>
              </div>
              <div className="macro-item">
                <span className="macro-value">{totalMacros.fat}g</span>
                <span className="macro-label">Fat</span>
              </div>
            </div>
            
            {user && user.dailyTargets && (
              <div className="remaining-macros">
                <h5>Remaining Macros After Meal</h5>
                <div className="macros-table remaining">
                  <div className="macro-item">
                    <span className="macro-value">{remainingMacros.calories}</span>
                    <span className="macro-label">Calories</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-value">{remainingMacros.protein}g</span>
                    <span className="macro-label">Protein</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-value">{remainingMacros.carbs}g</span>
                    <span className="macro-label">Carbs</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-value">{remainingMacros.fat}g</span>
                    <span className="macro-label">Fat</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="meal-info-section">
            <h4>Ingredients</h4>
            <div className="ingredients-table">
              <table>
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Servings</th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fat</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meal.ingredients.map((ingredient, index) => (
                    <tr key={index}>
                      <td>{ingredient.name}</td>
                      <td>{ingredient.amount} {ingredient.unit}</td>
                      <td>{ingredient.macros ? ingredient.macros.calories || 0 : 0}</td>
                      <td>{ingredient.macros ? (ingredient.macros.protein || 0) + 'g' : '0g'}</td>
                      <td>{ingredient.macros ? (ingredient.macros.carbs || 0) + 'g' : '0g'}</td>
                      <td>{ingredient.macros ? (ingredient.macros.fat || 0) + 'g' : '0g'}</td>
                      <td>
                        {isIngredientAvailable(ingredient.name) ? (
                          <span className="available">In Index</span>
                        ) : ingredient.needs_indexing ? (
                          <span className="needs-indexing">Needs Indexing</span>
                        ) : (
                          <span className="not-available">Not in Index</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="meal-info-section">
            <h4>Preparation Instructions</h4>
            <ol className="instructions-list">
              {meal.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="close-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default MealInfoModal; 