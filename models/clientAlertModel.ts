import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore'; 

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
  createdAt: Timestamp | null;
  restaurantName?: string;    
}

export const ClientAlertModel = {
  // Langganan data log alert secara dinamis & real-time
  subscribeToAlerts(userId: string, callback: (alerts: AlertData[]) => void) {
    const alertsRef = collection(db, 'alerts');
    
    // Jika diakses oleh admin ("ALL"), hilangkan filter where userId agar bisa memantau semua restoran
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
  },

  // Mengubah status alert menjadi selesai ditangani di Firestore (Fitur baru dari origin/main)
  async resolveAlertById(alertId: string): Promise<void> {
    try {
      const alertDocRef = doc(db, 'alerts', alertId);
      await updateDoc(alertDocRef, {
        isResolved: true
      });
    } catch (error) {
      console.error("Gagal mengupdate status penanganan insiden:", error);
      throw error;
    }
  }
};