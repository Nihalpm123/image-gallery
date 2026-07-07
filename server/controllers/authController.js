const jwt = require('jsonwebtoken');

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET || 'secret-key-12345',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      username: adminUsername,
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Verify current session token
// @route   GET /api/auth/verify
// @access  Private (Admin)
exports.verifyToken = async (req, res) => {
  res.status(200).json({ valid: true, role: 'admin' });
};
