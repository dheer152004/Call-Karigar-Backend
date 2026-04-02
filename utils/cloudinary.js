// const cloudinary = require('cloudinary').v2;
// const streamifier = require('streamifier');

// // Configure Cloudinary
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });

// console.log('Cloudinary config:', {
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET ? 'exists' : 'MISSING'
// });

// const getPublicIdFromCloudinaryUrl = (url) => {
//     try {
//         const parsedUrl = new URL(url);
//         const match = parsedUrl.pathname.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
//         return match ? match[1] : url;
//     } catch (error) {
//         return url;
//     }
// };

// // Upload file to Cloudinary
// exports.uploadToCloudinary = async (file, folder) => {
//     try {
//         const fileBuffer = Buffer.isBuffer(file) ? file : file?.buffer;
//         if (!fileBuffer) {
//             throw new Error('No file buffer provided for Cloudinary upload');
//         }

//         return new Promise((resolve, reject) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//                 {
//                     folder: `call-kaarigar/${folder}`,
//                     resource_type: 'auto',
//                     allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'heic'],
//                 },
//                 (error, result) => {
//                     if (error) {
//                         console.error('Cloudinary upload error:', error);
//                         reject(new Error('Error uploading file to cloud storage'));
//                     } else {
//                         resolve({
//                             url: result.secure_url,
//                             secure_url: result.secure_url,
//                             public_id: result.public_id,
//                             format: result.format
//                         });
//                     }
//                 }
//             );
//             streamifier.createReadStream(fileBuffer).pipe(uploadStream);
//         });
//     } catch (error) {
//         console.error('Cloudinary upload error:', error);
//         throw new Error('Error uploading file to cloud storage');
//     }
// };

// // Delete file from Cloudinary
// exports.deleteFromCloudinary = async (public_id) => {
//     try {
//         if (!public_id) return;

//         const resolvedPublicId = public_id.includes('http')
//             ? getPublicIdFromCloudinaryUrl(public_id)
//             : public_id;

//         await cloudinary.uploader.destroy(resolvedPublicId);
//     } catch (error) {
//         console.error('Cloudinary delete error:', error);
//         throw new Error('Error deleting file from cloud storage');
//     }
// };

// // Get mime type from Cloudinary URL
// exports.getMimeType = (url) => {
//     const extension = url.split('.').pop().toLowerCase();
//     switch (extension) {
//         case 'pdf':
//             return 'application/pdf';
//         case 'jpg':
//             return 'image/jpg';
//         case 'jpeg':
//             return 'image/jpeg';
//         case 'png':
//             return 'image/png';
//         case 'heic':
//             return 'image/heic';
//         default:
//             return 'application/octet-stream';
//     }
// };
