import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import ffmpegPath from "ffmpeg-static";

const projectRoot = resolve(import.meta.dirname, "..");
const publicRoot = resolve(projectRoot, "public", "assets", "screenshots");

const sources = [
  {
    directory: resolve(projectRoot, "Screenshots", "LawNetScreenshots"),
    toolId: "openlaw",
  },
  {
    directory: resolve(projectRoot, "Screenshots", "TAFEPScreenshots"),
    toolId: "tafep",
  },
];

const dimensionsOfPng = (filePath) => {
  const bytes = readFileSync(filePath);
  if (bytes.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`Only PNG screenshot assets are supported: ${filePath}`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
};

const refreshFile = (source, destination, create) => {
  const shouldRefresh =
    !existsSync(destination) ||
    statSync(source).mtimeMs > statSync(destination).mtimeMs;
  if (!shouldRefresh) {
    return;
  }
  mkdirSync(dirname(destination), { recursive: true });
  create();
};

const manifest = [];

for (const source of sources) {
  if (!existsSync(source.directory)) {
    continue;
  }

  for (const entry of readdirSync(source.directory, { withFileTypes: true })) {
    if (!entry.isFile() || extname(entry.name).toLowerCase() !== ".png") {
      continue;
    }

    const sourcePath = resolve(source.directory, entry.name);
    const slug = basename(entry.name, extname(entry.name))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `${source.toolId}-${slug}`;
    const originalPath = resolve(publicRoot, source.toolId, "original", entry.name);
    const thumbnailName = `${slug}.jpg`;
    const thumbnailPath = resolve(
      publicRoot,
      source.toolId,
      "thumbnail",
      thumbnailName,
    );
    const dimensions = dimensionsOfPng(sourcePath);
    const keywords = [source.toolId, ...slug.split("-")].filter(
      (keyword, index, entries) =>
        keyword.length > 1 && entries.indexOf(keyword) === index,
    );

    refreshFile(sourcePath, originalPath, () => cpSync(sourcePath, originalPath));
    refreshFile(sourcePath, thumbnailPath, () => {
      if (!ffmpegPath) {
        throw new Error("ffmpeg-static is required to prepare screenshot thumbnails.");
      }
      const result = spawnSync(
        ffmpegPath,
        [
          "-y",
          "-i",
          sourcePath,
          "-vf",
          "scale='min(640,iw)':-2",
          "-frames:v",
          "1",
          "-q:v",
          "5",
          thumbnailPath,
        ],
        { windowsHide: true, encoding: "utf8" },
      );
      if (result.status !== 0) {
        throw new Error(
          `Could not prepare thumbnail for ${entry.name}: ${result.stderr}`,
        );
      }
    });

    manifest.push({
      id,
      toolId: source.toolId,
      filename: entry.name,
      label: slug.replace(/-/g, " "),
      keywords,
      originalUrl: `/assets/screenshots/${source.toolId}/original/${entry.name}`,
      thumbnailUrl: `/assets/screenshots/${source.toolId}/thumbnail/${thumbnailName}`,
      width: dimensions.width,
      height: dimensions.height,
    });
  }
}

manifest.sort((left, right) =>
  `${left.toolId}/${left.filename}`.localeCompare(`${right.toolId}/${right.filename}`),
);
mkdirSync(publicRoot, { recursive: true });
writeFileSync(
  resolve(publicRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
writeFileSync(
  resolve(publicRoot, "image-keywords.json"),
  `${JSON.stringify(
    manifest.map(({ id, toolId, filename, keywords }) => ({
      id,
      toolId,
      filename,
      keywords,
    })),
    null,
    2,
  )}\n`,
);

// Preserve the stable paths used by the reviewed OpenLaw starter lesson.
const reviewedAssets = [
  ["lawnet-openlaw-judgments-expanded-sidebar.png", "openlaw-search-start.png"],
  ["lawnet-openlaw-judgments-decision-date-filter.png", "openlaw-decision-date-filter.png"],
  ["lawnet-openlaw-judgments-sort-menu.png", "openlaw-sort-menu.png"],
];

for (const [sourceName, destinationName] of reviewedAssets) {
  const source = resolve(
    projectRoot,
    "Screenshots",
    "LawNetScreenshots",
    sourceName,
  );
  const destination = resolve(
    projectRoot,
    "public",
    "assets",
    "openlaw",
    destinationName,
  );
  if (!existsSync(source)) {
    throw new Error(`Required OpenLaw training asset is missing: ${source}`);
  }
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination);
}
