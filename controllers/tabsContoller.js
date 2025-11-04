const CustomerTab = require('../models/CustomerTab');

// Create new tab
const createTab = async (req, res) => {
  try {
    const tab = await CustomerTab.create({ ...req.body, recordedBy: req.user._id });
    res.status(201).json({ success: true, data: tab });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Create tab error:', error);
    res.status(500).json({ message: 'Server error creating tab' });
  }
};

// Get my tabs (manager)
const getMyTabs = async (req, res) => {
  try {
    const tabs = await CustomerTab.find({ recordedBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, count: tabs.length, data: tabs });
  } catch (error) {
    console.error('Get tabs error:', error);
    res.status(500).json({ message: 'Server error fetching tabs' });
  }
};

// Update tab
const updateTab = async (req, res) => {
  try {
    const tab = await CustomerTab.findOneAndUpdate(
      { _id: req.params.id, recordedBy: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!tab) {
      return res.status(404).json({ message: 'Tab not found or not yours' });
    }
    res.json({ success: true, data: tab });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Update tab error:', error);
    res.status(500).json({ message: 'Server error updating tab' });
  }
};

// Record payment on tab
const recordPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount required' });
    }

    const tab = await CustomerTab.findOne({ _id: req.params.id, recordedBy: req.user._id });
    if (!tab) {
      return res.status(404).json({ message: 'Tab not found or not yours' });
    }

    tab.amountPaid += amount;
    tab.updatedAt = new Date();
    await tab.save();

    res.json({ success: true, data: tab });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error recording payment' });
  }
};

// Delete tab
const deleteTab = async (req, res) => {
  try {
    const tab = await CustomerTab.findOneAndDelete({
      _id: req.params.id,
      $or: [{ recordedBy: req.user._id }, { recordedBy: { $exists: true } }]
    });
    if (!tab) {
      return res.status(404).json({ message: 'Tab not found' });
    }
    res.json({ success: true, message: 'Tab deleted' });
  } catch (error) {
    console.error('Delete tab error:', error);
    res.status(500).json({ message: 'Server error deleting tab' });
  }
};

// Get summary (totals)
const getSummary = async (req, res) => {
  try {
    const summary = await CustomerTab.aggregate([
      { $match: { recordedBy: req.user._id } },
      {
        $group: {
          _id: null,
          totalOwed: { $sum: '$amountOwed' },
          totalPaid: { $sum: '$amountPaid' },
          totalDue: { $sum: { $subtract: ['$amountOwed', '$amountPaid'] } },
          unpaidCount: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $eq: ['$status', 'partially_paid'] }, 1, 0] } },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } }
        }
      }
    ]);

    const data = summary[0] || {
      totalOwed: 0,
      totalPaid: 0,
      totalDue: 0,
      unpaidCount: 0,
      partialCount: 0,
      paidCount: 0
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Server error fetching summary' });
  }
};

module.exports = {
  createTab,
  getMyTabs,
  updateTab,
  recordPayment,
  deleteTab,
  getSummary
};