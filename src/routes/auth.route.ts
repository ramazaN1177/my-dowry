import express from 'express';
import { login, signup, verifyEmail, logout,resetPassword,checkAuth,forgotPassword,refreshToken,changePassword, clearAllTokens } from '../controller/auth.controller';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

// Register a new user
router.post('/signup',  signup);

// Verify user email with verification code
router.post('/verify-email', verifyEmail);

// Login user
router.post('/login', login);

// Logout user
router.post('/logout', logout);

// Reset password with token
router.post('/reset-password', resetPassword);

// Check authentication status
router.get('/check-auth', verifyToken, checkAuth);

// Request password reset
router.post('/forgot-password', forgotPassword);

// Refresh token
router.post('/refresh-token', refreshToken);

// Change password
router.post('/change-password', verifyToken, changePassword);

// Manual token clear (development only)
router.post('/clear-tokens', clearAllTokens);

export default router;