import { randomUUID } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import ffmpegPath from "ffmpeg-static";
import { z } from "zod";

import type { ToolId } from "@/lib/catalog";
import type { HelpClipResponse } from "@/lib/contracts";
import {
  getLessonPlanForSupportTopic,
  selectionKey,
  type LessonPlan,
} from "@/lib/lesson-plans";
import {
  getOpenRouterClient,
  getRecommendationModel,
  getTtsModel,
  getTtsVoice,
} from "@/lib/openrouter";

export class HelpClipError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
  ) {
    super(message);
  }
}

type HelpClipInput = {
  scenario: string;
  toolIds: ToolId[];
  lessonPlanId: string;
  supportTopicId?: string;
  question?: string;
  lessonPlan?: LessonPlan;
};

const getFfmpegPath = (): string => {
  if (!ffmpegPath) {
    throw new HelpClipError("The local video encoder is unavailable. Please try again.");
  }

  return ffmpegPath;
};

const runFfmpeg = (args: string[], allowNonZero = false): Promise<string> =>
  new Promise((resolve, reject) => {
    const process = spawn(getFfmpegPath(), args, { windowsHide: true });
    let output = "";

    process.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    process.once("error", () => {
      reject(new HelpClipError("The local video encoder could not start."));
    });
    process.once("close", (code) => {
      if (code === 0 || allowNonZero) {
        resolve(output);
        return;
      }

      reject(new HelpClipError("The video encoder could not finish the Help Clip."));
    });
  });

const getAudioDurationSeconds = async (audioPath: string): Promise<number> => {
  const output = await runFfmpeg(["-hide_banner", "-i", audioPath], true);
  const match = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d+(?:\.\d+)?)/);

  if (!match) {
    return 8;
  }

  const [, hours, minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

const narrationStyleSchema = z.object({
  style: z.enum(["where-to-start", "reviewed-screen", "current-focus"]),
});

type NarrationStyle = z.infer<typeof narrationStyleSchema>["style"];

const supportingLines: Record<NarrationStyle, string> = {
  "where-to-start": "This is the place shown in the supplied training image.",
  "reviewed-screen": "Follow the highlighted control on this training screen.",
  "current-focus": "This clip stays with the highlighted interface area for your current question.",
};

const supportingCaptions: Record<NarrationStyle, string> = {
  "where-to-start": "Start in the Search field on the left.",
  "reviewed-screen": "Use the highlighted Search field in this reviewed screen.",
  "current-focus": "Stay with the reviewed Search-field step.",
};

const chooseNarrationStyle = async (
  scenario: string,
  toolNames: readonly string[],
  question?: string,
): Promise<NarrationStyle> => {
  const client = getOpenRouterClient();
  if (!client) {
    throw new HelpClipError(
      "Add OPENROUTER_API_KEY to .env before generating a narrated Help Clip.",
      503,
    );
  }

  const fallback: NarrationStyle = question ? "current-focus" : "where-to-start";

  try {
    const response = await client.chat.completions.create({
      model: getRecommendationModel(),
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Choose one style for a short software-training clip. Return only JSON with a style field. " +
            "Allowed styles: where-to-start, reviewed-screen, current-focus. " +
            "Do not write narration, instructions, legal analysis, claims about coverage, or any other text.",
        },
        {
          role: "user",
          content: `Training objective: ${scenario}\nSelected tools: ${toolNames.join(", ")}\nLearner question: ${question || "No additional question."}`,
        },
      ],
    });
    const raw = response.choices[0]?.message.content;
    if (!raw) {
      return fallback;
    }
    const parsed = narrationStyleSchema.safeParse(JSON.parse(raw));

    if (parsed.success) {
      return parsed.data.style;
    }
  } catch {
    // Fixed supporting copy keeps the reviewed operation intact when selection fails.
  }

  return fallback;
};

const buildNarration = (
  scenes: ReadonlyArray<{
    toolName: string;
    reviewedCoreInstruction: string;
    evidenceStatus: "reviewed-instruction" | "screenshot-observation";
  }>,
  style: NarrationStyle,
): string => {
  const evidenceNote = scenes.some(
    (scene) => scene.evidenceStatus === "screenshot-observation",
  )
    ? "This guidance is based on supplied screenshot evidence. "
    : "";

  return `Training demonstration. ${evidenceNote}${scenes
    .map((scene) => `${scene.toolName}: ${scene.reviewedCoreInstruction}`)
    .join(" ")} ${supportingLines[style]} The learner remains responsible for legal judgment.`;
};

