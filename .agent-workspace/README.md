# SDD Framework with AI Agents

## Overview

This workspace implements a **Specification-Driven Development (SDD)** framework orchestrated by a virtual team of specialized AI agents. The framework is designed to mature software concepts through structured gates and produce high-quality functional specifications as the canonical source of truth for implementation.

**Key Principle:** One canonical source per concept. Policy, orchestration, context, and specifications are kept separate and never duplicated.

---

## Quick Start

### 1. Understand the Framework
- Read [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) for **global execution rules**.
- Read [`INCEPTION_SCRIPT.md`](./INCEPTION_SCRIPT.md) for **State 0 orchestration** (Milestones 0.1 and 0.2).
- Read [`STATE_1_SPEC_BASELINE.md`](./STATE_1_SPEC_BASELINE.md) for **post-inception specification workflow**.

### 2. Prepare Your Project
- Fill [`docs/APPLICATION_CONTEXT.md`](./docs/APPLICATION_CONTEXT.md) with business vision and scope.
- Fill [`docs/TECHNICAL_MANIFEST.md`](./docs/TECHNICAL_MANIFEST.md) with architecture and tech stack decisions.

### 3. Validate Completion
```powershell
# Functional gate validation (after Milestone 0.1)
powershell -ExecutionPolicy Bypass -File scripts/validate-gates.ps1 -Mode functional

# Technical gate validation (after Milestone 0.2)
powershell -ExecutionPolicy Bypass -File scripts/validate-gates.ps1 -Mode technical
```

### 4. Generate Specifications
- Copy [`docs/spec/SPEC_TEMPLATE.md`](./docs/spec/SPEC_TEMPLATE.md) for each requirement scope.
- Name files as `SPEC-XXXX.md` (e.g., `SPEC-0001.md`).
- Populate mandatory sections and use stable IDs: `REQ-`, `NFR-`, `RULE-`, `AC-`.
- Validate:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-gates.ps1 -Mode functional
```

---

## Directory Structure

```
.agent-workspace/
├── README.md                        # This file
├── INCEPTION_SCRIPT.md              # State 0 orchestration (Milestones 0.1, 0.2)
├── STATE_1_SPEC_BASELINE.md         # Post-inception: Functional specification workflow
├── agents/                          # Agent role profiles (orchestrated by Copilot)
│   ├── business_agent.md            # ROI, MVP scoping, value
│   ├── ba_agent.md                  # Functional capabilities, flows, business rules
│   ├── architect_agent.md           # Architecture, stack, integrations
│   ├── dev_agent.md                 # Implementation, scaffolding, code generation
│   └── qa_agent.md                  # Testing strategy, contract verification
├── scripts/
│   └── validate-gates.ps1           # Automated validation for gate completion
└── docs/
    ├── APPLICATION_CONTEXT.md       # Living document: Business context and scope
    ├── TECHNICAL_MANIFEST.md        # Living document: Architecture and tech stack
    ├── PROJECT_STATE.md             # Living document: Current milestone, decisions, stack
    └── spec/
        ├── README.md                # Specification folder rules and conventions
        ├── SPEC_TEMPLATE.md         # Template for creating new specifications
        └── SPEC-XXXX.md             # Generated functional specifications (one per requirement scope)
```

---

## Workflow Overview

### State 0: System Inception
Two mandatory gates before active development.

#### Milestone 0.1: Functional Alignment
**Goal:** Define business vision, capabilities, and boundaries.

**Agents:** Business Agent → BA Agent → Architect Agent (sequential).

**Protocol:**
1. Human provides raw business idea/requirements.
2. Business Agent validates ROI and MVP scope (max 15 lines).
3. Human validates/corrects.
4. BA Agent defines capabilities, flows, and business rules (max 15 lines).
5. Human validates/corrects.
6. Architect Agent defines system boundaries and external interfaces (max 15 lines).
7. Human validates/corrects.

**Output:** Populated [`docs/APPLICATION_CONTEXT.md`](./docs/APPLICATION_CONTEXT.md).

**Gate:** Run validation:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-gates.ps1 -Mode functional
```

**Commit:** `git commit -m "status(inception): functional-base-locked"`

