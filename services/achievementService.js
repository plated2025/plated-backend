/**
 * Achievement System Service
 * Tracks and awards achievements based on user actions
 */

const User = require('../models/User');

// Achievement definitions
const ACHIEVEMENTS = {
  // Recipe achievements
  FIRST_RECIPE: {
    id: 'first_recipe',
    title: 'Chef Debut',
    description: 'Post your first recipe',
    icon: 'chef-hat',
    xp: 100,
    condition: (stats) => stats.recipesCount >= 1
  },
  RECIPE_10: {
    id: 'recipe_10',
    title: 'Recipe Collector',
    description: 'Post 10 recipes',
    icon: 'bookmark',
    xp: 500,
    condition: (stats) => stats.recipesCount >= 10
  },
  RECIPE_50: {
    id: 'recipe_50',
    title: 'Master Chef',
    description: 'Post 50 recipes',
    icon: 'trophy',
    xp: 2500,
    condition: (stats) => stats.recipesCount >= 50
  },
  RECIPE_100: {
    id: 'recipe_100',
    title: 'Culinary Legend',
    description: 'Post 100 recipes',
    icon: 'star',
    xp: 10000,
    condition: (stats) => stats.recipesCount >= 100
  },

  // Follower achievements
  FOLLOWERS_100: {
    id: 'followers_100',
    title: 'Rising Star',
    description: 'Reach 100 followers',
    icon: 'users',
    xp: 500,
    condition: (stats) => stats.followersCount >= 100
  },
  FOLLOWERS_1K: {
    id: 'followers_1k',
    title: 'Influencer',
    description: 'Reach 1,000 followers',
    icon: 'trending-up',
    xp: 2500,
    condition: (stats) => stats.followersCount >= 1000
  },
  FOLLOWERS_10K: {
    id: 'followers_10k',
    title: 'Celebrity Chef',
    description: 'Reach 10,000 followers',
    icon: 'award',
    xp: 10000,
    condition: (stats) => stats.followersCount >= 10000
  },

  // Streak achievements
  STREAK_7: {
    id: 'streak_7',
    title: 'Consistent Cook',
    description: '7-day activity streak',
    icon: 'flame',
    xp: 300,
    condition: (stats) => stats.streak >= 7
  },
  STREAK_30: {
    id: 'streak_30',
    title: 'Dedicated Chef',
    description: '30-day activity streak',
    icon: 'zap',
    xp: 1500,
    condition: (stats) => stats.streak >= 30
  },
  STREAK_100: {
    id: 'streak_100',
    title: 'Unstoppable',
    description: '100-day activity streak',
    icon: 'target',
    xp: 5000,
    condition: (stats) => stats.streak >= 100
  },

  // Engagement achievements
  VIEWS_1K: {
    id: 'views_1k',
    title: 'Attention Grabber',
    description: 'Get 1,000 profile views',
    icon: 'eye',
    xp: 500,
    condition: (stats) => stats.profileViews >= 1000
  },
  VIEWS_10K: {
    id: 'views_10k',
    title: 'Viral Chef',
    description: 'Get 10,000 profile views',
    icon: 'trending-up',
    xp: 2500,
    condition: (stats) => stats.profileViews >= 10000
  },

  // Level achievements
  LEVEL_10: {
    id: 'level_10',
    title: 'Experienced',
    description: 'Reach level 10',
    icon: 'arrow-up',
    xp: 0, // No XP for level achievements
    condition: (stats) => stats.level >= 10
  },
  LEVEL_25: {
    id: 'level_25',
    title: 'Expert',
    description: 'Reach level 25',
    icon: 'star',
    xp: 0,
    condition: (stats) => stats.level >= 25
  },
  LEVEL_50: {
    id: 'level_50',
    title: 'Grandmaster',
    description: 'Reach level 50',
    icon: 'crown',
    xp: 0,
    condition: (stats) => stats.level >= 50
  }
};

/**
 * Calculate level from XP
 * Formula: Level = floor(sqrt(XP / 100))
 * Level 1: 100 XP, Level 10: 10,000 XP, Level 50: 250,000 XP
 */
function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100));
}

/**
 * Calculate XP required for next level
 */
