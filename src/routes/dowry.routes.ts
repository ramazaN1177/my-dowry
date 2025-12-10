import express from 'express';
import { createDowry, getDowries, getDowryById, updateDowry, deleteDowry, updateDowryStatus, deleteDowryImage, addDowryImage, updateDowryImage } from '../controller/dowry.controller';
import { verifyToken } from '../middleware/verifyToken';
import { uploadDowryImage } from '../middleware/upload';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Dowry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           example: "Gold Necklace"
 *         description:
 *           type: string
 *           example: "Beautiful gold necklace with precious stones"
 *         categoryId:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         category:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *               example: "Jewelry"
 *         dowryPrice:
 *           type: number
 *           example: 5000
 *         imageUrl:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: "http://5.133.102.127:9000/mydowry-images/users/.../images/..."
 *           description: "Public URL of the dowry image from MinIO (stored directly in dowry table)"
 *         dowryLocation:
 *           type: string
 *           nullable: true
 *           example: "Istanbul, Turkey"
 *         url:
 *           type: string
 *           format: uri
 *           nullable: true
 *           example: "https://www.example.com"
 *         status:
 *           type: string
 *           enum: [purchased, not_purchased]
 *           example: "not_purchased"
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00.000Z"
 */

/**
 * @swagger
 * /api/dowry/create:
 *   post:
 *     summary: Create a new dowry
 *     description: Create a new dowry item. Accepts JSON data only. To add an image, use the separate image upload endpoint after creating the dowry.
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - Category
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Gold Necklace"
 *               description:
 *                 type: string
 *                 example: "Beautiful gold necklace with precious stones"
 *               Category:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *                 description: "Category ID (UUID)"
 *               dowryPrice:
 *                 type: number
 *                 example: 5000
 *               dowryLocation:
 *                 type: string
 *                 example: "Istanbul, Turkey"
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.example.com"
 *                 description: "Valid URL format required (e.g., https://example.com)"
 *               status:
 *                 type: string
 *                 enum: [purchased, not_purchased]
 *                 example: "not_purchased"
 *     responses:
 *       201:
 *         description: Dowry created successfully
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
 *                   example: "Dowry created successfully"
 *                 dowry:
 *                   $ref: '#/components/schemas/Dowry'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create', verifyToken, createDowry);

/**
 * @swagger
 * /api/dowry/get:
 *   get:
 *     summary: Get all dowries with filters
 *     description: Get all dowries for the authenticated user with optional filtering and pagination. Each dowry includes its imageUrl (MinIO public URL) if an image exists.
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         description: Filter by purchase status
 *         schema:
 *           type: string
 *           enum: [purchased, not_purchased]
 *       - in: query
 *         name: Category
 *         description: Filter by category ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         description: Search in name and description fields
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         description: Page number
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         description: Items per page
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Dowries retrieved successfully with image URLs
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
 *                   example: "Dowries fetched successfully"
 *                 dowries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dowry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pages:
 *                       type: integer
 *                       example: 3
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/get', verifyToken, getDowries);

/**
 * @swagger
 * /api/dowry/get/{id}:
 *   get:
 *     summary: Get dowry by ID
 *     description: Get a specific dowry by its ID. Includes imageUrl (MinIO public URL) if an image exists.
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Dowry ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dowry retrieved successfully with image URL
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
 *                   example: "Dowry fetched successfully"
 *                 dowry:
 *                   $ref: '#/components/schemas/Dowry'
 *       404:
 *         description: Dowry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/get/:id', verifyToken, getDowryById);

/**
 * @swagger
 * /api/dowry/update/{id}:
 *   put:
 *     summary: Update dowry
 *     description: Update a specific dowry. Accepts JSON data only. To update the image, use the separate image update endpoint.
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Dowry ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Gold Necklace"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *                 description: "Category ID (UUID)"
 *               dowryPrice:
 *                 type: number
 *                 example: 6000
 *               dowryLocation:
 *                 type: string
 *                 example: "Istanbul, Turkey"
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.example.com"
 *                 description: "Valid URL format required (e.g., https://example.com)"
 *               status:
 *                 type: string
 *                 enum: [purchased, not_purchased]
 *                 example: "purchased"
 *     responses:
 *       200:
 *         description: Dowry updated successfully
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
 *                   example: "Dowry updated successfully"
 *                 dowry:
 *                   $ref: '#/components/schemas/Dowry'
 *       404:
 *         description: Dowry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/update/:id', verifyToken, updateDowry);

/**
 * @swagger
 * /api/dowry/status/{id}:
 *   patch:
 *     summary: Update dowry status
 *     description: Update the purchase status of a specific dowry
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Dowry ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [purchased, not_purchased]
 *                 example: "purchased"
 *     responses:
 *       200:
 *         description: Dowry status updated successfully
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
 *                   example: "Dowry status updated to purchased successfully"
 *                 dowry:
 *                   $ref: '#/components/schemas/Dowry'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dowry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/status/:id', verifyToken, updateDowryStatus);

/**
 * @swagger
 * /api/dowry/{id}/image:
 *   post:
 *     summary: Add image to dowry
 *     description: Upload and add an image to a dowry item. The dowry must not already have an image. Use multipart/form-data with field name 'image'.
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Dowry ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 description: "Image file. Max size: 10MB. Formats: jpg, png, etc."
 *     responses:
 *       200:
 *         description: Image added successfully. The imageUrl is returned in the response and automatically saved to the dowry's imageUrl column.
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
 *                   example: "Image added successfully"
 *                 imageUrl:
 *                   type: string
 *                   format: uri
 *                   example: "http://5.133.102.127:9000/mydowry-images/users/.../images/..."
 *                   description: "The public URL of the uploaded image. This URL is automatically saved to the dowry's imageUrl column."
 *                 dowry:
 *                   $ref: '#/components/schemas/Dowry'
 *       400:
 *         description: Bad request (image already exists or file missing)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dowry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/image', verifyToken, uploadDowryImage, addDowryImage);

/**
 * @swagger
 * /api/dowry/{id}/image:
 *   put:
 *     summary: Update dowry image
 *     description: Replace the existing image of a dowry item. The old image will be deleted from MinIO and replaced with the new one. Use multipart/form-data with field name 'image'.
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Dowry ID (UUID)
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 description: "New image file. Max size: 10MB. Formats: jpg, png, etc. Old image will be deleted."
 *     responses:
 *       200:
 *         description: Image updated successfully. The imageUrl is returned in the response and automatically saved to the dowry's imageUrl column.
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
 *                   example: "Image updated successfully"
 *                 imageUrl:
 *                   type: string
 *                   format: uri
 *                   example: "http://5.133.102.127:9000/mydowry-images/users/.../images/..."
 *                   description: "The public URL of the uploaded image. This URL is automatically saved to the dowry's imageUrl column."
 *                 dowry:
 *                   $ref: '#/components/schemas/Dowry'
 *       400:
 *         description: Bad request (file missing)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dowry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/image', verifyToken, uploadDowryImage, updateDowryImage);

/**
 * @swagger
 * /api/dowry/image/{id}:
 *   delete:
 *     summary: Delete dowry image
 *     description: Delete the image of a specific dowry. The image will be removed from MinIO and the dowry's imageUrl will be set to null.
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Dowry ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dowry image deleted successfully
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
 *                   example: "Dowry image deleted successfully"
 *                 dowry:
 *                   $ref: '#/components/schemas/Dowry'
 *       404:
 *         description: Dowry not found or has no image to delete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error deleting image from database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/image/:id', verifyToken, deleteDowryImage);

/**
 * @swagger
 * /api/dowry/delete/{id}:
 *   delete:
 *     summary: Delete dowry
 *     description: Delete a specific dowry and its associated image from MinIO (if exists)
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Dowry ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dowry deleted successfully
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
 *                   example: "Dowry deleted successfully"
 *       404:
 *         description: Dowry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/delete/:id', verifyToken, deleteDowry);

export default router;