export const config = {
  API_BASE_URL: process.env.PORT === 'production' 
    ? 'https://your-production-api.com' 
    : 'http://localhost:5000',
  
  FRONTEND_URL: process.env.PORT === 'production'
    ? 'https://your-production-frontend.com'
    : 'http://localhost:5173',
    
  COOKIE_SETTINGS: {
    httpOnly: true,
    secure: process.env.PORT === 'production',
    sameSite: process.env.PORT === 'production' ? 'none' : 'lax',
    maxAge: 3 * 24 * 60 * 60 * 1000
  }
};