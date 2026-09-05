import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getScreenshotLibrary } from "@/lib/screenshot-library";

describe("generated screenshot index", () => {
  it("contains every supplied LawNet and TAFEP PNG with searchable keywords", () => {
    const library = getScreenshotLibrary();
    const sourceSets = [
      { directory: "LawNetScreenshots", toolId: "openlaw" },
      { directory: "TAFEP", toolId: "tafep" },
    ];
    const sourceCount = sourceSets.reduce(
      (total, source) =>
        total +
        readdirSync(path.join(process.cwd(), "Screenshots", source.directory)).filter(
          (filename) => filename.toLowerCase().endsWith(".png"),
        ).length,
      0,
    );

    expect(library).toHaveLength(sourceCount);
    for (const source of sourceSets) {
      const sourceFiles = readdirSync(
        path.join(process.cwd(), "Screenshots", source.directory),
      ).filter((filename) => filename.toLowerCase().endsWith(".png"));
      const indexedFiles = library
        .filter((asset) => asset.toolId === source.toolId)
        .map((asset) => asset.filename);
      expect(indexedFiles.sort()).toEqual(sourceFiles.sort());
    }
    expect(library.every((asset) => asset.keywords.length > 1)).toBe(true);
  });
});
