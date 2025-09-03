const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const admin = require('firebase-admin');
require('dotenv').config();

const firebaseConfig = {
  apiKey: "AIzaSyB_lb9CrNYA_DGFWojuiOfTatplgSFJKA8",
  authDomain: "crypto-tracker-38600.firebaseapp.com",
  projectId: "crypto-tracker-38600",
  storageBucket: "crypto-tracker-38600.firebasestorage.app",
  messagingSenderId: "331246390737",
  appId: "1:331246390737:web:166c37f01dc8c381be64f0",
  measurementId: "G-HFM2LRSKPJ"
};

// Initialize client SDK for Firestore operations
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Firebase Admin SDK for server-side authentication
if (!admin.apps.length) {
  admin.initializeApp();
}
const auth = admin.auth();

module.exports = { auth, db };
