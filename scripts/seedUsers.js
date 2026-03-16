// scripts/seedUsers.js
require('dotenv').config();
const connectDB = require('../config/db'); // adjust if your db file path differs
const User = require('../models/User');

async function run() {
  try {
    await connectDB();

    // remove predefined emails to avoid duplicates
    await User.deleteMany({
      email: { $in: ['admin@vybzlounge.co.ke', 'manager@vybzlounge.co.ke'] }
    });

    // Create users (passwords will be hashed by the model pre-save hook)
    await User.create([
      { email: 'admin@vybzlounge.co.ke', password:"password123" , role: 'admin' },
      { email: 'manager@vybzlounge.co.ke', password: 'password123', role: 'manager' }
    ]);

    console.log('✅ Seeded admin and manager (admin@vybzlounge.co.ke / password123)');
    process.exit(0);
  } catch (err) {
    console.error('Seed users error:', err);
    process.exit(1);
  }
}

run();