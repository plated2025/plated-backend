const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedRecipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  reportedComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  reportType: {
    type: String,
    enum: ['user', 'recipe', 'comment'],
    required: true
  },
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nudity',
      'false_information',
      'copyright',
      'impersonation',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  resolution: {
    action: {
      type: String,
      enum: ['no_action', 'warning', 'content_removed', 'user_suspended', 'user_banned']
    },
    notes: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
ReportSchema.index({ reporter: 1, createdAt: -1 });
ReportSchema.index({ reportedUser: 1 });
ReportSchema.index({ status: 1 });

module.exports = mongoose.model('Report', ReportSchema);
