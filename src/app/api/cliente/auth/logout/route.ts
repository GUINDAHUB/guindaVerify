import { NextResponse } from 'next/server';
import { clearClientSession } from '@/lib/auth';

export async function POST() {
  try {
    await clearClientSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en logout cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
