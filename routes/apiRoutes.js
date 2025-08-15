// routes/apiRoutes.js - Enhanced with role-based protection
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { 
  requireAuth, 
  requireRole, 
  requirePermission,
  createProtectedRoute 
} from '../middleware/authMiddleware.js';
import { ROLES } from '../models/User.js';

const router = Router();

// Public routes (no authentication required)
router.post('/api/auth/signup', authController.signup_post);
router.post('/api/auth/login', authController.login_post);
router.post('/api/auth/logout', authController.logout_post);
router.get('/api/auth/me', authController.me_get); // This handles guest users

// Protected routes - User level and above
router.get('/api/profile', 
  ...createProtectedRoute([ROLES.USER]), 
  (req, res) => {
    res.json({ 
      success: true, 
      user: req.user,
      message: 'User profile accessed' 
    });
  }
);

// Protected routes - Teacher level and above
router.get('/api/teacher/dashboard', 
  ...createProtectedRoute([ROLES.TEACHER]), 
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Teacher dashboard accessed',
      user: req.user 
    });
  }
);

router.post('/api/courses', 
  ...createProtectedRoute([], ['create_courses']), 
  (req, res) => {
    // Course creation logic here
    res.json({ 
      success: true, 
      message: 'Course creation endpoint',
      user: req.user 
    });
  }
);

// Protected routes - Admin only
router.post('/api/auth/update-role', 
  ...createProtectedRoute([ROLES.ADMIN]), 
  authController.update_user_role
);

router.get('/api/auth/users', 
  ...createProtectedRoute([ROLES.ADMIN]), 
  authController.get_all_users
);

router.get('/api/admin/dashboard', 
  ...createProtectedRoute([ROLES.ADMIN]), 
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'Admin dashboard accessed',
      user: req.user 
    });
  }
);

// Example of mixed permission routes
router.get('/api/content', 
  requireAuth(true), // Allow guests
  (req, res) => {
    const content = {
      public: 'This content is available to everyone',
      user: req.user.hasPermission('read_courses') ? 'Course list available' : null,
      teacher: req.user.hasPermission('create_courses') ? 'Course creation available' : null,
      admin: req.user.hasRole(ROLES.ADMIN) ? 'Admin panel available' : null
    };
    
    res.json({ 
      success: true, 
      content,
      userRole: req.user.role 
    });
  }
);

// Example route that checks ownership or admin access
router.get('/api/user/:userId/profile', 
  requireAuth(),
  async (req, res) => {
    const requestedUserId = req.params.userId;
    
    // Allow access if user is admin or accessing their own profile
    if (!req.user.hasRole(ROLES.ADMIN) && req.user.id !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own profile'
      });
    }
    
    // Profile access logic here
    res.json({ 
      success: true, 
      message: `Profile access granted for user ${requestedUserId}`,
      requestingUser: req.user.id 
    });
  }
);

// Health check endpoint (public)
router.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is healthy',
    timestamp: new Date().toISOString() 
  });
});

export default router;