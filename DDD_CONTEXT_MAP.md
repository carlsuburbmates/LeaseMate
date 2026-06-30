# LeaseMate DDD Context Map

Last updated: 2026-06-16

This file is the canonical domain-boundary map for LeaseMate.

Use it to prevent:

1. Domain leakage between customer, provider, billing, ops, and automation logic.
2. Infrastructure decisions from bleeding into business rules.
3. New features being added to the wrong part of the model.
4. Integrations being wired directly into UI or domain code without a boundary decision.

This map is based on the tracked codebase in `/Users/carlg/Documents/AI-Coding/Local-leasemate`, not the duplicate snapshot folder.

## System purpose

LeaseMate is a marketplace orchestrator for end-of-lease services in Melbourne.

Its core business promise is not just lead generation. It is controlled release of customer details only after a provider:

- receives an invitation,
- accepts the opportunity,
- pays the introduction fee,
- and clears the automation path without exceptions.

That means the system is centered on orchestration, entitlement release, and exception handling.

## Bounded contexts

| Context | Responsibility | Owns | Primary routes or modules |
|---|---|---|---|
| Public Web & Acquisition | Public marketing pages, proposition, service explanations, provider acquisition pages | Public route structure, page copy, navigation | `client/src/App.tsx`, public pages under `client/src/pages/*` |
| Identity & Session | Local sign-in, session creation, cookie verification, request authentication | Session token shape, cookie policy, authenticated user resolution | `server/_core/sdk.ts`, `server/_core/cookies.ts`, `server/_core/context.ts`, `auth` router |
| Reference Catalog | Stable vocabulary for suburbs and service categories | `suburbs`, `service_categories` | `drizzle/schema.ts`, `reference` router |
| Customer Intake & Request Tracking | Customer request creation, cart composition, request submission, customer-facing status view | `move_requests`, customer-side request lifecycle, customer-safe labels | `intake` router, customer pages |
| Provider Network & Offer Catalog | Provider onboarding, provider profile state, service products, capacity settings, provider approval requirements | `provider_profiles`, `service_products` | `provider` router, provider profile/products pages |
| Invitation Orchestration | Provider opportunity lifecycle before payment, invitation state transitions, address masking rules | `provider_invitations`, item-level matching progression | `provider.myOpportunities`, invitation mutations, `AUTOMATION_PIPELINE.md` |
| Billing & Access Release | Introduction-fee checkout, payment verification, release entitlement, refund state | `introduction_fees`, `customer_releases`, Stripe metadata mapping | `server/lib/stripe.ts`, `server/stripeWebhook.ts`, billing procedures |
| Notifications & Alerts | Customer/provider emails and owner alerts | Email payloads, alert payloads, email templates | `server/lib/resend.ts`, `server/_core/notification.ts` |
| Automation & SLA Enforcement | Timed jobs, delayed execution, retries, provider approval evaluation, stale cleanup, job authorization | `automation_tasks`, timed job payloads, job auth headers | `server/lib/qstash.ts`, `server/_core/jobs.ts`, `vercel.json` cron |
| Operations, Exceptions & Audit | Manual oversight, exception taxonomy, provider pausing, refunds, traceability | `exceptions`, `audit_events`, operator workflow decisions | `ops` router, ops pages |
| Platform Storage & Delivery | Static hosting, API runtime entry, object delivery, deployment environment rules | Vercel runtime boundary, `/storage/*` behavior, env policy | `api/index.ts`, `server/_core/storageProxy.ts`, `server/storage.ts`, `INTEGRATIONS.md` |

## Website aspect to context mapping

| Website aspect | Owning context | Notes |
|---|---|---|
| Marketing site | Public Web & Acquisition | Does not own operational data |
| Login and auth | Identity & Session | Local/database-backed only |
| Customer cart and request flow | Customer Intake & Request Tracking | Consumes catalog vocabulary |
| Provider onboarding and catalog | Provider Network & Offer Catalog | Owns provider-facing commercial setup |
| Provider opportunity handling | Invitation Orchestration | Pre-payment visibility rules live here |
| Provider payment flow | Billing & Access Release | Checkout + webhook + entitlement |
| Customer/provider email communications | Notifications & Alerts | Triggered by domain events, not page logic |
| Ops dashboard and manual remediation | Operations, Exceptions & Audit | Only context allowed to override automation outcomes |
| Scheduled enforcement and cleanup | Automation & SLA Enforcement | Time-based business policy enforcement |
| Deployment, storage, callback routing | Platform Storage & Delivery | Infrastructure boundary, not domain policy owner |

## Relationship map for context pairs

Only actual integration pairs are listed below. This is not a full Cartesian grid.

