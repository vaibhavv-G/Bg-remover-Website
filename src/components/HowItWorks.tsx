import { Download, Sparkles, Upload } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    title: 'Upload Your Image',
    description:
      'Drag and drop a JPG, JPEG, PNG, or WebP photo up to 12 MB, or switch to batch mode to queue up to 5 images at once.',
    icon: Upload,
    accentClass: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    number: '02',
    title: 'AI Removes the Background',
    description:
      'Our server-side AI segmentation pipeline detects foreground subjects, fine hair, and product edges cleanly in seconds.',
    icon: Sparkles,
    accentClass: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    number: '03',
    title: 'Download Your Transparent Image',
    description:
      'Inspect the cutout on checkerboard, light, or dark backdrops with up to 400% zoom, then export a genuine 32-bit RGBA PNG.',
    icon: Download,
    accentClass: 'bg-violet-50 text-violet-700 border-violet-100',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-slate-200/80 bg-slate-50/70 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-violet-700">How It Works</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl [text-wrap:balance]">
            Three steps to a studio-clean cutout
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            No manual lasso tools or complex layer masks. Upload your photo and let the AI
            isolate the subject cleanly.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-shadow duration-150 hover:shadow-sm sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${step.accentClass}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-sm font-medium tabular-nums text-slate-400">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-lg font-semibold text-slate-900">
                    {step.number}. {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>

                {/* Minimal Visual Step Diagram */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  {step.number === '01' && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>JPG · PNG · WebP</span>
                      <span className="font-mono tabular-nums">Up to 12 MB</span>
                    </div>
                  )}
                  {step.number === '02' && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>In-memory AI segmentation</span>
                      <span className="font-mono tabular-nums">Zero storage</span>
                    </div>
                  )}
                  {step.number === '03' && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>32-bit RGBA alpha channel</span>
                      <span className="font-mono tabular-nums">100%–400% zoom</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
