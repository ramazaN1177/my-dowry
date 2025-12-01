import { Dowry, DowryStatus } from "../entities/dowry.entity";
import { Request, Response } from "express";
import { AppDataSource } from '../db/connectDB';
import { MinioService } from '../services/minio.service';
import { Like } from 'typeorm';
import crypto from 'crypto';

interface AuthRequest extends Request {
    userId?: string;
    file?: Express.Multer.File;
}

export const createDowry = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, Category, dowryPrice, dowryLocation, status, url } = req.body;

        if (!name || !Category) {
            res.status(400).json({
                success: false,
                message: "Missing required fields: name, Category"
            });
            return;
        }

        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        // Validate price is a number if provided
        if (dowryPrice !== undefined && (typeof dowryPrice !== 'number' || dowryPrice < 0)) {
            res.status(400).json({
                success: false,
                message: "dowryPrice must be a non-negative number"
            });
            return;
        }

        // Validate status if provided
        if (status && !['purchased', 'not_purchased'].includes(status)) {
            res.status(400).json({
                success: false,
                message: "Status must be either 'purchased' or 'not_purchased'"
            });
            return;
        }

        // Validate URL format if provided
        if (url) {
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*(\?[^#]*)?(\#[^]*)?$/;
            if (!urlRegex.test(url)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid URL format. Please provide a valid URL (e.g., https://example.com)"
                });
                return;
            }
        }

        const dowryRepository = AppDataSource.getRepository(Dowry);
        let imageUrl: string | null = null;

        // If image file is uploaded, upload to MinIO and get public URL
        if (req.file) {
            try {
                const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${req.file.mimetype.split('/')[1]}`;
                
                // Upload to MinIO
                const minioPath = await MinioService.uploadFile(
                    req.file.buffer,
                    filename,
                    req.file.mimetype,
                    userId
                );

                // Get public URL
                imageUrl = MinioService.getPublicUrl(minioPath);
            } catch (imageError) {
                console.error('Error uploading image:', imageError);
                res.status(500).json({
                    success: false,
                    message: "Failed to upload image",
                    error: process.env.NODE_ENV === 'development' ? (imageError as Error).message : undefined
                });
                return;
            }
        }

        // Create dowry
        const dowry = dowryRepository.create({
            name,
            description: description || null,
            categoryId: Category,
            dowryPrice: dowryPrice ? parseFloat(dowryPrice.toString()) : null,
            dowryLocation: dowryLocation || null,
            status: (status || 'not_purchased') as DowryStatus,
            userId,
            url: url || null,
            imageUrl: imageUrl
        });

        const savedDowry = await dowryRepository.findOne({
            where: { id: (await dowryRepository.save(dowry)).id },
            relations: ['category']
        });

        res.status(201).json({ 
            success: true, 
            message: "Dowry created successfully", 
            dowry: savedDowry 
        });
    } catch (error) {
        console.error('Create Dowry Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}

export const getDowries = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const { status, Category, search, page = 1, limit = 10 } = req.query;

        // Validate status if provided
        if (status && !['purchased', 'not_purchased'].includes(status as string)) {
            res.status(400).json({
                success: false,
                message: "Status must be either 'purchased' or 'not_purchased'"
            });
            return;
        }

        const dowryRepository = AppDataSource.getRepository(Dowry);
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Build where conditions
        const whereConditions: any = { userId: req.userId };

        if (status) {
            whereConditions.status = status;
        }

        if (Category) {
            whereConditions.categoryId = Category;
        }

        // Search query
        let where: any = whereConditions;
        if (search) {
            where = [
                { ...whereConditions, name: Like(`%${search}%`) },
                { ...whereConditions, description: Like(`%${search}%`) }
            ];
        }

        const [dowries, total] = await dowryRepository.findAndCount({
            where: where,
            skip: skip,
            take: limitNum,
            order: { createdAt: 'DESC' },
            relations: ['category']
        });

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            message: "Dowries fetched successfully",
            dowries: dowries,
            pagination: {
                total,
                page: pageNum,
                pages: totalPages,
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('Get Dowries Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}

export const getDowryById = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const dowryRepository = AppDataSource.getRepository(Dowry);
        const dowry = await dowryRepository.findOne({
            where: { id: req.params.id, userId: req.userId },
            relations: ['category']
        });

        if (!dowry) {
            res.status(404).json({
                success: false,
                message: "Dowry not found or you don't have permission to access it"
            });
            return;
        }

        res.status(200).json({ success: true, message: "Dowry fetched successfully", dowry: dowry });
    } catch (error) {
        console.error('Get Dowry Error:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const updateDowry = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const { url } = req.body;

        // Validate URL format if provided
        if (url) {
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*(\?[^#]*)?(\#[^]*)?$/;
            if (!urlRegex.test(url)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid URL format. Please provide a valid URL (e.g., https://example.com)"
                });
                return;
            }
        }

        const dowryRepository = AppDataSource.getRepository(Dowry);
        const dowry = await dowryRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!dowry) {
            res.status(404).json({
                success: false,
                message: "Dowry not found or you don't have permission to update it"
            });
            return;
        }

        // Handle image upload if file is provided
        if (req.file) {
            try {
                // Delete old image from MinIO if exists
                if (dowry.imageUrl) {
                    try {
                        // Extract minioPath from imageUrl
                        const minioPath = MinioService.extractMinioPathFromUrl(dowry.imageUrl);
                        if (minioPath) {
                            await MinioService.deleteFile(minioPath);
                        }
                    } catch (imageError) {
                        console.error('Error deleting old image:', imageError);
                    }
                }

                // Upload new image
                const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${req.file.mimetype.split('/')[1]}`;
                const minioPath = await MinioService.uploadFile(
                    req.file.buffer,
                    filename,
                    req.file.mimetype,
                    req.userId!
                );

                // Get public URL
                dowry.imageUrl = MinioService.getPublicUrl(minioPath);
            } catch (imageError) {
                console.error('Error uploading image:', imageError);
                res.status(500).json({
                    success: false,
                    message: "Failed to upload image",
                    error: process.env.NODE_ENV === 'development' ? (imageError as Error).message : undefined
                });
                return;
            }
        }

        // Update allowed fields
        if (req.body.name !== undefined) dowry.name = req.body.name;
        if (req.body.description !== undefined) dowry.description = req.body.description;
        if (req.body.categoryId !== undefined) dowry.categoryId = req.body.categoryId;
        if (req.body.dowryPrice !== undefined) dowry.dowryPrice = req.body.dowryPrice ? parseFloat(req.body.dowryPrice.toString()) : null;
        if (req.body.dowryLocation !== undefined) dowry.dowryLocation = req.body.dowryLocation;
        if (req.body.status !== undefined) dowry.status = req.body.status as DowryStatus;
        if (req.body.url !== undefined) dowry.url = req.body.url;

        const updatedDowry = await dowryRepository.save(dowry);

        // Fetch updated dowry with relations
        const dowryWithRelations = await dowryRepository.findOne({
            where: { id: updatedDowry.id },
            relations: ['category']
        });

        res.status(200).json({ success: true, message: "Dowry updated successfully", dowry: dowryWithRelations });
    } catch (error) {
        console.error('Update Dowry Error:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const updateDowryStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const { status } = req.body;

        // Validate status
        if (!status || !['purchased', 'not_purchased'].includes(status)) {
            res.status(400).json({
                success: false,
                message: "Status must be either 'purchased' or 'not_purchased'"
            });
            return;
        }

        const dowryRepository = AppDataSource.getRepository(Dowry);
        const dowry = await dowryRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!dowry) {
            res.status(404).json({
                success: false,
                message: "Dowry not found or you don't have permission to update it"
            });
            return;
        }

        dowry.status = status as DowryStatus;
        await dowryRepository.save(dowry);

        res.status(200).json({
            success: true,
            message: `Dowry status updated to ${status} successfully`,
            dowry
        });
    } catch (error) {
        console.error('Update Dowry Status Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}

export const deleteDowryImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const dowryRepository = AppDataSource.getRepository(Dowry);

        // Find the dowry
        const dowry = await dowryRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!dowry) {
            res.status(404).json({
                success: false,
                message: "Dowry not found or you don't have permission to access it"
            });
            return;
        }

        // Check if dowry has an image
        if (!dowry.imageUrl) {
            res.status(404).json({
                success: false,
                message: "Dowry has no image to delete"
            });
            return;
        }

        // Delete the image from MinIO
        try {
            // Extract minioPath from imageUrl
            const minioPath = MinioService.extractMinioPathFromUrl(dowry.imageUrl);
            if (minioPath) {
                await MinioService.deleteFile(minioPath);
                console.log(`Image deleted successfully: ${minioPath}`);
            }
        } catch (imageError) {
            console.error('Error deleting image from MinIO:', imageError);
            // Continue even if MinIO deletion fails
        }

        // Remove image reference from dowry
        dowry.imageUrl = null;
        await dowryRepository.save(dowry);

        res.status(200).json({
            success: true,
            message: "Dowry image deleted successfully",
            dowry
        });
    } catch (error) {
        console.error('Delete Dowry Image Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}

export const deleteDowry = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const dowryRepository = AppDataSource.getRepository(Dowry);

        // First find the dowry
        const dowry = await dowryRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!dowry) {
            res.status(404).json({
                success: false,
                message: "Dowry not found or you don't have permission to delete it"
            });
            return;
        }

        // Delete associated image from MinIO if exists
        if (dowry.imageUrl) {
            try {
                // Extract minioPath from imageUrl
                const minioPath = MinioService.extractMinioPathFromUrl(dowry.imageUrl);
                if (minioPath) {
                    await MinioService.deleteFile(minioPath);
                    console.log(`Associated image deleted successfully: ${minioPath}`);
                }
            } catch (imageError) {
                console.error('Error deleting associated image:', imageError);
                // Continue even if MinIO deletion fails
            }
        }

        // Delete the dowry
        await dowryRepository.remove(dowry);

        res.status(200).json({
            success: true,
            message: "Dowry and associated image deleted successfully"
        });
    } catch (error) {
        console.error('Delete Dowry Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}
