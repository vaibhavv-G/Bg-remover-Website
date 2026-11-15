import type { ImageMetadata } from '../types/backgroundRemoval';

export const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB
export const MAX_BATCH_FILES = 5;

export const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export const ACCEPTED_EXTENSIONS_LABEL = 'JPG, JPEG, PNG, or WebP';

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function formatImageFormat(mimeType: string, fileName: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'JPEG';
  if (normalized === 'image/png') return 'PNG';
  if (normalized === 'image/webp') return 'WebP';
  const ext = fileName.split('.').pop()?.toUpperCase();
  return ext || 'IMAGE';
}

export function validateImageFile(file: File): string | null {
  const mime = file.type.toLowerCase();
  const hasAcceptedExtension = /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!ACCEPTED_MIME_TYPES.has(mime) && !(mime === '' && hasAcceptedExtension)) {
    return `"${file.name}" is not a supported format. Please upload ${ACCEPTED_EXTENSIONS_LABEL} files.`;
  }

  if (file.size === 0) {
    return `"${file.name}" is empty and cannot be processed.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" (${formatFileSize(file.size)}) exceeds the 12 MB size limit.`;
  }

  return null;
}

export function readImageMetadata(file: File): Promise<{ url: string; metadata: ImageMetadata }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        url: objectUrl,
        metadata: {
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: formatImageFormat(file.type, file.name),
          sizeBytes: file.size,
        },
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Unable to read image dimensions for "${file.name}".`));
    };

    img.src = objectUrl;
  });
}

export function buildOutputFilename(originalName: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '').trim() || 'image';
  return `${baseName}-transparent.png`;
}
