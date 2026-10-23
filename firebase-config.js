// ===== FIREBASE — console la irundhu un config-ah inga paste pannu =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBM_D8VJPDUtNtUizGsODH9meKak-JeILo",
  authDomain: "fdquiz-8e432.firebaseapp.com",
  projectId: "fdquiz-8e432",
  storageBucket: "fdquiz-8e432.firebasestorage.app",
  messagingSenderId: "832540407782",
  appId: "1:832540407782:web:9a7f32f092ff30d0f10827"
};

// config paste pannita true aagum
export const isConfigured = firebaseConfig.apiKey !== "PASTE_HERE";
export const db = getFirestore(initializeApp(firebaseConfig));
