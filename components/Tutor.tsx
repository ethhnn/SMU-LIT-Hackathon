"use client";

import { FormEvent, useRef, useState } from "react";

import type { ToolId } from "@/lib/catalog";
import type {
  ContextualQuestionResponse,
  ContextualTeachingTurn,
  HelpClipResponse,
  QuestionHistoryMessage,
  RecommendationResponse,
  SharedGuidanceResponse,
} from "@/lib/contracts";
import type { ScreenshotGuide } from "@/lib/support-topics";
import { getContextualHistoryMessageLimit } from "@/lib/context-window";

const SAMPLES = [
  {
    label: "Find a judgment",
    scenario:
      "A colleague has given me a public Singapore judgment name. I need to locate and open it for a training exercise.",
  },
  {
    label: "Compare documents",
    scenario:
      "I need to compare two versions of a supplier agreement and identify the changes.",
  },
  {
    label: "Combined task",
    scenario:
      "For a training exercise, I need to compare two versions of a supplier agreement, organize the related case documents, and find public Singapore judgments relevant to an indemnity clause that changed.",
  },
] as const;

type ApiError = { error?: string };

type LocalVideo = {
  name: string;
  url: string;
  sizeBytes: number;
  updatedAt: string;
};

const OPENROUTER_CONNECTION_MESSAGE =
  "I could not connect to OpenRouter, so screenshot interpretation and video generation are temporarily unavailable. Check network access and retry.";

const displayGuidanceMessage = (message: string) =>
  message.includes(OPENROUTER_CONNECTION_MESSAGE)
    ? "L.A.R.A could not connect to OpenRouter. Screenshot guidance and video generation are temporarily unavailable; check the connection and retry."
    : message;

const consolidateCoverageMessages = (items: string[]) => {
  const repeatedText =
    "no complete screenshot route with validated highlights was confirmed for this objective. The combined video remains unavailable until every selected tool has at least one grounded scene.";
  const matchingTools = items.flatMap((item) => {
    const marker = `: ${repeatedText}`;
    return item.endsWith(marker) ? [item.slice(0, -marker.length)] : [];
  });
  const otherItems = items.filter(
    (item) => !item.endsWith(`: ${repeatedText}`),
  );

  if (matchingTools.length === 0) {
    return items;
  }

  const toolList = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(matchingTools);

  return [
    `No complete screenshot route with validated highlights was confirmed for ${toolList}. The combined video remains unavailable until every selected tool has at least one grounded scene.`,
    ...otherItems,
  ];
};

const postJson = async <T,>(url: string, payload: unknown): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as T & ApiError;

  if (!response.ok) {
    throw new Error(data.error || "The request could not be completed.");
  }

  return data;
};

