// backend/server.js (ESM version)

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 🆕 For parsing form data

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files (optional if using CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public'))); // if you have one

// Routes
app.get('/', (req, res) => {
    res.render('home');
});
app.get('/smoothies', (req, res) => {
    res.render('smoothies');
});
app.use(authRoutes); // make sure authRoutes uses `res.render()`

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
