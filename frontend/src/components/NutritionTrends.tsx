import React, { useState, useEffect } from 'react';

interface NutritionDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  completed_meals: number;
  water_intake: number;
  activity_level: string;
}

interface NutritionSummary {
  average_calories: number;
  average_protein: number;
  average_carbs: number;
  average_fat: number;
  average_fiber: number;
  total_days: number;
}

interface NutritionApiResponse {
  data: NutritionDataPoint[];
  summary: NutritionSummary;
}

interface NutritionTrendsProps {
  userId: string;
  days?: number;
}

const NutritionTrends = ({ userId, days = 7 }: NutritionTrendsProps) => {
  const [nutritionData, setNutritionData] = useState<NutritionDataPoint[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNutritionData();
  }, [userId, days]);

  const fetchNutritionData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range (last N days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days + 1); // Include today
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Try the nutrition endpoint directly without /api prefix
      const response = await fetch(
        `/nutrition/aggregates?user_id=${userId}&start_date=${startDateStr}&end_date=${endDateStr}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition data');
      }
      
      const responseData = await response.json() as NutritionApiResponse;
      
      setNutritionData(responseData.data);
      setSummary(responseData.summary);
      setError('');
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setError('Error fetching nutrition data');
    } finally {
      setLoading(false);
    }
  };

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Check if we have data
  const hasData = nutritionData.length > 0;

  return (
    <div className="nutrition-trends" style={{ padding: '20px', backgroundColor: '#f5f7fa', borderRadius: '8px' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Nutrition Trends (Last {days} Days)</h2>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading nutrition data...</div>
          <div style={{ width: '40px', height: '40px', margin: '0 auto', border: '5px solid #f3f3f3', borderTop: '5px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : error ? (
        <div style={{ color: '#e74c3c', padding: '20px', backgroundColor: '#fadbd8', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      ) : !hasData ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#eaeded', borderRadius: '8px' }}>
          <div style={{ fontSize: '24px', marginBottom: '15px', color: '#2c3e50' }}>No Nutrition Data Available</div>
          <div style={{ fontSize: '16px', color: '#7f8c8d', marginBottom: '20px' }}>
            Start logging your meals to see your nutrition trends and progress over time.
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Calories</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e67e22' }}>--</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Protein</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>--g</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Carbs</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2980b9' }}>--g</div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Fat</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>--g</div>
            </div>
          </div>
          <div style={{ 
            height: '200px', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>Daily Calories Chart</div>
              <div>Log meals to see your calorie trends</div>
            </div>
          </div>
          <div style={{ 
            height: '200px', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>Macronutrient Breakdown</div>
              <div>Track your protein, carbs, and fat intake</div>
            </div>
          </div>
          <button 
            onClick={fetchNutritionData} 
            style={{ 
              marginTop: '20px', 
              padding: '10px 20px', 
              backgroundColor: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Start Logging Meals
          </button>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          {summary && (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px', 
              marginBottom: '30px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>Summary</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' }}>
                <div style={{ flex: '1 1 150px', textAlign: 'center', padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Avg. Calories</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e67e22' }}>{summary.average_calories}</div>
                </div>
                <div style={{ flex: '1 1 150px', textAlign: 'center', padding: '15px', backgroundColor: '#f0f9eb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Avg. Protein</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>{summary.average_protein}g</div>
                </div>
                <div style={{ flex: '1 1 150px', textAlign: 'center', padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Avg. Carbs</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2980b9' }}>{summary.average_carbs}g</div>
                </div>
                <div style={{ flex: '1 1 150px', textAlign: 'center', padding: '15px', backgroundColor: '#fef9e7', borderRadius: '6px' }}>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Avg. Fat</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>{summary.average_fat}g</div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Calorie Chart */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '30px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Daily Calories</h3>
            <div style={{ 
              display: 'flex', 
              height: '250px', 
              alignItems: 'flex-end', 
              justifyContent: 'space-around',
              gap: '10px',
              marginBottom: '20px'
            }}>
              {nutritionData
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((data) => (
                  <div key={data.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1' }}>
                    <div style={{ 
                      height: `${Math.min((data.calories / 3000) * 200, 200)}px`, 
                      width: '40px', 
                      backgroundColor: '#e67e22',
                      borderRadius: '4px 4px 0 0',
                      position: 'relative',
                      transition: 'height 0.3s ease'
                    }}>
                      <div style={{ 
                        position: 'absolute', 
                        top: '-25px', 
                        width: '100%', 
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {data.calories}
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#7f8c8d' }}>
                      {formatDate(data.date)}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Macronutrient Breakdown */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>Macronutrient Breakdown</h3>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '20px'
            }}>
              {nutritionData
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((data) => (
                  <div key={data.date} style={{ display: 'flex', alignItems: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ width: '100px', fontWeight: 'bold', fontSize: '14px' }}>
                      {formatDate(data.date)}
                    </div>
                    <div style={{ flex: 1, display: 'flex', height: '25px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${(data.protein / (data.protein + data.carbs + data.fat)) * 100}%`, 
                          backgroundColor: '#27ae60',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {data.protein}g
                      </div>
                      <div 
                        style={{ 
                          width: `${(data.carbs / (data.protein + data.carbs + data.fat)) * 100}%`, 
                          backgroundColor: '#2980b9',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {data.carbs}g
                      </div>
                      <div 
                        style={{ 
                          width: `${(data.fat / (data.protein + data.carbs + data.fat)) * 100}%`, 
                          backgroundColor: '#f39c12',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                      >
                        {data.fat}g
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: '20px',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '15px', height: '15px', backgroundColor: '#27ae60', borderRadius: '3px' }}></div>
                <span>Protein</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '15px', height: '15px', backgroundColor: '#2980b9', borderRadius: '3px' }}></div>
                <span>Carbs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '15px', height: '15px', backgroundColor: '#f39c12', borderRadius: '3px' }}></div>
                <span>Fat</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {hasData && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={fetchNutritionData} 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: loading ? '#bdc3c7' : '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s ease'
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NutritionTrends; 