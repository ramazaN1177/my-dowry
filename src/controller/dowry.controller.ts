import { Dowry } from "../models/dowry.model";
import { Request, Response } from "express";

// Predefined dowry categories
export const DOWRY_CATEGORIES = {
    MUTFAK: "MUTFAK",
    YEMEK_ODASI: "YEMEK ODASI", 
    YATAK_ODASI: "YATAK ODASI",
    SALON: "SALON",
    BANYO: "BANYO",
    COCUK_ODASI: "ÇOCUK ODASI",
    OFIS: "OFİS",
    KUTUPHANE_NAMAZ: "KÜTÜPHANE VE NAMAZ ODASI",
    DIGER: "DİĞER"
} as const;

export type DowryCategory = typeof DOWRY_CATEGORIES[keyof typeof DOWRY_CATEGORIES];

interface AuthRequest extends Request {
    userId?: string;
}

export const createDowry = async (req: AuthRequest, res: Response) => {
    try {
        // Validate required fields
        const { name, description, dowryCategory, dowryPrice, dowryImage, dowryLocation } = req.body;
        
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

        const dowry = new Dowry({ 
            name, 
            description, 
            dowryCategory, 
            dowryPrice, 
            dowryImage, 
            dowryLocation, 
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
        
        // Build filter object
        const filter: any = { userId: req.userId };
        
        // Category filtering - single category from frontend
        if (req.query.category && req.query.category.toString().trim() !== '') {
            const category = req.query.category.toString();
            
            // Validate if the category is one of the predefined categories
            const validCategories = Object.values(DOWRY_CATEGORIES);
            if (validCategories.includes(category as DowryCategory)) {
                filter.dowryCategory = category;
            } else {
                res.status(400).json({
                    success: false,
                    message: "Invalid category. Please use one of the predefined categories.",
                    validCategories
                });
                return;
            }
        }
        
        // Search term - search in name, description, and location
        if (req.query.searchTerm && req.query.searchTerm.toString().trim() !== '') {
            const searchTerm = req.query.searchTerm.toString();
            filter.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { dowryLocation: { $regex: searchTerm, $options: 'i' } }
            ];
        }
        
        // Price range filtering
        if (req.query.minPrice || req.query.maxPrice) {
            filter.dowryPrice = {};
            if (req.query.minPrice) {
                filter.dowryPrice.$gte = Number(req.query.minPrice);
            }
            if (req.query.maxPrice) {
                filter.dowryPrice.$lte = Number(req.query.maxPrice);
            }
        }
        
        // Sorting options
        let sortOptions: any = {};
        if (req.query.sortBy) {
            const sortField = req.query.sortBy as string;
            const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
            sortOptions[sortField] = sortOrder;
        } else {
            // Default sort by creation date (newest first)
            sortOptions.createdAt = -1;
        }
        
        // Pagination
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        
        const dowries = await Dowry.find(filter)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);
            
        // Get total count for pagination
        const totalCount = await Dowry.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.status(200).json({ 
            success: true, 
            message: "Dowries fetched successfully", 
            dowries,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Get Dowries Error:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// Get all available categories for frontend
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = Object.values(DOWRY_CATEGORIES);
        
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            categories
        });
    } catch (error) {
        console.error('Get Categories Error:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
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