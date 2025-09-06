const express = require('express');
const router = express.Router();
const {
 uploadDocuments,
 getWorkerDocuments,
 updateWorkerDocuments,
 verifyDocuments,
 deleteDocument,
 getDocumentById
} = require('./workerDocuments.controller');
const { protect, authorize } = require('../../../../middleware/auth');

// All routes are protected
router.use(protect);

// Worker routes
router.post('/', authorize('worker'), uploadDocuments);

// Worker and Admin routes
router.get('/', getWorkerDocuments);
router.get('/:id', getDocumentById);
router.put('/:id', authorize('worker', 'admin'), updateWorkerDocuments);

//admin routes
router.patch('/:id/verify', authorize('admin'), verifyDocuments);

// Mixed access routes
router.delete('/:id', authorize('worker', 'admin'), deleteDocument);

module.exports = router;