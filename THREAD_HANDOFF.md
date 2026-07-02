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
- The major legacy template and platform-specific noise has already been removed or isolated.
- The canonical final completion gate is in `LAUNCH_GATE.md`.
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

> Treat `/Users/carlg/Documents/AI-Coding/Local-leasemate` as the only canonical LeaseMate repo. Read `LAUNCH_GATE.md`, `INTEGRATIONS.md`, `DDD_CONTEXT_MAP.md`, `LOCAL_BUILD_STRATEGY.md`, and `THREAD_HANDOFF.md` first. Ignore `/Users/carlg/Documents/AI-Coding/leasemate` except as a legacy session anchor.

## Cleanup Rule

Only delete or archive `/Users/carlg/Documents/AI-Coding/leasemate` after:

1. a new Codex thread is confirmed to be attached to `Local-leasemate`
2. the new thread can read the canonical repo normally
3. this older thread is no longer needed

## Legacy Session Migration Checklist

This checklist summarizes the useful work completed in the legacy `leasemate` session and defines what must be migrated, verified, or intentionally rejected before continuing implementation here.

### Session Achievements

- Confirmed by direct repo diff that `/Users/carlg/Documents/AI-Coding/Local-leasemate` remains the stronger canonical repo.
- Confirmed that `/Users/carlg/Documents/AI-Coding/leasemate` is a legacy session anchor only and is not a git-backed source of truth.
- Expanded the legacy repo's `UAT-GUIDE.md` into instruction-grade flow material built from the existing actor-flow structure.
- Identified the main current customer-to-supplier execution gap: customer `Submit Cart` completes customer-side submission but does not yet prove live supplier invitation creation/routing.
- Identified route and flow mismatches between documented flows and implemented surfaces in the legacy repo.

### High-Value Findings To Carry Forward

- The instruction-grade documentation built in the legacy session is essential migration input, not optional commentary. Its substance must be preserved in the canonical docs even if the exact file structure changes.
- Customer request-status email links in the legacy repo still use `/customer/requests/:id` while the implemented route is `/requests/:id`.
- The supplier opportunity flow in the legacy repo has no invitation detail route; accept and decline happen inline on `/provider/opportunities`.
- Stripe success in the legacy repo returns to `/provider/billing`, but billing confirmation is effectively webhook/history-driven rather than route-driven.
- `/provider-signup` in the legacy repo behaves as authenticated profile creation, not as a complete supplier-readiness workflow by itself.
- The customer submission story in the legacy repo is ahead of implementation: the visible cart flow does not yet prove preferred supplier selection, backup routing, or live invitation creation.

### Migration Actions

1. Do not promote `/Users/carlg/Documents/AI-Coding/leasemate` to canonical without a separate explicit decision.
2. Re-read `UAT-GUIDE.md`, `FLOW_INVENTORY.md`, `LAUNCH_GATE.md`, `INTEGRATIONS.md`, and `DDD_CONTEXT_MAP.md` in `Local-leasemate` before porting any legacy-thread conclusions.
3. Compare the legacy instruction-grade `UAT-GUIDE.md` expansion against the canonical `FLOW_INVENTORY.md` and `UAT-GUIDE.md`.
4. Port the essential operational substance from the legacy `UAT-GUIDE.md` into canonical docs; do not leave that guidance stranded in the legacy repo.
5. Do not recreate `FLOW_INVENTORY.md` or create a second flow authority doc while porting that material.
6. Verify whether the legacy route mismatch also exists here:
   - customer email links using `/customer/requests/:id`
   - real customer route using `/requests/:id`
7. Verify whether the live customer submission gap also exists here:
   - request submission updates request status
   - cart items exist
   - supplier invitations are or are not created live
   - downstream item status changes are or are not triggered
8. Verify whether the supplier opportunity flow here still lacks a detail route and still depends on inline accept/decline actions.
9. Verify whether `/provider-signup` here is still only a profile-creation gate and whether supplier readiness still depends on `/provider/products` and `/provider/profile`.
10. Reconcile any docs that still describe preferred supplier selection, backup routing, or immediate supplier opportunity creation if those behaviors are not implemented here.
11. Treat every legacy-session finding as a hypothesis until rechecked in `Local-leasemate`.

### Completion Gate For Migration

The migration from the legacy session is complete only when:

1. the useful legacy findings have been revalidated in `Local-leasemate`
2. any required canonical doc updates are applied without duplicating authority docs
3. any confirmed code fixes are implemented in `Local-leasemate`
4. the remaining work continues only from `Local-leasemate`