function xpForLevel(level) {
  return Math.pow(level + 1, 2) * 100;
}

/**
 * Check and award achievements for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of newly earned achievements
 */
async function checkAndAwardAchievements(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = {
      recipesCount: user.recipesCount || 0,
      followersCount: user.followersCount || 0,
      streak: user.streak || 0,
      profileViews: user.profileViews || 0,
      level: user.level || 0,
      xp: user.xp || 0
    };

    const earnedAchievementIds = user.achievements.map(a => a.id);
    const newAchievements = [];

    // Check each achievement
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      // Skip if already earned
      if (earnedAchievementIds.includes(achievement.id)) {
        continue;
      }

      // Check if condition is met
      if (achievement.condition(stats)) {
        // Award achievement
        user.achievements.push({
          id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          earnedAt: new Date()
        });

        // Add XP
        if (achievement.xp > 0) {
          user.xp += achievement.xp;
        }

        newAchievements.push(achievement);
      }
    }

    // Update level based on new XP
    const newLevel = calculateLevel(user.xp);
    if (newLevel > user.level) {
      user.level = newLevel;
      // Check for level-based achievements
      for (const achievement of Object.values(ACHIEVEMENTS)) {
        if (achievement.id.startsWith('level_') && !earnedAchievementIds.includes(achievement.id)) {
          if (achievement.condition({ ...stats, level: newLevel })) {
            user.achievements.push({
              id: achievement.id,
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              earnedAt: new Date()
            });
            newAchievements.push(achievement);
          }
        }
      }
    }

    // Save user
    await user.save();

    return newAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    throw error;
  }
}

/**
 * Award XP to a user
 * @param {string} userId - User ID
 * @param {number} xp - Amount of XP to award
 * @param {string} reason - Reason for XP award
 * @returns {Promise<Object>} Updated user stats
 */
async function awardXP(userId, xp, reason = 'Activity') {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const oldLevel = user.level || 0;
    user.xp = (user.xp || 0) + xp;
    const newLevel = calculateLevel(user.xp);

    if (newLevel > oldLevel) {
      user.level = newLevel;
    }

    await user.save();

    // Check for new achievements
    const newAchievements = await checkAndAwardAchievements(userId);

    return {
      xp: user.xp,
      level: user.level,
      leveledUp: newLevel > oldLevel,
      newAchievements,
      xpForNextLevel: xpForLevel(newLevel),
      progress: (user.xp - Math.pow(newLevel, 2) * 100) / (Math.pow(newLevel + 1, 2) * 100 - Math.pow(newLevel, 2) * 100)
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    throw error;
  }
}

/**
 * Get user's achievement progress
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Achievement progress data
 */
async function getAchievementProgress(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = {
      recipesCount: user.recipesCount || 0,
      followersCount: user.followersCount || 0,
      streak: user.streak || 0,
      profileViews: user.profileViews || 0,
      level: user.level || 0,
      xp: user.xp || 0
    };

    const earnedIds = user.achievements.map(a => a.id);
    const progress = {};

    // Calculate progress for each achievement
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      const earned = earnedIds.includes(achievement.id);
      progress[achievement.id] = {
        ...achievement,
        earned,
        earnedDate: earned ? user.achievements.find(a => a.id === achievement.id).earnedAt : null
      };
    }

    return {
      stats,
      achievements: progress,
      totalAchievements: Object.keys(ACHIEVEMENTS).length,
      earnedCount: user.achievements.length,
      completionPercentage: (user.achievements.length / Object.keys(ACHIEVEMENTS).length * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    throw error;
  }
}

/**
 * XP Rewards for different actions
 */
const XP_REWARDS = {
  POST_RECIPE: 50,
  POST_REEL: 30,
  RECEIVE_LIKE: 2,
  RECEIVE_COMMENT: 5,
  RECEIVE_SAVE: 10,
  COMPLETE_PROFILE: 100,
  DAILY_LOGIN: 10,
  COMPLETE_MEAL_PLAN: 25
};

module.exports = {
  ACHIEVEMENTS,
  checkAndAwardAchievements,
  awardXP,
  getAchievementProgress,
  calculateLevel,
  xpForLevel,
  XP_REWARDS
};