---

#### Milestone 0.2: Technical Alignment
**Goal:** Establish technology stack, architecture patterns, and agent specialization.

**Agents:** Architect Agent → Dev Agent → QA Agent (sequential).

**Protocol:**
1. Architect Agent reads [`APPLICATION_CONTEXT.md`](./docs/APPLICATION_CONTEXT.md) (immutable input).
2. Architect defines stack, microservices topology, integration style.
3. Human validates/corrects.
4. Dev Agent mutates its `Morphic Stack Specialization` block to the selected tech stack.
5. Human validates/corrects.
6. QA Agent mutates its `Morphic Stack Specialization` block for test toolchain.
7. Human validates/corrects.

**Output:** 
- Populated [`docs/TECHNICAL_MANIFEST.md`](./docs/TECHNICAL_MANIFEST.md)
- Updated [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md)
- Mutated agent profiles with stack-specific specialization

**Gate:** Run validation:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-gates.ps1 -Mode technical
```

**Commit:** `git commit -m "status(inception): technical-manifest-locked"`

---

### State 1: Functional Specification Baseline
**When:** After both inception gates pass.

**Goal:** Generate canonical SDD specifications for all functional requirements.

**Protocol:**
1. Read [`docs/APPLICATION_CONTEXT.md`](./docs/APPLICATION_CONTEXT.md) as baseline.
2. For each bounded scope unit, create `docs/spec/SPEC-XXXX.md` from [`SPEC_TEMPLATE.md`](./docs/spec/SPEC_TEMPLATE.md).
3. Populate mandatory sections: metadata, scope, actors, requirements, business rules, acceptance criteria, traceability.
4. Use stable IDs: `REQ-###`, `NFR-###`, `RULE-###`, `AC-###`.
5. Update [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md) with generated spec IDs.

