// backend/services/authService.js
import jwt from 'jsonwebtoken';
import User, { ROLES } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_EXPIRATION = 3 * 24 * 60 * 60; // 3 days in seconds

class AuthService {
  // Create JWT token
  createToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );
  }

  // Signup new user
  async signup({ firstName, lastName, email, password, role, department }) {
    const userRole = role && [ROLES.USER, ROLES.TEACHER].includes(role) ? role : ROLES.USER;

    const userData = { firstName, lastName, email, password, role: userRole, termsAgreed: true };
    
    if (userRole === ROLES.TEACHER) {
      userData.teacherData = { department };
    }

    const user = await User.create(userData);
    const token = this.createToken(user);
    return { user, token };
  }

  // Login existing user
  async login(email, password) {
    const user = await User.login(email, password); // Model handles password check
    const token = this.createToken(user);
    return { user, token };
  }

  // Logout user
  logout(res) {
    // In backend, we clear the cookie
    res.cookie('jwt', '', { maxAge: 1 });
    return { success: true, message: 'Logged out successfully' };
  }

  // Verify JWT and get user
  async getUserFromToken(token) {
    if (!token) return User.getGuestUser();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      return user || User.getGuestUser();
    } catch (err) {
      return User.getGuestUser();
    }
  }
}

export default new AuthService();
