const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getPublicCollections,
  checkRecipeInCollections
} = require('../controllers/collectionController');

// Public routes
router.get('/public', getPublicCollections);

// Protected routes
router.use(protect);

// Collection CRUD routes
router.route('/')
  .get(getCollections)      // Get user's collections
  .post(createCollection);  // Create new collection

router.route('/:id')
  .get(getCollection)       // Get single collection
  .put(updateCollection)    // Update collection
  .delete(deleteCollection); // Delete collection

// Collection recipes management
router.post('/:id/recipes', addRecipeToCollection);              // Add recipe to collection
router.delete('/:id/recipes/:recipeId', removeRecipeFromCollection); // Remove recipe from collection

// Check recipe in collections
router.get('/check/:recipeId', checkRecipeInCollections);        // Check if recipe is in user's collections

module.exports = router;
