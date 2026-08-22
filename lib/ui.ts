/** Shared interactive surface classes for consistent hover/focus polish */

export const btnPrimary =
  "cursor-pointer border-2 border-ink px-6 py-2.5 font-sans text-sm font-medium text-ink transition-all hover:bg-ink hover:text-paper hover:shadow-sm active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink disabled:hover:shadow-none disabled:active:scale-100";

export const btnStamp =
  "cursor-pointer border-2 border-ink px-6 py-2.5 font-display text-sm tracking-widest text-ink transition-all hover:bg-ink hover:text-paper hover:shadow-sm active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review";

export const dropzoneBase =
  "flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-4 py-8 text-center transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-review sm:px-6 sm:py-12";

export const dropzoneIdle =
  "border-ledger-line bg-surface/40 hover:border-ink/35 hover:bg-surface/60 hover:shadow-sm";

export const dropzoneActive = "border-stamp-review bg-surface/70 shadow-sm";
