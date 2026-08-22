"use client";

type DecisionStampProps = {
  decision: "accept" | "review" | "reject";
};

const STAMP_CONFIG = {
  accept: {
    label: "ACCEPTED",
    colorClass: "border-stamp-accept text-stamp-accept",
  },
  review: {
    label: "NEEDS REVIEW",
    colorClass: "border-stamp-review text-stamp-review",
  },
  reject: {
    label: "REJECTED",
    colorClass: "border-stamp-reject text-stamp-reject",
  },
} as const;

export default function DecisionStamp({ decision }: DecisionStampProps) {
  const { label, colorClass } = STAMP_CONFIG[decision];

  return (
    <div
      className={`inline-block rotate-[-6deg] border-2 px-8 py-4 motion-safe:animate-stamp-in ${colorClass}`}
      role="status"
      aria-label={`Decision: ${label}`}
    >
      <span className="font-display text-2xl font-semibold tracking-[0.2em] sm:text-3xl">
        {label}
      </span>
    </div>
  );
}
