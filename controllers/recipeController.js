const Recipe = require('../models/Recipe');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { clearCache } = require('../services/cache');

// @desc    Get all recipes with filters
// @route   GET /api/recipes
// @access  Public
exports.getRecipes = async (req, res) => {
  try {
    const {
      cuisine,
      difficulty,
      category,
      search,
      sort = '-postedAt',
      limit = 20,
      page = 1
    } = req.query;

    // Build query
    const query = { status: 'published' };

    if (cuisine && cuisine !== 'all') {
      query.cuisine = new RegExp(cuisine, 'i');
    }

    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination (optimized with lean)
    const recipes = await Recipe.find(query)
      .select('title description image cuisine category difficulty cookTime servings likes saves views creator postedAt')
      .populate('creator', 'fullName username avatar isVerified')
      .lean() // Convert to plain JavaScript object for better performance
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Recipe.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        recipes,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching recipes',
      error: error.message
    });
  }
};

// @desc    Get single recipe
// @route   GET /api/recipes/:id
// @access  Public
exports.getRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('creator', 'fullName username avatar bio isVerified followersCount');

    if (!recipe) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipe not found'
      });
    }

    // Increment view count
    recipe.views += 1;
    await recipe.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: recipe
    });
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching recipe',
      error: error.message
    });
  }
};

// @desc    Create new recipe
// @route   POST /api/recipes
// @access  Private
exports.createRecipe = async (req, res) => {
  try {
    // Add creator ID to request body
    req.body.creator = req.user.id;

    const recipe = await Recipe.create(req.body);

    // Clear recipe caches to reflect new recipe
    await clearCache('cache:/api/recipes*');

    res.status(201).json({
      status: 'success',
      data: recipe
    });
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating recipe',
      error: error.message
    });
  }
};

// @desc    Update recipe
// @route   PUT /api/recipes/:id
// @access  Private
exports.updateRecipe = async (req, res) => {
  try {
    let recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipe not found'
      });
    }

    // Make sure user is recipe creator
    if (recipe.creator.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this recipe'
      });
    }

    req.body.lastEditedAt = Date.now();

    recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: recipe
    });
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating recipe',
      error: error.message
    });
  }
};

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
// @access  Private
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipe not found'
      });
    }

    // Make sure user is recipe creator
    if (recipe.creator.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this recipe'
      });
    }

    await recipe.deleteOne();

    // Decrement user's recipe count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { recipesCount: -1 }
    });

    res.status(200).json({
      status: 'success',
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting recipe',
      error: error.message
    });
  }
};

// @desc    Like/Unlike recipe
// @route   POST /api/recipes/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipe not found'
      });
    }

    const isLiked = recipe.likesUsers.includes(req.user.id);

    if (isLiked) {
      // Unlike
      recipe.likesUsers = recipe.likesUsers.filter(
        userId => userId.toString() !== req.user.id
      );
      recipe.likes -= 1;
    } else {
      // Like
      recipe.likesUsers.push(req.user.id);
      recipe.likes += 1;
      
      // Create notification for recipe creator (if not liking own recipe)
      if (recipe.creator.toString() !== req.user.id) {
        await createNotification(
          recipe.creator,
          req.user.id,
          'like',
          'New Like',
          `${req.user.fullName} liked your recipe "${recipe.title}"`,
          { recipeId: recipe._id, link: `/recipe/${recipe._id}` }
        );
      }
    }

    await recipe.save();

    res.status(200).json({
      status: 'success',
      data: {
        isLiked: !isLiked,
        likes: recipe.likes
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error toggling like',
      error: error.message
    });
  }
};

