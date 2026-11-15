import { Check } from 'lucide-react';
import type { ProcessingMode } from '../types/backgroundRemoval';

interface PricingCardProps {
  onSelectPlan: (mode: ProcessingMode) => void;
}

const PLANS: Array<{
  name: string;
  mode: ProcessingMode;
  audience: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  ctaLabel: string;
  highlighted: boolean;
}> = [
  {
    name: 'FREE',
    mode: 'single',
    audience: 'For quick everyday cutouts',
    price: '₹0',
    cadence: 'No account required',
    description:
      'Remove backgrounds directly in your browser with instant transparent PNG downloads.',
    features: [
      'Limited background removal credits',
      'Standard PNG download (32-bit RGBA)',
      'Basic processing speed',
      'Interactive before & after comparison slider',
    ],
    ctaLabel: 'Start Removing Free',
    highlighted: false,
  },
  {
    name: 'PRO',
    mode: 'batch',
    audience: 'For creators & high-volume workflows',
    price: '₹99',
    cadence: '/month',
    description:
      'Built for product catalogs, design studios, and teams that need multi-image throughput.',
    features: [
      'Higher processing limits',
      'Batch background removal (up to 5 images)',
      'Priority processing queue',
      'No advertisements',
    ],
    ctaLabel: 'Try Batch Workspace',
    highlighted: true,
  },
];

export function PricingCard({ onSelectPlan }: PricingCardProps) {
  return (
    <section id="pricing" className="border-t border-slate-200/80 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-violet-700">Pricing</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl [text-wrap:balance]">
            Simple, transparent plans
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Start removing backgrounds right away at no cost, or scale up with higher limits
            and batch exports.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col justify-between rounded-2xl p-6 sm:p-8 ${
                plan.highlighted
                  ? 'border-2 border-violet-700 bg-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{plan.audience}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-display text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
                      {plan.price}
                    </span>
                    <span className="ml-1 text-sm text-slate-500">{plan.cadence}</span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {plan.description}
                </p>

                <ul className="mt-6 space-y-3 border-t border-slate-200/80 pt-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-slate-700"
                    >
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.highlighted ? 'text-violet-700' : 'text-blue-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => onSelectPlan(plan.mode)}
                  className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    plan.highlighted
                      ? 'bg-violet-700 text-white hover:bg-violet-800 focus-visible:outline-violet-700'
                      : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-slate-900'
                  }`}
                >
                  {plan.ctaLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
