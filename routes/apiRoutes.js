// routes/apiRoutes.js
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { 
  createProtectedRoute 
} from '../middleware/authMiddleware.js';
import { ROLES } from '../models/User.js';

const router = Router();

/* ================================
   Public Authentication Routes
   ================================ */
router.post('/api/auth/signup', authController.signup_post);
router.post('/api/auth/login', authController.login_post);
router.post('/api/auth/logout', authController.logout_post);

/* ================================
   User Routes
   ================================ */
// Cart route (protected, USER role)
router.get('/api/cart',  
  ...createProtectedRoute([ROLES.USER]), 
  (req, res) => {
    res.json({ 
      success: true, 
      user: req.user,
      message: 'User cart accessed' 
    });
  }
);

/* ================================
   Teacher Routes
   ================================ */
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

// Example of teacher course creation (if only teachers can create)
router.post('/api/courses', 
  ...createProtectedRoute([ROLES.TEACHER]), 
  (req, res) => {
    // Course creation logic here
    res.json({ 
      success: true, 
      message: 'Course creation endpoint',
      user: req.user 
    });
  }
);

/* ================================
   Admin Routes
   ================================ */
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

/* ================================
   Mixed / Guest Accessible Routes
   ================================ */
router.get('/api/content', 
  ...createProtectedRoute([], [], true), // allowGuest=true
  (req, res) => {
    const content = {
      public: 'This content is available to everyone',
      user: req.user.hasRole(ROLES.USER) ? 'Course list available' : null,
      teacher: req.user.hasRole(ROLES.TEACHER) ? 'Course creation available' : null,
      admin: req.user.hasRole(ROLES.ADMIN) ? 'Admin panel available' : null
    };
    
    res.json({ 
      success: true, 
      content,
      userRole: req.user.role 
    });
  }
);

/* ================================
   Ownership / Resource-based Access
   ================================ */
router.get('/api/user/:userId/profile', 
  ...createProtectedRoute([ROLES.USER, ROLES.TEACHER, ROLES.ADMIN]), 
  (req, res) => {
    const requestedUserId = req.params.userId;
    
    // Allow access if user is admin or accessing their own profile
    if (!req.user.hasRole(ROLES.ADMIN) && req.user.id !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own profile'
      });
    }
    
    res.json({ 
      success: true, 
      message: `Profile access granted for user ${requestedUserId}`,
      requestingUser: req.user.id 
    });
  }
);

/* ================================
   Health Check Route (Public)
   ================================ */
router.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is healthy',
    timestamp: new Date().toISOString() 
  });
});

export default router;
