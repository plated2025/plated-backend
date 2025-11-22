const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateOnboarding,
  logout,
  checkUsernameAvailability
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const passport = require('../config/passport');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.get('/check-username/:username', checkUsernameAvailability);
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/onboarding', protect, updateOnboarding);
router.post('/logout', protect, logout);

// ============================================
// Social Authentication Routes
// ============================================

// Google OAuth Routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=google_auth_failed`
  }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = req.user.getSignedJwtToken();
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=google`);
    } catch (error) {
      console.error('Google callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/login?error=server_error`);
    }
  }
);

// Apple OAuth Routes
router.post('/apple',
  passport.authenticate('apple', { session: false })
);

router.post('/apple/callback',
  passport.authenticate('apple', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=apple_auth_failed`
  }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = req.user.getSignedJwtToken();
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=apple`);
    } catch (error) {
      console.error('Apple callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      res.redirect(`${frontendUrl}/login?error=server_error`);
    }
  }
);

module.exports = router;
