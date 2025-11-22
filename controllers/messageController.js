const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const { archived = false } = req.query;

    const query = {
      participants: req.user.id,
      isActive: true
    };

    if (archived === 'true') {
      query.archivedBy = req.user.id;
    } else {
      query.archivedBy = { $ne: req.user.id };
    }

    const conversations = await Conversation.find(query)
      .populate('participants', 'fullName username avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        select: 'text type createdAt sender',
        populate: {
          path: 'sender',
          select: 'fullName username'
        }
      })
      .sort('-lastMessageAt');

    res.status(200).json({
      status: 'success',
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// @desc    Get or create direct conversation
// @route   POST /api/messages/conversations/direct
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // Can't message yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot create conversation with yourself'
      });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const conversation = await Conversation.findOrCreateDirect(req.user.id, userId);
    await conversation.populate('participants', 'fullName username avatar isOnline');

    res.status(200).json({
      status: 'success',
      data: conversation
    });
  } catch (error) {
    console.error('Get/create conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating conversation',
      error: error.message
    });
  }
};

// @desc    Get messages in conversation
// @route   GET /api/messages/conversations/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this conversation'
      });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId,
      isDeleted: false
    })
      .populate('sender', 'fullName username avatar')
      .populate('metadata.recipeId', 'title image')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      conversation: req.params.conversationId,
      isDeleted: false
    });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      {
        isRead: true,
        readAt: Date.now()
      }
    );

    // Reset unread count
    await conversation.resetUnread(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// @desc    Send message
// @route   POST /api/messages/conversations/:conversationId
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { text, type = 'text', metadata } = req.body;

    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to send messages in this conversation'
      });
    }

    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user.id,
      text,
      type,
      metadata: metadata || {}
    });

    await message.populate('sender', 'fullName username avatar');
    if (type === 'recipe' && metadata?.recipeId) {
      await message.populate('metadata.recipeId', 'title image');
    }

    // Increment unread count for other participants
    for (const participantId of conversation.participants) {
      if (participantId.toString() !== req.user.id) {
        await conversation.incrementUnread(participantId);
      }
    }

    // TODO: Emit socket event for real-time delivery
    // io.to(conversation._id.toString()).emit('new_message', message);

    res.status(201).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Edit message
// @route   PUT /api/messages/:messageId
// @access  Private
exports.editMessage = async (req, res) => {
  try {
    const { text } = req.body;

    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }

    // Check if user is sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to edit this message'
      });
    }

    message.text = text;
    message.isEdited = true;
    message.editedAt = Date.now();
    await message.save();

    res.status(200).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error editing message',
      error: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }

    // Check if user is sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this message'
      });
    }

    message.isDeleted = true;
    message.deletedAt = Date.now();
    message.text = 'This message has been deleted';
    await message.save();

    res.status(200).json({
      status: 'success',
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting message',
      error: error.message
    });
  }
};

// @desc    Archive conversation
// @route   PUT /api/messages/conversations/:conversationId/archive
// @access  Private
exports.archiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    if (!conversation.archivedBy.includes(req.user.id)) {
      conversation.archivedBy.push(req.user.id);
      await conversation.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Conversation archived'
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error archiving conversation',
      error: error.message
    });
  }
};

// @desc    Unarchive conversation
// @route   PUT /api/messages/conversations/:conversationId/unarchive
// @access  Private
exports.unarchiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found'
      });
    }

    conversation.archivedBy = conversation.archivedBy.filter(
      id => id.toString() !== req.user.id
    );
    await conversation.save();

    res.status(200).json({
      status: 'success',
      message: 'Conversation unarchived'
    });
  } catch (error) {
    console.error('Unarchive conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error unarchiving conversation',
      error: error.message
    });
  }
};
