import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phoneNumber, location, level, gasValue } = await request.json() as {
      phoneNumber: string;
      location: string;
      level: string;
      gasValue: number;
    };

    if (!phoneNumber || !location || !level) {
      return NextResponse.json({ success: false, error: "Parameter tidak lengkap" }, { status: 400 });
    }

    // Template Pesan Terstruktur Keamanan Dapur
    const messageTemplate = 
      `🚨 *AETHERIS ALERT SYSTEM* 🚨\n\n` +
      `⚠️ *STATUS: ${level.toUpperCase()}*\n` +
      `📍 *Lokasi:* ${location}\n` +
      `🔥 *Kadar Gas:* ${gasValue} PPM\n\n` +
      `*Tindakan Sistem:* Kipas sirkulasi otomatis menyala. Mohon segera periksa selang regulator tabung gas Anda!`;

    // Integrasi HTTP Request ke Gateway API Fonnte
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": "zNFc2Q6yMPmYFp8VmTs2",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        target: phoneNumber,
        message: messageTemplate,
        countryCode: "62"
      })
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: "WhatsApp notification dispatched" });
    } else {
      const errText = await response.text();
      return NextResponse.json({ success: false, error: errText }, { status: 500 });
    }

  } catch (error) {
    console.error("WhatsApp Controller Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}