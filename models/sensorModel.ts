import { db, getRtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

// Interface untuk data telemetri sensor
export interface SensorReading {
  gas: number;
  temperature: number;
  humidity: number;
  status: 'safe' | 'warning' | 'danger';
}

// Interface untuk data alert rawan bahaya
export interface AlertPayload {
  sensorId: string;
  userId: string;
  sensorName: string;
  location: string;
  level: 'warning' | 'danger';
  gasValue: number;
  temperature: number;
  message: string;
}

export const SensorModel = {
  // 1. Simpan riwayat ke Firestore (Sub-collection readings)
  async saveHistory(sensorId: string, data: SensorReading) {
    const readingsRef = collection(db, "sensors", sensorId, "readings");
    return await addDoc(readingsRef, {
      ...data,
      timestamp: serverTimestamp(),
    });
  },

  // 2. Update data LIVE ke Realtime Database
  async updateLiveStatus(sensorId: string, data: SensorReading & { isOnline: boolean }) {
    const liveRef = ref(getRtdb(), `sensorLive/${sensorId}`);
    return await set(liveRef, {
      ...data,
      lastUpdate: Date.now()
    });
  },

  // 3. Buat dokumen Alert jika bahaya terdeteksi
  async createAlert(alertData: AlertPayload) {
    return await addDoc(collection(db, "alerts"), {
      ...alertData,
      createdAt: serverTimestamp(),
      isResolved: false
    });
  }
};