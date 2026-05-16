import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Pastikan file ini ada di root folder
const serviceAccountPath = join(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://aetheris-pbl-default-rtdb.firebaseio.com" 
  });
}

const db = admin.firestore();
const rtdb = admin.database();

async function seedDatabase() {
  try {
    console.log("Memulai pengisian data...");

    const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";
    const sensorId = "sensor_002";

    // Gunakan batch agar proses lebih efisien dan sinkron
    const batch = db.batch();

    // 1. Users
    const userRef = db.collection('users').doc(userId);
    batch.set(userRef, {
      name: "Muhammad Khoirul Anwarudin",
      email: "khoirul@email.com",
      role: "user",
      restaurantName: "Warung Pak Budi",
      address: "Jl. Raya Sidoarjo No. 12",
      plan: "pro",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Sensors
    const sensorRef = db.collection('sensors').doc(sensorId);
    batch.set(sensorRef, {
      userId: userId,
      name: "Kompor kanan",
      location: "Area memasak kanan",
      isOnline: true,
      thresholds: { safe: 300, warning: 450, danger: 600 },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    console.log("✅ Firestore (Users & Sensors) terisi.");

    // 3. Alerts
    await db.collection('alerts').add({
      sensorId,
      userId,
      level: "warning",
      message: "Kompor kanan mendekati batas aman",
      isResolved: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. Daily Summaries
    const dateStr = new Date().toISOString().split('T')[0];
    await db.collection('dailySummaries').doc(`${userId}_${dateStr}`).set({
      userId,
      date: dateStr,
      totalAlerts: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. Realtime Database
    await rtdb.ref(`sensorLive/${sensorId}`).set({
      gas: 287,
      temperature: 38,
      status: "safe",
      isOnline: true,
      lastUpdate: Date.now()
    });

    console.log("✅ Semua data awal berhasil diisi!");
  } catch (error) {
    console.error("❌ Terjadi kesalahan:", error);
  } finally {
    // Beri jeda sedikit sebelum exit untuk memastikan semua stream selesai
    setTimeout(() => process.exit(0), 1000);
  }
}

seedDatabase();