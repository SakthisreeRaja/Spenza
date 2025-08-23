const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'Spenza Backend API is working!',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection test
app.get('/api/db-test', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      res.json({
        status: 'success',
        message: 'Database connected successfully',
        dbState: 'connected'
      });
    } else {
      res.json({
        status: 'warning',
        message: 'Database not connected',
        dbState: mongoose.connection.readyState
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection error',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

// Try to connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spenza', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch(err => {
  console.log('⚠️  MongoDB connection failed:', err.message);
  console.log('📝 Note: Make sure MongoDB is running or update MONGODB_URI in .env');
});

app.listen(PORT, () => {
  console.log(`🚀 Spenza Backend running on port ${PORT}`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔗 DB test endpoint: http://localhost:${PORT}/api/db-test`);
});

module.exports = app;
