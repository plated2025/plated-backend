const Collection = require('../models/Collection');
const Recipe = require('../models/Recipe');

// @desc    Get all collections for current user
// @route   GET /api/collections
// @access  Private
exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.getUserCollections(req.user.id);

    res.status(200).json({
      success: true,
      count: collections.length,
      data: collections
    });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
      error: error.message
    });
  }
};

// @desc    Get single collection
// @route   GET /api/collections/:id
// @access  Private
exports.getCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate({
        path: 'recipes.recipe',
        populate: {
          path: 'creator',
          select: 'name username avatar verified'
        }
      });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Check if user has access (owner or public collection)
    if (collection.user.toString() !== req.user.id && !collection.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this collection'
      });
    }

    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collection',
      error: error.message
    });
  }
};

// @desc    Create new collection
// @route   POST /api/collections
// @access  Private
exports.createCollection = async (req, res) => {
  try {
    const { name, description, icon, color, isPublic } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required'
      });
    }

    // Check if collection with same name already exists for user
    const existingCollection = await Collection.findOne({
      user: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingCollection) {
      return res.status(400).json({
        success: false,
        message: 'Collection with this name already exists'
      });
    }

    // Create collection
    const collection = await Collection.create({
      user: req.user.id,
      name,
      description,
      icon: icon || 'bookmark',
      color: color || 'primary',
      isPublic: isPublic || false
    });

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: collection
    });
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create collection',
      error: error.message
    });
  }
};

// @desc    Update collection
// @route   PUT /api/collections/:id
// @access  Private
exports.updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Check ownership
    if (collection.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this collection'
      });
    }

    // Update fields
    const { name, description, icon, color, isPublic, sortOrder } = req.body;

    if (name) collection.name = name;
    if (description !== undefined) collection.description = description;
    if (icon) collection.icon = icon;
    if (color) collection.color = color;
    if (isPublic !== undefined) collection.isPublic = isPublic;
    if (sortOrder !== undefined) collection.sortOrder = sortOrder;

    await collection.save();

    res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: collection
    });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update collection',
      error: error.message
    });
  }
};

// @desc    Delete collection
// @route   DELETE /api/collections/:id
// @access  Private
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Check ownership
    if (collection.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this collection'
      });
    }

    await collection.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete collection',
      error: error.message
    });
  }
};

// @desc    Add recipe to collection
// @route   POST /api/collections/:id/recipes
// @access  Private
exports.addRecipeToCollection = async (req, res) => {
  try {
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is required'
      });
    }

    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Check ownership
    if (collection.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this collection'
      });
    }

    // Verify recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    // Add recipe to collection
    await collection.addRecipe(recipeId);

    // Update cover image if first recipe
    if (collection.recipes.length === 1) {
      await collection.updateCoverImage();
    }

    const updatedCollection = await Collection.findById(collection._id)
      .populate({
        path: 'recipes.recipe',
        select: 'title image likes'
      });

    res.status(200).json({
      success: true,
      message: 'Recipe added to collection',
      data: updatedCollection
    });
  } catch (error) {
    console.error('Add recipe to collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add recipe to collection',
      error: error.message
    });
  }
};

// @desc    Remove recipe from collection
// @route   DELETE /api/collections/:id/recipes/:recipeId
// @access  Private
exports.removeRecipeFromCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Check ownership
    if (collection.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this collection'
      });
    }

    // Remove recipe
    await collection.removeRecipe(req.params.recipeId);

    // Update cover image if needed
    if (collection.recipes.length > 0) {
      await collection.updateCoverImage();
    } else {
      collection.coverImage = null;
      await collection.save();
    }

    const updatedCollection = await Collection.findById(collection._id)
      .populate({
        path: 'recipes.recipe',
        select: 'title image likes'
      });

    res.status(200).json({
      success: true,
      message: 'Recipe removed from collection',
      data: updatedCollection
    });
  } catch (error) {
    console.error('Remove recipe from collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove recipe from collection',
      error: error.message
    });
  }
};

// @desc    Get public collections (explore)
// @route   GET /api/collections/public
// @access  Public
exports.getPublicCollections = async (req, res) => {
  try {
    const collections = await Collection.getPublicCollections();

    res.status(200).json({
      success: true,
      count: collections.length,
      data: collections
    });
  } catch (error) {
    console.error('Get public collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public collections',
      error: error.message
    });
  }
};

// @desc    Check if recipe is in any collection
// @route   GET /api/collections/check/:recipeId
// @access  Private
exports.checkRecipeInCollections = async (req, res) => {
  try {
    const collections = await Collection.find({
      user: req.user.id,
      'recipes.recipe': req.params.recipeId
    }).select('_id name icon color');

    res.status(200).json({
      success: true,
      data: collections
    });
  } catch (error) {
    console.error('Check recipe in collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check recipe in collections',
      error: error.message
    });
  }
};

module.exports = exports;
