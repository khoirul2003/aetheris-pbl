import { db } from '@/lib/firebase';
// 1. Hapus 'off' dari firebase/firestore
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'; 

export interface AlertData {
  id: string;
  sensorId: string;
  userId: string;
  sensorName: string;
  location: string;
  level: 'warning' | 'danger';
  gasValue: number;
  temperature: number;
  message: string;
  isResolved: boolean;
  createdAt: any; // Timestamp Firestore
}

export const ClientAlertModel = {
  // Berlangganan data riwayat alert secara real-time berdasarkan userId
  subscribeToAlerts(userId: string, callback: (alerts: AlertData[]) => void) {
    const alertsRef = collection(db, 'alerts');
    const q = query(
      alertsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc') // Alert terbaru muncul paling atas
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts: AlertData[] = [];
      snapshot.forEach((doc) => {
        alerts.push({ id: doc.id, ...doc.data() } as AlertData);
      });
      callback(alerts);
    }, (error) => {
      console.error("Error fetching alerts real-time:", error);
    });

    // 2. Kembalikan fungsi 'unsubscribe' bawaan dari onSnapshot Firestore
    return unsubscribe; 
  }
};