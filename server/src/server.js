require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Import jobs
const { initDecayJob } = require('./jobs/decayJob');
const { initReadinessJob } = require('./jobs/readinessJob');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect database
  await connectDB();

  // 2. Start background cron jobs
  initDecayJob();
  initReadinessJob();
  console.log('[Cron Scheduler] Active background monitoring loops initialized.');

  // 3. Listen on port
  app.listen(PORT, () => {
    console.log(`[Helix Server] Operational on port ${PORT} in ${process.env.NODE_ENV} mode.`);
  });
};

startServer();
