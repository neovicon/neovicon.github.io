const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult, query } = require('express-validator');
const { Post, Category, User } = require('../models');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const newsService = require('../services/newsService');
const xss = require('xss');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation rules
const createPostValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'link'])
    .withMessage('Invalid post type'),
  body('linkUrl')
    .optional()
    .isURL()
    .withMessage('Invalid URL format'),
  body('categories')
    .optional()
    .custom((value) => {
      // Allow both array and single value
      if (Array.isArray(value) || typeof value === 'string' || value === undefined) {
        return true;
      }
      throw new Error('Categories must be an array or single value');
    })
    .withMessage('Categories must be an array or single value')
];

const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
];

// Helper function to ensure upload directory exists
const ensureUploadDir = async () => {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Process and save image
const processAndSaveImage = async (buffer, filename) => {
  const uploadDir = await ensureUploadDir();
  const filepath = path.join(uploadDir, filename);
  
  // Process image with sharp
  await sharp(buffer)
    .resize(1200, 800, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ 
      quality: 85,
      progressive: true 
    })
    .toFile(filepath);
  
  return `/uploads/posts/${filename}`;
};

// Extract link metadata
const extractLinkMetadata = async (url) => {
  try {
    // Simple metadata extraction - in production, consider using a library like metascraper
    return {
      url: url,
      title: 'Shared Link',
      description: 'Check out this interesting link',
      image: null
    };
  } catch (error) {
    return {
      url: url,
      title: 'Shared Link',
      description: '',
      image: null
    };
  }
};

