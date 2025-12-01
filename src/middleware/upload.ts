import multer from 'multer';

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Memory storage - MinIO'ya yüklemek için buffer tutuyoruz
const memoryStorage = multer.memoryStorage();

// Single file upload - buffer olarak tut (MinIO'ya yüklenecek)
export const uploadSingle = (req: any, res: any, next: any) => {
    try {
        const multerInstance = multer({
            storage: memoryStorage,
            fileFilter: fileFilter,
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            }
        });

        multerInstance.single('image')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error('Multer error:', err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 10MB.'
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
        console.error('Failed to initialize multer:', error);
        return res.status(500).json({
            success: false,
            message: 'Upload system not ready. Please try again.'
        });
    }
};

// Multiple files upload - buffer olarak tut
export const uploadMultiple = (req: any, res: any, next: any) => {
    try {
        const multerInstance = multer({
            storage: memoryStorage,
            fileFilter: fileFilter,
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
            }
        });

        multerInstance.array('images', 5)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                console.error('Multer error:', err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'One or more files too large. Maximum size is 10MB per file.'
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
    return true; // MinIO storage is ready
};
