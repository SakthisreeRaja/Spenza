const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: {
    type: String,
    default: 'folder'
  },
  color: {
    type: String,
    default: '#6B7280',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isDefault;
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  budget: {
    monthly: {
      type: Number,
      min: 0,
      default: 0
    },
    yearly: {
      type: Number,
      min: 0,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
categorySchema.index({ user: 1, name: 1 });
categorySchema.index({ isDefault: 1 });
categorySchema.index({ parentCategory: 1 });

// Compound unique index to prevent duplicate category names per user
categorySchema.index({ user: 1, name: 1 }, { 
  unique: true,
  partialFilterExpression: { user: { $exists: true } }
});

// Static method to create default categories for a user
categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = [
    { name: 'Food & Dining', icon: 'restaurant', color: '#F59E0B' },
    { name: 'Transportation', icon: 'car', color: '#3B82F6' },
    { name: 'Shopping', icon: 'shopping-bag', color: '#EC4899' },
    { name: 'Entertainment', icon: 'film', color: '#8B5CF6' },
    { name: 'Bills & Utilities', icon: 'receipt', color: '#EF4444' },
    { name: 'Healthcare', icon: 'heart', color: '#10B981' },
    { name: 'Education', icon: 'academic-cap', color: '#F97316' },
    { name: 'Travel', icon: 'airplane', color: '#06B6D4' },
    { name: 'Groceries', icon: 'shopping-cart', color: '#84CC16' },
    { name: 'Personal Care', icon: 'sparkles', color: '#F472B6' },
    { name: 'Home & Garden', icon: 'home', color: '#64748B' },
    { name: 'Gifts & Donations', icon: 'gift', color: '#DC2626' },
    { name: 'Other', icon: 'dots-horizontal', color: '#6B7280' }
  ];

  const categories = defaultCategories.map(cat => ({
    ...cat,
    user: userId,
    isDefault: true
  }));

  try {
    return await this.insertMany(categories);
  } catch (error) {
    // If categories already exist, return existing ones
    if (error.code === 11000) {
      return await this.find({ user: userId, isDefault: true });
    }
    throw error;
  }
};

// Static method to get user categories with expense totals
categorySchema.statics.getCategoriesWithTotals = async function(userId, startDate, endDate) {
  const match = { user: userId };
  const expenseMatch = { user: userId };
  
  if (startDate || endDate) {
    expenseMatch.date = {};
    if (startDate) expenseMatch.date.$gte = new Date(startDate);
    if (endDate) expenseMatch.date.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'expenses',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$category', '$$categoryId'] },
              ...expenseMatch
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ],
        as: 'expenseData'
      }
    },
    {
      $addFields: {
        totalSpent: { $ifNull: [{ $arrayElemAt: ['$expenseData.total', 0] }, 0] },
        expenseCount: { $ifNull: [{ $arrayElemAt: ['$expenseData.count', 0] }, 0] }
      }
    },
    {
      $project: {
        expenseData: 0
      }
    },
    { $sort: { totalSpent: -1 } }
  ]);
};

// Instance method to get subcategories
categorySchema.methods.getSubcategories = async function() {
  return await this.constructor.find({ parentCategory: this._id, isActive: true });
};

// Pre-save middleware to ensure parent category belongs to same user
categorySchema.pre('save', async function(next) {
  if (this.parentCategory && this.user) {
    const parentCategory = await this.constructor.findById(this.parentCategory);
    if (!parentCategory || !parentCategory.user.equals(this.user)) {
      const error = new Error('Parent category must belong to the same user');
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
