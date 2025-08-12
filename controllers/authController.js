import User from '../models/User.js';
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

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered';
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect';
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'That email is already registered';
    return errors;
  }

  // validation errors
  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

// create json web token
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge
  });
};

// controller actions
// GET routes
export const signup_get = (req, res) => {
  res.render('signup');
};

export const login_get = (req, res) => {
  res.render('login');
};

// POST routes
export const signup_post = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword, termsAgreed } = req.body;

  try {
    // Server-side validation for password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ 
        errors: { 
          ...Object.fromEntries(Object.keys({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', termsAgreed: '' }).map(key => [key, ''])),
          confirmPassword: 'Passwords do not match' 
        } 
      });
    }

    // Server-side validation for terms agreement
    if (!termsAgreed || termsAgreed !== true) {
      return res.status(400).json({ 
        errors: { 
          ...Object.fromEntries(Object.keys({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', termsAgreed: '' }).map(key => [key, ''])),
          termsAgreed: 'You must agree to the terms and conditions' 
        } 
      });
    }

    const user = await User.create({ 
      firstName, 
      lastName, 
      email, 
      password, 
      termsAgreed: true 
    });
    
    const token = createToken(user._id);
    res.cookie('jwt', token, { 
      httpOnly: true, 
      maxAge: maxAge * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Consistent response format
    res.status(201).json({ 
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
    
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

export const login_post = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.login(email, password);
    const token = createToken(user._id);
    
    res.cookie('jwt', token, { 
      httpOnly: true, 
      maxAge: maxAge * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Consistent response format - matches signup
    res.status(200).json({ 
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ errors });
  }
};

export const logout_get = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
};

export const logout_post = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const me_get = async (req, res) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ success: false, user: null });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken.id).select('-password');
    res.status(200).json({ 
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, user: null });
  }
};