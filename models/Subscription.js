const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  plan: {
    type: String,
    required: true,
    enum: ['free', 'basic', 'premium', 'pro'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'],
    default: 'active'
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true
  },
  stripeSubscriptionId: {
    type: String,
    unique: true,
    sparse: true
  },
  stripePriceId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: Date,
  trialStart: Date,
  trialEnd: Date,
  features: {
    maxRecipes: {
      type: Number,
      default: 10 // Free tier
    },
    maxMealPlans: {
      type: Number,
      default: 1
    },
    maxFollowers: {
      type: Number,
      default: 100
    },
    canCreateGroups: {
      type: Boolean,
      default: false
    },
    canLiveStream: {
      type: Boolean,
      default: false
    },
    canMonetize: {
      type: Boolean,
      default: false
    },
    adFree: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    }
  },
  billingHistory: [{
    amount: Number,
    currency: {
      type: String,
      default: 'usd'
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'failed'],
      default: 'pending'
    },
    invoiceId: String,
    paidAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  paymentMethod: {
    type: String, // last4 of card
    brand: String, // visa, mastercard, etc.
    expiryMonth: Number,
    expiryYear: Number
  }
}, {
  timestamps: true
});

// Set features based on plan
SubscriptionSchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    switch (this.plan) {
      case 'free':
        this.features = {
          maxRecipes: 10,
          maxMealPlans: 1,
          maxFollowers: 100,
          canCreateGroups: false,
          canLiveStream: false,
          canMonetize: false,
          adFree: false,
          analytics: false,
          prioritySupport: false,
          customBranding: false
        };
        break;
      case 'basic':
        this.features = {
          maxRecipes: 50,
          maxMealPlans: 5,
          maxFollowers: 500,
          canCreateGroups: true,
          canLiveStream: false,
          canMonetize: false,
          adFree: true,
          analytics: false,
          prioritySupport: false,
          customBranding: false
        };
        break;
      case 'premium':
        this.features = {
          maxRecipes: 200,
          maxMealPlans: 20,
          maxFollowers: 2000,
          canCreateGroups: true,
          canLiveStream: true,
          canMonetize: true,
          adFree: true,
          analytics: true,
          prioritySupport: false,
          customBranding: false
        };
        break;
      case 'pro':
        this.features = {
          maxRecipes: -1, // unlimited
          maxMealPlans: -1,
          maxFollowers: -1,
          canCreateGroups: true,
          canLiveStream: true,
          canMonetize: true,
          adFree: true,
          analytics: true,
          prioritySupport: true,
          customBranding: true
        };
        break;
    }
  }
  next();
});

// Check if feature is available
SubscriptionSchema.methods.hasFeature = function(featureName) {
  return this.features[featureName] === true || this.features[featureName] === -1;
};

// Check if limit is reached
SubscriptionSchema.methods.isLimitReached = function(featureName, currentCount) {
  const limit = this.features[featureName];
  if (limit === -1) return false; // Unlimited
  return currentCount >= limit;
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);
