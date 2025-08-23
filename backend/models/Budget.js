const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Budget name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0.01, 'Budget amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']
  },
  period: {
    type: String,
    required: [true, 'Budget period is required'],
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  categories: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  alertThresholds: {
    warning: {
      type: Number,
      min: 0,
      max: 100,
      default: 80 // 80% of budget
    },
    critical: {
      type: Number,
      min: 0,
      max: 100,
      default: 95 // 95% of budget
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better performance
budgetSchema.index({ user: 1, startDate: -1 });
budgetSchema.index({ user: 1, period: 1 });
budgetSchema.index({ endDate: 1 });
budgetSchema.index({ isActive: 1 });

// Virtual for remaining amount
budgetSchema.virtual('remainingAmount').get(function() {
  return this.amount - (this.spentAmount || 0);
});

// Virtual for spending percentage
budgetSchema.virtual('spentPercentage').get(function() {
  if (!this.spentAmount || this.amount === 0) return 0;
  return Math.round((this.spentAmount / this.amount) * 100);
});

// Virtual for budget status
budgetSchema.virtual('status').get(function() {
  const percentage = this.spentPercentage;
  
  if (percentage >= this.alertThresholds.critical) return 'critical';
  if (percentage >= this.alertThresholds.warning) return 'warning';
  if (percentage > 0) return 'on_track';
  return 'not_started';
});

// Virtual for days remaining
budgetSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Static method to get current budgets for user
budgetSchema.statics.getCurrentBudgets = async function(userId) {
  const today = new Date();
  
  return await this.find({
    user: userId,
    isActive: true,
    startDate: { $lte: today },
    endDate: { $gte: today }
  }).populate('categories.category');
};

// Static method to get budget with spending data
budgetSchema.statics.getBudgetWithSpending = async function(budgetId, userId) {
  const budget = await this.findOne({ 
    _id: budgetId, 
    user: userId 
  }).populate('categories.category');

  if (!budget) return null;

  // Get total spending for this budget period
  const Expense = mongoose.model('Expense');
  const totalSpending = await Expense.aggregate([
    {
      $match: {
        user: userId,
        date: {
          $gte: budget.startDate,
          $lte: budget.endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Get spending by category for this budget
  const categorySpending = await Expense.aggregate([
    {
      $match: {
        user: userId,
        date: {
          $gte: budget.startDate,
          $lte: budget.endDate
        },
        category: { 
          $in: budget.categories.map(cat => cat.category._id || cat.category) 
        }
      }
    },
    {
      $group: {
        _id: '$category',
        spent: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Add spending data to budget object
  const budgetObj = budget.toObject();
  budgetObj.spentAmount = totalSpending[0]?.total || 0;
  
  // Add spending data to each category
  budgetObj.categories = budgetObj.categories.map(cat => {
    const spending = categorySpending.find(
      cs => cs._id.toString() === (cat.category._id || cat.category).toString()
    );
    
    return {
      ...cat,
      spentAmount: spending?.spent || 0,
      transactionCount: spending?.count || 0,
      remainingAmount: cat.allocatedAmount - (spending?.spent || 0)
    };
  });

  return budgetObj;
};

// Instance method to check if budget is exceeded
budgetSchema.methods.isExceeded = function() {
  return this.spentAmount > this.amount;
};

// Instance method to get alert level
budgetSchema.methods.getAlertLevel = function() {
  const percentage = this.spentPercentage;
  
  if (percentage >= this.alertThresholds.critical) return 'critical';
  if (percentage >= this.alertThresholds.warning) return 'warning';
  return 'normal';
};

// Pre-save validation
budgetSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  
  // Validate that allocated amounts don't exceed total budget
  const totalAllocated = this.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
  if (totalAllocated > this.amount) {
    return next(new Error('Total allocated amount cannot exceed budget amount'));
  }
  
  next();
});

// Ensure virtual fields are serialized
budgetSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Budget', budgetSchema);
