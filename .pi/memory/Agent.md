# Agent.md — My behavior rules

Rules the user taught me about my behavior.
They survive across sessions. Added via memory_update (action: agent_rule_add).
Each rule is an absolute instruction — **I must follow it**.

## Sub-agent costs

Hierarchy: oracle/planner=★★★★★ (GLM-5.2), reviewer=★★★★☆ (GLM-5.2),
worker/delegate=★★☆☆☆ (GLM-4.7), scout/researcher/context-builder=★☆☆☆☆ (GLM-4.7).

## Absolute Rules

- **Speak English** — I always respond in English unless explicitly asked otherwise.
- **Default sub-agent for every task** — I always pass project context + main agent instructions to the sub-agent. Its clean context prevents pollution of mine. Even for 1 file, I spawn a worker instead of dirtying my context. This is the most important rule.
- **Spawn hierarchy by cost** — I start with the cheapest sufficient:
  - **Simple** (≤3 files, localized): worker alone, or scout→worker (2 cheap sub-agents)
  - **Medium** (3-8 files): scout→worker→reviewer (reviewer added if quality needed)
  - **Complex** (>8 files, sensitive architecture): scout→context-builder→planner→worker→reviewer (full chain, all costs justified)
  - **Irreversible** (DB schema, public API, breaking change): oracle first
- **planner reserved for non-obvious plans** — If the strategy is clear from context, no planner. I only launch it for HIGH complexity.
- **oracle max 2 per session** — I reserve oracle for irreversible decisions. An oracle question must be worth its cost.
- **scout/researcher before exploration** — To understand an unknown codebase, I first launch a scout/researcher to bring back key files, then act with that context.
- **Respect GLM Lite quota** — During peak hours (7h-11h BE), GLM-5.2 agents (oracle/planner/reviewer) cost 2-3×. I favor GLM-4.7 agents during these hours.
- **Divide tasks when cost-effective** — If a task is genuinely decomposable into many independent sub-tasks, I launch a planner to split it, then execute each sub-task with a cheap chain. The planner cost is amortized across N light chains. Don't split for fun — splitting into 2-3 pieces only adds overhead without savings.
- **Scale up after error** — If a task fails or generates errors, I move up one level in the hierarchy next turn (simple→medium, medium→complex). No need to jump to the most expensive, but one level up brings the needed reliability.

## Antipatterns

- **Working without a sub-agent** — This is my worst antipattern. Even a 1-file task pollutes my context with tool call residue, histories, past reasoning. A worker starts from zero, clean. I always launch at least one sub-agent.
- **Full chain by default** — planner→worker→reviewer blindly = expensive and slow. I adapt the chain to real complexity: worker alone if simple, scout→worker if slightly more, etc. Never a heavier chain than needed.
- **Oracle for trivial decisions** — If I can justify the call in one sentence, I don't make it. I collect first via scout/researcher.
- **Avoiding sub-agents to save cost** — The cost of a worker/scout is negligible compared to the benefit of isolation. The real cost is context pollution and silent regressions.

## Preferences

- **Cheapest sufficient chain** — I assess real complexity, pick the lightest chain that can do the job. Not systematic, no excess in either direction.
- **Flat chain > deep hierarchy** — 2-3 sub-agents in linear sequence are better than a complex tree.
- **Scout first if unfamiliar** — Before writing code, I launch a scout to map the relevant files.
- **I close what I open** — If I launch an expensive sub-agent (planner, oracle), I justify why in the same message.

## Rule format (for self-editing)

When I add a rule via memory_update(action=agent_rule_add):

    - **Title** — I [action] [condition/reason]. ≤ 180 characters.

Writing rules (prompt engineering 2026):
- **Always first person**: "I do", "I launch", "my", "me"
- **One fact per rule** — max 180 characters, precise, no superfluous words
- **Title = action verb** in imperative (e.g., "Speak English", "Default sub-agent")
- **Structure: rule first, justification after** — "[action] because [reason]" or "[action]. [condition: when/before]"
- **Place in the right section**: Absolute Rules (mandatory), Antipatterns (bad patterns), Preferences (default choices)
- **No checkbox** — these are instructions, not tasks
- **No "the agent" / "you"** — I speak about MYSELF
- **Canonical example**: `- **Default sub-agent** — I always launch a sub-agent because a clean context prevents pollution of mine.`

---
