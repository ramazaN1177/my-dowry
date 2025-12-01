import { Request, Response } from 'express';
import { AppDataSource } from '../db/connectDB';
import { Image } from '../entities/image.entity';
import { MinioService } from '../services/minio.service';
import crypto from 'crypto';

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

        const imageRepository = AppDataSource.getRepository(Image);
        const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${req.file.mimetype.split('/')[1]}`;

        // Upload to MinIO
        const minioPath = await MinioService.uploadFile(
            req.file.buffer,
            filename,
            req.file.mimetype,
            req.userId
        );

        // Save to PostgreSQL
        const image = imageRepository.create({
            filename: filename,
            originalName: req.file.originalname,
            contentType: req.file.mimetype,
            size: req.file.size,
            minioPath: minioPath,
            userId: req.userId
        });

        const savedImage = await imageRepository.save(image);

        // Get public URL
        const imageUrl = MinioService.getPublicUrl(minioPath);

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            image: {
                id: savedImage.id,
                filename: savedImage.filename,
                originalName: savedImage.originalName,
                contentType: savedImage.contentType,
                size: savedImage.size,
                url: imageUrl,
                createdAt: savedImage.createdAt
            }
        });
    } catch (error) {
        console.error('Upload Image Error:', error);
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
        const imageRepository = AppDataSource.getRepository(Image);

        const image = await imageRepository.findOne({
            where: { id: id }
        });

        if (!image) {
            res.status(404).json({
                success: false,
                message: 'Image not found'
            });
            return;
        }

        if (image.userId !== req.userId) {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
            return;
        }

        // Download from MinIO
        const imageBuffer = await MinioService.downloadFile(image.minioPath);

        res.set({
            'Content-Type': image.contentType,
            'Content-Disposition': `inline; filename="${image.originalName}"`,
            'Content-Length': imageBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000'
        });

        res.send(imageBuffer);
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
        const imageRepository = AppDataSource.getRepository(Image);

        const image = await imageRepository.findOne({
            where: { id: id }
        });

        if (!image) {
            res.status(404).json({
                success: false,
                message: 'Image not found'
            });
            return;
        }

        if (image.userId !== req.userId) {
            res.status(403).json({
                success: false,
                message: 'Access denied'
            });
            return;
        }

        // Delete from MinIO
        await MinioService.deleteFile(image.minioPath);

        // Delete from PostgreSQL
        await imageRepository.remove(image);

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

        const imageRepository = AppDataSource.getRepository(Image);

        const images = await imageRepository.find({
            where: { userId: req.userId },
            order: { createdAt: 'DESC' }
        });

        // Add public URLs
        const imagesWithUrls = images.map(image => ({
            id: image.id,
            filename: image.filename,
            originalName: image.originalName,
            contentType: image.contentType,
            size: image.size,
            url: MinioService.getPublicUrl(image.minioPath),
            createdAt: image.createdAt
        }));

        res.status(200).json({
            success: true,
            message: 'Images fetched successfully',
            images: imagesWithUrls
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

// Process image with OCR
export const processImageOCR = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }

        const imageRepository = AppDataSource.getRepository(Image);
        const image = await imageRepository.findOne({
            where: { id: id, userId: req.userId }
        });

        if (!image) {
            res.status(404).json({
                success: false,
                message: 'Image not found or you don\'t have permission to access it'
            });
            return;
        }

        // OCR service is temporarily disabled
        console.log('OCR service is temporarily disabled for image:', id);

        res.status(200).json({
            success: true,
            message: 'OCR service is temporarily disabled',
            bookInfo: null
        });
    } catch (error) {
        console.error('Process Image OCR Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process image with OCR',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
};
