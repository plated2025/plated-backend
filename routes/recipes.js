const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { cache } = require('../services/cache');
const {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleLike,
  toggleSave,
  getUserRecipes,
  getSavedRecipes,
  rateRecipe,
  getTrendingRecipes,
  getFeaturedRecipes,
  getTopRatedRecipes
} = require('../controllers/recipeController');

// Special routes (must be before /:id) - with caching
router.get('/trending', cache(300), getTrendingRecipes); // 5 min cache
router.get('/featured', cache(600), getFeaturedRecipes); // 10 min cache
router.get('/top-rated', cache(300), getTopRatedRecipes); // 5 min cache
router.get('/saved/me', protect, getSavedRecipes); // No cache (user-specific)
router.get('/user/:userId', cache(180), getUserRecipes); // 3 min cache

// General routes - with caching
router.get('/', cache(120), getRecipes); // 2 min cache
router.get('/:id', cache(300), getRecipe); // 5 min cache

router.post('/', protect, createRecipe);
router.put('/:id', protect, updateRecipe);
router.delete('/:id', protect, deleteRecipe);

// Recipe interactions
router.post('/:id/like', protect, toggleLike);
router.post('/:id/save', protect, toggleSave);
router.post('/:id/rate', protect, rateRecipe);

module.exports = router;
