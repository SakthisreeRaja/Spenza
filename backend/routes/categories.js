const express = require('express');
const { body, validationResult } = require('express-validator');
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

// @route   GET /api/categories
// @desc    Get user's categories
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ],
      isActive: true
    }).sort({ isDefault: -1, name: 1 });

    res.json({
      status: 'success',
      data: { categories }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching categories'
    });
  }
});

// @route   GET /api/categories/with-totals
// @desc    Get categories with expense totals
// @access  Private
router.get('/with-totals', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const categoriesWithTotals = await Category.getCategoriesWithTotals(
      req.user._id,
      startDate,
      endDate
    );

    res.json({
      status: 'success',
      data: { categories: categoriesWithTotals }
    });

  } catch (error) {
    console.error('Get categories with totals error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching categories with totals'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ]
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    res.json({
      status: 'success',
      data: { category }
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching category'
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private
router.post('/', auth, [
  body('name')
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('icon')
    .optional()
    .notEmpty()
    .withMessage('Icon cannot be empty'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please provide a valid hex color'),
  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, description, icon, color, parentCategory } = req.body;

    // Check if category name already exists for this user
    const existingCategory = await Category.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true
    });

    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: 'Category name already exists'
      });
    }

    // If parent category is specified, verify it belongs to user
    if (parentCategory) {
      const parent = await Category.findOne({
        _id: parentCategory,
        $or: [
          { user: req.user._id },
          { isDefault: true }
        ]
      });

      if (!parent) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid parent category'
        });
      }
    }

    const category = new Category({
      name,
      description,
      icon: icon || 'folder',
      color: color || '#6B7280',
      user: req.user._id,
      parentCategory
    });

    await category.save();

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: { category }
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', auth, [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Category name cannot exceed 50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('icon')
    .optional()
    .notEmpty()
    .withMessage('Icon cannot be empty'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Please provide a valid hex color'),
  body('parentCategory')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID')
], handleValidationErrors, async (req, res) => {
  try {
    // Find category that belongs to the user (not default categories)
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDefault: false
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found or cannot be modified'
      });
    }

    // Check if new name already exists (if name is being changed)
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({
        user: req.user._id,
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
        _id: { $ne: category._id },
        isActive: true
      });

      if (existingCategory) {
        return res.status(400).json({
          status: 'error',
          message: 'Category name already exists'
        });
      }
    }

    // If parent category is being updated, verify it belongs to user
    if (req.body.parentCategory) {
      const parent = await Category.findOne({
        _id: req.body.parentCategory,
        $or: [
          { user: req.user._id },
          { isDefault: true }
        ]
      });

      if (!parent) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid parent category'
        });
      }

      // Prevent circular reference
      if (req.body.parentCategory === category._id.toString()) {
        return res.status(400).json({
          status: 'error',
          message: 'Category cannot be its own parent'
        });
      }
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'icon', 'color', 'parentCategory'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        category[field] = req.body[field];
      }
    });

    await category.save();

    res.json({
      status: 'success',
      message: 'Category updated successfully',
      data: { category }
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while updating category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find category that belongs to the user (not default categories)
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
      isDefault: false
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found or cannot be deleted'
      });
    }

    // Check if category has expenses
    const Expense = require('../models/Expense');
    const expenseCount = await Expense.countDocuments({ category: category._id });

    if (expenseCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete category. It has ${expenseCount} associated expenses. Please reassign or delete those expenses first.`
      });
    }

    // Check if category has subcategories
    const subcategories = await Category.find({ parentCategory: category._id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete category. It has subcategories. Please delete subcategories first.'
      });
    }

    // Soft delete: mark as inactive
    category.isActive = false;
    await category.save();

    res.json({
      status: 'success',
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while deleting category'
    });
  }
});

// @route   GET /api/categories/:id/subcategories
// @desc    Get subcategories of a category
// @access  Private
router.get('/:id/subcategories', auth, async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { isDefault: true }
      ]
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    const subcategories = await category.getSubcategories();

    res.json({
      status: 'success',
      data: { subcategories }
    });

  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while fetching subcategories'
    });
  }
});

// @route   POST /api/categories/setup-defaults
// @desc    Set up default categories for user (in case they weren't created during registration)
// @access  Private
router.post('/setup-defaults', auth, async (req, res) => {
  try {
    // Check if user already has default categories
    const existingDefaults = await Category.find({
      user: req.user._id,
      isDefault: true
    });

    if (existingDefaults.length > 0) {
      return res.json({
        status: 'success',
        message: 'Default categories already exist',
        data: { categories: existingDefaults }
      });
    }

    // Create default categories
    const defaultCategories = await Category.createDefaultCategories(req.user._id);

    res.status(201).json({
      status: 'success',
      message: 'Default categories created successfully',
      data: { categories: defaultCategories }
    });

  } catch (error) {
    console.error('Setup default categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error while setting up default categories'
    });
  }
});

module.exports = router;
