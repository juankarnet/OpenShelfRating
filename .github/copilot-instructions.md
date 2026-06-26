# Global Workspace Instructions

## Execution Profile
*   **Language:** Responses in Spanish. Internal artifacts in English.
*   **Tone:** Analytical, dry, concise, objective. No conversational filler or over-optimistic statements.
*   **Format:** Strict Markdown. Maximize bullet points and key-value pairs. Minimize prose.

## Agent Simulation Rules
*   When commanded to act as an agent from `.agent-workspace/agents/`, strictly assume its identity, constraints, and operational matrix.
*   Do not hallucinate context. Rely only on the files present in `.agent-workspace/docs/`.
*   Optimize tokens: Never repeat the entire prompt or history. Only output delta updates, conclusions, or required code snippets.

## SDD Governance Rules
*   Keep documents and implementation aligned with artifacts in `.agent-workspace/docs/`.
*   Treat `APPLICATION_CONTEXT.md` as the business/product context source of truth.
*   Treat `TECHNICAL_MANIFEST.md` as the technical architecture source of truth.
*   Treat `.agent-workspace/docs/spec/` as the canonical source of truth for functional specifications.
*   Preserve traceability from requirements to implementation and tests.
*   Prefer small, reviewable, incremental changes.

## Functional Source Hierarchy
*   Use `APPLICATION_CONTEXT.md` for product vision, boundaries, and business framing.
*   Use `.agent-workspace/docs/spec/` for testable functional requirements and acceptance criteria.
*   In case of conflict on functional behavior, specification files under `.agent-workspace/docs/spec/` prevail.

## Functional Specification Rules
*   Store every functional specification under `.agent-workspace/docs/spec/`.
*   Use one file per specification, with identifier-based names: `SPEC-XXXX.md`.
*   Each specification must be created from `.agent-workspace/docs/spec/SPEC_TEMPLATE.md`.
*   Every requirement inside a specification must use stable IDs (`REQ-`, `NFR-`, `AC-`, `RULE-`).
*   Do not close a functional milestone if required sections in the specification are incomplete.
*   Any implementation task must reference at least one specification ID.

## Scaffolding De-duplication Rules
*   Keep each idea in one canonical file only.
*   Use references, not repeated prose, in all other files.
*   Do not restate global policy inside milestone or agent files unless the rule is operationally different.
*   Prefer pointers to source-of-truth documents over copied content.

## Environment Variable Documentation Rule
*   Whenever a new environment variable is added, updated, or removed in code/configuration, update the corresponding section in `README.md` of the project root in the same change.
*   Keep variable purpose, default values (if any), and local-development examples synchronized with actual runtime behavior.
*   Do not leave undocumented environment variables in backend, web, mobile, or infra modules.

## Snapshot Discipline
*   Keep project-wide mutable state in `.agent-workspace/docs/PROJECT_STATE.md` only.
*   Agent files may reference the snapshot, but must not duplicate its current state.

## Milestone Sync Rule
*   Before switching Milestones, the user will explicitly state: `[SYNC: FILE_NAME]`.
*   Read the latest disk version of that file before generating the next response.

## Commit Message Convention Rule
*   For specification-scoped implementation commits, use this format: `SPEC-XXXX: <concise description of what was done>`.
*   Example: `SPEC-0002: implement global catalog backend baseline`.
*   Keep the description action-oriented and searchable to simplify historical tracking.

## Specification State Update Before Commit Rule
*   Before creating any `SPEC-XXXX` commit, update the corresponding specification status fields and `PROJECT_STATE.md` to reflect the real current state.
*   A specification-scoped commit is not complete if traceability/status updates are missing in the same commit.
