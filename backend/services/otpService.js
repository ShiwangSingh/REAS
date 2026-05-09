/**
 * REAS OTP Service
 * ================
 * Handles real OTP delivery via:
 *   - Email  → Gmail SMTP (Nodemailer)
 *   - Phone  → Fast2SMS API (free tier for Indian numbers)
 *
 * Setup:
 *   1. Add credentials to backend/.env (see below)
 *   2. Restart the backend
 *
 * Required .env variables:
 *   GMAIL_USER=your.email@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   ← Google App Password (not your Gmail password)
 *   FAST2SMS_API_KEY=your_fast2sms_api_key   ← from fast2sms.com → Dev API
 */

const nodemailer = require('nodemailer');
const axios      = require('axios');

// ── Email Transporter ────────────────────────────────────────────────────────
let emailTransporter = null;

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }

  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return emailTransporter;
}

// ── Send Email OTP ───────────────────────────────────────────────────────────
async function sendEmailOTP(toEmail, otp) {
  const transporter = getEmailTransporter();

  if (!transporter) {
    console.log(`[OTP] Gmail not configured. Email OTP for ${toEmail}: ${otp}`);
    return { success: true, mode: 'console' };
  }

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#0a0e1a;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-1px;">REAS</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Road Emergency Alert System</p>
      </div>
      <div style="padding:36px;background:#111827;">
        <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Your verification code is:</p>
        <div style="background:#1e293b;border:1px solid rgba(99,102,241,0.3);border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
          <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#818cf8;font-family:monospace;">${otp}</span>
        </div>
        <p style="color:#475569;font-size:13px;margin:0;line-height:1.6;">
          This code expires in <strong style="color:#94a3b8;">5 minutes</strong>.<br>
          If you didn't request this, please ignore this email.
        </p>
      </div>
      <div style="padding:20px;background:#0f172a;text-align:center;">
        <p style="color:#334155;font-size:12px;margin:0;">© 2025 REAS — Road Emergency Alert System</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"REAS" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `${otp} is your REAS verification code`,
    html,
  });

  console.log(`[OTP] Email OTP sent to ${toEmail}`);
  return { success: true, mode: 'email' };
}

// ── Send SMS OTP (Fast2SMS) ─────────────────────────────────────────────────
async function sendSmsOTP(phoneNumber, otp) {
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`[OTP] Fast2SMS not configured. SMS OTP for ${phoneNumber}: ${otp}`);
    return { success: true, mode: 'console' };
  }

  // Fast2SMS needs exactly 10 digits (Indian number, no country code)
  // Strip everything except digits, then take the last 10
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  const cleaned    = digitsOnly.slice(-10);

  console.log(`[OTP] Sending SMS to: ${cleaned} (original: ${phoneNumber})`);

  if (cleaned.length !== 10) {
    console.error(`[OTP] Invalid number length after cleaning: "${cleaned}" (${cleaned.length} digits). Fast2SMS needs exactly 10 digits.`);
    console.log(`[OTP] >>> Fallback OTP for ${phoneNumber}: ${otp} <<<`);
    return { success: true, mode: 'console_fallback', error: 'Invalid number length' };
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'otp',
        variables_values: otp,
        flash: 0,
        numbers: cleaned,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    console.log('[OTP] Fast2SMS response:', JSON.stringify(response.data));

    if (response.data.return === true) {
      console.log(`[OTP] SMS sent successfully to ${cleaned}`);
      return { success: true, mode: 'sms' };
    } else {
      const errMsg = Array.isArray(response.data.message)
        ? response.data.message.join(', ')
        : (response.data.message || 'Fast2SMS returned false');
      throw new Error(errMsg);
    }
  } catch (err) {
    // Log the full response body if available
    if (err.response) {
      console.error(`[OTP] Fast2SMS HTTP ${err.response.status}:`, JSON.stringify(err.response.data));
    } else {
      console.error(`[OTP] Fast2SMS error: ${err.message}`);
    }
    console.log(`[OTP] >>> Fallback OTP for ${phoneNumber}: ${otp} <<<`);
    return { success: true, mode: 'console_fallback', error: err.message };
  }
}

// ── Main dispatcher ──────────────────────────────────────────────────────────
async function sendOTP(identifier, otp) {
  const isEmail = identifier.includes('@');

  if (isEmail) {
    return await sendEmailOTP(identifier, otp);
  } else {
    return await sendSmsOTP(identifier, otp);
  }
}

module.exports = { sendOTP };
