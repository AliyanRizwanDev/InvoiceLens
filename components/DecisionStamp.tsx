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
      className={`inline-block rotate-[-6deg] border-2 px-8 py-4 motion-safe:animate-stamp-in ${COLOR[decision]}`}
      role="status"
      aria-label={`${t.stamp.aria}: ${label}`}
    >
      <span className="font-display text-2xl font-semibold tracking-[0.2em] sm:text-3xl">
        {label}
      </span>
    </div>
  );
}
