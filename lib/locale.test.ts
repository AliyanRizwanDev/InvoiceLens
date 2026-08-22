import { describe, expect, it } from "vitest";
import { localeFromAcceptLanguage, localeFromLanguages } from "./locale";

describe("localeFromLanguages", () => {
  it("picks German for de variants", () => {
    expect(localeFromLanguages(["de-DE"])).toBe("de");
    expect(localeFromLanguages(["de-AT", "en"])).toBe("de");
  });

  it("defaults to English otherwise", () => {
    expect(localeFromLanguages(["en-US"])).toBe("en");
    expect(localeFromLanguages(["fr-FR", "en"])).toBe("en");
  });
});

describe("localeFromAcceptLanguage", () => {
  it("parses Accept-Language header", () => {
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.8")).toBe("de");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
  });
});
