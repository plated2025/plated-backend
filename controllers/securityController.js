const User = require('../models/User');
const Report = require('../models/Report');
const emailService = require('../services/emailService');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

// @desc    Verify email
// @route   GET /api/security/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    // Hash the token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error verifying email'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/security/resend-verification
// @access  Private
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified'
      });
    }

    // Generate new token
    const verificationToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    await emailService.sendVerificationEmail(user.email, verificationToken, user.fullName);

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent!'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error sending verification email'
    });
  }
};

// @desc    Setup 2FA
// @route   POST /api/security/2fa/setup
// @access  Private
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        status: 'error',
        message: '2FA is already enabled'
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Plated (${user.email})`,
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex')
    );

    // Save secret and backup codes (don't enable yet)
    user.twoFactorSecret = secret.base32;
    user.twoFactorBackupCodes = backupCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    );
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      data: {
        secret: secret.base32,
        qrCode,
        backupCodes // Send plain codes to user to save
      }
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error setting up 2FA'
    });
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/security/2fa/verify
// @access  Private
exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        status: 'error',
        message: '2FA is already enabled'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    // Enable 2FA
    user.twoFactorEnabled = true;
    await user.save({ validateBeforeSave: false });

    // Send confirmation email
    await emailService.send2FASetupEmail(user.email, user.fullName);

    res.status(200).json({
      status: 'success',
      message: '2FA enabled successfully!'
    });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error verifying 2FA'
    });
  }
};

// @desc    Disable 2FA
// @route   POST /api/security/2fa/disable
// @access  Private
exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        status: 'error',
        message: '2FA is not enabled'
      });
    }

    // Verify password
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect password'
      });
    }

    // Disable 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error disabling 2FA'
    });
  }
};

// @desc    Block user
// @route   POST /api/security/block/:userId
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const userToBlock = req.params.userId;
    const currentUser = await User.findById(req.user.id);

    if (userToBlock === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot block yourself'
      });
    }

    // Check if already blocked
    if (currentUser.blockedUsers.includes(userToBlock)) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already blocked'
      });
    }

    // Add to blocked list
    currentUser.blockedUsers.push(userToBlock);
    await currentUser.save({ validateBeforeSave: false });

    // Add current user to blocked by list
    await User.findByIdAndUpdate(userToBlock, {
      $addToSet: { blockedBy: req.user.id }
    });

    res.status(200).json({
      status: 'success',
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error blocking user'
    });
  }
};

// @desc    Unblock user
// @route   DELETE /api/security/block/:userId
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const userToUnblock = req.params.userId;
    const currentUser = await User.findById(req.user.id);

    // Remove from blocked list
    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      id => id.toString() !== userToUnblock
    );
    await currentUser.save({ validateBeforeSave: false });

    // Remove from blocked by list
    await User.findByIdAndUpdate(userToUnblock, {
      $pull: { blockedBy: req.user.id }
    });

    res.status(200).json({
      status: 'success',
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error unblocking user'
    });
  }
};

// @desc    Get blocked users
// @route   GET /api/security/blocked
// @access  Private
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blockedUsers', 'fullName username avatar');

    res.status(200).json({
      status: 'success',
      data: user.blockedUsers
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching blocked users'
    });
  }
};

// @desc    Report user/content
// @route   POST /api/security/report
// @access  Private
exports.createReport = async (req, res) => {
  try {
    const { reportType, targetId, reason, description } = req.body;

    // Validate
    if (!['user', 'recipe', 'comment'].includes(reportType)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid report type'
      });
    }

    // Create report
    const reportData = {
      reporter: req.user.id,
      reportType,
      reason,
      description
    };

    // Add target based on type
    if (reportType === 'user') reportData.reportedUser = targetId;
    if (reportType === 'recipe') reportData.reportedRecipe = targetId;
    if (reportType === 'comment') reportData.reportedComment = targetId;

    const report = await Report.create(reportData);

    res.status(201).json({
      status: 'success',
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error submitting report'
    });
  }
};

// @desc    Get user's reports
// @route   GET /api/security/reports
// @access  Private
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user.id })
      .populate('reportedUser', 'fullName username avatar')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching reports'
    });
  }
};

// @desc    Get security settings
// @route   GET /api/security/settings
// @access  Private
exports.getSecuritySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        twoFactorEnabled: user.twoFactorEnabled,
        isVerified: user.isVerified,
        loginAttempts: user.loginAttempts,
        lastLoginIP: user.lastLoginIP,
        lastLoginDevice: user.lastLoginDevice,
        trustedDevices: user.trustedDevices,
        blockedUsersCount: user.blockedUsers.length
      }
    });
  } catch (error) {
    console.error('Get security settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching security settings'
    });
  }
};
