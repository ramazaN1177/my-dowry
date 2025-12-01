import { AppDataSource } from '../db/connectDB';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Dowry } from '../entities/dowry.entity';
import { Book } from '../entities/book.entity';
import { Image } from '../entities/image.entity';
import { MinioService } from '../services/minio.service';
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie, generateRefreshToken, generateAccessToken } from '../utils/generateTokenAndSetCookie';
import { Request, Response } from "express";
import crypto from "crypto"
import jwt from "jsonwebtoken"
import { sendVerificationEmail, sendTestEmail, sendPasswordResetEmail } from '../email/email.service';
import { Like, MoreThan } from 'typeorm';

interface AuthRequest extends Request {
    userId?: string;
}

export const signup = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            throw new Error("All fields are required");
        }

        const userRepository = AppDataSource.getRepository(User);
        const userAlreadyExists = await userRepository.findOne({ where: { email } });
        
        if (userAlreadyExists) {
            res.status(400).json({ success: false, message: "User already exists" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        const user = userRepository.create({
            name,
            email,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isVerified: false
        });

        const savedUser = await userRepository.save(user);

        // Doğrulama emaili gönder
        try {
            const emailSent = await sendVerificationEmail(savedUser.email, verificationCode, savedUser.name);
            if (!emailSent) {
                console.warn('Verification email could not be sent, but user was created');
            }
        } catch (emailError) {
            console.error('Verification email error:', emailError);
        }

        const { password: _, ...userWithoutPassword } = savedUser;

        res.status(201).json({
            success: true,
            message: "User created successfully. Please verify your email before logging in.",
            user: userWithoutPassword
        })

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ 
            where: { 
                verificationCode: code,
                verificationCodeExpiresAt: MoreThan(new Date())
            }
        });

        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired verification code" })
            return;
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpiresAt = null;
        await userRepository.save(user);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: userWithoutPassword
        })

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            res.status(400).json({ success: false, message: "User not found" })
            return;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            res.status(400).json({ success: false, message: "Invalid password" })
            return;
        }

        if (!user.isVerified) {
            res.status(400).json({ success: false, message: "Please verify your email before logging in" })
            return;
        }

        // Token ve refresh token oluştur
        const newToken = generateTokenAndSetCookie(res, user.id);
        const refreshTokenValue = generateRefreshToken(user.id);
        user.refreshToken = refreshTokenValue;
        user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 gün

        user.lastLogin = new Date();
        await userRepository.save(user);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: newToken,
            refreshToken: user.refreshToken,
            user: userWithoutPassword
        })
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        let token = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
                if (decoded && decoded.userId) {
                    const userRepository = AppDataSource.getRepository(User);
                    await userRepository.update(decoded.userId, {
                        refreshToken: null,
                        refreshTokenExpiresAt: null
                    });
                    
                    console.log('Logout - User updated:', decoded.userId);
                }
            } catch (error) {
                console.error('Logout - Token verification error:', error);
            }
        } else {
            console.log('Logout - No token provided');
        }

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        console.error('Logout - General error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body
    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            res.status(400).json({ success: false, message: "User not found" })
            return;
        }

        const resetToken = crypto.randomBytes(20).toString("hex")
        const resetPasswordExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetPasswordExpiresAt;
        
        await userRepository.save(user);

        // Şifre sıfırlama emaili gönder
        try {
            const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.name);
            if (!emailSent) {
                console.warn('Password reset email could not be sent, but token was generated');
            }
        } catch (emailError) {
            console.error('Password reset email error:', emailError);
        }

        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully",
            resetToken: resetToken,
            expiresIn: "1 hour"
        })
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        })
    }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { resetToken, password } = req.body
        
        if (!resetToken || !password) {
            res.status(400).json({ success: false, message: "Reset token and password are required" })
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ 
            where: { 
                resetPasswordToken: resetToken,
                resetPasswordExpiresAt: MoreThan(new Date())
            }
        });

        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired reset password token" })
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpiresAt = null;
        
        // Otomatik login
        const token = generateTokenAndSetCookie(res, user.id);
        const refreshTokenValue = generateRefreshToken(user.id);
        user.refreshToken = refreshTokenValue;
        user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        await userRepository.save(user);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: "Password reset successful",
            token: token,
            refreshToken: refreshTokenValue,
            user: userWithoutPassword
        })
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        })
    }
}

export const checkAuth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ success: false, message: "Unauthorized" })
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ 
            where: { id: req.userId },
            select: ['id', 'name', 'email', 'isVerified', 'lastLogin', 'createdAt', 'updatedAt']
        });

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" })
            return;
        }
        
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        console.error('Check auth error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

// Refresh token endpoint'i
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken: clientRefreshToken } = req.body;
        
        if (!clientRefreshToken) {
            res.status(400).json({ success: false, message: "Refresh token is required" });
            return;
        }

        // Refresh token'ı doğrula
        const decoded = jwt.verify(clientRefreshToken, process.env.JWT_SECRET as string) as any;
        if (!decoded) {
            res.status(401).json({ success: false, message: "Invalid refresh token" });
            return;
        }

        // Kullanıcıyı bul ve refresh token'ı kontrol et
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: decoded.userId } });
        
        if (!user || user.refreshToken !== clientRefreshToken || (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date())) {
            res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
            return;
        }

        // Yeni access token oluştur
        const newAccessToken = generateAccessToken(user.id);
        
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

