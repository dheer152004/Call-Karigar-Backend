const WorkerDocument = require('../models/WorkerDocument');

// @desc    Upload worker document
// @route   POST /api/worker-documents
// @access  Private (Worker only)
exports.uploadDocument = async (req, res) => {
    try {
        const document = await WorkerDocument.create({
            workerId: req.user._id,
            ...req.body
        });

        res.status(201).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading document',
            error: error.message
        });
    }
};

// @desc    Get worker documents
// @route   GET /api/worker-documents
// @access  Private (Worker or Admin)
exports.getWorkerDocuments = async (req, res) => {
    try {
        const workerId = req.query.workerId || req.user._id;

        // If not admin and trying to access other's documents
        if (req.user.role !== 'admin' && workerId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these documents'
            });
        }

        const documents = await WorkerDocument.find({ workerId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents
        });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching documents',
            error: error.message
        });
    }
};

// @desc    Update document status
// @route   PUT /api/worker-documents/:id
// @access  Private (Admin only)
exports.updateDocumentStatus = async (req, res) => {
    try {
        const document = await WorkerDocument.findByIdAndUpdate(
            req.params.id,
            { 
                status: req.body.status,
                verificationNotes: req.body.verificationNotes
            },
            { new: true, runValidators: true }
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating document',
            error: error.message
        });
    }
};

// @desc    Delete document
// @route   DELETE /api/worker-documents/:id
// @access  Private (Worker or Admin)
exports.deleteDocument = async (req, res) => {
    try {
        const document = await WorkerDocument.findById(req.params.id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check ownership or admin status
        if (document.workerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this document'
            });
        }

        await document.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting document',
            error: error.message
        });
    }
};
