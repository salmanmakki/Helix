// Vercel Serverless Function Entry Point
// This file runs INSTEAD of server.js on Vercel.
// server.js loads dotenv, but this file bypasses it — so we must load env vars here.
require('dotenv').config({ path: require('path').resolve(__dirname, '../server/.env') });

const app = require('../server/src/app');
const connectDB = require('../server/src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
    return;
  }
  return app(req, res);
};
