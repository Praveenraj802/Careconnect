const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { initSocketIO } = require('./services/socketService');
const seedData = require('./utils/seed');
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
});

// Pass IO instance to socket service
initSocketIO(io);

// Security Headers with relaxed crossOriginResourcePolicy for Leaflet tiles
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Enable CORS
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting (General API)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'CareConnect Emergency Network',
    timestamp: new Date(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve production frontend assets if client/dist exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Static] Serving production frontend build from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Fallback 404 for unhandled API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    // Auto-seed initial sample data if empty
    await seedData();

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` CareConnect Emergency Server Running on Port ${PORT}`);
      console.log(` REST API URL: http://localhost:${PORT}/api`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(` Environment:  ${process.env.NODE_ENV || 'development'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Critical failure starting CareConnect Server:', err);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});
