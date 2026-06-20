const mongoose = require('mongoose');
const dns = require('dns');

// Force Google's public DNS resolution to avoid querySrv ECONNREFUSED errors with Atlas SRV connections
dns.setServers(['8.8.8.8', '8.8.4.4']);

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) return cachedConnection;
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/helix');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    cachedConnection = conn;
    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    if (process.env.VERCEL) throw error;
    process.exit(1);
  }
};

module.exports = connectDB;
