import express from 'express';
import { uploadImage, getImage, deleteImage, getUserImages, processImageOCR } from '../controller/image.controller';
import { uploadSingle } from '../middleware/upload';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         filename:
 *           type: string
 *           example: "1640995200000-image.jpg"
 *         originalName:
 *           type: string
 *           example: "dowry-image.jpg"
 *         contentType:
 *           type: string
 *           example: "image/jpeg"
 *         size:
 *           type: number
 *           example: 1024000
 *         uploadDate:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 *         userId:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         dowryId:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *     BookInfo:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Robinson Crusoe"
 *         author:
 *           type: string
 *           example: "Daniel Defoe"
 */

/**
 * @swagger
 * /api/image/upload:
 *   post:
 *     summary: Upload an image
 *     description: Upload an image file. For OCR processing, use the /api/image/ocr/:id endpoint after upload.
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       201:
 *         description: Image uploaded successfully
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
 *                   example: "Image uploaded successfully"
 *                 image:
 *                   $ref: '#/components/schemas/Image'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/upload', verifyToken, uploadSingle, uploadImage);

/**
 * @swagger
 * /api/image/{id}:
 *   get:
 *     summary: Get image by ID
 *     description: Retrieve an image file by its ID
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Image ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image retrieved successfully
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', verifyToken, getImage);

/**
 * @swagger
 * /api/image/{id}:
 *   delete:
 *     summary: Delete image
 *     description: Delete an image file by its ID
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Image ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
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
 *                   example: "Image deleted successfully"
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', verifyToken, deleteImage);

/**
 * @swagger
 * /api/image/user/images:
 *   get:
 *     summary: Get user's images
 *     description: Get all images uploaded by the authenticated user
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Images retrieved successfully
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
 *                   example: "Images fetched successfully"
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 */
router.get('/user/images', verifyToken, getUserImages);

/**
 * @swagger
 * /api/image/ocr/{id}:
 *   post:
 *     summary: Process image with OCR
 *     description: Extract book title and author from an image using Tesseract OCR and Open Library API. Does not save to database, only returns the result. Frontend should check category icon before calling this endpoint.
 *     tags: [Image]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Image ID to process
 *         schema:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: OCR processing completed successfully
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
 *                   example: "Book information extracted successfully"
 *                 bookInfo:
 *                   $ref: '#/components/schemas/BookInfo'
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: OCR processing failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/ocr/:id', verifyToken, processImageOCR);

export default router;