import { db } from '@/lib/firebase';
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
  createdAt: any; 
  restaurantName?: string; // Tambahkan ini agar tidak error TS(2339)
}

export const ClientAlertModel = {
  subscribeToAlerts(userId: string, callback: (alerts: AlertData[]) => void) {
    const alertsRef = collection(db, 'alerts');
    
    // Jika diakses oleh admin, kita hilangkan filter where userId agar bisa memantau semua restoran
    const q = userId === "ALL" 
      ? query(alertsRef, orderBy('createdAt', 'desc'))
      : query(alertsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts: AlertData[] = [];
      snapshot.forEach((doc) => {
        alerts.push({ id: doc.id, ...doc.data() } as AlertData);
      });
      callback(alerts);
    }, (error) => {
      console.error("Error fetching alerts real-time:", error);
    });

    return unsubscribe; 
  }
};