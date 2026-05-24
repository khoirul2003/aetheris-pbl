import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  doc,       // ➔ Ditambahkan: Untuk mengambil referensi dokumen
  updateDoc  // ➔ Ditambahkan: Untuk mengubah data dokumen
} from 'firebase/firestore';

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
}

export const ClientAlertModel = {
  /**
   * Mengubah status properti isResolved dokumen di Firestore menjadi true
   * @param alertId ID Dokumen dari baris tabel yang diklik
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      const alertRef = doc(db, 'alerts', alertId);
      await updateDoc(alertRef, {
        isResolved: true,
        resolvedAt: Timestamp.now() // Mencatat waktu penanganan instan
      });
    } catch (error) {
      console.error("Gagal eksekusi fungsi resolveAlert:", error);
      throw error;
    }
  }, // ➔ Ditambahkan: Tanda koma pembatas antar fungsi di dalam objek

  /**
   * Mendengarkan riwayat log alert secara real-time berdasarkan ID Pengguna
   */
  subscribeToAlerts(userId: string, callback: (data: AlertData[]) => void): () => void {
    const alertsRef = collection(db, 'alerts');
    const q = query(
      alertsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alerts: AlertData[] = [];
      snapshot.forEach((docSnap) => { // Mengubah nama iterasi menjadi 'docSnap' agar tidak bentrok dengan fungsi 'doc' di atas
        const data = docSnap.data();
        alerts.push({
          id: docSnap.id,
          sensorId: data.sensorId as string || '',
          userId: data.userId as string || '',
          sensorName: data.sensorName as string || '',
          location: data.location as string || '',
          level: data.level as 'warning' | 'danger' || 'warning',
          gasValue: data.gasValue as number || 0,
          temperature: data.temperature as number || 0,
          message: data.message as string || '',
          isResolved: !!data.isResolved,
          createdAt: data.createdAt as Timestamp | null
        });
      });
      
      if (typeof callback === 'function') {
        callback(alerts);
      }
    });

    return unsubscribe;
  }
};