// @desc    Save/Unsave recipe
// @route   POST /api/recipes/:id/save
// @access  Private
exports.toggleSave = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipe not found'
      });
    }

    const isSaved = recipe.savesUsers.includes(req.user.id);

    if (isSaved) {
      // Unsave
      recipe.savesUsers = recipe.savesUsers.filter(
        userId => userId.toString() !== req.user.id
      );
      recipe.saves -= 1;
    } else {
      // Save
      recipe.savesUsers.push(req.user.id);
      recipe.saves += 1;
    }

    await recipe.save();

    res.status(200).json({
      status: 'success',
      data: {
        isSaved: !isSaved,
        saves: recipe.saves
      }
    });
  } catch (error) {
    console.error('Toggle save error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error toggling save',
      error: error.message
    });
  }
};

// @desc    Get user's recipes
// @route   GET /api/recipes/user/:userId
// @access  Public
exports.getUserRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      creator: req.params.userId,
      status: 'published'
    })
      .populate('creator', 'fullName username avatar')
      .sort('-postedAt');

    res.status(200).json({
      status: 'success',
      data: recipes
    });
  } catch (error) {
    console.error('Get user recipes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user recipes',
      error: error.message
    });
  }
};

// @desc    Get saved recipes
// @route   GET /api/recipes/saved/me
// @access  Private
exports.getSavedRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({
      savesUsers: req.user.id
    })
      .populate('creator', 'fullName username avatar')
      .sort('-postedAt');

    res.status(200).json({
      status: 'success',
      data: recipes
    });
  } catch (error) {
    console.error('Get saved recipes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching saved recipes',
      error: error.message
    });
  }
};

// @desc    Rate recipe
// @route   POST /api/recipes/:id/rate
// @access  Private
exports.rateRecipe = async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        status: 'error',
        message: 'Recipe not found'
      });
    }

    // Check if user already rated
    const existingRatingIndex = recipe.ratings.findIndex(
      r => r.user.toString() === req.user.id
    );

    if (existingRatingIndex > -1) {
      // Update existing rating
      recipe.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      recipe.ratings.push({
        user: req.user.id,
        rating
      });
    }

    // Recalculate average rating
    const totalRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0);
    recipe.averageRating = totalRating / recipe.ratings.length;
    recipe.ratingsCount = recipe.ratings.length;

    await recipe.save();

    res.status(200).json({
      status: 'success',
      data: {
        averageRating: recipe.averageRating,
        ratingsCount: recipe.ratingsCount,
        userRating: rating
      }
    });
  } catch (error) {
    console.error('Rate recipe error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error rating recipe',
      error: error.message
    });
  }
};

// @desc    Get trending recipes
// @route   GET /api/recipes/trending
// @access  Public
exports.getTrendingRecipes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Calculate trending score based on recent engagement
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recipes = await Recipe.find({
      status: 'published',
      postedAt: { $gte: sevenDaysAgo }
    })
      .populate('creator', 'fullName username avatar isVerified')
      .sort({ likes: -1, views: -1, saves: -1, commentsCount: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: recipes
    });
  } catch (error) {
    console.error('Get trending recipes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching trending recipes',
      error: error.message
    });
  }
};

// @desc    Get featured recipes (editor's choice)
// @route   GET /api/recipes/featured
// @access  Public
exports.getFeaturedRecipes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recipes = await Recipe.find({
      status: 'published',
      isFeatured: true
    })
      .populate('creator', 'fullName username avatar isVerified')
      .sort('-postedAt')
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: recipes
    });
  } catch (error) {
    console.error('Get featured recipes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching featured recipes',
      error: error.message
    });
  }
};

// @desc    Get top rated recipes
// @route   GET /api/recipes/top-rated
// @access  Public
exports.getTopRatedRecipes = async (req, res) => {
  try {
    const { limit = 10, minRatings = 5 } = req.query;

    const recipes = await Recipe.find({
      status: 'published',
      ratingsCount: { $gte: parseInt(minRatings) }
    })
      .populate('creator', 'fullName username avatar isVerified')
      .sort('-averageRating -ratingsCount')
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: recipes
    });
  } catch (error) {
    console.error('Get top rated recipes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching top rated recipes',
      error: error.message
    });
  }
};