**Gate:** Run validation:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-gates.ps1 -Mode functional
```

**Commit:** `git commit -m "status(spec): functional-specifications-baselined"`

---

## Key Rules

### Synchronization
Before switching milestones or states, user must state:
```
[SYNC: APPLICATION_CONTEXT.md]
```
This ensures the latest disk version is read, preventing stale context.

### No Duplication
- **One canonical source per concept:**
  - Global policy → `.github/copilot-instructions.md`
  - Orchestration → `INCEPTION_SCRIPT.md`
  - Functional context → `docs/APPLICATION_CONTEXT.md`
  - Specifications → `docs/spec/SPEC-*.md`
  - Agent behavior → `agents/*.md`

- **Other files must reference, not repeat.**

### Snapshot Discipline
- All mutable project state lives in [`docs/PROJECT_STATE.md`](./docs/PROJECT_STATE.md) only.
- Agent files reference it; they do not duplicate it.

### Gate Validation
- Gates must pass before advancing to the next state.
- Use validation scripts to detect incomplete sections and placeholder tokens.
- No empty required fields.
- No placeholder tokens like `[UNSET]`, `<...>`, generic baselines (Polyglot, Generic QA).

### Specification ID Stability
- Requirement IDs (`REQ-`, `NFR-`, etc.) must remain stable over time.
- Once assigned, an ID must not be reused for a different requirement.
- If a requirement changes scope, update the same ID's definition; do not create a new one.

---

## Copilot Meeting Pattern

**Mode:** One agent response per turn.

**Turn Limit:** Responses must stay under 15 lines unless a document update is explicitly required.

**Flow:**
1. Human injects idea.
2. Copilot answers only as one agent (e.g., `business_agent.md`).
3. Human validates/corrects.
4. Copilot processes feedback and responds as the next agent in sequence.

**Prohibition:** Do not simulate a four-way debate in a single chat turn.

---

## Validation Commands

### Functional Gate (after Milestone 0.1)
```powershell
powershell -ExecutionPolicy Bypass -File .agent-workspace/scripts/validate-gates.ps1 -Mode functional
```
Checks:
- `APPLICATION_CONTEXT.md` sections 1-4 populated.
- No placeholder tokens or empty fields.
- `PROJECT_STATE.md` updated.

### Technical Gate (after Milestone 0.2)
```powershell
powershell -ExecutionPolicy Bypass -File .agent-workspace/scripts/validate-gates.ps1 -Mode technical
```
Checks:
- `TECHNICAL_MANIFEST.md` sections 1-4 populated.
- Agent specialization blocks rewritten (no generic baselines).
- No placeholder tokens.
- `PROJECT_STATE.md` updated.

### Specification Gate (after State 1)
```powershell
powershell -ExecutionPolicy Bypass -File .agent-workspace/scripts/validate-gates.ps1 -Mode functional
```
Checks spec completeness again after generation.

---

## Common Commands

### Start Milestone 0.1
Read `INCEPTION_SCRIPT.md` section "MILESTONE 0.1: FUNCTIONAL ALIGNMENT".

Prompt Copilot:
```
Act as business_agent.md. 
Here is the raw requirement: <USER_IDEA>
Respond with ROI assessment and MVP scoping (max 15 lines).
```

### Start Milestone 0.2
After `[SYNC: APPLICATION_CONTEXT.md]`:

Prompt Copilot:
```
Act as architect_agent.md.
Input: APPLICATION_CONTEXT.md (immutable).
Define the technology stack, microservices layout, and external integrations (max 15 lines).
```

### Create First Specification
After State 0 gates pass:

1. Copy `docs/spec/SPEC_TEMPLATE.md` to `docs/spec/SPEC-0001.md`.
2. Fill metadata, scope, actors, requirements, rules, criteria.
3. Update `PROJECT_STATE.md` with spec ID.
4. Run: `powershell -ExecutionPolicy Bypass -File scripts/validate-gates.ps1 -Mode functional`

---

## Troubleshooting

### Validation Fails with Placeholder Tokens
**Issue:** Gate validation reports `[UNSET]` or `<...>` placeholders.

**Solution:** Replace all placeholder tokens with actual values in the milestone-locked artifact before advancing.

### Validation Fails with Generic Baseline
**Issue:** Technical gate reports "generic baseline not removed" (e.g., Polyglot, Generic QA).

**Solution:** In Milestone 0.2, the dev_agent and qa_agent must rewrite their `Morphic Stack Specialization` blocks to remove the generic baseline and add stack-specific principles.

### Empty Required Field Detected
**Issue:** Functional gate reports empty required fields in `APPLICATION_CONTEXT.md`.

**Solution:** Populate all sections 1-4 with meaningful content before committing.

### Stale Context Warning
**Issue:** You suspect the agent is working with outdated file content.

**Solution:** Before switching milestones, issue the sync command:
```
[SYNC: APPLICATION_CONTEXT.md]
```
The agent will re-read the latest disk version.

---

## File Reference Guide

| File | Purpose | Owner | Status |
|------|---------|-------|--------|
| `.github/copilot-instructions.md` | Global execution rules, policies | Framework | ✓ Canonical |
| `INCEPTION_SCRIPT.md` | State 0 orchestration and gates | Framework | ✓ Canonical |
| `STATE_1_SPEC_BASELINE.md` | Post-inception specification flow | Framework | ✓ Canonical |
| `agents/*.md` | Agent role profiles | User/Framework | ✓ Mutable per milestone |
| `docs/APPLICATION_CONTEXT.md` | Business vision and scope | User | ✓ Living document |
| `docs/TECHNICAL_MANIFEST.md` | Architecture and tech stack | User | ✓ Living document |
| `docs/PROJECT_STATE.md` | Current milestone and decisions | User | ✓ Living document |
| `docs/spec/SPEC-*.md` | Functional specifications | User | ✓ Generated per requirement |
| `scripts/validate-gates.ps1` | Automated gate validation | Framework | ✓ Tooling |

---

## Support

- **Framework questions:** See `.github/copilot-instructions.md`
- **Milestone protocol:** See `INCEPTION_SCRIPT.md`
- **Agent roles:** See `agents/` directory
- **Specification format:** See `docs/spec/README.md` and `SPEC_TEMPLATE.md`
- **Validation issues:** See "Troubleshooting" section above

---

**Last Updated:** 2026-06-24

**Framework Version:** State 0 Inception + State 1 Specification Baseline
