const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../../../middleware/auth');
const { toggleWorkerVerification } = require('./workerVerification.controller');

// Toggle worker verification status (Admin only)
router.patch('/:workerId/verify', protect, authorize('admin'), toggleWorkerVerification);

module.exports = router;
