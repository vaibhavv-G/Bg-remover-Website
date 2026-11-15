import { Loader2, XCircle } from 'lucide-react';

interface ProcessingIndicatorProps {
  previewUrl: string;
  fileName: string;
  batchProgress?: { current: number; total: number } | null;
  onCancel: () => void;
}

export function ProcessingIndicator({
  previewUrl,
  fileName,
  batchProgress,
  onCancel,
}: ProcessingIndicatorProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
        <div className="relative flex h-[320px] items-center justify-center sm:h-[420px]">
          <img
            src={previewUrl}
            alt={`Processing ${fileName}`}
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain opacity-55"
          />

          {/* Animated AI Scan Beam */}
          <div
            aria-hidden="true"
            className="animate-scan-beam pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-transparent via-violet-500/35 to-blue-500/50 border-b-2 border-blue-400"
          />

          {/* Centered Processing Card */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
            <div className="flex w-full max-w-sm flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-5 text-center shadow-lg">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-700">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              </div>

              <h3 className="font-display text-base font-semibold text-slate-900">
                {batchProgress
                  ? `Removing background (${batchProgress.current} of ${batchProgress.total})`
                  : 'Removing background...'}
              </h3>
              <p className="mt-1 max-w-full truncate text-xs text-slate-500">
                {fileName}
              </p>

              <button
                type="button"
                onClick={onCancel}
                className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-violet-700"
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
