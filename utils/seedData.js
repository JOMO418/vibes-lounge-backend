const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users (passwords will be hashed by pre-save hook)
    const users = await User.create([
      
      {
        email: 'zack@vibeslounge.co.ke',
        password: 'fem2025',
        role: 'admin'
      },
      {
        email: 'vanessa@vibeslounge.co.ke',
        password: 'nessa2025',
        role: 'manager'
      }
    ]);
    console.log('✅ Created 2 users ( zack & vanessa)');

    // Create products from inventory (using Greenvine price list for cost prices)
    const products = await Product.create([
      // Whiskey
      {
        name: 'Viceroy 750ml',
        category: 'whiskey',
        price: 1500,
        costPrice: 1250,
        quantity: 1,
        description: 'Premium blended whiskey'
      },
      {
        name: 'Hunters Whisky 750ml',
        category: 'whiskey',
        price: 1100,
        costPrice: 925,
        quantity: 1,
        description: 'Smooth blended whiskey'
      },
      {
        name: 'Hunters Whisky 250ml',
        category: 'whiskey',
        price: 400,
        costPrice: 310,
        quantity: 3,
        description: 'Smooth blended whiskey'
      },

      // Beer & Cider
      {
        name: 'Guinness Can',
        category: 'beer',
        price: 280,
        costPrice: 223,
        quantity: 3,
        description: 'Classic Irish stout'
      },
      {
        name: 'Guinness Bottle',
        category: 'beer',
        price: 250,
        costPrice: 169,
        quantity: 1,
        description: 'Classic Irish stout'
      },
      {
        name: 'Tusker Cider',
        category: 'cider',
        price: 280,
        costPrice: 222,
        quantity: 2,
        description: 'Refreshing apple cider'
      },
      {
        name: 'White Cap',
        category: 'beer',
        price: 250,
        costPrice: 196,
        quantity: 0,
        description: 'Classic Kenyan lager'
      },

      // Ready to Drink / Flavored
      {
        name: 'KO Lime',
        category: 'spirits',
        price: 300,
        costPrice: 245,
        quantity: 4,
        description: 'Lime & ginger flavored drink'
      },
      {
        name: 'KO Honey Lemon',
        category: 'spirits',
        price: 300,
        costPrice: 245,
        quantity: 3,
        description: 'Honey and lemon flavored'
      },
      {
        name: 'Pineapple Punch',
        category: 'spirits',
        price: 300,
        costPrice: 250,
        quantity: 3,
        description: 'Sweet pineapple flavored drink'
      },
      {
        name: 'Smirnoff Ice',
        category: 'spirits',
        price: 280,
        costPrice: 159,
        quantity: 4,
        description: 'Premium malt beverage'
      },

      // Spirits - County
      {
        name: 'County 750ml',
        category: 'spirits',
        price: 800,
        costPrice: 670,
        quantity: 3,
        description: 'Local premium spirit'
      },
      {
        name: 'County 250ml',
        category: 'spirits',
        price: 300,
        costPrice: 238,
        quantity: 8,
        description: 'Local premium spirit'
      },

      // Gin
      {
        name: 'Chrome Gin 750ml',
        category: 'gin',
        price: 700,
        costPrice: 580,
        quantity: 1,
        description: 'Premium Kenyan gin'
      },
      {
        name: 'Chrome Gin 250ml',
        category: 'gin',
        price: 280,
        costPrice: 210,
        quantity: 2,
        description: 'Premium Kenyan gin'
      },
      {
        name: 'Best Dry Gin 750ml',
        category: 'gin',
        price: 900,
        costPrice: 746,
        quantity: 1,
        description: 'Quality dry gin'
      },
      {
        name: 'Gilbeys 250ml',
        category: 'gin',
        price: 500,
        costPrice: 420,
        quantity: 2,
        description: 'Classic London Dry Gin'
      },

      // Kenya Cane variants
      {
        name: 'KC Ginger 750ml',
        category: 'spirits',
        price: 800,
        costPrice: 680,
        quantity: 2,
        description: 'Lemon ginger flavored spirit'
      },
      {
        name: 'KC Ginger 250ml',
        category: 'spirits',
        price: 300,
        costPrice: 260,
        quantity: 4,
        description: 'Lemon ginger flavored spirit'
      },
      {
        name: 'KC Pineapple 750ml',
        category: 'spirits',
        price: 800,
        costPrice: 695,
        quantity: 2,
        description: 'Pineapple flavored spirit'
      },
      {
        name: 'KC Pineapple 250ml',
        category: 'spirits',
        price: 300,
        costPrice: 260,
        quantity: 6,
        description: 'Pineapple flavored spirit'
      },
      {
        name: 'KC Smooth 250ml',
        category: 'spirits',
        price: 300,
        costPrice: 260,
        quantity: 7,
        description: 'Original Kenya Cane'
      },

      // Vodka
      {
        name: 'Chrome Vodka 750ml',
        category: 'vodka',
        price: 700,
        costPrice: 580,
        quantity: 2,
        description: 'Premium Kenyan vodka'
      },
      {
        name: 'Chrome Vodka 250ml',
        category: 'vodka',
        price: 280,
        costPrice: 210,
        quantity: 3,
        description: 'Premium Kenyan vodka'
      },
      {
        name: 'Blue Ice',
        category: 'vodka',
        price: 180,
        costPrice: 150,
        quantity: 11,
        description: 'Smooth vodka'
      },

      // Brandy
      {
        name: 'Dallas Brandy 250ml',
        category: 'spirits',
        price: 180,
        costPrice: 125,
        quantity: 5,
        description: 'Affordable brandy'
      }
    ]);
    console.log('✅ Created 26 products from inventory');

    console.log('\n🎉 SEED DATA COMPLETE!');
    console.log('\n🔧 Login Credentials:');
   
    console.log('admin: zack@vibeslounge.co.ke / fem2025');
    console.log('manager: vanessa@vibeslounge.co.ke / nessa2025');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();