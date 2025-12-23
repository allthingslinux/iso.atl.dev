import { describe, expect, it } from "vitest";
import { HelloSchema, ISOMetadataSchema, SearchSchema } from "./index";

describe("HelloSchema", () => {
  it("should validate a valid hello input", () => {
    const result = HelloSchema.safeParse({ name: "World" });
    expect(result.success).toBe(true);
  });

  it("should accept optional name", () => {
    const result = HelloSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("SearchSchema", () => {
  it("should validate a valid search input", () => {
    const result = SearchSchema.safeParse({ q: "ubuntu", arch: "x86_64" });
    expect(result.success).toBe(true);
  });

  it("should accept optional fields", () => {
    const result = SearchSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("ISOMetadataSchema", () => {
  it("should validate complete ISO metadata", () => {
    const result = ISOMetadataSchema.safeParse({
      distro: "Ubuntu",
      version: "22.04",
      arch: "x86_64",
      type: "desktop",
      date: "20240101",
      lang: "en",
      originalFilename: "ubuntu-22.04-desktop-amd64.iso",
      confidence: 95,
    });
    expect(result.success).toBe(true);
  });

  it("should reject confidence outside 0-100 range", () => {
    const result = ISOMetadataSchema.safeParse({
      distro: "Ubuntu",
      version: "22.04",
      arch: "x86_64",
      originalFilename: "ubuntu-22.04-desktop-amd64.iso",
      confidence: 150,
    });
    expect(result.success).toBe(false);
  });
});
