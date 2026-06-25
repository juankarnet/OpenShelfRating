# Specification Folder Rules

## Purpose
*   Canonical source of truth for functional requirements.

## File Naming
*   One specification per file.
*   Pattern: `SPEC-XXXX.md`.
*   `XXXX` must be a zero-padded numeric identifier (e.g., `SPEC-0001.md`).

## Authoring Rules
*   Start every new spec from `SPEC_TEMPLATE.md`.
*   Keep artifact language in English.
*   Use dense key-value and list structure; avoid narrative prose.
*   Keep requirement IDs stable over time.

## ID Conventions
*   Functional requirements: `REQ-###`
*   Non-functional requirements: `NFR-###`
*   Business rules: `RULE-###`
*   Acceptance criteria: `AC-###`

## Minimum Completion Criteria
*   Metadata completed.
*   Scope completed.
*   At least one `REQ-`, one `RULE-`, and one `AC-` defined.
*   Traceability section linked to source artifacts.
