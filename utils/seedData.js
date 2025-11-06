const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/Product');

const seedData = async () => {
  try {
    await connectDB();
    // Clear existing products only (leave users intact)
    await Product.deleteMany({});
    console.log('🗑️ Cleared existing products');
    
    // Create products from real inventory (using provided selling prices and stock; cost prices from Greenvine PDF)
    const products = await Product.create([
      // Wine
      {
        name: '4th Street Red 1500ml',
        category: 'wine',
        price: 2000,
        costPrice: 1600,
        quantity: 0,
        description: 'Rich red wine in large bottle'
      },
      {
        name: '4th Street White 750ml',
        category: 'wine',
        price: 1500,
        costPrice: 914,
        quantity: 0,
        description: 'Crisp white wine'
      },
      // Whiskey
      {
        name: '8 PM WHISKY 1 Litre',
        category: 'whiskey',
        price: 1750,
        costPrice: 1250,
        quantity: 0,
        description: 'Smooth blended whiskey'
      },
      {
        name: '8 PM WHISKY 750ML',
        category: 'whiskey',
        price: 1600,
        costPrice: 1050,
        quantity: 0,
        description: 'Classic blended whiskey'
      },
      // Spirits
      {
        name: 'Baileys Cream 1 Litre',
        category: 'spirits',
        price: 3600,
        costPrice: 2600,
        quantity: 0,
        description: 'Irish cream liqueur'
      },
      // Beer
      {
        name: 'Balozi Bottle',
        category: 'beer',
        price: 300,
        costPrice: 169,
        quantity: 0,
        description: 'Local lager bottle'
      },
      // Gin
      {
        name: 'Best Dry Gin 250ml',
        category: 'gin',
        price: 450,
        costPrice: 268,
        quantity: 0,
        description: 'Dry gin mini'
      },
      {
        name: 'Best Dry Gin 750ml',
        category: 'gin',
        price: 1250,
        costPrice: 746,
        quantity: 1,
        description: 'Premium dry gin'
      },
      // Whiskey
      {
        name: 'Best Whiskey 250ml',
        category: 'whiskey',
        price: 450,
        costPrice: 315,
        quantity: 0,
        description: 'Blended whiskey mini'
      },
      {
        name: 'Best Whiskey 750ml',
        category: 'whiskey',
        price: 1400,
        costPrice: 952,
        quantity: 0,
        description: 'Quality blended whiskey'
      },
      // Whiskey
      {
        name: 'Black & White 350ml',
        category: 'whiskey',
        price: 900,
        costPrice: 585,
        quantity: 0,
        description: 'Classic Scotch blend'
      },
      {
        name: 'Black & White 750ml',
        category: 'whiskey',
        price: 1600,
        costPrice: 1140,
        quantity: 0,
        description: 'Iconic blended Scotch'
      },
      // Whiskey
      {
        name: 'Black Label 375ml',
        category: 'whiskey',
        price: 2000,
        costPrice: 1680,
        quantity: 0,
        description: 'Premium Scotch half-bottle'
      },
      {
        name: 'Black Label 750ml',
        category: 'whiskey',
        price: 5000,
        costPrice: 3120,
        quantity: 0,
        description: 'Deluxe blended Scotch'
      },
      // Vodka
      {
        name: 'Blue Ice 250ml',
        category: 'vodka',
        price: 200,
        costPrice: 150,
        quantity: 8,
        description: 'Smooth flavored vodka'
      },
      {
        name: 'Blue Ice Shot',
        category: 'vodka',
        price: 50,
        costPrice: 50, // Estimated for shot (not in PDF)
        quantity: 10,
        description: 'Single shot of Blue Ice'
      },
      // Whiskey
      {
        name: 'Bond 7 250ml',
        category: 'whiskey',
        price: 600,
        costPrice: 425,
        quantity: 0,
        description: 'Blended whiskey mini'
      },
      {
        name: 'Bond 7 350ml',
        category: 'whiskey',
        price: 750,
        costPrice: 576,
        quantity: 0,
        description: 'Portable blended whiskey'
      },
      {
        name: 'Bond 7 750ml',
        category: 'whiskey',
        price: 1700,
        costPrice: 1260,
        quantity: 0,
        description: 'Smooth Scotch blend'
      },
      // Rum
      {
        name: 'Captain Morgan 250ml',
        category: 'rum',
        price: 450,
        costPrice: 337,
        quantity: 0,
        description: 'Spiced rum mini'
      },
      {
        name: 'Captain Morgan 750ml',
        category: 'rum',
        price: 1500,
        costPrice: 1900, // Note: PDF has 1900 for spiced 750, but inventory 1500 sell; using PDF
        quantity: 0,
        description: 'Original spiced rum'
      },
      // Vodka (noted as Gin in name, but category vodka per inventory)
      {
        name: 'Caribia Gin 250ml',
        category: 'vodka',
        price: 350,
        costPrice: 247, // Approx from 246.64
        quantity: 0,
        description: 'Flavored spirit mini'
      },
      {
        name: 'Caribia Gin 750ml',
        category: 'vodka',
        price: 1100,
        costPrice: 740,
        quantity: 0,
        description: 'Caribbean-style spirit'
      },
      // Wine
      {
        name: 'Carprice Red Sweet 1 ltr',
        category: 'wine',
        price: 1350,
        costPrice: 930,
        quantity: 0,
        description: 'Sweet red wine (Caprice variant)'
      },
      {
        name: 'Carprice Red Dry 1 ltr',
        category: 'wine',
        price: 1300,
        costPrice: 911,
        quantity: 0,
        description: 'Dry red wine (Caprice variant)'
      },
      // Gin
      {
        name: 'Chrome Gin 250ml',
        category: 'gin',
        price: 300,
        costPrice: 210,
        quantity: 0,
        description: 'Kenyan gin mini'
      },
      {
        name: 'Chrome Gin 750ml',
        category: 'gin',
        price: 900,
        costPrice: 580,
        quantity: 1,
        description: 'Premium chrome gin'
      },
      {
        name: 'Chrome Gin shot',
        category: 'gin',
        price: 75,
        costPrice: 70, // Estimated for shot
        quantity: 6,
        description: 'Single shot of Chrome Gin'
      },
      // Vodka
      {
        name: 'Chrome Vodka 250ml',
        category: 'vodka',
        price: 300,
        costPrice: 210,
        quantity: 0,
        description: 'Kenyan vodka mini'
      },
      {
        name: 'Chrome Vodka 750ml',
        category: 'vodka',
        price: 900,
        costPrice: 580,
        quantity: 2,
        description: 'Clear chrome vodka'
      },
      {
        name: 'Chrome Vodka shot',
        category: 'vodka',
        price: 75,
        costPrice: 70, // Estimated for shot
        quantity: 6,
        description: 'Single shot of Chrome Vodka'
      },
      // Vodka
      {
        name: 'Clubman 250ml',
        category: 'vodka',
        price: 350,
        costPrice: 270,
        quantity: 0,
        description: 'Clubman vodka mini'
      },
      // Spirits
      {
        name: 'County 250ml',
        category: 'spirits',
        price: 300,
        costPrice: 238,
        quantity: 3,
        description: 'Local county spirit'
      },
      {
        name: 'County 750ml',
        category: 'spirits',
        price: 800,
        costPrice: 670,
        quantity: 3,
        description: 'Premium county spirit'
      },
      {
        name: 'County Shot',
        category: 'spirits',
        price: 75,
        costPrice: 80, // Estimated for shot
        quantity: 8,
        description: 'Single shot of County'
      },
      // Spirits
      {
        name: 'Dallas Brandy 250ml',
        category: 'spirits',
        price: 180,
        costPrice: 125,
        quantity: 5,
        description: 'Affordable brandy'
      },
      {
        name: 'Dallas Shot',
        category: 'spirits',
        price: 50,
        costPrice: 40, // Estimated for shot
        quantity: 0,
        description: 'Single shot of Dallas Brandy'
      },
      // Vodka
      {
        name: 'Flirt Vodka 750ml',
        category: 'vodka',
        price: 1300,
        costPrice: 800, // From FLIRT VODKA 750ML variants in PDF
        quantity: 0,
        description: 'Flavored flirt vodka'
      },
      // Gin
      {
        name: 'Gilbeys 250ml',
        category: 'gin',
        price: 600,
        costPrice: 420,
        quantity: 1,
        description: 'London dry gin mini'
      },
      // Gin
      {
        name: 'Gordons 750ml',
        category: 'gin',
        price: 2600,
        costPrice: 2050,
        quantity: 0,
        description: 'Classic Gordon\'s gin'
      },
      // Beer
      {
        name: 'Guinness Bottle',
        category: 'beer',
        price: 280,
        costPrice: 169,
        quantity: 1,
        description: 'Smooth Guinness stout'
      },
      {
        name: 'Guinness Can',
        category: 'beer',
        price: 280,
        costPrice: 223,
        quantity: 3,
        description: 'Classic stout can'
      },
      // Whiskey
      {
        name: 'Hunters Whiskey 350ml',
        category: 'whiskey',
        price: 750,
        costPrice: 445,
        quantity: 0,
        description: 'Hunters blended whiskey'
      },
      {
        name: 'Hunters Whisky 250ml',
        category: 'whiskey',
        price: 450,
        costPrice: 310,
        quantity: 3,
        description: 'Smooth whiskey mini'
      },
      {
        name: 'Hunters Whisky 750ml',
        category: 'whiskey',
        price: 1400,
        costPrice: 925,
        quantity: 1,
        description: 'Premium blended whiskey'
      },
      // Whiskey
      {
        name: 'Imperial Blue 750ml',
        category: 'whiskey',
        price: 1600,
        costPrice: 1000,
        quantity: 0,
        description: 'Indian blended whiskey'
      },
      // Whiskey
      {
        name: 'Jack Daniels 1 litre',
        category: 'whiskey',
        price: 6000,
        costPrice: 3300,
        quantity: 0,
        description: 'Tennessee whiskey large'
      },
      {
        name: 'Jack Daniels 750ml',
        category: 'whiskey',
        price: 5000,
        costPrice: 2800,
        quantity: 0,
        description: 'Iconic Tennessee whiskey'
      },
      // Whiskey
      {
        name: 'Jameson 1 litre',
        category: 'whiskey',
        price: 5000,
        costPrice: 3200,
        quantity: 0,
        description: 'Irish whiskey large'
      },
      {
        name: 'Jameson 750ml',
        category: 'whiskey',
        price: 3500,
        costPrice: 2500,
        quantity: 0,
        description: 'Triple distilled Irish whiskey'
      },
      // Spirits
      {
        name: 'KC Ginger 250ml',
        category: 'spirits',
        price: 350,
        costPrice: 260,
        quantity: 1,
        description: 'Ginger flavored cane'
      },
      {
        name: 'KC Ginger 750ml',
        category: 'spirits',
        price: 1100,
        costPrice: 695,
        quantity: 1,
        description: 'Lemon ginger cane spirit'
      },
      // Spirits
      {
        name: 'KC Pineapple 250ml',
        category: 'spirits',
        price: 350,
        costPrice: 260,
        quantity: 3,
        description: 'Pineapple flavored cane'
      },
      {
        name: 'KC Pineapple 750ml',
        category: 'spirits',
        price: 800,
        costPrice: 695,
        quantity: 2,
        description: 'Pineapple cane spirit'
      },
      // Spirits
      {
        name: 'KC Smooth 250ml',
        category: 'spirits',
        price: 350,
        costPrice: 260,
        quantity: 4,
        description: 'Original smooth cane'
      },
      // Spirits
      {
        name: 'Kenya Cane Ginger Shot',
        category: 'spirits',
        price: 90,
        costPrice: 90, // Estimated for shot
        quantity: 0,
        description: 'Ginger cane shot'
      },
      {
        name: 'Kenya Cane Pinapple Shot',
        category: 'spirits',
        price: 90,
        costPrice: 90, // Estimated for shot
        quantity: 8,
        description: 'Pineapple cane shot'
      },
      {
        name: 'Kenya Cane Smooth Shot',
        category: 'spirits',
        price: 90,
        costPrice: 90, // Estimated for shot
        quantity: 8,
        description: 'Smooth cane shot'
      },
      // Cider
      {
        name: 'KO Apple & Lime',
        category: 'cider',
        price: 350,
        costPrice: 245,
        quantity: 4,
        description: 'Apple and lime flavored'
      },
      // Spirits
      {
        name: 'KO Honey Lemon',
        category: 'spirits',
        price: 350,
        costPrice: 245,
        quantity: 3,
        description: 'Honey lemon KO'
      },
      // Vodka
      {
        name: 'Konyagi 250ml',
        category: 'vodka',
        price: 350,
        costPrice: 235,
        quantity: 0,
        description: 'Tanzanian spirit mini'
      },
      {
        name: 'Konyagi 750ml',
        category: 'vodka',
        price: 1200,
        costPrice: 730,
        quantity: 0,
        description: 'Traditional Konyagi'
      },
      // Whiskey
      {
        name: 'Reserve 7 750ml',
        category: 'whiskey',
        price: 1500,
        costPrice: 850,
        quantity: 0,
        description: 'Blended reserve whiskey'
      },
      // Spirits
      {
        name: 'Richots Brandy 750ml',
        category: 'spirits',
        price: 1800,
        costPrice: 1280,
        quantity: 0,
        description: 'Richot brandy'
      },
      {
        name: 'Richots 250ml',
        category: 'spirits',
        price: 650,
        costPrice: 419,
        quantity: 0,
        description: 'Richot mini'
      },
      {
        name: 'Richots 350ml',
        category: 'spirits',
        price: 1000,
        costPrice: 590,
        quantity: 0,
        description: 'Richot portable'
      },
      // Spirits
      {
        name: 'Smirnoff Ice',
        category: 'spirits',
        price: 280,
        costPrice: 159,
        quantity: 4,
        description: 'Classic malt beverage'
      },
      // Beer
      {
        name: 'Smirnoff Ice Guarana',
        category: 'beer',
        price: 300,
        costPrice: 178,
        quantity: 4,
        description: 'Guarana flavored ice'
      },
      // Spirits
      {
        name: 'Smirnoff Pineapple Punch',
        category: 'spirits',
        price: 300,
        costPrice: 159,
        quantity: 2,
        description: 'Pineapple punch'
      },
      // Cider
      {
        name: 'Tusker Cider Bottle',
        category: 'cider',
        price: 320,
        costPrice: 222,
        quantity: 0,
        description: 'Tusker apple cider'
      },
      // Beer
      {
        name: 'Tusker Cider Can',
        category: 'beer',
        price: 300,
        costPrice: 238,
        quantity: 0,
        description: 'Cider in can'
      },
      {
        name: 'Tusker Lager',
        category: 'beer',
        price: 280,
        costPrice: 169,
        quantity: 0,
        description: 'Kenyan lager bottle'
      },
      {
        name: 'Tusker Lager Can',
        category: 'beer',
        price: 350,
        costPrice: 207,
        quantity: 3,
        description: 'Lager in can'
      },
      {
        name: 'Tusker Lite Bottle',
        category: 'beer',
        price: 300,
        costPrice: 187,
        quantity: 0,
        description: 'Light lager bottle'
      },
      // Spirits
      {
        name: 'V&A 250ml',
        category: 'spirits',
        price: 400,
        costPrice: 300,
        quantity: 0,
        description: 'V&A mini spirit'
      },
      {
        name: 'V&A 750ml',
        category: 'spirits',
        price: 1300,
        costPrice: 780,
        quantity: 0,
        description: 'V&A premium spirit'
      },
      // Whiskey
      {
        name: 'VAT I Litre',
        category: 'whiskey',
        price: 2500,
        costPrice: 1900,
        quantity: 0,
        description: 'VAT 69 large'
      },
      {
        name: 'VAT 375ml',
        category: 'whiskey',
        price: 1200,
        costPrice: 765,
        quantity: 0,
        description: 'VAT 69 half-bottle'
      },
      {
        name: 'VAT 750ml',
        category: 'whiskey',
        price: 1800,
        costPrice: 1400,
        quantity: 0,
        description: 'Blended Scotch VAT 69'
      },
      // Spirits
      {
        name: 'Viceroy 250ml',
        category: 'spirits',
        price: 800,
        costPrice: 440,
        quantity: 0,
        description: 'Viceroy mini'
      },
      {
        name: 'Viceroy 350ml',
        category: 'spirits',
        price: 1000,
        costPrice: 640,
        quantity: 0,
        description: 'Viceroy portable'
      },
      {
        name: 'Viceroy 750ml',
        category: 'whiskey',
        price: 1500,
        costPrice: 1250,
        quantity: 2,
        description: 'Blended Viceroy whiskey'
      },
      // Beer
      {
        name: 'White Cap Bottle',
        category: 'beer',
        price: 300,
        costPrice: 196,
        quantity: 2,
        description: 'White Cap lager'
      },
      {
        name: 'White Cap can',
        category: 'beer',
        price: 300,
        costPrice: 227,
        quantity: 0,
        description: 'White Cap lager can'
      },
      // Spirits
      {
        name: 'White Pearl 250ml',
        category: 'spirits',
        price: 350,
        costPrice: 218,
        quantity: 0,
        description: 'White Pearl mini'
      },
      {
        name: 'White Pearl 750ml',
        category: 'spirits',
        price: 1000,
        costPrice: 650,
        quantity: 0,
        description: 'Clear white pearl spirit'
      }
    ]);
    console.log('✅ Created 86 products from real inventory');
    console.log('\n🎉 SEED DATA COMPLETE!');
    console.log('\n🔧 Login Credentials (unchanged):');
    console.log('admin: zack@vibeslounge.co.ke / fem2025');
    console.log('manager: vanessa@vibeslounge.co.ke / nessa2025');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();