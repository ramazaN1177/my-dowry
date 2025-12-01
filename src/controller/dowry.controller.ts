import { Dowry, DowryStatus } from "../entities/dowry.entity";
import { Image } from "../entities/image.entity";
import { Request, Response } from "express";
import { AppDataSource } from '../db/connectDB';
import { MinioService } from '../services/minio.service';
import { Like } from 'typeorm';

interface AuthRequest extends Request {
    userId?: string;
}

export const createDowry = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, Category, dowryPrice, dowryLocation, status, imageId, url } = req.body;

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
        const dowry = dowryRepository.create({
            name,
            description: description || null,
            categoryId: Category,
            dowryPrice: dowryPrice ? parseFloat(dowryPrice.toString()) : null,
            dowryImageId: imageId || null,
            dowryLocation: dowryLocation || null,
            status: (status || 'not_purchased') as DowryStatus,
            userId,
            url: url || null
        });

        await dowryRepository.save(dowry);
        res.status(201).json({ success: true, message: "Dowry created successfully", dowry });
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

        const { status, Category, search, page = 1, limit = 10, isRead } = req.query;

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

        if (isRead !== undefined && isRead !== null && isRead !== '') {
            const readValue = typeof isRead === 'string' ? isRead : String(isRead);
            whereConditions.isRead = readValue === 'true';
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
            relations: ['category', 'dowryImage']
        });

        // Add image URLs
        const dowriesWithImages = await Promise.all(
            dowries.map(async (dowry) => {
                const dowryObj: any = { ...dowry };
                if (dowry.dowryImageId) {
                    const image = await AppDataSource.getRepository(Image).findOne({
                        where: { id: dowry.dowryImageId }
                    });
                    if (image) {
                        dowryObj.imageUrl = MinioService.getPublicUrl(image.minioPath);
                    }
                }
                return dowryObj;
            })
        );

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            message: "Dowries fetched successfully",
            dowries: dowriesWithImages,
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
            relations: ['category', 'dowryImage']
        });

        if (!dowry) {
            res.status(404).json({
                success: false,
                message: "Dowry not found or you don't have permission to access it"
            });
            return;
        }

        // Add image URL if exists
        const dowryObj: any = { ...dowry };
        if (dowry.dowryImageId) {
            const image = await AppDataSource.getRepository(Image).findOne({
                where: { id: dowry.dowryImageId }
            });
            if (image) {
                dowryObj.imageUrl = MinioService.getPublicUrl(image.minioPath);
            }
        }

        res.status(200).json({ success: true, message: "Dowry fetched successfully", dowry: dowryObj });
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

        // Update allowed fields
        if (req.body.name !== undefined) dowry.name = req.body.name;
        if (req.body.description !== undefined) dowry.description = req.body.description;
        if (req.body.categoryId !== undefined) dowry.categoryId = req.body.categoryId;
        if (req.body.dowryPrice !== undefined) dowry.dowryPrice = req.body.dowryPrice ? parseFloat(req.body.dowryPrice.toString()) : null;
        if (req.body.dowryLocation !== undefined) dowry.dowryLocation = req.body.dowryLocation;
        if (req.body.status !== undefined) dowry.status = req.body.status as DowryStatus;
        if (req.body.isRead !== undefined) dowry.isRead = req.body.isRead;
        if (req.body.url !== undefined) dowry.url = req.body.url;

        await dowryRepository.save(dowry);

        res.status(200).json({ success: true, message: "Dowry updated successfully", dowry });
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

export const updateDowryImage = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const { imageId } = req.body;

        if (!imageId) {
            res.status(400).json({
                success: false,
                message: "imageId is required"
            });
            return;
        }

        const dowryRepository = AppDataSource.getRepository(Dowry);
        const imageRepository = AppDataSource.getRepository(Image);

        // Find the dowry
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

        // Verify image exists and belongs to user
        const newImage = await imageRepository.findOne({
            where: { id: imageId, userId: req.userId }
        });

        if (!newImage) {
            res.status(404).json({
                success: false,
                message: "Image not found or you don't have permission to use it"
            });
            return;
        }

        // If dowry has an existing image, delete it from MinIO and DB
        if (dowry.dowryImageId) {
            try {
                const oldImage = await imageRepository.findOne({
                    where: { id: dowry.dowryImageId }
                });
                if (oldImage) {
                    await MinioService.deleteFile(oldImage.minioPath);
                    await imageRepository.remove(oldImage);
                    console.log(`Previous image ${dowry.dowryImageId} deleted successfully`);
                }
            } catch (imageError) {
                console.error('Error deleting previous image:', imageError);
            }
        }

        // Update dowry with new image
        dowry.dowryImageId = imageId;
        await dowryRepository.save(dowry);

        res.status(200).json({
            success: true,
            message: "Dowry image updated successfully",
            dowry
        });
    } catch (error) {
        console.error('Update Dowry Image Error:', error);
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
        const imageRepository = AppDataSource.getRepository(Image);

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
        if (!dowry.dowryImageId) {
            res.status(404).json({
                success: false,
                message: "Dowry has no image to delete"
            });
            return;
        }

        // Delete the image from MinIO and database
        try {
            const image = await imageRepository.findOne({
                where: { id: dowry.dowryImageId }
            });

            if (image) {
                await MinioService.deleteFile(image.minioPath);
                await imageRepository.remove(image);
                console.log(`Image ${dowry.dowryImageId} deleted successfully`);
            }
        } catch (imageError) {
            console.error('Error deleting image:', imageError);
            res.status(500).json({
                success: false,
                message: "Error deleting image"
            });
            return;
        }

        // Remove image reference from dowry
        dowry.dowryImageId = null;
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
        const imageRepository = AppDataSource.getRepository(Image);

        // First find the dowry
        const dowry = await dowryRepository.findOne({
            where: { id: req.params.id, userId: req.userId },
            relations: ['images']
        });

        if (!dowry) {
            res.status(404).json({
                success: false,
                message: "Dowry not found or you don't have permission to delete it"
            });
            return;
        }

        // Delete associated images from MinIO and database
        if (dowry.dowryImageId) {
            try {
                const image = await imageRepository.findOne({
                    where: { id: dowry.dowryImageId }
                });
                if (image) {
                    await MinioService.deleteFile(image.minioPath);
                    await imageRepository.remove(image);
                    console.log(`Associated image ${dowry.dowryImageId} deleted successfully`);
                }
            } catch (imageError) {
                console.error('Error deleting associated image:', imageError);
            }
        }

        // Delete all images associated with this dowry
        if (dowry.images && dowry.images.length > 0) {
            for (const img of dowry.images) {
                try {
                    await MinioService.deleteFile(img.minioPath);
                    await imageRepository.remove(img);
                } catch (error) {
                    console.error(`Error deleting image ${img.id}:`, error);
                }
            }
        }

        // Delete the dowry
        await dowryRepository.remove(dowry);

        res.status(200).json({
            success: true,
            message: "Dowry and associated images deleted successfully"
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
