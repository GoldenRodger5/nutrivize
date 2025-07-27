import { useState, useEffect } from 'react';
import api from '../utils/api';
import { LocalStorageCache, CACHE_KEYS, CACHE_TTL, CACHE_VERSION } from '../utils/localStorage';

// Types for the health score data
interface ComponentScores {
  nutrition: number;
  activity: number;
  sleep: number;
  hydration: number;
  metabolic_health: number;
}

interface ImprovementArea {
  area: string;
  score: number;
  recommendations: string[];
}

interface AIInsights {
  short_term_insights: string;
  long_term_recommendations: string;
  nutrition_insights: string;
  lifestyle_insights: string;
  next_steps: string[];
}

export interface EnhancedHealthScore {
  overall_score: number;
  trend: string;
  component_scores: ComponentScores;
  improvement_areas: ImprovementArea[];
  ai_insights: AIInsights;
  last_updated?: string;
}

interface WeightProgress {
  start_weight: number;
  current_weight: number;
  target_weight: number;
  percent_complete: number;
  weight_lost_so_far: string;
  remaining_weight: string;
  current_rate: string;
  weekly_goal: number;
  estimated_completion: string;
}

interface Milestone {
  milestone: string;
  estimated_date: string;
}

interface ProgressAIInsights {
  progress_summary: string;
  achievement_insights: string;
  milestone_projections: Milestone[];
  focus_areas: string[];
}

export interface ProgressAnalytics {
  weight_progress: WeightProgress;
  achievement_rate: number;
  streak_days: number;
  consistency_score: number;
  ai_insights: ProgressAIInsights;
  last_updated?: string;
}

interface AIResponse {
  question: string;
  answer: string;
  generated_at: string;
}

/**
 * Hook to fetch enhanced health score data
 * @returns {Object} Enhanced health score data with AI insights
 */
export function useEnhancedHealthScore() {
  const [enhancedHealthScore, setEnhancedHealthScore] = useState<EnhancedHealthScore | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnhancedHealthScore = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Check localStorage cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedHealthScore = LocalStorageCache.get<EnhancedHealthScore>(
          CACHE_KEYS.AI_INSIGHTS + '_health_score', 
          CACHE_VERSION.CURRENT
        );
        
        if (cachedHealthScore) {
          setEnhancedHealthScore(cachedHealthScore);
          setError(null);
          setLoading(false);
          return;
        }
      }
      
      const response = await api.get('/ai-dashboard/health-score');
      const data = response.data;
      setEnhancedHealthScore(data);
      setError(null);
      
      // Cache with 2-hour TTL (AI insights freshness)
      LocalStorageCache.set(
        CACHE_KEYS.AI_INSIGHTS + '_health_score',
        data,
        CACHE_TTL.AI_INSIGHTS,
        CACHE_VERSION.CURRENT
      );
    } catch (err) {
      console.error('Error fetching enhanced health score:', err);
      setError('Failed to load health score data');
      setEnhancedHealthScore(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshHealthScore = async () => {
    try {
      setLoading(true);
      const response = await api.post('/ai-dashboard/health-score/refresh');
      setEnhancedHealthScore(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error refreshing health score:', err);
      setError('Failed to refresh health score');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnhancedHealthScore();
  }, []);

  return { enhancedHealthScore, loading, error, refreshHealthScore };
}

/**
 * Hook to fetch enhanced progress analytics
 * @returns {Object} Enhanced progress analytics with AI insights
 */
export function useProgressAnalytics() {
  const [progressAnalytics, setProgressAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProgressAnalytics() {
      try {
        setLoading(true);
        const response = await api.get('/ai-dashboard/progress-analytics');
        
        // Ensure we have default values for nested properties to prevent undefined errors
        const data = response.data || {};
        if (!data.weight_progress) {
          data.weight_progress = {
            start_weight: 0,
            current_weight: 0,
            target_weight: 0,
            percent_complete: 0,
            weight_lost: 0,
            remaining_weight: 0,
            current_rate: 0,
            weekly_goal: 1.0,
            estimated_completion: 'Invalid Date'
          };
        }
        
        setProgressAnalytics(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching progress analytics:', err);
        setError('Failed to load progress analytics data');
        
        // Provide default values even when there's an error
        setProgressAnalytics({
          weight_progress: {
            start_weight: 0,
            current_weight: 0,
            target_weight: 0,
            percent_complete: 0,
            weight_lost_so_far: "0 lbs",
            remaining_weight: "0 lbs",
            current_rate: "0 lbs/week",
            weekly_goal: 1.0,
            estimated_completion: 'Invalid Date'
          },
          achievement_rate: 0,
          streak_days: 0,
          consistency_score: 0,
          ai_insights: {
            progress_summary: "No data available",
            achievement_insights: "Start tracking to see insights",
            milestone_projections: [],
            focus_areas: []
          }
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProgressAnalytics();
  }, []);

  return { progressAnalytics, loading, error };
}

/**
 * Hook to ask health-related questions to the AI
 * @returns {Object} Functions to ask questions and get responses
 */
export function useAIHealthChat() {
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = async (question: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/ai-health/ask', { question });
      setResponse(response.data);
      return response.data;
    } catch (err) {
      console.error('Error asking health question:', err);
      setError('Failed to get answer from AI health assistant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { askQuestion, response, loading, error };
}

// Export existing hooks for backward compatibility
export { useHealthScore, useAICoaching, useSmartNutrition } from './useAIDashboard';
