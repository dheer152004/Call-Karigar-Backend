const express = require('express');
const router = express.Router();
const {
    uploadDocuments,
    getWorkerDocuments,
    updateWorkerDocuments,
    deleteDocument
} = require('../controllers/workerDocumentController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Worker routes
router.post('/', authorize('worker'), uploadDocuments);

// Worker and Admin routes
router.get('/', getWorkerDocuments);
router.put('/:id', authorize('worker', 'admin'), updateWorkerDocuments);

// Mixed access routes
router.delete('/:id', authorize('worker', 'admin'), deleteDocument);

module.exports = router;
