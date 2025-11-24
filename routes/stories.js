const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createStory,
  getStories,
  getUserStories,
  getStory,
  deleteStory,
  likeStory,
  getStoryViews
} = require('../controllers/storyController');

// All routes are protected
router.use(protect);

// Story CRUD routes
router.route('/')
  .get(getStories)      // Get all stories from following users
  .post(createStory);   // Create new story (with file upload)

router.route('/:id')
  .get(getStory)        // Get single story (auto-adds view)
  .delete(deleteStory); // Delete story

// Story interactions
router.post('/:id/like', likeStory);          // Like/unlike story
router.get('/:id/views', getStoryViews);       // Get story views (owner only)

// User stories
router.get('/user/:userId', getUserStories);   // Get specific user's stories

module.exports = router;
