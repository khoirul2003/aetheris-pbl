import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

export const SensorModel = {
  // 1. Simpan riwayat ke Firestore (Sub-collection readings)
  async saveHistory(sensorId: string, data: any) {
    const readingsRef = collection(db, "sensors", sensorId, "readings");
    return await addDoc(readingsRef, {
      ...data,
      timestamp: serverTimestamp(),
    });
  },

  // 2. Update data LIVE ke Realtime Database
  async updateLiveStatus(sensorId: string, data: any) {
    const liveRef = ref(rtdb, `sensorLive/${sensorId}`);
    return await set(liveRef, {
      ...data,
      lastUpdate: Date.now()
    });
  },

  // 3. Buat dokumen Alert jika bahaya terdeteksi
  async createAlert(alertData: any) {
    return await addDoc(collection(db, "alerts"), {
      ...alertData,
      createdAt: serverTimestamp(),
      isResolved: false
    });
  }
};