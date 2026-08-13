# InvoiceLens

**Explainable document intelligence for incoming German invoices.**

Upload an invoice → extract structured data with per-field confidence scores → validate against deterministic German invoice rules → route to **Accept**, **Review**, or **Reject**, with a clear explanation of why.

> **Status:** Student-built prototype · synthetic data only · not for production use.

## The problem

Since **1 January 2025**, every business operating in Germany must be able to receive a structured electronic invoice (*E-Rechnung*). A plain PDF no longer counts under the new definition. The law expects machine-readable data, not a picture of an invoice.

A [Bitkom survey](https://www.bitkom.org) of 1,103 German companies (late 2024) found that only **45%** could actually receive a structured e-invoice, weeks before the requirement took effect.

In practice, accounts payable teams still receive invoices in many formats: PDFs, scans, photos, and occasionally a proper structured file. There is no fast, reliable way to know if an invoice is compliant, complete, and correct before it enters the books.

## What InvoiceLens does

InvoiceLens sits on the **receiving** side: understand what came in, validate it, flag problems, hand off clean data.

It is deliberately **not** “PDF in, legally compliant XRechnung out.” Generating compliant outgoing invoices is a different, higher-liability problem. This project focuses on ingestion, validation, and explainable routing.

```
       Invoice (PDF / scan / photo)
                  │
     Already a compliant ZUGFeRD/Factur-X file?
       (has embedded structured XML)
          │                    │
         Yes                   No
          │                    │
   Parse XML directly    Gemini extraction
   (no AI needed,        (with per-field
    100% reliable)        confidence score)
          │                    │
          └────────┬───────────┘
                    ▼
          Deterministic rules engine
     (required fields, VAT ID format,
        net + VAT = gross, PO presence)
                    │
                    ▼
              Decision engine
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       ACCEPT     REVIEW    REJECT
```

The core engineering question is not “can AI read an invoice?” That is largely solved. It is **“can the system reliably decide when its own extraction should not be trusted?”**

## Tech stack

| Piece | Choice |
|-------|--------|
| Frontend + API | [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS) |
| AI extraction | [Google Gemini API](https://ai.google.dev) via `@google/genai` |
| Hosting (planned) | Vercel (Hobby tier) |

No database in v1. Upload, process, show result. Stateless by design for the demo.

## Getting started

**Requirements:** Node.js 24 (Active LTS), npm

```bash
git clone https://github.com/AliyanRizwanDev/InvoiceLens.git
cd InvoiceLens
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables (needed from Section 3 onward):

```bash
# .env.local (never commit this file)
GEMINI_API_KEY=your_key_here
```

Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey).

## Project structure (planned)

```
invoicelens/
├── app/              # Next.js App Router: pages and API routes
├── lib/
│   ├── extract/      # Gemini extraction + ZUGFeRD/Factur-X parsing
│   ├── rules/        # Deterministic German invoice validation
│   └── decision/     # Accept / Review / Reject routing
└── types/            # Shared data shapes (ExtractedInvoice, etc.)
```

## What this is (and is not)

**This is:**
- A portfolio project and engineering conversation starter
- Built to demonstrate document intelligence, confidence scoring, and explainable validation
- Tested with synthetic invoice data

**This is not:**
- Production-ready software
- Legal or tax advice
- A replacement for DATEV, Candis, or any established AP automation platform

The e-invoicing space is crowded (DATEV, Candis, Rossum, Hypatos, and others). This project does not try to compete with them. It digs into a specific sub-problem: **knowing when extracted data cannot be trusted.**
