const express = require('express');
const router = express.Router();
const {
    uploadDocument,
    getWorkerDocuments,
    updateDocumentStatus,
    deleteDocument
} = require('../controllers/workerDocumentController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Worker routes
router.post('/', authorize('worker'), uploadDocument);

// Worker and Admin routes
router.get('/', getWorkerDocuments);

// Admin routes
router.put('/:id', authorize('admin'), updateDocumentStatus);

// Mixed access routes
router.delete('/:id', deleteDocument);

module.exports = router;
