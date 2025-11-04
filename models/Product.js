const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    lowercase: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 5,
    min: [0, 'Reorder level cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  supplier: {
    type: String,
    trim: true,
    default: ''
  },
  barcode: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
  // Disable version key
  versionKey: false
});

// Indexes for better query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 });

// Virtual for profit margin percentage
productSchema.virtual('profitMargin').get(function() {
  if (this.costPrice === 0) return 0;
  return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Method to check if product is low stock
productSchema.methods.isLowStock = function() {
  return this.quantity <= this.reorderLevel;
};

// Static method to get low stock products
productSchema.statics.getLowStockProducts = function() {
  return this.find({ $expr: { $lte: ['$quantity', '$reorderLevel'] } });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;