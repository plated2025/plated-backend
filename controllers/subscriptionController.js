const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Subscription plans configuration
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    interval: 'month',
    features: [
      '10 recipes',
      '1 meal plan',
      'Up to 100 followers',
      'Basic features'
    ]
  },
  basic: {
    name: 'Basic',
    price: 4.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_BASIC,
    features: [
      '50 recipes',
      '5 meal plans',
      'Up to 500 followers',
      'Create groups',
      'Ad-free experience'
    ]
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM,
    features: [
      '200 recipes',
      '20 meal plans',
      'Up to 2000 followers',
      'Live streaming',
      'Monetization',
      'Analytics dashboard',
      'Ad-free experience'
    ]
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    features: [
      'Unlimited recipes',
      'Unlimited meal plans',
      'Unlimited followers',
      'All Premium features',
      'Priority support',
      'Custom branding',
      'Advanced analytics'
    ]
  }
};

// @desc    Get all subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
exports.getPlans = async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: PLANS
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching plans',
      error: error.message
    });
  }
};

// @desc    Get user's current subscription
// @route   GET /api/subscriptions/current
// @access  Private
exports.getCurrentSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ user: req.user.id });

    // Create free subscription if doesn't exist
    if (!subscription) {
      subscription = await Subscription.create({
        user: req.user.id,
        plan: 'free',
        status: 'active'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        planDetails: PLANS[subscription.plan]
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching subscription',
      error: error.message
    });
  }
};

// @desc    Create checkout session (Stripe)
// @route   POST /api/subscriptions/checkout
// @access  Private
exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['basic', 'premium', 'pro'].includes(plan)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid plan selected'
      });
    }

    const planDetails = PLANS[plan];

    // TODO: Integrate with Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({
    //   customer_email: req.user.email,
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price: planDetails.stripePriceId,
    //     quantity: 1,
    //   }],
    //   mode: 'subscription',
    //   success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
    //   metadata: {
    //     userId: req.user.id,
    //     plan: plan
    //   }
    // });

    // For now, return mock session
    res.status(200).json({
      status: 'success',
      message: 'Stripe integration pending',
      data: {
        plan,
        price: planDetails.price,
        // sessionId: session.id,
        // checkoutUrl: session.url
        mockCheckoutUrl: `${process.env.CLIENT_URL}/subscription/checkout?plan=${plan}`
      }
    });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating checkout session',
      error: error.message
    });
  }
};

// @desc    Upgrade/Downgrade subscription
// @route   PUT /api/subscriptions/change
// @access  Private
exports.changeSubscription = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['free', 'basic', 'premium', 'pro'].includes(plan)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid plan'
      });
    }

    let subscription = await Subscription.findOne({ user: req.user.id });

    if (!subscription) {
      subscription = await Subscription.create({
        user: req.user.id,
        plan,
        status: 'active'
      });
    } else {
      subscription.plan = plan;
      subscription.status = 'active';
      await subscription.save();
    }

    // Update user's subscription field
    await User.findByIdAndUpdate(req.user.id, {
      subscription: plan
    });

    res.status(200).json({
      status: 'success',
      message: `Subscription changed to ${plan}`,
      data: subscription
    });
  } catch (error) {
    console.error('Change subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error changing subscription',
      error: error.message
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscriptions/cancel
// @access  Private
exports.cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'No subscription found'
      });
    }

    if (subscription.plan === 'free') {
      return res.status(400).json({
        status: 'error',
        message: 'Free plan cannot be canceled'
      });
    }

    // TODO: Cancel in Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    //   cancel_at_period_end: true
    // });

    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = Date.now();
    await subscription.save();

    res.status(200).json({
      status: 'success',
      message: 'Subscription will be canceled at the end of the billing period',
      data: subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error canceling subscription',
      error: error.message
    });
  }
};

// @desc    Reactivate canceled subscription
// @route   POST /api/subscriptions/reactivate
// @access  Private
exports.reactivateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'No subscription found'
      });
    }

    if (!subscription.cancelAtPeriodEnd) {
      return res.status(400).json({
        status: 'error',
        message: 'Subscription is not canceled'
      });
    }

    // TODO: Reactivate in Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    //   cancel_at_period_end: false
    // });

    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    await subscription.save();

    res.status(200).json({
      status: 'success',
      message: 'Subscription reactivated',
      data: subscription
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error reactivating subscription',
      error: error.message
    });
  }
};

// @desc    Get billing history
// @route   GET /api/subscriptions/billing
// @access  Private
exports.getBillingHistory = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id });

    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'No subscription found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: subscription.billingHistory || []
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching billing history',
      error: error.message
    });
  }
};

// @desc    Webhook handler for Stripe events
// @route   POST /api/subscriptions/webhook
// @access  Public (Stripe only)
exports.handleWebhook = async (req, res) => {
  try {
    // TODO: Implement Stripe webhook handling
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(
    //   req.body,
    //   sig,
    //   process.env.STRIPE_WEBHOOK_SECRET
    // );

    // Handle different event types
    // switch (event.type) {
    //   case 'checkout.session.completed':
    //   case 'customer.subscription.updated':
    //   case 'customer.subscription.deleted':
    //   case 'invoice.payment_succeeded':
    //   case 'invoice.payment_failed':
    //     ...handle events
    // }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Webhook error',
      error: error.message
    });
  }
};