// @route   GET /api/posts
// @desc    Get posts with pagination and filtering
// @access  Public/Private (optional auth)
router.get('/', optionalAuthMiddleware, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('author').optional().isMongoId().withMessage('Invalid author ID'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search query too long'),
  query('sortBy').optional().isIn(['recent', 'popular', 'trending']).withMessage('Invalid sort option')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, author, search, sortBy = 'recent' } = req.query;

    // Build query
    let query = { isActive: true };

    if (category) {
      query.categories = category;
    }

    if (author) {
      query.author = author;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'popular':
        sort = { engagement: -1, createdAt: -1 };
        break;
      case 'trending':
        // Posts with high engagement in last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query.createdAt = { $gte: yesterday };
        sort = { engagement: -1, createdAt: -1 };
        break;
      default: // 'recent'
        sort = { createdAt: -1 };
    }

    // If user is authenticated, personalize results
    if (req.user && req.user.interests.length > 0) {
      const userInterests = req.user.interests.map(interest => interest._id);
      
      // Boost posts in user's interests
      const pipeline = [
        { $match: query },
        {
          $addFields: {
            relevanceScore: {
              $cond: {
                if: { $setIsSubset: [userInterests, "$categories"] },
                then: 2, // Boost posts in user's interests
                else: 1
              }
            }
          }
        },
        { $sort: { relevanceScore: -1, ...sort } },
        { $skip: skip },
        { $limit: limit }
      ];

      const posts = await Post.aggregate(pipeline);
      const populatedPosts = await Post.populate(posts, [
        { path: 'author', select: 'name profilePicture' },
        { path: 'categories', select: 'name color slug' },
        { path: 'comments.user', select: 'name profilePicture' }
      ]);

      const totalPosts = await Post.countDocuments(query);

      return res.json({
        status: 'success',
        data: {
          posts: populatedPosts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
            hasNextPage: page < Math.ceil(totalPosts / limit),
            hasPrevPage: page > 1
          }
        }
      });
    }

    // Default query for non-authenticated users
    const posts = await Post.find(query)
      .populate('author', 'name profilePicture')
      .populate('categories', 'name color slug')
      .populate('comments.user', 'name profilePicture')
      .sort(sort)
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
    console.error('Get posts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Public/Private (optional auth)
router.get('/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name profilePicture bio')
      .populate('categories', 'name color slug')
      .populate('comments.user', 'name profilePicture');

    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.json({
      status: 'success',
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Get post error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/posts
// @desc    Create new post
// @access  Private
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    // Debug: Log the request data
    console.log('POST /api/posts - Request data:', {
      body: req.body,
      bodyKeys: Object.keys(req.body),
      file: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file',
      user: req.user._id
    });

    // Process categories first
    let postCategories = [];
    if (req.body.categories) {
      postCategories = Array.isArray(req.body.categories) ? req.body.categories : [req.body.categories];
    }

    // Basic validation
    if (!req.body.content || req.body.content.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Content is required'
      });
    }

    if (req.body.content.length > 5000) {
      return res.status(400).json({
        status: 'error',
        message: 'Content cannot exceed 5000 characters'
      });
    }

    const { content, title, type = 'text', linkUrl } = req.body;
    


    // Sanitize content
    const sanitizedContent = xss(content);
    const sanitizedTitle = title ? xss(title) : null;

    // Process post data
    const postData = {
      content: sanitizedContent,
      title: sanitizedTitle,
      author: req.user._id,
      type: type,
      categories: postCategories,
      isNews: false
    };

    // Handle image upload
    if (req.file && req.body.type === 'image') {
      console.log('Processing image upload:', {
        fileSize: req.file.size,
        mimetype: req.file.mimetype,
        type: req.body.type
      });
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
      postData.image = await processAndSaveImage(req.file.buffer, filename);
      postData.type = 'image';
      console.log('Image processed and saved:', postData.image);
    }

    // Handle link posts
    if (type === 'link' && linkUrl) {
      postData.link = await extractLinkMetadata(linkUrl);
    }

    // Auto-categorize content using AI if no categories provided
    if (postCategories.length === 0) {
      try {
        const aiCategories = await newsService.categorizeContent(sanitizedContent);
        postData.categories = aiCategories;
      } catch (aiError) {
        console.error('AI categorization error:', aiError);
        // Continue without AI categorization
      }
    }

    // Generate tags using AI
    try {
      const aiTags = await newsService.generateTags(sanitizedContent);
      postData.tags = aiTags;
    } catch (aiError) {
      console.error('AI tag generation error:', aiError);
      postData.tags = [];
    }

    const post = new Post(postData);
    await post.save();

    // Populate the saved post
    await post.populate([
      { path: 'author', select: 'name profilePicture' },
      { path: 'categories', select: 'name color slug' }
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Post created successfully',
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (author only)
router.put('/:id', authMiddleware, upload.single('image'), createPostValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    // Check if user owns the post or is admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this post'
      });
    }

    const { content, title, type, linkUrl, categories } = req.body;

    // Sanitize content
    if (content) {
      post.content = xss(content);
    }
    if (title) {
      post.title = xss(title);
    }
    if (type) {
      post.type = type;
    }
    if (categories) {
      post.categories = categories;
    }

    // Handle image upload
    if (req.file && type === 'image') {
      // Delete old image if exists
      if (post.image) {
        try {
          const oldImagePath = path.join(__dirname, '..', post.image);
          await fs.unlink(oldImagePath);
        } catch (deleteError) {
          console.log('Could not delete old image:', deleteError);
        }
      }

      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
      post.image = await processAndSaveImage(req.file.buffer, filename);
    }

    // Handle link posts
    if (type === 'link' && linkUrl) {
      post.link = await extractLinkMetadata(linkUrl);
    }

    await post.save();

    await post.populate([
      { path: 'author', select: 'name profilePicture' },
      { path: 'categories', select: 'name color slug' }
    ]);

    res.json({
      status: 'success',
      message: 'Post updated successfully',
      data: {
        post
      }
    });

  } catch (error) {
    console.error('Update post error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private (author only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    // Check if user owns the post or is admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this post'
      });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    // Delete image file if exists
    if (post.image) {
      try {
        const imagePath = path.join(__dirname, '..', post.image);
        await fs.unlink(imagePath);
      } catch (deleteError) {
        console.log('Could not delete image file:', deleteError);
      }
    }

    res.json({
      status: 'success',
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/unlike post
// @access  Private
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const userId = req.user._id;
    const existingLikeIndex = post.likes.findIndex(
      like => like.user.toString() === userId.toString()
    );

    if (existingLikeIndex > -1) {
      // Unlike - remove the like
      post.likes.splice(existingLikeIndex, 1);
    } else {
      // Like - add the like
      post.likes.push({ user: userId });
    }

    await post.save();

    res.json({
      status: 'success',
      message: existingLikeIndex > -1 ? 'Post unliked' : 'Post liked',
      data: {
        liked: existingLikeIndex === -1,
        likeCount: post.likes.length
      }
    });

  } catch (error) {
    console.error('Like post error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/:id/comment', authMiddleware, commentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const { content } = req.body;
    const sanitizedContent = xss(content);

    const newComment = {
      user: req.user._id,
      content: sanitizedContent,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Populate the new comment
    await post.populate('comments.user', 'name profilePicture');

    const addedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      status: 'success',
      message: 'Comment added successfully',
      data: {
        comment: addedComment,
        commentCount: post.comments.length
      }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/posts/:id/comment/:commentId
// @desc    Delete comment
// @access  Private (comment author only)
router.delete('/:id/comment/:commentId', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        status: 'error',
        message: 'Comment not found'
      });
    }

    // Check if user owns the comment or is admin
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this comment'
      });
    }

    comment.remove();
    await post.save();

    res.json({
      status: 'success',
      message: 'Comment deleted successfully',
      data: {
        commentCount: post.comments.length
      }
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Post or comment not found'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/posts/:id/share
// @desc    Share post (increment share count)
// @access  Private
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    post.shares += 1;
    await post.save();

    res.json({
      status: 'success',
      message: 'Post shared successfully',
      data: {
        shareCount: post.shares
      }
    });

  } catch (error) {
    console.error('Share post error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/posts/:id/report
// @desc    Report post
// @access  Private
router.post('/:id/report', authMiddleware, [
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Report reason must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }

    const { reason } = req.body;

    // Check if user already reported this post
    const existingReport = post.reportedBy.find(
      report => report.user.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reported this post'
      });
    }

    post.reportedBy.push({
      user: req.user._id,
      reason: xss(reason),
      createdAt: new Date()
    });

    await post.save();

    res.json({
      status: 'success',
      message: 'Post reported successfully. Our team will review it shortly.'
    });

  } catch (error) {
    console.error('Report post error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        status: 'error',
        message: 'Post not found'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/posts/trending/today
// @desc    Get trending posts for today
// @access  Public/Private (optional auth)
router.get('/trending/today', optionalAuthMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const posts = await Post.find({
      isActive: true,
      createdAt: { $gte: today }
    })
      .populate('author', 'name profilePicture')
      .populate('categories', 'name color slug')
      .sort({ engagement: -1 })
      .limit(10);

    res.json({
      status: 'success',
      data: {
        posts
      }
    });

  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;