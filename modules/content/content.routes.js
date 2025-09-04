const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const {
    createContent,
    getAllContent,
    getContent,
    updateContent,
    deleteContent,
    searchContent
} = require('./content.controller');

// Protect all routes
router.use(protect);

// Public routes (still need authentication but any role can access)
router.get('/search', searchContent);
router.get('/', getAllContent);
router.get('/:id', getContent);

// Admin only routes
router.post('/', authorize('admin'), createContent);
router.put('/:id', authorize('admin'), updateContent);
router.delete('/:id', authorize('admin'), deleteContent);

module.exports = router;
