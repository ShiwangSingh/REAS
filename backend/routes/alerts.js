const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET all alerts
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ reportedAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single alert
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (alert) {
      res.json(alert);
    } else {
      res.status(404).json({ message: 'Alert not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new alert
router.post('/', async (req, res) => {
  const alert = new Alert({
    ...req.body,
    reportedAt: new Date().toISOString()
  });

  try {
    const newAlert = await alert.save();
    req.app.get('io').emit('new_alert', newAlert);
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT upvote alert
router.put('/:id/upvote', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (alert) {
      alert.upvotes += 1;
      const updatedAlert = await alert.save();
      req.app.get('io').emit('alert_updated', updatedAlert);
      res.json(updatedAlert);
    } else {
      res.status(404).json({ message: 'Alert not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE alert
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (alert) {
      await Alert.deleteOne({ _id: req.params.id });
      req.app.get('io').emit('alert_deleted', req.params.id);
      res.json({ message: 'Alert removed' });
    } else {
      res.status(404).json({ message: 'Alert not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
