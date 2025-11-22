const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMealPlans,
  getMealPlan,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  addMeal,
  removeMeal,
  updateShoppingItem,
  getPublicMealPlans
} = require('../controllers/mealPlanController');

// Public routes
router.get('/public', getPublicMealPlans);

// Protected routes
router.use(protect);

router.route('/')
  .get(getMealPlans)
  .post(createMealPlan);

router.route('/:id')
  .get(getMealPlan)
  .put(updateMealPlan)
  .delete(deleteMealPlan);

router.post('/:id/meals', addMeal);
router.delete('/:id/meals/:mealId', removeMeal);
router.put('/:id/shopping/:itemId', updateShoppingItem);

module.exports = router;
