const WorkerDocument = require('./workerDocuments.model');
const NotificationService = require('../../../../services/notificationService');
const User = require('../../../user/user.model');
const emailService = require('../../../../services/emailService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../../../utils/cloudinary');

// Helper function to validate file type
const validateFileType = (fileType) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    return allowedTypes.includes(fileType);
};

// @desc    Upload worker documents
// @route   POST /api/worker-documents
// @access  Private (Worker only)
exports.uploadDocuments = async (req, res) => {
    // Array to track uploaded files for cleanup in case of error
    const uploadedFiles = [];
    
    try {
        const workerId = req.user._id;
        const files = req.files;

        if (!files) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        // Upload files to Cloudinary and collect document data
        const documentData = {};

        try {
            // Handle required documents (aadhar, pan, policeVerification)
            const requiredDocs = ['aadhar', 'pan', 'policeVerification'];
            for (const docType of requiredDocs) {
                if (!files[docType]) {
                    throw new Error(`${docType.charAt(0).toUpperCase() + docType.slice(1)} document is required`);
                }

                const file = files[docType][0];
                const result = await uploadToCloudinary(
                    file,
                    `workers/${workerId}/documents/${docType}`
                );

                documentData[docType] = {
                    url: result.url,
                    fileType: file.mimetype,
                    verified: false,
                    public_id: result.public_id
                };

                uploadedFiles.push({ public_id: result.public_id });
            }

            // Handle certifications (optional)
            if (files.certifications) {
                documentData.certifications = await Promise.all(
                    files.certifications.map(async (cert, index) => {
                        const result = await uploadToCloudinary(
                            cert,
                            `workers/${workerId}/documents/certifications`
                        );

                        uploadedFiles.push({ public_id: result.public_id });

                        return {
                            url: result.url,
                            fileType: cert.mimetype,
                            title: req.body.certificationTitles?.[index] || `Certification ${index + 1}`,
                            verified: false,
                            public_id: result.public_id
                        };
                    })
                );
            }

            // Try to find existing document
            let workerDocument = await WorkerDocument.findOne({ workerId });

            if (!workerDocument) {
                // Create new document
                workerDocument = await WorkerDocument.create({
                    workerId,
                    ...documentData,
                    status: 'pending',
                    isKYCComplete: false
                });
            } else {
                // Delete old files from Cloudinary
                const requiredDocs = ['aadhar', 'pan', 'policeVerification'];
                for (const docType of requiredDocs) {
                    if (workerDocument[docType]?.public_id) {
                        await deleteFromCloudinary(workerDocument[docType].public_id);
                    }
                }

                if (workerDocument.certifications?.length > 0) {
                    for (const cert of workerDocument.certifications) {
                        if (cert.public_id) {
                            await deleteFromCloudinary(cert.public_id);
                        }
                    }
                }

                // Update with new document data
                Object.assign(workerDocument, {
                    ...documentData,
                    status: 'pending',
                    isKYCComplete: false
                });
                await workerDocument.save();
            }

            // Notify admins about new document upload -- for future 
            // const admins = await User.find({ role: 'admin' });
            // for (const admin of admins) {
            //     await NotificationService.createNotification({
            //         userId: admin._id,
            //         type: 'document_uploaded',
            //         category: 'worker',
            //         title: 'New Worker Documents Uploaded',
            //         message: `Worker ${req.user.name} has uploaded new documents for verification.`,
            //         recipientRole: 'admin',
            //         priority: 'high',
            //         metadata: {
            //             workerId,
            //             workerName: req.user.name,
            //             documentId: workerDocument._id
            //         },
            //         actionUrl: `/admin/worker-documents/${workerDocument._id}`
            //     });
            // }

            return res.status(201).json({
                success: true,
                data: workerDocument
            });

        } catch (innerError) {
            // Clean up any uploaded files in case of error
            for (const file of uploadedFiles) {
                try {
                    await deleteFromCloudinary(file.public_id);
                } catch (cleanupError) {
                    console.error('Error cleaning up file:', cleanupError);
                }
            }
            throw innerError; // Re-throw to be caught by outer catch
        }

    } catch (error) {
        console.error('Upload documents error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error uploading documents'
        });
    }
};

// @desc    Verify worker documents
// @route   PATCH /api/worker-documents/:id/verify
// @access  Private (Admin only)
exports.verifyDocuments = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const documentId = req.params.id;

        const workerDocument = await WorkerDocument.findById(documentId);
        if (!workerDocument) {
            return res.status(404).json({
                success: false,
                message: 'Documents not found'
            });
        }

        // Update document status
        workerDocument.status = status;
        workerDocument.lastVerifiedBy = req.user._id;
        
        // Update individual document verification status
        if (status === 'verified') {
            workerDocument.aadhar.verified = true;
            workerDocument.pan.verified = true;
            workerDocument.policeVerification.verified = true;
            workerDocument.certifications = workerDocument.certifications.map(cert => ({
                ...cert,
                verified: true
            }));
            workerDocument.isKYCComplete = true;
        }

        await workerDocument.save();

        // Get worker details for notification
        const worker = await User.findById(workerDocument.workerId);

        // Send notification to worker about document status
        let notificationData = {
            userId: workerDocument.workerId,
            recipientRole: 'worker',
            priority: 'high',
            category: 'worker',
            metadata: {
                documentId: workerDocument._id,
                status,
                remarks
            },
            actionUrl: `/worker/documents/${workerDocument._id}`
        };

        if (status === 'rejected') {
            await NotificationService.createNotification({
                ...notificationData,
                type: 'document_rejected',
                title: 'Documents Verification Failed',
                message: `Your documents have been rejected. Reason: ${remarks}`
            });

            // Send email notification for rejection
            await emailService.sendEmail(worker.email, 'Documents Verification Failed', 
                `Dear ${worker.name},\n\nYour documents have been rejected.\nReason: ${remarks}\n\nPlease upload the correct documents.`);
        } else if (status === 'verified') {
            await NotificationService.createNotification({
                ...notificationData,
                type: 'document_verified',
                title: 'Documents Verified Successfully',
                message: 'Your documents have been verified successfully. You can now start accepting bookings.'
            });

            // Send email notification for verification
            await emailService.sendEmail(worker.email, 'Documents Verified Successfully', 
                `Dear ${worker.name},\n\nYour documents have been verified successfully. You can now start accepting bookings.`);
        } else {
            await NotificationService.createNotification({
                ...notificationData,
                type: 'profile_updated',
                title: 'Document Status Updated',
                message: `Your documents status has been updated to: ${status}${remarks ? ` (${remarks})` : ''}`
            });
        }

        res.status(200).json({
            success: true,
            data: workerDocument
        });
    } catch (error) {
        console.error('Verify documents error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying documents',
            error: error.message
        });
    }
};

// @desc    Get worker documents
// @route   GET /api/worker-documents/:id?
// @access  Private (Worker or Admin)
exports.getWorkerDocuments = async (req, res) => {
    try {
        const workerId = req.params.id || req.user._id;

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
                policeVerification: document.policeVerification,
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
        const document = await WorkerDocument.findById(req.params.id);

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

        res.status(200).json({
            success: true,
            data: document
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