const GenerationProgress = ({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) => (
  <div className="generation-progress" role="status" aria-live="polite">
    <div className="generation-progress-copy">
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
    <div
      className="generation-progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="generation-progress-bar" />
    </div>
  </div>
);

const ScreenshotTeaching = ({ items }: { items: ScreenshotGuide[] }) => {
  const toolGroups = items.reduce<Array<{
    toolId: ToolId;
    toolName: string;
    items: ScreenshotGuide[];
  }>>((groups, item) => {
    const existing = groups.find((group) => group.toolId === item.toolId);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({
        toolId: item.toolId,
        toolName: item.toolName,
        items: [item],
      });
    }
    return groups;
  }, []);
  const [selectedToolTab, setSelectedToolTab] = useState<ToolId | undefined>(
    toolGroups[0]?.toolId,
  );
  if (items.length === 0) {
    return null;
  }
  const activeGroup =
    toolGroups.find((group) => group.toolId === selectedToolTab) || toolGroups[0];

  return (
    <div className="screenshot-teaching">
      {toolGroups.length > 1 ? (
        <div className="screenshot-tool-tabs" role="tablist" aria-label="Screenshot guides by tool">
          {toolGroups.map((group) => (
            <button
              aria-controls={`screenshot-panel-${group.toolId}`}
              aria-selected={activeGroup.toolId === group.toolId}
              className={activeGroup.toolId === group.toolId ? "active" : undefined}
              id={`screenshot-tab-${group.toolId}`}
              key={group.toolId}
              onClick={() => setSelectedToolTab(group.toolId)}
              role="tab"
              type="button"
            >
              {group.toolName} ({Math.min(group.items.length, 3)})
            </button>
          ))}
        </div>
      ) : null}
      <div
        aria-labelledby={toolGroups.length > 1 ? `screenshot-tab-${activeGroup.toolId}` : undefined}
        id={`screenshot-panel-${activeGroup.toolId}`}
        role={toolGroups.length > 1 ? "tabpanel" : undefined}
      >
      {activeGroup.items.slice(0, 3).map((item) => (
        <section className="teaching-item" key={item.id}>
          <div className="teaching-heading">
            <div>
              <div className="eyebrow">Screenshot teaching · {item.toolName}</div>
              <h3>{item.title}</h3>
            </div>
            <span className={`grounding-badge ${item.evidenceStatus}`}>
              {item.evidenceStatus === "reviewed-instruction"
                ? "Reviewed instruction"
                : "Screenshot observation"}
            </span>
          </div>
          <div className="core-instruction">
            <span>How to proceed</span>
            {item.instruction}
          </div>
          <figure>
            <div className="annotated-screenshot">
              <img src={item.screenshot} alt={`${item.toolName}: ${item.title}`} />
              <span
                className="screenshot-highlight"
                aria-hidden="true"
                style={{
                  left: `${(item.highlight.x / item.sourceWidth) * 100}%`,
                  top: `${(item.highlight.y / item.sourceHeight) * 100}%`,
                  width: `${(item.highlight.width / item.sourceWidth) * 100}%`,
                  height: `${(item.highlight.height / item.sourceHeight) * 100}%`,
                }}
              />
            </div>
            <figcaption>{item.caption}</figcaption>
          </figure>
          <p className="expected-result">
            <strong>Expected result:</strong>{" "}
            {item.expectedResult}
          </p>
        </section>
      ))}
      </div>
    </div>
  );
};

const ClipResult = ({ clip }: { clip: HelpClipResponse }) => (
  <section className="clip-result">
    <div className="eyebrow">Generated Help Clip</div>
    <h3>{clip.label}</h3>
    <video controls preload="metadata" aria-label="Generated shared Help Clip">
      <source src={clip.videoUrl} type="video/mp4" />
      Your browser cannot play this training video.
    </video>
    <details>
      <summary>View narration</summary>
      <p>{clip.narration}</p>
    </details>
  </section>
);

