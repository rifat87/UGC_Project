import express from 'express';
import electionController from '../controllers/electionController.js';
const router = express.Router();

// TODO: Implement election routes
router.get('/', (req, res) => {
    res.json({ message: 'Election routes working' });
});

router.get('/public/election-data', electionController.getElectionData);

export default router; 