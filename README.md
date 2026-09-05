# SMU-LIT-Hackathon
SMU LIT Hackathon Project

# AI-Powered Just-in-Time Legal Technology Tutor

An AI-powered training platform that helps lawyers learn how to use firm-approved technologies **in the context of real legal work**.

Instead of providing separate tutorials for individual tools, the platform begins with the lawyer's actual task, recommends suitable technologies, builds a cross-tool workflow, and automatically generates a short personalised audio-video tutorial showing how to complete that workflow.

---

## Problem

Law firms may introduce new technologies, tools, and processes, but successful adoption can still be difficult.

Common problems include:

* Training materials being scattered across different platforms.
* Lawyers needing to watch several tutorials to complete one task.
* Existing training being organised around **individual tools** rather than **real legal workflows**.
* Significant time being required to manually create short training videos.
* Lawyers being less willing to adopt unfamiliar tools when their relevance to daily work is unclear.

The project addresses the challenge:

> **How might law firms encourage their lawyers to successfully adopt and integrate new technologies, tools, processes and ways of working into their daily activities?**

---

## Proposed Solution

The platform changes the usual approach to technology training.

Instead of asking:

> "How do I use Tool X?"

The lawyer can ask:

> "How do I complete this legal task?"

For example:

> "I need to research how Singapore courts have interpreted a contractual clause and summarise the relevant cases."

The system then:

1. Understands the lawyer's task.
2. Recommends suitable firm-approved tools.
3. Explains the advantages and limitations of each tool.
4. Allows the lawyer to select their preferred tools.
5. Generates a workflow connecting those tools.
6. Creates a short personalised tutorial explaining the complete workflow.

---

## User Flow

```text
Lawyer enters legal scenario
        ↓
OpenAI understands the task
        ↓
Recommends suitable approved tools
        ↓
Shows advantages and limitations
        ↓
Lawyer selects preferred tools
        ↓
OpenAI generates cross-tool workflow
        ↓
Generate Tutorial
        ↓
Select verified screenshots / clips
        ↓
Generate storyboard, narration and captions
        ↓
Remotion renders tutorial
        ↓
OpenAI TTS generates narration
        ↓
FFmpeg produces final video
        ↓
Personalised short-form tutorial
```

---

## Example Use Case

### Scenario

A lawyer enters:

> "I need to find recent Singapore Supreme Court cases about contractual interpretation and summarise the relevant judgments."

The platform could recommend tools such as:

### LawNet / OpenLaw

**Advantages**

* Focused on Singapore legal materials.
* Provides access to Singapore judgments.
* Allows lawyers to review original judicial decisions.

**Limitations**

* Relevant cases may still need to be identified manually.
* Primarily supports legal research rather than summarisation.

### Firm Legal AI

**Advantages**

* Can quickly summarise selected judgments.
* Supports natural-language questions.
* Can help locate relevant sections within long documents.

**Limitations**

* AI-generated outputs may contain errors.
* Important conclusions should be checked against the original judgment.

### Internal Knowledge Base

**Advantages**

* Contains previous firm work, precedents, and templates.
* Provides organisation-specific knowledge.

**Limitations**

* Limited to information already stored internally.
* May not contain the newest cases.

The lawyer might choose:

```text
☑ LawNet / OpenLaw
☑ Firm Legal AI
☐ Internal Knowledge Base
```

The generated workflow could then be:

```text
LawNet
   ↓
Search relevant judgments
   ↓
Open relevant case
   ↓
Review original judgment
   ↓
Firm Legal AI
   ↓
Import selected judgment
   ↓
Generate summary
   ↓
Verify important conclusions against original judgment
```

The platform then creates **one tutorial covering the entire workflow**.

---

## Verified Tutorial Generation

The platform does **not** use generative video to recreate software interfaces.

Instead, it maintains a library of:

* Verified screenshots.
* Short recorded interaction clips.
* UI action metadata.

This prevents the generated tutorial from displaying hallucinated:

* Buttons.
* Menus.
* Interface layouts.
* Navigation steps.
* Software functionality.

The core design principle is:

```text
OpenAI
→ decides WHAT should be taught

Verified UI metadata
→ determines WHERE the action occurs

Remotion
→ determines HOW it is visually presented

FFmpeg
→ produces the final video
```

---

## Verified Asset Library

Each supported tool contains reusable interface assets.

Example:

```text
LawNet / OpenLaw
├── Search interface
├── Search results
├── Filter results
├── Judgment view
└── Judgment navigation

Firm Legal AI
├── Upload document
├── Analyse document
├── Ask question
├── Generate summary
└── Export output
```

