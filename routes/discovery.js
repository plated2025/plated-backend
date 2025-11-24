const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSuggestedUsers,
  getTrendingUsers,
  getUsersByCuisine,
  searchUsers
} = require('../services/userDiscoveryService');

/**
 * @route   GET /api/discovery/users/suggested
 * @desc    Get suggested users to follow
 * @access  Private
 */
router.get('/users/suggested', protect, async (req, res) => {
  try {
    const { limit } = req.query;
    
    const suggestions = await getSuggestedUsers(req.user.id, {
      limit: parseInt(limit) || 10
    });
    
    res.json({
      status: 'success',
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching suggested users',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/discovery/users/trending
 * @desc    Get trending users
 * @access  Public
 */
router.get('/users/trending', async (req, res) => {
  try {
    const { limit, timeWindow } = req.query;
    
    const trending = await getTrendingUsers({
      limit: parseInt(limit) || 10,
      timeWindow: parseInt(timeWindow) || 7
    });
    
    res.json({
      status: 'success',
      count: trending.length,
      data: trending
    });
  } catch (error) {
    console.error('Get trending users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching trending users',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/discovery/users/cuisine/:cuisine
 * @desc    Get users by cuisine specialty
 * @access  Public
 */
router.get('/users/cuisine/:cuisine', async (req, res) => {
  try {
    const { cuisine } = req.params;
    const { limit } = req.query;
    
    const users = await getUsersByCuisine(cuisine, {
      limit: parseInt(limit) || 10
    });
    
    res.json({
      status: 'success',
      cuisine,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users by cuisine error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/discovery/users/search
 * @desc    Search users
 * @access  Public
 */
router.get('/users/search', async (req, res) => {
  try {
    const { q, limit } = req.query;
    
    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query required'
      });
    }
    
    const users = await searchUsers(q, {
      limit: parseInt(limit) || 20
    });
    
    res.json({
      status: 'success',
      query: q,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching users',
      error: error.message
    });
  }
});

module.exports = router;
