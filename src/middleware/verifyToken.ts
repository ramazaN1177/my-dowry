import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Token'ı hem cookie'den hem de Authorization header'ından kontrol et
    let token = req.cookies.token;
    
    // Cookie'de token yoksa Authorization header'ından kontrol et (mobil uygulamalar için)
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // "Bearer " kısmını çıkar
        }
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