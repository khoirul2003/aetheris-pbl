import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// 1. Inisialisasi Firebase Admin SDK menggunakan Berkas Kunci Lokal
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

const FONNTE_TOKEN = "zNFc2Q6yMPmYFp8VmTs2";

console.log("🛰️  Aetheris Alert Watcher (Strict Cooldown 6 Menit) Aktif...");

// Map untuk mengunci waktu pengiriman terakhir untuk masing-masing sensorId (dalam milidetik)
const lastNotificationTimeMap = new Map<string, number>();

console.log("Menghubungkan ke Saluran Firebase Realtime Database...");

// ====================================================================
// ALUR 1: DETEKSI ANOMALI DARI HARDWARE & KIRIM WHATSAPP DENGAN JEDA 6 MENIT
// ====================================================================
rtdb.ref('sensorLive').on('value', async (snapshot) => {
  if (!snapshot.exists()) return;

  const nodes = snapshot.val() as Record<string, {
    gas: number;
    temperature: number;
    humidity: number;
    status: string;
    lpgLevel?: string;
    smokeLevel?: string;
  }>;

  const currentTime = Date.now();
  const jedaEnamMenit = 6 * 60 * 1000; 

  for (const [sensorId, telemetry] of Object.entries(nodes)) {
    const currentStatus = telemetry.status; 

    if (currentStatus === 'safe') {
      if (lastNotificationTimeMap.has(sensorId)) {
        console.log(`\nNode [${sensorId}] sudah kembali AMAN secara alami. Melepas kunci cooldown.`);
        lastNotificationTimeMap.delete(sensorId);
      }
      continue;
    }

    const lastSentTime = lastNotificationTimeMap.get(sensorId) || 0;
    
    if (lastSentTime > 0 && (currentTime - lastSentTime) < jedaEnamMenit) {
      continue;
    }

    try {
      // FIX INDEX ERROR: Cek status alert aktif menggunakan JavaScript filter lokal
      const activeAlertsSnapshot = await db.collection('alerts')
        .where('sensorId', '==', sensorId)
        .where('isResolved', '==', false)
        .get();

      if (lastSentTime > 0 && activeAlertsSnapshot.empty) {
        console.log(`[${sensorId}] Deteksi masih ${currentStatus}, tetapi sudah diklik 'Tangani' di web. Pengiriman dibatalkan.`);
        lastNotificationTimeMap.delete(sensorId); 
        continue;
      }

      console.log(`\n Memproses Notifikasi untuk Node [${sensorId}]! Status: ${currentStatus.toUpperCase()}`);

      const sensorDoc = await db.collection('sensors').doc(sensorId).get();
      const sensorInfo = sensorDoc.exists ? sensorDoc.data() : null;
      
      const namaAlat = sensorInfo?.name || "Kompor IoT";
      const lokasiAlat = sensorInfo?.location || "Dapur Utama";
      const userIdPemilik = sensorInfo?.userId || "O4O7ZiAKmCUoNtqBoJhTsk3prHW2";

      let nomorWaTujuan = "";
      const userDoc = await db.collection('users').doc(userIdPemilik).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const dbPhone = userData?.phone || userData?.phoneNumber || userData?.whatsapp;
        if (dbPhone) nomorWaTujuan = dbPhone;
      }

      if (!nomorWaTujuan) {
        console.error(`Gagal kirim WA: Nomor telepon user [${userIdPemilik}] tidak ditemukan di Firestore.`);
        continue;
      }

      if (nomorWaTujuan.startsWith('0')) {
        nomorWaTujuan = '62' + nomorWaTujuan.slice(1);
      }
      nomorWaTujuan = nomorWaTujuan.replace(/[^0-9]/g, '');

      if (lastSentTime === 0) {
        const messageText = currentStatus === 'danger' 
          ? `Kebocoran gas kritis terdeteksi di area ${namaAlat}!` 
          : `Kadar gas di area ${namaAlat} mendekati batas ambang aman.`;

        await db.collection('alerts').add({
          sensorId,
          userId: userIdPemilik,
          sensorName: namaAlat,
          location: lokasiAlat,
          level: currentStatus,
          message: messageText,
          gasValue: telemetry.gas,
          temperature: telemetry.temperature,
          isResolved: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`📝 Berhasil menulis log insiden baru ke Firestore Alerts.`);
      }

      const statusPesan = lastSentTime > 0 ? ` *PENGINGAT ULANG (BELUM AMAN / BELUM DITANGANI)*\n\n` : ` *AETHERIS KITCHEN ALERT SYSTEM*\n\n`;
      
      const templatePesanWA = 
        statusPesan +
        ` *STATUS:* ${currentStatus.toUpperCase()}\n` +
        ` *Lokasi:* ${lokasiAlat} (${namaAlat})\n` +
        ` *Kadar Gas:* ${telemetry.gas} PPM\n` +
        ` *Kepadatan LPG:* ${telemetry.lpgLevel || 'HIGH'}\n` +
        ` *Suhu:* ${telemetry.temperature}°C\n\n` +
        `*Catatan:* Jika area dapur sudah aman, mohon segera pastikan kondisi fisik terkendali dan tekan tombol *Tangani* pada dashboard web untuk menghentikan pengingat ulang.`;

      lastNotificationTimeMap.set(sensorId, currentTime);

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": FONNTE_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          target: nomorWaTujuan,
          message: templatePesanWA,
          countryCode: "62"
        })
      });

      if (response.ok) {
        console.log(`🚀 Pesan WhatsApp berhasil dikirim ke ${nomorWaTujuan} (Masa tunggu 6 menit dimulai).`);
      } else {
        console.error(`❌ Gerbang Fonnte menolak pengiriman:`, await response.text());
      }

    } catch (error) {
      console.error("❌ Gagal memproses data anomali telemetri:", error);
    }
  }
});

// ====================================================================
// ALUR 2: SINKRONISASI REAL-TIME SNAPSHOT TANGANI (DARI WEB KE HARDWARE)
// ====================================================================
console.log("⏳ Menghubungkan pengawas resolusi Firestore Alerts...");

db.collection('alerts').where('isResolved', '==', true).onSnapshot((snapshot) => {
  snapshot.docChanges().forEach(async (change) => {
    if (change.type === 'modified' || change.type === 'added') {
      const data = change.doc.data();
      const sensorId = data.sensorId;

      console.log(`\n💡 Aksi klik 'Tangani' terdeteksi di web untuk node [${sensorId}]. Meriset status hardware...`);

      try {
        lastNotificationTimeMap.delete(sensorId);

        await rtdb.ref(`sensorLive/${sensorId}`).update({
          status: "safe",
          lpgLevel: "LOW",
          smokeLevel: "CLEAR"
        });
        console.log(`✅ Status node [${sensorId}] di Realtime Database berhasil dikembalikan ke AMAN.`);
      } catch (err) {
        console.error(`❌ Gagal meriset status keamanan pada Realtime Database:`, err);
      }
    }
  });
});