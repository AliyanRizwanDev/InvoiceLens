import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "docs", "screenshots");
const FIXTURE = path.join(ROOT, "fixtures", "test-invoices", "zugferd-compliant.pdf");
const BASE =
  process.env.SCREENSHOT_BASE ?? "https://rechnungs-lens-tawny.vercel.app";

async function capture(page, name) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, type: "png" });
  console.log(`wrote ${file}`);
}

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

try {
  await fs.mkdir(OUT_DIR, { recursive: true });

  await page.goto(BASE, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector('input[type="file"]');
  await capture(page, "home.png");

  const input = await page.$('input[type="file"]');
  await input.uploadFile(FIXTURE);

  await page.waitForFunction(
    () => {
      const btn = [...document.querySelectorAll("button")].find((el) =>
        /review invoice|rechnung prüfen/i.test(el.textContent ?? ""),
      );
      return btn && !btn.disabled;
    },
    { timeout: 30_000 },
  );

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((el) =>
      /review invoice|rechnung prüfen/i.test(el.textContent ?? ""),
    );
    btn?.click();
  });

  await page.waitForFunction(
    () =>
      document.body.textContent?.includes("ACCEPTED") ||
      document.body.textContent?.includes("FREIGEGEBEN"),
    { timeout: 45_000 },
  );

  await page.evaluate(() => {
    const stamp = [...document.querySelectorAll("[aria-label]")].find((el) =>
      /^(Decision|Entscheidung):/.test(el.getAttribute("aria-label") ?? ""),
    );
    stamp?.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await new Promise((r) => setTimeout(r, 400));
  await capture(page, "results-release.png");

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 200));
  await capture(page, "roadmap.png");
} finally {
  await browser.close();
}
