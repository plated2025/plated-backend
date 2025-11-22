const User = require('../models/User');
const { validationResult } = require('express-validator');
const emailService = require('../services/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { fullName, email, password } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Create user (username will be set during onboarding)
    const user = await User.create({
      fullName,
      email,
      password
    });

    // Generate email verification token
    const verificationToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken, fullName);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Continue anyway - user can request new verification email
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          userType: user.userType,
          isVerified: user.isVerified,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          hasSelectedUserType: user.hasSelectedUserType
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Check for user (include password field)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Update last active
    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      status: 'success',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          userType: user.userType,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          hasSelectedUserType: user.hasSelectedUserType,
          subscriptionTier: user.subscriptionTier
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user onboarding status
// @route   PUT /api/auth/onboarding
// @access  Private
exports.updateOnboarding = async (req, res) => {
  try {
    const { hasCompletedOnboarding, hasSelectedUserType, userType, interests } = req.body;

    const updateData = {};
    if (hasCompletedOnboarding !== undefined) updateData.hasCompletedOnboarding = hasCompletedOnboarding;
    if (hasSelectedUserType !== undefined) updateData.hasSelectedUserType = hasSelectedUserType;
    if (userType) updateData.userType = userType;
    if (interests) updateData.interests = interests;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Update onboarding error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating onboarding status',
      error: error.message
    });
  }
};

// @desc    Check if username is available
// @route   GET /api/auth/check-username/:username
// @access  Public
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;

    // Validate username format
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({
        status: 'error',
        message: 'Username must be between 3 and 20 characters',
        available: false
      });
    }

    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      return res.status(400).json({
        status: 'error',
        message: 'Username can only contain lowercase letters, numbers, and underscores',
        available: false
      });
    }

    // Check if username exists
    const userExists = await User.findOne({ username: username.toLowerCase() });

    res.status(200).json({
      status: 'success',
      available: !userExists,
      message: userExists ? 'Username is already taken' : 'Username is available'
    });
  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking username availability',
      available: false
    });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'User logged out successfully'
  });
};
