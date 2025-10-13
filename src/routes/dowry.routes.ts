import express from 'express';
import { createDowry, getDowries, getDowryById, updateDowry, deleteDowry, updateDowryStatus, addBooks } from '../controller/dowry.controller';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Dowry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           example: "Gold Necklace"
 *         description:
 *           type: string
 *           example: "Beautiful gold necklace with precious stones"
 *         Category:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "507f1f77bcf86cd799439011"
 *             name:
 *               type: string
 *               example: "Jewelry"
 *             icon:
 *               type: string
 *               example: "jewelry-icon.png"
 *         dowryPrice:
 *           type: number
 *           example: 5000
 *         dowryImage:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *           description: "Image ID reference"
 *         dowryLocation:
 *           type: string
 *           example: "Istanbul, Turkey"
 *         status:
 *           type: string
 *           enum: [purchased, not_purchased]
 *           example: "not_purchased"
 *         userId:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
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
 *     description: Create a new dowry item
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
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: "Category ID reference"
 *               dowryPrice:
 *                 type: number
 *                 example: 5000
 *               imageId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: "Image ID from uploaded image"
 *               dowryLocation:
 *                 type: string
 *                 example: "Istanbul, Turkey"
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
 *     description: Get all dowries for the authenticated user with optional filtering and pagination
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
 *         description: Filter by category ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Search in name and description fields
 *         schema:
 *           type: string
 *       - in: query
 *         name: isRead
 *         description: Filter by read status (for books)
 *         schema:
 *           type: boolean
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
 *         description: Dowries retrieved successfully
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
 *     description: Get a specific dowry by its ID
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
 *         description: Dowry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
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
 *     description: Update a specific dowry
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Gold Necklace"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               Category:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: "Category ID reference"
 *               dowryPrice:
 *                 type: number
 *                 example: 6000
 *               imageId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: "Image ID from uploaded image"
 *               dowryLocation:
 *                 type: string
 *                 example: "Istanbul, Turkey"
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
 * /api/dowry/delete/{id}:
 *   delete:
 *     summary: Delete dowry
 *     description: Delete a specific dowry
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

/**
 * @swagger
 * /api/dowry/addBooks:
 *   post:
 *     summary: Add multiple books at once
 *     description: Add multiple books from formatted text (Author – Book Name format)
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
 *               - text
 *               - categoryId
 *             properties:
 *               text:
 *                 type: string
 *                 example: "William Shakespeare – Romeo ve Juliet\nFyodor M. Dostoyevski – Yeraltından Notlar"
 *                 description: "Multi-line text with format: Author – Book Name"
 *               categoryId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: "Category ID (should be book category)"
 *     responses:
 *       201:
 *         description: Books added successfully
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
 *                   example: "Successfully added 10 books"
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookName:
 *                             type: string
 *                           author:
 *                             type: string
 *                           id:
 *                             type: string
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           line:
 *                             type: integer
 *                           text:
 *                             type: string
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         successful:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/addBooks', verifyToken, addBooks);

export default router;