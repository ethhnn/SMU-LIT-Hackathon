"use client";

import { FormEvent, useState } from "react";

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

const ScreenshotTeaching = ({ items }: { items: ScreenshotGuide[] }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="screenshot-teaching">
      {items.map((item) => (
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
            <strong>
              {item.evidenceStatus === "reviewed-instruction"
                ? "What this establishes:"
                : "What this screenshot shows:"}
            </strong>{" "}
            {item.expectedResult}
          </p>
        </section>
      ))}
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

  const resetComposer = () => {
    setSelectedToolIds([]);
    setGuidance(null);
    setQuestion("");
    setContextualTurns([]);
    setPendingQuestion("");
    setFailedQuestion("");
    setQuestionError("");
    setClip(null);
  };

  const requestGuidance = async (toolIds: ToolId[]) => {
    if (!activeScenario || toolIds.length === 0) {
      return;
    }

    setError("");
    setIsGuiding(true);
    try {
      const result = await postJson<SharedGuidanceResponse>("/api/guidance", {
        scenario: activeScenario,
        toolIds,
      });
      setGuidance(result);
    } catch (requestError) {
      setGuidance(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Shared contextual help is unavailable right now.",
      );
    } finally {
      setIsGuiding(false);
    }
  };

  const requestRecommendations = async (objective: string) => {
    const trimmed = objective.trim();
    if (trimmed.length < 3) {
      setError("Describe a short training objective first.");
      return;
    }

    setError("");
    setIsRecommending(true);
    resetComposer();
    setActiveScenario(trimmed);

    try {
      const result = await postJson<RecommendationResponse>("/api/recommend", {
        scenario: trimmed,
      });
      setRecommendationResult(result);
    } catch (requestError) {
      setRecommendationResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Recommendations are unavailable right now.",
      );
    } finally {
      setIsRecommending(false);
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

    updateTurn(turn.turnId, { isGenerating: true, clipError: undefined });
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

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="eyebrow">R&amp;T legal-tech hackathon MVP</div>
        <h1 id="page-title">Learn the right workflow for your task</h1>
        <p>
          Describe a software-training objective. The tutor recommends catalog
          tools, then creates Help Clips only from supplied screenshot scenes
          with server-controlled highlights and instructions.
        </p>
        <p className="notice" role="note">
          Training environment — do not enter confidential client or matter
          information.
        </p>
      </section>

      <section className="panel scenario-panel" aria-labelledby="scenario-heading">
        <div>
          <div className="eyebrow">1. Scenario</div>
          <h2 id="scenario-heading">What are you trying to do?</h2>
        </div>
        <form onSubmit={submitScenario} className="scenario-form">
          <label htmlFor="scenario">Describe your generic training objective</label>
          <textarea
            id="scenario"
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            placeholder="For example: I need to compare two versions of a supplier agreement and then find related Singapore judgments."
            rows={4}
          />
          <button type="submit" disabled={isRecommending}>
            {isRecommending ? "Finding suitable tools…" : "Recommend tools"}
          </button>
        </form>
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
      </section>

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

      {recommendationResult ? (
        <section className="panel recommendations" aria-labelledby="recommendation-heading">
          <div className="section-heading">
            <div>
              <div className="eyebrow">2. Recommendations</div>
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
              <div className="eyebrow">3. Shared Help Clip</div>
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
            {isGuiding ? <p>Preparing screenshot teaching and checking video coverage…</p> : null}
            {guidance ? <p>{guidance.message}</p> : null}
            {guidance?.missingCoverage.length ? (
              <ul className="coverage-limit">
                {guidance.missingCoverage.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </div>

          {guidance ? <ScreenshotTeaching items={guidance.teachingItems} /> : null}

          <button
            type="button"
            onClick={generateInitialHelpClip}
            disabled={!guidance?.canGenerateHelpClip || isGenerating}
          >
            {isGenerating
              ? "Generating shared Help Clip…"
              : guidance?.canGenerateHelpClip
                ? "Generate shared Help Clip"
                : "Shared Help Clip coverage pending"}
          </button>

          {clip ? <ClipResult clip={clip} /> : null}
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
                    <span>Tutor</span>
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
                        {turn.missingCoverage.map((item) => <li key={item}>{item}</li>)}
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
                    {turn.clip ? <ClipResult clip={turn.clip} /> : null}
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
                    <span>Tutor</span>
                    <p>Preparing an answer…</p>
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

            <form className="follow-up" onSubmit={askQuestion}>
              <label htmlFor="question">Ask your next question</label>
              <div>
                <input
                  id="question"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="For example: How do I filter cases from 2000 onwards?"
                />
                <button
                  type="submit"
                  disabled={Boolean(pendingQuestion) || !question.trim() || !activeScenario}
                >
                  Ask
                </button>
              </div>
            </form>
          </section>
      ) : null}
    </main>
  );
};
