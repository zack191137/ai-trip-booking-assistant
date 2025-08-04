import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { validateBody } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema, 
  updateProfileSchema 
} from '../utils/validation';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/google', authController.googleLogin);
router.post('/verify-token', authController.verifyToken);

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validateBody(updateProfileSchema), authController.updateProfile);
router.post('/change-password', validateBody(changePasswordSchema), authController.changePassword);
router.post('/refresh-token', authController.refreshToken);

export default router;