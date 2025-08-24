// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  interests: [{
    type: String
  }],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailPreferences: {
    digestFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'instant', 'never'],
      default: 'daily'
    },
    breakingNews: {
      type: Boolean,
      default: true
    }
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastActive: {
    type: Date,
    default: Date.now
  },
  gdprConsent: {
    type: Boolean,
    default: false
  },
  gdprConsentDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
userSchema.index({ isVerified: 1 });
userSchema.index({ role: 1 });

// Virtual for user's posts
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// models/Category.js
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  color: {
    type: String,
    default: '#00A4EF'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

categorySchema.index({ isActive: 1 });

const Category = mongoose.model('Category', categorySchema);

// models/Post.js
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'link', 'news'],
    default: 'text'
  },
  image: {
    type: String,
    default: null
  },
  link: {
    url: String,
    title: String,
    description: String,
    image: String
  },
  categories: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Category'
  }],
  tags: [String],
  isNews: {
    type: Boolean,
    default: false
  },
  originalSource: {
    type: String,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  likes: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  engagement: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
postSchema.index({ author: 1 });
postSchema.index({ categories: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ engagement: -1 });
postSchema.index({ isActive: 1 });
postSchema.index({ isNews: 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Calculate engagement score before saving
postSchema.pre('save', function(next) {
  const likes = this.likes ? this.likes.length : 0;
  const comments = this.comments ? this.comments.length : 0;
  const shares = this.shares || 0;
  const views = this.views || 0;
  
  // Engagement formula: likes * 3 + comments * 5 + shares * 7 + views * 0.1
  this.engagement = (likes * 3) + (comments * 5) + (shares * 7) + (views * 0.1);
  next();
});

const Post = mongoose.model('Post', postSchema);

// models/Contact.js
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'resolved'],
    default: 'new'
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });

const Contact = mongoose.model('Contact', contactSchema);

// models/EmailDigest.js
const emailDigestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  posts: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Post'
  }],
  digestType: {
    type: String,
    enum: ['daily', 'weekly', 'breaking'],
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  emailOpened: {
    type: Boolean,
    default: false
  },
  clickedPosts: [{
    post: {
      type: mongoose.Schema.ObjectId,
      ref: 'Post'
    },
    clickedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

emailDigestSchema.index({ user: 1, sentAt: -1 });

const EmailDigest = mongoose.model('EmailDigest', emailDigestSchema);

module.exports = {
  User,
  Category,
  Post,
  Contact,
  EmailDigest
};