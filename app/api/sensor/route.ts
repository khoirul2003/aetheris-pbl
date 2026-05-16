import { NextResponse } from 'next/server';
import { SensorController } from '@/controllers/sensorController';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sensorId, ...payload } = body;

    if (!sensorId) {
      return NextResponse.json({ error: "sensorId wajib diisi" }, { status: 400 });
    }

    const result = await SensorController.processIncomingData(sensorId, payload);

    return NextResponse.json(result, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Gagal memproses data" }, { status: 500 });
  }
}