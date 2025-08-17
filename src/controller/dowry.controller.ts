import { Dowry } from "../models/dowry.model";
import { Request, Response } from "express";

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
        
        const dowries = await Dowry.find({ userId: req.userId });
        res.status(200).json({ success: true, message: "Dowries fetched successfully", dowries });
    } catch (error) {
        console.error('Get Dowries Error:', error);
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