# Blueprint: State 0 - System Inception

## Workspace Scaffold Reference

```text
.
├── .github/
│   └── copilot-instructions.md
├── .agent-workspace/
│   ├── INCEPTION_SCRIPT.md
│   ├── STATE_1_SPEC_BASELINE.md
│   ├── agents/
│   │   ├── business_agent.md
│   │   ├── ba_agent.md
│   │   ├── architect_agent.md
│   │   ├── dev_agent.md
│   │   └── qa_agent.md
│   ├── scripts/
│   │   └── validate-gates.ps1
│   └── docs/
│       ├── APPLICATION_CONTEXT.md
│       ├── PROJECT_STATE.md
│       ├── TECHNICAL_MANIFEST.md
│       └── spec/
│           ├── README.md
│           └── SPEC_TEMPLATE.md
```

## Lifecycle Rules
*   **Objective:** Mature the system concept through two specific gates (Functional and Technical) before active development.
*   **Context Rule:** Every gate must update the documents inside `.agent-workspace/docs/`.
*   **Policy Source:** Interaction and de-duplication rules are defined in `.github/copilot-instructions.md` and are not duplicated here.

## Canonical Sources
*   **Global Policy:** `.github/copilot-instructions.md`
*   **Project Snapshot:** `.agent-workspace/docs/PROJECT_STATE.md`
*   **Functional Context:** `.agent-workspace/docs/APPLICATION_CONTEXT.md`
*   **Functional Specifications:** `.agent-workspace/docs/spec/*.md`
*   **Technical Context:** `.agent-workspace/docs/TECHNICAL_MANIFEST.md`
*   **Orchestration:** `.agent-workspace/INCEPTION_SCRIPT.md`
*   **Post-Inception Specification Flow:** `.agent-workspace/STATE_1_SPEC_BASELINE.md`
*   **Agent Behavior:** `.agent-workspace/agents/*.md`

## Completion Gates
*   **Functional Gate:** `APPLICATION_CONTEXT.md` sections 1-4 complete, `PROJECT_STATE.md` updated, no placeholder tokens remain in the functional artifact.
*   **Technical Gate:** `TECHNICAL_MANIFEST.md` sections 1-4 complete, architect/dev/qa specialization blocks rewritten, `PROJECT_STATE.md` updated, no placeholder tokens remain in milestone-locked artifacts.
*   **Validation Command:** `powershell -ExecutionPolicy Bypass -File .agent-workspace/scripts/validate-gates.ps1 -Mode functional|technical`.

## Copilot Meeting Pattern
*   **Mode:** Prompt one agent at a time.
*   **Turn Limit:** Copilot responses must stay under 15 lines unless a document update is explicitly required.
*   **Flow:** Human injects idea -> Copilot answers only as one agent -> Human validates/corrects -> next agent responds.
*   **Prohibition:** Do not simulate a four-way debate in a single chat turn.

---

## [MILESTONE 0.1: FUNCTIONAL ALIGNMENT]
*   **Goal:** Refine product vision, boundaries, and high-level rules.
*   **Active Squad:** Human (Lead), Business, BA, Architect.
*   **Protocol:**
	1. Human feeds raw requirements/features.
	2. `business_agent.md` validates ROI, MVP scoping, and value leaks.
	3. `ba_agent.md` defines capabilities, user flows, and system logic.
	4. `architect_agent.md` sets conceptual boundaries and external interfaces.
*   **Output:** Produce/Update `.agent-workspace/docs/APPLICATION_CONTEXT.md`.
*   **Gateway:** Human validation -> Git Commit: `status(inception): functional-base-locked`

## [MILESTONE 0.2: TECHNICAL ALIGNMENT]
*   **Goal:** Establish tech stack, deployment patterns, and specific agent skills.
*   **Active Squad:** Human (Lead), Architect, Dev, QA.
*   **Protocol:**
	1. Read `.agent-workspace/docs/APPLICATION_CONTEXT.md` as immutable input.
	2. `architect_agent.md` defines stack, microservices layout, and external integrations.
	3. `architect_agent.md`, `dev_agent.md`, and `qa_agent.md` must have their dynamic specialization blocks rewritten to match the selected stack and test toolchain.
	4. `qa_agent.md` defines shift-left testing strategy and contract verification protocols.
*   **Output:** Produce `.agent-workspace/docs/TECHNICAL_MANIFEST.md`, update `.agent-workspace/docs/PROJECT_STATE.md`, and rewrite the affected agent specialization blocks.
*   **Gateway:** Human validation -> Git Commit: `status(inception): technical-manifest-locked`

## Next State Handover
*   **After Inception:** Continue with `.agent-workspace/STATE_1_SPEC_BASELINE.md`.
