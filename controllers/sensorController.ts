import { SensorModel, SensorReading, AlertPayload } from '@/models/sensorModel';

// Interface untuk format JSON payload masuk dari router API sensor
export interface IncomingSensorPayload {
  userId: string;
  gas: number;
  temperature: number;
  humidity: number;
  sensorName: string;
  location: string;
}

export const SensorController = {
  // Logika penentuan status berdasarkan threshold kriteria PBL
  evaluateStatus(gas: number, temp: number): 'safe' | 'warning' | 'danger' {
    if (gas >= 600 || temp >= 70) return "danger";
    if (gas >= 450 || temp >= 50) return "warning";
    return "safe";
  },

  async processIncomingData(sensorId: string, payload: IncomingSensorPayload) {
    const { userId, gas, temperature, humidity, sensorName, location } = payload;
    
    // 1. Tentukan Status
    const status = this.evaluateStatus(gas, temperature);

    // 2. Data untuk disimpan (Strict typed SensorReading)
    const readingData: SensorReading = { gas, temperature, humidity, status };

    // 3. Eksekusi paralel: Simpan riwayat & Update Live Dashboard
    await Promise.all([
      SensorModel.saveHistory(sensorId, readingData),
      SensorModel.updateLiveStatus(sensorId, { ...readingData, isOnline: true })
    ]);

    // 4. Jika status bahaya/warning, buat Alert (Strict typed AlertPayload)
    if (status !== "safe") {
      const alertData: AlertPayload = {
        sensorId,
        userId,
        sensorName,
        location,
        level: status,
        gasValue: gas,
        temperature,
        message: `${sensorName} terdeteksi dalam kondisi ${status}!`
      };
      await SensorModel.createAlert(alertData);
    }

    return { success: true, status };
  }
};