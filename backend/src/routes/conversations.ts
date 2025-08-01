import { Router } from 'express';
import { conversationController } from '../controllers/ConversationController';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { 
  createConversationSchema, 
  sendMessageSchema, 
  uuidSchema 
} from '../utils/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Conversation management routes
router.post('/', validateBody(createConversationSchema), conversationController.createConversation);
router.get('/', conversationController.getConversations);
router.get('/stats', conversationController.getConversationStats);
router.get('/system/stats', conversationController.getSystemStats); // Admin endpoint
router.get('/:id', validateParams(uuidSchema), conversationController.getConversation);
router.delete('/:id', validateParams(uuidSchema), conversationController.endConversation);

// Message handling (REST endpoint for compatibility)
router.post('/:id/messages', 
  validateParams(uuidSchema), 
  validateBody(sendMessageSchema), 
  conversationController.sendMessage
);

export default router;