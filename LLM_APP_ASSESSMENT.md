# LeaseMate vs LLM App Patterns

Last updated: 2026-06-16

This assessment compares the current LeaseMate codebase against the `llm-app-patterns` skill and records which patterns are wise, premature, or unnecessary.

## Bottom line

LeaseMate is not currently an LLM application.

The codebase contains:

- a reusable UI component at `client/src/components/AIChatBox.tsx`
- a demo usage in `client/src/pages/ComponentShowcase.tsx`

The codebase does not currently contain:

- a live LLM backend
- an `ai` router
- prompt execution infrastructure
- retrieval or vector search
- model fallback logic
- prompt versioning
- LLM request logging
- evaluation pipelines

Because of that, most advanced LLM patterns would be premature if added now.

## Current fit against the skill

| Pattern area | Current fit | Verdict |
|---|---|---|
| Simple RAG | Not implemented | Not needed yet |
| Hybrid RAG | Not implemented | Premature |
| ReAct agent | Not implemented | Premature |
| Function calling | Not implemented | Best future default if AI is added |
| Plan-and-execute | Not implemented | Overkill |
| Multi-agent collaboration | Not implemented | Strongly avoid for this project stage |
| Prompt registry/versioning | Not implemented | Add only with a real AI backend |
| LLMOps observability | Not implemented | Mandatory only once AI is live |
| LLM caching | Not implemented | Not needed without inference |
| Model fallback/retry | Not implemented | Add only with a live AI backend |

## What is wise now

### 1. Keep AI out of the core marketplace workflow

Do not place LLMs in:

- provider invitation routing
- payment verification
- customer detail release
- exception state transitions
- ops resolution authority

These are deterministic business workflows and should remain rule-based.

### 2. Treat AI as a separate bounded context if it becomes real

If LeaseMate gains an AI feature, create a separate context such as:

- `AI Assistance`

That context should sit downstream of:

- Reference Catalog
- Operations, Exceptions & Audit
- Public Web content

It should not own payment, identity, or automation decisions.

### 3. Start with function-calling, not agents

If a real AI feature is added, the best first pattern is:

- function-calling over a narrow tool set

Why:

- LeaseMate has structured data and clear actions.
- The domain does not need autonomous multi-step reasoning.
- Tool use can stay bounded and auditable.

Candidate read-only tools:

- fetch exception metadata
- fetch audit trail for an entity
- fetch request summary
- fetch provider summary
- search help and policy content

## What is not wise now

### 1. Do not add full RAG infrastructure yet

There is no live knowledge assistant that justifies:

- embeddings
- vector storage
- chunking pipelines
- retrieval orchestration

If AI is introduced later, first test whether simple structured retrieval from:

- exception metadata
- audit records
- internal docs

is enough before bringing in embeddings.

### 2. Do not add multi-agent patterns

LeaseMate is an operations-heavy web app, not a research workspace.

Multi-agent patterns would add:

- cost
- latency
- debuggability problems
- domain-boundary confusion

without solving a real current bottleneck.

### 3. Do not reshape the database around LLM infrastructure

The current runtime uses a MySQL-compatible path.

It is not wise to:

- change core persistence strategy
- introduce vector infrastructure
- migrate database choices

just to support speculative AI features.

If retrieval becomes necessary later, prefer a separate AI-side storage choice rather than distorting the core transactional model.

## Sensible future AI use cases

These are the only AI additions that currently make domain sense.

### 1. Ops copilot

Use case:

- explain an exception
- summarize audit history
- suggest the next manual step

Guardrails:

- read-only
- cite source records
- never auto-resolve exceptions
- never mutate payments, providers, or requests

### 2. Intake assistant

Use case:

- help customers understand which services they may need
- explain provider categories in plain language

Guardrails:

- advisory only
- no hidden workflow decisions
- no data mutation without explicit user action

### 3. Internal doc assistant

Use case:

- answer questions from `DDD_CONTEXT_MAP.md`, `INTEGRATIONS.md`, `UAT-GUIDE.md`, and exception policy docs

Guardrails:

- repository-backed answers only
- clear source references
- no invented operational guidance

## Recommended future pattern if AI is added

Use this sequence only when a real AI feature is approved.

### Phase 1

- Add a dedicated `ai` router
- Use function-calling only
- Keep tools read-only
- Log prompt, latency, tokens, and failures
- Add retry and fallback behavior

### Phase 2

- Add repository-backed retrieval for docs and operator policy content
- Prefer structured lookup first
- Add citations in every response

### Phase 3

- Add lightweight evaluation for groundedness and usefulness
- Add prompt versioning
- Add user feedback capture

## Canonical recommendation

The wise optimization is restraint:

- keep AI out of the production-critical workflow for now
- do not build RAG or agent infrastructure yet
- if AI is added later, start with a small read-only ops copilot using function-calling and source-grounded retrieval

That path fits LeaseMate.

The rest of the `llm-app-patterns` skill is currently out of scope for this project stage.
