const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');

// @desc    Get all meal plans for user
// @route   GET /api/planner
// @access  Private
exports.getMealPlans = async (req, res) => {
  try {
    const { active, startDate, endDate } = req.query;

    const query = { user: req.user.id };
    
    if (active === 'true') {
      query.isActive = true;
    }

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const mealPlans = await MealPlan.find(query)
      .populate('meals.recipe', 'title image cookTime servings')
      .sort('-startDate');

    res.status(200).json({
      status: 'success',
      data: mealPlans
    });
  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching meal plans',
      error: error.message
    });
  }
};

// @desc    Get single meal plan
// @route   GET /api/planner/:id
// @access  Private
exports.getMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id)
      .populate('meals.recipe', 'title image cookTime servings difficulty nutrition')
      .populate('user', 'fullName username avatar');

    if (!mealPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Meal plan not found'
      });
    }

    // Check if user owns this meal plan or if it's public
    if (mealPlan.user._id.toString() !== req.user.id && !mealPlan.isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this meal plan'
      });
    }

    res.status(200).json({
      status: 'success',
      data: mealPlan
    });
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching meal plan',
      error: error.message
    });
  }
};

// @desc    Create meal plan
// @route   POST /api/planner
// @access  Private
exports.createMealPlan = async (req, res) => {
  try {
    const { title, description, startDate, endDate, meals, tags } = req.body;

    const mealPlan = await MealPlan.create({
      user: req.user.id,
      title,
      description,
      startDate,
      endDate,
      meals: meals || [],
      tags: tags || []
    });

    // Calculate nutrition if meals provided
    if (meals && meals.length > 0) {
      await mealPlan.calculateNutrition();
      await mealPlan.generateShoppingList();
      await mealPlan.save();
    }

    await mealPlan.populate('meals.recipe', 'title image cookTime');

    res.status(201).json({
      status: 'success',
      data: mealPlan
    });
  } catch (error) {
    console.error('Create meal plan error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating meal plan',
      error: error.message
    });
  }
};

// @desc    Update meal plan
// @route   PUT /api/planner/:id
// @access  Private
exports.updateMealPlan = async (req, res) => {
  try {
    let mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Meal plan not found'
      });
    }

    // Make sure user owns meal plan
    if (mealPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this meal plan'
      });
    }

    const { title, description, startDate, endDate, meals, isActive, isPublic, tags } = req.body;

    // Update fields
    if (title) mealPlan.title = title;
    if (description !== undefined) mealPlan.description = description;
    if (startDate) mealPlan.startDate = startDate;
    if (endDate) mealPlan.endDate = endDate;
    if (meals) mealPlan.meals = meals;
    if (isActive !== undefined) mealPlan.isActive = isActive;
    if (isPublic !== undefined) mealPlan.isPublic = isPublic;
    if (tags) mealPlan.tags = tags;

    // Recalculate nutrition and shopping list
    await mealPlan.calculateNutrition();
    await mealPlan.generateShoppingList();
    await mealPlan.save();

    await mealPlan.populate('meals.recipe', 'title image cookTime');

    res.status(200).json({
      status: 'success',
      data: mealPlan
    });
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating meal plan',
      error: error.message
    });
  }
};

// @desc    Delete meal plan
// @route   DELETE /api/planner/:id
// @access  Private
exports.deleteMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Meal plan not found'
      });
    }

    // Make sure user owns meal plan
    if (mealPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this meal plan'
      });
    }

    await mealPlan.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Meal plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting meal plan',
      error: error.message
    });
  }
};

// @desc    Add meal to plan
// @route   POST /api/planner/:id/meals
// @access  Private
exports.addMeal = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Meal plan not found'
      });
    }

    if (mealPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this meal plan'
      });
    }

    const { date, mealType, recipe, servings, notes } = req.body;

    // Get recipe name
    let recipeName = '';
    if (recipe) {
      const recipeDoc = await Recipe.findById(recipe);
      if (recipeDoc) {
        recipeName = recipeDoc.title;
      }
    }

    mealPlan.meals.push({
      date,
      mealType,
      recipe,
      recipeName,
      servings: servings || 1,
      notes
    });

    await mealPlan.calculateNutrition();
    await mealPlan.generateShoppingList();
    await mealPlan.save();

    await mealPlan.populate('meals.recipe', 'title image cookTime');

    res.status(200).json({
      status: 'success',
      data: mealPlan
    });
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding meal',
      error: error.message
    });
  }
};

// @desc    Remove meal from plan
// @route   DELETE /api/planner/:id/meals/:mealId
// @access  Private
exports.removeMeal = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Meal plan not found'
      });
    }

    if (mealPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this meal plan'
      });
    }

    mealPlan.meals = mealPlan.meals.filter(
      meal => meal._id.toString() !== req.params.mealId
    );

    await mealPlan.calculateNutrition();
    await mealPlan.generateShoppingList();
    await mealPlan.save();

    res.status(200).json({
      status: 'success',
      data: mealPlan
    });
  } catch (error) {
    console.error('Remove meal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error removing meal',
      error: error.message
    });
  }
};

// @desc    Update shopping list item
// @route   PUT /api/planner/:id/shopping/:itemId
// @access  Private
exports.updateShoppingItem = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Meal plan not found'
      });
    }

    if (mealPlan.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this meal plan'
      });
    }

    const item = mealPlan.shoppingList.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Shopping list item not found'
      });
    }

    const { isPurchased, category } = req.body;
    if (isPurchased !== undefined) item.isPurchased = isPurchased;
    if (category) item.category = category;

    await mealPlan.save();

    res.status(200).json({
      status: 'success',
      data: mealPlan
    });
  } catch (error) {
    console.error('Update shopping item error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating shopping list item',
      error: error.message
    });
  }
};

// @desc    Get public meal plans
// @route   GET /api/planner/public
// @access  Public
exports.getPublicMealPlans = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const mealPlans = await MealPlan.find({ isPublic: true })
      .populate('user', 'fullName username avatar isVerified')
      .populate('meals.recipe', 'title image')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MealPlan.countDocuments({ isPublic: true });

    res.status(200).json({
      status: 'success',
      data: {
        mealPlans,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get public meal plans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching public meal plans',
      error: error.message
    });
  }
};
