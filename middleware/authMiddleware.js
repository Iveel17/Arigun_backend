import jwt from 'jsonwebtoken';
import User, { ROLES, PERMISSIONS } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Enhanced authentication middleware that also handles guests
const requireAuth = (allowGuest = false) => {
  return async (req, res, next) => {
    const token = req.cookies?.jwt;

    if (!token) {
      if (allowGuest) {
        // Set guest user
        req.user = User.getGuestUser();
        return next();
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        redirect: '/login'
      });
    }

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decodedToken.id).select('-password');
      
      if (!user) {
        if (allowGuest) {
          req.user = User.getGuestUser();
          return next();
        }
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('JWT verification failed:', err.message);
      
      if (allowGuest) {
        req.user = User.getGuestUser();
        return next();
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
  };
};

// Role-based authorization middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user has any of the required roles
    const hasRequiredRole = roles.some(role => req.user.hasRole(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

// NEW: Permission-based authorization middleware
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user has any of the required permissions
    const hasRequiredPermission = permissions.some(permission => 
      req.user.hasPermission(permission)
    );
    
    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions',
        required: permissions,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to ensure user owns the resource or has admin privileges
const requireOwnershipOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Admin can access everything
    if (req.user.hasRole(ROLES.ADMIN)) {
      return next();
    }

    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (req.user.id !== resourceUserId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied: You can only access your own resources' 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking resource ownership' 
      });
    }
  };
};

// NEW: Enhanced ownership check with fallback permissions
const requireOwnershipOrPermission = (getResourceUserId, fallbackPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user has the fallback permission (e.g., admin privileges)
    if (fallbackPermission && req.user.hasPermission(fallbackPermission)) {
      return next();
    }

    // Otherwise, check ownership
    try {
      const resourceUserId = await getResourceUserId(req);
      
      if (req.user.id !== resourceUserId.toString()) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied: You can only access your own resources' 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking resource ownership' 
      });
    }
  };
};

// Utility function to create route protection combinations
const createProtectedRoute = (options = {}) => {
  const {
    roles = [],
    permissions = [],
    allowGuest = false,
    requireOwnership = null,
    fallbackPermission = null
  } = options;

  const middlewares = [requireAuth(allowGuest)];
  
  // Add role-based protection
  if (roles.length > 0) {
    middlewares.push(requireRole(...roles));
  }
  
  // Add permission-based protection
  if (permissions.length > 0) {
    middlewares.push(requirePermission(...permissions));
  }

  // Add ownership protection
  if (requireOwnership) {
    if (fallbackPermission) {
      middlewares.push(requireOwnershipOrPermission(requireOwnership, fallbackPermission));
    } else {
      middlewares.push(requireOwnershipOrAdmin(requireOwnership));
    }
  }
  
  return middlewares;
};

// NEW: Convenient middleware factories for common use cases
const protectRoute = {
  // Public routes (guests allowed)
  public: () => [requireAuth(true)],
  
  // User-only routes
  user: () => [requireAuth(), requireRole(ROLES.USER)],
  
  // Teacher+ routes
  teacher: () => [requireAuth(), requireRole(ROLES.TEACHER, ROLES.ADMIN)],
  
  // Admin-only routes
  admin: () => [requireAuth(), requireRole(ROLES.ADMIN)],
  
  // Permission-based routes
  withPermission: (...permissions) => [requireAuth(), requirePermission(...permissions)],
  
  // Routes with ownership requirements
  ownResource: (getResourceUserId) => [
    requireAuth(), 
    requireOwnershipOrAdmin(getResourceUserId)
  ],
  
  // Custom protection
  custom: (options) => createProtectedRoute(options)
};

// ✅ FIXED: Proper export with all functions
export { 
  requireAuth, 
  requireRole, 
  requirePermission,
  requireOwnershipOrAdmin,
  requireOwnershipOrPermission,
  createProtectedRoute,
  protectRoute
};