import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

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

const getPastDateString = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Interface terstruktur untuk menghindari error 'any' pada ESLint Linting CI
interface AlertSeedData {
  sensorId: string;
  sensorName: string;
  location: string;
  level: string;
  message: string;
  gasValue: number;
  temperature: number;
  isResolved: boolean;
  daysAgo: number;
}

async function seedDatabase(): Promise<void> {
  try {
    console.log("🚀 Memulai pengisian data berskala besar (Versi Integrasi IoT)...");

    const userId = "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";
    
    // List 4 ID Sensor dinamis
    const s1 = "sensor_001"; // Kompor utama
    const s2 = "sensor_002"; // Kompor kanan (Terhubung ke Hardware ESP32)
    const s3 = "sensor_003"; // Gudang tabung gas
    const s4 = "sensor_004"; // Area exhaust / ventilasi

    const batch = db.batch();

    // ==========================================
    // 1. DATA USER PROFILE (Firestore)
    // ==========================================
    const userRef = db.collection('users').doc(userId);
    batch.set(userRef, {
      name: "Muhammad Khoirul Anwarudin",
      email: "khoirul@email.com",
      role: "user",
      restaurantName: "Warung Pak Budi",
      address: "Jl. Raya Sidoarjo No. 12",
      phone: "+62 812-3456-7890",
      operationalHours: { open: "08:00", close: "22:00" },
      plan: "pro",
      notifWorkspace: true,
      notifPush: true,
      notifOnlyOperational: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // ==========================================
    // 2. DATA 4 SENSORS CONFIG (Firestore)
    // ==========================================
    batch.set(db.collection('sensors').doc(s1), {
      userId, name: "Kompor utama", location: "Area memasak kaki", isOnline: true,
      thresholds: { safe: 300, warning: 450, danger: 600 },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    batch.set(db.collection('sensors').doc(s2), {
      userId, name: "Kompor kanan", location: "Area memasak kanan", isOnline: true,
      thresholds: { safe: 300, warning: 450, danger: 600 },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    batch.set(db.collection('sensors').doc(s3), {
      userId, name: "Gudang tabung gas", location: "Ruang penyimpanan", isOnline: true,
      thresholds: { safe: 200, warning: 350, danger: 500 },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    batch.set(db.collection('sensors').doc(s4), {
      userId, name: "Area exhaust / ventilasi", location: "Plafon dekat kipas", isOnline: true,
      thresholds: { safe: 250, warning: 400, danger: 550 },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await batch.commit();
    console.log("✅ Firestore (Users & 4 Sensors) terisi.");

    // ==========================================
    // 3. DATA ALERTS HISTORY (Firestore)
    // ==========================================
    console.log("⏳ Mengisi log riwayat alert...");
    const alertsData: AlertSeedData[] = [
      { sensorId: s2, sensorName: "Kompor kanan", location: "Area memasak kanan", level: "warning", message: "Kompor kanan mendekati batas aman", gasValue: 655, temperature: 38, isResolved: false, daysAgo: 0 },
      { sensorId: s1, sensorName: "Kompor utama", location: "Area memasak kaki", level: "danger", message: "Kadar gas kritis di Kompor Utama!", gasValue: 1620, temperature: 42, isResolved: true, daysAgo: 0 },
      { sensorId: s4, sensorName: "Area exhaust / ventilasi", location: "Plafon dekat kipas", level: "warning", message: "Sirkulasi udara mendeteksi akumulasi gas tipis", gasValue: 710, temperature: 35, isResolved: true, daysAgo: 0 },
      { sensorId: s2, sensorName: "Kompor kanan", location: "Area memasak kanan", level: "danger", message: "Kebocoran gas terdeteksi di Kompor Kanan!", gasValue: 2680, temperature: 40, isResolved: true, daysAgo: 1 },
      { sensorId: s1, sensorName: "Kompor utama", location: "Area memasak kaki", level: "danger", message: "Suhu kompor utama terlalu panas", gasValue: 550, temperature: 75, isResolved: true, daysAgo: 1 },
      { sensorId: s4, sensorName: "Area exhaust / ventilasi", location: "Plafon dekat kipas", level: "warning", message: "Kadar gas meningkat di ventilasi", gasValue: 815, temperature: 32, isResolved: true, daysAgo: 2 },
      { sensorId: s1, sensorName: "Kompor utama", location: "Area memasak kaki", level: "warning", message: "Asap tipis terdeteksi", gasValue: 680, temperature: 46, isResolved: true, daysAgo: 3 },
      { sensorId: s3, sensorName: "Gudang tabung gas", location: "Ruang penyimpanan", level: "warning", message: "Indikasi gas mikro di ruang penyimpanan", gasValue: 320, temperature: 29, isResolved: true, daysAgo: 4 },
      { sensorId: s2, sensorName: "Kompor kanan", location: "Area memasak kanan", level: "warning", message: "Suhu sekitar kompor kanan naik mendadak", gasValue: 690, temperature: 52, isResolved: true, daysAgo: 5 }
    ];

    for (const alert of alertsData) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - alert.daysAgo);
      
      await db.collection('alerts').add({
        sensorId: alert.sensorId,
        userId: userId,
        sensorName: alert.sensorName,
        location: alert.location,
        level: alert.level,
        message: alert.message,
        gasValue: alert.gasValue,
        temperature: alert.temperature,
        isResolved: alert.isResolved,
        createdAt: admin.firestore.Timestamp.fromDate(targetDate)
      });
    }
    console.log("✅ Firestore (9 Riwayat Alerts) berhasil ditambahkan.");

    // ==========================================
    // 4. DATA DAILY SUMMARIES (Firestore) - Data Tren Laporan Grafik
    // ==========================================
    console.log("⏳ Mengisi data summary laporan 7 hari...");
    for (let i = 0; i < 8; i++) {
      const dateStr = getPastDateString(i);
      await db.collection('dailySummaries').doc(`${userId}_${dateStr}`).set({
        userId,
        date: dateStr,
        totalAlerts: i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 1 : 1,
        dangerCount: i === 0 ? 1 : i === 1 ? 2 : 0,
        warningCount: i === 0 ? 2 : 0,
        avgTemperature: 32 + (i % 3),
        avgGasPerSensor: {
          [s1]: 100 + (i * 20) % 150,
          [s2]: 150 + (i * 35) % 250,
          [s3]: 50 + (i * 10),
          [s4]: 80 + (i * 15)
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log("✅ Firestore (8 Hari Rangkuman Laporan harian) terisi.");

    console.log("⏳ Menyelaraskan matriks parameter LPG & Smoke Level ke Realtime Database...");
    
    await rtdb.ref(`sensorLive/${s1}`).set({
      gas: 145, temperature: 34, humidity: 55, status: "safe", lpgLevel: "LOW", smokeLevel: "CLEAR", isOnline: true, lastUpdate: Date.now()
    });

    // Perangkat 2: Waspada (Sedang-Tinggi) -> Sesuai dengan pembacaan sensor awal ESP32 Anda
    await rtdb.ref(`sensorLive/${s2}`).set({
      gas: 655, temperature: 30, humidity: 69, status: "warning", lpgLevel: "MEDIUM", smokeLevel: "LIGHT SMOKE", isOnline: true, lastUpdate: Date.now()
    });

    // Perangkat 3: Gudang Gas
    await rtdb.ref(`sensorLive/${s3}`).set({
      gas: 42, temperature: 28, humidity: 62, status: "safe", lpgLevel: "LOW", smokeLevel: "CLEAR", isOnline: true, lastUpdate: Date.now()
    });

    // Perangkat 4: Ventilasi
    await rtdb.ref(`sensorLive/${s4}`).set({
      gas: 85, temperature: 30, humidity: 58, status: "safe", lpgLevel: "LOW", smokeLevel: "CLEAR", isOnline: true, lastUpdate: Date.now()
    });

    console.log("✅ Realtime Database (4 Live Sensors Status dengan Skema IoT) terisi.");
    console.log("🎉 SEEDING SELESAI! Seluruh pilar visualisasi Web Dashboard Anda siap digunakan.");

  } catch (error) {
    console.error("❌ Terjadi kesalahan saat seeding:", error);
  } finally {
    setTimeout(() => process.exit(0), 1000);
  }
}

seedDatabase();