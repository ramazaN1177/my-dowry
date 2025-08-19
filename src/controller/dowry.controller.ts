import { Dowry } from "../models/dowry.model";
import { Request, Response } from "express";

interface AuthRequest extends Request {
    userId?: string;
}

export const createDowry = async (req: AuthRequest, res: Response) => {
    try {
        // Validate required fields
        const { name, description, dowryCategory, dowryPrice, dowryImage, dowryLocation, status } = req.body;
        
        if (!name || !description || !dowryCategory || !dowryPrice || !dowryImage || dowryImage.trim() === '') {
            res.status(400).json({ 
                success: false, 
                message: "Missing required fields: name, description, dowryCategory, dowryPrice, dowryImage" 
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

        // Validate price is a number
        if (typeof dowryPrice !== 'number' || dowryPrice <= 0) {
            res.status(400).json({ 
                success: false, 
                message: "dowryPrice must be a positive number" 
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

        const dowry = new Dowry({ 
            name, 
            description, 
            dowryCategory, 
            dowryPrice, 
            dowryImage, 
            dowryLocation, 
            status: status || 'not_purchased',
            userId 
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

        const { status, category, search, page = 1, limit = 10 } = req.query;
        
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
        if (category) {
            filter.dowryCategory = category;
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

export const deleteDowry = async (req: AuthRequest, res: Response) => {
    try {
        const dowry = await Dowry.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        
        if (!dowry) {
            res.status(404).json({ 
                success: false, 
                message: "Dowry not found or you don't have permission to delete it" 
            });
            return;
        }
        
        res.status(200).json({ success: true, message: "Dowry deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}