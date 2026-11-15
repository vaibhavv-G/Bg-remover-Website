import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type LegalModalType = 'contact' | 'privacy' | 'terms' | null;

export function Footer() {
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);

  useEffect(() => {
    if (!activeModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div>
            <a
              href="#home"
              className="inline-flex items-center gap-2.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-700 to-blue-600 text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4.5 w-4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="13" height="13" rx="2.5" />
                  <path d="M8 21h10a3 3 0 0 0 3-3V8" />
                </svg>
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                BGRemover Pro
              </span>
            </a>
            <p className="mt-2 text-sm text-slate-500">
              Remove Backgrounds. Keep What Matters.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600"
          >
            <a href="#home" className="transition-colors hover:text-violet-700">
              Home
            </a>
            <a href="#remover-workspace" className="transition-colors hover:text-violet-700">
              Background Remover
            </a>
            <a href="#pricing" className="transition-colors hover:text-violet-700">
              Pricing
            </a>
            <button
              type="button"
              onClick={() => setActiveModal('contact')}
              className="transition-colors hover:text-violet-700"
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="transition-colors hover:text-violet-700"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="transition-colors hover:text-violet-700"
            >
              Terms of Service
            </button>
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-500">
          © 2026 BGRemover Pro. All rights reserved.
        </div>
      </div>

      {/* Accessible Modal Dialogs */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <h2
                id="footer-modal-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                {activeModal === 'contact' && 'Contact BGRemover Pro'}
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms of Service'}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close dialog"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
              {activeModal === 'contact' && (
                <>
                  <p>
                    Need assistance with BGRemover Pro, API integration, or Pro plan
                    inquiries? Reach our support team directly:
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">Support Email:</span>{' '}
                      support@bgremoverpro.example
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-slate-900">Response Window:</span>{' '}
                      Monday – Friday, 9:00 AM – 6:00 PM IST
                    </p>
                  </div>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p>
                    <strong className="font-semibold text-slate-900">
                      Zero Permanent Image Storage:
                    </strong>{' '}
                    Images uploaded to BGRemover Pro are held solely in volatile server
                    memory while your background removal request is transmitted to the
                    configured AI segmentation provider.
                  </p>
                  <p>
                    Once the transparent PNG is returned to your browser, the image buffer
                    is discarded immediately. We do not write uploaded photos to disk,
                    train models on your uploads, or maintain user image archives.
                  </p>
                  <p>
                    API credentials are stored exclusively on the server and are never
                    exposed in client-side bundles.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p>
                    <strong className="font-semibold text-slate-900">
                      Acceptable Use:
                    </strong>{' '}
                    You retain full ownership and rights to all images you upload and all
                    transparent PNG outputs you download. You agree to upload only images
                    you are authorized to process.
                  </p>
                  <p>
                    <strong className="font-semibold text-slate-900">
                      Service Availability:
                    </strong>{' '}
                    Background removal depends on your configured server-side AI provider
                    and quota. File uploads are limited to JPG, JPEG, PNG, and WebP
                    formats up to 12 MB per file.
                  </p>
                  <p>
                    BGRemover Pro provides outputs as-is without automated guarantees of
                    uninterrupted third-party API uptime.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
