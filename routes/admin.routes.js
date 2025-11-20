const express = require('express');
const router = express.Router();
const { timingSafeCompare, generateToken } = require('../utils/crypto');
const { validateUsername } = require('../utils/validation');

/**
 * Admin panel for generating phishing links
 * Protected by secret key query parameter
 */
router.get('/admin', (req, res) => {
  const { key } = req.query;

  // Validate secret key
  if (!timingSafeCompare(key, process.env.SECRET_KEY)) {
    return res.status(403).send('Forbidden: Invalid or missing key');
  }

  res.render('admin');
});

/**
 * Generate tracking link endpoint
 * Protected by secret key query parameter
 */
router.get('/generate-link', (req, res) => {
  try {
    const { username, key } = req.query;

    // Validate secret key
    if (!timingSafeCompare(key, process.env.SECRET_KEY)) {
      return res.status(403).json({ error: 'Invalid or missing key' });
    }

    // Validate username
    const validation = validateUsername(username);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const token = generateToken(username.trim());
    const url = `${req.protocol}://${req.get('host')}/t/${token}`;

    res.json({ token, url, username: username.trim() });
  } catch (err) {
    console.error('Error generating link');
    res.status(500).json({ error: 'An error occurred' });
  }
});

module.exports = router;
