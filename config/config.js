export const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com' 
    : 'http://localhost:3000',
  
  FRONTEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://your-production-frontend.com'
    : 'http://localhost:3001',
    
  COOKIE_SETTINGS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 3 * 24 * 60 * 60 * 1000
  }
};