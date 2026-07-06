import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import type { ScanResult } from '@/types/gemini';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EXTRACTION_PROMPT = `Eres un asistente de OCR experto para Finty, una plataforma de asistencia humanitaria en Venezuela.
Analiza la imagen de la factura o comprobante de Pago Móvil y extrae la información.

REGLAS:
- El campo "currency" debe ser "USD" o "Bs" (Bolívares). Si no es claro, usa null.
- El campo "date" debe estar en formato YYYY-MM-DD.
- El campo "category_name" debe corresponder a una categoría lógica de gasto o ingreso humanitario (ej: Alimentos, Medicamentos, Transporte, Donación).
- "confidence" es un decimal de 0 a 1 indicando qué tan legible es la imagen.
- Si no puedes extraer un campo, usa null.
- "raw_text" debe contener todo el texto legible de la imagen.

CLASIFICACIÓN DEL COMPROBANTE:
- "receipt_type": determina si es "invoice" (factura/recibo de comercio) o "transfer" (comprobante de transferencia/Pago Móvil).
- Para facturas: extrae "provider_name" (nombre del comercio), "tax_id" (RIF del proveedor, formato J-12345678-9), "document_type" (siempre "rif").
- IMPORTANTE: Ignora completamente cualquier CI (cédula de identidad) del cliente. Solo extrae el RIF del proveedor.
- Para transferencias: extrae "transfer_provider" (banco o plataforma: Banesco, Mercantil, Pago Móvil, etc.), "transfer_operation" (número de operación, referencia o recibo).`;

const SCAN_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    amount: { type: SchemaType.NUMBER, nullable: true },
    currency: { type: SchemaType.STRING, format: 'enum', enum: ['USD', 'Bs'], nullable: true },
    date: { type: SchemaType.STRING, nullable: true },
    rif_ci: { type: SchemaType.STRING, nullable: true },
    category_name: { type: SchemaType.STRING, nullable: true },
    concept: { type: SchemaType.STRING, nullable: true },
    vendor: { type: SchemaType.STRING, nullable: true },
    confidence: { type: SchemaType.NUMBER },
    raw_text: { type: SchemaType.STRING },
    receipt_type: { type: SchemaType.STRING, format: 'enum', enum: ['invoice', 'transfer'], nullable: true },
    provider_name: { type: SchemaType.STRING, nullable: true },
    tax_id: { type: SchemaType.STRING, nullable: true },
    document_type: { type: SchemaType.STRING, format: 'enum', enum: ['rif', 'ci'], nullable: true },
    transfer_provider: { type: SchemaType.STRING, nullable: true },
    transfer_operation: { type: SchemaType.STRING, nullable: true },
  },
  required: ['confidence', 'raw_text'],
};

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as any);
}

export async function scanReceipt(
  base64Data: string,
  mimeType: string,
): Promise<ScanResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: SCAN_RESPONSE_SCHEMA,
    },
  });

  const result = await model.generateContent([
    EXTRACTION_PROMPT,
    {
      inlineData: { data: base64Data, mimeType },
    },
  ]);

  const responseText = result.response.text().trim();

  try {
    const parsed = JSON.parse(responseText);
    return {
      amount: parsed.amount ?? null,
      currency: parsed.currency ?? null,
      date: parsed.date ?? null,
      rif_ci: parsed.rif_ci ?? null,
      category_name: parsed.category_name ?? null,
      concept: parsed.concept ?? null,
      vendor: parsed.vendor ?? null,
      confidence: parsed.confidence ?? 0,
      raw_text: parsed.raw_text ?? '',
      // Campos adicionales para diferenciar Factura vs Transferencia
      operation: parsed.operation ?? null,
      reference: parsed.reference ?? null,
      number: parsed.number ?? null,
      payer: parsed.payer ?? null,
      receiver: parsed.receiver ?? null,
      beneficiary: parsed.beneficiary ?? null,
      destination: parsed.destination ?? null,
      origin: parsed.origin ?? null,
      provider: parsed.provider ?? null,
      // Campos adicionales para el plan de viabilidad
      provider_name: parsed.provider_name ?? null,
      document_type: parsed.document_type ?? null,
      transfer_provider: parsed.transfer_provider ?? null,
      transfer_operation: parsed.transfer_operation ?? null,
      receipt_type: parsed.receipt_type ?? null,
    };
  } catch {
    return {
      amount: null,
      currency: null,
      date: null,
      rif_ci: null,
      category_name: null,
      concept: null,
      vendor: null,
      confidence: 0,
      raw_text: responseText,
      // Campos adicionales con valores por defecto
      operation: null,
      reference: null,
      number: null,
      payer: null,
      receiver: null,
      beneficiary: null,
      destination: null,
      origin: null,
      provider: null,
      provider_name: null,
      document_type: null,
      transfer_provider: null,
      transfer_operation: null,
      receipt_type: null,
    };
  }
}
