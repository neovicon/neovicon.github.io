
const express = require('express');
const { Category } = require('../models');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'Categories route ready' });
});

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    res.json({ status: 'success', data: { categories } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch categories' });
  }
});

// Get a single category by slug
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    res.json({ status: 'success', data: { category } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch category' });
  }
});

// Create a new category
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, color } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ status: 'error', message: 'Name and slug are required' });
    }
    const exists = await Category.findOne({ slug });
    if (exists) {
      return res.status(400).json({ status: 'error', message: 'Category with this slug already exists' });
    }
    const category = await Category.create({ name, slug, description, color });
    res.status(201).json({ status: 'success', data: { category } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create category' });
  }
});

// Update a category
router.put('/:slug', async (req, res) => {
  try {
    const { name, description, color, isActive } = req.body;
    const category = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      { name, description, color, isActive },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    res.json({ status: 'success', data: { category } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to update category' });
  }
});

// Delete (deactivate) a category
router.delete('/:slug', async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      { isActive: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    res.json({ status: 'success', message: 'Category deactivated', data: { category } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to delete category' });
  }
});

module.exports = router;


