const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
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

// @route   GET /api/budgets
// @desc    Get user's budgets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { active, period } = req.query;
    
    const filter = { user: req.user._id };
    if (active !== undefined) filter.isActive = active === 'true';
    if (period) filter.period = period;

    const budgets = await Budget.find(filter)
      .populate('categories.category', 'name icon color')
      .sort({ startDate: -1 });

    res.json({
      status: 'success',
      data: { budgets }
    });

  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching budgets'
    });
  }
});

// @route   GET /api/budgets/current
// @desc    Get current active budgets
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const currentBudgets = await Budget.getCurrentBudgets(req.user._id);

    // Get spending data for each budget
    const budgetsWithSpending = await Promise.all(
      currentBudgets.map(budget => 
        Budget.getBudgetWithSpending(budget._id, req.user._id)
      )
    );

    res.json({
      status: 'success',
      data: { budgets: budgetsWithSpending }
    });

  } catch (error) {
    console.error('Get current budgets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching current budgets'
    });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get single budget with spending data
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.getBudgetWithSpending(req.params.id, req.user._id);

    if (!budget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found'
      });
    }

    res.json({
      status: 'success',
      data: { budget }
    });

  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching budget'
    });
  }
});

// @route   POST /api/budgets
// @desc    Create new budget
// @access  Private
router.post('/', auth, [
  body('name')
    .notEmpty()
    .withMessage('Budget name is required')
    .isLength({ max: 100 })
    .withMessage('Budget name cannot exceed 100 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Budget amount must be greater than 0'),
  body('period')
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid budget period'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('categories')
    .isArray({ min: 1 })
    .withMessage('At least one category is required'),
  body('categories.*.category')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('categories.*.allocatedAmount')
    .isFloat({ min: 0 })
    .withMessage('Allocated amount must be a positive number'),
  body('alertThresholds.warning')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Warning threshold must be between 0 and 100'),
  body('alertThresholds.critical')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Critical threshold must be between 0 and 100')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      name,
      description,
      amount,
      period,
      startDate,
      endDate,
      categories,
      alertThresholds,
      autoRenew,
      notes
    } = req.body;

    // Validate date range
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'End date must be after start date'
      });
    }

    // Validate categories belong to user
    const categoryIds = categories.map(cat => cat.category);
    const validCategories = await Category.find({
      _id: { $in: categoryIds },
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ]
    });

    if (validCategories.length !== categoryIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'One or more invalid categories'
      });
    }

    // Validate allocated amounts don't exceed total budget
    const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
    if (totalAllocated > amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Total allocated amount cannot exceed budget amount'
      });
    }

    const budget = new Budget({
      user: req.user._id,
      name,
      description,
      amount,
      currency: req.user.currency || 'USD',
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      categories,
      alertThresholds: {
        warning: alertThresholds?.warning || 80,
        critical: alertThresholds?.critical || 95
      },
      autoRenew: autoRenew || false,
      notes
    });

    await budget.save();

    // Populate category info
    await budget.populate('categories.category', 'name icon color');

    res.status(201).json({
      status: 'success',
      message: 'Budget created successfully',
      data: { budget }
    });

  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating budget'
    });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', auth, [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Budget name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Budget name cannot exceed 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Budget amount must be greater than 0'),
  body('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid budget period'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one category is required'),
  body('categories.*.category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('categories.*.allocatedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Allocated amount must be a positive number')
], handleValidationErrors, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found'
      });
    }

    // Validate date range if dates are being updated
    const newStartDate = req.body.startDate ? new Date(req.body.startDate) : budget.startDate;
    const newEndDate = req.body.endDate ? new Date(req.body.endDate) : budget.endDate;

    if (newEndDate <= newStartDate) {
      return res.status(400).json({
        status: 'error',
        message: 'End date must be after start date'
      });
    }

    // If categories are being updated, validate them
    if (req.body.categories) {
      const categoryIds = req.body.categories.map(cat => cat.category);
      const validCategories = await Category.find({
        _id: { $in: categoryIds },
        $or: [
          { user: req.user._id },
          { isDefault: true }
        ]
      });

      if (validCategories.length !== categoryIds.length) {
        return res.status(400).json({
          status: 'error',
          message: 'One or more invalid categories'
        });
      }

      // Validate allocated amounts
      const newAmount = req.body.amount || budget.amount;
      const totalAllocated = req.body.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
      
      if (totalAllocated > newAmount) {
        return res.status(400).json({
          status: 'error',
          message: 'Total allocated amount cannot exceed budget amount'
        });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'amount', 'period', 'startDate', 'endDate',
      'categories', 'alertThresholds', 'isActive', 'autoRenew', 'notes'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          budget[field] = new Date(req.body[field]);
        } else {
          budget[field] = req.body[field];
        }
      }
    });

    await budget.save();

    // Populate category info
    await budget.populate('categories.category', 'name icon color');

    res.json({
      status: 'success',
      message: 'Budget updated successfully',
      data: { budget }
    });

  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating budget'
    });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        status: 'error',
        message: 'Budget not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Budget deleted successfully'
    });

  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting budget'
    });
  }
});

// @route   GET /api/budgets/stats/overview
// @desc    Get budget overview and alerts
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const currentBudgets = await Budget.getCurrentBudgets(req.user._id);
    
    // Get spending data for each budget
    const budgetsWithSpending = await Promise.all(
      currentBudgets.map(budget => 
        Budget.getBudgetWithSpending(budget._id, req.user._id)
      )
    );

    // Calculate overview statistics
    const stats = {
      totalBudgets: budgetsWithSpending.length,
      totalBudgetAmount: budgetsWithSpending.reduce((sum, budget) => sum + budget.amount, 0),
      totalSpent: budgetsWithSpending.reduce((sum, budget) => sum + (budget.spentAmount || 0), 0),
      budgetsOnTrack: budgetsWithSpending.filter(budget => budget.status === 'on_track').length,
      budgetsAtWarning: budgetsWithSpending.filter(budget => budget.status === 'warning').length,
      budgetsAtCritical: budgetsWithSpending.filter(budget => budget.status === 'critical').length,
      budgetsExceeded: budgetsWithSpending.filter(budget => budget.isExceeded && budget.isExceeded()).length
    };

    // Get alerts for budgets approaching or exceeding limits
    const alerts = budgetsWithSpending
      .filter(budget => budget.status === 'warning' || budget.status === 'critical')
      .map(budget => ({
        budgetId: budget._id,
        budgetName: budget.name,
        status: budget.status,
        spentPercentage: budget.spentPercentage,
        spentAmount: budget.spentAmount,
        totalAmount: budget.amount,
        daysRemaining: budget.daysRemaining
      }));

    res.json({
      status: 'success',
      data: {
        overview: stats,
        alerts,
        budgets: budgetsWithSpending
      }
    });

  } catch (error) {
    console.error('Get budget overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching budget overview'
    });
  }
});

module.exports = router;
