import express from 'express';
import { createDowry, getDowries, getDowryById, updateDowry, deleteDowry } from '../controller/dowry.controller';
import { verifyToken } from '../middleware/verifyToken';

const router = express.Router();

// Create a new dowry
router.post('/create', verifyToken, createDowry);
// Get all dowries
router.get('/get', verifyToken, getDowries);
// Get a dowry by id
router.get('/get/:id', verifyToken, getDowryById);
// Update a dowry
router.put('/update/:id', verifyToken, updateDowry);
// Delete a dowry
router.delete('/delete/:id', verifyToken, deleteDowry);

export default router;