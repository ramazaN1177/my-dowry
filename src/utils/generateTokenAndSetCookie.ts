import jwt from "jsonwebtoken";
import { Response } from "express";

export const generateTokenAndSetCookie = (res: Response, userId: string) => {
    const token = jwt.sign({userId},process.env.JWT_SECRET as string,{expiresIn:"7d"});

    // Authorization header'ı set et
    res.set('Authorization',`Bearer ${token}`);
    return token;
}

// Mobil uygulamalar için refresh token oluştur
export const generateRefreshToken = (userId: string) => {
    return jwt.sign({userId}, process.env.JWT_SECRET as string, {expiresIn: "30d"});
}

// Access token oluştur (kısa süreli)
export const generateAccessToken = (userId: string) => {
    return jwt.sign({userId}, process.env.JWT_SECRET as string, {expiresIn: "15m"});
}