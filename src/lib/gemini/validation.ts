const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): FileValidationResult {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'Archivo no proporcionado' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no válido: ${file.type}. Formatos aceptados: JPEG, PNG, WebP, HEIC.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${maxMB}MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'El archivo está vacío.' };
  }

  return { valid: true };
}
