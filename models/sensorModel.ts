import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, set } from 'firebase/database';

export const SensorModel = {
  async saveHistory(sensorId: string, data: any) {
    const readingsRef = collection(db, "sensors", sensorId, "readings");
    return await addDoc(readingsRef, {
      ...data,
      timestamp: serverTimestamp(),
    });
  },

  async updateLiveStatus(sensorId: string, data: any) {
    const liveRef = ref(rtdb, `sensorLive/${sensorId}`);
    return await set(liveRef, {
      ...data,
      lastUpdate: Date.now()
    });
  },

  async createAlert(alertData: any) {
    return await addDoc(collection(db, "alerts"), {
      ...alertData,
      createdAt: serverTimestamp(),
      isResolved: false
    });
  }
};