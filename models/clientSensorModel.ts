import { db, rtdb } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';

export interface FirestoreSensor {
  id: string;
  userId: string;
  name: string;
  location: string;
  isOnline: boolean;
  thresholds: {
    safe: number;
    warning: number;
    danger: number;
  };
}

export interface LiveSensorData {
  gas: number;
  temperature: number;
  humidity: number;
  status: string;
  isOnline: boolean;
}

export const ClientSensorModel = {
  // Ambil daftar area/sensor berdasarkan userId dari Firestore
  async getSensorsByUserId(userId: string): Promise<FirestoreSensor[]> {
    const sensorsRef = collection(db, 'sensors');
    const q = query(sensorsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const sensors: FirestoreSensor[] = [];
    querySnapshot.forEach((doc) => {
      sensors.push({ id: doc.id, ...doc.data() } as FirestoreSensor);
    });
    return sensors;
  },

  // Berlangganan data live dari Realtime Database berdasarkan sensorId
  subscribeToLiveStatus(sensorId: string, callback: (data: LiveSensorData) => void) {
    const liveRef = ref(rtdb, `sensorLive/${sensorId}`);
    onValue(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as LiveSensorData);
      }
    });
    // Mengembalikan fungsi untuk unsubscribe agar tidak bocor memorinya
    return () => off(liveRef);
  }
};