const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  archiveConversation,
  unarchiveConversation
} = require('../controllers/messageController');

// All routes are protected
router.use(protect);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversations/direct', getOrCreateConversation);
router.put('/conversations/:conversationId/archive', archiveConversation);
router.put('/conversations/:conversationId/unarchive', unarchiveConversation);

// Message routes
router.get('/conversations/:conversationId', getMessages);
router.post('/conversations/:conversationId', sendMessage);
router.put('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

module.exports = router;