| Upstream context | Downstream context | Pattern | Contract owner | Translation needed |
|---|---|---|---|---|
| Identity & Session | Customer Intake & Request Tracking | Open Host Service + Published Language | Identity & Session | No |
| Identity & Session | Provider Network & Offer Catalog | Open Host Service + Published Language | Identity & Session | No |
| Identity & Session | Operations, Exceptions & Audit | Open Host Service + Published Language | Identity & Session | No |
| Reference Catalog | Public Web & Acquisition | Customer-Supplier | Reference Catalog | Minimal |
| Reference Catalog | Customer Intake & Request Tracking | Customer-Supplier | Reference Catalog | Yes |
| Reference Catalog | Provider Network & Offer Catalog | Customer-Supplier | Reference Catalog | Yes |
| Customer Intake & Request Tracking | Invitation Orchestration | Customer-Supplier | Customer Intake & Request Tracking | No |
| Provider Network & Offer Catalog | Invitation Orchestration | Customer-Supplier | Provider Network & Offer Catalog | Yes |
| Invitation Orchestration | Billing & Access Release | Customer-Supplier | Invitation Orchestration | Yes |
| Billing & Access Release | Notifications & Alerts | Customer-Supplier | Billing & Access Release | Yes |
| Billing & Access Release | Operations, Exceptions & Audit | Published Language | Operations, Exceptions & Audit | Yes |
| Invitation Orchestration | Automation & SLA Enforcement | Customer-Supplier | Invitation Orchestration | Yes |
| Automation & SLA Enforcement | Invitation Orchestration | Conformist | Invitation Orchestration | No |
| Operations, Exceptions & Audit | Provider Network & Offer Catalog | Customer-Supplier | Operations, Exceptions & Audit | Minimal |
| Operations, Exceptions & Audit | Customer Intake & Request Tracking | Customer-Supplier | Operations, Exceptions & Audit | Minimal |
| Operations, Exceptions & Audit | Billing & Access Release | Customer-Supplier | Operations, Exceptions & Audit | Minimal |
| Notifications & Alerts | Platform Storage & Delivery | Conformist | Platform Storage & Delivery | Minimal |
| Automation & SLA Enforcement | Platform Storage & Delivery | Conformist | Platform Storage & Delivery | Minimal |

## External context map

These are the anti-corruption boundaries between LeaseMate contexts and external platforms.

| Internal context | External platform context | Pattern | Contract owner | Translation needed |
|---|---|---|---|---|
| Billing & Access Release | Stripe | Anti-Corruption Layer | LeaseMate Billing | Yes |
| Notifications & Alerts | Resend | Anti-Corruption Layer | LeaseMate Notifications | Yes |
| Automation & SLA Enforcement | Upstash QStash | Anti-Corruption Layer | LeaseMate Automation | Yes |
| Platform Storage & Delivery | Cloudflare R2 | Anti-Corruption Layer | LeaseMate Platform | Yes |
| Platform Storage & Delivery | Vercel Runtime | Conformist | LeaseMate Platform | Minimal |
| All persistence-heavy contexts | TiDB/MySQL-compatible database | Shared Kernel at schema level inside the monolith | LeaseMate application schema | No at runtime, Yes during migrations |

## Contract ownership matrix

| Contract | Owner | Consumers | Change policy |
|---|---|---|---|
| Session cookie payload and auth resolution | Identity & Session | All protected contexts | Backward compatible within a session lifetime; do not change silently |
| Service category IDs, slugs, names, and ordering | Reference Catalog | Public Web, Customer Intake, Provider Network | Changes require coordinated seed and UI updates |
| Customer request lifecycle statuses | Customer Intake & Request Tracking | Ops, customer UI, automation | Additive changes only unless all consumer labels are updated together |
| Provider profile status, approval, and capacity fields | Provider Network & Offer Catalog | Invitation Orchestration, Ops | Treat as provider-domain contract; avoid ops-only shortcuts |
| Invitation lifecycle states | Invitation Orchestration | Provider UI, Billing, Automation, Ops | Centralize in orchestration rules before changing UI assumptions |
| Introduction fee and release states | Billing & Access Release | Provider UI, Ops, Notifications | Stripe-facing changes must preserve internal entitlement semantics |
| Exception codes `EX-01` to `EX-13` | Operations, Exceptions & Audit | Automation, ops UI, notifications | Change only via explicit taxonomy review |
| Audit event types | Operations, Exceptions & Audit | Ops UI, investigations, manual review | New events are additive; never reuse an old name for a new meaning |
| Job payloads for delayed tasks | Automation & SLA Enforcement | QStash routes, scheduler, ops tracing | Version payloads if shape changes |
| Storage redirect behavior for `/storage/*` | Platform Storage & Delivery | Future upload/download use cases | Keep storage vendor details outside business contexts |

## Translation and anti-corruption decisions

### 1. Stripe is not allowed into the domain model directly

Decision:

- `server/lib/stripe.ts` is the anti-corruption layer for checkout creation and webhook verification.
- Domain contexts should speak in terms of invitation, introduction fee, paid/unpaid, and customer release.

Translation rules:

