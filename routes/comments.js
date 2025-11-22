const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRecipeComments,
  addComment,
  updateComment,
  deleteComment,
  toggleCommentLike
} = require('../controllers/commentController');

// Get comments for recipe (public)
router.get('/recipe/:recipeId', getRecipeComments);

// Add comment (protected)
router.post('/', protect, addComment);

// Update/Delete comment (protected)
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

// Like comment (protected)
router.post('/:id/like', protect, toggleCommentLike);

module.exports = router;
