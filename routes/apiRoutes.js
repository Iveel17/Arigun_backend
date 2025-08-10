// routes/apiRoutes.js - NEW FILE, don't modify existing routes
import { Router } from 'express';
import * as authController from '../controllers/authController.js';

const router = Router();

// API routes with /api prefix - separate from EJS routes
router.post('/api/auth/signup', authController.signup_post);
router.post('/api/auth/login', authController.login_post);
router.post('/api/auth/logout', authController.logout_post); // New logout for API
router.get('/api/auth/me', authController.me_get); // New route for getting current user

export default router;