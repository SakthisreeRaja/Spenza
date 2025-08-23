const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
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

// @route   GET /api/expenses
// @desc    Get user's expenses with filtering and pagination
// @access  Private
router.get('/', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be a positive number'),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be a positive number')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      paymentMethod,
      search
    } = req.query;

    // Build filter object
    const filter = { user: req.user._id };

    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get expenses with pagination
    const expenses = await Expense.find(filter)
      .populate('category', 'name icon color')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Expense.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      status: 'success',
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching expenses'
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('category', 'name icon color');

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }

    res.json({
      status: 'success',
      data: { expense }
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching expense'
    });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', auth, [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other'])
    .withMessage('Invalid payment method'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      category,
      date,
      paymentMethod,
      location,
      tags,
      notes
    } = req.body;

    // Verify category belongs to user
    const categoryDoc = await Category.findOne({
      _id: category,
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ]
    });

    if (!categoryDoc) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category'
      });
    }

    const expense = new Expense({
      user: req.user._id,
      title,
      description,
      amount,
      currency: req.user.currency || 'USD',
      category,
      date: date || new Date(),
      paymentMethod,
      location,
      tags,
      notes
    });

    await expense.save();

    // Populate category info
    await expense.populate('category', 'name icon color');

    res.status(201).json({
      status: 'success',
      message: 'Expense created successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating expense'
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', auth, [
  body('title')
    .optional()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'other'])
    .withMessage('Invalid payment method')
], handleValidationErrors, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }

    // If category is being updated, verify it belongs to user
    if (req.body.category) {
      const categoryDoc = await Category.findOne({
        _id: req.body.category,
        $or: [
          { user: req.user._id },
          { isDefault: true }
        ]
      });

      if (!categoryDoc) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid category'
        });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'amount', 'category', 'date',
      'paymentMethod', 'location', 'tags', 'notes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });

    await expense.save();

    // Populate category info
    await expense.populate('category', 'name icon color');

    res.json({
      status: 'success',
      message: 'Expense updated successfully',
      data: { expense }
    });

  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating expense'
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({
        status: 'error',
        message: 'Expense not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting expense'
    });
  }
});

// @route   GET /api/expenses/stats/summary
// @desc    Get expense statistics summary
// @access  Private
router.get('/stats/summary', auth, [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
], handleValidationErrors, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get total expenses
    const totalData = await Expense.getTotalByUser(req.user._id, startDate, endDate);

    // Get expenses by category
    const categoryData = await Expense.getByCategory(req.user._id, startDate, endDate);

    // Get monthly trend for current year
    const currentYear = new Date().getFullYear();
    const monthlyTrend = await Expense.getMonthlyTrend(req.user._id, currentYear);

    res.json({
      status: 'success',
      data: {
        summary: {
          totalAmount: totalData.total,
          totalTransactions: totalData.count,
          averagePerTransaction: totalData.count > 0 ? totalData.total / totalData.count : 0
        },
        categoryBreakdown: categoryData,
        monthlyTrend
      }
    });

  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching expense statistics'
    });
  }
});

// @route   GET /api/expenses/stats/recent
// @desc    Get recent expenses
// @access  Private
router.get('/stats/recent', auth, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const recentExpenses = await Expense.find({ user: req.user._id })
      .populate('category', 'name icon color')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      status: 'success',
      data: { recentExpenses }
    });

  } catch (error) {
    console.error('Get recent expenses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching recent expenses'
    });
  }
});

module.exports = router;
