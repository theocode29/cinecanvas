# AGENTS.md

Every rule is mandatory unless explicitly overridden by a project-level AGENTS.md. Keep this file under 150 lines. Split into subdirectories when it grows beyond that.

## Decision Order

When multiple valid implementations exist, prioritize in order:
1. Architectural invariants
2. Public contract stability
3. Component isolation
4. Backward compatibility
5. Simplicity
6. Performance

## Modification Policy

Implement freely: features, bug fixes, behavior-preserving refactors, documentation, tests.

Ask before:
- changing any public API, contract, or schema
- restructuring the repository
- adding dependencies
- modifying generated or shared files

When in doubt — ask. Do not assume authorization.

## Compatibility

Unless explicitly requested, preserve: public APIs, data schemas, service contracts, configuration format.

## Isolation Rules

- Components communicate through declared interfaces only.
- No direct coupling between siblings.
- No shared mutable global state.
- No undeclared dependencies.

## Contracts

- Represent completed facts or stable capabilities — not implementations.
- Immutable once published.
- Contain only what consumers need.
- All contracts live in: `<PROJECT-SPECIFIC: path>`

## Project Memory

```
.pi/memory/
├── Brief.md      — architecture, stack, conventions, decisions
├── Progress.md   — implementation state and next steps
├── Gotchas.md    — bugs, pitfalls, edge cases, lessons learned
└── Agent.md      — agent behavior rules (first-person, absolute instructions)
```

Read before starting work. Update whenever durable knowledge changes. Do not store temporary reasoning or conversation history.
Be careful with the memory file, make sure you don’t destroy anything and you write in the right place.

## Agent Diagnostics & Tools

- **Lens diagnostics** — Run before declaring work done. Catches errors, structural rule violations, complexity issues.
- **Web search** — Use with 2-4 varied queries per topic. Prefer multiple angles over single broad query.
- **Ask user** — When requirements are ambiguous: ask structured questions (2-4 options). Never guess.
- **LSP** — Run lsp_diagnostics before builds. Navigate with lsp_navigation (definition, references, hover).
- **AST grep** — Use ast_grep_search for semantic code search. More precise than text grep.
- **Project memory** — Read .pi/memory/ at session start. Update after each meaningful change.

## Documentation

AI-facing docs mirror the public contract surface. Any public contract change must update documentation in the same commit.

## Code Quality

Prefer: small functions · explicit types · immutable data · dependency injection · descriptive names.
Avoid: global state · hidden side effects · duplication · magic values · premature optimization.

## Before Changing Anything Central

Check whether the feature can be implemented as:
1. configuration
2. an existing interface
3. a new event or message
4. a new peripheral component

Modify central components only as a last resort.

## Anti-Patterns

Reject: sibling coupling · business logic in infrastructure · undeclared dependencies · hardcoded paths · plaintext secrets · unnecessary public surface expansion · outdated AI documentation.

## Validation Checklist

- [ ] Tests pass.
- [ ] No component violates isolation rules.
- [ ] Every component declares its dependencies.
- [ ] AI documentation matches contract changes.
- [ ] No business logic in infrastructure.
- [ ] No secrets or hardcoded paths.
- [ ] No unintended breaking changes.
- [ ] Project memory updated if durable knowledge changed.
