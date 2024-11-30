const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

module.exports = { auth, db };
