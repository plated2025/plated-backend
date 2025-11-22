const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Prevent duplicate follows
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Update follower/following counts
FollowSchema.post('save', async function() {
  await this.model('User').findByIdAndUpdate(this.follower, {
    $inc: { followingCount: 1 }
  });
  await this.model('User').findByIdAndUpdate(this.following, {
    $inc: { followersCount: 1 }
  });
});

FollowSchema.post('remove', async function() {
  await this.model('User').findByIdAndUpdate(this.follower, {
    $inc: { followingCount: -1 }
  });
  await this.model('User').findByIdAndUpdate(this.following, {
    $inc: { followersCount: -1 }
  });
});

module.exports = mongoose.model('Follow', FollowSchema);
