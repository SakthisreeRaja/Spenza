const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// In-memory data storage (temporary for development)
let users = [];
let expenses = [];
let categories = [
  { id: '1', name: 'Food', color: '#FF6B6B', userId: null },
  { id: '2', name: 'Transport', color: '#4ECDC4', userId: null },
  { id: '3', name: 'Entertainment', color: '#45B7D1', userId: null },
  { id: '4', name: 'Shopping', color: '#96CEB4', userId: null },
  { id: '5', name: 'Bills', color: '#FFEAA7', userId: null }
];
let budgets = [];

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8081', 
    'exp://192.168.1.100:8081',
    'exp://10.77.221.151:8081',
    'http://10.77.221.151:8081'
  ],
  credentials: true
}));
app.use(express.json());

// JWT Secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key-here';

// Helper function to generate unique IDs
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Spenza API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ 
        status: 'error',
        message: 'User already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: generateId(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(user);

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        token,
        user: {
          _id: user.id,
          id: user.id,
          username: user.username,
          email: user.email,
          currency: 'USD',
          isActive: true,
          isEmailVerified: false,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.createdAt.toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Server error', 
      errors: [error.message] 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    const user = users.find(u => u.email === emailOrUsername || u.username === emailOrUsername);
    if (!user) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: user.id,
          id: user.id,
          username: user.username,
          email: user.email,
          currency: 'USD',
          isActive: true,
          isEmailVerified: false,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.createdAt.toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Server error', 
      errors: [error.message] 
    });
  }
});

// Expense Routes
app.post('/api/expenses', authenticateToken, (req, res) => {
  try {
    const { amount, description, category, date } = req.body;
    
    const expense = {
      id: generateId(),
      userId: req.user.userId,
      amount: parseFloat(amount),
      description,
      category,
      date: date || new Date(),
      createdAt: new Date()
    };

    expenses.push(expense);
    res.status(201).json({ message: 'Expense created successfully', expense });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/expenses', authenticateToken, (req, res) => {
  try {
    const userExpenses = expenses.filter(e => e.userId === req.user.userId);
    res.json({ expenses: userExpenses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Category Routes
app.get('/api/categories', authenticateToken, (req, res) => {
  try {
    // Return default categories for now
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Spenza Simple Backend Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Network access: http://10.77.221.151:${PORT}/health`);
  console.log(`📱 No MongoDB required - using in-memory storage`);
});

module.exports = app;
