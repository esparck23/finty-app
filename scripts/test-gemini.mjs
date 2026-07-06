import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envContent = readFileSync(resolve('.env.local'), 'utf-8');
const envVars = Object.fromEntries(
  envContent.split('\n').filter(l => l.trim() && !l.startsWith('#')).map(l => {
    const [k, ...v] = l.split('=');
    return [k.trim(), v.join('=').trim()];
  })
);
process.env.GEMINI_API_KEY = envVars.GEMINI_API_KEY;

const imagePath = process.argv[2];
if (!imagePath) {
  console.log('Uso: node scripts/test-gemini.mjs <ruta-imagen>');
  console.log('Ejemplo: node scripts/test-gemini.mjs foto-factura.jpg');
  process.exit(1);
}

const filePath = resolve(imagePath);
const buffer = readFileSync(filePath);
const base64 = buffer.toString('base64');

const ext = filePath.split('.').pop()?.toLowerCase();
const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };
const mimeType = mimeMap[ext] || 'image/jpeg';

console.log(`Imagen: ${filePath}`);
console.log(`Tamano: ${(buffer.length / 1024).toFixed(1)} KB`);
console.log(`MIME: ${mimeType}`);
console.log('Enviando a Gemini 2.5 Flash...\n');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
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
      },
      required: ['confidence', 'raw_text'],
    },
  },
});

const prompt = `Eres un asistente de OCR experto para Finty, una plataforma de asistencia humanitaria en Venezuela.
Analiza la imagen de la factura o comprobante de Pago Móvil y extrae la información.

REGLAS:
- El campo "currency" debe ser "USD" o "Bs" (Bolívares). Si no es claro, usa null.
- El campo "date" debe estar en formato YYYY-MM-DD.
- El campo "category_name" debe corresponder a una categoría lógica de gasto o ingreso humanitario.
- "confidence" es un decimal de 0 a 1 indicando qué tan legible es la imagen.
- Si no puedes extraer un campo, usa null.
- "raw_text" debe contener todo el texto legible de la imagen.`;

try {
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType } },
  ]);

  const text = result.response.text().trim();
  const parsed = JSON.parse(text);

  console.log('=== RESULTADO DEL ESCANEO ===\n');
  console.log(`Monto:       ${parsed.amount != null ? (parsed.currency === 'Bs' ? 'Bs ' : '$') + parsed.amount : 'No detectado'}`);
  console.log(`Moneda:      ${parsed.currency || 'No detectada'}`);
  console.log(`Fecha:       ${parsed.date || 'No detectada'}`);
  console.log(`Proveedor:   ${parsed.vendor || 'No detectado'}`);
  console.log(`Categoria:   ${parsed.category_name || 'No detectada'}`);
  console.log(`Concepto:    ${parsed.concept || 'No detectado'}`);
  console.log(`RIF/CI:      ${parsed.rif_ci || 'No detectado'}`);
  console.log(`Confianza:   ${Math.round(parsed.confidence * 100)}%`);
  console.log(`\n--- Texto crudo ---\n${parsed.raw_text}`);
} catch (error) {
  console.error('Error:', error.message || error);
  process.exit(1);
}
