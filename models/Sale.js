const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  quantitySold: Number,
  unitPrice: Number,
  totalPrice: Number,
  paymentMethods: {
    cash: { type: Number, default: 0 },
    mpesa: { type: Number, default: 0 }
  },
  buyingPrice: Number,
  profit: Number,
  soldBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  soldByRole: String
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);