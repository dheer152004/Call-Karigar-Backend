const WorkerDocument = require('../models/WorkerDocument');

// Helper function to validate required documents
const validateDocuments = (documents) => {
    const requiredDocs = ['aadhar', 'pan', 'drivingLicense', 'certifications'];
    const missingDocs = requiredDocs.filter(doc => !documents[doc]);
    
    if (missingDocs.length > 0) {
        return {
            isValid: false,
            error: `Missing required documents: ${missingDocs.join(', ')}`
        };
    }
    return { isValid: true };
};

// @desc    Upload worker documents
// @route   POST /api/worker-documents
// @access  Private (Worker only)
exports.uploadDocuments = async (req, res) => {
    try {
        const workerId = req.user._id;
        const { aadhar, pan, drivingLicense, certifications } = req.body;

        // Check if all required documents are provided
        if (!aadhar || !pan || !drivingLicense || !certifications) {
            return res.status(400).json({
                success: false,
                error: 'All documents (aadhar, pan, drivingLicense, certifications) are required'
            });
        }

        // Try to find existing document
        let workerDocument = await WorkerDocument.findOne({ workerId });

        if (workerDocument) {
            // Update existing document
            workerDocument.aadhar = aadhar;
            workerDocument.pan = pan;
            workerDocument.drivingLicense = drivingLicense;
            workerDocument.certifications = certifications;
            workerDocument.status = 'pending';
            workerDocument.isKYCComplete = false;
            await workerDocument.save();
        } else {
            // Create new document
            workerDocument = await WorkerDocument.create({
                workerId,
                aadhar,
                pan,
                drivingLicense,
                certifications,
                status: 'pending',
                isKYCComplete: false
            });
        }

        res.status(201).json({
            success: true,
            data: workerDocument
        });
    } catch (error) {
        console.error('Upload documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading documents',
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

        const query = WorkerDocument.findOne({ workerId });

        // Populate worker details if admin is requesting
        if (req.user.role === 'admin') {
            query.populate('workerId', 'name email phone')
                .populate('lastVerifiedBy', 'name email');
        }

        const document = await query.exec();

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'No documents found for this worker'
            });
        }

        // Format response
        const response = {
            success: true,
            data: {
                _id: document._id,
                workerId: document.workerId,
                aadhar: document.aadhar,
                pan: document.pan,
                drivingLicense: document.drivingLicense,
                certifications: document.certifications,
                status: document.status,
                isKYCComplete: document.isKYCComplete,
                createdAt: document.createdAt,
                updatedAt: document.updatedAt
            }
        };

        if (req.user.role === 'admin') {
            response.data.lastVerifiedBy = document.lastVerifiedBy;
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching documents',
            error: error.message
        });
    }
};

// @desc    Update worker documents status (Admin) or documents (Worker)
// @route   PUT /api/worker-documents/:id
// @access  Private (Admin and Worker)
exports.updateWorkerDocuments = async (req, res) => {
    try {
        // For workers updating their own documents, use workerId to find the document
        const query = req.user.role === 'worker' 
            ? { workerId: req.user._id }
            : { _id: req.params.id };
            
        let document = await WorkerDocument.findOne(query);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check if user is authorized
        if (req.user.role !== 'admin' && document.workerId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update these documents'
            });
        }

        if (req.user.role === 'admin') {
            // Admin can update status and KYC
            // Admin can only update status
            const { status } = req.body;
            
            // Update document status and KYC flag
            document = await WorkerDocument.findByIdAndUpdate(
                document._id,
                {
                    status,
                    isKYCComplete: status === 'verified'
                },
                { new: true }
            );
            
            // Update document
            document = await WorkerDocument.findByIdAndUpdate(
                document._id,
                updateData,
                { new: true }
            );
        } else {
            // Workers can update document URLs
            const { aadhar, pan, drivingLicense, certifications } = req.body;
            const updateData = {
                status: 'pending',
                isKYCComplete: false
            };
            
            if (aadhar) updateData.aadhar = aadhar;
            if (pan) updateData.pan = pan;
            if (drivingLicense) updateData.drivingLicense = drivingLicense;
            if (certifications) updateData.certifications = certifications;
            
            // Update document
            document = await WorkerDocument.findByIdAndUpdate(
                document._id,
                updateData,
                { new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: `Document ${req.user.role === 'admin' ? 'status updated' : 'updated'} successfully`,
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

// @desc    Get specific document details
// @route   GET /api/worker-documents/:id
// @access  Private (Worker or Admin)
exports.getDocumentById = async (req, res) => {
    try {
        const document = await WorkerDocument.findOne(
            { 'documents._id': req.params.id },
            { 'documents.$': 1, workerId: 1, isKYCComplete: 1 }
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check authorization
        if (req.user.role !== 'admin' && document.workerId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this document'
            });
        }

        const specificDocument = document.documents[0];
        
        res.status(200).json({
            success: true,
            data: {
                _id: specificDocument._id,
                type: specificDocument.type,
                url: specificDocument.url,
                status: specificDocument.status,
                uploadedAt: specificDocument.uploadedAt,
                verifiedAt: specificDocument.verifiedAt,
                verificationNotes: specificDocument.verificationNotes,
                ...(specificDocument.status === 'rejected' && { rejectionReason: specificDocument.rejectionReason }),
                isKYCComplete: document.isKYCComplete
            }
        });
    } catch (error) {
        console.error('Get document by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching document',
            error: error.message
        });
    }
};