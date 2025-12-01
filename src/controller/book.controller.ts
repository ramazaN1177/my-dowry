import { Book, BookStatus } from "../entities/book.entity";
import { Request, Response } from "express";
import { AppDataSource } from '../db/connectDB';
import { Like, Or } from 'typeorm';

interface AuthRequest extends Request {
    userId?: string;
}

export const getBooks = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const { status, search, page = 1, limit = 10, isRead, Category } = req.query;

        if (status && !["purchased", "not_purchased"].includes(status as string)) {
            res.status(400).json({
                success: false,
                message: "Status must be either 'purchased' or 'not_purchased'"
            });
            return;
        }

        const bookRepository = AppDataSource.getRepository(Book);
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

        if (isRead !== undefined && isRead !== null && isRead !== "") {
            const readValue = typeof isRead === "string" ? isRead : String(isRead);
            whereConditions.isRead = readValue === "true";
        }

        // Search query
        let where: any = whereConditions;
        if (search) {
            where = [
                { ...whereConditions, name: Like(`%${search}%`) },
                { ...whereConditions, author: Like(`%${search}%`) }
            ];
        }

        const [books, total] = await bookRepository.findAndCount({
            where: where,
            skip: skip,
            take: limitNum,
            order: { createdAt: 'DESC' },
            relations: ['category']
        });

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            message: "Books fetched successfully",
            books,
            pagination: {
                total,
                page: pageNum,
                pages: totalPages,
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('Get Books Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}

export const updateBook = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const bookRepository = AppDataSource.getRepository(Book);
        const book = await bookRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found or you don't have permission to update it"
            });
            return;
        }

        // Update allowed fields
        if (req.body.name) book.name = req.body.name;
        if (req.body.author) book.author = req.body.author;
        if (req.body.categoryId) book.categoryId = req.body.categoryId;
        if (req.body.status) book.status = req.body.status;
        if (req.body.isRead !== undefined) book.isRead = req.body.isRead;

        await bookRepository.save(book);

        res.status(200).json({ success: true, message: "Book updated successfully", book });
    } catch (error) {
        console.error('Update Book Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}

export const updateBookStatus = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const { status } = req.body;
        if (!status || !["purchased", "not_purchased"].includes(status as string)) {
            res.status(400).json({
                success: false,
                message: "Status must be either 'purchased' or 'not_purchased'"
            });
            return;
        }

        const bookRepository = AppDataSource.getRepository(Book);
        const book = await bookRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found or you don't have permission to update it"
            });
            return;
        }

        book.status = status as BookStatus;
        await bookRepository.save(book);

        res.status(200).json({ success: true, message: "Book status updated successfully", book });
    } catch (error) {
        console.error('Update Book Status Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}

export const deleteBook = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const bookRepository = AppDataSource.getRepository(Book);
        const book = await bookRepository.findOne({
            where: { id: req.params.id, userId: req.userId }
        });

        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found or you don't have permission to delete it"
            });
            return;
        }

        await bookRepository.remove(book);

        res.status(200).json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
        console.error('Delete Book Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}

export const createBook = async (req: AuthRequest, res: Response) => {
    try {
        const { text, categoryId } = req.body;

        // Validate required fields
        if (!text || !categoryId) {
            res.status(400).json({
                success: false,
                message: "Missing required fields: text, categoryId"
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

        // Split text by newlines and filter out empty lines
        const lines = text.split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);

        if (lines.length === 0) {
            res.status(400).json({
                success: false,
                message: "No valid book entries found in the text"
            });
            return;
        }

        const bookRepository = AppDataSource.getRepository(Book);
        const createdBooks = [];
        const errors = [];

        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Split by " – " (em dash) or " - " (regular dash)
            const parts = line.split(/\s*[–-]\s*/);

            if (parts.length >= 2) {
                const author = parts[0].trim();
                const bookName = parts.slice(1).join(' – ').trim(); // Join rest as book name

                try {
                    const book = bookRepository.create({
                        name: bookName,
                        author: author,
                        categoryId: categoryId,
                        status: BookStatus.NOT_PURCHASED,
                        isRead: false,
                        userId
                    });

                    const savedBook = await bookRepository.save(book);
                    createdBooks.push({
                        bookName,
                        author,
                        id: savedBook.id
                    });
                } catch (error) {
                    errors.push({
                        line: i + 1,
                        text: line,
                        error: (error as Error).message
                    });
                }
            } else {
                errors.push({
                    line: i + 1,
                    text: line,
                    error: 'Invalid format. Expected "Author – Book Name"'
                });
            }
        }

        // Return response
        res.status(201).json({
            success: true,
            message: `Successfully added ${createdBooks.length} books${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
            data: {
                created: createdBooks,
                errors: errors.length > 0 ? errors : undefined,
                summary: {
                    total: lines.length,
                    successful: createdBooks.length,
                    failed: errors.length
                }
            }
        });
    } catch (error) {
        console.error('Add Books Error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}
