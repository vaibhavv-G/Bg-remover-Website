import { useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type {
  BackdropMode,
  ProcessingMode,
  RemovalJob,
  ViewMode,
} from '../types/backgroundRemoval';
import {
  MAX_BATCH_FILES,
  buildOutputFilename,
  formatFileSize,
} from '../utils/imageValidation';
import { ComparisonSlider } from './ComparisonSlider';
import { DownloadButton } from './DownloadButton';
import { ProcessingIndicator } from './ProcessingIndicator';

interface ImagePreviewProps {
  mode: ProcessingMode;
  jobs: RemovalJob[];
  activeJobId: string | null;
  viewMode: ViewMode;
  backdropMode: BackdropMode;
  onSelectJob: (id: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onBackdropModeChange: (backdrop: BackdropMode) => void;
  onRetryJob: (id: string) => void;
  onRemoveJob: (id: string) => void;
  onAddMoreFiles: (files: File[]) => void;
  onCancelProcessing: () => void;
  onReset: () => void;
}

export function ImagePreview({
  mode,
  jobs,
  activeJobId,
  viewMode,
  backdropMode,
  onSelectJob,
  onViewModeChange,
  onBackdropModeChange,
  onRetryJob,
  onRemoveJob,
  onAddMoreFiles,
  onCancelProcessing,
  onReset,
}: ImagePreviewProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const [isZipping, setIsZipping] = useState(false);

  const activeJob = jobs.find((job) => job.id === activeJobId) || jobs[0] || null;
  if (!activeJob) return null;

  const isAnyProcessing = jobs.some((job) => job.status === 'processing');
  const completedJobs = jobs.filter(
    (job) => job.status === 'completed' && job.resultBlob !== null,
  );
  const processingIndex = jobs.findIndex((job) => job.status === 'processing');
  const batchProgress =
    mode === 'batch' && jobs.length > 1 && processingIndex >= 0
      ? { current: processingIndex + 1, total: jobs.length }
      : null;

  const handleDownloadSingleBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildOutputFilename(fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleBulkZipDownload = async () => {
    if (completedJobs.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const usedNames = new Map<string, number>();

      for (const job of completedJobs) {
        if (!job.resultBlob) continue;
        let outName = buildOutputFilename(job.fileName);
        const count = usedNames.get(outName) || 0;
        usedNames.set(outName, count + 1);
        if (count > 0) {
          outName = outName.replace(/\.png$/, `-${count + 1}.png`);
        }
        zip.file(outName, job.resultBlob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = 'bgremover-pro-transparent-pngs.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
    } finally {
      setIsZipping(false);
    }
  };

  const handleTryAnother = () => {
    replaceInputRef.current?.click();
  };

  const handleReplaceFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onReset();
      onAddMoreFiles(files);
    }
    e.target.value = '';
  };

  const handleAppendFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAddMoreFiles(files);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple={mode === 'batch'}
        onChange={handleReplaceFiles}
        className="sr-only"
        aria-label="Choose new image files"
      />
      <input
        ref={addMoreInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleAppendFiles}
        className="sr-only"
        aria-label="Add more images to batch"
      />

      {/* Active Job Stage */}
      {activeJob.status === 'processing' ? (
        <ProcessingIndicator
          previewUrl={activeJob.originalUrl}
          fileName={activeJob.fileName}
          batchProgress={batchProgress}
          onCancel={onCancelProcessing}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {/* Error Banner if active job failed */}
          {activeJob.status === 'error' && activeJob.errorMessage && (
            <div
              role="alert"
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                <span>{activeJob.errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => onRetryJob(activeJob.id)}
                disabled={isAnyProcessing}
                className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Retry
              </button>
            </div>
          )}

          {/* Comparison / Result / Original Stage */}
          <ComparisonSlider
            originalUrl={activeJob.originalUrl}
            resultUrl={activeJob.resultUrl}
            fileName={activeJob.fileName}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            backdropMode={backdropMode}
            onBackdropModeChange={onBackdropModeChange}
          />

          {/* Metadata Bar & Primary Export Actions */}
          <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {activeJob.fileName}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span>{activeJob.metadata.format}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {activeJob.metadata.width} × {activeJob.metadata.height} px
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {formatFileSize(activeJob.metadata.sizeBytes)}
                </span>
                {activeJob.resultBlob && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-emerald-700">
                      RGBA PNG Ready ({formatFileSize(activeJob.resultBlob.size)})
                    </span>
                  </>
                )}
              </p>
            </div>

            <DownloadButton
              resultBlob={activeJob.resultBlob}
              fileName={activeJob.fileName}
              onTryAnother={handleTryAnother}
              onReset={onReset}
              isBusy={isAnyProcessing}
            />
          </div>
        </div>
      )}

      {/* Batch Queue Panel (Visible in Batch Mode or when >1 image) */}
      {(mode === 'batch' || jobs.length > 1) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Batch Queue ({jobs.length}/{MAX_BATCH_FILES} images)
              </h3>
              <p className="text-xs text-slate-500">
                Select any item to inspect its transparent cutout or download individually.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {jobs.length < MAX_BATCH_FILES && (
                <button
                  type="button"
                  disabled={isAnyProcessing}
                  onClick={() => addMoreInputRef.current?.click()}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add Images
                </button>
              )}

              {completedJobs.length > 1 && (
                <button
                  type="button"
                  disabled={isZipping}
                  onClick={handleBulkZipDownload}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-violet-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-800 disabled:opacity-60"
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  {isZipping
                    ? 'Creating ZIP...'
                    : `Download All (${completedJobs.length} PNGs)`}
                </button>
              )}
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const isSelected = job.id === activeJob.id;
              return (
                <li
                  key={job.id}
                  className={`flex flex-wrap items-center justify-between gap-3 py-2.5 px-2 rounded-lg transition-colors ${
                    isSelected ? 'bg-violet-50/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectJob(job.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <img
                      src={job.resultUrl || job.originalUrl}
                      alt={job.fileName}
                      referrerPolicy="no-referrer"
                      className="checkerboard-bg h-11 w-14 shrink-0 rounded-md border border-slate-200 object-contain"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {job.fileName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">
                        {job.metadata.width} × {job.metadata.height} ·{' '}
                        {formatFileSize(job.metadata.sizeBytes)}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Status Indicator (always icon + explicit text label) */}
                    {job.status === 'queued' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        Queued
                      </span>
                    )}
                    {job.status === 'processing' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        Processing
                      </span>
                    )}
                    {job.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Ready
                      </span>
                    )}
                    {job.status === 'error' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Failed
                      </span>
                    )}

                    {/* Per-item Action */}
                    {job.status === 'completed' && job.resultBlob && (
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleBlob(job.resultBlob!, job.fileName)}
                        aria-label={`Download ${job.fileName} transparent PNG`}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        PNG
                      </button>
                    )}

                    {job.status === 'error' && (
                      <button
                        type="button"
                        disabled={isAnyProcessing}
                        onClick={() => onRetryJob(job.id)}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Retry
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={job.status === 'processing'}
                      onClick={() => onRemoveJob(job.id)}
                      aria-label={`Remove ${job.fileName}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
