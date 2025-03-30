const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./Routes/userRoutes');
const projectRoutes = require('./Routes/projectRoutes');
const proposalRoutes = require('./Routes/proposalRoutes');
const healthRoutes = require('./Routes/healthRoutes');
const rootRoutes = require('./Routes/rootRoutes');

// Load environment variables
dotenv.config();
const app = express();

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: ['https://skillblock.onrender.com', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Enhanced request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const { method, url, ip } = req;
  console.log(`[${timestamp}] ${method} ${url} from ${ip}`);
  if (Object.keys(req.body).length) {
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// MongoDB Connection with retry logic
const connectDB = async (retries = 5) => {
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillorbit', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${6 - retries}/5 failed:`, err.message);
      retries -= 1;
      if (!retries) {
        console.error('❌ Could not connect to MongoDB after 5 attempts');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Database connection monitoring
mongoose.connection.on('connected', () => {
  console.log('🔄 Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('❗ Mongoose disconnected');
});

// Health check endpoint
app.get('/api/status', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'Server is running',
    timestamp: new Date(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

app.get('/api/debug/routes', (req, res) => {
  const routes = app._router.stack
    .filter(r => r.route)
    .map(r => ({
      path: r.route.path,
      method: Object.keys(r.route.methods).join(', ').toUpperCase()
    }));
  res.json(routes);
});

// Mount API routes
app.use('/', rootRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/health', healthRoutes);

// Add this after mounting routes
console.log('📋 Registered routes:', app._router.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    method: Object.keys(r.route.methods).join(', ').toUpperCase()
  }))
);


// 404 handler
app.use((req, res) => {
  console.log(`⚠️ Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: 'Endpoint not found',
    path: req.url,
    method: req.method,
    timestamp: new Date()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  console.error('Stack trace:', err.stack);
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Handle specific error types
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(503).json({
      message: 'Database service temporarily unavailable',
      error: isProduction ? 'Service unavailable' : err.message,
      status: 'error',
      timestamp: new Date()
    });
  }

  res.status(err.statusCode || 500).json({ 
    message: 'Server error',
    error: isProduction ? 'An unexpected error occurred' : err.message,
    path: req.url,
    timestamp: new Date()
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`📥 ${signal} received. Starting graceful shutdown...`);
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
}

// Start server
const startServer = async () => {
  const dbConnected = await connectDB();
  
  if (!dbConnected) {
    console.error('❌ Server startup failed due to database connection issues');
    process.exit(1);
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/status`);
    console.log(`🏠 Root endpoint: http://localhost:${PORT}/`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});