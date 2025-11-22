/**
 * Recipe Recommendation Service
 * Provides personalized recipe suggestions based on:
 * - Time of day
 * - User preferences
 * - Dietary restrictions
 * - Past behavior
 * - Trending recipes
 */

const Recipe = require('../models/Recipe');
const User = require('../models/User');

/**
 * Get time-based meal type
 */
function getMealTypeByTime() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  if (hour >= 18 || hour < 5) return 'dinner';
  
  return 'any';
}

/**
 * Calculate recipe score based on multiple factors
 */
function calculateRecipeScore(recipe, userPrefs, timeContext) {
  let score = 0;
  
  // Base popularity score (0-30 points)
  const popularityScore = Math.min((recipe.likes || 0) / 100, 30);
  score += popularityScore;
  
  // Recency score (0-20 points) - newer recipes get bonus
  const daysSinceCreation = (Date.now() - new Date(recipe.createdAt)) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(20 - daysSinceCreation / 30, 0);
  score += recencyScore;
  
  // Time appropriateness (0-50 points)
  const mealType = getMealTypeByTime();
  if (recipe.category?.toLowerCase().includes(mealType)) {
    score += 50;
  } else if (mealType === 'any') {
    score += 25;
  }
  
  // Dietary match (0-40 points)
  if (userPrefs.dietaryPreferences) {
    const { dietTypes, allergies, dislikes } = userPrefs.dietaryPreferences;
    
    // Check diet types
    if (dietTypes && dietTypes.length > 0) {
      const matchesDiet = dietTypes.some(diet => 
        recipe.tags?.some(tag => tag.toLowerCase().includes(diet.toLowerCase()))
      );
      if (matchesDiet) score += 20;
    }
    
    // Penalize for allergens
    if (allergies && allergies.length > 0) {
      const hasAllergen = allergies.some(allergy =>
        recipe.ingredients?.some(ing => 
          ing.toLowerCase().includes(allergy.toLowerCase())
        )
      );
      if (hasAllergen) score -= 100; // Heavy penalty
    }
    
    // Penalize for disliked ingredients
    if (dislikes && dislikes.length > 0) {
      const hasDisliked = dislikes.some(dislike =>
        recipe.ingredients?.some(ing => 
          ing.toLowerCase().includes(dislike.toLowerCase())
        )
      );
      if (hasDisliked) score -= 20;
    }
    
    // Bonus for cuisine preferences
    if (userPrefs.dietaryPreferences.cuisinePreferences) {
      const matchesCuisine = userPrefs.dietaryPreferences.cuisinePreferences.some(cuisine =>
        recipe.cuisine?.toLowerCase().includes(cuisine.toLowerCase())
      );
      if (matchesCuisine) score += 20;
    }
  }
  
  // Cooking time appropriateness (0-20 points)
  const cookTimeMinutes = parseInt(recipe.cookTime) || 30;
  if (mealType === 'snack' && cookTimeMinutes <= 15) {
    score += 20;
  } else if (mealType === 'breakfast' && cookTimeMinutes <= 20) {
    score += 15;
  } else if (mealType === 'lunch' && cookTimeMinutes <= 45) {
    score += 10;
  } else if (mealType === 'dinner' && cookTimeMinutes <= 60) {
    score += 10;
  }
  
  // Difficulty match (0-10 points)
  if (userPrefs.preferredDifficulty) {
    if (recipe.difficulty === userPrefs.preferredDifficulty) {
      score += 10;
    }
  }
  
  return score;
}

/**
 * Get personalized recipe recommendations
 * @param {string} userId - User ID
 * @param {Object} options - Recommendation options
 * @returns {Promise<Array>} Array of recommended recipes
 */
async function getPersonalizedRecommendations(userId, options = {}) {
  try {
    const {
      limit = 10,
      excludeIds = [],
      forceTime = null,
      category = null
    } = options;
    
    // Get user preferences
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Build query
    let query = { _id: { $nin: excludeIds } };
    
    // Add category filter if specified
    if (category) {
      query.category = new RegExp(category, 'i');
    }
    
    // Get pool of recipes
    const recipePool = await Recipe.find(query)
      .limit(limit * 3) // Get more to filter
      .populate('author', 'fullName username avatar')
      .lean();
    
    // Score each recipe
    const scoredRecipes = recipePool.map(recipe => ({
      ...recipe,
      score: calculateRecipeScore(recipe, user, { forceTime })
    }));
    
    // Sort by score and take top N
    const recommendations = scoredRecipes
      .filter(r => r.score > 0) // Filter out negative scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return recommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Get trending recipes
 * @param {Object} options - Options
 * @returns {Promise<Array>} Array of trending recipes
 */
async function getTrendingRecipes(options = {}) {
  try {
    const {
      limit = 10,
      timeWindow = 7 // days
    } = options;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeWindow);
    
    const trending = await Recipe.find({
      createdAt: { $gte: startDate }
    })
      .sort({ likes: -1, views: -1 })
      .limit(limit)
      .populate('author', 'fullName username avatar')
      .lean();
    
    return trending;
  } catch (error) {
    console.error('Error getting trending recipes:', error);
    throw error;
  }
}

/**
 * Get recipe suggestions for specific meal time
 * @param {string} userId - User ID  
 * @param {string} mealType - breakfast, lunch, dinner, snack
 * @param {number} limit - Number of suggestions
 * @returns {Promise<Array>} Array of meal suggestions
 */
async function getMealSuggestions(userId, mealType, limit = 5) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get recipes matching meal type
    const recipes = await Recipe.find({
      $or: [
        { category: new RegExp(mealType, 'i') },
        { tags: new RegExp(mealType, 'i') }
      ]
    })
      .limit(limit * 2)
      .populate('author', 'fullName username avatar')
      .lean();
    
    // Score and sort
    const scored = recipes.map(recipe => ({
      ...recipe,
      score: calculateRecipeScore(recipe, user, { forceTime: mealType })
    }));
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting meal suggestions:', error);
    throw error;
  }
}

/**
 * Get "Cook It Again" suggestions based on user's past recipes
 * @param {string} userId - User ID
 * @param {number} limit - Number of suggestions
 * @returns {Promise<Array>} Array of recipes user has cooked before
 */
async function getCookItAgainSuggestions(userId, limit = 5) {
  try {
    // In production, this would query user's cooking history
    // For now, return user's own recipes
    const recipes = await Recipe.find({ author: userId })
      .sort({ likes: -1 })
      .limit(limit)
      .populate('author', 'fullName username avatar')
      .lean();
    
    return recipes;
  } catch (error) {
    console.error('Error getting cook it again suggestions:', error);
    throw error;
  }
}

/**
 * Get similar recipes to a given recipe
 * @param {string} recipeId - Recipe ID
 * @param {number} limit - Number of similar recipes
 * @returns {Promise<Array>} Array of similar recipes
 */
async function getSimilarRecipes(recipeId, limit = 5) {
  try {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    // Find recipes with similar tags, cuisine, or category
    const similar = await Recipe.find({
      _id: { $ne: recipeId },
      $or: [
        { tags: { $in: recipe.tags || [] } },
        { cuisine: recipe.cuisine },
        { category: recipe.category }
      ]
    })
      .limit(limit)
      .populate('author', 'fullName username avatar')
      .lean();
    
    return similar;
  } catch (error) {
    console.error('Error getting similar recipes:', error);
    throw error;
  }
}

module.exports = {
  getPersonalizedRecommendations,
  getTrendingRecipes,
  getMealSuggestions,
  getCookItAgainSuggestions,
  getSimilarRecipes,
  getMealTypeByTime
};
