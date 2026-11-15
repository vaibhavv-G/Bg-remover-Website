import { useRef, useState, type DragEvent } from 'react';
import { AlertCircle, FolderOpen, Layers, UploadCloud, X } from 'lucide-react';
import type { ProcessingMode } from '../types/backgroundRemoval';
import sampleProductUrl from '../assets/images/sample_product_headphones_1794758783343.jpg';
import samplePortraitUrl from '../assets/images/sample_portrait_studio_1794758783704.jpg';

interface UploadAreaProps {
  mode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
  onFilesSelected: (files: File[]) => void;
  onSampleSelect: (sampleUrl: string, fileName: string) => void;
  errorMessage: string | null;
  onDismissError: () => void;
  isBusy: boolean;
}

const SAMPLE_IMAGES = [
  {
    label: 'Studio Headphones',
    fileName: 'studio-headphones.jpg',
    url: sampleProductUrl,
  },
  {
    label: 'Studio Portrait',
    fileName: 'studio-portrait.jpg',
    url: samplePortraitUrl,
  },
];

export function UploadArea({
  mode,
  onModeChange,
  onFilesSelected,
  onSampleSelect,
  errorMessage,
  onDismissError,
  isBusy,
}: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBusy) setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isBusy) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isBusy) return;

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFiles = Array.from(e.target.files || []);
    if (pickedFiles.length > 0) {
      onFilesSelected(pickedFiles);
    }
    e.target.value = '';
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Workspace Header Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Upload mode"
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          <button
            type="button"
            onClick={() => onModeChange('single')}
            className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              mode === 'single'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Image
          </button>
          <button
            type="button"
            onClick={() => onModeChange('batch')}
            className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              mode === 'batch'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            Batch (up to 5)
          </button>
        </div>

        <p className="text-xs text-slate-500">
          <span>JPG, PNG, WebP</span>
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          <span className="font-mono tabular-nums">Max 12 MB</span>
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss error"
            className="shrink-0 rounded-md p-1 text-red-600 transition-colors hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Drag & Drop Target */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 sm:py-16 ${
          isDragging
            ? 'border-blue-600 bg-violet-50/60'
            : 'border-slate-300 bg-slate-50/60 hover:border-violet-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple={mode === 'batch'}
          onChange={handleInputChange}
          className="sr-only"
          aria-label={mode === 'batch' ? 'Select up to 5 images' : 'Select an image'}
        />

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-700 to-blue-600 text-white shadow-sm">
          <UploadCloud className="h-7 w-7" aria-hidden="true" />
        </div>

        <h2 className="font-display text-lg font-semibold text-slate-900 sm:text-xl">
          {mode === 'batch'
            ? 'Drop up to 5 images here to remove backgrounds'
            : 'Drag and drop your image here'}
        </h2>
        <p className="mt-1.5 max-w-md text-sm text-slate-600">
          {mode === 'batch'
            ? 'Queue up to 5 JPG, PNG, or WebP files at once and export transparent PNGs.'
            : 'Supports JPG, JPEG, PNG, and WebP up to 12 MB, or paste directly with Ctrl+V.'}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-violet-700 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FolderOpen className="h-4 w-4" aria-hidden="true" />
            Browse Files
          </button>
        </div>
      </div>

      {/* Quick Studio Sample Tryouts */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs font-medium text-slate-500">
          No image handy? Test with a studio sample:
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.fileName}
              type="button"
              disabled={isBusy}
              onClick={() => onSampleSelect(sample.url, sample.fileName)}
              className="group inline-flex min-h-[40px] items-center gap-2.5 rounded-lg border border-slate-200 bg-white pr-3 pl-1.5 py-1 text-xs font-medium text-slate-700 transition-colors duration-150 hover:border-violet-300 hover:bg-violet-50/40 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <img
                src={sample.url}
                alt={sample.label}
                referrerPolicy="no-referrer"
                className="h-7 w-9 rounded object-cover"
              />
              <span className="whitespace-nowrap">{sample.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
