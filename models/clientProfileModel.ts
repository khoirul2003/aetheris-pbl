import { db, auth } from '@/lib/firebase';
import { doc, getDoc, getDocs, updateDoc, collection, query, where, orderBy, onSnapshot, setDoc, deleteDoc, Timestamp } from 'firebase/firestore'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';

export interface UserProfile {
  name: string;
  email: string;
  restaurantName?: string;
  address?: string;
  operationalHours?: {
    open: string;
    close: string;
  };
  phone?: string;
  plan?: 'basic' | 'pro';
  planExpiry?: Timestamp | null; 
  notifWhatsapp?: boolean;
  notifPush?: boolean;
  notifOnlyOperational?: boolean;
  role?: string;       // Properti opsional multi-role check
  isActive?: boolean;   // Properti status keaktifan admin/mitra
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface SystemConfig {
  defaultThreshold: number;
  notifyOnDanger: boolean;
}

export const ClientProfileModel = {
  // === MANAJEMEN PROFIL MITRA RESTORAN ===
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  async getAllProfiles(): Promise<any[]> {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users: any[] = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  },

  async updateSettings(userId: string, updatedFields: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updatedFields);
  },

  // Memetakan user ber-role 'user' ke dalam dictionary usersMap pada halaman analytics & alerts
  subscribeToAllUsers(callback: (users: { [uid: string]: string }) => void) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'user'));
    return onSnapshot(q, (snapshot) => {
      const mapping: { [uid: string]: string } = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        mapping[doc.id] = data.restaurantName || data.name || "Restoran Mitra";
      });
      callback(mapping);
    });
  },

  // === MANAJEMEN CONFIG PARAMETER SISTEM GLOBAL ===
  async getSystemConfig(): Promise<SystemConfig | null> {
    const docRef = doc(db, "systemConfig", "global");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SystemConfig;
    }
    return null;
  },

  async saveSystemConfig(payload: Partial<SystemConfig>): Promise<void> {
    const docRef = doc(db, "systemConfig", "global");
    await setDoc(docRef, payload, { merge: true });
  },

  // === MANAJEMEN AKUN SUB-ADMIN ===
  subscribeToAdmins(callback: (admins: AdminUser[]) => void) {
    const q = query(
      collection(db, "users"), 
      where("role", "==", "admin"),
      orderBy("email")
    );
    return onSnapshot(q, (snapshot) => {
      const admins: AdminUser[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email && data.name) {
          admins.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            isActive: data.isActive ?? false,
          });
        }
      });
      callback(admins);
    });
  },

  // Registrasi sub-admin baru ke Firebase Auth dengan type-safe data record parameter
  // Registrasi sub-admin baru di models/clientProfileModel.ts
  async createAdmin(data: { name: string; email: string; password?: string; isActive?: boolean }): Promise<void> {
    try {
      // Memastikan password ada sebelum diproses Auth
      const password = data.password || "";
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
      const uid = userCredential.user.uid;

      const docRef = doc(db, "users", uid);
      await setDoc(docRef, {
        name: data.name,
        email: data.email,
        password: password,
        role: "admin", 
        isActive: data.isActive ?? false, 
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Gagal mendaftarkan admin baru ke Firebase:", error);
      throw error;
    }
  },

  async updateAdmin(id: string, data: Record<string, unknown>): Promise<void> {
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, { ...data, updatedAt: new Date() });
  },

  async deleteAdmin(id: string): Promise<void> {
    const docRef = doc(db, "users", id);
    await deleteDoc(docRef);
  }
};