const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPersonalizedRecommendations,
  getTrendingRecipes,
  getMealSuggestions,
  getCookItAgainSuggestions,
  getSimilarRecipes,
  getMealTypeByTime
} = require('../services/recommendationService');

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized recipe recommendations
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { limit, category } = req.query;
    
    const recommendations = await getPersonalizedRecommendations(req.user.id, {
      limit: parseInt(limit) || 10,
      category
    });
    
    res.json({
      status: 'success',
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/trending
 * @desc    Get trending recipes
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit, timeWindow } = req.query;
    
    const trending = await getTrendingRecipes({
      limit: parseInt(limit) || 10,
      timeWindow: parseInt(timeWindow) || 7
    });
    
    res.json({
      status: 'success',
      count: trending.length,
      data: trending
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching trending recipes',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/meal/:mealType
 * @desc    Get meal suggestions for specific meal type
 * @access  Private
 */
router.get('/meal/:mealType', protect, async (req, res) => {
  try {
    const { mealType } = req.params;
    const { limit } = req.query;
    
    const suggestions = await getMealSuggestions(
      req.user.id,
      mealType,
      parseInt(limit) || 5
    );
    
    res.json({
      status: 'success',
      mealType,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Get meal suggestions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching meal suggestions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/now
 * @desc    Get meal suggestions for current time
 * @access  Private
 */
router.get('/now', protect, async (req, res) => {
  try {
    const { limit } = req.query;
    const mealType = getMealTypeByTime();
    
    const suggestions = await getMealSuggestions(
      req.user.id,
      mealType,
      parseInt(limit) || 5
    );
    
    res.json({
      status: 'success',
      mealType,
      currentTime: new Date().toLocaleTimeString(),
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Get current meal suggestions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/cook-again
 * @desc    Get "Cook It Again" suggestions
 * @access  Private
 */
router.get('/cook-again', protect, async (req, res) => {
  try {
    const { limit } = req.query;
    
    const suggestions = await getCookItAgainSuggestions(
      req.user.id,
      parseInt(limit) || 5
    );
    
    res.json({
      status: 'success',
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Get cook again suggestions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/recommendations/similar/:recipeId
 * @desc    Get similar recipes
 * @access  Public
 */
router.get('/similar/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { limit } = req.query;
    
    const similar = await getSimilarRecipes(
      recipeId,
      parseInt(limit) || 5
    );
    
    res.json({
      status: 'success',
      count: similar.length,
      data: similar
    });
  } catch (error) {
    console.error('Get similar recipes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching similar recipes',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/recommendations/weather
 * @desc    Get weather-based recipe recommendations
 * @access  Private
 */
router.post('/weather', protect, async (req, res) => {
  try {
    const { weather, limit } = req.body;
    
    if (!weather || !weather.temp) {
      return res.status(400).json({
        status: 'error',
        message: 'Weather data required (temp, condition)'
      });
    }

    const Recipe = require('../models/Recipe');
    
    // Determine recipe type based on weather
    let searchTags = [];
    let searchCategory = null;
    
    if (weather.isCold || weather.temp < 10) {
      searchTags = ['soup', 'stew', 'hot', 'warm', 'comfort'];
      searchCategory = 'warm';
    } else if (weather.isHot || weather.temp > 25) {
      searchTags = ['salad', 'cold', 'fresh', 'light', 'summer'];
      searchCategory = 'light';
    } else if (weather.isRainy) {
      searchTags = ['comfort', 'cozy', 'warm', 'hearty'];
    } else {
      searchTags = ['balanced', 'healthy', 'fresh'];
    }

    // Build query
    const query = {
      $or: [
        { tags: { $in: searchTags } },
        { description: { $regex: searchTags.join('|'), $options: 'i' } }
      ]
    };

    if (searchCategory) {
      query.category = new RegExp(searchCategory, 'i');
    }

    const recommendations = await Recipe.find(query)
      .limit(parseInt(limit) || 10)
      .sort({ likes: -1 })
      .populate('author', 'name username avatar verified')
      .lean();
    
    res.json({
      status: 'success',
      weather: {
        temp: weather.temp,
        condition: weather.condition,
        description: weather.description
      },
      count: recommendations.length,
      data: recommendations
    });
  } catch (error) {
    console.error('Get weather recommendations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching weather recommendations',
      error: error.message
    });
  }
});

module.exports = router;
