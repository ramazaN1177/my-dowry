import { User } from "../models/user.model";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie';
//import { sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/email";
import { Request, Response } from "express";
import crypto from "crypto"

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
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const user = new User({
            name,
            email,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        })
        await user.save();

        //jwt
        const token = generateTokenAndSetCookie(res, user._id.toString())

        //send verification email
        console.log(`🔑 Verification Code for ${user.email}: ${verificationToken}`);
        // await sendVerificationEmail(user.email,verificationToken);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            token,
            user: {
                ...user.toObject(),
                password: undefined,
            }
        })

    } catch (error) {
        console.error("Error signing up:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}


export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body
    try {
        const user = await User.findOne({ verificationToken: code, verificationTokenExpiresAt: { $gt: Date.now() } })
        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired verification code" })
            return;
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        console.log(`🎉 Welcome ${user.name}! Email verification successful.`);
        // let emailSent = false;
        // try {
        //     await sendWelcomeEmail(user.email,user.name);
        //     emailSent = true;
        // } catch (emailError) {
        //     console.error("Welcome email failed:", emailError);
        // }

        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user.toObject(),
                password: undefined,
            }
        })

    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body
    try {
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

        generateTokenAndSetCookie(res, user._id.toString())

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                ...user.toObject(),
                password: undefined,
            }
        })
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

export const logout = async (req: Request, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    })
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
            message:"Password reset message sent",
            resetToken
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
        const { token } = req.params
        const { password } = req.body
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpiresAt: { $gt: Date.now() } })
        if (!user) {
            res.status(400).json({ success: false, message: "Invalid or expired reset password token" })
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful"
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

