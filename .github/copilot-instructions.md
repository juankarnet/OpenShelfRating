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

## Mandatory Context Read Rules (Per Action Type)

These reads are **mandatory** before taking the corresponding action. Do not skip or assume the content is already known.

### Before any implementation task (coding)
1.  Read `.agent-workspace/docs/PROJECT_STATE.md` — verify current milestone, active spec, and known constraints.
2.  Read the target `SPEC-XXXX/SPEC-XXXX.md` — confirm the exact REQ/RULE/AC being addressed.
3.  Read the target `SPEC-XXXX/SPEC-XXXX_TechnicalPlan.md` — check phase status and pending items.

### Before writing or updating a specification
1.  Read `.agent-workspace/docs/APPLICATION_CONTEXT.md` — align with business vision and BR rules.
2.  Read `.agent-workspace/docs/TECHNICAL_MANIFEST.md` — confirm stack constraints and architecture patterns.
3.  Read `.agent-workspace/docs/PROJECT_STATE.md` — verify there is no conflicting active spec.
4.  Read `.agent-workspace/docs/spec/SPEC_TEMPLATE.md` — use as structural baseline.

### Before writing tests
1.  Read the target `SPEC-XXXX/SPEC-XXXX.md` — derive test cases from AC-XXX and RULE-XXX.
2.  Read the target `SPEC-XXXX/SPEC-XXXX_TechnicalPlan.md` — identify which phases are implemented and testable.

### Before creating a SPEC-XXXX commit
1.  Read `.agent-workspace/docs/PROJECT_STATE.md` — read current state before any edit.
2.  Read `SPEC-XXXX/SPEC-XXXX.md` and `SPEC-XXXX/SPEC-XXXX_TechnicalPlan.md` — verify both are up to date.
3.  Run `powershell -ExecutionPolicy Bypass -File .agent-workspace/scripts/validate-gates.ps1 -Mode spec-sync`.
4.  If `spec-sync` fails, fix findings before proceeding.

### Before switching milestones
1.  Wait for explicit `[SYNC: FILE_NAME]` from the user.
2.  Read the named file from disk before generating any response.

---

## Mandatory SPEC Sync Checklist (Operational)
*   For every `SPEC-XXXX` implementation commit, update all applicable files in the same change set:
	*   `.agent-workspace/docs/spec/SPEC-XXXX/SPEC-XXXX.md` (metadata status/version/date + progress/traceability notes).
	*   `.agent-workspace/docs/spec/SPEC-XXXX/SPEC-XXXX_TechnicalPlan.md` (task/progress state, completed vs pending work).
	*   `.agent-workspace/docs/PROJECT_STATE.md` (milestone gate, spec status table, latest delivery snapshot).
*   Before proposing or creating any `SPEC-XXXX` commit, run:
	*   `powershell -ExecutionPolicy Bypass -File .agent-workspace/scripts/validate-gates.ps1 -Mode spec-sync`
*   `spec-sync` is an active sync gate: it must update SPEC metadata and TechnicalPlan execution status when needed, and then update `.agent-workspace/docs/PROJECT_STATE.md` in the same pass.
*   If `spec-sync` fails, do not proceed with commit until findings are fixed in the same change set.
*   Do not use empty commits as a substitute for document synchronization.
*   If implementation is partial, status must be explicit (`In Progress` / `Pending Validation`) and must include concrete pending items.
*   If implementation is complete, include validation evidence summary (compile/test/e2e) before setting final `Implemented` status.
