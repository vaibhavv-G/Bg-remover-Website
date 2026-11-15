import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HowItWorks } from './components/HowItWorks';
import { ImagePreview } from './components/ImagePreview';
import { PricingCard } from './components/PricingCard';
import { UploadArea } from './components/UploadArea';
import {
  BackgroundRemovalApiError,
  removeBackground,
} from './services/backgroundRemovalApi';
import type {
  BackdropMode,
  ProcessingMode,
  RemovalJob,
  ViewMode,
} from './types/backgroundRemoval';
import {
  MAX_BATCH_FILES,
  readImageMetadata,
  validateImageFile,
} from './utils/imageValidation';

function createJobId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function revokeJobUrls(job: RemovalJob) {
  URL.revokeObjectURL(job.originalUrl);
  if (job.resultUrl) {
    URL.revokeObjectURL(job.resultUrl);
  }
}

export default function App() {
  const [mode, setMode] = useState<ProcessingMode>('single');
  const [jobs, setJobs] = useState<RemovalJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('compare');
  const [backdropMode, setBackdropMode] = useState<BackdropMode>('checkerboard');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const jobsRef = useRef<RemovalJob[]>(jobs);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isQueueRunningRef = useRef(false);

  jobsRef.current = jobs;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      jobsRef.current.forEach(revokeJobUrls);
    };
  }, []);

  const processQueue = useCallback(async () => {
    if (isQueueRunningRef.current) return;
    isQueueRunningRef.current = true;

    try {
      while (true) {
        const nextJob = jobsRef.current.find((job) => job.status === 'queued');
        if (!nextJob) break;

        const updateJobInState = (updater: (item: RemovalJob) => RemovalJob) => {
          const next = jobsRef.current.map((item) =>
            item.id === nextJob.id ? updater(item) : item,
          );
          jobsRef.current = next;
          setJobs(next);
        };

        updateJobInState((item) => ({
          ...item,
          status: 'processing',
          errorMessage: null,
          errorCode: null,
        }));
        setActiveJobId(nextJob.id);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const resultBlob = await removeBackground(nextJob.file, controller.signal);
          const resultUrl = URL.createObjectURL(resultBlob);

          updateJobInState((item) => {
            if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
            return {
              ...item,
              status: 'completed',
              resultBlob,
              resultUrl,
              errorMessage: null,
              errorCode: null,
            };
          });
          setViewMode('compare');
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            updateJobInState((item) => ({
              ...item,
              status: 'error',
              errorMessage: 'Background removal was cancelled.',
              errorCode: 'CANCELLED',
            }));
            break;
          }

          const message =
            err instanceof BackgroundRemovalApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Background removal failed. Please try again.';
          const code = err instanceof BackgroundRemovalApiError ? err.code : 'UNKNOWN_ERROR';

          updateJobInState((item) => ({
            ...item,
            status: 'error',
            errorMessage: message,
            errorCode: code,
          }));
        } finally {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        }
      }
    } finally {
      isQueueRunningRef.current = false;
    }
  }, []);

  const handleFilesSelected = useCallback(
    async (incomingFiles: File[]) => {
      if (incomingFiles.length === 0) return;
      setUploadError(null);

      let effectiveMode = mode;
      if (incomingFiles.length > 1 && mode === 'single') {
        effectiveMode = 'batch';
        setMode('batch');
      }

      const existingCount = effectiveMode === 'batch' ? jobsRef.current.length : 0;
      const availableSlots =
        effectiveMode === 'batch' ? Math.max(0, MAX_BATCH_FILES - existingCount) : 1;

      if (effectiveMode === 'batch' && availableSlots === 0) {
        setUploadError(
          `Batch limit reached (${MAX_BATCH_FILES} images maximum). Remove an item or reset to add more.`,
        );
        return;
      }

      const filesToValidate = incomingFiles.slice(0, availableSlots);
      const skippedOverflow = incomingFiles.length > availableSlots;

      const validFiles: File[] = [];
      const validationErrors: string[] = [];

      for (const file of filesToValidate) {
        const validationError = validateImageFile(file);
        if (validationError) {
          validationErrors.push(validationError);
        } else {
          validFiles.push(file);
        }
      }

      if (skippedOverflow) {
        validationErrors.push(
          `Only ${availableSlots} ${availableSlots === 1 ? 'image' : 'images'} added (batch limit is ${MAX_BATCH_FILES} images).`,
        );
      }

      if (validationErrors.length > 0) {
        setUploadError(validationErrors.join(' '));
      }

      if (validFiles.length === 0) return;

      const newJobs: RemovalJob[] = [];
      for (const file of validFiles) {
        try {
          const { url, metadata } = await readImageMetadata(file);
          newJobs.push({
            id: createJobId(),
            file,
            fileName: file.name,
            originalUrl: url,
            resultUrl: null,
            resultBlob: null,
            metadata,
            status: 'queued',
            errorMessage: null,
            errorCode: null,
          });
        } catch (err) {
          setUploadError(
            err instanceof Error ? err.message : `Unable to load "${file.name}".`,
          );
        }
      }

      if (newJobs.length === 0) return;

      if (effectiveMode === 'single') {
        abortControllerRef.current?.abort();
        jobsRef.current.forEach(revokeJobUrls);
        jobsRef.current = newJobs;
        setJobs(newJobs);
        setActiveJobId(newJobs[0].id);
      } else {
        const wasEmpty = jobsRef.current.length === 0;
        const combined = [...jobsRef.current, ...newJobs];
        jobsRef.current = combined;
        setJobs(combined);
        if (wasEmpty) {
          setActiveJobId(newJobs[0].id);
        }
      }

      void processQueue();
    },
    [mode, processQueue],
  );

  // Support pasting images from clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const pastedFiles = items
        .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);

      if (pastedFiles.length > 0) {
        e.preventDefault();
        void handleFilesSelected(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFilesSelected]);

  const handleSampleSelect = async (sampleUrl: string, fileName: string) => {
    setUploadError(null);
    try {
      const response = await fetch(sampleUrl);
      if (!response.ok) {
        throw new Error('Could not load the sample image.');
      }
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      await handleFilesSelected([file]);
    } catch {
      setUploadError('Unable to load the sample image. Please upload a file from your device.');
    }
  };

  const handleModeChange = (nextMode: ProcessingMode) => {
    setMode(nextMode);
    setUploadError(null);
  };

  const handleRetryJob = (jobId: string) => {
    const updated = jobsRef.current.map((job) =>
      job.id === jobId
        ? { ...job, status: 'queued' as const, errorMessage: null, errorCode: null }
        : job,
    );
    jobsRef.current = updated;
    setJobs(updated);
    setActiveJobId(jobId);
    void processQueue();
  };

  const handleRemoveJob = (jobId: string) => {
    const target = jobsRef.current.find((j) => j.id === jobId);
    if (target) revokeJobUrls(target);

    const remaining = jobsRef.current.filter((j) => j.id !== jobId);
    jobsRef.current = remaining;
    setJobs(remaining);
    if (activeJobId === jobId) {
      setActiveJobId(remaining[0]?.id || null);
    }
  };

  const handleCancelProcessing = () => {
    abortControllerRef.current?.abort();
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    jobsRef.current.forEach(revokeJobUrls);
    jobsRef.current = [];
    setJobs([]);
    setActiveJobId(null);
    setUploadError(null);
    setViewMode('compare');
  };

  const scrollToWorkspace = (openPickerIfEmpty = false) => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (openPickerIfEmpty && jobsRef.current.length === 0) {
      quickInputRef.current?.click();
    }
  };

  const isBusy = jobs.some((job) => job.status === 'processing');

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header onGetStarted={() => scrollToWorkspace(true)} />

      <main>
        {/* Hero Section with Integrated Interactive Upload Workspace */}
        <section id="home" className="relative overflow-hidden bg-white pt-10 pb-16 sm:pt-14 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold text-violet-700">
                Remove Backgrounds. Keep What Matters.
              </p>

              <h1 className="mt-3 font-display text-[clamp(2.25rem,4.2vw,3.75rem)] font-extrabold leading-[1.08] tracking-tight text-slate-900 [text-wrap:balance]">
                Remove Image Backgrounds in Seconds.
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Create transparent backgrounds instantly with AI. Upload your image and
                download a clean, professional result.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => scrollToWorkspace(true)}
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-violet-700 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
                >
                  Remove Background
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700"
                >
                  See How It Works
                  <ArrowDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Hidden quick input for Hero/Header CTA */}
            <input
              ref={quickInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple={mode === 'batch'}
              onChange={(e) => {
                const picked = Array.from(e.target.files || []);
                if (picked.length > 0) void handleFilesSelected(picked);
                e.target.value = '';
              }}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />

            {/* Large Interactive Upload / Result Workspace */}
            <div
              id="remover-workspace"
              ref={workspaceRef}
              className="mx-auto mt-10 max-w-4xl"
            >
              {jobs.length === 0 ? (
                <UploadArea
                  mode={mode}
                  onModeChange={handleModeChange}
                  onFilesSelected={(files) => void handleFilesSelected(files)}
                  onSampleSelect={(url, name) => void handleSampleSelect(url, name)}
                  errorMessage={uploadError}
                  onDismissError={() => setUploadError(null)}
                  isBusy={isBusy}
                />
              ) : (
                <div className="space-y-4">
                  {uploadError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                      {uploadError}
                    </div>
                  )}
                  <ImagePreview
                    mode={mode}
                    jobs={jobs}
                    activeJobId={activeJobId}
                    viewMode={viewMode}
                    backdropMode={backdropMode}
                    onSelectJob={setActiveJobId}
                    onViewModeChange={setViewMode}
                    onBackdropModeChange={setBackdropMode}
                    onRetryJob={handleRetryJob}
                    onRemoveJob={handleRemoveJob}
                    onAddMoreFiles={(files) => void handleFilesSelected(files)}
                    onCancelProcessing={handleCancelProcessing}
                    onReset={handleReset}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <HowItWorks />
        <PricingCard
          onSelectPlan={(selectedMode) => {
            setMode(selectedMode);
            scrollToWorkspace(false);
          }}
        />
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