// Mevcut şifre ile şifre değiştirme
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: "Current password and new password are required" });
            return;
        }

        if (!req.userId) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { id: req.userId } });

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        // Mevcut şifreyi kontrol et
        const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordCorrect) {
            res.status(400).json({ success: false, message: "Current password is incorrect" });
            return;
        }

        // Yeni şifreyi hash'le
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        
        // Yeni token oluştur
        const token = generateTokenAndSetCookie(res, user.id);
        const refreshTokenValue = generateRefreshToken(user.id);
        user.refreshToken = refreshTokenValue;
        user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        await userRepository.save(user);

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
            token: token,
            refreshToken: refreshTokenValue,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

// Test email endpoint'i
export const testEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        
        if (!email) {
            res.status(400).json({ success: false, message: "Email is required" });
            return;
        }

        const emailSent = await sendTestEmail(email);
        
        if (emailSent) {
            res.status(200).json({
                success: true,
                message: "Test email sent successfully"
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to send test email"
            });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Manuel token temizleme endpoint'i (sadece development için)
export const clearAllTokens = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: "Email is required" });
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        user.refreshToken = null;
        user.refreshTokenExpiresAt = null;
        await userRepository.save(user);

        console.log('Manual token clear - User:', user.email);

        res.status(200).json({
            success: true,
            message: "All tokens cleared for user",
            user: {
                email: user.email,
                refreshToken: user.refreshToken,
                refreshTokenExpiresAt: user.refreshTokenExpiresAt
            }
        });
    } catch (error) {
        console.error('Manual token clear error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

// Kullanıcı silme endpoint'i
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        const categoryRepository = AppDataSource.getRepository(Category);
        const dowryRepository = AppDataSource.getRepository(Dowry);
        const bookRepository = AppDataSource.getRepository(Book);
        const imageRepository = AppDataSource.getRepository(Image);

        // Kullanıcıyı bul
        const user = await userRepository.findOne({ where: { id: req.userId } });

        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // 1. Kullanıcıya ait tüm kategorileri bul
        const categories = await categoryRepository.find({
            where: { userId: req.userId }
        });

        // 2. Her kategori için çeyizleri ve kitapları bul ve resimleri sil
        let deletedImagesCount = 0;
        for (const category of categories) {
            // Kategoriye ait çeyizleri bul
            const categoryDowries = await dowryRepository.find({
                where: { categoryId: category.id, userId: req.userId }
            });

            // Çeyizlere ait resimleri sil
            for (const dowry of categoryDowries) {
                // Çeyiz ana resmini sil
                if (dowry.dowryImageId) {
                    const image = await imageRepository.findOne({
                        where: { id: dowry.dowryImageId }
                    });
                    if (image) {
                        try {
                            await MinioService.deleteFile(image.minioPath);
                            await imageRepository.remove(image);
                            deletedImagesCount++;
                        } catch (error) {
                            console.error(`Error deleting image ${image.id}:`, error);
                        }
                    }
                }

                // Çeyize ait diğer resimleri sil
                const dowryImages = await imageRepository.find({
                    where: { dowryId: dowry.id }
                });
                for (const img of dowryImages) {
                    try {
                        await MinioService.deleteFile(img.minioPath);
                        await imageRepository.remove(img);
                        deletedImagesCount++;
                    } catch (error) {
                        console.error(`Error deleting image ${img.id}:`, error);
                    }
                }
            }

            // Kategoriye ait çeyizleri sil
            await dowryRepository.delete({ categoryId: category.id, userId: req.userId });

            // Kategoriye ait kitapları sil
            await bookRepository.delete({ categoryId: category.id, userId: req.userId });
        }

        // 3. Kategorileri sil
        await categoryRepository.delete({ userId: req.userId });

        // 4. Kullanıcıya ait doğrudan çeyizleri bul (kategori dışı - eğer varsa)
        const directDowries = await dowryRepository.find({
            where: { userId: req.userId }
        });

        // Doğrudan çeyizlere ait resimleri sil
        for (const dowry of directDowries) {
            if (dowry.dowryImageId) {
                const image = await imageRepository.findOne({
                    where: { id: dowry.dowryImageId }
                });
                if (image) {
                    try {
                        await MinioService.deleteFile(image.minioPath);
                        await imageRepository.remove(image);
                        deletedImagesCount++;
                    } catch (error) {
                        console.error(`Error deleting image ${image.id}:`, error);
                    }
                }
            }

            const dowryImages = await imageRepository.find({
                where: { dowryId: dowry.id }
            });
            for (const img of dowryImages) {
                try {
                    await MinioService.deleteFile(img.minioPath);
                    await imageRepository.remove(img);
                    deletedImagesCount++;
                } catch (error) {
                    console.error(`Error deleting image ${img.id}:`, error);
                }
            }
        }

        // Doğrudan çeyizleri sil
        await dowryRepository.delete({ userId: req.userId });

        // 5. Kullanıcıya ait doğrudan kitapları sil (kategori dışı - eğer varsa)
        await bookRepository.delete({ userId: req.userId });

        // 6. Kullanıcıya ait tüm resimleri sil (MinIO'dan ve DB'den)
        const userImages = await imageRepository.find({
            where: { userId: req.userId }
        });

        for (const image of userImages) {
            try {
                await MinioService.deleteFile(image.minioPath);
                await imageRepository.remove(image);
                deletedImagesCount++;
            } catch (error) {
                console.error(`Error deleting image ${image.id}:`, error);
            }
        }

        // 7. Kullanıcıyı sil
        await userRepository.remove(user);

        res.status(200).json({
            success: true,
            message: "User and all associated data deleted successfully",
            deletedImagesCount
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
}
