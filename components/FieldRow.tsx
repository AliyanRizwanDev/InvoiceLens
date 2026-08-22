import type { FieldStatus } from "@/types/invoice";

type FieldRowProps = {
  label: string;
  value: string;
  confidence?: number | null;
  showConfidence?: boolean;
  status?: FieldStatus;
  reason?: string;
};

const STATUS_CONFIG = {
  pass: { icon: "✓", colorClass: "text-stamp-accept" },
  warning: { icon: "⚠", colorClass: "text-stamp-review" },
  fail: { icon: "✗", colorClass: "text-stamp-reject" },
} as const;

export default function FieldRow({
  label,
  value,
  confidence = null,
  showConfidence = true,
  status,
  reason,
}: FieldRowProps) {
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="border-b border-ledger-line py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-baseline gap-2">
          {statusConfig ? (
            <span
              className={`shrink-0 text-sm ${statusConfig.colorClass}`}
              aria-hidden="true"
            >
              {statusConfig.icon}
            </span>
          ) : null}
          <span className="font-sans text-sm text-ink/70">{label}</span>
        </div>
        <div className="flex min-w-0 items-baseline gap-2 sm:justify-end sm:text-right">
          <span className="break-all font-mono text-sm tabular-nums text-ink sm:break-normal">
            {value}
          </span>
          {showConfidence && confidence !== null ? (
            <span className="shrink-0 font-sans text-xs text-ink/45">
              {confidence}%
            </span>
          ) : null}
        </div>
      </div>
      {status && status !== "pass" && reason ? (
        <p className="mt-1 pl-0 font-sans text-xs leading-relaxed text-ink/60 sm:pl-5">
          {reason}
        </p>
      ) : null}
    </div>
  );
}
