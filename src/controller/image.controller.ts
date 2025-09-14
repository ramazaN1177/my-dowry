import { Request, Response } from 'express';
import { Image } from '../models/image.model';

interface AuthRequest extends Request {
    userId?: string;
    file?: Express.Multer.File;
}

// Upload image
export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
            return;
        }

        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        // Validate file type
        if (!req.file.mimetype.startsWith('image/')) {
            res.status(400).json({
                success: false,
                message: 'Only image files are allowed'
            });
            return;
        }

        // Check if base64 data exists
        const base64Data = (req.file as any).base64Data;
        const filename = (req.file as any).filename;
        
        if (!base64Data || !filename) {
            console.error('Base64 data or filename not found in uploaded file');
            console.error('File object:', req.file);
            res.status(500).json({
                success: false,
                message: 'File upload failed - Base64 data not found. Please try again.'
            });
            return;
        }

        // Create image record
        const image = new Image({
            filename: filename,
            originalName: req.file.originalname,
            contentType: req.file.mimetype,
            size: req.file.size,
            data: base64Data, // Store base64 data directly
            userId: req.userId
        });

        await image.save();

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            image: {
                id: image._id,
                filename: image.filename,
                originalName: image.originalName,
                contentType: image.contentType,
                size: image.size,
                data: image.data, // Include base64 data in response
                createdAt: image.createdAt
            }
        });

    } catch (error) {
        console.error('Upload Image Error:', error);
        
        // Check if it's a MongoDB validation error
        if (error instanceof Error && error.name === 'ValidationError') {
            res.status(400).json({
                success: false,
                message: 'Invalid image data',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
            return;
        }

        // Check if it's a MongoDB duplicate key error
        if (error instanceof Error && (error as any).code === 11000) {
            res.status(409).json({
                success: false,
                message: 'Image with this filename already exists'
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

// Get image by ID
export const getImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Get image metadata
        const image = await Image.findById(id);
        if (!image) {
            res.status(404).json({
                success: false,
                message: 'Image not found'
            });
            return;
        }

        // Check if user has permission to access this image
        if (image.userId.toString() !== req.userId) {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
            return;
        }

        // Serve base64 image data
        const base64Data = image.data;
        if (base64Data) {
            // Convert base64 to buffer
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            res.set({
                'Content-Type': image.contentType,
                'Content-Disposition': `inline; filename="${image.originalName}"`,
                'Content-Length': imageBuffer.length,
                'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
            });
            
            res.send(imageBuffer);
            return;
        } else {
            res.status(404).json({
                success: false,
                message: 'Image data not found'
            });
        }

    } catch (error) {
        console.error('Get Image Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

// Delete image
export const deleteImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Get image metadata
        const image = await Image.findById(id);
        if (!image) {
            res.status(404).json({
                success: false,
                message: 'Image not found'
            });
            return;
        }

        // Check if user has permission to delete this image
        if (image.userId.toString() !== req.userId) {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
            return;
        }

        // Delete image record (base64 data is stored in database)
        await Image.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully'
        });

    } catch (error) {
        console.error('Delete Image Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};

// Get user's images
export const getUserImages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        const images = await Image.find({ userId: req.userId })
            .select('-data') // Exclude base64 data for list view (too large)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Images fetched successfully',
            images
        });

    } catch (error) {
        console.error('Get User Images Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};
