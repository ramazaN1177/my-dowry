import express from 'express';
import { verifyPayment, getPaymentStatus, PackageType } from '../controller/payment.controller';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

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
 *                 enum: [ads_disable, category_limit, premium]
 *                 example: "ads_disable"
 *     responses:
 *       200:
 *         description: Payment verified and package activated
 *       400:
 *         description: Invalid request or purchase token
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
 *       401:
 *         description: Unauthorized
 */
router.get('/status', verifyToken, getPaymentStatus);

export default router;

