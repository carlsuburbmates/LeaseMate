# LeaseMate Flow Inventory

Last updated: 2026-07-01

This file is the canonical actor-by-actor inventory of LeaseMate flows.

Use it to answer four questions before calling any LeaseMate change complete:

1. Which user or system flows are affected?
2. Which routes, pages, actions, and downstream handoffs belong to those flows?
3. Which flows are fully implemented versus seeded, partial, or operator-assisted?
4. Which UAT and launch-gate checks must be exercised before the change counts as verified?

This file is not:

- the local runbook
- the step-by-step UAT script
- the automation implementation spec
- the final pass/fail gate

Responsibility split:

- `FLOW_INVENTORY.md`
  defines what flows exist and what surfaces each flow includes
- `UAT-GUIDE.md`
  provides executable end-to-end checks plus diagnostic flow maps and dependency tables for user-visible flows
- `AUTOMATION_PIPELINE.md`
  describes the current implemented workflow and automation behavior
- `LAUNCH_GATE.md`
  decides whether the relevant flows were verified strongly enough to call the work complete

## 1. Actor Model

| Actor | Boundary | Primary entry surfaces |
|---|---|---|
| Public visitor | Can browse public pages and start login or provider signup; cannot mutate protected workflow state | `/`, `/how-it-works`, `/services`, `/for-providers`, `/provider-signup`, `/faq`, `/login` |
| Customer | Can create, submit, view, and cancel move requests within allowed states | `/dashboard`, `/move-out-cart`, `/requests/:id` |
| Provider | Can create and maintain a provider profile, manage products, act on invitations, pay fees, and request refund review | `/provider-signup`, `/provider/dashboard`, `/provider/profile`, `/provider/products`, `/provider/opportunities`, `/provider/billing` |
| Operator | Can review requests, manage providers, review exceptions, approve or reject refund decisions, and inspect system state | `/ops`, `/ops/requests`, `/ops/providers`, `/ops/exceptions`, `/ops/health`, `/ops/audit` |
| System | Owns session issuance, customer-safe state translation, approval evaluation, timed jobs, payment-triggered release, notifications, and cleanup | auth router, shared status mapping, Stripe webhook, QStash jobs, cron routes |

## 2. Flow Status Legend

| Status | Meaning |
|---|---|
| Implemented | The repo contains a current end-to-end path for this flow |
| Partial | Some parts exist, but the whole flow still relies on another non-implemented or manual step |
| Seeded for UAT | The local UAT path works, but one upstream creation step is currently seeded rather than produced live by runtime logic |
| Operator-assisted | Normal execution depends on an explicit operator action or override path |

## 3. Public Visitor Flows

| Flow ID | Flow | Routes and surfaces | Downstream handoffs | Current state | UAT coverage |
|---|---|---|---|---|---|
| `PUB-01` | Public discovery and trust | `/`, `/how-it-works`, `/services`, `/faq`, shared nav/footer links, CTAs into `/move-out-cart` and `/login` | Route rendering, CTA navigation, auth redirects when a CTA crosses into a protected flow | Implemented | Flow P |
| `PUB-02` | Provider acquisition entry | `/for-providers`, CTA links into `/provider-signup` | Transition from acquisition page to provider signup | Implemented | Flow P |
| `PUB-03` | Public provider-signup entry | `/provider-signup` signed-out view, sign-in CTA, authenticated transition into profile creation | `auth.localLogin` or external login redirect, provider profile creation entry | Implemented | Flow P, Flow G |
| `PUB-04` | Local auth entry | `/login`, quick-user list, role selector, local session creation, post-login routing | `auth.localLogin`, session cookie issuance, role-based dashboard redirect | Implemented | Flow P plus every role flow |

## 4. Customer Flows

