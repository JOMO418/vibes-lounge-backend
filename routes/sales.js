
const express = require('express');
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { emitSaleCreated, emitStockUpdated, emitProfitUpdated } = require('../socket/socketHandler');

const router = express.Router();

// @route   POST /api/sales
// @desc    Create new sale (multi-item cart)
// @access  Private (Admin & Manager)
router.post('/', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { items, paymentMethod } = req.body;
    
    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide items to sell' 
      });
    }
    
    if (!paymentMethod || !['cash', 'mpesa'].includes(paymentMethod)) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment method' 
      });
    }
    
    const salesRecords = [];
    let totalRevenue = 0;
    let totalProfit = 0;
    
    // Process each item in cart
    for (const item of items) {
      const { productId, quantity } = item;
      
      // Get product
      const product = await Product.findById(productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ 
          success: false, 
          message: `Product not found: ${productId}` 
        });
      }
      
      // Check stock
      if (product.quantity < quantity) {
        await session.abortTransaction();
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}` 
        });
      }
      
      // Calculate prices
      const unitPrice = product.price;
      const totalPrice = unitPrice * quantity;
      const buyingPrice = product.costPrice;
      const profit = (unitPrice - buyingPrice) * quantity;
      
      // Create sale record
      const sale = await Sale.create([{
        productId: product._id,
        productName: product.name,
        quantitySold: quantity,
        unitPrice,
        totalPrice,
        paymentMethod,
        buyingPrice,
        sellingPrice: unitPrice,
        profit,
        soldBy: req.user._id,
        soldByRole: req.user.role
      }], { session });
      
      salesRecords.push(sale[0]);
      
      // Update product quantity
      product.quantity -= quantity;
      await product.save({ session });
      
      totalRevenue += totalPrice;
      totalProfit += profit;
    }
    
    await session.commitTransaction();

    // ============================================
    // SOCKET.IO REAL-TIME UPDATES (NEW!)
    // ============================================
    
    // Get io instance
    const io = req.app.get('io');

    // 1. Emit sale created event
    emitSaleCreated(io, {
      sales: salesRecords,
      summary: {
        totalItems: items.length,
        totalRevenue,
        totalProfit,
        paymentMethod
      }
    });

    // 2. Emit stock updates for affected products
    for (const item of items) {
      const product = await Product.findById(item.productId);
      emitStockUpdated(io, {
        productId: product._id,
        productName: product.name,
        newQuantity: product.quantity
      });
    }

    // 3. Calculate and emit today's profit
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const profitData = await Sale.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startOfDay } 
        } 
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$profit' },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    emitProfitUpdated(io, {
      todayProfit: profitData[0]?.totalProfit || 0,
      todayRevenue: profitData[0]?.totalRevenue || 0
    });
    
    // ============================================
    
    res.status(201).json({
      success: true,
      message: 'Sale completed successfully',
      sales: salesRecords,
      summary: {
        totalItems: items.length,
        totalRevenue,
        totalProfit,
        paymentMethod
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create sale error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing sale' 
    });
  } finally {
    session.endSession();
  }
});

// @route   GET /api/sales/today/my-sales
// @desc    Get manager's sales for today
// @access  Private/Manager
router.get('/today/my-sales', protect, checkRole('manager'), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const sales = await Sale.find({
      soldBy: req.user._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });
    
    // Calculate totals
    const totalTransactions = sales.length;
    const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    
    res.json({
      success: true,
      sales,
      stats: {
        totalTransactions,
        totalItemsSold,
        totalRevenue,
        totalProfit
      }
    });
  } catch (error) {
    console.error('Get my sales error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sales' 
    });
  }
});

// @route   GET /api/sales/today/profit
// @desc    Get today's total profit (for both admin & manager)
// @access  Private
router.get('/today/profit', protect, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    let query = {
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };
    
    // Managers only see their own profit
    if (req.user.role === 'manager') {
      query.soldBy = req.user._id;
    }
    
    const result = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$profit' },
          totalRevenue: { $sum: '$totalPrice' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);
    
    const profit = result.length > 0 ? result[0].totalProfit : 0;
    const revenue = result.length > 0 ? result[0].totalRevenue : 0;
    const transactions = result.length > 0 ? result[0].totalTransactions : 0;
    
    res.json({
      success: true,
      todayProfit: profit,
      todayRevenue: revenue,
      todayTransactions: transactions
    });
  } catch (error) {
    console.error('Get today profit error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error calculating profit' 
    });
  }
});

// @route   GET /api/sales/all
// @desc    Get all sales with filters (Admin only)
// @access  Private/Admin
router.get('/all', protect, checkRole('admin'), async (req, res) => {
  try {
    const { dateFilter, paymentMethod, search, page = 1, limit = 50 } = req.query;
    
    let query = {};
    
    // Date filtering
    if (dateFilter) {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          query.createdAt = { $gte: startDate };
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = new Date(yesterday.setHours(0, 0, 0, 0));
          const endDate = new Date(yesterday.setHours(23, 59, 59, 999));
          query.createdAt = { $gte: startDate, $lte: endDate };
          break;
        case 'last7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          query.createdAt = { $gte: startDate };
          break;
        case 'last30days':
          startDate = new Date(now.setDate(now.getDate() - 30));
          query.createdAt = { $gte: startDate };
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          query.createdAt = { $gte: startDate };
          break;
      }
    }
    
    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    // Search by product name
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const sales = await Sale.find(query)
      .populate('soldBy', 'email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Sale.countDocuments(query);
    
    // Calculate totals for filtered results
    const totals = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalProfit: { $sum: '$profit' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);
    
    const summary = totals.length > 0 ? {
      totalRevenue: totals[0].totalRevenue,
      totalProfit: totals[0].totalProfit,
      totalTransactions: totals[0].totalTransactions,
      profitMargin: ((totals[0].totalProfit / totals[0].totalRevenue) * 100).toFixed(2)
    } : {
      totalRevenue: 0,
      totalProfit: 0,
      totalTransactions: 0,
      profitMargin: 0
    };
    
    res.json({
      success: true,
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      summary
    });
  } catch (error) {
    console.error('Get all sales error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sales' 
    });
  }
});

// @route   GET /api/sales/analytics
// @desc    Get sales analytics (charts data)
// @access  Private/Admin
router.get('/analytics', protect, checkRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const last7Days = new Date(now.setDate(now.getDate() - 7));
    
    // Revenue trends (last 7 days)
    const revenueTrends = await Sale.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          profit: { $sum: '$profit' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Category performance
    const categoryPerformance = await Sale.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          revenue: { $sum: '$totalPrice' },
          profit: { $sum: '$profit' },
          quantity: { $sum: '$quantitySold' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    // Best sellers (top 10)
    const bestSellers = await Sale.aggregate([
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          totalSold: { $sum: '$quantitySold' },
          revenue: { $sum: '$totalPrice' },
          profit: { $sum: '$profit' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      analytics: {
        revenueTrends,
        categoryPerformance,
        bestSellers
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics' 
    });
  }
});

module.exports = router;