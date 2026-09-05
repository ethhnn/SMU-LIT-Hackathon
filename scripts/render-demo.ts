import { stat } from "node:fs/promises";
import path from "node:path";
import { hasOpenRouterKey } from "../lib/openrouter";

process.loadEnvFile(path.join(process.cwd(), ".env"));

const main = async () => {
  if (!hasOpenRouterKey()) {
    throw new Error("Add OPENROUTER_API_KEY to .env before running the real Help Clip check.");
  }

  const importedVideo = (await import("../lib/video")) as typeof import("../lib/video") & {
    default?: typeof import("../lib/video");
  };
  const { createHelpClip } = importedVideo.default ?? importedVideo;
  const clip = await createHelpClip({
    scenario:
      "I need to locate a public Singapore Supreme Court judgment by its supplied name.",
    toolIds: ["openlaw"],
    lessonPlanId: "openlaw-locate-search-field",
  });
  const filePath = path.join(process.cwd(), "public", clip.videoUrl.replace(/^\//, ""));
  const metadata = await stat(filePath);

  if (metadata.size < 10_000) {
    throw new Error("The rendered MP4 is unexpectedly small.");
  }

  console.log(`Generated ${clip.videoUrl} (${metadata.size} bytes).`);
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Real Help Clip check failed.";
  console.error(message);
  process.exitCode = 1;
});
