const express = require('express');
const {
  generateRecipes,
  scanFood,
  analyzeProduct,
  getCookingAdvice
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// AI Routes
router.post('/generate-recipes', generateRecipes);
router.post('/scan-food', scanFood);
router.post('/analyze-product', analyzeProduct);
router.post('/cooking-advice', getCookingAdvice);

module.exports = router;
