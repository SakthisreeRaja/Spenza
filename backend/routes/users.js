const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/users/profile
// @desc    Get user profile (same as /api/auth/me)
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        user: req.user.getProfile()
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'])
    .withMessage('Invalid currency'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Invalid date of birth format')
], handleValidationErrors, async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber', 'dateOfBirth', 'currency'];
    const updates = {};

    // Only include allowed fields
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Handle email update separately (might need verification)
    if (req.body.email && req.body.email !== req.user.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: req.user._id }
      });

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already exists'
        });
      }

      updates.email = req.body.email;
      updates.isEmailVerified = false; // Reset email verification
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: user.getProfile()
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during profile update'
    });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const Expense = require('../models/Expense');
    const Budget = require('../models/Budget');
    const Category = require('../models/Category');

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get this month's expenses
    const monthlyExpenses = await Expense.getTotalByUser(
      req.user._id, 
      startOfMonth, 
      endOfMonth
    );

    // Get recent expenses (last 5)
    const recentExpenses = await Expense.find({ user: req.user._id })
      .populate('category', 'name icon color')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get current budgets
    const currentBudgets = await Budget.getCurrentBudgets(req.user._id);
    
    // Get spending by category for current month
    const categorySpending = await Expense.getByCategory(
      req.user._id,
      startOfMonth,
      endOfMonth
    );

    // Get total expenses for this year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearlyExpenses = await Expense.getTotalByUser(
      req.user._id,
      startOfYear
    );

    // Calculate budget status
    const budgetStatus = currentBudgets.length > 0 ? {
      totalBudgets: currentBudgets.length,
      // Add more budget calculations as needed
    } : null;

    res.json({
      status: 'success',
      data: {
        user: req.user.getProfile(),
        monthlySpending: {
          amount: monthlyExpenses.total,
          transactions: monthlyExpenses.count
        },
        yearlySpending: {
          amount: yearlyExpenses.total,
          transactions: yearlyExpenses.count
        },
        recentExpenses,
        categorySpending: categorySpending.slice(0, 5), // Top 5 categories
        budgetStatus,
        summary: {
          totalExpensesThisMonth: monthlyExpenses.total,
          totalExpensesThisYear: yearlyExpenses.total,
          averagePerTransaction: monthlyExpenses.count > 0 
            ? monthlyExpenses.total / monthlyExpenses.count 
            : 0,
          activeBudgets: currentBudgets.length
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/users/settings
// @desc    Get user settings and preferences
// @access  Private
router.get('/settings', auth, async (req, res) => {
  try {
    const user = req.user.getProfile();
    
    const settings = {
      profile: {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        currency: user.currency,
        isEmailVerified: user.isEmailVerified
      },
      preferences: {
        currency: user.currency,
        // Add more user preferences as needed
      },
      security: {
        lastLogin: user.lastLogin,
        isEmailVerified: user.isEmailVerified,
        accountCreated: user.createdAt
      }
    };

    res.json({
      status: 'success',
      data: { settings }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching settings'
    });
  }
});

// @route   PUT /api/users/settings
// @desc    Update user settings and preferences
// @access  Private
router.put('/settings', auth, [
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'])
    .withMessage('Invalid currency')
], handleValidationErrors, async (req, res) => {
  try {
    const allowedUpdates = ['currency']; // Add more settings as needed
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid settings to update'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: {
        user: user.getProfile()
      }
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during settings update'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const Expense = require('../models/Expense');
    const Budget = require('../models/Budget');
    const Category = require('../models/Category');

    const { period = 'month' } = req.query;
    
    let startDate, endDate;
    const now = new Date();

    // Calculate date range based on period
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Get expense statistics
    const totalExpenses = await Expense.getTotalByUser(req.user._id, startDate, endDate);
    const categoryBreakdown = await Expense.getByCategory(req.user._id, startDate, endDate);
    
    // Get budget information
    const activeBudgets = await Budget.getCurrentBudgets(req.user._id);
    
    // Get category count
    const categoryCount = await Category.countDocuments({
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ],
      isActive: true
    });

    const stats = {
      period,
      dateRange: { startDate, endDate },
      expenses: {
        total: totalExpenses.total,
        count: totalExpenses.count,
        average: totalExpenses.count > 0 ? totalExpenses.total / totalExpenses.count : 0
      },
      categories: {
        total: categoryCount,
        breakdown: categoryBreakdown
      },
      budgets: {
        active: activeBudgets.length,
        // Add budget-specific stats as needed
      }
    };

    res.json({
      status: 'success',
      data: { stats }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching user statistics'
    });
  }
});

module.exports = router;
