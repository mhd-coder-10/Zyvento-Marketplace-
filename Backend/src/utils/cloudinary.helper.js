// Handles file uploads, deletion, and management on Cloudinary
// Uploads images/files to Cloudinary and returns URLs
// Used for product images, profile pictures, seller documents

const { cloudinary } = require('../config/cloudinary.config');
const environment = require('../config/environment');
const fs = require('fs');
const path = require('path');
const ApiError = require('./apiError');
const logger = require('./logger');

class CloudinaryHelper {
    // ============ RESOLVE FOLDER (PREPEND ROOT CLOUDINARY_FOLDER) ============
    resolveFolder(subfolder) {
        const rootFolder = (environment.CLOUDINARY_FOLDER || process.env.CLOUDINARY_FOLDER || 'ZYVENTO').trim();
        if (!subfolder || typeof subfolder !== 'string') {
            return rootFolder;
        }
        const clean = subfolder.replace(/^\/+|\/+$/g, '').trim();
        if (!clean) return rootFolder;
        if (clean === rootFolder || clean.startsWith(`${rootFolder}/`)) {
            return clean;
        }
        return `${rootFolder}/${clean}`;
    }

    // ============ UPLOAD FILE ============
    async uploadFile(filePath, options = {}) {
        try {
            if (!filePath || !fs.existsSync(filePath)) {
                throw new Error('File does not exist');
            }

            const uploadOptions = {
                resource_type: options.resource_type || 'auto',
                use_filename: true,
                unique_filename: true,
                ...options,
                folder: this.resolveFolder(options.folder),
            };

            const result = await cloudinary.uploader.upload(filePath, uploadOptions);

            // Delete temp file after upload
            this.deleteTempFile(filePath);

            return {
                success: true,
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
                created_at: result.created_at,
            };
        } catch (error) {
            this.deleteTempFile(filePath);
            logger.error('Cloudinary upload failed:', error);
            throw ApiError.internal(`File upload failed: ${error.message}`);
        }
    }

    // ============ UPLOAD MULTIPLE FILES ============
    async uploadMultipleFiles(filePaths, options = {}) {
        const results = [];
        const errors = [];

        for (const filePath of filePaths) {
            try {
                const result = await this.uploadFile(filePath, options);
                results.push(result);
            } catch (error) {
                errors.push({ file: filePath, error: error.message });
            }
        }

        return { success: results, errors };
    }

    // ============ UPLOAD BUFFER ============
    async uploadBuffer(buffer, options = {}) {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                resource_type: options.resource_type || 'auto',
                use_filename: true,
                unique_filename: true,
                ...options,
                folder: this.resolveFolder(options.folder),
            };

