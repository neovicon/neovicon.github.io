const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { User, Post, Category, Contact, EmailDigest } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const newsService = require('../services/newsService');
const emailService = require('../services/emailService');

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get basic counts
    const [
      totalUsers,
      totalPosts,
      totalCategories,
      todayUsers,
      todayPosts,
      weeklyUsers,
      weeklyPosts,
      pendingContacts
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      Post.countDocuments({ createdAt: { $gte: startOfDay }, isActive: true }),
      User.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Post.countDocuments({ createdAt: { $gte: startOfWeek }, isActive: true }),
      Contact.countDocuments({ status: 'new' })
    ]);

    // Get user engagement stats
    const userEngagement = await User.aggregate([
      {
        $group: {
          _id: null,
          verifiedUsers: { $sum: { $cond: ['$isVerified', 1, 0] } },
          unverifiedUsers: { $sum: { $cond: ['$isVerified', 0, 1] } },
          avgInterestsPerUser: { $avg: { $size: '$interests' } }
        }
      }
    ]);

    // Get top categories by post count
    const topCategories = await Category.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'categories',
          as: 'posts'
        }
      },
      {
        $project: {
          name: 1,
          color: 1,
          postCount: { $size: '$posts' }
        }
      },
      { $sort: { postCount: -1 } },
      { $limit: 5 }
    ]);

    // Get recent activity
    const recentPosts = await Post.find({ isActive: true })
      .populate('author', 'name email')
      .populate('categories', 'name color')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email isVerified createdAt');

    // Calculate growth percentages
    const lastWeekStart = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekUsers = await User.countDocuments({ 
      createdAt: { $gte: lastWeekStart, $lt: startOfWeek } 
    });
    const userGrowth = lastWeekUsers > 0 ? 
      ((weeklyUsers - lastWeekUsers) / lastWeekUsers * 100).toFixed(1) : 0;

    const lastWeekPosts = await Post.countDocuments({ 
      createdAt: { $gte: lastWeekStart, $lt: startOfWeek }, 
      isActive: true 
    });
    const postGrowth = lastWeekPosts > 0 ? 
      ((weeklyPosts - lastWeekPosts) / lastWeekPosts * 100).toFixed(1) : 0;

    res.json({
      status: 'success',
      data: {
        overview: {
          totalUsers,
          totalPosts,
          totalCategories,
          pendingContacts
        },
        today: {
          users: todayUsers,
          posts: todayPosts
        },
        weekly: {
          users: weeklyUsers,
          posts: weeklyPosts
        },
        growth: {
          users: userGrowth,
          posts: postGrowth
        },
        engagement: userEngagement[0] || {
          verifiedUsers: 0,
          unverifiedUsers: 0,
          avgInterestsPerUser: 0
        },
        topCategories,
        recentActivity: {
          posts: recentPosts,
          users: recentUsers
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get users with pagination and filtering
// @access  Admin
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ max: 100 }),
  query('status').optional().isIn(['all', 'verified', 'unverified']),
  query('role').optional().isIn(['all', 'user', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, status, role } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status && status !== 'all') {
      query.isVerified = status === 'verified';
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('interests', 'name color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNextPage: page < Math.ceil(totalUsers / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user verification status
// @access  Admin
router.put('/users/:id/status', [
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { isVerified } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    user.isVerified = isVerified;
    await user.save();

    res.json({
      status: 'success',
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/admin/posts
// @desc    Get posts with admin filters
// @access  Admin
router.get('/posts', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ max: 100 }),
  query('category').optional().isMongoId(),
  query('status').optional().isIn(['all', 'active', 'inactive']),
  query('type').optional().isIn(['all', 'text', 'image', 'link', 'news']),
  query('reported').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, category, status, type, reported } = req.query;

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.categories = category;
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    if (reported === 'true') {
      query.reportedBy = { $exists: true, $ne: [] };
    }

    const posts = await Post.find(query)
      .populate('author', 'name email profilePicture')
      .populate('categories', 'name color')
      .populate('reportedBy.user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNextPage: page < Math.ceil(totalPosts / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Admin get posts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/posts/:id/status
// @desc    Update post status (activate/deactivate)
// @access  Admin
router.put('/posts/:id/status', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { isActive } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    post.isActive = isActive;
    await post.save();

    res.json({
      status: 'success',
      message: `Post ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        post: {
          id: post._id,
          title: post.title,
          isActive: post.isActive
        }
      }
    });

  } catch (error) {
    console.error('Admin update post status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/admin/categories
// @desc    Get all categories
// @access  Admin
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'categories',
          as: 'posts'
        }
      },
      {
        $addFields: {
          postCount: { $size: '$posts' }
        }
      },
      {
        $project: {
          posts: 0
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.json({
      status: 'success',
      data: {
        categories
      }
    });

  } catch (error) {
    console.error('Admin get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/admin/categories
// @desc    Create new category
// @access  Admin
router.post('/categories', [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Name must be between 1 and 50 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex color')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { name, description, color } = req.body;
    
    // Create slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug }] 
    });

    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: 'Category with this name already exists'
      });
    }

    const category = await Category.create({
      name,
      slug,
      description: description || '',
      color: color || '#00A4EF'
    });

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: {
        category
      }
    });

  } catch (error) {
    console.error('Admin create category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/admin/news/fetch
// @desc    Manually trigger news fetch
// @access  Admin
router.post('/news/fetch', async (req, res) => {
  try {
    const result = await newsService.fetchAndProcessNews();
    
    res.json({
      status: 'success',
      message: 'News fetch completed',
      data: result
    });

  } catch (error) {
    console.error('Manual news fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch news'
    });
  }
});

// @route   GET /api/admin/contacts
// @desc    Get contact form submissions
// @access  Admin
router.get('/contacts', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'new', 'in-progress', 'resolved'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalContacts = await Contact.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        contacts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalContacts / limit),
          totalContacts,
          hasNextPage: page < Math.ceil(totalContacts / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Admin get contacts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/contacts/:id/status
// @desc    Update contact status
// @access  Admin
router.put('/contacts/:id/status', [
  body('status').isIn(['new', 'in-progress', 'resolved']).withMessage('Invalid status'),
  body('adminNotes').optional().trim().isLength({ max: 1000 }).withMessage('Admin notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const { status, adminNotes } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Contact not found'
      });
    }

    contact.status = status;
    if (adminNotes !== undefined) {
      contact.adminNotes = adminNotes;
    }
    
    await contact.save();

    res.json({
      status: 'success',
      message: 'Contact status updated successfully',
      data: {
        contact
      }
    });

  } catch (error) {
    console.error('Admin update contact status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;