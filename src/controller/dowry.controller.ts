import { Dowry } from "../models/dowry.model";
import { Image } from "../models/image.model";
import { Request, Response } from "express";
import mongoose from "mongoose";

interface AuthRequest extends Request {
    userId?: string;
}
 
export const createDowry = async (req: AuthRequest, res: Response) => {
    try {
        // Validate required fields
        const { name, description, Category, dowryPrice, dowryLocation, status, imageId, url } = req.body;
        
        if (!name || !Category) {
            res.status(400).json({ 
                success: false, 
                message: "Missing required fields: name, Category" 
            });
            return;
        }

        // Validate userId
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

        // Validate imageId is a valid ObjectId
        if (imageId && !mongoose.Types.ObjectId.isValid(imageId)) {
            res.status(400).json({ 
                success: false, 
                message: "Invalid imageId format" 
            });
            return;
        }

        // Validate URL format if provided
        if (url) {
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlRegex.test(url)) {
                res.status(400).json({ 
                    success: false, 
                    message: "Invalid URL format. Please provide a valid URL (e.g., https://example.com)" 
                });
                return;
            }
        }

        const dowry = new Dowry({ 
            name, 
            description, 
            Category, 
            dowryPrice, 
            dowryImage: imageId, // Store imageId instead of image string
            dowryLocation, 
            status: status || 'not_purchased',
            userId,
            url
        });
        
        await dowry.save();
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

        // Build filter object
        const filter: any = { userId: req.userId };
        if (status) {
            filter.status = status;
        }
        if (Category) {
            filter.Category = Category;
        }
        if (isRead !== undefined && isRead !== null && isRead !== '') {
            // Convert string to boolean
            const readValue = typeof isRead === 'string' ? isRead : String(isRead);
            filter.isRead = readValue === 'true';
        }
        if (search) {
            // Search in name and description fields (case-insensitive)
            filter.$or = [
                { name: { $regex: search as string, $options: 'i' } },
                { description: { $regex: search as string, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const total = await Dowry.countDocuments(filter);
        
        // Get dowries with pagination
        const dowries = await Dowry.find(filter)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({ 
            success: true, 
            message: "Dowries fetched successfully", 
            dowries,
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
        const dowry = await Dowry.findOne({ _id: req.params.id, userId: req.userId });
        
        if (!dowry) {
            res.status(404).json({ 
                success: false, 
                message: "Dowry not found or you don't have permission to access it" 
            });
            return;
        }
        
        res.status(200).json({ success: true, message: "Dowry fetched successfully", dowry });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const updateDowry = async (req: AuthRequest, res: Response) => {
    try {
        const { url } = req.body;
        
        // Validate URL format if provided
        if (url) {
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlRegex.test(url)) {
                res.status(400).json({ 
                    success: false, 
                    message: "Invalid URL format. Please provide a valid URL (e.g., https://example.com)" 
                });
                return;
            }
        }

        const dowry = await Dowry.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId }, 
            req.body, 
            { new: true }
        );
        
        if (!dowry) {
            res.status(404).json({ 
                success: false, 
                message: "Dowry not found or you don't have permission to update it" 
            });
            return;
        }
        
        res.status(200).json({ success: true, message: "Dowry updated successfully", dowry });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const updateDowryStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        
        // Validate status
        if (!status || !['purchased', 'not_purchased'].includes(status)) {
            res.status(400).json({ 
                success: false, 
                message: "Status must be either 'purchased' or 'not_purchased'" 
            });
            return;
        }

        const dowry = await Dowry.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId }, 
            { status }, 
            { new: true }
        );
        
        if (!dowry) {
            res.status(404).json({ 
                success: false, 
                message: "Dowry not found or you don't have permission to update it" 
            });
            return;
        }
        
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
        const { imageId } = req.body;
        
        // Validate imageId is provided
        if (!imageId) {
            res.status(400).json({ 
                success: false, 
                message: "imageId is required" 
            });
            return;
        }

        // Validate imageId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(imageId)) {
            res.status(400).json({ 
                success: false, 
                message: "Invalid imageId format" 
            });
            return;
        }

        // Find the dowry
        const dowry = await Dowry.findOne({ _id: req.params.id, userId: req.userId });
        
        if (!dowry) {
            res.status(404).json({ 
                success: false, 
                message: "Dowry not found or you don't have permission to update it" 
            });
            return;
        }

        // If dowry has an existing image, delete it
        if (dowry.dowryImage) {
            try {
                await Image.findByIdAndDelete(dowry.dowryImage);
                console.log(`Previous image ${dowry.dowryImage} deleted successfully`);
            } catch (imageError) {
                console.error('Error deleting previous image:', imageError);
                // Continue with update even if old image deletion fails
            }
        }

        // Update dowry with new image
        const updatedDowry = await Dowry.findByIdAndUpdate(
            dowry._id,
            { dowryImage: imageId },
            { new: true }
        );

        res.status(200).json({ 
            success: true, 
            message: "Dowry image updated successfully", 
            dowry: updatedDowry 
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
        // Find the dowry
        const dowry = await Dowry.findOne({ _id: req.params.id, userId: req.userId });
        
        if (!dowry) {
            res.status(404).json({ 
                success: false, 
                message: "Dowry not found or you don't have permission to access it" 
            });
            return;
        }

        // Check if dowry has an image
        if (!dowry.dowryImage) {
            res.status(404).json({ 
                success: false, 
                message: "Dowry has no image to delete" 
            });
            return;
        }

        // Delete the image from database
        try {
            await Image.findByIdAndDelete(dowry.dowryImage);
            console.log(`Image ${dowry.dowryImage} deleted successfully`);
        } catch (imageError) {
            console.error('Error deleting image:', imageError);
            res.status(500).json({ 
                success: false, 
                message: "Error deleting image from database" 
            });
            return;
        }

        // Remove image reference from dowry
        const updatedDowry = await Dowry.findByIdAndUpdate(
            dowry._id,
            { $unset: { dowryImage: "" } },
            { new: true }
        );

        res.status(200).json({ 
            success: true, 
            message: "Dowry image deleted successfully", 
            dowry: updatedDowry 
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
        // First find the dowry to get the image reference
        const dowry = await Dowry.findOne({ _id: req.params.id, userId: req.userId });
        
        if (!dowry) {
            res.status(404).json({ 
                success: false, 
                message: "Dowry not found or you don't have permission to delete it" 
            });
            return;
        }

        // If dowry has an associated image, delete it
        if (dowry.dowryImage) {
            try {
                await Image.findByIdAndDelete(dowry.dowryImage);
                console.log(`Associated image ${dowry.dowryImage} deleted successfully`);
            } catch (imageError) {
                console.error('Error deleting associated image:', imageError);
                // Continue with dowry deletion even if image deletion fails
            }
        }

        // Delete the dowry
        await Dowry.findByIdAndDelete(dowry._id);
        
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