// routes/apiRoutes.js - SIMPLIFIED VERSION
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { verify_user } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { ROLES } from '../models/User.js';

const router = Router();

/* ================================
   Public Authentication Routes
   ================================ */
router.post('/api/auth/signup', authController.signup_post);
router.post('/api/auth/login', authController.login_post);
router.post('/api/auth/logout', authController.logout_post);

/* ================================
   User Verification (Protected)
   ================================ */
router.get('/api/auth/verify', requireAuth(), verify_user);

/* ================================
   User Profile Routes
   ================================ */
// Any authenticated user can view their own profile
router.get('/api/user/profile', requireAuth(), (req, res) => {
  res.json({ 
    success: true, 
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      department: req.user.teacherData?.department
    }
  });
});

/* ================================
   Guest/Public Content Routes
   ================================ */
// Allow guests to view public content
router.get('/api/public/courses', requireAuth(true), (req, res) => {
  const isGuest = req.user.role === ROLES.GUEST;
  res.json({ 
    success: true, 
    message: `Public courses for ${isGuest ? 'guest' : 'authenticated'} user`,
    userRole: req.user.role
  });
});

/* ================================
   User-Level Routes (USER+)
   ================================ */
// Users can enroll in courses
router.post('/api/courses/:courseId/enroll', 
  requireAuth(),
  requireRole(ROLES.USER, ROLES.TEACHER, ROLES.ADMIN),
  (req, res) => {
    res.json({ 
      success: true, 
      message: `User ${req.user.firstName} enrolled in course ${req.params.courseId}`,
      userRole: req.user.role
    });
  }
);

// Users can view their enrollments
router.get('/api/user/enrollments', 
  requireAuth(),
  requireRole(ROLES.USER, ROLES.TEACHER, ROLES.ADMIN),
  (req, res) => {
    res.json({ 
      success: true, 
      message: `Enrollments for ${req.user.firstName}`,
      userRole: req.user.role
    });
  }
);

/* ================================
   Teacher-Level Routes (TEACHER+)
   ================================ */
// Teachers can create courses
router.post('/api/courses', 
  requireAuth(),
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  (req, res) => {
    res.json({ 
      success: true, 
      message: `Course created by ${req.user.firstName} (${req.user.role})`,
      department: req.user.teacherData?.department
    });
  }
);

// Teachers can manage their courses
router.get('/api/teacher/courses', 
  requireAuth(),
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  (req, res) => {
    res.json({ 
      success: true, 
      message: `Courses managed by ${req.user.firstName}`,
      userRole: req.user.role,
      department: req.user.teacherData?.department
    });
  }
);

// Teachers can grade assignments
router.post('/api/assignments/:assignmentId/grade', 
  requireAuth(),
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  (req, res) => {
    const { studentId, grade, feedback } = req.body;
    res.json({ 
      success: true, 
      message: `Grade submitted by ${req.user.firstName}`,
      assignment: req.params.assignmentId,
      studentId,
      grade,
      feedback
    });
  }
);

/* ================================
   Admin-Only Routes
   ================================ */
// Admin can manage all users
router.get('/api/admin/users', 
  requireAuth(),
  requireRole(ROLES.ADMIN),
  authController.get_all_users
);

// Admin can update user roles
router.put('/api/admin/users/:userId/role', 
  requireAuth(),
  requireRole(ROLES.ADMIN),
  authController.update_user_role
);

// Admin can view system statistics
router.get('/api/admin/stats', 
  requireAuth(),
  requireRole(ROLES.ADMIN),
  (req, res) => {
    res.json({ 
      success: true, 
      message: 'System statistics (admin only)',
      adminUser: req.user.firstName
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
    timestamp: new Date().toISOString(),
    roles: Object.values(ROLES)
  });
});

/* ================================
   Role Testing Routes (Development)
   ================================ */
// Test route to see what role you have
router.get('/api/test/my-role', requireAuth(true), (req, res) => {
  res.json({
    success: true,
    user: {
      name: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
      isGuest: req.user.role === ROLES.GUEST,
      permissions: {
        canCreateCourses: req.user.hasRole(ROLES.TEACHER),
        canManageUsers: req.user.hasRole(ROLES.ADMIN),
        canEnrollInCourses: req.user.hasRole(ROLES.USER)
      }
    }
  });
});

// Test routes for each role level
router.get('/api/test/user-only', 
  requireAuth(), 
  requireRole(ROLES.USER), 
  (req, res) => {
    res.json({ success: true, message: 'You have USER level access or higher!' });
  }
);

router.get('/api/test/teacher-only', 
  requireAuth(), 
  requireRole(ROLES.TEACHER), 
  (req, res) => {
    res.json({ success: true, message: 'You have TEACHER level access or higher!' });
  }
);

router.get('/api/test/admin-only', 
  requireAuth(), 
  requireRole(ROLES.ADMIN), 
  (req, res) => {
    res.json({ success: true, message: 'You have ADMIN level access!' });
  }
);

export default router;