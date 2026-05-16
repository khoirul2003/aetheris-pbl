import { SensorModel } from '@/models/sensorModel';

export const SensorController = {
  // Logika penentuan status berdasarkan threshold yang Anda minta
  evaluateStatus(gas: number, temp: number) {
    if (gas >= 600 || temp >= 70) return "danger";
    if (gas >= 450 || temp >= 50) return "warning";
    return "safe";
  },

  async processIncomingData(sensorId: string, payload: any) {
    const { userId, gas, temperature, humidity, sensorName, location } = payload;
    
    // 1. Tentukan Status
    const status = this.evaluateStatus(gas, temperature);

    // 2. Data untuk disimpan
    const readingData = { gas, temperature, humidity, status };

    // 3. Eksekusi paralel: Simpan riwayat & Update Live Dashboard
    await Promise.all([
      SensorModel.saveHistory(sensorId, readingData),
      SensorModel.updateLiveStatus(sensorId, { ...readingData, isOnline: true })
    ]);

    // 4. Jika status bahaya/warning, buat Alert
    if (status !== "safe") {
      await SensorModel.createAlert({
        sensorId,
        userId,
        sensorName,
        location,
        level: status,
        gasValue: gas,
        temperature,
        message: `${sensorName} terdeteksi dalam kondisi ${status}!`
      });
    }

    return { success: true, status };
  }
};