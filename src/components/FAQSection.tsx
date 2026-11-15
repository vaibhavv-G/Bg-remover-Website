import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'How does AI background removal work?',
    answer:
      'BGRemover Pro sends your uploaded image securely to our backend AI background removal endpoint. The model analyzes foreground subjects, edges, and fine details like hair or product contours, separates them from the backdrop, and returns a clean alpha-masked image.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'You can upload JPG, JPEG, PNG, and WebP files up to 12 MB per image. Both single-image mode and batch mode (up to 5 images at once) enforce format and file size validation.',
  },
  {
    question: 'Is BGRemover Pro free?',
    answer:
      'Yes. You can use the Free tier immediately with standard PNG downloads and basic processing—no account signup required. The Pro plan (₹99/month) is designed for higher processing limits, batch background removal up to 5 images, priority processing, and an ad-free experience.',
  },
  {
    question: 'Can I download transparent PNG files?',
    answer:
      'Yes. Every processed result is exported as a genuine 32-bit RGBA PNG with a true alpha transparency channel, ready for e-commerce listings, presentations, UI mockups, or graphic design software.',
  },
  {
    question: 'Are uploaded images stored?',
    answer:
      'No. Uploaded images are processed strictly in server memory during the active request and are never saved permanently to disk or a database.',
  },
  {
    question: 'What happens if background removal fails?',
    answer:
      'If an image is unsupported, exceeds 12 MB, hits a provider rate limit, or if the API service credentials are not configured, BGRemover Pro displays a clear error alert explaining why and lets you retry or choose another image without losing your queue.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      className="border-t border-slate-200/80 bg-slate-50/70 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-left sm:text-center">
          <p className="text-sm font-semibold text-violet-700">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl [text-wrap:balance]">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Everything you need to know about formats, privacy, and transparent PNG exports.
          </p>
        </div>

        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <div key={item.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleIndex(index)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-violet-700 sm:px-6"
                  >
                    <span className="font-display text-base font-semibold text-slate-900">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-violet-700' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
