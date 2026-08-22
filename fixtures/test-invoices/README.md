# Test Invoice Fixtures

Synthetic invoices for rehearsed RechnungsLens demos. Every file is engineered to produce a known validation outcome.

| File | Designed to test | Expected decision |
|---|---|---|
| clean.pdf | Baseline (everything correct) | Accept |
| math-error.pdf | Deterministic math check | Reject (Net + VAT ≠ Gross) |
| missing-vat-id.pdf | Required field check | Reject (VAT ID missing) |
| malformed-vat-format.pdf | Format check, not existence check | Review (VAT ID format) |
| zugferd-compliant.pdf | Embedded-XML fast path (XML inside PDF) | Accept, 100% confidence, no AI call |
| sample-zugferd.xml | Standalone ZUGFeRD/XRechnung XML upload | Accept, 100% confidence, no AI call |
| messy-scan.jpg | Confidence-driven review, lead demo file | Review (low confidence / missing PO) |

## Regenerating fixtures

```bash
npm run generate:fixtures
```

Requires Puppeteer (dev dependency). The ZUGFeRD hybrid PDF embeds parser-compatible Factur-X XML into `clean.pdf` using `pdf-lib` (the same library `node-zugferd` uses). `node-zugferd`'s MINIMUM profile omits several monetary fields our extractor reads, so the fixture uses explicit CII XML that matches Section 3 Part B's parser.

## Verifying against the pipeline

**Offline (default):** confirms every fixture file exists, ZUGFeRD parsing works, and each file's *designed* extraction outcome produces the expected validation decision (no Gemini calls):

```bash
npm run verify:fixtures
```

**Live API:** uploads each file through `/api/extract` (requires `npm run dev`, `GEMINI_API_KEY`, and patience for free-tier rate limits):

```bash
npm run dev
npm run verify:fixtures:live
```

`zugferd-compliant.pdf` should hit the embedded-XML path with no Gemini call in the server logs.

`messy-scan.jpg` is a simulated bad scan (rotated JPEG with reduced contrast). It omits the PO number on purpose so a successful extraction should land on **Review**.
