const { User, Category } = require('../models');
const bcrypt = require('bcryptjs');

const initializeApp = async () => {
  try {
    console.log('Initializing application...');

    // Check if admin user exists
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create admin user
      console.log('Creating admin user...');
      
      adminUser = await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@intelixir.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        isVerified: true,
        gdprConsent: true,
        gdprConsentDate: new Date()
      });

      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Initialize default categories
    const defaultCategories = [
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Latest developments in technology, AI, software, and innovation',
        color: '#00A4EF'
      },
      {
        name: 'Politics',
        slug: 'politics',
        description: 'Political news, government updates, and policy discussions',
        color: '#8B5CF6'
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'Business news, market updates, and economic insights',
        color: '#10B981'
      },
      {
        name: 'Sports',
        slug: 'sports',
        description: 'Sports news, match updates, and athletic achievements',
        color: '#F59E0B'
      },
      {
        name: 'Health',
        slug: 'health',
        description: 'Health news, medical breakthroughs, and wellness tips',
        color: '#EF4444'
      },
      {
        name: 'Science',
        slug: 'science',
        description: 'Scientific discoveries, research findings, and innovations',
        color: '#06B6D4'
      },
      {
        name: 'Entertainment',
        slug: 'entertainment',
        description: 'Entertainment news, celebrity updates, and cultural events',
        color: '#EC4899'
      },
      {
        name: 'World',
        slug: 'world',
        description: 'International news and global affairs',
        color: '#84CC16'
      }
    ];

    for (const categoryData of defaultCategories) {
      const existingCategory = await Category.findOne({ slug: categoryData.slug });
      
      if (!existingCategory) {
        await Category.create(categoryData);
        console.log(`Created category: ${categoryData.name}`);
      }
    }

    console.log('Application initialization completed successfully');

  } catch (error) {
    console.error('Error initializing application:', error);
  }
};

module.exports = initializeApp;