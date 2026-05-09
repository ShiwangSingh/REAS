const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['cctv', 'speed_breaker', 'construction', 'accident', 'pothole', 'waterlogging', 'fog', 'toll', 'fuel', 'police', 'other']
  },
  severity: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'info']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    road: { type: String, required: true },
    city: { type: String, required: true }
  },
  reportedAt: {
    type: Date,
    default: Date.now
  },
  reportedBy: {
    type: String // User ID or name
  },
  upvotes: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  photoUrls: [String]
});

module.exports = mongoose.model('Alert', alertSchema);
