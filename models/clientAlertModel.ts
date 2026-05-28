import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp, Query } from 'firebase/firestore'; 

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
  restaurantName?: string; // Dipertahankan sebagai properti opsional untuk fallback data
}

export const ClientAlertModel = {
  // Langganan data log alert secara dinamis & real-time
  subscribeToAlerts(userId: string, callback: (alerts: AlertData[]) => void) {
    const alertsRef = collection(db, 'alerts');
    
    // FIX CI/CD: Mendukung parameter "ALL" agar admin bisa menarik seluruh data alert tanpa filter userId
    let q: Query;
    if (userId === "ALL") {
      q = query(
        alertsRef,
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        alertsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc') 
      );
    }

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

  // Fungsi Mengubah status alert menjadi selesai ditangani di Firestore
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