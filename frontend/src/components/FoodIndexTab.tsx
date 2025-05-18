import React, { useState, useEffect } from 'react';
import { FoodItem } from '../types';
import api from '../utils/api';
import '../styles/FoodIndexTab.css';

// Modern SVG Icons
const icons = {
  food: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 17C14 17 14.5 15 12 15C9.5 15 10 17 10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  add: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  filter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8L14 12M14 8L18 12M6 8L10 12M10 8L6 12M3 4H21M4 14H20C20.5523 14 21 14.4477 21 15V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V15C3 14.4477 3.44772 14 4 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sort: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6H21M6 12H18M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.1334 5.64C17.8749 4.30583 16.2051 3.42 14.3799 3.1262C12.5546 2.83239 10.6835 3.14229 9.04432 4.01147C7.40518 4.88064 6.09086 6.26784 5.28515 7.95452C4.47943 9.6412 4.22429 11.5364 4.56026 13.3743C4.89624 15.2121 5.80519 16.8958 7.15703 18.1853C8.50887 19.4748 10.2321 20.3024 12.0775 20.5453C13.9229 20.7882 15.8061 20.4342 17.4458 19.5336C19.0855 18.633 20.3883 17.2186 21.1734 15.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.1667 8.38V3.88H16.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  edit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13M19.5858 3.58579C18.8047 2.80474 17.5353 2.80474 16.7542 3.58579L9 11.3401V15H12.6599L19.5858 8.07417C20.3668 7.29312 20.3668 6.02369 19.5858 5.24264L19.5858 3.58579Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  delete: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M21 7H3M16 7L14.5 3H9.5L8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  protein: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 11C5.11929 11 4 9.88071 4 8.5C4 7.11929 5.11929 6 6.5 6C7.88071 6 9 7.11929 9 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 8C18.8807 8 20 6.88071 20 5.5C20 4.11929 18.8807 3 17.5 3C16.1193 3 15 4.11929 15 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 15.5C20 19.0899 16.9706 22 12 22C7.02944 22 4 19.0899 4 15.5C4 11.9101 7.02944 9 12 9C16.9706 9 20 11.9101 20 15.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  carbs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9C3 7.89543 3.89543 7 5 7H19C20.1046 7 21 7.89543 21 9V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 21V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 4H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  fat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 7C14 9.76142 11.7614 12 9 12C6.23858 12 4 9.76142 4 7C4 4.23858 6.23858 2 9 2C11.7614 2 14 4.23858 14 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M20 17.5C20 19.433 18.433 21 16.5 21C14.567 21 13 19.433 13 17.5C13 15.567 14.567 14 16.5 14C18.433 14 20 15.567 20 17.5Z" stroke="currentColor" strokeWidth="2" />
      <path d="M13.5 7.5L16.5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  fiber: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 15C19 18.866 15.866 22 12 22C8.13401 22 5 18.866 5 15C5 11.134 8.13401 8 12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 6C21 8.20914 19.2091 10 17 10C14.7909 10 13 8.20914 13 6C13 3.79086 14.7909 2 17 2C19.2091 2 21 3.79086 21 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 15L17 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
};

// Extend FoodItem to include source property
interface ExtendedFoodItem extends FoodItem {
  source?: string;
  meal_compatibility?: string[];
  created_by?: string;
}

interface FoodIndexTabProps {
  onAddFood: () => void;
  onEditFood: (id: string) => void;
  onRefresh: () => Promise<any>;
  foods?: ExtendedFoodItem[];
}

