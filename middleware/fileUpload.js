const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf', 'image/heic', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only jpg, png, pdf, heic files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
}).fields([
    { name: 'aadhar', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'policeVerification', maxCount: 1 },
    { name: 'certifications', maxCount: 5 }
]);

module.exports = upload;