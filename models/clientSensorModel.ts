import { db, getRtdb } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";

export interface FirestoreSensor {
  id: string;
  userId: string;
  name: string;
  location: string;
  thresholds: {
    safe: number;
    warning: number;
    danger: number;
  };
}

export interface LiveSensorData {
  gas: number;
  temperature: number;
  humidity: number;
  status: string;
  isOnline: boolean;
}

export interface SensorData {
  id: string;
  userId: string;
  sensorName: string;
  location: string;
  macAddress: string;
  firmwareVersion: string;
  status: "aman" | "waspada" | "bahaya";
  isActive: boolean;
  isOnline: boolean;
  lastOnline: Timestamp | null;
  gasValue: number;
  temperature: number;
  humidity: number;
  thresholdGasSafe: number;
  thresholdGasWarning: number;
  thresholdGasDanger: number;
  thresholdTempSafe: number;
  thresholdTempWarning: number;
  thresholdTempDanger: number;
}

export const ClientSensorModel = {
  // Mengambil daftar konfigurasi sensor secara dinamis dari Firestore berdasarkan UID pengguna
  async getSensorsByUserId(userId: string): Promise<FirestoreSensor[]> {
    const sensorsRef = collection(db, "sensors");
    const q = query(sensorsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const sensors: FirestoreSensor[] = [];
    querySnapshot.forEach((doc) => {
      sensors.push({ id: doc.id, ...doc.data() } as FirestoreSensor);
    });
    return sensors;
  },

  /**
   * Berlangganan data live dari sub-node Realtime Database secara spesifik
   * @param sensorId ID Dokumen sensor (contoh: sensor_001)
   * @param callback Fungsi pengirim pembaruan data state komponen
   */
  subscribeToLiveStatus(
    sensorId: string,
    callback: (data: LiveSensorData) => void,
  ) {
    // PERBAIKAN: Menunjuk langsung ke jalur path spesifik sensorId (dinamis)
    const liveRef = ref(getRtdb(), `sensorLive/${sensorId}`);

    onValue(liveRef, (snapshot) => {
      if (snapshot.exists() && typeof callback === "function") {
        callback(snapshot.val() as LiveSensorData);
      }
    });

    // Mengembalikan fungsi untuk memutus pemantauan data (cleanup listener)
    return () => off(liveRef);
  },

  // Berlangganan daftar semua sensor untuk pemetaan ID ke nama lokasi (untuk dropdown & tampilan nama sensor)
  subscribeToAllSensors(callback: (sensors: SensorData[]) => void) {
    const q = query(collection(db, "sensors"));
    return onSnapshot(q, (snapshot) => {
      const sensors: SensorData[] = [];
      snapshot.forEach((docSnap) => {
        sensors.push({ id: docSnap.id, ...docSnap.data() } as SensorData);
      });
      callback(sensors);
    });
  },

  // Daftarkan Perangkat Sensor Baru
  async registerNewSensor(
    payload: Omit<
      SensorData,
      | "id"
      | "status"
      | "isOnline"
      | "lastOnline"
      | "gasValue"
      | "temperature"
      | "humidity"
    >,
  ): Promise<void> {
    const sensorsRef = collection(db, "sensors");
    await addDoc(sensorsRef, {
      ...payload,
      status: "aman",
      isOnline: false,
      lastOnline: null,
      gasValue: 0,
      temperature: 0,
      humidity: 0,
      createdAt: new Date(),
    });
  },

  // Update Parameter Ambang Batas (Threshold) oleh Admin
  async updateSensorThresholds(
    sensorId: string,
    thresholds: Partial<SensorData>,
  ): Promise<void> {
    const sensorRef = doc(db, "sensors", sensorId);
    await updateDoc(sensorRef, { ...thresholds, updatedAt: new Date() });
  },

  // Ubah Status Keaktifan Sensor (Nonaktifkan / Aktifkan)
  async toggleSensorStatus(
    sensorId: string,
    currentStatus: boolean,
  ): Promise<void> {
    const sensorRef = doc(db, "sensors", sensorId);
    await updateDoc(sensorRef, { isActive: !currentStatus });
  },

  // Trigger OTA Update Command ke Perangkat ESP32 via Firestore Flag
  async triggerOTAUpdate(
    sensorId: string,
    targetVersion: string,
  ): Promise<void> {
    const sensorRef = doc(db, "sensors", sensorId);
    await updateDoc(sensorRef, {
      otaUpdateCommand: true,
      targetFirmwareVersion: targetVersion,
      commandTimestamp: new Date(),
    });
  },
};