Assets can be stored as either screenshots or short video clips.

### Screenshots

Best suited for:

* Button clicks.
* Menu highlighting.
* Search fields.
* Static interface explanations.
* Zooming into relevant information.

### Short Video Clips

Best suited for:

* Dropdown menus.
* Animations.
* Loading behaviour.
* Complex interactions.
* Multi-step UI sequences.

These assets are not complete tutorials.

They act as reusable **training building blocks** that can be combined dynamically depending on the user's task.

---

## UI Metadata

Each verified screen can contain metadata describing available actions.

Example:

```json
{
  "tool": "LawNet OpenLaw",
  "screen": "search_results",
  "actions": [
    {
      "id": "open_judgment",
      "label": "Open relevant judgment",
      "target": {
        "x": 420,
        "y": 315,
        "width": 510,
        "height": 55
      },
      "nextScreen": "judgment_view"
    }
  ]
}
```

This allows the tutorial renderer to accurately determine where to:

* Move the cursor.
* Highlight an element.
* Draw a circle.
* Place an arrow.
* Zoom into the interface.

---

## AI-Generated Storyboard

After the lawyer selects their tools, OpenAI creates a structured tutorial storyboard.

Example:

```json
{
  "title": "Researching and Summarising Contractual Interpretation Cases",
  "steps": [
    {
      "tool": "LawNet",
      "screen": "search",
      "action": "enter_query",
      "caption": "Search for relevant judgments",
      "narration": "Begin by searching for Singapore judgments relating to contractual interpretation."
    },
    {
      "tool": "LawNet",
      "screen": "search_results",
      "action": "open_judgment",
      "caption": "Open the relevant judgment",
      "narration": "Review the search results and open the judgment most relevant to your issue."
    },
    {
      "tool": "Firm Legal AI",
      "screen": "upload",
      "action": "upload_judgment",
      "caption": "Import the judgment",
      "narration": "Next, import the selected judgment into the firm's approved AI tool."
    },
    {
      "tool": "Firm Legal AI",
      "screen": "summary",
      "action": "generate_summary",
      "caption": "Generate a case summary",
      "narration": "Use the AI tool to produce an initial summary of the judgment."
    }
  ]
}
```

---

## Video Generation Pipeline

```text
Verified Screenshots / Video Clips
            +
OpenAI-Generated Storyboard
            +
OpenAI-Generated Narration
            +
OpenAI-Generated Captions
            ↓
         Remotion
            ↓
 ┌──────────────────────┐
 │ Cursor animations    │
 │ Highlights           │
 │ Circles              │
 │ Arrows               │
 │ Zooms                │
 │ Scene transitions    │
 │ Subtitles            │
 └──────────────────────┘
            ↓
       OpenAI TTS
            ↓
      Narration Audio
            ↓
         FFmpeg
            ↓
    Final MP4 Tutorial
```

---

## System Architecture

```text
                    USER SCENARIO
                         │
                         ▼
                    OPENAI API
                         │
                  Understand Task
                         │
                         ▼
                TOOL RECOMMENDATION
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           Tool A     Tool B     Tool C
              │          │          │
            Pros       Pros       Pros
            Cons       Cons       Cons
              └──────────┼──────────┘
                         ▼
                   USER SELECTION
                         │
                         ▼
                    OPENAI API
                         │
                 Generate Workflow
                         │
                         ▼
               VERIFIED ASSET LIBRARY
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    Screenshots      Video Clips     UI Metadata
         └───────────────┼───────────────┘
                         ▼
                    OPENAI API
                         │
                 Generate Storyboard
                 Generate Narration
                  Generate Captions
                         │
                  ┌──────┴──────┐
                  ▼             ▼
              Remotion      OpenAI TTS
                  │             │
                  └──────┬──────┘
                         ▼
                       FFmpeg
                         │
                         ▼
              PERSONALISED TUTORIAL
```

---

## Proposed Technology Stack

| Component        | Technology                   | Purpose                                                      |
| ---------------- | ---------------------------- | ------------------------------------------------------------ |
| Frontend         | Next.js / React              | User interface                                               |
| AI reasoning     | OpenAI API                   | Understand scenarios, recommend tools and generate workflows |
| Storyboard       | OpenAI API                   | Generate tutorial scenes, instructions and captions          |
| Narration        | OpenAI Text-to-Speech        | Generate tutorial voice                                      |
| Video rendering  | Remotion                     | Render animated tutorial scenes                              |
| Video processing | FFmpeg                       | Merge, trim and encode MP4 output                            |
| Database         | SQLite                       | Store tools, assets, actions and metadata                    |
| UI assets        | Verified screenshots / clips | Provide accurate interface visuals                           |

