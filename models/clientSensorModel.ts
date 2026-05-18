import { db, rtdb } from '@/lib/firebase';
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

  // Berlangganan data live dari Realtime Database
  subscribeToLiveStatus(callback: (data: any) => void) {
    const liveRef = ref(rtdb, 'sensorLive');
    
    onValue(liveRef, (snapshot) => {
      // Validasi ketat: Pastikan snapshot ada DAN parameter callback benar-benar sebuah fungsi
      if (snapshot.exists() && typeof callback === 'function') {
        callback(snapshot.val());
      }
    });

    // Mengembalikan fungsi untuk memutus pemantauan data (cleanup listener)
    return () => off(liveRef);
  }
};