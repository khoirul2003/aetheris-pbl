import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, sensorValue } = body;

    // Logika Indikator 3 Level
    let status = "AMAN";
    if (sensorValue > 400 && sensorValue <= 700) status = "WASPADA";
    else if (sensorValue > 700) status = "BAHAYA";

    // Simpan ke Firestore
    const docRef = await addDoc(collection(db, "gas_readings"), {
      restaurantId,
      value: sensorValue,
      status: status,
      timestamp: serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      status: status 
    }, { status: 201 });
    
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses data" }, { status: 500 });
  }
}