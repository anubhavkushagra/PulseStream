const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// @desc    Get all viewers (for assignment)
// @route   GET /api/users/viewers
// @access  Private (Admin only)
router.get('/viewers', protect, authorize('admin'), async (req, res) => {
    try {
        const viewers = await User.find({ role: 'viewer' }).select('name email');
        res.json(viewers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
