import React, { useState } from 'react';
import api from '../utils/api';
import { FoodItem } from '../types';

interface FoodIndexProps {
  foods: FoodItem[];
  onAddFood: () => void;
  onEditFood: (id: string) => void;
  onRefresh: () => Promise<any>;
}

const FoodIndex: React.FC<FoodIndexProps> = ({ foods, onAddFood, onEditFood, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter foods based on search term
  const filteredFoods = searchTerm 
    ? foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : foods;
  
  const handleDeleteFood = async (foodId: string) => {
    try {
      await api.delete(`/foods/${foodId}`);
      onRefresh();
    } catch (error) {
      console.error('Error deleting food:', error);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="food-index-page">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="search-clear" 
            onClick={() => setSearchTerm('')}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Food List */}
      {filteredFoods.length === 0 ? (
        <div className="no-data-message">
          {searchTerm ? (
            <p>No foods match your search.</p>
          ) : (
            <>
              <p>Your food index is empty.</p>
              <button className="primary-button" onClick={onAddFood}>
                Add Your First Food
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="food-list">
          {filteredFoods.map(food => (
            <div className="food-item" key={food._id}>
              <div className="food-item-header">
                <span className="food-item-name">{food.name}</span>
                <span className="food-item-calories">{Math.round(food.calories)} cal</span>
              </div>
              
              <div className="food-item-serving">
                {food.serving_size} {food.serving_unit}
              </div>
              
              <div className="food-item-details">
                <div className="nutrient">
                  <span className="label">Protein</span>
                  <span className="value">{food.proteins}g</span>
                </div>
                
                <div className="nutrient">
                  <span className="label">Carbs</span>
                  <span className="value">{food.carbs}g</span>
                </div>
                
                <div className="nutrient">
                  <span className="label">Fats</span>
                  <span className="value">{food.fats}g</span>
                </div>
                
                {food.fiber > 0 && (
                  <div className="nutrient">
                    <span className="label">Fiber</span>
                    <span className="value">{food.fiber}g</span>
                  </div>
                )}
              </div>
              
              <div className="food-item-actions">
                <button 
                  className="action-button edit-btn" 
                  onClick={() => onEditFood(food._id as string)}
                >
                  Edit
                </button>
                <button 
                  className="action-button delete-btn" 
                  onClick={() => handleDeleteFood(food._id as string)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {/* Pull to refresh indicator */}
          {isRefreshing && (
            <div className="refresh-indicator">
              <div className="spinner"></div>
              <span>Refreshing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FoodIndex; 