// controllers/authController.js

export const signup_get = (req, res) => {
  res.render('signup');
};

export const login_get = (req, res) => {
  res.render('login');
};

export const signup_post = async (req, res) => {
  res.send('new signup');
};

export const login_post = async (req, res) => {
  res.send('user login');
};
