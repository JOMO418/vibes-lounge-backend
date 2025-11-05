

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');
const { setupSocket } = require('./socket/socketHandler');

// Import all route files
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const tabsRoutes = require('./routes/tabs');

const app = express();

// Create HTTP server (IMPORTANT: we use http.createServer now)
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'https://vibeslounge.netlify.app',
        'http://localhost:3000',
      ];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Socket.io CORS: Origin not allowed'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],  // Add OPTIONS for consistency
    credentials: true,
  },
});

// Setup socket handlers
setupSocket(io);

// Make io accessible in routes (IMPORTANT!)
app.set('io', io);

// Connect to MongoDB
connectDB();

// Middleware
// Explicit CORS config - handles preflight for prod, lenient for local
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., curl, mobile)
    if (!origin) return callback(null, true);
    // Use FRONTEND_URL env (Render-loaded) + local fallback
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://vibeslounge.netlify.app',  // Prod Netlify
      'https://vibes-lounge.netlify.app',  // Alt/duplicate from Socket.io
      'http://localhost:3000',  // Local frontend
    ];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);  // Log for debugging
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,  // Supports Authorization Bearer tokens (your JWT)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],  // Explicit for preflight (OPTIONS auto-handled)
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],  // JSON + future headers
  preflightContinue: false,  // Let cors handle OPTIONS
  optionsSuccessStatus: 204,  // Standard preflight response
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests (optional - helps with debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/tabs', tabsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Vibes Lounge API is running',
    timestamp: new Date().toISOString(),
    socketEnabled: true,
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      sales: '/api/sales',
      tabs: '/api/tabs'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedPath: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server (IMPORTANT: use 'server' not 'app')
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Vibes Lounge Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔌 Socket.io: ENABLED ✅`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
  console.log('\n📚 Available Endpoints:');
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/products`);
  console.log(`   POST   /api/products (admin)`);
  console.log(`   POST   /api/sales`);
  console.log(`   GET    /api/sales/today/profit`);
  console.log(`   GET    /api/sales/today/my-sales`);
  console.log(`   GET    /api/sales/all (admin)`);
  console.log(`   POST   /api/tabs`);
  console.log(`   GET    /api/tabs`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});