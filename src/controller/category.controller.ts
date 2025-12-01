import { Request, Response } from "express";
import { AppDataSource } from '../db/connectDB';
import { Category } from "../entities/category.entity";
import { Dowry } from "../entities/dowry.entity";
import { Book } from "../entities/book.entity";
import { MinioService } from '../services/minio.service';

interface AuthRequest extends Request {
    userId?: string;
}

export const addCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { name, icon } = req.body;
        
        if (!name) {
            res.status(400).json({ 
                success: false, 
                message: "Name is required" 
            });
            return;
        }
        
        if (!req.userId) {
            res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
            return;
        }

        const categoryRepository = AppDataSource.getRepository(Category);
        const category = categoryRepository.create({
            name,
            icon: icon || null,
            userId: req.userId
        });

        await categoryRepository.save(category);
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

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({ 
                success: false, 
                message: "User not authenticated" 
            });
            return;
        }

        const categoryRepository = AppDataSource.getRepository(Category);
        const categories = await categoryRepository.find({ 
            where: { userId: req.userId },
            order: { createdAt: 'DESC' }
        });

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

        const categoryRepository = AppDataSource.getRepository(Category);
        const dowryRepository = AppDataSource.getRepository(Dowry);
        const bookRepository = AppDataSource.getRepository(Book);

        // Önce kategoriyi bul
        const category = await categoryRepository.findOne({ 
            where: { id: categoryId, userId: userId } 
        });

        if (!category) {
            res.status(404).json({ 
                success: false, 
                message: "Category not found or you don't have permission to delete it" 
            });
            return;
        }

        // Bu kategoriye ait tüm çeyizleri bul
        const dowries = await dowryRepository.find({ 
            where: { 
                categoryId: categoryId,
                userId: userId 
            }
        });

        // Çeyizlere ait resimleri MinIO'dan sil
        let deletedImagesCount = 0;
        for (const dowry of dowries) {
            if (dowry.imageUrl) {
                try {
                    const minioPath = MinioService.extractMinioPathFromUrl(dowry.imageUrl);
                    if (minioPath) {
                        await MinioService.deleteFile(minioPath);
                        deletedImagesCount++;
                    }
                } catch (error) {
                    console.error(`Error deleting image for dowry ${dowry.id}:`, error);
                }
            }
        }

        // Bu kategoriye ait tüm çeyizleri sil
        const deletedDowriesCount = await dowryRepository.count({ 
            where: { categoryId: categoryId, userId: userId } 
        });
        await dowryRepository.delete({ categoryId: categoryId, userId: userId });

        // Bu kategoriye ait tüm kitapları sil
        const deletedBooksCount = await bookRepository.count({ 
            where: { categoryId: categoryId, userId: userId } 
        });
        await bookRepository.delete({ categoryId: categoryId, userId: userId });

        // Kategoriyi sil
        await categoryRepository.remove(category);

        res.status(200).json({ 
            success: true, 
            message: `Category, ${deletedDowriesCount} associated dowries, ${deletedBooksCount} associated books, and ${deletedImagesCount} associated images deleted successfully` 
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
