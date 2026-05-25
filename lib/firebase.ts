import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";

// Masukkan kredensial Firebase Anda secara langsung di sini
const firebaseConfig = {
  apiKey: "AIzaSyDHJDIF1SYdlPVy7CNHVPfWo4u8xcMHe2w",
  authDomain: "aetheris-pbl.firebaseapp.com",
  projectId: "aetheris-pbl",
  storageBucket: "aetheris-pbl.firebasestorage.app",
  messagingSenderId: "425649596173",
  appId: "1:425649596173:web:6dc0fa619265c884beb244"
};

// Inisialisasi tanpa pengecekan ENV (Sangat aman dari error Turbopack)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// Fungsi pembungkus Realtime Database agar aman dari crash server-side Next.js
export const getRtdb = (): Database => {
  return getDatabase(app);
};

export { app, auth, db };