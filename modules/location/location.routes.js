const express = require('express');
const router = express.Router();
const { updateLocation, getLocation } = require('./location.controller');

// POST /api/location/update
router.post('/update', updateLocation);
// GET /api/location/:userId
router.get('/:userId', getLocation);

module.exports = router;
