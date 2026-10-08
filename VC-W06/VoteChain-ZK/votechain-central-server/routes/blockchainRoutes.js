import express from 'express';
const router = express.Router();

// TODO: Implement blockchain routes
router.get('/', (req, res) => {
    res.json({ message: 'Blockchain routes working' });
});

export default router; 