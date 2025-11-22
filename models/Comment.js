const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'Please provide comment text'],
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  
  // Replies (nested comments)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  
  // Engagement
  likes: {
    type: Number,
    default: 0
  },
  likesUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  repliesCount: {
    type: Number,
    default: 0
  },
  
  // Status
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
  
}, {
  timestamps: true
});

// Update recipe comment count
CommentSchema.post('save', async function() {
  if (!this.parentComment) {
    await this.model('Recipe').findByIdAndUpdate(this.recipe, {
      $inc: { commentsCount: 1 }
    });
  } else {
    await this.model('Comment').findByIdAndUpdate(this.parentComment, {
      $inc: { repliesCount: 1 }
    });
  }
});

module.exports = mongoose.model('Comment', CommentSchema);
