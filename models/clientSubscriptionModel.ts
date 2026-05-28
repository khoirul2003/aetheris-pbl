import { db, getRtdb } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

export interface SubscriptionPackage {
  id: string; // 'basic' | 'pro' | dll
  name: string;
  price: number;
  maxSensors: number;
  historyDurationDays: number;
  features: string[];
  isActive: boolean;
}

export interface UserSubscriptionLog {
  id: string;
  userId: string;
  restaurantName: string;
  packageName: string;
  startDate: Timestamp;
  endDate: Timestamp;
  paymentStatus: "paid" | "pending" | "expired";
  amount: number;
}

export const ClientSubscriptionModel = {
  // Ambil semua daftar paket langganan
  subscribeToPackages(callback: (packages: SubscriptionPackage[]) => void) {
    const q = query(collection(db, "subscriptionPackages"));
    return onSnapshot(q, (snapshot) => {
      const packages: SubscriptionPackage[] = [];
      snapshot.forEach((docSnap) => {
        packages.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as SubscriptionPackage);
      });
      callback(packages);
    });
  },

  // Simpan / Perbarui konfigurasi paket langganan
  async savePackage(
    packageId: string,
    payload: Partial<SubscriptionPackage>,
  ): Promise<void> {
    const packageRef = doc(db, "subscriptionPackages", packageId);
    await setDoc(packageRef, payload, { merge: true });
  },

  // Ambil semua log transaksi langganan dari seluruh user secara global
  subscribeToAllUserSubscriptions(
    callback: (logs: UserSubscriptionLog[]) => void,
  ) {
    const q = query(collection(db, "userSubscriptions"));
    return onSnapshot(q, (snapshot) => {
      const logs: UserSubscriptionLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() } as UserSubscriptionLog);
      });
      callback(logs);
    });
  },

  // Perpanjang / Modifikasi Langganan User Secara Manual
  async updateUserSubscription(
    logId: string,
    payload: Partial<UserSubscriptionLog>,
  ): Promise<void> {
    const subRef = doc(db, "userSubscriptions", logId);
    await updateDoc(subRef, payload);
  },
};
