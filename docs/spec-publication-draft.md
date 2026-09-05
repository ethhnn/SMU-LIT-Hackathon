# Spec publication setup — superseded draft

The user selected Local Markdown and approved the three-ticket breakdown. The previous proposed GitHub setup is superseded by the active [local tracker convention](agents/issue-tracker.md). No GitHub issue is published or parent issue modified by this work.

The specification remains in [spec.md](spec.md). The local tracker contains one file per ticket, with explicit blocking references and ready-for-agent status. Tickets 01 and 02 are independent; ticket 03 remains blocked by both.

The single user-facing end-to-end testing seam is confirmed: exercise scenario entry, dynamic recommendations, tool selection, contextual help, coverage, and explicit clip requests through the Learner's flow. Use controlled AI/media outcomes for lightweight checks and inspect one real generated narrated clip. Only Help Focus remains; progress tracking and completion controls are outside scope.

The domain layout remains CONTEXT.md plus docs/ADRs. No additional agent configuration file is needed for the approved documentation-and-ticket task.
