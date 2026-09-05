import { z } from "zod";

import type { CatalogTool, ToolId } from "@/lib/catalog";
import type { GroundingStatus, ScreenshotGuide } from "@/lib/support-topics";

export type RecommendedTool = {
  tool: CatalogTool;
  reason: string;
};

export type RecommendationResponse = {
  recommendations: RecommendedTool[];
  source: "openrouter" | "catalog-fallback";
};

export type SharedGuidanceResponse = {
  message: string;
  teachingItems: ScreenshotGuide[];
  canGenerateHelpClip: boolean;
  lessonPlanId?: string;
  supportTopicId?: string;
  missingCoverage: string[];
  helpClipToken?: string;
};

export type ContextualQuestionResponse = {
  turnId: string;
  question: string;
  answer: string;
  groundingStatus: GroundingStatus;
  teachingItems: ScreenshotGuide[];
  canGenerateHelpClip: boolean;
  lessonPlanId?: string;
  supportTopicId?: string;
  resolvedToolIds: ToolId[];
  missingCoverage: string[];
  helpClipToken?: string;
};

export type QuestionHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ContextualTeachingTurn = ContextualQuestionResponse & {
  clip?: HelpClipResponse;
  clipError?: string;
  isGenerating?: boolean;
};

export type HelpClipResponse = {
  videoUrl: string;
  narration: string;
  label: "Training demonstration";
};

export const recommendationRequestSchema = z.object({
  scenario: z.string().trim().min(3).max(1_200),
});

const selectedToolIdsSchema = z
  .array(z.string())
  .min(1)
  .max(3)
  .refine((toolIds) => new Set(toolIds).size === toolIds.length, {
    message: "Select each tool only once.",
  });

export const sharedGuidanceRequestSchema = z.object({
  scenario: z.string().trim().min(3).max(1_200),
  toolIds: selectedToolIdsSchema,
});

const questionHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1_200),
});

const contextualToolIdsSchema = z
  .array(z.string())
  .max(3)
  .refine((toolIds) => new Set(toolIds).size === toolIds.length, {
    message: "Include each contextual tool only once.",
  });

export const contextualQuestionRequestSchema = z.object({
  scenario: z.string().trim().min(3).max(1_200),
  toolIds: contextualToolIdsSchema,
  question: z.string().trim().min(1).max(1_200),
  history: z.array(questionHistoryMessageSchema).max(20).default([]),
  priorScreenshotIds: z.array(z.string().trim().min(1).max(180)).max(10).default([]),
});

export const helpClipRequestSchema = z.object({
  scenario: z.string().trim().min(3).max(1_200),
  toolIds: selectedToolIdsSchema,
  lessonPlanId: z.string().trim().min(1).max(160),
  supportTopicId: z.string().trim().min(1).max(160),
  guidanceToken: z.string().min(1).max(20_000),
  question: z.string().trim().max(1_200).optional(),
});

export type SharedGuidanceRequest = z.infer<typeof sharedGuidanceRequestSchema> & {
  toolIds: ToolId[];
};

export type ContextualQuestionRequest = z.infer<
  typeof contextualQuestionRequestSchema
> & {
  toolIds: ToolId[];
};
