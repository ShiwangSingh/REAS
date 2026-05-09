/**
 * REAS Backend — ML Proxy Route
 * ================================
 * Forwards image analysis requests from the React frontend to the
 * Python FastAPI microservice running on port 8000.
 *
 * POST /api/ml/analyze   → multipart image → analysis result JSON
 * GET  /api/ml/health    → Python service health check
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Keep uploaded file in memory (no disk writes)
const upload = multer({ storage: multer.memoryStorage() });

// ── GET /api/ml/health ─────────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
  try {
    const { data } = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    res.json({ ml_service: 'reachable', ...data });
  } catch (err) {
    res.status(503).json({
      ml_service: 'unreachable',
      error: 'Python ML service is not running. Start it with backend/ml_service/start.bat',
    });
  }
});

// ── POST /api/ml/analyze ───────────────────────────────────────────────────
router.post('/analyze', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided. Send as multipart/form-data with key "file".' });
  }

  try {
    // Forward the image buffer to the Python service
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'upload.jpg',
      contentType: req.file.mimetype,
    });

    const { data } = await axios.post(`${ML_SERVICE_URL}/analyze`, form, {
      headers: form.getHeaders(),
      timeout: 30000,   // 30 s — inference can be slow on CPU
    });

    res.json(data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Python ML service is not running.',
        hint: 'Run backend/ml_service/start.bat to start it.',
      });
    }
    const detail = err.response?.data?.detail || err.message;
    res.status(500).json({ error: 'ML inference failed', detail });
  }
});

module.exports = router;
