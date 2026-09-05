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

const referenceRoot = resolve(projectRoot, "docs", "references");

const lawNetWebsite = (filename) => {
  if (filename.startsWith("lawnet-academy-library")) return "LawNet Academy Library";
  if (filename.startsWith("lawnet-account-hub")) return "SAL Account Hub";
  if (filename.startsWith("lawnet-asian-insights")) return "LawNet Asian Insights";
  if (filename === "lawnet-browse-legislation.png") return "LawNet Legislation";
  if (filename.startsWith("lawnet-ethics")) return "SAL Ethics & Professional Standards Repository";
  if (filename.startsWith("lawnet-intelligent-case")) return "SAL Intelligent Case Retrieval System";
  if (filename.startsWith("lawnet-openlaw")) return "OpenLaw";
  if (filename.startsWith("lawnet-precedents")) return "SAL Precedents";
  if (filename.startsWith("lawnet-research")) return "LawNet Research";
  if (filename.startsWith("lawnet-sentencing")) return "Sentencing Information & Research Repository";
  if (filename.startsWith("lawnet-store")) return "LawNet Store";
  if (filename.startsWith("lawnet-support")) return "SAL Support Hub";
  if (filename.startsWith("sal-motor-accident")) return "SAL Motor Accident Claims Online";
  if (filename.startsWith("scc-online")) return "SCC Online";
  return "LawNet / SAL";
};

const sources = [
  {
    directory: resolve(projectRoot, "Screenshots", "LawNetScreenshots"),
    toolId: "openlaw",
    reference: resolve(referenceRoot, "screenshot-reference-lawnet.md"),
    websiteOf: lawNetWebsite,
  },
  {
    directory: resolve(projectRoot, "Screenshots", "TAFEPScreenshots"),
    toolId: "tafep",
    reference: resolve(referenceRoot, "screenshot-reference-tafep.md"),
    websiteOf: () => "TAFEP",
  },
  {
    directory: resolve(projectRoot, "Screenshots", "JudiciaryGovScreenshots"),
    toolId: "judiciary",
    reference: resolve(referenceRoot, "screenshot-reference-judiciary.md"),
    websiteOf: () => "Judiciary.gov.sg / SG Courts",
  },
];