export const Tutor = () => {
  const [activeView, setActiveView] = useState<"chat" | "gallery">("chat");
  const [scenario, setScenario] = useState("");
  const [activeScenario, setActiveScenario] = useState("");
  const [recommendationResult, setRecommendationResult] =
    useState<RecommendationResponse | null>(null);
  const [selectedToolIds, setSelectedToolIds] = useState<ToolId[]>([]);
  const [guidance, setGuidance] = useState<SharedGuidanceResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [contextualTurns, setContextualTurns] = useState<ContextualTeachingTurn[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [failedQuestion, setFailedQuestion] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [clip, setClip] = useState<HelpClipResponse | null>(null);
  const [error, setError] = useState("");
  const [isRecommending, setIsRecommending] = useState(false);
  const [isGuiding, setIsGuiding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [galleryVideos, setGalleryVideos] = useState<LocalVideo[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const recommendationRequestId = useRef(0);
  const guidanceRequestId = useRef(0);

  const resetComposer = () => {
    guidanceRequestId.current += 1;
    setSelectedToolIds([]);
    setGuidance(null);
    setQuestion("");
    setContextualTurns([]);
    setPendingQuestion("");
    setFailedQuestion("");
    setQuestionError("");
    setClip(null);
    setIsGuiding(false);
  };

  const startNewChat = () => {
    recommendationRequestId.current += 1;
    resetComposer();
    setActiveView("chat");
    setScenario("");
    setActiveScenario("");
    setRecommendationResult(null);
    setError("");
    setIsRecommending(false);
  };

  const openGallery = async () => {
    setActiveView("gallery");
    setIsLoadingGallery(true);
    setGalleryError("");

    try {
      const response = await fetch("/api/videos", { cache: "no-store" });
      const data = (await response.json()) as { videos?: LocalVideo[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "The local video gallery could not be loaded.");
      }
      setGalleryVideos(data.videos ?? []);
    } catch (requestError) {
      setGalleryError(
        requestError instanceof Error
          ? requestError.message
          : "The local video gallery could not be loaded.",
      );
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const requestGuidance = async (toolIds: ToolId[]) => {
    if (!activeScenario || toolIds.length === 0) {
      return;
    }

    const requestId = ++guidanceRequestId.current;
    setError("");
    setGuidance(null);
    setClip(null);
    setIsGuiding(true);
    try {
      const result = await postJson<SharedGuidanceResponse>("/api/guidance", {
        scenario: activeScenario,
        toolIds,
      });
      if (requestId === guidanceRequestId.current) {
        setGuidance(result);
      }
    } catch (requestError) {
      if (requestId === guidanceRequestId.current) {
        setGuidance(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Shared contextual help is unavailable right now.",
        );
      }
    } finally {
      if (requestId === guidanceRequestId.current) {
        setIsGuiding(false);
      }
    }
  };

  const requestRecommendations = async (objective: string) => {
    const trimmed = objective.trim();
    if (trimmed.length < 3) {
      setError("Describe a short training objective first.");
      return;
    }

    const requestId = ++recommendationRequestId.current;
    setError("");
    setIsRecommending(true);
    resetComposer();
    setActiveScenario(trimmed);
    setScenario("");

    try {
      const result = await postJson<RecommendationResponse>("/api/recommend", {
        scenario: trimmed,
      });
      if (requestId === recommendationRequestId.current) {
        setRecommendationResult(result);
      }
    } catch (requestError) {
      if (requestId === recommendationRequestId.current) {
        setRecommendationResult(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Recommendations are unavailable right now.",
        );
      }
    } finally {
      if (requestId === recommendationRequestId.current) {
        setIsRecommending(false);
      }
    }
  };

  const submitScenario = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void requestRecommendations(scenario);
  };

  const selectSample = (sampleScenario: string) => {
    setScenario(sampleScenario);
    void requestRecommendations(sampleScenario);
  };

  const toggleTool = (toolId: ToolId) => {
    if (!recommendationResult) {
      return;
    }

    const selected = new Set(selectedToolIds);
    if (selected.has(toolId)) {
      selected.delete(toolId);
    } else {
      selected.add(toolId);
    }
    const nextToolIds = recommendationResult.recommendations
      .map((recommendation) => recommendation.tool.id)
      .filter((id): id is ToolId => selected.has(id));

    setSelectedToolIds(nextToolIds);
    setGuidance(null);
    setClip(null);
    setQuestion("");
    setContextualTurns([]);
    setPendingQuestion("");
    setFailedQuestion("");
    setQuestionError("");
    setError("");
    if (nextToolIds.length > 0) {
      void requestGuidance(nextToolIds);
    } else {
      guidanceRequestId.current += 1;
      setIsGuiding(false);
    }
  };

  const questionHistory = (): QuestionHistoryMessage[] =>
    contextualTurns
      .flatMap((turn) => [
        { role: "user" as const, content: turn.question },
        { role: "assistant" as const, content: turn.answer },
      ])
      .slice(-getContextualHistoryMessageLimit());

  const contextualToolIds = (): ToolId[] => {
    if (selectedToolIds.length > 0) {
      return selectedToolIds;
    }

    return (
      recommendationResult?.recommendations.map(
        (recommendation) => recommendation.tool.id,
      ) ?? []
    );
  };

  const priorScreenshotIds = (): string[] => {
    const ids = [
      ...(guidance?.teachingItems ?? []),
      ...contextualTurns.flatMap((turn) => turn.teachingItems),
    ].flatMap((item) => (item.screenshotAssetId ? [item.screenshotAssetId] : []));

    return [...new Set(ids)].slice(-10);
  };

  const requestContextualAnswer = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || !activeScenario || pendingQuestion) {
      return;
    }

    setQuestion("");
    setQuestionError("");
    setFailedQuestion("");
    setPendingQuestion(trimmed);
    try {
      const result = await postJson<ContextualQuestionResponse>(
        "/api/contextual-question",
        {
          scenario: activeScenario,
          toolIds: contextualToolIds(),
          question: trimmed,
          history: questionHistory(),
          priorScreenshotIds: priorScreenshotIds(),
        },
      );
      setContextualTurns((turns) => [...turns, result]);
    } catch (requestError) {
      setFailedQuestion(trimmed);
      setQuestionError(
        requestError instanceof Error
          ? requestError.message
          : "The contextual answer is unavailable right now.",
      );
    } finally {
      setPendingQuestion("");
    }
  };

  const askQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void requestContextualAnswer(question);
  };

  const generateInitialHelpClip = async () => {
    if (
      !guidance?.canGenerateHelpClip ||
      !guidance.lessonPlanId ||
      !guidance.supportTopicId ||
      !guidance.helpClipToken ||
      selectedToolIds.length === 0
    ) {
      return;
    }

    setError("");
    setClip(null);
    setIsGenerating(true);
    try {
      const result = await postJson<HelpClipResponse>("/api/help-clip", {
        scenario: activeScenario,
        toolIds: selectedToolIds,
        lessonPlanId: guidance.lessonPlanId,
        supportTopicId: guidance.supportTopicId,
        guidanceToken: guidance.helpClipToken,
      });
      setClip(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The Help Clip could not be generated. Please retry.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTurn = (turnId: string, changes: Partial<ContextualTeachingTurn>) =>
    setContextualTurns((turns) =>
      turns.map((turn) => (turn.turnId === turnId ? { ...turn, ...changes } : turn)),
    );

  const generateTurnHelpClip = async (turn: ContextualTeachingTurn) => {
    if (
      !turn.canGenerateHelpClip ||
      !turn.lessonPlanId ||
      !turn.supportTopicId ||
      !turn.helpClipToken
    ) {
      return;
    }

    updateTurn(turn.turnId, {
      isGenerating: true,
      clip: undefined,
      clipError: undefined,
    });
    try {
      const result = await postJson<HelpClipResponse>("/api/help-clip", {
        scenario: activeScenario,
        toolIds: turn.resolvedToolIds,
        lessonPlanId: turn.lessonPlanId,
        supportTopicId: turn.supportTopicId,
        guidanceToken: turn.helpClipToken,
        question: turn.question,
      });
      updateTurn(turn.turnId, {
        clip: result,
        clipError: undefined,
        isGenerating: false,
      });
    } catch (requestError) {
      updateTurn(turn.turnId, {
        clipError:
          requestError instanceof Error
            ? requestError.message
            : "The Help Clip could not be generated. Please retry.",
        isGenerating: false,
      });
    }
  };

  const selectedTools =
    recommendationResult?.recommendations.filter((recommendation) =>
      selectedToolIds.includes(recommendation.tool.id),
    ) ?? [];
  const guidanceConnectionFailed = Boolean(
    guidance?.message.includes(OPENROUTER_CONNECTION_MESSAGE),
  );
  const guidanceCoverageMessages = consolidateCoverageMessages(
    guidance?.missingCoverage ?? [],
  );

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="L.A.R.A navigation">
        <div className="sidebar-brand">
          <img src="/lara-logo.png" alt="L.A.R.A" />
        </div>
        <button className="new-chat-button" type="button" onClick={startNewChat}>
          <span aria-hidden="true">＋</span>
          New chat
        </button>
        <button
          className={`sidebar-button ${activeView === "gallery" ? "active" : ""}`}
          type="button"
          onClick={() => void openGallery()}
        >
          <span aria-hidden="true">▶</span>
          Video gallery
        </button>
        <div className="sidebar-spacer" />
        <p className="sidebar-caption">Legal Adoption &amp; Recommendation Assistant</p>
      </aside>

      <main className="shell">
        <header className="topbar">
          <strong>L.A.R.A</strong>
          <span>{activeView === "gallery" ? "Video gallery" : "Legal technology guidance"}</span>
        </header>

        <div className="chat-content" hidden={activeView !== "chat"}>
          {!activeScenario ? (
            <section className="hero" aria-labelledby="page-title">
              <img
                className="hero-logo"
                src="/lara-logo.png"
                alt="L.A.R.A — Legal Adoption & Recommendation Assistant"
              />
              <h1 id="page-title">How can I help with your legal workflow?</h1>
              <p>
                Describe what you need to do. L.A.R.A will recommend suitable tools
                and guide you with grounded screenshots and Help Clips.
              </p>
            </section>
          ) : null}

      {error ? (
        <div className="alert" role="alert">
          {error}
          {guidance?.canGenerateHelpClip && !clip && !isGenerating ? (
            <button type="button" className="link-button" onClick={generateInitialHelpClip}>
              Retry video
            </button>
          ) : null}
        </div>
      ) : null}

      {activeScenario ? (
        <div className="user-prompt" aria-label="Your training objective">
          <span>You</span>
          <p>{activeScenario}</p>
        </div>
      ) : null}

      {isRecommending ? (
        <div className="assistant-progress">
          <GenerationProgress
            label="Finding suitable tools"
            detail="L.A.R.A is interpreting your objective."
          />
        </div>
      ) : null}

      {recommendationResult ? (
        <section className="panel recommendations" aria-labelledby="recommendation-heading">
          <div className="section-heading">
            <div>
              <div className="eyebrow">L.A.R.A</div>
              <h2 id="recommendation-heading">Suitable technologies</h2>
            </div>
            <span className="source-note">
              {recommendationResult.source === "openrouter"
                ? "AI interpreted this scenario"
                : "Catalog fallback"}
            </span>
          </div>
          {recommendationResult.recommendations.length === 0 ? (
            <p className="no-results">
              No curated tool clearly matches that objective yet. Rephrase it
              as a software task or choose a sample scenario.
            </p>
          ) : (
            <div className="card-grid">
              {recommendationResult.recommendations.map((recommendation, index) => {
                const checked = selectedToolIds.includes(recommendation.tool.id);
                return (
                  <article className="tool-card" key={recommendation.tool.id}>
                    <div className="card-topline">
                      <h3>{index + 1}. {recommendation.tool.name}</h3>
                      <span className="coverage-badge">
                        {recommendation.tool.coverageLabel}
                      </span>
                    </div>
                    <p className="intended-use">{recommendation.tool.intendedUse}</p>
                    <p>{recommendation.reason}</p>
                    <div className="pros-cons">
                      <div>
                        <h4>Pros</h4>
                        <ul>
                          {recommendation.tool.pros.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h4>Limits</h4>
                        <ul>
                          {recommendation.tool.cons.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                    <label className="tool-select">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTool(recommendation.tool.id)}
                      />
                      <span>Include in shared Help Clip</span>
                    </label>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {selectedTools.length > 0 ? (
        <section className="panel shared-composer" aria-labelledby="composer-heading">
          <div className="section-heading">
            <div>
              <div className="eyebrow">L.A.R.A · Shared Help Clip</div>
              <h2 id="composer-heading">Create one tutorial clip</h2>
            </div>
            <span className="focus-chip">
              {selectedTools.length} {selectedTools.length === 1 ? "tool" : "tools"} selected
            </span>
          </div>
          <div className="selected-tool-list" aria-label="Tools selected for the shared Help Clip">
            {selectedTools.map((recommendation) => (
              <span key={recommendation.tool.id}>
                {recommendation.tool.name}
              </span>
            ))}
          </div>
          <div className="shared-guidance" aria-live="polite">
            {isGuiding ? (
              <GenerationProgress
                label="Generating screenshot guides"
                detail="Selecting, ordering, and validating every screenshot before display."
              />
            ) : null}
            {!isGuiding && guidance ? <p>{displayGuidanceMessage(guidance.message)}</p> : null}
            {!isGuiding && !guidanceConnectionFailed && guidanceCoverageMessages.length ? (
              <ul className="coverage-limit">
                {guidanceCoverageMessages.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </div>

          {!isGuiding && guidance ? (
            <ScreenshotTeaching items={guidance.teachingItems} />
          ) : null}

          {!isGuiding && guidance ? (
            <button
              type="button"
              onClick={generateInitialHelpClip}
              disabled={!guidance.canGenerateHelpClip || isGenerating}
            >
              {isGenerating
                ? "Generating shared Help Clip…"
                : guidance.canGenerateHelpClip
                  ? "Generate shared Help Clip"
                  : "Shared Help Clip coverage pending"}
            </button>
          ) : null}

          {isGenerating ? (
            <GenerationProgress
              label="Generating shared Help Clip"
              detail="Creating narration and rendering all validated scenes into one video."
            />
          ) : null}

          {!isGenerating && clip ? <ClipResult clip={clip} /> : null}
        </section>
      ) : null}

      {recommendationResult ? (
          <section className="panel contextual-chat" aria-labelledby="contextual-heading">
            <div className="chat-heading">
              <div className="eyebrow">Continue learning</div>
              <h2 id="contextual-heading">Ask a contextual training question</h2>
              <p>
                {selectedToolIds.length > 0
                  ? "Your checked tools are used as context for each answer."
                  : "No tools are checked, so the recommended tools are used as context. Tick tools above to narrow the answer."}
              </p>
            </div>

            <div className="conversation" aria-live="polite">
              {contextualTurns.map((turn) => (
                <article className="teaching-turn" key={turn.turnId}>
                  <div className="chat-message learner-message">
                    <span>You</span>
                    <p>{turn.question}</p>
                  </div>
                  <div className="chat-message tutor-message">
                    <span>L.A.R.A</span>
                    <p>{turn.answer}</p>
                    <span className={`grounding-badge ${turn.groundingStatus}`}>
                      {turn.groundingStatus === "reviewed-instruction"
                        ? "Reviewed instruction"
                        : turn.groundingStatus === "screenshot-observation"
                          ? "Screenshot observation"
                          : "Coverage-limited answer"}
                    </span>
                    <ScreenshotTeaching items={turn.teachingItems} />
                    {turn.missingCoverage.length ? (
                      <ul className="coverage-limit">
                        {consolidateCoverageMessages(turn.missingCoverage).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void generateTurnHelpClip(turn)}
                      disabled={!turn.canGenerateHelpClip || turn.isGenerating}
                    >
                      {turn.isGenerating
                        ? "Generating Help Clip…"
                        : turn.canGenerateHelpClip
                          ? "Generate Help Clip for this answer"
                          : "Video coverage not available for this answer"}
                    </button>
                    {turn.isGenerating ? (
                      <GenerationProgress
                        label="Generating Help Clip"
                        detail="Creating narration and rendering this answer's validated scenes."
                      />
                    ) : null}
                    {turn.clipError ? (
                      <div className="inline-error" role="alert">
                        {turn.clipError}
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => void generateTurnHelpClip(turn)}
                        >
                          Retry video
                        </button>
                      </div>
                    ) : null}
                    {!turn.isGenerating && turn.clip ? <ClipResult clip={turn.clip} /> : null}
                  </div>
                </article>
              ))}

              {pendingQuestion ? (
                <article className="teaching-turn pending-turn">
                  <div className="chat-message learner-message">
                    <span>You</span>
                    <p>{pendingQuestion}</p>
                  </div>
                  <div className="chat-message tutor-message">
                    <span>L.A.R.A</span>
                    <GenerationProgress
                      label="Generating screenshot guides"
                      detail="Preparing the answer and validating all relevant screenshots before display."
                    />
                  </div>
                </article>
              ) : null}
            </div>

            {questionError ? (
              <div className="inline-error" role="alert">
                {questionError}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => void requestContextualAnswer(failedQuestion)}
                >
                  Retry answer
                </button>
              </div>
            ) : null}

          </section>
      ) : null}

      <section className="panel scenario-panel" aria-label="Message composer">
        <form
          onSubmit={recommendationResult ? askQuestion : submitScenario}
          className="scenario-form"
        >
          <label className="sr-only" htmlFor={recommendationResult ? "question" : "scenario"}>
            {recommendationResult
              ? "Ask your next question"
              : "Describe your generic training objective"}
          </label>
          <textarea
            id={recommendationResult ? "question" : "scenario"}
            value={recommendationResult ? question : scenario}
            onChange={(event) =>
              recommendationResult
                ? setQuestion(event.target.value)
                : setScenario(event.target.value)
            }
            placeholder={
              recommendationResult
                ? "Ask a follow-up about these tools"
                : "Message L.A.R.A"
            }
            rows={2}
          />
          <button
            type="submit"
            disabled={
              recommendationResult
                ? Boolean(pendingQuestion) || !question.trim() || !activeScenario
                : isRecommending
            }
          >
            <span className="submit-label">
              {recommendationResult
                ? "Ask"
                : isRecommending
                  ? "Finding suitable tools…"
                  : "Recommend tools"}
            </span>
            <span className="send-icon" aria-hidden="true">↑</span>
          </button>
        </form>
        {!activeScenario ? (
          <div className="sample-row" aria-label="Sample scenarios">
            <span>Try a sample:</span>
            {SAMPLES.map((sample) => (
              <button
                key={sample.label}
                type="button"
                className="secondary-button"
                onClick={() => selectSample(sample.scenario)}
                disabled={isRecommending}
              >
                {sample.label}
              </button>
            ))}
          </div>
        ) : null}
      </section>
        </div>
        <div className="gallery-content" hidden={activeView !== "gallery"}>
          <div className="gallery-heading">
            <div>
              <div className="eyebrow">Local library</div>
              <h1>Video gallery</h1>
              <p>Help Clips generated by L.A.R.A and stored on this computer.</p>
            </div>
            <button type="button" className="secondary-button" onClick={() => void openGallery()}>
              Refresh
            </button>
          </div>

          {isLoadingGallery ? (
            <GenerationProgress
              label="Loading video gallery"
              detail="Checking locally generated clips."
            />
          ) : null}

          {!isLoadingGallery && galleryError ? (
            <div className="alert" role="alert">{galleryError}</div>
          ) : null}

          {!isLoadingGallery && !galleryError && galleryVideos.length === 0 ? (
            <div className="empty-gallery">
              <span aria-hidden="true">▶</span>
              <h2>No generated videos yet</h2>
              <p>Your locally generated Help Clips will appear here automatically.</p>
              <button type="button" onClick={startNewChat}>Create a Help Clip</button>
            </div>
          ) : null}

          {!isLoadingGallery && !galleryError && galleryVideos.length > 0 ? (
            <div className="video-grid">
              {galleryVideos.map((video) => (
                <article className="video-card" key={video.name}>
                  <video controls preload="metadata" aria-label={`Generated video: ${video.name}`}>
                    <source src={video.url} type="video/mp4" />
                    Your browser cannot play this video.
                  </video>
                  <div className="video-card-copy">
                    <h2>{video.name.replace(/\.mp4$/i, "").replaceAll("-", " ")}</h2>
                    <p>
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(video.updatedAt))}
                      {" · "}
                      {(video.sizeBytes / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
        <footer className="privacy-footer">
          L.A.R.A can make mistakes. Do not enter confidential client or matter information.
        </footer>
      </main>
    </div>
  );
};