OpenAI is intended to be the project's **only generative AI provider**.

---

## Role of OpenAI

OpenAI is responsible for:

* Understanding the lawyer's scenario.
* Recommending suitable tools.
* Explaining advantages and limitations.
* Constructing cross-tool workflows.
* Selecting tutorial steps.
* Generating structured storyboards.
* Writing narration.
* Writing captions.
* Generating explanations.
* Determining which actions should be highlighted.
* Generating narration audio through text-to-speech.

OpenAI does **not** invent the software interface shown to the user.

The visual interface comes from verified assets.

---

## MVP Scope

The hackathon prototype does not need to support every legal platform.

A realistic MVP could contain:

```text
3 tools
×
5–8 verified actions per tool
=
Approximately 15–24 reusable actions
```

### Tool 1 — LawNet / OpenLaw

Possible actions:

* Search cases.
* Filter judgments.
* Open judgment.
* Navigate judgment.
* Identify relevant sections.

### Tool 2 — Legal AI

Possible actions:

* Upload judgment.
* Generate summary.
* Ask questions.
* Identify relevant sections.
* Export output.

### Tool 3 — Internal Knowledge System

Possible actions:

* Search internal precedents.
* Open previous matter.
* Find template.
* View previous analysis.
* Save relevant material.

These reusable actions can be combined into different workflows without requiring a manually recorded tutorial for every possible legal scenario.

---

## Key Innovation

Traditional legal technology training is generally:

```text
Tool A Tutorial
Tool B Tutorial
Tool C Tutorial
Tool D Tutorial
```

Our approach reverses this model:

```text
REAL-LIFE LEGAL TASK
        ↓
Understand task
        ↓
Recommend approved tools
        ↓
User selects tools
        ↓
Generate cross-tool workflow
        ↓
Create one personalised tutorial
```

The platform therefore shifts training from:

> **tool-centric learning**

to:

> **task-centric, just-in-time learning**

The important distinction is that the tutorial is generated around **what the lawyer is trying to accomplish**, rather than around a single piece of software.

---

## Why Not Fully Generative Video?

Fully generative video could recreate software interfaces inaccurately.

Possible issues include:

* Incorrect button names.
* Missing interface elements.
* Invented menus.
* Incorrect navigation.
* Different layouts.
* Hallucinated functionality.

For software education, users need to see the actual interface they will use.

The proposed approach therefore combines:

```text
Verified UI
+
Generative AI intelligence
+
Programmatic video generation
```

This aims to provide both:

* **Accuracy**
* **Personalisation**

---

## Value Proposition

> **Instead of training lawyers tool-by-tool, the platform starts from the lawyer's real-life task, recommends suitable approved technologies, allows the lawyer to choose their preferred workflow, and uses generative AI together with verified interface assets to automatically create a short personalised audio-video tutorial showing how those tools can be used together.**

Potential benefits include:

* Increased awareness of available technologies.
* Lower resistance to unfamiliar tools.
* Just-in-time learning.
* Faster technology adoption.
* Reduced manual creation of training videos.
* Greater use of approved firm technologies.
* Training that is more relevant to actual legal work.

---

## Project Status

**Current stage:** Hackathon prototype development and planning.

The MVP will focus on demonstrating:

1. Scenario understanding.
2. Tool recommendation.
3. Tool selection.
4. Cross-tool workflow generation.
5. Verified asset retrieval.
6. AI storyboard generation.
7. Automated tutorial rendering.
8. AI-generated narration.
9. Final MP4 generation.

---

## Next Steps

* [ ] Finalise the three tools included in the MVP.
* [ ] Define supported actions for each tool.
* [ ] Capture verified screenshots and interaction clips.
* [ ] Create UI action metadata.
* [ ] Build the tool and asset database.
* [ ] Implement scenario-to-tool recommendation.
* [ ] Implement workflow generation.
* [ ] Define the storyboard JSON schema.
* [ ] Build Remotion tutorial templates.
* [ ] Integrate OpenAI text-to-speech.
* [ ] Build the FFmpeg rendering pipeline.
* [ ] Connect the frontend to the generation pipeline.
* [ ] Test several real-life legal scenarios.
* [ ] Validate generated tutorials against the verified workflows.

---

## Disclaimer

This repository describes a **hackathon prototype concept**. Supported tools, APIs, workflows, interface assets, and implementation details may change as development progresses.
