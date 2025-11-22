const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String, // For group chats
    trim: true
  },
  avatar: String, // For group chats
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mutedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ type: 1, isActive: 1 });

// Ensure direct conversations are unique between two users
ConversationSchema.index(
  { participants: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'direct' }
  }
);

// Method to increment unread count for a user
ConversationSchema.methods.incrementUnread = function(userId) {
  const current = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), current + 1);
  return this.save();
};

// Method to reset unread count for a user
ConversationSchema.methods.resetUnread = function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Static method to find or create direct conversation
ConversationSchema.statics.findOrCreateDirect = async function(user1Id, user2Id) {
  // Try to find existing conversation
  let conversation = await this.findOne({
    type: 'direct',
    participants: { $all: [user1Id, user2Id] }
  });

  // Create if doesn't exist
  if (!conversation) {
    conversation = await this.create({
      type: 'direct',
      participants: [user1Id, user2Id]
    });
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', ConversationSchema);
