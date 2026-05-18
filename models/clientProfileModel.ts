import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  name: string;
  email: string;
  restaurantName: string;
  address: string;
  operationalHours: {
    open: string;
    close: string;
  };
  phone: string;
  plan: 'basic' | 'pro';
  planExpiry: any;
  notifWhatsapp: boolean;
  notifPush: boolean;
  notifOnlyOperational: boolean;
}

export const ClientProfileModel = {
  // Mengambil data profil user secara real-time/sekali panggil
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  // Memperbarui pengaturan tertentu (misal: toggle notifikasi atau jam operasional)
  async updateSettings(userId: string, updatedFields: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updatedFields);
  }
};