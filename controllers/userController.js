const User = require('../models/User');
const Follow = require('../models/Follow');
const Recipe = require('../models/Recipe');
const { createNotification } = require('./notificationController');

// @desc    Get user profile
// @route   GET /api/users/profile/:userId
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get user's recipes count
    const recipesCount = await Recipe.countDocuments({
      creator: user._id,
      status: 'published'
    });

    // Check if current user follows this profile (if authenticated)
    let isFollowing = false;
    if (req.user) {
      const followRelation = await Follow.findOne({
        follower: req.user.id,
        following: user._id
      });
      isFollowing = !!followRelation;
    }

    res.status(200).json({
      status: 'success',
      data: {
        ...user.toObject(),
        recipesCount,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      username,
      bio,
      location,
      website,
      avatar,
      coverImage,
      dietaryPreferences,
      settings
    } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (avatar) updateData.avatar = avatar;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (dietaryPreferences) updateData.dietaryPreferences = dietaryPreferences;
    if (settings) updateData.settings = settings;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Follow user
// @route   POST /api/users/follow/:userId
// @access  Private
exports.followUser = async (req, res) => {
  try {
    const userToFollow = req.params.userId;

    // Can't follow yourself
    if (userToFollow === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot follow yourself'
      });
    }

    // Check if user exists
    const user = await User.findById(userToFollow);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: userToFollow
    });

    if (existingFollow) {
      return res.status(400).json({
        status: 'error',
        message: 'Already following this user'
      });
    }

    // Create follow relationship
    await Follow.create({
      follower: req.user.id,
      following: userToFollow
    });

    // Send notification to the followed user
    await createNotification(
      userToFollow,
      req.user.id,
      'follow',
      'New Follower',
      `${req.user.fullName} started following you`,
      { link: `/profile/${req.user.id}` }
    );

    res.status(200).json({
      status: 'success',
      message: 'User followed successfully'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error following user',
      error: error.message
    });
  }
};

// @desc    Unfollow user
// @route   DELETE /api/users/follow/:userId
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = req.params.userId;

    const follow = await Follow.findOneAndDelete({
      follower: req.user.id,
      following: userToUnfollow
    });

    if (!follow) {
      return res.status(404).json({
        status: 'error',
        message: 'You are not following this user'
      });
    }

    // Update counts
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { followingCount: -1 }
    });
    await User.findByIdAndUpdate(userToUnfollow, {
      $inc: { followersCount: -1 }
    });

    res.status(200).json({
      status: 'success',
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error unfollowing user',
      error: error.message
    });
  }
};

// @desc    Get user's followers
// @route   GET /api/users/:userId/followers
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.params.userId })
      .populate('follower', 'fullName username avatar bio followersCount')
      .sort('-createdAt');

    const followers = follows.map(f => f.follower);

    res.status(200).json({
      status: 'success',
      data: followers
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching followers',
      error: error.message
    });
  }
};

// @desc    Get user's following
// @route   GET /api/users/:userId/following
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.params.userId })
      .populate('following', 'fullName username avatar bio followersCount')
      .sort('-createdAt');

    const following = follows.map(f => f.following);

    res.status(200).json({
      status: 'success',
      data: following
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching following',
      error: error.message
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { fullName: new RegExp(q, 'i') },
        { username: new RegExp(q, 'i') }
      ],
      isActive: true
    })
      .select('fullName username avatar bio userType isVerified followersCount')
      .limit(limit * 1);

    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching users',
      error: error.message
    });
  }
};
