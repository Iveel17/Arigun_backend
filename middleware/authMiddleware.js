import jwt from 'jsonwebtoken';
import User, { ROLES } from '../models/User.js';
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

// Utility function to create route protection combinations - FIXED VERSION
const createProtectedRoute = (roles = [], allowGuest = false) => {
  const middlewares = [requireAuth(allowGuest)];
  
  if (roles.length > 0) {
    middlewares.push(requireRole(...roles));
  }
  
  return middlewares;
};

// ✅ FIXED: Proper export with all functions
export { 
  requireAuth, 
  requireRole, 
  requireOwnershipOrAdmin,
  createProtectedRoute
};