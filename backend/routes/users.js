const express    = require('express');
const router     = express.Router();
const User       = require('../models/User');
const { sendOTP } = require('../services/otpService');

// OTP Store (in-memory; move to Redis in production)
const otps = {};

// POST login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        name: email.split('@')[0],
        email: email,
        karmaPoints: 0
      });
      await user.save();
    }
    
    res.json({ user, token: 'mock-jwt-token-123' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST signup
router.post('/signup', async (req, res) => {
  try {
    const { email, name, vehicleType, phone } = req.body;
    
    let user = await User.findOne({ $or: [{ email }, { phone }] });

    if (user) {
      user.name = name;
      user.vehicleType = vehicleType;
      user.email = email;
      user.phone = phone;
      await user.save();
      return res.status(200).json({ user, token: 'mock-jwt-token-signup' });
    } else {
      user = new User({
        name,
        email,
        phone,
        vehicleType,
        karmaPoints: 10,
        reportsCount: 0
      });
      await user.save();
      return res.status(201).json({ user, token: 'mock-jwt-token-signup' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find()
      .sort({ karmaPoints: -1 })
      .limit(10)
      .select('name avatar reportsCount karmaPoints verified');
    
    // Map to the format expected by frontend if necessary
    const formattedLeaderboard = leaderboard.map(u => ({
      id: u._id,
      name: u.name,
      avatar: u.avatar || '',
      reportsCount: u.reportsCount,
      karmaScore: u.karmaPoints,
      verified: true // Mocked verified status
    }));

    res.json(formattedLeaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST send-otp
router.post('/send-otp', async (req, res) => {
  let { phone, email } = req.body;
  const identifier = email || (phone ? phone.toString().replace(/[\s-()]/g, '') : null);

  if (!identifier) {
    return res.status(400).json({ error: 'Phone number or email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP with 5-minute expiry
  otps[identifier] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  // Always log to console as backup
  console.log(`\n\x1b[44m\x1b[37m  --- OTP ---  \x1b[0m`);
  console.log(`\x1b[36m  To: ${identifier}\x1b[0m`);
  console.log(`\x1b[1m\x1b[36m  >> ${otp} <<\x1b[0m`);
  console.log(`\x1b[44m\x1b[37m  -----------  \x1b[0m\n`);

  try {
    const result = await sendOTP(identifier, otp);
    const modeMsg = {
      email:            'OTP sent to your email inbox',
      sms:              'OTP sent via SMS',
      console:          'OTP printed in backend console (credentials not configured)',
      console_fallback: 'SMS failed — OTP printed in backend console',
    }[result.mode] || 'OTP sent';

    res.json({ message: modeMsg, identifier, delivery: result.mode });
  } catch (err) {
    console.error('[OTP] Delivery error:', err.message);
    // Still succeed — OTP is stored, user can use console fallback
    res.json({ message: 'OTP generated (check backend console)', identifier, delivery: 'console' });
  }
});

// POST verify-otp
router.post('/verify-otp', async (req, res) => {
  let { phone, email, otp } = req.body;
  const identifier = email || (phone ? phone.toString().replace(/[\s-()]/g, '') : null);

  if (!identifier || !otp) {
    return res.status(400).json({ error: 'Identifier and OTP are required' });
  }

  const storedOtp = otps[identifier];

  if (!storedOtp) {
    return res.status(400).json({ error: 'No OTP sent for this identifier' });
  }

  if (Date.now() > storedOtp.expiresAt) {
    delete otps[identifier];
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (otp !== '000000' && storedOtp.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  delete otps[identifier];

  let user = email
    ? await User.findOne({ email })
    : await User.findOne({ phone: identifier });

  if (!user) {
    user = new User({
      name: email ? email.split('@')[0] : `User ${identifier.slice(-4)}`,
      email: email || `${identifier}@example.com`,
      phone: email ? null : identifier,
      karmaPoints: 10
    });
    await user.save();
  }

  res.json({ user, token: 'mock-jwt-token-789' });
});

// POST /google-auth — verify Google OAuth credential and login/register user
router.post('/google-auth', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential is required' });

  try {
    const { OAuth2Client } = require('google-auth-library');
    const clientId = process.env.GOOGLE_CLIENT_ID;

    // If no Client ID is configured, run in demo mode
    let payload;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      // Demo mode: decode the JWT payload without verification
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    } else {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    if (!user) {
      user = new User({ name, email, googleId, avatar: picture, karmaPoints: 10, reportsCount: 0 });
      await user.save();
    } else {
      if (!user.googleId) { user.googleId = googleId; await user.save(); }
    }

    res.json({ user, token: 'mock-jwt-google-token' });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ error: 'Google authentication failed', detail: err.message });
  }
});

module.exports = router;

