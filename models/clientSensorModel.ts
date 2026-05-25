import { db, getRtdb } from '@/lib/firebase'; 
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';

export interface FirestoreSensor {
  id: string;
  userId: string;
  name: string;
  location: string;
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
  // Mengambil daftar konfigurasi sensor secara dinamis dari Firestore berdasarkan UID pengguna
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

  /**
   * Berlangganan data live dari sub-node Realtime Database secara spesifik
   * @param sensorId ID Dokumen sensor (contoh: sensor_001)
   * @param callback Fungsi pengirim pembaruan data state komponen
   */
  subscribeToLiveStatus(sensorId: string, callback: (data: LiveSensorData) => void) {
    // PERBAIKAN: Menunjuk langsung ke jalur path spesifik sensorId (dinamis)
    const liveRef = ref(getRtdb(), `sensorLive/${sensorId}`);
    
    onValue(liveRef, (snapshot) => {
      if (snapshot.exists() && typeof callback === 'function') {
        callback(snapshot.val() as LiveSensorData);
      }
    });

    // Mengembalikan fungsi untuk memutus pemantauan data (cleanup listener)
    return () => off(liveRef);
  }
};