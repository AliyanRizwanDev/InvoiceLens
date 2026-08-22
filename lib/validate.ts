import type {
  ExtractedInvoice,
  FieldResult,
  ValidationResult,
} from "@/types/invoice";

const REQUIRED_FIELDS = [
  "supplier",
  "invoiceNumber",
  "invoiceDate",
  "vatId",
  "netAmount",
  "vatAmount",
  "grossAmount",
  "currency",
] as const;

const CONFIDENCE_THRESHOLD = 70;
const AMOUNT_TOLERANCE = 0.01;

function checkRequiredField(
  fieldName: string,
  value: string | number | null,
  confidence: number | null,
): FieldResult {
  if (value === null || value === undefined || value === "") {
    return {
      value: null,
      confidence,
      status: "fail",
      reason: `${fieldName} is missing or unreadable`,
    };
  }
  return { value, confidence, status: "pass", reason: "" };
}

function checkVatId(
  vatId: string | null,
  confidence: number | null,
): FieldResult {
  if (!vatId) {
    return {
      value: null,
      confidence,
      status: "fail",
      reason: "VAT ID is missing or unreadable",
    };
  }

  const normalized = vatId.replace(/\s/g, "").toUpperCase();
  const formatValid = /^DE\d{9}$/.test(normalized);

  if (!formatValid) {
    return {
      value: vatId,
      confidence,
      status: "warning",
      reason:
        "VAT ID doesn't match the DE + 9 digit format — this is a format check only, not proof the ID actually exists",
    };
  }

  return { value: vatId, confidence, status: "pass", reason: "" };
}

function checkMath(
  netAmount: number | null,
  vatAmount: number | null,
  grossAmount: number | null,
  confidence: number | null,
): FieldResult {
  if (netAmount === null || vatAmount === null || grossAmount === null) {
    return {
      value: grossAmount,
      confidence,
      status: "warning",
      reason: "Can't verify the math — one or more amounts is missing",
    };
  }

  const expected = netAmount + vatAmount;
  const diff = Math.abs(expected - grossAmount);

  if (diff > AMOUNT_TOLERANCE) {
    return {
      value: grossAmount,
      confidence,
      status: "fail",
      reason: `Net + VAT (${expected.toFixed(2)}) does not equal Gross (${grossAmount.toFixed(2)})`,
    };
  }

  return { value: grossAmount, confidence, status: "pass", reason: "" };
}

function checkPoNumber(
  poNumber: string | null,
  confidence: number | null,
): FieldResult {
  if (!poNumber) {
    return {
      value: null,
      confidence,
      status: "warning",
      reason:
        "No purchase order number found — not required on every invoice, but worth a glance",
    };
  }
  return { value: poNumber, confidence, status: "pass", reason: "" };
}

function applyConfidenceDowngrade(result: FieldResult): FieldResult {
  if (
    result.status === "pass" &&
    result.confidence !== null &&
    result.confidence < CONFIDENCE_THRESHOLD
  ) {
    return {
      ...result,
      status: "warning",
      reason: `Low extraction confidence (${result.confidence}%) — the format looks fine, but this is worth a human glance`,
    };
  }
  return result;
}

export function validateInvoice(invoice: ExtractedInvoice): ValidationResult {
  const fields: Record<string, FieldResult> = {};

  for (const fieldName of REQUIRED_FIELDS) {
    if (fieldName === "vatId") continue;
    fields[fieldName] = applyConfidenceDowngrade(
      checkRequiredField(
        fieldName,
        invoice[fieldName],
        invoice.confidence[fieldName] ?? null,
      ),
    );
  }

  fields.vatId = applyConfidenceDowngrade(
    checkVatId(invoice.vatId, invoice.confidence.vatId ?? null),
  );

  fields.poNumber = checkPoNumber(
    invoice.poNumber,
    invoice.confidence.poNumber ?? null,
  );

  const mathResult = checkMath(
    invoice.netAmount,
    invoice.vatAmount,
    invoice.grossAmount,
    invoice.confidence.grossAmount ?? null,
  );
  if (mathResult.status !== "pass") {
    fields.grossAmount = mathResult;
  }

  const statuses = Object.values(fields).map((f) => f.status);
  let decision: ValidationResult["decision"] = "accept";
  if (statuses.includes("fail")) decision = "reject";
  else if (statuses.includes("warning")) decision = "review";

  return { decision, fields };
}
