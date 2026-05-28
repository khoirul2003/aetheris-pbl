import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;
    // Placeholder: integrate with real email service (SendGrid, SES, etc.)
    console.log(`[send-invite] would send invite to: ${email} (${name})`);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error('send-invite error', err);
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
