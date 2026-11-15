export type ProcessingMode = 'single' | 'batch';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'error';

export type ViewMode = 'compare' | 'result' | 'original';

export type BackdropMode = 'checkerboard' | 'light' | 'dark';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

export interface RemovalJob {
  id: string;
  file: File;
  fileName: string;
  originalUrl: string;
  resultUrl: string | null;
  resultBlob: Blob | null;
  metadata: ImageMetadata;
  status: JobStatus;
  errorMessage: string | null;
  errorCode: string | null;
}
