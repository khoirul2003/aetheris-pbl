import { db, rtdb } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, onValue, off, DataSnapshot } from 'firebase/database';

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
  lpgLevel?: string;
  smokeLevel?: string;
  isOnline: boolean;
}

export const ClientSensorModel = {

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

  subscribeToLiveStatus(callback: (data: Record<string, LiveSensorData>) => void): () => void {
    const liveRef = ref(rtdb, 'sensorLive');
    
    onValue(liveRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists() && typeof callback === 'function') {
        callback(snapshot.val() as Record<string, LiveSensorData>);
      }
    });

    return () => {
      off(liveRef);
    };
  }
};