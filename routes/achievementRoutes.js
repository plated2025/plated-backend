const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  checkAndAwardAchievements,
  awardXP,
  getAchievementProgress,
  XP_REWARDS
} = require('../services/achievementService');

/**
 * @route   GET /api/achievements
 * @desc    Get user's achievement progress
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const progress = await getAchievementProgress(req.user.id);
    
    res.json({
      status: 'success',
      data: progress
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching achievements',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/achievements/check
 * @desc    Check and award new achievements
 * @access  Private
 */
router.post('/check', protect, async (req, res) => {
  try {
    const newAchievements = await checkAndAwardAchievements(req.user.id);
    
    res.json({
      status: 'success',
      data: {
        newAchievements,
        count: newAchievements.length
      }
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking achievements',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/achievements/xp
 * @desc    Award XP to user
 * @access  Private
 */
router.post('/xp', protect, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid XP amount required'
      });
    }
    
    const result = await awardXP(req.user.id, amount, reason);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Award XP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error awarding XP',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/achievements/rewards
 * @desc    Get XP rewards for different actions
 * @access  Public
 */
router.get('/rewards', (req, res) => {
  res.json({
    status: 'success',
    data: XP_REWARDS
  });
});

module.exports = router;
