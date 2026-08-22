import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "fixtures", "test-invoices");
const TEMPLATE_PATH = path.join(__dirname, "invoice-template.html");

const CLEAN = {
  supplier: "Müller GmbH",
  invoiceNumber: "INV-23891",
  invoiceDate: "2026-08-12",
  vatId: "DE123456789",
  poNumber: "PO-4471",
  netAmount: 4800,
  vatAmount: 912,
  grossAmount: 5712,
  currency: "EUR",
  unitPrice: 120,
};

function formatMoney(value) {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateDisplay(isoDate) {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}

function vatIdBlock(vatId) {
  if (!vatId) {
    return `<div class="field"><div class="label">USt-IdNr.</div><div class="value">&nbsp;</div></div>`;
  }
  return `<div class="field"><div class="label">USt-IdNr.</div><div class="value">${vatId}</div></div>`;
}

function poNumberBlock(poNumber) {
  if (!poNumber) return "";
  return `<div class="field"><div class="label">Bestellnummer</div><div class="value">${poNumber}</div></div>`;
}

async function loadTemplate() {
  return fs.readFile(TEMPLATE_PATH, "utf8");
}

function renderTemplate(template, data) {
  const replacements = {
    "{{supplier}}": data.supplier,
    "{{invoiceNumber}}": data.invoiceNumber,
    "{{invoiceDateDisplay}}": formatDateDisplay(data.invoiceDate),
    "{{vatIdBlock}}": vatIdBlock(data.vatId ?? null),
    "{{poNumberBlock}}": poNumberBlock(data.poNumber ?? null),
    "{{unitPriceDisplay}}": formatMoney(data.unitPrice),
    "{{netAmountDisplay}}": formatMoney(data.netAmount),
    "{{vatAmountDisplay}}": formatMoney(data.vatAmount),
    "{{grossAmountDisplay}}": formatMoney(data.grossAmount),
    "{{currency}}": data.currency,
  };

  return Object.entries(replacements).reduce(
    (html, [token, value]) => html.replaceAll(token, value),
    template,
  );
}

async function renderPdf(browser, html, outputPath) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  });
  await page.close();
}

async function renderMessyScan(browser, html, outputPath) {
  const messyHtml = html.replace(
    "</head>",
    `<style>
      html { background: #8f8f88; }
      body {
        margin: 20px;
        transform: rotate(-1.8deg);
        filter: contrast(0.94) brightness(0.9) saturate(0.9);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
      }
    </style></head>`,
  );

  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 });
  await page.setContent(messyHtml, { waitUntil: "networkidle0" });
  await page.screenshot({
    path: outputPath,
    type: "jpeg",
    quality: 72,
    fullPage: true,
  });
  await page.close();
}

function buildCiiXml(data) {
  const issueDate = data.invoiceDate.replace(/-/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocument>
    <ram:ID>${data.invoiceNumber}</ram:ID>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueDate}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${data.supplier}</ram:Name>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${data.vatId}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${data.poNumber}</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount currencyID="${data.currency}">${data.netAmount.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${data.currency}">${data.vatAmount.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount currencyID="${data.currency}">${data.grossAmount.toFixed(2)}</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

async function generateZugferdPdf(cleanPdfPath, outputPath, data) {
  const pdfBytes = await fs.readFile(cleanPdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const xml = buildCiiXml(data);
  await pdfDoc.attach(Buffer.from(xml, "utf8"), "factur-x.xml", {
    mimeType: "text/xml",
    description: "Factur-X ZUGFeRD invoice XML",
  });
  const embedded = await pdfDoc.save();
  await fs.writeFile(outputPath, embedded);
}

const PDF_VARIANTS = [
  {
    filename: "clean.pdf",
    data: { ...CLEAN },
  },
  {
    filename: "math-error.pdf",
    data: { ...CLEAN, grossAmount: 5900 },
  },
  {
    filename: "missing-vat-id.pdf",
    data: { ...CLEAN, vatId: null },
  },
  {
    filename: "malformed-vat-format.pdf",
    data: { ...CLEAN, vatId: "DE12345" },
  },
];

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const template = await loadTemplate();

  const browser = await puppeteer.launch({ headless: true });

  try {
    for (const variant of PDF_VARIANTS) {
      const html = renderTemplate(template, variant.data);
      const outputPath = path.join(OUT_DIR, variant.filename);
      await renderPdf(browser, html, outputPath);
      console.log(`Wrote ${variant.filename}`);
    }

    const messyData = { ...CLEAN, poNumber: null };
    const messyHtml = renderTemplate(template, messyData);
    await renderMessyScan(
      browser,
      messyHtml,
      path.join(OUT_DIR, "messy-scan.jpg"),
    );
    console.log("Wrote messy-scan.jpg");

    const cleanPdfPath = path.join(OUT_DIR, "clean.pdf");
    await generateZugferdPdf(
      cleanPdfPath,
      path.join(OUT_DIR, "zugferd-compliant.pdf"),
      CLEAN,
    );
    console.log("Wrote zugferd-compliant.pdf");
  } finally {
    await browser.close();
  }

  console.log("\nDone. Fixtures saved to fixtures/test-invoices/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
