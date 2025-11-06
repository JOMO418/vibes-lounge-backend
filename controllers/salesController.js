const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// ===============================
// @desc    Create multi-item sale (supports split payment)
// ===============================
const createSale = async (req, res) => {
  try {
    const { items, paymentMethods } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // ===== VALIDATION =====
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items array required' });
    }

    if (!paymentMethods || typeof paymentMethods !== 'object') {
      return res.status(400).json({ message: 'Payment methods required' });
    }

    const cashAmount = parseFloat(paymentMethods.cash) || 0;
    const mpesaAmount = parseFloat(paymentMethods.mpesa) || 0;

    if (cashAmount < 0 || mpesaAmount < 0) {
      return res.status(400).json({ message: 'Payment amounts cannot be negative' });
    }

    if (cashAmount === 0 && mpesaAmount === 0) {
      return res.status(400).json({ message: 'At least one payment method required' });
    }

    // ===== ITEM VALIDATION =====
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

    // ===== SALE CREATION =====
    const totalSaleAmount = validatedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const createdSales = [];

    for (const item of validatedItems) {
      const { product, quantity, unitPrice, buyingPrice, totalPrice, profit } = item;

      const proportionalCash = cashAmount * (totalPrice / totalSaleAmount);
      const proportionalMpesa = mpesaAmount * (totalPrice / totalSaleAmount);

      const sale = await Sale.create({
        productId: product._id,
        productName: product.name,
        quantitySold: quantity,
        unitPrice,
        totalPrice,
        paymentMethods: {
          cash: proportionalCash,
          mpesa: proportionalMpesa
        },
        buyingPrice,
        profit,
        soldBy: userId,
        soldByRole: userRole,
      });

      // Update stock
      product.quantity -= quantity;
      await product.save();

      createdSales.push(sale);
    }
    const io = req.app.get('io');
if (io) {
  io.emit('saleCreated', {
    sales: createdSales,
    summary: {
      totalRevenue: createdSales.reduce((sum, s) => sum + s.totalPrice, 0),
      totalProfit: createdSales.reduce((sum, s) => sum + s.profit, 0),
      totalItems: createdSales.reduce((sum, s) => sum + s.quantitySold, 0),
    }
  });
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

// ===============================
// @desc    Get manager's sales today
// ===============================
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
      .lean();

    res.json({ success: true, count: sales.length, sales });
  } catch (error) {
    console.error('Get today sales error:', error);
    res.status(500).json({ message: 'Server error fetching sales' });
  }
};

// ===============================
// @desc    Get manager's total profit today
// ===============================
const getTodayProfit = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const totalProfit = await Sale.aggregate([
      {
        $match: {
          soldBy: new mongoose.Types.ObjectId(req.user._id),
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

// ===============================
// @desc    Get all sales (admin) with optional date filters
// ===============================
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

// ===============================
// @desc    Get analytics (last 7 days revenue/profit by day)
// ===============================
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
// ===============================
// @desc    Delete a sale (admin/manager only) and reverse stock
// ===============================
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid sale ID' });
    }

    // Find the sale and populate product
    const sale = await Sale.findById(id).populate('productId');
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Permission check (admin or manager)
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Insufficient permissions to delete sales' });
    }

    // Reverse stock: Add quantity back to product
    if (sale.productId) {
      sale.productId.quantity += sale.quantitySold;
      await sale.productId.save();
    }

    // Delete the sale
    await Sale.findByIdAndDelete(id);

    // Optional: Emit socket event for real-time UI updates
    const io = req.app.get('io');
    if (io) {
      io.emit('saleDeleted', { 
        saleId: id, 
        productId: sale.productId?._id,
        quantityReturned: sale.quantitySold 
      });
    }

    res.json({ 
      success: true, 
      message: `Sale deleted. ${sale.quantitySold} units returned to stock for ${sale.productName}.` 
    });

  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ message: 'Server error deleting sale' });
  }
};

module.exports = {
  createSale,
  getTodaySales,
  getTodayProfit,
  getAllSales,
  getAnalytics
};
