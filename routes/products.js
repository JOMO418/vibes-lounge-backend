
const express = require('express');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { emitProductUpdated } = require('../socket/socketHandler');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products (PUBLIC - for landing page)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = {};
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search by name if provided
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }
    
    const products = await Product.find(query).sort({ name: 1 });
    
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching products' 
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching product' 
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private/Admin only
router.post('/', protect, checkRole('admin','manager'), async (req, res) => {
  try {
    const { name, category, price, costPrice, quantity, description, imageUrl } = req.body;
    
    // Validate required fields
    if (!name || !category || !price || !costPrice || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }
    
    // Check if product already exists
    const existingProduct = await Product.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingProduct) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product with this name already exists' 
      });
    }
    
    const product = await Product.create({
      name,
      category,
      price,
      costPrice,
      quantity,
      description,
      imageUrl
    });

    // ============================================
    // SOCKET.IO REAL-TIME UPDATE (NEW!)
    // ============================================
    const io = req.app.get('io');
    emitProductUpdated(io, {
      action: 'created',
      product
    });
    // ============================================
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating product' 
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product

router.put('/:id', protect, checkRole('admin','manager'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Update fields
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // ============================================
    // SOCKET.IO REAL-TIME UPDATE (NEW!)
    // ============================================
    const io = req.app.get('io');
    emitProductUpdated(io, {
      action: 'updated',
      product: updatedProduct
    });
    // ============================================
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating product' 
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin only
router.delete('/:id', protect, checkRole('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    await Product.findByIdAndDelete(req.params.id);

    // ============================================
    // SOCKET.IO REAL-TIME UPDATE (NEW!)
    // ============================================
    const io = req.app.get('io');
    emitProductUpdated(io, {
      action: 'deleted',
      productId: req.params.id
    });
    // ============================================
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting product' 
    });
  }
});

// @route   GET /api/products/stats/low-stock
// @desc    Get products with low stock (< 5)
// @access  Private
router.get('/stats/low-stock', protect, async (req, res) => {
  try {
    const lowStockProducts = await Product.find({ quantity: { $lt: 5 } })
      .select('name category quantity')
      .sort({ quantity: 1 });
    
    res.json({
      success: true,
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching low stock products' 
    });
  }
});

module.exports = router;