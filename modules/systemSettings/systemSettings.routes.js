const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
    getSettings,
    updateSettings,
    getSettingsByCategory,
    updateSettingsByCategory
} = require('./systemSettings.controller');

// Protect all routes
router.use(protect);

// Only admin can access these routes
router.use(authorize('admin'));

// Get and update all settings
router.get('/', getSettings);
router.put('/', updateSettings);

// Get and update specific setting categories
router.get('/:category', getSettingsByCategory);
router.put('/:category', updateSettingsByCategory);

module.exports = router;
