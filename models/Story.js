const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    type: String,
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  thumbnail: {
    type: String
  },
  caption: {
    type: String,
    maxlength: 200
  },
  duration: {
    type: Number, // Duration in seconds for videos
    default: 0
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from creation
    index: { expires: 0 } // TTL index - MongoDB will auto-delete after expiration
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });
storySchema.index({ isActive: 1, expiresAt: 1 });

// Virtual for like count
storySchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Ensure virtuals are included in JSON
storySchema.set('toJSON', { virtuals: true });
storySchema.set('toObject', { virtuals: true });

// Method to check if story is expired
storySchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to add view
storySchema.methods.addView = async function(userId) {
  // Check if user already viewed
  const alreadyViewed = this.views.some(view => 
    view.user.toString() === userId.toString()
  );
  
  if (!alreadyViewed) {
    this.views.push({ user: userId });
    this.viewCount += 1;
    await this.save();
  }
  
  return this;
};

// Static method to get active stories
storySchema.statics.getActiveStories = function(userId = null) {
  const query = {
    expiresAt: { $gt: new Date() },
    isActive: true
  };
  
  if (userId) {
    query.user = userId;
  }
  
  return this.find(query)
    .populate('user', 'name username avatar verified')
    .sort({ createdAt: -1 });
};

// Static method to get stories from following users
storySchema.statics.getFollowingStories = async function(userId, followingIds) {
  return this.find({
    user: { $in: followingIds },
    expiresAt: { $gt: new Date() },
    isActive: true
  })
  .populate('user', 'name username avatar verified')
  .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Story', storySchema);
