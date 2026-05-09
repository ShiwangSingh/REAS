import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// User must replace these empty strings with actual keys from their Firebase Console
// for the real SMS OTP functionality to activate and communicate with telecoms.
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "PLACEHOLDER_AUTH_DOMAIN",
  projectId: "PLACEHOLDER_PROJECT_ID",
  storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: "PLACEHOLDER_MESSAGING_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
