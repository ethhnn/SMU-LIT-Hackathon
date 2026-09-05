import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getScreenshotLibrary } from "@/lib/screenshot-library";

describe("generated screenshot index", () => {
  it("contains every supplied PNG with human-reviewed reference metadata", () => {
    const library = getScreenshotLibrary();
    const sourceSets = [
      { directory: "LawNetScreenshots", toolId: "openlaw" },
      { directory: "TAFEPScreenshots", toolId: "tafep" },
      { directory: "JudiciaryGovScreenshots", toolId: "judiciary" },
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
    expect(library.every((asset) => asset.website.length > 0)).toBe(true);
    expect(library.every((asset) => asset.referenceDescription.length > 0)).toBe(
      true,
    );
    expect(library.every((asset) => asset.sharedControls.length > 0)).toBe(true);
  });

  it("preserves the actual LawNet-family product identity", () => {
    const library = getScreenshotLibrary();
    expect(
      library.find((asset) => asset.filename === "lawnet-store-homepage.png")
        ?.website,
    ).toBe("LawNet Store");
    expect(
      library.find(
        (asset) =>
          asset.filename === "lawnet-openlaw-judgments-sort-menu.png",
      )?.website,
    ).toBe("OpenLaw");
  });
});
