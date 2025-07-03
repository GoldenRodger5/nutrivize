import { useState, useEffect } from 'react';
import api from '../utils/api';

interface TodayActivity {
  foods_logged: number;
  meals_planned: number;
  ai_chats: number;
  water_logged: number;
  last_updated?: string;
}

export function useTodayActivity() {
  const [activity, setActivity] = useState<TodayActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTodayActivity() {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Fetch today's activity data in parallel
        const [foodLogsRes, waterLogsRes] = await Promise.allSettled([
          api.get(`/food-logs/daily/${today}`),
          api.get(`/water-logs/?date=${today}`)
        ]);

        // Count food logs - the daily endpoint returns DailyNutritionSummary with meals array
        const foodsLogged = foodLogsRes.status === 'fulfilled' ? foodLogsRes.value.data.meals?.length || 0 : 0;
        
        // Count water logs
        const waterLogged = waterLogsRes.status === 'fulfilled' ? waterLogsRes.value.data.length : 0;

        setActivity({
          foods_logged: foodsLogged,
          meals_planned: 0, // TODO: Implement meal planning tracking
          ai_chats: 0, // TODO: Implement AI chat tracking
          water_logged: waterLogged,
          last_updated: new Date().toISOString()
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching today activity:', err);
        setError('Failed to load today\'s activity data');
        setActivity(null);
      } finally {
        setLoading(false);
      }
    }

    fetchTodayActivity();
  }, []);

  return { activity, loading, error };
}
