const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Create multi-item sale (no transaction for local Mongo)
const createSale = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array required' });
    }
    if (!['cash', 'mpesa'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Pre-validate all items before processing any
    const validatedItems = [];
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: `Invalid product ID: ${productId}` });
      }
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }

      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }
      
      if (product.quantity < quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${quantity}` 
        });
      }

      validatedItems.push({
        product,
        quantity,
        unitPrice: product.price,
        buyingPrice: product.costPrice,
        totalPrice: product.price * quantity,
        profit: (product.price - product.costPrice) * quantity
      });
    }

    // All items validated, now process them
    const createdSales = [];

    for (const item of validatedItems) {
      const { product, quantity, unitPrice, buyingPrice, totalPrice, profit } = item;

      // Create sale record
      const sale = await Sale.create({
        productId: product._id,
        productName: product.name,
        quantitySold: quantity,
        unitPrice,
        totalPrice,
        paymentMethod,
        buyingPrice,
        sellingPrice: unitPrice,
        profit,
        soldBy: userId,
        soldByRole: userRole,
      });

      // Update product stock
      product.quantity -= quantity;
      await product.save();

      createdSales.push(sale);
    }

    res.status(201).json({ 
      success: true, 
      count: createdSales.length, 
      data: createdSales,
      message: 'Sale completed successfully'
    });

  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ 
      message: 'Server error creating sale', 
      error: error.message 
    });
  }
};

// Get manager's sales today
const getTodaySales = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      soldBy: req.user._id,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    })
    .populate('productId', 'name')
    .sort({ createdAt: -1 })
    .lean(); // Use lean() for better performance

    res.json({ success: true, count: sales.length, sales: sales });
  } catch (error) {
    console.error('Get today sales error:', error);
    res.status(500).json({ message: 'Server error fetching sales' });
  }
};

// Get manager's today profit total
const getTodayProfit = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalProfit = await Sale.aggregate([
      { 
        $match: { 
          soldBy: mongoose.Types.ObjectId(req.user._id), 
          createdAt: { $gte: todayStart, $lte: todayEnd } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalProfit: { $sum: '$profit' } 
        } 
      }
    ]);

    const profit = totalProfit[0]?.totalProfit || 0;
    res.json({ success: true, data: { todayProfit: profit } });
  } catch (error) {
    console.error('Get today profit error:', error);
    res.status(500).json({ message: 'Server error fetching profit' });
  }
};

// Get all sales (admin) with date filters
const getAllSales = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    let filter = {};

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: from };
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filter.createdAt = { ...filter.createdAt, $lte: to };
    }

    const sales = await Sale.find(filter)
      .populate('productId', 'name category')
      .populate('soldBy', 'email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    console.error('Get all sales error:', error);
    res.status(500).json({ message: 'Server error fetching sales' });
  }
};

// Get analytics (last 7 days revenue/profit by day)
const getAnalytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const analytics = await Sale.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalPrice' },
          totalProfit: { $sum: '$profit' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } },
      {
        $project: {
          date: '$_id',
          revenue: '$totalRevenue',
          profit: '$totalProfit',
          salesCount: 1,
          _id: 0
        }
      }
    ]);

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

module.exports = {
  createSale,
  getTodaySales,
  getTodayProfit,
  getAllSales,
  getAnalytics
};