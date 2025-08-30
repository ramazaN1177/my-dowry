import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';

// Create storage function that initializes after database connection
let storage: any = null;
let storageInitialized = false;

const createStorage = () => {
    if (!mongoose.connection.db) {
        throw new Error('Database not connected');
    }
    
    return new GridFsStorage({
        db: mongoose.connection.db,
        file: (req, file) => {
            return {
                bucketName: 'uploads',
                filename: `${Date.now()}-${file.originalname}`,
                metadata: {
                    userId: (req as any).userId, // Type assertion for userId
                    originalName: file.originalname,
                    contentType: file.mimetype
                }
            };
        }
    });
};

// Initialize storage when database is ready
mongoose.connection.once('open', () => {
    initializeStorage();
});

// Also try to initialize when connection is already open
if (mongoose.connection.readyState === 1) {
    initializeStorage();
}

function initializeStorage() {
    try {
        storage = createStorage();
        storageInitialized = true;
        console.log('GridFS storage initialized successfully');
    } catch (error) {
        console.error('Failed to initialize GridFS storage:', error);
        storageInitialized = false;
        
        // Retry after a short delay
        setTimeout(() => {
            if (!storageInitialized) {
                console.log('Retrying GridFS storage initialization...');
                initializeStorage();
            }
        }, 2000);
    }
}

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Function to get multer instance with proper storage
const getMulter = () => {
    if (!storageInitialized || !storage) {
        throw new Error('GridFS storage not initialized. Database may not be connected.');
    }
    
    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        }
    });
};

// Single file upload with error handling
export const uploadSingle = (req: any, res: any, next: any) => {
    try {
        console.log('Upload request received. Storage initialized:', storageInitialized);
        console.log('Storage object exists:', !!storage);
        console.log('Database connection state:', mongoose.connection.readyState);
        
        // Check if storage is initialized
        if (!storageInitialized || !storage) {
            console.log('Storage not ready, returning 503');
            return res.status(503).json({
                success: false,
                message: 'Upload system is initializing. Please try again in a moment.'
            });
        }

        const multerInstance = getMulter();
        multerInstance.single('image')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading
                console.error('Multer error:', err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 5MB.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + err.message
                });
            } else if (err) {
                // An unknown error occurred
                console.error('Upload error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'File upload failed: ' + err.message
                });
            }
            // Everything went fine
            next();
        });
    } catch (error) {
        console.error('Failed to initialize multer:', error);
        return res.status(500).json({
            success: false,
            message: 'Upload system not ready. Please try again.'
        });
    }
};

// Multiple files upload with error handling
export const uploadMultiple = (req: any, res: any, next: any) => {
    try {
        // Check if storage is initialized
        if (!storageInitialized || !storage) {
            return res.status(503).json({
                success: false,
                message: 'Upload system is initializing. Please try again in a moment.'
            });
        }

        const multerInstance = getMulter();
        multerInstance.array('images', 5)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error('Multer error:', err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'One or more files too large. Maximum size is 5MB per file.'
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: 'File upload error: ' + err.message
                });
            } else if (err) {
                console.error('Upload error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'File upload failed: ' + err.message
                });
            }
            next();
        });
    } catch (error) {
        console.error('Failed to initialize multer for multiple upload:', error);
        return res.status(500).json({
            success: false,
            message: 'Upload system not ready. Please try again.'
        });
    }
};

// Export a function to check if storage is ready
export const isStorageReady = () => {
    return storageInitialized && storage !== null;
};

// Export the initializeStorage function for manual initialization
export { initializeStorage };

// Legacy export for backward compatibility (but it won't work until storage is initialized)
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});