const synthesizeSpeech = async (narration: string): Promise<Buffer> => {
  const client = getOpenRouterClient();
  if (!client) {
    throw new HelpClipError(
      "Add OPENROUTER_API_KEY to .env before generating a narrated Help Clip.",
    );
  }

  try {
    const speech = await client.audio.speech.create({
      model: getTtsModel(),
      voice: getTtsVoice(),
      input: narration,
      response_format: "mp3",
    });

    return Buffer.from(await speech.arrayBuffer());
  } catch {
    throw new HelpClipError("Narration audio could not be generated. Please retry the Help Clip.");
  }
};

const createHelpClipOnce = async ({
  scenario,
  toolIds,
  lessonPlanId,
  supportTopicId = "openlaw-search-field",
  question,
  lessonPlan: suppliedLessonPlan,
}: HelpClipInput): Promise<HelpClipResponse> => {
  const lessonPlan =
    suppliedLessonPlan || getLessonPlanForSupportTopic(supportTopicId);
  if (
    !lessonPlan ||
    lessonPlan.id !== lessonPlanId ||
    lessonPlan.scenes.length === 0 ||
    selectionKey(lessonPlan.toolIds) !== selectionKey(toolIds)
  ) {
    throw new HelpClipError(
      "The selected tools do not yet have a reviewed shared Lesson Plan.",
      400,
    );
  }

  const generatedDirectory = path.join(process.cwd(), "public", "generated");
  await mkdir(generatedDirectory, { recursive: true });

  const clipId = randomUUID();
  const audioFileName = `${clipId}.mp3`;
  const temporaryVideoPath = path.join(generatedDirectory, `${clipId}.rendered.mp4`);
  const finalVideoPath = path.join(generatedDirectory, `${clipId}.mp4`);
  const narrationStyle = await chooseNarrationStyle(
    scenario,
    lessonPlan.scenes.map((scene) => scene.toolName),
    question,
  );
  const narration = buildNarration(lessonPlan.scenes, narrationStyle);
  const audio = await synthesizeSpeech(narration);
  const audioPath = path.join(generatedDirectory, audioFileName);
  await writeFile(audioPath, audio);

  const audioDuration = await getAudioDurationSeconds(audioPath);
  const durationInFrames = Math.max(
    210 * lessonPlan.scenes.length,
    Math.ceil((audioDuration + 1.5) * 30),
  );
  const inputProps = {
    scenes: lessonPlan.scenes.map((scene) => ({
      ...scene,
      caption: scene.caption || supportingCaptions[narrationStyle],
      imagePath: scene.screenshot.replace(/^\//, ""),
    })),
    audioPath: `generated/${audioFileName}`,
    durationInFrames,
  };

  try {
    const browserStatus = await ensureBrowser({ logLevel: "error" });
    if (!("path" in browserStatus)) {
      throw new HelpClipError(
        "The local video renderer is unavailable. Please retry after its browser dependency is installed.",
      );
    }

    const serveUrl = await bundle({
      entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
      publicDir: path.join(process.cwd(), "public"),
    });
    const composition = await selectComposition({
      serveUrl,
      id: "SharedHelpClip",
      inputProps,
      logLevel: "error",
      browserExecutable: browserStatus.path,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: temporaryVideoPath,
      inputProps,
      logLevel: "error",
      browserExecutable: browserStatus.path,
    });
    await runFfmpeg([
      "-y",
      "-i",
      temporaryVideoPath,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      finalVideoPath,
    ]);
    await stat(finalVideoPath);
  } catch (error) {
    if (error instanceof HelpClipError) {
      throw error;
    }

    throw new HelpClipError("The Help Clip could not be rendered. Please retry.");
  }

  return {
    videoUrl: `/generated/${clipId}.mp4`,
    narration,
    label: "Training demonstration",
  };
};

let helpClipRenderInProgress = false;

export const createHelpClip = async (
  input: HelpClipInput,
): Promise<HelpClipResponse> => {
  if (helpClipRenderInProgress) {
    throw new HelpClipError(
      "A Help Clip is already being generated. Please wait and retry.",
      429,
    );
  }

  helpClipRenderInProgress = true;
  try {
    return await createHelpClipOnce(input);
  } finally {
    helpClipRenderInProgress = false;
  }
};
