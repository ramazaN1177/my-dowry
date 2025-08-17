import express from 'express';
import { createDowry, getDowries, getDowryById, updateDowry, deleteDowry } from '../controller/dowry.controller';
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
 *         title:
 *           type: string
 *           example: "Gold Necklace"
 *         description:
 *           type: string
 *           example: "Beautiful gold necklace with precious stones"
 *         category:
 *           type: string
 *           enum: [jewelry, electronics, furniture, clothing, other]
 *           example: "jewelry"
 *         value:
 *           type: number
 *           example: 5000
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["image1.jpg", "image2.jpg"]
 *         notes:
 *           type: string
 *           example: "Family heirloom"
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
 *               - title
 *               - description
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Gold Necklace"
 *               description:
 *                 type: string
 *                 example: "Beautiful gold necklace with precious stones"
 *               category:
 *                 type: string
 *                 enum: [jewelry, electronics, furniture, clothing, other]
 *                 example: "jewelry"
 *               value:
 *                 type: number
 *                 example: 5000
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["image1.jpg", "image2.jpg"]
 *               notes:
 *                 type: string
 *                 example: "Family heirloom"
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
 *     summary: Get all dowries
 *     description: Get all dowries for the authenticated user
 *     tags: [Dowry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         description: Filter by category
 *         schema:
 *           type: string
 *           enum: [jewelry, electronics, furniture, clothing, other]
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
 *                 dowries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Dowry'
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   example: 3
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
 *               title:
 *                 type: string
 *                 example: "Updated Gold Necklace"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               category:
 *                 type: string
 *                 enum: [jewelry, electronics, furniture, clothing, other]
 *                 example: "jewelry"
 *               value:
 *                 type: number
 *                 example: 6000
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["image1.jpg", "image2.jpg"]
 *               notes:
 *                 type: string
 *                 example: "Updated notes"
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

export default router;