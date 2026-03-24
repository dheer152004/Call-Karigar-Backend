const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Allow only specific file types
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/heic'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, HEIC, and PDF files are allowed.`));
        }
    }
}).fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'policeVerification', maxCount: 1 },
    { name: 'certifications', maxCount: 5 }
]);

// Create wrapper middleware to handle multer errors
const uploadMiddleware = (req, res, next) => {
    console.log('=== FileUpload Middleware ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body:', JSON.stringify(req.body));
    
    upload(req, res, (err) => {
        console.log('After multer upload');
        console.log('req.files:', Object.keys(req.files || {}));
        console.log('Error:', err);

        if (err instanceof multer.MulterError) {
            // A Multer error occurred during upload
            console.error('Multer error:', err.code);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 10MB',
                    error: err.message
                });
            }
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`,
                error: err.code
            });
        } else if (err) {
            // An unknown error occurred
            console.error('Unknown upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload error',
                error: err.toString()
            });
        }

        // Check if any files were actually uploaded
        if (!req.files || Object.keys(req.files).length === 0) {
            console.error('No files received in request');
            return res.status(400).json({
                success: false,
                message: 'No files were uploaded. Please ensure you are sending files as multipart/form-data',
                details: 'Expected fields: aadhar, pan, policeVerification (required), certifications (optional)',
                received: req.files ? Object.keys(req.files) : 'none'
            });
        }

        // Validation successful, proceed
        console.log('Files received successfully:', Object.keys(req.files));
        next();
    });
};

// Export the middleware function
module.exports = uploadMiddleware;
