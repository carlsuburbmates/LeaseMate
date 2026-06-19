# LeaseMate Thread Handoff

Use this repository as the canonical project root for all future LeaseMate work:

- `/Users/carlg/Documents/AI-Coding/Local-leasemate`

Do not treat this older folder as the working repo:

- `/Users/carlg/Documents/AI-Coding/leasemate`

## Current State

- Git remote: `https://github.com/carlsuburbmates/LeaseMate.git`
- Canonical remote database: TiDB Cloud Starter
- Canonical remote storage: Cloudflare R2
- Branch: `main`
- Latest verified push: `ee04e0f docs: align canonical local integrations`
- Local UAT completed across customer, provider, and ops
- `check`, `test`, and `build` passed in the canonical repo

## Important Context

- This codebase is a production-style marketplace workflow, not a greenfield prototype.
- The major Manus-specific noise has already been removed or isolated.
- The canonical integration map is in `INTEGRATIONS.md`.
- The canonical domain/context map is in `DDD_CONTEXT_MAP.md`.
- The canonical local operating guide is in `LOCAL_BUILD_STRATEGY.md`.
- The canonical migration history is in `MIGRATION_PLAN.md`.

## Known Remaining Gaps

- Email is now explicit in two modes:
- immediate working delivery via `RESEND_FROM_ADDRESS="LeaseMate <onboarding@resend.dev>"`
- branded delivery after custom domain verification in Resend
- GitHub still reports dependency findings that need a fresh post-push review in the Security tab.
- The old folder remains only because an existing Codex thread is attached to it.

## New Thread Prompt

Start the next Codex thread in:

- `/Users/carlg/Documents/AI-Coding/Local-leasemate`

Use this opening instruction:

> Treat `/Users/carlg/Documents/AI-Coding/Local-leasemate` as the only canonical LeaseMate repo. Read `INTEGRATIONS.md`, `DDD_CONTEXT_MAP.md`, `LOCAL_BUILD_STRATEGY.md`, and `THREAD_HANDOFF.md` first. Ignore `/Users/carlg/Documents/AI-Coding/leasemate` except as a legacy session anchor.

## Cleanup Rule

Only delete or archive `/Users/carlg/Documents/AI-Coding/leasemate` after:

1. a new Codex thread is confirmed to be attached to `Local-leasemate`
2. the new thread can read the canonical repo normally
3. this older thread is no longer needed
