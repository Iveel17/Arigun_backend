// controllers/authController.js

export const signup_get = (req, res) => {
  res.render('signup');
};

export const login_get = (req, res) => {
  res.render('login');
};

// controllers/authController.js

export const signup_post = async (req, res) => {
  const { email, password } = req.body;

  console.log(email, password);
  res.send('new signup');
};

export const login_post = async (req, res) => {
  const { email, password } = req.body;

  console.log(email, password);
  res.send('user login');
};
