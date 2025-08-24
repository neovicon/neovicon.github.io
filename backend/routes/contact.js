const express = require('express');
const router = express.Router();
const { Contact } = require('../models');
const { authMiddleware } = require('../middleware/auth');

router.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'Contact route ready' });
});


router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' });
  }
  try {
    const contact = await Contact.create({ name, email, subject, message });
    res.status(201).json({ status: 'success', data: { contact } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to create contact' });
  }
});
module.exports = router;


router.get('/', authMiddleware, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ status: 'success', data: { contacts } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch contacts' });
  }
});

