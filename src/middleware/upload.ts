import multer from 'multer';
import crypto from 'crypto';

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Memory storage to convert files to base64
const memoryStorage = multer.memoryStorage();

// Single file upload with base64 conversion
export const uploadSingle = (req: any, res: any, next: any) => {
    try {
        console.log('Upload request received - Converting to base64');
        
        // Use memory storage
        const multerInstance = multer({
            storage: memoryStorage,
            fileFilter: fileFilter,
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB limit
            }
        });
        
        multerInstance.single('image')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
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
                console.error('Upload error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'File upload failed: ' + err.message
                });
            }
            
            // Convert file to base64
            if (req.file) {
                const base64Data = req.file.buffer.toString('base64');
                const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${req.file.mimetype.split('/')[1]}`;
                
                // Add base64 data and filename to file object
                (req.file as any).base64Data = base64Data;
                (req.file as any).filename = filename;
                (req.file as any).id = filename;
                
                console.log('File converted to base64 successfully:', filename);
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

// Multiple files upload with base64 conversion
export const uploadMultiple = (req: any, res: any, next: any) => {
    try {
        const multerInstance = multer({
            storage: memoryStorage,
            fileFilter: fileFilter,
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB limit
            }
        });

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
            
            // Convert files to base64
            if (req.files) {
                req.files.forEach((file: any) => {
                    const base64Data = file.buffer.toString('base64');
                    const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${file.mimetype.split('/')[1]}`;
                    
                    file.base64Data = base64Data;
                    file.filename = filename;
                    file.id = filename;
                });
                console.log('Multiple files converted to base64 successfully');
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
    return true; // Simple storage is always ready
};
