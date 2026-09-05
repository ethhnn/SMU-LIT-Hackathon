import { readFileSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { isToolId, type ToolId } from "@/lib/catalog";

const screenshotAssetSchema = z.object({
  id: z.string().min(1),
  toolId: z.string().refine(isToolId),
  website: z.string().min(1),
  filename: z.string().min(1),
  label: z.string().min(1),
  keywords: z.array(z.string().min(1)),
  referenceDescription: z.string().min(1),
  sharedControls: z.string(),
  originalUrl: z.string().startsWith("/assets/screenshots/"),
  thumbnailUrl: z.string().startsWith("/assets/screenshots/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type ScreenshotAsset = Omit<
  z.infer<typeof screenshotAssetSchema>,
  "toolId"
> & { toolId: ToolId };

let cachedAssets: ScreenshotAsset[] | undefined;

const publicFilePath = (publicUrl: string): string =>
  path.join(process.cwd(), "public", ...publicUrl.split("/").filter(Boolean));

export const getScreenshotLibrary = (): readonly ScreenshotAsset[] => {
  if (cachedAssets) {
    return cachedAssets;
  }

  const manifestPath = path.join(
    process.cwd(),
    "public",
    "assets",
    "screenshots",
    "manifest.json",
  );
  const parsed = z.array(screenshotAssetSchema).parse(
    JSON.parse(readFileSync(manifestPath, "utf8")),
  );
  cachedAssets = parsed as ScreenshotAsset[];
  return cachedAssets;
};

export const getScreenshotsForTools = (
  toolIds: readonly ToolId[],
): ScreenshotAsset[] => {
  const selected = new Set(toolIds);
  return getScreenshotLibrary().filter((asset) => selected.has(asset.toolId));
};

export const getScreenshotAsset = (
  assetId: string | null | undefined,
): ScreenshotAsset | undefined =>
  getScreenshotLibrary().find((asset) => asset.id === assetId);

export const getThumbnailDataUrl = (asset: ScreenshotAsset): string =>
  `data:image/jpeg;base64,${readFileSync(publicFilePath(asset.thumbnailUrl)).toString("base64")}`;

export const getScreenshotKeywordIndex = (
  assets: readonly ScreenshotAsset[],
): string =>
  assets
    .map(
      (asset) =>
        `- ${asset.id} | tool=${asset.toolId} | website=${asset.website} | ` +
        `reference=${asset.referenceDescription} | keywords=${asset.keywords.join(", ")}`,
    )
    .join("\n");
