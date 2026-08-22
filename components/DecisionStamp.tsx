"use client";

import { useLanguage } from "@/components/LanguageProvider";

type DecisionStampProps = {
  decision: "accept" | "review" | "reject";
};

const COLOR = {
  accept: "border-stamp-accept text-stamp-accept",
  review: "border-stamp-review text-stamp-review",
  reject: "border-stamp-reject text-stamp-reject",
} as const;

export default function DecisionStamp({ decision }: DecisionStampProps) {
  const { t } = useLanguage();
  const label = t.stamp[decision];

  return (
    <div
      className={`inline-block rotate-[-6deg] border-2 px-5 py-3 motion-safe:animate-stamp-in sm:px-8 sm:py-4 ${COLOR[decision]}`}
      role="status"
      aria-label={`${t.stamp.aria}: ${label}`}
    >
      <span className="font-display text-xl font-semibold tracking-[0.15em] sm:text-2xl sm:tracking-[0.2em] lg:text-3xl">
        {label}
      </span>
    </div>
  );
}
