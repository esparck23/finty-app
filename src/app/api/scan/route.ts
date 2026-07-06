import { NextResponse, type NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { scanReceipt } from '@/lib/gemini/client';
import { validateImageFile } from '@/lib/gemini/validation';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString('base64');

    const scanResult = await scanReceipt(base64Data, file.type);

    return NextResponse.json({ data: scanResult });
  } catch (error: any) {
    const message = error?.message || 'Error desconocido';
    if (message.includes('429') || message.includes('quota')) {
      return NextResponse.json(
        { error: 'Límite de uso de IA alcanzado. Intenta de nuevo en unos minutos.' },
        { status: 429 },
      );
    }
    if (message.includes('timeout') || message.includes('aborted')) {
      return NextResponse.json(
        { error: 'El análisis tardó demasiado. Intenta con una imagen más clara.' },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { error: 'Error al procesar la imagen con IA.' },
      { status: 500 },
    );
  }
}
