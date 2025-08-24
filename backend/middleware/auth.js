const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).populate('interests');
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(401).json({
          status: 'error',
          message: 'Please verify your email to access this resource'
        });
      }

      // Attach user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      return res.status(401).json({
        status: 'error',
        message: 'Invalid access token'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error in authentication'
    });
  }
};

// Admin authorization middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Optional auth middleware - doesn't require authentication but attaches user if token exists
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate('interests');
        if (user && user.isVerified) {
          req.user = user;
        }
      } catch (jwtError) {
        // Token is invalid but that's ok for optional auth
        console.log('Optional auth - invalid token:', jwtError.message);
      }
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware
};