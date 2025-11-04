const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantitySold: {
    type: Number,
    required: [true, 'Quantity sold is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa'],
    required: [true, 'Payment method is required']
  },
  buyingPrice: {
    type: Number,
    required: [true, 'Buying price is required'],
    min: [0, 'Buying price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  profit: {
    type: Number,
    required: [true, 'Profit is required']
  },
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller ID is required']
  },
  soldByRole: {
    type: String,
    enum: ['admin', 'manager'],
    required: [true, 'Seller role is required']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better query performance
saleSchema.index({ createdAt: -1 });
saleSchema.index({ soldBy: 1, createdAt: -1 });
saleSchema.index({ productId: 1 });
saleSchema.index({ paymentMethod: 1 });

// Virtual for sale date (formatted)
saleSchema.virtual('saleDate').get(function() {
  return this.createdAt.toLocaleDateString('en-KE');
});

// Static method to get today's sales
saleSchema.statics.getTodaySales = function(userId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return this.find({
    soldBy: userId,
    createdAt: { $gte: todayStart, $lte: todayEnd }
  }).populate('productId', 'name').sort({ createdAt: -1 });
};

// Static method to calculate today's profit
saleSchema.statics.getTodayProfit = async function(userId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const result = await this.aggregate([
    { 
      $match: { 
        soldBy: mongoose.Types.ObjectId(userId), 
        createdAt: { $gte: todayStart, $lte: todayEnd } 
      } 
    },
    { 
      $group: { 
        _id: null, 
        totalProfit: { $sum: '$profit' },
        totalRevenue: { $sum: '$totalPrice' },
        totalSales: { $sum: 1 }
      } 
    }
  ]);

  return result[0] || { totalProfit: 0, totalRevenue: 0, totalSales: 0 };
};

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;