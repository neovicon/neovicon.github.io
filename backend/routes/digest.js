const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'success', message: 'Digest route ready' });
});


router.post('/generate', async (req, res) => {
  const { userId, digestType } = req.body;
  if (!userId || !digestType) {
    return res.status(400).json({ status: 'error', message: 'User ID and digest type are required' });
  }
  
  try {
    // Logic to generate digest based on user preferences and posts
    // This is a placeholder for actual implementation
    const digest = await EmailDigest.create({ user: userId, digestType });
    
    res.status(201).json({ status: 'success', data: { digest } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to generate digest' });
  }
});

module.exports = router;