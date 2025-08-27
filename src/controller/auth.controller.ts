import { User } from "../models/user.model";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie, generateRefreshToken, generateAccessToken } from '../utils/generateTokenAndSetCookie';
import { Request, Response } from "express";
import crypto from "crypto"
import jwt from "jsonwebtoken"
import { sendVerificationEmail, sendTestEmail } from '../email/email.service';

interface AuthRequest extends Request {
    userId?: string;
}






export const signup = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            throw new Error("All fields are required");
        }
        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            res.status(400).json({ success: false, message: "User already exists" });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const user = new User({
            name,
            email,
            password: hashedPassword,
            verificationCode,
            verificationCodeExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        })
        await user.save();

        // Doğrulama emaili gönder
        try {
            const emailSent = await sendVerificationEmail(user.email, verificationCode, user.name);
            if (!emailSent) {
                console.warn('Verification email could not be sent, but user was created');
            }
        } catch (emailError) {
            console.error('Verification email error:', emailError);
            // Email gönderilemese bile kullanıcı oluşturuldu, sadece log'la
        }

        res.status(201).json({
            success: true,
            message: "User created successfully. Please verify your email before logging in.",
            user: {
                ...user.toObject(),
                password: undefined,
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body
    try {
        const user = await User.findOne({ verificationCode: code, verificationCodeExpiresAt: { $gt: Date.now() } })
        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired verification code" })
            return;
        }
        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpiresAt = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user.toObject(),
                password: undefined,
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body
    try {
        // Kullanıcıyı email ile bul
        const user = await User.findOne({ email })
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
        const newToken = generateTokenAndSetCookie(res, user._id.toString());
        const refreshTokenValue = generateRefreshToken(user._id.toString());
        user.refreshToken = refreshTokenValue;
        user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 gün

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: newToken,
            refreshToken: user.refreshToken,
            user: {
                ...user.toObject(),
                password: undefined,
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        // Token'dan kullanıcı ID'sini al
        const authHeader = req.headers.authorization;
        let token = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
                if (decoded && decoded.userId) {
                    // Kullanıcının refresh token'ını temizle - daha güçlü yöntem
                    const result = await User.findByIdAndUpdate(decoded.userId, {
                        $set: {
                            refreshToken: null,
                            refreshTokenExpiresAt: null
                        }
                    }, { new: true });
                    
                    console.log('Logout - User updated:', result ? 'Success' : 'User not found');
                    
                    // Ek kontrol - alanların gerçekten temizlendiğini doğrula
                    const verifyUser = await User.findById(decoded.userId);
                    console.log('Logout - Verification - refreshToken:', verifyUser?.refreshToken);
                    console.log('Logout - Verification - refreshTokenExpiresAt:', verifyUser?.refreshTokenExpiresAt);
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
        const user = await User.findOne({email})
        if(!user){
            res.status(400).json({success:false,message:"User not found"})
            return;
        }

        const resetToken = crypto.randomBytes(20).toString("hex")
        const resetPasswordExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) //1 hour
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetPasswordExpiresAt;
        
        await user.save();

        res.status(200).json({
            success:true,
            message: "Password reset token generated",
            resetToken: resetToken,
            expiresIn: "1 hour"
        })
        
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error instanceof Error ? error.message : "Internal Server Error"
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
        
        const user = await User.findOne({ resetPasswordToken: resetToken, resetPasswordExpiresAt: { $gt: Date.now() } })
        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired reset password token" })
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        
        // Otomatik login
        const token = generateTokenAndSetCookie(res, user._id.toString());
        const refreshTokenValue = generateRefreshToken(user._id.toString());
        user.refreshToken = refreshTokenValue;
        user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful",
            token: token,
            refreshToken: refreshTokenValue,
            user: {
                ...user.toObject(),
                password: undefined,
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Internal Server Error"
        })
    }
}
export const checkAuth = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.userId).select("-password")
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" })
            return;
        }
        
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
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
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== clientRefreshToken || (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date())) {
            res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
            return;
        }

        // Yeni access token oluştur
        const newAccessToken = generateAccessToken(user._id.toString());
        
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            user: {
                ...user.toObject(),
                password: undefined,
            }
        });
    } catch (error) {
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

        const user = await User.findById(req.userId);
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
        const token = generateTokenAndSetCookie(res, user._id.toString());
        const refreshTokenValue = generateRefreshToken(user._id.toString());
        user.refreshToken = refreshTokenValue;
        user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
            token: token,
            refreshToken: refreshTokenValue,
            user: {
                ...user.toObject(),
                password: undefined,
            }
        });
    } catch (error) {
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
        // Geçici olarak development kontrolünü kaldırıyoruz
        // if (process.env.NODE_ENV !== 'development') {
        //     res.status(403).json({ success: false, message: "This endpoint is only available in development mode" });
        //     return;
        // }

        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: "Email is required" });
            return;
        }

        const result = await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    refreshToken: null,
                    refreshTokenExpiresAt: null
                }
            },
            { new: true }
        );

        if (!result) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }

        console.log('Manual token clear - User:', result.email);
        console.log('Manual token clear - refreshToken:', result.refreshToken);
        console.log('Manual token clear - refreshTokenExpiresAt:', result.refreshTokenExpiresAt);

        res.status(200).json({
            success: true,
            message: "All tokens cleared for user",
            user: {
                email: result.email,
                refreshToken: result.refreshToken,
                refreshTokenExpiresAt: result.refreshTokenExpiresAt
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

