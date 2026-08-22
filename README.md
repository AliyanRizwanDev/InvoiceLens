# RechnungsLens

**Explainable incoming-invoice review for the German market** — *Rechnung* (invoice) + *Lens* (inspect before it hits the books).

Upload a PDF, scan, photo, or structured e-invoice → extract fields with per-field confidence → run deterministic checks → route to **Release**, **Review**, or **Reject** with a reason for every field.

Built for Germany's **E-Rechnung** reality: since January 2025, businesses must be able to receive structured electronic invoices. Most AP teams still get PDFs, scans, and the occasional ZUGFeRD/XRechnung file. RechnungsLens shows how to **ingest, validate, and explain** what came in — without pretending a blurry scan is a certified compliant invoice.

> Portfolio prototype · synthetic test data · not production software or tax advice.

---

## Why this exists

A [Bitkom survey](https://www.bitkom.org) of 1,103 German companies (late 2024) found only **45%** could receive a structured e-invoice weeks before the mandate took effect.

The hard question is not “can AI read an invoice?” It is **“when should the system refuse to trust its own extraction?”** RechnungsLens answers that with confidence scores, deterministic rules, and an audit-style case file UI.

## Pipeline

```
       Invoice (PDF / scan / photo / XML)
                  │
     ZUGFeRD or XRechnung with embedded XML?
          │                    │
         Yes                   No
          │                    │
   Parse XML directly    Gemini extraction
   (no AI, 100% conf.)  (per-field confidence)
          │                    │
          └────────┬───────────┘
                    ▼
          Deterministic validation
   (required fields · DE VAT format · net+VAT=gross · PO warning)
                    │
                    ▼
         Release · Review · Reject
```

**ZUGFeRD / XRechnung fast path:** if structured XML is present, fields are read directly — no Gemini call, confidence locked at 100%.

**Everything else:** Gemini extracts supplier, amounts, dates, VAT ID, PO number, etc., each with a confidence score. Low confidence or rule failures downgrade the decision.

## Features

| Area | What you get |
|------|----------------|
| **Upload** | Drag-and-drop PDF, JPG, PNG, or structured e-invoice XML (XRechnung / ZUGFeRD) |
| **Preview** | Immediate file confirmation + inline preview before processing |
| **Extraction** | Embedded-XML fast path or Gemini API with `@google/genai` |
| **Validation** | Required fields, `DE` + 9-digit VAT format, math check (±€0.01), PO presence warning, confidence threshold at 70 |
| **Results UI** | Ledger-style case file: field rows, decision stamp, compact JSON record + download |
| **i18n** | English / German UI toggle (GitHub docs stay English) |
| **Fixtures** | Six synthetic invoices with known outcomes + offline/live verification scripts |
| **Tests** | Vitest suite for the validation engine |

## Tech stack

| Layer | Choice |
|-------|--------|
| App | [Next.js 16](https://nextjs.org) · App Router · TypeScript · Tailwind CSS v4 |
| AI extraction | [Google Gemini API](https://ai.google.dev) |
| XML / PDF | `fast-xml-parser` · `pdfjs-dist` · ZUGFeRD attachment parsing |
| Upload | `react-dropzone` |
| Dev tooling | Vitest · Puppeteer (fixture generation) · `pdf-lib` · `node-zugferd` |

Stateless v1: upload → process → show result. No database.

## Quick start

**Requirements:** Node.js 20+ (24 LTS recommended), npm

```bash
git clone https://github.com/AliyanRizwanDev/RechnungsLens.git
cd RechnungsLens
npm install
cp .env.example .env.local   # add your Gemini key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

```bash
# .env.local — never commit
GEMINI_API_KEY=your_key_here
```

Free key: [Google AI Studio](https://aistudio.google.com/apikey). The ZUGFeRD fixture path works without a key; scans and plain PDFs need Gemini.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run test` | Vitest (validation rules) |
| `npm run lint` | ESLint |
| `npm run generate:fixtures` | Regenerate synthetic invoice PDFs/images |
| `npm run verify:fixtures` | Offline fixture checks (no API key) |
| `npm run verify:fixtures:live` | Full pipeline via `/api/extract` (needs dev server + key) |

## Test fixtures

Six engineered files in `fixtures/test-invoices/` — each designed for a specific demo outcome:

| File | Expected decision |
|------|-------------------|
| `clean.pdf` | Release |
| `math-error.pdf` | Reject (net + VAT ≠ gross) |
| `missing-vat-id.pdf` | Reject |
| `malformed-vat-format.pdf` | Review (VAT format) |
| `zugferd-compliant.pdf` | Release via embedded XML (no AI) |
| `messy-scan.jpg` | Review (low confidence / missing PO) |

See [fixtures/test-invoices/README.md](fixtures/test-invoices/README.md) for regeneration and verification details.

## Project layout

```
├── app/
│   ├── api/extract/     # POST upload → extract + validate
│   └── page.tsx         # Upload, preview, results
├── components/          # Upload zone, results case file, i18n shell
├── lib/
│   ├── zugferd.ts       # Embedded XML extraction
│   ├── extractWithGemini.ts
│   ├── validate.ts      # Deterministic rules engine
│   └── i18n.ts          # EN / DE strings
├── fixtures/test-invoices/
├── scripts/             # generate + verify fixtures
└── types/invoice.ts     # ExtractedInvoice, ValidationResult
```

## What this is (and is not)

**This is:**
- A portfolio piece and conversation starter on explainable document intelligence
- Focused on the **receiving** side: understand, validate, route — not generate outgoing XRechnung
- Tested with synthetic data and offline verification

**This is not:**
- Production AP automation (DATEV, Candis, Rossum, Hypatos, etc. solve that at scale)
- Legal, tax, or compliance certification
- A guarantee that extracted VAT IDs exist or that math is legally correct beyond the checks implemented here

---

**RechnungsLens** · built by [Aliyan Rizwan](https://github.com/AliyanRizwanDev)
