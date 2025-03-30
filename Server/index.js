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

// Middleware
app.use(cors());
app.use(express.json());

// Add at the very beginning of your file
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Rest of your existing code

// Enhanced request logging with more details
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (Object.keys(req.body).length) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Basic status endpoint for health checks
app.get('/api/status', (req, res) => {
  // Include MongoDB connection status
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date(),
    database: dbStatus
  });
});

// Mount API routes
app.use('/', rootRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/health', healthRoutes); 

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillorbit', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Setup connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  console.log(`⚠️ Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: 'Endpoint not found',
    path: req.url,
    method: req.method,
    timestamp: new Date()
  });
});

// Error handling middleware with detailed logging
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  console.error('Stack trace:', err.stack);
  
  // Don't expose stack traces in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.statusCode || 500).json({ 
    message: 'Server error', 
    error: isProduction ? 'An unexpected error occurred' : err.message,
    path: req.url,
    timestamp: new Date()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/api/status`);
});