| Flow ID | Flow | Routes and surfaces | Downstream handoffs | Current state | UAT coverage |
|---|---|---|---|---|---|
| `CUS-01` | Customer dashboard entry | `/login` to `/dashboard`, request cards, `New Cart` CTA | `auth.localLogin`, `intake.myRequests` | Implemented | Flow A |
| `CUS-02` | Draft request creation | `/move-out-cart` property step, service step, review step, step navigation buttons, category loading | `intake.createRequest`, `reference.categories`, `intake.addCartItem` | Implemented | Flow A |
| `CUS-03` | Request submission | review step `Submit Cart`, post-submit redirect to `/requests/:id` | `intake.submitRequest`, owner alert, request-confirmed email | Implemented | Flow A |
| `CUS-04` | Request status tracking | `/requests/:id`, request status card, item-level status labels, privacy note, back navigation | `intake.requestDetail`, customer-safe status mapping | Implemented | Flow A |
| `CUS-05` | Request cancellation | `/requests/:id` cancel action when allowed | `intake.cancelRequest`, request status update, audit event | Implemented | Flow H |
| `CUS-06` | Customer notification re-entry | email links returning to `/requests/:id` | request-confirmed email, provider-matched email, customer route validity | Implemented | Flow F |

## 5. Provider Flows

| Flow ID | Flow | Routes and surfaces | Downstream handoffs | Current state | UAT coverage |
|---|---|---|---|---|---|
| `PRO-01` | Provider profile creation from public signup | `/provider-signup`, form submission, post-success redirect to `/provider/dashboard` | `provider.createProfile`, role update to `provider`, audit event | Implemented | Flow G |
| `PRO-02` | Provider profile maintenance | `/provider/profile`, save action, status panel, pause/active explanation | `provider.myProfile`, `provider.updateProfile`, approval reevaluation task | Implemented | Flow G |
| `PRO-03` | Provider product management | `/provider/products`, add product form, delete action, empty state | `provider.myProducts`, `provider.addProduct`, `provider.deleteProduct`, approval reevaluation task | Implemented | Flow G |
| `PRO-04` | Provider approval evaluation and activation | dashboard status messaging, pending gating, automatic activation after requirements pass | `automation.provider_approval_evaluation`, eligibility checks, optional operator override | Implemented | Flow G, Flow D |
| `PRO-05` | Provider dashboard readiness and route navigation | `/provider/dashboard`, dashboard cards and links, pending-state guard, sign-in guard | `provider.myProfile`, `provider.myOpportunities` | Implemented | Flow G, Flow B |
| `PRO-06` | Opportunity review with masked customer details | `/provider/opportunities`, pending opportunity cards, countdown, introduction-fee display, hidden address state | `provider.myOpportunities`, invitation lookup, fee/release lookup | Seeded for UAT | Flow B |
| `PRO-07` | Invitation acceptance and payment | `Accept & Pay`, Stripe redirect, return to provider billing/opportunity views | `provider.acceptOpportunity`, payment-deadline task, `provider.createCheckoutSession`, Stripe Checkout | Seeded for UAT | Flow B |
| `PRO-08` | Invitation decline | inline `Decline` action on pending opportunity cards | `provider.declineOpportunity`, invitation status update, audit event | Seeded for UAT | Flow C |
| `PRO-09` | Billing history and refund-review request | `/provider/billing`, paid-fee list, `Request Refund` dialog, dispute-pending state | `provider.billingHistory`, `provider.flagJob`, EX-13 creation, owner alert | Seeded for UAT once a paid invitation exists | Flow I |
| `PRO-10` | Released customer-details re-entry | paid opportunity state and billing history after successful checkout | Stripe webhook, `customer_releases`, paid fee persistence, release status reflection | Seeded for UAT once a paid invitation exists | Flow B, Flow F |

## 6. Operator Flows

| Flow ID | Flow | Routes and surfaces | Downstream handoffs | Current state | UAT coverage |
|---|---|---|---|---|---|
| `OPS-01` | Ops dashboard entry and navigation | `/ops`, sidebar links, summary cards, critical exception links | `ops.dashboard`, `ops.criticalExceptions`, `ops.systemHealth` | Implemented | Flow D |
| `OPS-02` | Request review | `/ops/requests`, request list, `/ops/requests/:id` detail view | `ops.allRequests`, `ops.requestDetail` | Implemented | Flow D |
| `OPS-03` | Request status override | request detail status buttons | `ops.updateRequestStatus`, audit event | Implemented | Flow D |
| `OPS-04` | Provider management | `/ops/providers`, provider list, pause/reactivate controls | `ops.allProviders`, `ops.pauseProvider`, `ops.reactivateProvider`, audit events | Implemented | Flow D |
| `OPS-05` | Provider approval override | provider approval actions, re-check path, hold/manual approve states | `ops.approveProvider`, `ops.rejectProvider`, `ops.reevaluateProviderApproval`, audit events, approval reevaluation task | Implemented | Flow D |
| `OPS-06` | Exception queue and detail review | `/ops/exceptions`, `/ops/exceptions/:id`, exception metadata and audit trail | `ops.openExceptions`, `ops.exceptionDetail`, `reference.exceptionMeta` | Implemented | Flow E |
| `OPS-07` | Exception resolution | exception action buttons and notes | `ops.resolveException`, audit event | Implemented | Flow E |
| `OPS-08` | Refund decision flow | refund-related exception review plus approve or reject decision | `ops.approveRefund`, `ops.rejectRefund`, fee update, customer flagging, provider email | Operator-assisted | Flow E |
| `OPS-09` | Audit and system-health monitoring | `/ops/audit`, `/ops/health`, task queue visibility, degraded/healthy banner | `ops.auditLog`, `ops.automationTasks`, `ops.systemHealth` | Implemented | Flow D, Flow E |

