const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers
} = require('../controllers/userController');

// Search users (public)
router.get('/search', searchUsers);

// Get user profile (public, but shows more if authenticated)
router.get('/profile/:userId', getUserProfile);

// Get followers/following (public)
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Update profile (protected)
router.put('/profile', protect, updateProfile);

// Follow/Unfollow (protected)
router.post('/follow/:userId', protect, followUser);
router.delete('/follow/:userId', protect, unfollowUser);

module.exports = router;
