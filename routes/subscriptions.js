const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getPlans,
  getCurrentSubscription,
  createCheckoutSession,
  changeSubscription,
  cancelSubscription,
  reactivateSubscription,
  getBillingHistory,
  handleWebhook
} = require('../controllers/subscriptionController');

// Public routes
router.get('/plans', getPlans);
router.post('/webhook', handleWebhook); // Stripe webhook

// Protected routes
router.use(protect);

router.get('/current', getCurrentSubscription);
router.post('/checkout', createCheckoutSession);
router.put('/change', changeSubscription);
router.post('/cancel', cancelSubscription);
router.post('/reactivate', reactivateSubscription);
router.get('/billing', getBillingHistory);

module.exports = router;
