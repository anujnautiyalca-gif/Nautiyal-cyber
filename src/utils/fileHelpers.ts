import { DocumentAttachment } from '../types';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDocumentFile(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller file.`,
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
    return {
      valid: false,
      error: 'Invalid file format. Only PDF, JPG, and PNG documents are supported.',
    };
  }

  return { valid: true };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function processDocumentUpload(file: File, documentLabel: string): Promise<DocumentAttachment> {
  const validation = validateDocumentFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const dataUrl = await readFileAsDataUrl(file);
  return {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: documentLabel,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    dataUrl,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

export function triggerFileDownload(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const randomChars = Math.floor(1000 + Math.random() * 9000);
  return `NCC-${year}-${randomChars}`;
}
