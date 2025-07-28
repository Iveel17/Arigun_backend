import jwt from 'jsonwebtoken';
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

export { requireAuth };
