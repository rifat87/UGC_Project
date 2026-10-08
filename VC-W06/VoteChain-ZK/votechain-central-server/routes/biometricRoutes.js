import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fingerprintController from '../controllers/fingerprintController.js';
import {
    requireWp5AdminRequest,
} from '../middleware/adminRequestSecurity.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test route
router.get('/', (req, res) => {
    res.json({ message: 'Biometric routes working' });
});

// Face capture
router.post('/capture-face', requireWp5AdminRequest, async (req, res) => {
    const { nid } = req.body;

    if (!nid) {
        return res.status(400).json({ success: false, message: 'NID is required' });
    }

    let responseSent = false;

    try {
        const faceRecognitionPath = path.join(__dirname, '../../votechain-face-recognition');
        const pythonProcess = spawn('python', ['dataset.py', nid], {
            cwd: faceRecognitionPath,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        pythonProcess.stdout.on('data', (data) => {
            void data;
            console.log('Face capture process produced output');
        });

        pythonProcess.stderr.on('data', (data) => {
            void data;
            console.error('Face capture process reported an error');
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);

            if (!responseSent) {
                if (code === 0) {
                    res.json({
                        success: true,
                        message: 'Face captured successfully'
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        message: 'Face capture failed'
                    });
                }
                responseSent = true;
            }
        });

        pythonProcess.on('error', (err) => {
            console.error('Failed to start Python process:', err);
            if (!responseSent) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to start face capture process'
                });
                responseSent = true;
            }
        });

    } catch (error) {
        console.error('Error in face capture:', error);
        if (!responseSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to start face capture process'
            });
            responseSent = true;
        }
    }
});

// Fingerprint routes (JSON-based)
router.post('/fingerprint/enroll', requireWp5AdminRequest, fingerprintController.captureFingerprint);
router.post('/fingerprint/detect', (_req, res) => {
    return res.status(410).json({
        success: false,
        message: 'Legacy candidate-aware fingerprint vote preparation is disabled. Use /api/wp5/authorize/fingerprint.'
    });
});
router.post('/fingerprint/format', requireWp5AdminRequest, fingerprintController.formatFingerprintDatabase);

export default router;
