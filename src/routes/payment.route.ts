import express from 'express';
import { verifyPayment, getPaymentStatus, PackageType } from '../controller/payment.controller';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentStatus:
 *       type: object
 *       properties:
 *         adsDisabled:
 *           type: boolean
 *           example: false
 *         adsDisabledExpiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-12-31T23:59:59.000Z"
 *         categoryLimit:
 *           type: integer
 *           example: 5
 *         currentCategoryCount:
 *           type: integer
 *           example: 3
 */

/**
 * @swagger
 * /api/payment/verify:
 *   post:
 *     summary: Verify Google Play Store payment and activate package
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageName
 *               - productId
 *               - purchaseToken
 *               - packageType
 *             properties:
 *               packageName:
 *                 type: string
 *                 example: "com.example.mydowry"
 *               productId:
 *                 type: string
 *                 example: "ads_disable_monthly"
 *               purchaseToken:
 *                 type: string
 *                 example: "opaque-token-up-to-1500-characters"
 *               packageType:
 *                 type: string
 *                 enum: [ads_disable, category_limit]
 *                 example: "ads_disable"
 *     responses:
 *       200:
 *         description: Payment verified and package activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ads disabled successfully"
 *                 purchase:
 *                   type: object
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request or purchase token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid purchase token"
 *       401:
 *         description: Unauthorized
 */
router.post('/verify', verifyToken, verifyPayment);

/**
 * @swagger
 * /api/payment/status:
 *   get:
 *     summary: Get user's current payment/subscription status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   $ref: '#/components/schemas/PaymentStatus'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not authenticated"
 */
router.get('/status', verifyToken, getPaymentStatus);

export default router;

