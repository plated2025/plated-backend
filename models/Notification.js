const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'like',           // Someone liked your recipe
      'comment',        // Someone commented on your recipe
      'reply',          // Someone replied to your comment
      'follow',         // Someone followed you
      'mention',        // Someone mentioned you
      'recipe_saved',   // Someone saved your recipe
      'achievement',    // Achievement unlocked
      'system'          // System notification
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String  // URL to navigate to when clicked
  },
  metadata: {
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    achievementId: String,
    additionalData: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  const notification = await this.create(data);
  
  // TODO: Emit socket event for real-time notification
  // io.to(data.recipient).emit('new_notification', notification);
  
  return notification;
};

// Mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = Date.now();
  return await this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema);
