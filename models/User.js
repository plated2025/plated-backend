const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values but enforces uniqueness when set
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot be more than 20 characters'],
    match: [
      /^[a-z0-9_]+$/,
      'Username can only contain lowercase letters, numbers, and underscores'
    ]
  },
  password: {
    type: String,
    required: function() {
      // Password only required for local auth (not social auth)
      return this.authProvider === 'local';
    },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'apple'],
    default: 'local'
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  appleId: {
    type: String,
    sparse: true,
    unique: true
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/default-avatar.png'
  },
  coverImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },
  userType: {
    type: String,
    enum: ['creator', 'regular'],
    default: 'regular'
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  
  // Onboarding
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  hasSelectedUserType: {
    type: Boolean,
    default: false
  },
  interests: [{
    type: String
  }],
  
  // Stats
  followersCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  recipesCount: {
    type: Number,
    default: 0
  },
  
  // Creator Stats
  level: {
    type: Number,
    default: 0
  },
  xp: {
    type: Number,
    default: 0
  },
  profileViews: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastStreakDate: {
    type: Date
  },
  achievements: {
    type: [{
      id: String,
      title: String,
      description: String,
      icon: String,
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: [] // Empty array for new users
  },
  
  // Subscription
  subscriptionTier: {
    type: String,
    enum: ['free', 'plus', 'pro'],
    default: 'free'
  },
  subscriptionExpiresAt: {
    type: Date
  },
  stripeCustomerId: {
    type: String
  },
  
  // Dietary Preferences
  dietaryPreferences: {
    dietTypes: [String],
    allergies: [String],
    intolerances: [String],
    dislikes: [String],
    cuisinePreferences: [String],
    avoidIngredients: [String]
  },
  
  // Nutrition Tracking (synced from phone/watch)
  nutritionGoals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    water: { type: Number, default: 0 }
  },
  dailyNutrition: {
    date: { type: Date, default: Date.now },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    water: { type: Number, default: 0 }
  },
  
  // Settings
  settings: {
    notifications: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      messages: { type: Boolean, default: true }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'private', 'friends'], default: 'public' },
      showActivity: { type: Boolean, default: true },
      allowMessages: { type: String, enum: ['everyone', 'following', 'none'], default: 'everyone' }
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  
  // Social Login
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  appleId: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  twoFactorBackupCodes: [String],
  
  // Security & Login History
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLoginIP: String,
  lastLoginDevice: String,
  trustedDevices: [{
    deviceId: String,
    deviceName: String,
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Blocked Users
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validate password strength before hashing
UserSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    const password = this.password;
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return next(new Error('Password must contain at least one uppercase letter'));
    }
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return next(new Error('Password must contain at least one number'));
    }
    
    // Check minimum length (already in schema, but double check)
    if (password.length < 8) {
      return next(new Error('Password must be at least 8 characters long'));
    }
  }
  
  next();
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT Token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, userType: this.userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Virtual for full profile URL
UserSchema.virtual('profileUrl').get(function() {
  return `/profile/${this._id}`;
});

// Check if account is locked
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  // Otherwise, increment
  const updates = { $inc: { loginAttempts: 1 } };
  // Lock account after 5 failed attempts for 2 hours
  const needsLock = this.loginAttempts + 1 >= 5 && !this.isLocked;
  if (needsLock) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  return this.updateOne(updates);
};

// Reset login attempts
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Generate email verification token
UserSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Generate password reset token
UserSchema.methods.generateResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return token;
};

module.exports = mongoose.model('User', UserSchema);
