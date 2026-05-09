/**
 * Quick test for Fast2SMS API
 * Run: node test_sms.js <your-10-digit-phone-number>
 * Example: node test_sms.js 9876543210
 */

require('dotenv').config();
const axios = require('axios');

const phone = process.argv[2];
if (!phone) {
  console.log('Usage: node test_sms.js <10-digit-phone-number>');
  process.exit(1);
}

const cleaned = phone.replace(/\D/g, '').slice(-10);
console.log(`Testing Fast2SMS with number: ${cleaned}`);
console.log(`API Key (first 10 chars): ${process.env.FAST2SMS_API_KEY?.slice(0, 10)}...`);

axios.post(
  'https://www.fast2sms.com/dev/bulkV2',
  {
    route: 'otp',
    variables_values: '123456',
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
)
.then(res => {
  console.log('\n✅ SUCCESS:', JSON.stringify(res.data, null, 2));
})
.catch(err => {
  if (err.response) {
    console.log('\n❌ Fast2SMS Error:');
    console.log('  Status:', err.response.status);
    console.log('  Response:', JSON.stringify(err.response.data, null, 2));
  } else {
    console.log('\n❌ Network Error:', err.message);
  }
});
