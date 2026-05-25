import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'; 

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
  planExpiry: Timestamp | null; 
  notifWhatsapp: boolean;
  notifPush: boolean;
  notifOnlyOperational: boolean;
}

export const ClientProfileModel = {
  
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  
  async updateSettings(userId: string, updatedFields: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updatedFields);
  }
};