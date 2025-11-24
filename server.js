const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Trust proxy (required for Render, Heroku, Railway, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'https://plated.cloud',
  'https://www.plated.cloud',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a Vercel preview URL
    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
                      origin.includes('.vercel.app');
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression Middleware
app.use(compression());

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Passport Middleware (for Google/Apple OAuth)
const passport = require('./config/passport');
app.use(passport.initialize());

// Cache Control for GET requests
app.use((req, res, next) => {
  if (req.method === 'GET') {
    // Cache public recipe data for 5 minutes
    if (req.url.startsWith('/api/recipes') || req.url.startsWith('/api/users')) {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
  }
  next();
});

// Database Connection with optimized pooling
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,  // Maximum number of connections
  minPoolSize: 5,   // Minimum number of connections
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/planner', require('./routes/planner'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/security', require('./routes/security'));
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/ai', require('./routes/ai')); // AI Features with Gemini

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Plated API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Socket.IO Setup (for real-time features + WebRTC signaling)
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Setup WebRTC Signaling for Live Streams
const { setupWebRTCSignaling } = require('./services/webrtcSignaling');
setupWebRTCSignaling(io);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ Unhandled Rejection! Shutting down...');
  console.error(err);
  server.close(() => process.exit(1));
});

module.exports = { app, io };
