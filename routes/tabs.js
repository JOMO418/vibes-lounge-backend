
const express = require('express');
const CustomerTab = require('../models/CustomerTab');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { emitTabCreated, emitTabUpdated } = require('../socket/socketHandler');

const router = express.Router();

// @route   POST /api/tabs
// @desc    Create new customer tab
// @access  Private (Admin & Manager)
router.post('/', protect, async (req, res) => {
  try {
    const { customerName, customerPhone, productName, quantity, amountOwed, dateDue, notes } = req.body;
    
    // Validate required fields
    if (!customerName || !productName || !quantity || !amountOwed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }
    
    const tab = await CustomerTab.create({
      customerName,
      customerPhone,
      productName,
      quantity,
      amountOwed,
      dateDue,
      notes,
      recordedBy: req.user._id
    });

    // ============================================
    // SOCKET.IO REAL-TIME UPDATE (NEW!)
    // ============================================
    const io = req.app.get('io');
    emitTabCreated(io, tab);
    // ============================================
    
    res.status(201).json({
      success: true,
      message: 'Customer tab created successfully',
      tab
    });
  } catch (error) {
    console.error('Create tab error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating customer tab' 
    });
  }
});

// @route   GET /api/tabs
// @desc    Get all tabs (managers see only their tabs)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // Managers only see tabs they recorded
    if (req.user.role === 'manager') {
      query.recordedBy = req.user._id;
    }
    
    const tabs = await CustomerTab.find(query)
      .populate('recordedBy', 'email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tabs.length,
      tabs
    });
  } catch (error) {
    console.error('Get tabs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching customer tabs' 
    });
  }
});

// @route   GET /api/tabs/summary
// @desc    Get tabs summary (totals)
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    let query = {};
    
    // Managers only see their tabs
    if (req.user.role === 'manager') {
      query.recordedBy = req.user._id;
    }
    
    const result = await CustomerTab.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: { $subtract: ['$amountOwed', '$amountPaid'] } },
          totalPaid: { $sum: '$amountPaid' },
          totalOwed: { $sum: '$amountOwed' },
          activeCustomers: { $sum: 1 }
        }
      }
    ]);
    
    const summary = result.length > 0 ? result[0] : {
      totalOutstanding: 0,
      totalPaid: 0,
      totalOwed: 0,
      activeCustomers: 0
    };
    
    // Get today's paid amount
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayQuery = { ...query, updatedAt: { $gte: startOfDay } };
    const todayPaid = await CustomerTab.aggregate([
      { $match: todayQuery },
      {
        $group: {
          _id: null,
          paidToday: { $sum: '$amountPaid' }
        }
      }
    ]);
    
    summary.paidToday = todayPaid.length > 0 ? todayPaid[0].paidToday : 0;
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get tabs summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tabs summary' 
    });
  }
});

// @route   PUT /api/tabs/:id
// @desc    Update customer tab
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let tab = await CustomerTab.findById(req.params.id);
    
    if (!tab) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer tab not found' 
      });
    }
    
    // Managers can only edit their own tabs
    if (req.user.role === 'manager' && tab.recordedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to edit this tab' 
      });
    }
    
    tab = await CustomerTab.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // ============================================
    // SOCKET.IO REAL-TIME UPDATE (NEW!)
    // ============================================
    const io = req.app.get('io');
    emitTabUpdated(io, tab);
    // ============================================
    
    res.json({
      success: true,
      message: 'Customer tab updated successfully',
      tab
    });
  } catch (error) {
    console.error('Update tab error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating customer tab' 
    });
  }
});

// @route   PATCH /api/tabs/:id/payment
// @desc    Record payment for tab
// @access  Private
router.patch('/:id/payment', protect, async (req, res) => {
  try {
    const { amountPaid } = req.body;
    
    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide valid payment amount' 
      });
    }
    
    const tab = await CustomerTab.findById(req.params.id);
    
    if (!tab) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer tab not found' 
      });
    }
    
    // Managers can only update their own tabs
    if (req.user.role === 'manager' && tab.recordedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this tab' 
      });
    }
    
    // Update payment
    tab.amountPaid += amountPaid;
    
    // Update status
    if (tab.amountPaid >= tab.amountOwed) {
      tab.status = 'paid';
      tab.amountPaid = tab.amountOwed; // Cap at amount owed
    } else if (tab.amountPaid > 0) {
      tab.status = 'partially_paid';
    }
    
    await tab.save();

    // ============================================
    // SOCKET.IO REAL-TIME UPDATE (NEW!)
    // ============================================
    const io = req.app.get('io');
    emitTabUpdated(io, tab);
    // ============================================
    
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      tab
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error recording payment' 
    });
  }
});

// @route   DELETE /api/tabs/:id
// @desc    Delete customer tab
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const tab = await CustomerTab.findById(req.params.id);
    
    if (!tab) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer tab not found' 
      });
    }
    
    // Managers can only delete their own tabs
    if (req.user.role === 'manager' && tab.recordedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this tab' 
      });
    }
    
    await CustomerTab.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Customer tab deleted successfully'
    });
  } catch (error) {
    console.error('Delete tab error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting customer tab' 
    });
  }
});

module.exports = router;