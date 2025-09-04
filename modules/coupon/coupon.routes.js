const express = require('express');
const router = express.Router();
const Coupon = require('./coupon.model');

// Get all active coupons
router.get('/active', async (req, res) => {
    try {
        const coupons = await Coupon.find({
            validUntil: { $gte: new Date() }
        });

        res.json({
            success: true,
            count: coupons.length,
            data: coupons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching coupons',
            error: error.message
        });
    }
});

module.exports = router;
