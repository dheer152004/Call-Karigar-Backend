const { uploadToS3, deleteFromS3 } = require('./s3');

const getStorageProvider = () => (process.env.FILE_STORAGE_PROVIDER || 's3').toLowerCase();

exports.getStorageProvider = getStorageProvider;

exports.uploadFile = async (file, folder = '', providerOverride) => {
    const provider = (providerOverride || getStorageProvider()).toLowerCase();

    if (provider === 's3') {
        return uploadToS3(file, folder);
    }

    return uploadToS3(file, folder);
};

exports.deleteFile = async (publicIdOrUrl, providerOverride) => {
    const provider = (providerOverride || getStorageProvider()).toLowerCase();

    if (provider === 's3') {
        return deleteFromS3(publicIdOrUrl);
    }

    return deleteFromS3(publicIdOrUrl);
};
