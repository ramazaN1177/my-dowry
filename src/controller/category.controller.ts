import { Request, Response } from "express";
import mongoose from "mongoose";
import { Category } from "../models/category.model";
import { Dowry } from "../models/dowry.model";
interface AuthRequest extends Request {
    userId?: string;
}


export const addCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            res.status(400).json({ 
                success: false, 
                message: "Name is required" 
            });
            return;
        }
        const { icon } = req.body;
        if (!icon) {
            res.status(400).json({ 
                success: false, 
                message: "Icon is required" 
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
        const category = new Category({
            name,
            icon,
            userId
        });
        await category.save();
        res.status(201).json({ success: true, message: "Category added successfully", category });


    } catch (error) {
        console.error('Add Category Error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
        
    }
}
    export const getCategories = async (req:AuthRequest, res:Response)=>{
        try {
            if (!req.userId) {
                res.status(401).json({ 
                    success: false, 
                    message: "User not authenticated" 
                });
                return;
            }
            const categories = await Category.find({ userId: req.userId });
            res.status(200).json({ success: true, message: "Categories fetched successfully", categories });
            
        } catch (error) {
            console.error('Get Categories Error:', error);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }
    export const deleteCategory = async (req: AuthRequest, res: Response) => {
        try {
            const categoryId = req.params.id;
            const userId = req.userId;
            
            if (!userId) {
                res.status(401).json({ 
                    success: false, 
                    message: "User not authenticated" 
                });
                return;
            }
    
            // Önce kategoriyi bul
            const category = await Category.findOne({ _id: categoryId, userId: userId });
            if (!category) {
                res.status(404).json({ 
                    success: false, 
                    message: "Category not found or you don't have permission to delete it" 
                });
                return;
            }
    
            // Bu kategoriye ait tüm çeyizleri sil
            const deletedDowries = await Dowry.deleteMany({ 
                Category: categoryId,  // Category alanını kullan
                userId: userId 
            });
    
            // Kategoriyi sil
            await Category.findByIdAndDelete(categoryId);
    
            res.status(200).json({ 
                success: true, 
                message: `Category and ${deletedDowries.deletedCount} associated dowries deleted successfully` 
            });
        } catch (error) {
            console.error('Delete Category Error:', error);
            res.status(500).json({ 
                success: false, 
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            });
        }
    }

