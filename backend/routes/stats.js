const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const User = require('../models/User');

// GET stats
router.get('/', async (req, res) => {
  try {
    const activeAlerts = await Alert.countDocuments();
    const reportsSubmitted = await User.aggregate([{ $group: { _id: null, total: { $sum: "$reportsCount" } } }]);
    
    // For specific stats like verifiedPercent, we calculate from alerts
    const verifiedAlerts = await Alert.countDocuments({ verified: true });
    const verifiedPercent = activeAlerts > 0 ? Math.round((verifiedAlerts / activeAlerts) * 100) : 0;

    res.json({
      activeAlerts,
      reportsSubmitted: reportsSubmitted[0]?.total || 0,
      verifiedPercent: verifiedPercent || 87, // fallback to mock if no data
      roadsCovered: 15430, // Mocked for now
      trends: {
        activeAlerts: 12,
        reportsSubmitted: 8,
        verifiedPercent: 3,
        roadsCovered: -2
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
