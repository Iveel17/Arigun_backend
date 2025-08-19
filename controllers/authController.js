import User, { ROLES } from '../models/User.js';
import jwt from 'jsonwebtoken';

const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    termsAgreed: '' 
  };

  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }
  if (err.code === 11000) {
    errors.email = 'That email is already registered';
    return errors;
  }
  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

// JWT handling
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: maxAge });
};

// Permissions based on roles
const getUserPermissions = (role) => {
  const permissions = {
    [ROLES.GUEST]: ['view_public_content'],
    [ROLES.USER]: [
      'read_courses',
      'enroll_courses', 
      'view_own_profile',
      'update_own_profile'
    ],
    [ROLES.TEACHER]: [
      'read_courses',
      'create_courses',
      'update_own_courses',
      'delete_own_courses',
      'manage_students',
      'grade_assignments',
      'view_own_profile',
      'update_own_profile'
    ],
    [ROLES.ADMIN]: ['all']
  };
  return permissions[role] || permissions[ROLES.GUEST];
};

// Format user response
const formatUserResponse = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  permissions: getUserPermissions(user.role)
});

export const signup_post = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, termsAgreed, role } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ errors: { confirmPassword: 'Passwords do not match' } });
    }
    if (!termsAgreed || termsAgreed !== true) {
      return res.status(400).json({ errors: { termsAgreed: 'You must agree to the terms and conditions' } });
    }

    const allowedSignupRoles = [ROLES.USER, ROLES.TEACHER];
    const userRole = role && allowedSignupRoles.includes(role) ? role : ROLES.USER;

    const userData = { firstName, lastName, email, password, role: userRole, termsAgreed: true };
    if (userRole === ROLES.TEACHER) {
      userData.teacherData = { department: req.body.department };
    }

    const user = await User.create(userData);
    const token = createToken(user._id, user.role);

    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.status(201).json({ success: true, token, user: formatUserResponse(user) });

  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

export const login_post = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.login(email, password);
    const token = createToken(user._id, user.role);

    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    res.status(200).json({ success: true, token, user: formatUserResponse(user) });

  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ errors });
  }
};

export const logout_post = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
  console.log('User logged out');
};

export const update_user_role = async (req, res) => {
  try {
    const { userId, newRole } = req.body;
    if (!Object.values(ROLES).includes(newRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }
    if (req.user.id === userId && newRole !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Admins cannot change their own role' });
    }

    const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user: formatUserResponse(user), message: `User role updated to ${newRole}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating user role' });
  }
};

export const get_all_users = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const filter = {};
    if (role && Object.values(ROLES).includes(role)) filter.role = role;

    const users = await User.find(filter).select('-password').limit(limit * 1).skip((page - 1) * limit).sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users: users.map(formatUserResponse),
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};
