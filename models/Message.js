const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
    maxlength: [2000, 'Message cannot be more than 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'recipe', 'system'],
    default: 'text'
  },
  metadata: {
    // For image messages
    imageUrl: String,
    
    // For recipe messages
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    
    // For system messages
    action: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

// Update conversation's lastMessage when message is created
MessageSchema.post('save', async function() {
  const Conversation = mongoose.model('Conversation');
  await Conversation.findByIdAndUpdate(this.conversation, {
    lastMessage: this._id,
    lastMessageAt: this.createdAt
  });
});

module.exports = mongoose.model('Message', MessageSchema);