const normalizeReferenceText = (value) =>
  value
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const slugForFilename = (filename) =>
  basename(filename, extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const readScreenshotReference = (referencePath) => {
  if (!existsSync(referencePath)) {
    throw new Error(`Screenshot reference is missing: ${referencePath}`);
  }

  const markdown = readFileSync(referencePath, "utf8");
  const imagesHeading = markdown.indexOf("## Images and visible controls");
  if (imagesHeading < 0) {
    throw new Error(`Screenshot reference has no image table: ${referencePath}`);
  }

  const sharedStart = markdown.indexOf("## Shared controls");
  const sharedControls = sharedStart >= 0
    ? normalizeReferenceText(
        markdown
          .slice(sharedStart + "## Shared controls".length, imagesHeading)
          .replace(/^## .+$/gm, " "),
      )
    : "";
  const entries = new Map();
  const paths = [];
  const tableRow = /^\|[ \t]*`([^`]+\.png)`[ \t]*\|[ \t]*([^|]*?)[ \t]*\|[ \t]*$/gm;

  for (const match of markdown.matchAll(tableRow)) {
    const filename = match[1];
    if (entries.has(filename)) {
      throw new Error(`Duplicate screenshot reference for ${filename}`);
    }
    entries.set(filename, normalizeReferenceText(match[2]));
  }
  if (entries.size === 0) {
    throw new Error(`Screenshot reference contains no image rows: ${referencePath}`);
  }
  const pathsHeading = markdown.indexOf("## Confirmed screenshot paths");
  const nextHeading = pathsHeading >= 0
    ? markdown.indexOf("\n## ", pathsHeading + 4)
    : -1;
  const pathsSection = pathsHeading >= 0
    ? markdown.slice(pathsHeading, nextHeading >= 0 ? nextHeading : undefined)
    : "";
  const pathRow = /^\|[ \t]*`([^`]+\.png)`[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*`([^`]+\.png)`[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*$/gm;
  for (const match of pathsSection.matchAll(pathRow)) {
    paths.push({
      fromFilename: match[1],
      action: normalizeReferenceText(match[2]),
      toFilename: match[3],
      verification: normalizeReferenceText(match[4]),
    });
  }
  return { entries, paths, sharedControls };
};

const searchableWords = (value) =>
  value
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];

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
const referenceMetadata = [];

for (const source of sources) {
  if (!existsSync(source.directory)) {
    throw new Error(`Screenshot source directory is missing: ${source.directory}`);
  }

  const reference = readScreenshotReference(source.reference);
  const sourceFilenames = readdirSync(source.directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".png")
    .map((entry) => entry.name);
  const sourceFilenameSet = new Set(sourceFilenames);
  const missingReferences = sourceFilenames.filter(
    (filename) => !reference.entries.has(filename),
  );
  const unknownReferences = [...reference.entries.keys()].filter(
    (filename) => !sourceFilenameSet.has(filename),
  );
  if (missingReferences.length > 0 || unknownReferences.length > 0) {
    throw new Error(
      `Screenshot reference mismatch for ${source.toolId}. ` +
        `Missing: ${missingReferences.join(", ") || "none"}. ` +
        `Unknown: ${unknownReferences.join(", ") || "none"}.`,
    );
  }
  const invalidPaths = reference.paths.filter(
    (path) =>
      !sourceFilenameSet.has(path.fromFilename) ||
      !sourceFilenameSet.has(path.toFilename) ||
      !path.action,
  );
  if (invalidPaths.length > 0) {
    throw new Error(
      `Screenshot path mismatch for ${source.toolId}: ${invalidPaths
        .map((path) => `${path.fromFilename} -> ${path.toFilename}`)
        .join(", ")}.`,
    );
  }
  const pathsBySource = new Map();
  for (const pathEntry of reference.paths) {
    const existing = pathsBySource.get(pathEntry.fromFilename) || [];
    existing.push({
      action: pathEntry.action,
      targetId: `${source.toolId}-${slugForFilename(pathEntry.toFilename)}`,
      verification: pathEntry.verification,
    });
    pathsBySource.set(pathEntry.fromFilename, existing);
  }

  for (const entry of readdirSync(source.directory, { withFileTypes: true })) {
    if (!entry.isFile() || extname(entry.name).toLowerCase() !== ".png") {
      continue;
    }

    const sourcePath = resolve(source.directory, entry.name);
    const slug = slugForFilename(entry.name);
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
    const website = source.websiteOf(entry.name);
    const referenceDescription = reference.entries.get(entry.name);
    if (!referenceDescription) {
      throw new Error(`Screenshot description is missing for ${entry.name}`);
    }
    const keywords = [
      source.toolId,
      ...slug.split("-"),
      ...searchableWords(website),
      ...searchableWords(referenceDescription),
    ].filter(
      (keyword, index, entries) =>
        keyword.length > 1 && entries.indexOf(keyword) === index,
    ).slice(0, 80);

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
      website,
      filename: entry.name,
      label: slug.replace(/-/g, " "),
      keywords,
      referenceDescription,
      sharedControls: reference.sharedControls,
      transitions: pathsBySource.get(entry.name) || [],
      originalUrl: `/assets/screenshots/${source.toolId}/original/${entry.name}`,
      thumbnailUrl: `/assets/screenshots/${source.toolId}/thumbnail/${thumbnailName}`,
      width: dimensions.width,
      height: dimensions.height,
    });
    referenceMetadata.push({
      id,
      toolId: source.toolId,
      website,
      filename: entry.name,
      referenceDescription,
      sharedControls: reference.sharedControls,
      transitions: pathsBySource.get(entry.name) || [],
    });
  }
}

manifest.sort((left, right) =>
  `${left.toolId}/${left.filename}`.localeCompare(`${right.toolId}/${right.filename}`),
);
referenceMetadata.sort((left, right) => left.id.localeCompare(right.id));
mkdirSync(publicRoot, { recursive: true });
writeFileSync(
  resolve(publicRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
writeFileSync(
  resolve(publicRoot, "image-keywords.json"),
  `${JSON.stringify(
    manifest.map(({ id, toolId, website, filename, keywords, referenceDescription, transitions }) => ({
      id,
      toolId,
      website,
      filename,
      keywords,
      referenceDescription,
      transitions,
    })),
    null,
    2,
  )}\n`,
);
writeFileSync(
  resolve(publicRoot, "reference-metadata.json"),
  `${JSON.stringify(referenceMetadata, null, 2)}\n`,
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
