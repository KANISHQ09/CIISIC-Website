import React from 'react';

/** The spinning ring used by every loader on the site. */
export const Spinner: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <span
    className={`inline-block shrink-0 rounded-full border-2 border-stone-300 border-t-[#063028] animate-spin ${className}`}
    aria-hidden="true"
  />
);

/** Inside a list, tab or card while its data loads (in place of an empty state). */
export const InlineLoader: React.FC<{ label?: string; className?: string }> = ({
  label = 'Loading…',
  className = '',
}) => (
  <div
    className={`flex items-center justify-center gap-3 p-12 text-sm font-semibold text-stone-500 ${className}`}
    role="status"
    aria-live="polite"
  >
    <Spinner />
    {label}
  </div>
);

/** In place of a whole page while it (or the data it needs) loads. */
export const PageLoader: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <InlineLoader label={label} className="min-h-[60vh]" />
);

/** Covers the whole screen, for actions that change everything (like signing out). */
export const FullScreenLoader: React.FC<{ label: string }> = ({ label }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#faf7f0]/85 backdrop-blur-sm"
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-6 py-4 shadow-lg text-sm font-semibold text-stone-600">
      <Spinner />
      {label}
    </div>
  </div>
);
