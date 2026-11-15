import { Download, ImagePlus, RotateCcw } from 'lucide-react';
import { buildOutputFilename } from '../utils/imageValidation';

interface DownloadButtonProps {
  resultBlob: Blob | null;
  fileName: string;
  onTryAnother: () => void;
  onReset: () => void;
  isBusy: boolean;
}

export function DownloadButton({
  resultBlob,
  fileName,
  onTryAnother,
  onReset,
  isBusy,
}: DownloadButtonProps) {
  const handleDownload = () => {
    if (!resultBlob) return;
    const downloadUrl = URL.createObjectURL(resultBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = buildOutputFilename(fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={!resultBlob || isBusy}
        onClick={handleDownload}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download Transparent PNG
      </button>

      <button
        type="button"
        disabled={isBusy}
        onClick={onTryAnother}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ImagePlus className="h-4 w-4" aria-hidden="true" />
        Try Another Image
      </button>

      <button
        type="button"
        disabled={isBusy}
        onClick={onReset}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset
      </button>
    </div>
  );
}