const FoodIndexTab: React.FC<FoodIndexTabProps> = ({ onAddFood, onEditFood, onRefresh, foods: propFoods }) => {
  const [foods, setFoods] = useState<ExtendedFoodItem[]>(propFoods || []);
  const [isLoading, setIsLoading] = useState(!propFoods);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [error, setError] = useState<string | null>(null);
  
  // Fetch foods directly from the API
  const fetchFoods = async () => {
    // If foods were provided as props, no need to fetch
    if (propFoods) {
      setFoods(propFoods);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("FoodIndexTab: Fetching foods directly");
      const response = await api.get('/foods');
      console.log("FoodIndexTab: Direct foods response:", response.status, response.data);
      
      if (response.status === 200 && Array.isArray(response.data)) {
        console.log(`FoodIndexTab: Successfully fetched ${response.data.length} food items`);
        setFoods(response.data as ExtendedFoodItem[]);
      } else {
        console.error("FoodIndexTab: API returned invalid data format:", response.data);
        setError("Received invalid data format from server");
      }
    } catch (error: any) {
      console.error("FoodIndexTab: Error fetching foods directly:", error);
      setError(error.message || "Failed to fetch food items");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update foods when propFoods changes
  useEffect(() => {
    if (propFoods) {
      setFoods(propFoods);
      setIsLoading(false);
    }
  }, [propFoods]);
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchFoods();
  }, []);
  
  // Apply filters and sorting to food items
  const filteredAndSortedFoods = React.useMemo(() => {
    // First, apply search term filter
    let filtered = foods;
    
    if (searchTerm) {
      filtered = filtered.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Then apply source filter
    if (filterSource !== 'all') {
      filtered = filtered.filter(food => 
        food.source === filterSource
      );
    }
    
    // Finally, sort the filtered results
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'calories') {
        return a.calories - b.calories;
      } else if (sortBy === 'protein') {
        return a.proteins - b.proteins;
      } else {
        return 0;
      }
    });
  }, [foods, searchTerm, filterSource, sortBy]);
  
  // Get unique sources for the filter dropdown
  const uniqueSources = React.useMemo(() => {
    const sources = new Set<string>();
    foods.forEach(food => {
      if (food.source) sources.add(food.source);
    });
    return Array.from(sources);
  }, [foods]);
  
  // Handle food deletion
  const handleDeleteFood = async (id: string) => {
    try {
      const response = await api.delete(`/foods/${id}`);
      if (response.status === 200) {
        // Remove the deleted food from the local state
        setFoods(prevFoods => prevFoods.filter(food => food._id !== id));
      }
    } catch (error: any) {
      console.error("Error deleting food:", error);
      setError(error.message || "Failed to delete food item");
    }
  };
  
  return (
    <div className="food-index-page">
      <div className="filters-container">
        <h3>
          <span className="header-icon">{icons.food}</span>
          Food Index
        </h3>
        <div className="filters">
          {/* Search input */}
          <div className="search-input">
            <input
              type="text"
              placeholder="Search foods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}>
                {icons.close}
              </button>
            )}
          </div>
          
          {/* Source filter */}
          <div>
            <select 
              className="filter-select"
              value={filterSource} 
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">All Sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
          
          {/* Sort by */}
          <div>
            <select 
              className="filter-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="calories">Sort by Calories</option>
              <option value="protein">Sort by Protein</option>
            </select>
          </div>
          
          {/* Refresh button */}
          <button 
            className="refresh-button"
            onClick={async () => {
              setIsLoading(true);
              try {
                await onRefresh();
              } catch (error) {
                console.error("Error refreshing food data:", error);
                setError("Failed to refresh food data");
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            <span className="icon">{icons.refresh}</span>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          
          {/* Add food button */}
          <button 
            className="add-button"
            onClick={() => {
              console.log("Add New Food button clicked in FoodIndexTab");
              console.log("Current timestamp:", new Date().toISOString());
              console.log("Calling onAddFood function...");
              onAddFood();
              console.log("onAddFood function called successfully");
            }}
          >
            <span className="icon">{icons.add}</span>
            Add New Food
          </button>
        </div>
        
        {/* Food count */}
        <div className="food-count">
          {isLoading ? 'Loading...' : `Showing ${filteredAndSortedFoods.length} of ${foods.length} food items`}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
      </div>
      
      {/* Food items grid */}
      {isLoading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading food items...</p>
        </div>
      ) : filteredAndSortedFoods.length === 0 ? (
        <div className="no-data-message">
          {searchTerm || filterSource !== 'all' ? (
            <p>No foods match your search criteria. Try adjusting your filters.</p>
          ) : (
            <>
              <p>Your food index is empty.</p>
              <button 
                className="add-button"
                onClick={onAddFood}
              >
                <span className="icon">{icons.add}</span>
                Add Your First Food
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="food-grid">
          {filteredAndSortedFoods.map(food => (
            <div 
              key={food._id} 
              className="food-card"
            >
              <div className="food-card-header">
                <h3 className="food-card-title">{food.name}</h3>
                <span className="calorie-badge">
                  {Math.round(food.calories)} cal
                </span>
              </div>
              
              <div className="serving-size">
                {food.serving_size} {food.serving_unit}
              </div>
              
              <div className="macros-container">
                <div className="nutrient">
                  <div className="nutrient-value">{food.proteins}g</div>
                  <div className="nutrient-label">
                    <span style={{marginRight: '0.25rem'}}>{icons.protein}</span>
                    Protein
                  </div>
                </div>
                <div className="nutrient">
                  <div className="nutrient-value">{food.carbs}g</div>
                  <div className="nutrient-label">
                    <span style={{marginRight: '0.25rem'}}>{icons.carbs}</span>
                    Carbs
                  </div>
                </div>
                <div className="nutrient">
                  <div className="nutrient-value">{food.fats}g</div>
                  <div className="nutrient-label">
                    <span style={{marginRight: '0.25rem'}}>{icons.fat}</span>
                    Fat
                  </div>
                </div>
                {food.fiber > 0 && (
                  <div className="nutrient">
                    <div className="nutrient-value">{food.fiber}g</div>
                    <div className="nutrient-label">
                      <span style={{marginRight: '0.25rem'}}>{icons.fiber}</span>
                      Fiber
                    </div>
                  </div>
                )}
              </div>
              
              {food.source && (
                <div className="food-source">
                  Source: {food.source}
                </div>
              )}
              
              <div className="card-actions">
                <button 
                  className="edit-button"
                  onClick={() => onEditFood(food._id as string)}
                >
                  <span className="icon">{icons.edit}</span>
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteFood(food._id as string)}
                >
                  <span className="icon">{icons.delete}</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodIndexTab; 