## 7. System-Owned Flows

| Flow ID | Flow | Trigger or surface | Required downstream behavior | Current state | Verification anchor |
|---|---|---|---|---|---|
| `SYS-01` | Session issuance and role routing | local login, protected-page access | session cookie set, `auth.me` resolves, role routes land on the correct dashboard | Implemented | Flow P plus role flows |
| `SYS-02` | Customer-safe status translation | customer dashboard and request detail | backend workflow states map to customer-safe labels and never leak raw exception jargon | Implemented | Flow A, Gate B |
| `SYS-03` | Request submission handoff | `intake.submitRequest` | request marked submitted, owner alert sent, customer request-confirmed email sent, customer route link valid | Implemented | Flow A, Flow F |
| `SYS-04` | Provider approval evaluation | provider signup, profile update, product add/update/delete, operator re-check | eligibility checks refresh, eligible pending provider can auto-activate, ineligible provider stays gated | Implemented | Flow G, Flow D |
| `SYS-05` | Provider timeout enforcement | delayed timeout job | pending invitation expires, item moves to exception, EX-03 created, auto-pause evaluation runs, owner alert sent | Implemented | Gate E, `/ops/health`, `/ops/exceptions` |
| `SYS-06` | Payment deadline enforcement | delayed payment-deadline job | unpaid accepted invitation triggers EX-05 or EX-06, item moves to exception, audit written | Implemented | Gate E, `/ops/health`, `/ops/exceptions` |
| `SYS-07` | Stripe payment to customer release | Stripe webhook, release path, provider/customer follow-up | fee persisted, duplicate delivery stays idempotent, customer release written, paid state reflected, provider/customer emails sent, audit event written | Implemented | Flow B, Flow F, Gate D |
| `SYS-08` | Stale draft cleanup | Vercel cron or queued cleanup endpoint | old draft requests mark as cancelled without affecting active work | Implemented | Gate E |
| `SYS-09` | Live request-to-invitation creation | submitted customer request should create provider opportunity inventory | provider invitations generated from runtime logic rather than seeded data | Partial. Local UAT still relies on seeded `provider_invitations`; there is no fully implemented live matcher creating invitations from submitted requests. | Known gap in `LAUNCH_GATE.md` and `AUTOMATION_PIPELINE.md` |

## 8. Flow Verification Rules

For any LeaseMate implementation task:

1. Identify every affected flow ID in this file before calling the work verified.
2. Verify each affected flow end to end, not just the touched component or mutation.
3. Treat a flow as verified only when all relevant surfaces in that flow work together:
   - entry route loads
   - role guard or public access rule behaves correctly
   - page content renders the expected state
   - primary buttons, links, and forms work
   - route transitions and redirects land on the intended pages
   - status updates and empty states reflect the new truth
   - downstream handoffs fire where relevant:
     - router mutation or query
     - audit event
     - exception generation
     - email
     - Stripe handoff
     - QStash or cron job
     - ops visibility
4. If a change touches a partial or seeded flow, say so explicitly and do not over-claim launch readiness.

## 9. Canonical Use Rules

- Use this file to scope verification.
- Use `UAT-GUIDE.md` to run the user-visible checks for the affected flows.
- Use `LAUNCH_GATE.md` to decide whether the affected-flow evidence is strong enough to treat the task as complete.
- Update this file whenever:
  - a new route or actor flow is added
  - a responsibility boundary moves
  - a formerly seeded or partial flow becomes fully implemented
  - a flow is removed or consolidated
