const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/authRoutes');
console.log('AUTH ROUTE OBJECT:', typeof authRoutes);
const skillRoutes = require('./routes/skillRoutes');
const revisionRoutes = require('./routes/revisionRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const failureRoutes = require('./routes/failureRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const readinessRoutes = require('./routes/readinessRoutes');
const riskRoutes = require('./routes/riskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsSnapshotRoutes = require('./routes/analyticsSnapshotRoutes');
const actionPlanRoutes = require('./routes/actionPlanRoutes');
const communityFailureRoutes = require('./routes/communityFailureRoutes');
const searchRoutes = require('./routes/searchRoutes');
const aiRoutes = require('./ai/routes/ai.routes');

const app = express();

app.set('trust proxy', 1);

// CORS - must be early to handle preflight before other middleware
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173'
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || process.env.NODE_ENV === 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.VERCEL_URL && origin.endsWith('.vercel.app')) return callback(null, true);
    callback(null, true);
  },
  credentials: true
}));

// Security headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);
app.use(express.json({ limit: '10kb' })); // Body payload limit
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Helix Preparation Intelligence API - Online' });
});

console.log('MOUNTING AUTH ROUTES');
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/failures', failureRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/readiness', readinessRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics/snapshots', analyticsSnapshotRoutes);
app.use('/api/action-plans', actionPlanRoutes);
app.use('/api/community-failures', communityFailureRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

// 404 Route Not Found handler
app.use((req, res, next) => {
  res.status(404).json({ message: `API Route Not Found - ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  
  res.status(statusCode).json({
    success: false,
    status,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

module.exports = app;
