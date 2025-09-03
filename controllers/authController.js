// controllers/authController.js
import AuthService from '../services/authService.js';
import User, { ROLES } from '../models/User.js'; // ✅ FIXED: Added missing User import

// Helper to format user for response
const formatUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role
});

// Signup
export const signup_post = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department } = req.body;

    const { user, token } = await AuthService.signup({ firstName, lastName, email, password, role, department });

    res.cookie('jwt', token, { 
      httpOnly: true, 
      maxAge: 3 * 24 * 60 * 60 * 1000, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax' 
    });

    res.status(201).json({ success: true, user: formatUserResponse(user), token });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Login
export const login_post = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await AuthService.login(email, password);

    res.cookie('jwt', token, { 
      httpOnly: true, 
      maxAge: 3 * 24 * 60 * 60 * 1000, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax' 
    });

    res.status(200).json({ success: true, user: formatUserResponse(user), token });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Logout
export const logout_post = (req, res) => {
  const result = AuthService.logout(res);
  res.status(200).json(result);
};

// Verification
export const verify_user = async (req, res) => {
  try {
    // The requireAuth middleware should have already set req.user
    if (!req.user || req.user.role === 'guest') {
      return res.status(401).json({ 
        success: false, 
        user: null 
      });
    }

    res.status(200).json({ 
      success: true, 
      user: formatUserResponse(req.user) 
    });
  } catch (err) {
    console.error('Verify user error:', err);
    res.status(500).json({ 
      success: false, 
      user: null 
    });
  }
};

// Update user role (Admin only)
export const update_user_role = async (req, res) => {
  try {
    // ✅ MODIFIED: Get userId from URL parameters, newRole from the body
    const { userId } = req.params;
    const { newRole } = req.body;

    // This is business logic, NOT primary authorization. It's perfectly placed.
    if (!Object.values(ROLES).includes(newRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    // This is also a great example of specific logic within a controller.
    if (req.user.id === userId && newRole !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Admins cannot change their own role' });
    }

    const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user: formatUserResponse(user), message: `User role updated to ${newRole}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating user role' });
  }
};

// Get all users (Admin only)
export const get_all_users = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const filter = {};

    if (role && Object.values(ROLES).includes(role)) filter.role = role;

    const users = await User.find(filter).select('-password').limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users: users.map(formatUserResponse), // ✅ IMPROVED: Format all users consistently
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};