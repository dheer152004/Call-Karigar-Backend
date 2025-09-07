const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary
exports.uploadToCloudinary = async (fileBuffer, folder) => {
    try {
        // Convert buffer to base64 data URI
        const fileStr = `data:${fileBuffer.mimetype};base64,${fileBuffer.buffer.toString('base64')}`;
        
        const result = await cloudinary.uploader.upload(fileStr, {
            folder: `call-kaarigar/${folder}`,
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
            max_file_size: 10000000 // 10MB max file size
        });
        
        return {
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Error uploading file to cloud storage');
    }
};

// Delete file from Cloudinary
exports.deleteFromCloudinary = async (public_id) => {
    try {
        if (!public_id) return;
        await cloudinary.uploader.destroy(public_id);
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Error deleting file from cloud storage');
    }
};

// Get mime type from Cloudinary URL
exports.getMimeType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
        case 'pdf':
            return 'application/pdf';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        default:
            return 'application/octet-stream';
    }
};
