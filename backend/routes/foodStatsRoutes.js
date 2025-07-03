/**
 * Food Statistics API Routes
 * Provides endpoints for food statistics
 */

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

/**
 * @route   GET /api/foods/stats
 * @desc    Get food statistics for the user
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    // In a real implementation, we would fetch and calculate statistics from the database
    // For now, we'll return mock data for demonstration
    const stats = {
      total_foods: 142,
      compatible_foods: 98,
      compatibility_percentage: 69,
      recent_conflicts: 5,
      dietary_categories: {
        vegetarian: 84,
        vegan: 56,
        gluten_free: 72,
        dairy_free: 63,
        keto_friendly: 48
      },
      nutrient_averages: {
        calories: 210,
        protein: 12,
        carbs: 24,
        fat: 8,
        fiber: 4
      }
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting food stats:', error);
    res.status(500).json({ error: 'Failed to retrieve food statistics' });
  }
});

module.exports = router;
