import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface DailySummary {
  id: string;
  date: string;
  totalAlerts: number;
  dangerCount: number;
  warningCount: number;
  mostProblematicSensor: string;
  avgGasPerSensor: { [sensorId: string]: number };
  avgTemperature: number;
}

export const ClientReportModel = {
  // Ambil data rangkuman harian untuk 7 hari terakhir (Minggu ini)
  async getWeeklySummaries(userId: string): Promise<DailySummary[]> {
    const summaryRef = collection(db, 'dailySummaries');
    const q = query(
      summaryRef,
      where('userId', '==', userId),
      orderBy('date', 'asc'),
      limit(7)
    );

    const snapshot = await getDocs(q);
    const summaries: DailySummary[] = [];
    snapshot.forEach((doc) => {
      summaries.push({ id: doc.id, ...doc.data() } as DailySummary);
    });
    return summaries;
  }
};