- Stripe checkout session metadata must map back to `invitationId`, `providerId`, and `categorySlug`.
- Stripe event success does not equal business completion until `customer_releases` is written successfully.

### 2. Resend is a delivery adapter, not a business-policy owner

Decision:

- Email wording and provider/customer alert payloads live in Notifications.
- Domain contexts emit intent, not raw API calls across the codebase where possible.

Translation rules:

- Business events become email template inputs.
- `OWNER_EMAIL` is only a recipient destination and must not be confused with an identity provider.

### 3. QStash is a scheduler adapter, not the source of timing policy

Decision:

- Delay lengths and SLA policies belong to Automation.
- QStash only transports timed execution.

Translation rules:

- Internal job payloads use `taskId` and domain identifiers.
- External callback verification must terminate at `server/_core/jobs.ts`, not inside domain mutation code.

### 4. Cloudflare R2 is a storage adapter, not a file-domain model

Decision:

- Storage vendor configuration remains inside Platform Storage & Delivery.
- Business contexts should only consume storage URLs or keys through a local service boundary.

Translation rules:

- `/storage/*` is the public application-facing path.
- S3-compatible credentials and endpoints must not leak into customer/provider/ops code.

### 5. Customer-facing labels are a translation layer

Decision:

- Raw workflow statuses are not customer language.
- `CUSTOMER_STATUS_LABELS` is a translation boundary between orchestration state and customer UX.

Translation rules:

- Add new internal statuses only with a mapped customer-safe label.
- Do not expose exception-heavy backend vocabulary directly to end users.

### 6. Reference Catalog governs category identity at the intake boundary

Decision:

- Customer Intake should consume category identity through the Reference Catalog context, not through hardcoded IDs in the UI.

Current implementation:

- `client/src/pages/customer/MoveOutCart.tsx` now resolves category IDs from the `reference.categories` API instead of relying on seed-order assumptions.

## Failure modes and fallback behavior

| Boundary | Failure mode | Current fallback | Required discipline |
|---|---|---|---|
| Identity -> protected contexts | Missing or invalid session cookie | Request becomes unauthenticated | Keep public and protected procedures clearly separated |
| Customer Intake -> Invitation Orchestration | Request submitted without downstream matching | Ops or future automation intervention | Do not collapse matching concerns into intake mutations |
| Invitation Orchestration -> Billing | Invitation accepted but provider never pays | Scheduled payment deadline handling and exception creation | Keep non-payment logic out of provider UI shortcuts |
| Billing -> Release | Stripe event succeeds but release write fails | Exception path and operator remediation | Preserve release as a separate entitlement step |
| Billing -> Notifications | Email send fails after successful payment | Domain write remains canonical; email failure warns soft | Never roll back paid state because of email delivery |
| Invitation Orchestration -> Automation | Job publish fails | Local timer fallback in `server/lib/qstash.ts` | Preserve deterministic task payloads |
| Automation -> Ops | Repeated automation failure | Exception and audit trail | Use ops only for exception handling, not hidden alternate workflows |
| Platform Storage -> business consumers | R2 unavailable | Current business flows mostly unaffected because storage is not yet central | Keep future upload features behind explicit storage service calls |
| Vercel preview -> integrated backends | Preview accidentally shares live secrets | Canonical policy is no preview secrets | Add a separate preview stack before enabling preview envs |

## Versioning policy

- Treat router and context contracts as internal published language, even though the project is currently a monolith.
- Any change to a status enum, exception code, audit event type, job payload, or payment metadata shape must update:
  - producer code,
  - consumer code,
  - this file,
  - and any user-facing label translations.
- External callback payloads should become explicitly versioned when their shape changes.
- Seeded reference data changes must be treated as contract changes if any UI or automation logic depends on fixed IDs or slugs.

## Known coupling risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Billing webhook directly triggers notifications and release workflow | Creates tight coupling between external payment events and multiple downstream concerns | Introduce a local application service or domain-event layer before expanding billing features |
| Audit event names are still string-based | Drift is easy when multiple contexts emit them | Centralize audit-event constants and add contract tests around operator-visible events |
| Preview deployments are not isolated | Enabling secrets there would create data and payment collisions | Keep preview secretless until a dedicated preview stack exists |
| Storage context exists before a fully modeled file use case | Future uploads could leak infrastructure assumptions into core contexts | Define a file metadata model before attaching uploads to customer/provider workflows |

## Canonical anti-deviation rules

- Do not add new provider-payment logic outside Billing & Access Release.
- Do not add new operator override flows outside Operations, Exceptions & Audit.
- Do not embed third-party API semantics directly into customer/provider routers when an ACL already exists.
- Do not hardcode reference IDs in the frontend when the Reference Catalog already owns that vocabulary.
- Do not treat preview deployment configuration as production-like until it has isolated backing services.

## Recommended next refactors

1. Introduce internal event objects between Billing, Notifications, and Ops before adding more payment scenarios.
2. Centralize audit-event constants to stop string drift across contexts.
