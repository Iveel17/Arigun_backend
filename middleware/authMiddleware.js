import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Assuming you have a User model defined
import dotenv from 'dotenv';

dotenv.config();

const requireAuth = (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    return res.redirect('/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.redirect('/login');
    }

    console.log('Verified token:', decodedToken);
    next();
  });
};

const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

export { requireAuth, checkUser };
