# Blueprint: State 1 - Functional Specification Baseline

## Objective
*   Generate the canonical functional requirements source of truth using SDD specifications.

## Inputs
*   `.agent-workspace/docs/APPLICATION_CONTEXT.md` as functional context baseline.
*   `.agent-workspace/docs/PROJECT_STATE.md` as latest snapshot.
*   `.agent-workspace/docs/spec/SPEC_TEMPLATE.md` as mandatory template.

## Protocol
1. Ensure `.agent-workspace/docs/spec/` exists.
2. Create one specification file per bounded scope unit.
3. Name files using the identifier format: `SPEC-XXXX.md`.
4. Populate mandatory sections from `SPEC_TEMPLATE.md`.
5. Use stable requirement IDs: `REQ-`, `NFR-`, `RULE-`, `AC-`.
6. Link each spec to source context and downstream implementation/test items.
7. Update `.agent-workspace/docs/PROJECT_STATE.md` with generated spec IDs and status.

## Output
*   A complete specification set in `.agent-workspace/docs/spec/`.

## Completion Gate
*   Mandatory sections completed in each `SPEC-XXXX.md`.
*   At least one `REQ-`, one `RULE-`, and one `AC-` in each specification.
*   No unresolved placeholder tokens in milestone-locked artifacts.
*   Validation command passed:

```powershell
powershell -ExecutionPolicy Bypass -File .agent-workspace/scripts/validate-gates.ps1 -Mode functional
```

## Gateway
*   Human validation -> Git Commit: `status(spec): functional-specifications-baselined`
