import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Önce Authorization header'ından token'ı kontrol et (öncelik ver)
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // "Bearer " kısmını çıkar
    }
    
    // Authorization header'ında token yoksa cookie'den kontrol et
    if (!token) {
        token = req.cookies.token;
    }
    
    if (!token) {
        res.status(401).json({ 
            success: false, 
            message: "No Token Provided - Please login" 
        })
        return;
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        if (!decoded) {
            res.status(401).json({ 
                success: false, 
                message: "Invalid Token" 
            })
            return;
        }
        (req as any).userId = (decoded as any).userId
        next();
    } catch (error) {
        console.error("Token Verification Error:", error);
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ 
                success: false, 
                message: "Token Expired - Please login again" 
            })
            return;
        }
        res.status(401).json({ 
            success: false, 
            message: "Invalid Token" 
        })
        return;
    }
}