const express = require('express');
const {
  verifyEmail,
  resendVerification,
  setup2FA,
  verify2FA,
  disable2FA,
  blockUser,
  unblockUser,
  getBlockedUsers,
  createReport,
  getMyReports,
  getSecuritySettings
} = require('../controllers/securityController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Email Verification Routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

// 2FA Routes
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);

// Blocking Routes
router.post('/block/:userId', protect, blockUser);
router.delete('/block/:userId', protect, unblockUser);
router.get('/blocked', protect, getBlockedUsers);

// Report Routes
router.post('/report', protect, createReport);
router.get('/reports', protect, getMyReports);

// Security Settings
router.get('/settings', protect, getSecuritySettings);

module.exports = router;
