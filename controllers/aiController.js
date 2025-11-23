const aiService = require('../services/aiService');

// @desc    Generate recipe suggestions from ingredients
// @route   POST /api/ai/generate-recipes
// @access  Private
exports.generateRecipes = async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide at least one ingredient'
      });
    }

    const recipes = await aiService.generateRecipes(ingredients);

    res.status(200).json({
      status: 'success',
      data: recipes
    });
  } catch (error) {
    console.error('Generate recipes error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate recipes. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Analyze food image and detect ingredients
// @route   POST /api/ai/scan-food
// @access  Private
exports.scanFood = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an image'
      });
    }

    const analysis = await aiService.analyzeFoodImage(image);

    res.status(200).json({
      status: 'success',
      data: analysis
    });
  } catch (error) {
    console.error('Scan food error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze image. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Analyze product and provide nutrition insights
// @route   POST /api/ai/analyze-product
// @access  Private
exports.analyzeProduct = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a product image'
      });
    }

    const analysis = await aiService.analyzeProduct(image);

    res.status(200).json({
      status: 'success',
      data: analysis
    });
  } catch (error) {
    console.error('Analyze product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze product. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get cooking advice from AI
// @route   POST /api/ai/cooking-advice
// @access  Private
exports.getCookingAdvice = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a question'
      });
    }

    const advice = await aiService.getCookingAdvice(query);

    res.status(200).json({
      status: 'success',
      data: { advice }
    });
  } catch (error) {
    console.error('Get cooking advice error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cooking advice. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
