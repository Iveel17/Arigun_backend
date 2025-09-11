// backend/server.js (ESM version)

import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import cors from "cors";
import fs from 'fs';

import apiRoutes from './routes/apiRoutes.js';
import videoRoutes from './routes/videoRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true // if you ever send cookies
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🆕 For parsing form data
app.use(cookieParser());

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const uploadDirs = ['uploads', 'uploads/videos', 'uploads/covers', 'uploads/others'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Static files (optional if using CSS, images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // for video uploads

app.use('/', apiRoutes); // make sure apiRoutes uses `res.json()`
app.use('/api/videos', videoRoutes); // video routes

// database connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  }))
  .catch(err => console.error('DB Connection Error:', err));

