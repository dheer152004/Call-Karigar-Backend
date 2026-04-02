const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const region = process.env.server_AWS_REGION || process.env.server_AWS_S3_REGION;
const bucketName = process.env.server_AWS_S3_BUCKET || process.env.server_S3_BUCKET;

const s3Client = new S3Client({
    region,
    credentials: process.env.server_AWS_ACCESS_KEY_ID && process.env.server_AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.server_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.server_AWS_SECRET_ACCESS_KEY
        }
        : undefined
});

const sanitizeFileName = (name = 'file') => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const buildS3PublicUrl = (key) => {
    if (process.env.server_AWS_S3_PUBLIC_BASE_URL) {
        return `${process.env.server_AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
    }

    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
};

const getKeyFromS3Url = (url) => {
    try {
        const parsedUrl = new URL(url);
        return decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''));
    } catch (error) {
        return url;
    }
};

exports.uploadToS3 = async (file, folder = '') => {
    if (!bucketName) {
        throw new Error('S3 bucket is not configured. Set server_AWS_S3_BUCKET or server_S3_BUCKET.');
    }

    if (!region) {
        throw new Error('AWS region is not configured. Set server_AWS_REGION or server_AWS_S3_REGION.');
    }

    const fileBuffer = Buffer.isBuffer(file) ? file : file?.buffer;
    if (!fileBuffer) {
        throw new Error('No file buffer provided for S3 upload.');
    }

    const originalName = !Buffer.isBuffer(file) ? file.originalname : undefined;
    const contentType = !Buffer.isBuffer(file) ? file.mimetype : undefined;

    const key = `call-kaarigar/${folder}/${Date.now()}-${uuidv4()}-${sanitizeFileName(originalName || 'upload')}`
        .replace(/\/+/g, '/')
        .replace(/\/$/, '');

    const putObjectInput = {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType || 'application/octet-stream'
    };

    if (process.env.AWS_S3_ACL) {
        putObjectInput.ACL = process.env.AWS_S3_ACL;
    }

    await s3Client.send(new PutObjectCommand(putObjectInput));

    return {
        url: buildS3PublicUrl(key),
        public_id: key,
        format: (originalName || '').split('.').pop()?.toLowerCase() || null
    };
};

exports.deleteFromS3 = async (publicIdOrUrl) => {
    if (!publicIdOrUrl || !bucketName) {
        return;
    }

    const key = publicIdOrUrl.includes('http') ? getKeyFromS3Url(publicIdOrUrl) : publicIdOrUrl;

    await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
    }));
};
