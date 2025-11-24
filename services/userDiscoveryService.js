/**
 * User Discovery Service
 * Algorithm for finding relevant users to follow
 */

const User = require('../models/User');
const Follow = require('../models/Follow');
const Recipe = require('../models/Recipe');

/**
 * Calculate user relevance score
 * @param {Object} user - Target user
 * @param {Object} currentUser - Current logged-in user
 * @param {Object} context - Additional context
 * @returns {number} Relevance score
 */
function calculateUserRelevanceScore(user, currentUser, context = {}) {
  let score = 0;

  // Base activity score (0-30 points)
  const recipeCount = user.recipesCount || 0;
  score += Math.min(recipeCount * 2, 30);

  // Follower count (0-25 points) - popular users
  const followerCount = user.followersCount || 0;
  score += Math.min(followerCount / 10, 25);

  // Engagement score (0-20 points)
  const avgLikes = user.avgRecipeLikes || 0;
  score += Math.min(avgLikes / 5, 20);

  // Verified badge bonus (10 points)
  if (user.verified) {
    score += 10;
  }

  // Creator badge bonus (5 points)
  if (user.userType === 'creator') {
    score += 5;
  }

  // Cuisine match (0-15 points)
  if (currentUser.dietaryPreferences?.cuisinePreferences && user.specialties) {
    const matchingCuisines = currentUser.dietaryPreferences.cuisinePreferences.filter(
      cuisine => user.specialties.includes(cuisine)
    );
    score += matchingCuisines.length * 5;
  }

  // Dietary match (0-10 points)
  if (currentUser.dietaryPreferences?.dietTypes && user.dietaryFocus) {
    const matchingDiets = currentUser.dietaryPreferences.dietTypes.filter(
      diet => user.dietaryFocus.includes(diet)
    );
    score += matchingDiets.length * 5;
  }

  // Mutual connections bonus (0-20 points)
  const mutualCount = context.mutualConnections || 0;
  score += Math.min(mutualCount * 2, 20);

  // Recency bonus (0-10 points) - active users
  if (user.lastActive) {
    const daysSinceActive = (Date.now() - new Date(user.lastActive)) / (1000 * 60 * 60 * 24);
    if (daysSinceActive < 1) score += 10;
    else if (daysSinceActive < 7) score += 5;
    else if (daysSinceActive < 30) score += 2;
  }

  return score;
}

/**
 * Get suggested users to follow
 * @param {string} userId - Current user ID
 * @param {Object} options - Options
 * @returns {Promise<Array>} Array of suggested users
 */
async function getSuggestedUsers(userId, options = {}) {
  try {
    const {
      limit = 10,
      excludeIds = []
    } = options;

    // Get current user
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Get users current user is already following
    const following = await Follow.find({ follower: userId }).select('following');
    const followingIds = following.map(f => f.following.toString());

    // Build exclusion list
    const excludeList = [userId, ...followingIds, ...excludeIds];

    // Get potential users
    const potentialUsers = await User.find({
      _id: { $nin: excludeList },
      isActive: true
    })
      .select('name username avatar bio verified userType followersCount recipesCount')
      .limit(limit * 3) // Get more to filter
      .lean();

    // Get mutual connections for each user
    const usersWithScore = await Promise.all(
      potentialUsers.map(async (user) => {
        // Count mutual connections
        const mutualConnections = await Follow.countDocuments({
          follower: { $in: followingIds },
          following: user._id
        });

        // Get user's recipe stats
        const recipeStats = await Recipe.aggregate([
          { $match: { author: user._id } },
          {
            $group: {
              _id: null,
              avgLikes: { $avg: { $size: '$likes' } },
              count: { $sum: 1 }
            }
          }
        ]);

        const stats = recipeStats[0] || { avgLikes: 0, count: 0 };

        return {
          ...user,
          recipesCount: stats.count,
          avgRecipeLikes: stats.avgLikes,
          mutualConnections,
          score: calculateUserRelevanceScore(
            { ...user, recipesCount: stats.count, avgRecipeLikes: stats.avgLikes },
            currentUser,
            { mutualConnections }
          )
        };
      })
    );

    // Sort by score and return top users
    return usersWithScore
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting suggested users:', error);
    throw error;
  }
}

/**
 * Get trending users (most followed this week)
 * @param {Object} options - Options
 * @returns {Promise<Array>} Array of trending users
 */
async function getTrendingUsers(options = {}) {
  try {
    const { limit = 10, timeWindow = 7 } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeWindow);

    // Get users with most new followers in time window
    const trendingFollows = await Follow.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$following', newFollowers: { $sum: 1 } } },
      { $sort: { newFollowers: -1 } },
      { $limit: limit }
    ]);

    const userIds = trendingFollows.map(f => f._id);

    const users = await User.find({ _id: { $in: userIds } })
      .select('name username avatar bio verified userType followersCount')
      .lean();

    // Merge with follow counts
    return users.map(user => {
      const followData = trendingFollows.find(f => f._id.toString() === user._id.toString());
      return {
        ...user,
        newFollowers: followData?.newFollowers || 0,
        trend: 'up'
      };
    }).sort((a, b) => b.newFollowers - a.newFollowers);
  } catch (error) {
    console.error('Error getting trending users:', error);
    throw error;
  }
}

/**
 * Get users by cuisine specialty
 * @param {string} cuisine - Cuisine type
 * @param {Object} options - Options
 * @returns {Promise<Array>} Array of users specialized in cuisine
 */
async function getUsersByCuisine(cuisine, options = {}) {
  try {
    const { limit = 10 } = options;

    // Find recipes with this cuisine
    const recipes = await Recipe.find({
      cuisine: new RegExp(cuisine, 'i')
    })
      .select('author')
      .lean();

    // Count recipes per author
    const authorCounts = {};
    recipes.forEach(recipe => {
      const authorId = recipe.author.toString();
      authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
    });

    // Get top authors by recipe count
    const topAuthorIds = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const users = await User.find({ _id: { $in: topAuthorIds } })
      .select('name username avatar bio verified userType followersCount')
      .lean();

    return users.map(user => ({
      ...user,
      recipeCount: authorCounts[user._id.toString()],
      specialty: cuisine
    }));
  } catch (error) {
    console.error('Error getting users by cuisine:', error);
    throw error;
  }
}

/**
 * Search users by name or username
 * @param {string} query - Search query
 * @param {Object} options - Options
 * @returns {Promise<Array>} Array of matching users
 */
async function searchUsers(query, options = {}) {
  try {
    const { limit = 20 } = options;

    const users = await User.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { username: new RegExp(query, 'i') },
        { bio: new RegExp(query, 'i') }
      ],
      isActive: true
    })
      .select('name username avatar bio verified userType followersCount')
      .limit(limit)
      .sort({ followersCount: -1 })
      .lean();

    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

module.exports = {
  getSuggestedUsers,
  getTrendingUsers,
  getUsersByCuisine,
  searchUsers,
  calculateUserRelevanceScore
};