            const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    logger.error('Cloudinary upload failed:', error);
                    reject(ApiError.internal(`File upload failed: ${error.message}`));
                } else {
                    resolve({
                        success: true,
                        url: result.secure_url,
                        public_id: result.public_id,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                        bytes: result.bytes,
                        created_at: result.created_at,
                    });
                }
            });

            uploadStream.end(buffer);
        });
    }

    // ============ EXTRACT PUBLIC ID & RESOURCE TYPE FROM URL OR PUBLIC ID ============
    extractPublicId(urlOrPublicId) {
        if (!urlOrPublicId || typeof urlOrPublicId !== 'string') return null;
        const trimmed = urlOrPublicId.trim();

        // If it's already a public_id (not a full URL)
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            const cleanId = trimmed.replace(/\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|mov|avi|pdf|doc|docx|xls|xlsx)$/i, '');
            return {
                publicId: cleanId,
                resourceType: 'image'
            };
        }

        const uploadIndex = trimmed.indexOf('/upload/');
        if (uploadIndex === -1) {
            return null;
        }

        // Determine resourceType from segment before /upload/
        const beforeUpload = trimmed.substring(0, uploadIndex);
        let resourceType = 'image';
        if (beforeUpload.endsWith('/video')) {
            resourceType = 'video';
        } else if (beforeUpload.endsWith('/raw')) {
            resourceType = 'raw';
        }

        // Get path after /upload/
        let afterUpload = trimmed.substring(uploadIndex + '/upload/'.length);

        // Strip queries/hashes
        afterUpload = afterUpload.split('?')[0].split('#')[0];

        // Process segments, skipping version numbers and transformation params
        const segments = afterUpload.split('/');
        const pathSegments = [];

        for (const segment of segments) {
            if (/^v\d+$/.test(segment)) {
                continue;
            }
            if (segment.startsWith('s--') && segment.endsWith('--')) {
                continue;
            }
            if (/^[a-z]_[a-zA-Z0-9_,-]+$/i.test(segment) || /^[a-z]+,[a-z0-9_,-]+$/i.test(segment)) {
                continue;
            }
            pathSegments.push(segment);
        }

        if (pathSegments.length === 0) return null;

        const fullPath = pathSegments.join('/');
        const publicId = fullPath.replace(/\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|mov|avi|pdf|doc|docx|xls|xlsx)$/i, '');

        return {
            publicId,
            resourceType
        };
    }

    // ============ DELETE FILE ============
    async deleteFile(urlOrPublicId, options = {}) {
        try {
            if (!urlOrPublicId) {
                return { success: false, reason: 'No identifier provided' };
            }

            // Handle local file deletion if it is a local upload path
            if (typeof urlOrPublicId === 'string' && (urlOrPublicId.startsWith('/uploads/') || urlOrPublicId.startsWith('uploads/'))) {
                const localPath = path.join(__dirname, '../../', urlOrPublicId.replace(/^\//, ''));
                if (fs.existsSync(localPath)) {
                    try { fs.unlinkSync(localPath); } catch (_) {}
                }
                return { success: true, local: true };
            }

            const info = this.extractPublicId(urlOrPublicId);
            if (!info || !info.publicId) {
                return { success: false, reason: 'Could not extract Cloudinary public ID' };
            }

            const resourceType = options.resource_type || info.resourceType || 'image';

            let result = await cloudinary.uploader.destroy(info.publicId, {
                resource_type: resourceType,
                invalidate: true,
                ...options,
            });

            // If not found with default resource type, try alternative types
            if (result && result.result === 'not found' && !options.resource_type) {
                const alternateTypes = ['video', 'raw', 'image'].filter(t => t !== resourceType);
                for (const altType of alternateTypes) {
                    try {
                        const retryResult = await cloudinary.uploader.destroy(info.publicId, {
                            resource_type: altType,
                            invalidate: true,
                        });
                        if (retryResult && retryResult.result === 'ok') {
                            result = retryResult;
                            break;
                        }
                    } catch (_) {}
                }
            }

            const isOk = result && result.result === 'ok';
            if (isOk) {
                logger.info(`Deleted from Cloudinary: ${info.publicId} (${resourceType})`);
            } else {
                logger.warn(`Cloudinary destroy returned: ${result?.result || 'error'} for ${info.publicId}`);
            }

            return { success: isOk, result, publicId: info.publicId };
        } catch (error) {
            logger.error('Cloudinary delete failed:', error);
            return { success: false, error: error.message };
        }
    }

    // ============ DELETE MULTIPLE FILES ============
    async deleteMultipleFiles(urlOrPublicIds, options = {}) {
        if (!Array.isArray(urlOrPublicIds) || urlOrPublicIds.length === 0) return [];
        const results = [];
        for (const item of urlOrPublicIds) {
            const res = await this.deleteFile(item, options);
            results.push(res);
        }
        return results;
    }

    // ============ GET OPTIMIZED URL ============
    getOptimizedUrl(publicId, options = {}) {
        if (!publicId) return null;

        return cloudinary.url(publicId, {
            width: options.width || 500,
            height: options.height || 500,
            crop: options.crop || 'fill',
            quality: options.quality || 'auto',
            format: options.format || 'webp',
            gravity: options.gravity || 'center',
            ...options,
        });
    }

    // ============ GET THUMBNAIL URL ============
    getThumbnailUrl(publicId, size = 200) {
        return this.getOptimizedUrl(publicId, {
            width: size,
            height: size,
            crop: 'thumb',
            gravity: 'face',
            format: 'webp',
        });
    }

    // ============ DELETE TEMP FILE ============
    deleteTempFile(filePath) {
        try {
            if (filePath && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error deleting temp file:', error);
            return false;
        }
    }

    // ============ CLEANUP TEMP FOLDER ============
    cleanupTempFolder(ageInHours = 1) {
        const tempDir = path.join(__dirname, '../uploads/temp');
        if (!fs.existsSync(tempDir)) return { deletedCount: 0 };

        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        let deletedCount = 0;

        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            const fileAge = (now - stats.mtimeMs) / (1000 * 60 * 60);

            if (fileAge > ageInHours) {
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } catch (error) {
                    logger.error('Error deleting temp file:', filePath, error);
                }
            }
        }

        return { deletedCount, ageLimit: ageInHours };
    }

    // ============ GET FILE INFO ============
    async getFileInfo(publicId) {
        try {
            const result = await cloudinary.api.resource(publicId);
            return {
                success: true,
                public_id: result.public_id,
                format: result.format,
                version: result.version,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                url: result.secure_url,
                created_at: result.created_at,
            };
        } catch (error) {
            logger.error('Cloudinary get file info failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Schedule cleanup every hour
const cloudinaryHelper = new CloudinaryHelper();
setInterval(() => {
    cloudinaryHelper.cleanupTempFolder(1);
}, 60 * 60 * 1000);

module.exports = cloudinaryHelper;