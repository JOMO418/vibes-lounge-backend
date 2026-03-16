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

// Create HTTP server
const server = http.createServer(app);

// ✅ FIXED: Unified allowed origins for both Express and Socket.io
const allowedOrigins = [
  'https://vibeslounge.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002', // fallback in case port shifts again
];

// ✅ Socket.io CORS — uses same allowed origins
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Setup socket handlers
setupSocket(io);

// Make io accessible in routes
app.set('io', io);

// Connect to MongoDB
connectDB();

// ✅ Express CORS — uses same allowed origins
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight for all routes

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests (helps with debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
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
      tabs: '/api/tabs',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedPath: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Vibes Lounge Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔌 Socket.io: ENABLED ✅`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 CORS Origins: ${allowedOrigins.join(', ')}`);
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