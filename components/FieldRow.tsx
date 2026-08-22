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
      <div className="flex items-baseline justify-between gap-4">
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
        <div className="flex shrink-0 items-baseline gap-2 text-right">
          <span className="font-mono text-sm tabular-nums text-ink">{value}</span>
          {showConfidence && confidence !== null ? (
            <span className="font-sans text-xs text-ink/45">{confidence}%</span>
          ) : null}
        </div>
      </div>
      {status && status !== "pass" && reason ? (
        <p className="mt-1 pl-5 font-sans text-xs text-ink/60">{reason}</p>
      ) : null}
    </div>
  );
}
