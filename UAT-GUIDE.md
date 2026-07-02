# LeaseMate — User Acceptance Testing (UAT) Guide

**Version:** 1.4 · **Environment:** Local / Vercel Test · **Date:** 2026-07-02  
**Local URL:** http://localhost:3000  
**Vercel URL:** https://lease-mate-carlitos-projects-a62ff78f.vercel.app  
**GitHub:** https://github.com/carlsuburbmates/LeaseMate

---

## Overview

This guide covers public-entry verification, the three test personas, pre-seeded test data, and the end-to-end verification flows for LeaseMate. Authentication is local and database-backed through `/login`.

This guide is the canonical role-flow test surface, not the final completion gate. Use [LAUNCH_GATE.md](/Users/carlg/Documents/AI-Coding/Local-leasemate/LAUNCH_GATE.md) when deciding whether a change is actually complete enough to treat as done.

Feature verification rule:

1. identify the affected flow IDs in [FLOW_INVENTORY.md](/Users/carlg/Documents/AI-Coding/Local-leasemate/FLOW_INVENTORY.md)
2. run every UAT flow below that covers those IDs
3. do not call the change verified if any affected route, page, button, form action, redirect, status update, email link, or ops reflection remains untested

Use Sections 4 to 7 in this guide when a flow needs diagnosing rather than only replaying.

---

## 1. Test Accounts

| Persona | Name | Email | Role | Notes |
|---|---|---|---|---|
| **Customer** | Alex Chen | alex.chen@test.leasemate.com.au | `customer` | Pre-seeded with a move request |
| **Provider** | Jordan Smith | jordan.smith@test.leasemate.com.au | `provider` | Pre-seeded with business profile + 2 products |
| **Operator** | LeaseMate Ops | ops@test.leasemate.com.au | `operator` | Pre-seeded ops account |

### How Login Works

1. Open `/login`.
2. Choose a seeded user from the quick-user list, or enter a new email, name, and role.
3. Sign in and confirm you land on the correct dashboard for that role.

If you need to change an existing tester’s role, update it through the Ops Center or direct SQL and then refresh the app.

---

## 2. Pre-Seeded Test Data

### Service Categories

| ID | Slug | Name |
|---|---|---|
| 1 | removalist | Removalist |
| 2 | end-of-lease-cleaning | End-of-Lease Cleaning |
| 3 | carpet-cleaning | Carpet Cleaning |
| 4 | pest-control | Pest Control |
| 5 | rubbish-removal | Rubbish Removal |
| 6 | handyman | Handyman |

### Provider Profile

| Field | Value |
|---|---|
| Business Name | Smith & Co Removals |
| ABN | 51 824 753 556 |
| Phone | 0412 345 678 |
| Email | jordan.smith@test.leasemate.com.au |
| Suburb | Richmond |
| Status | Active |
| Max Jobs/Week | 8 |

### Service Products

| Product | Category | Price | Introduction Fee |
|---|---|---|---|
| Standard Removalist Package | Removalist | $145/hr (min 4hrs) | $39.00 |
| End-of-Lease Clean (Standard) | End-of-Lease Cleaning | From $320 | $29.00 |

### Test Move Request

| Field | Value |
|---|---|
| Customer | Alex Chen |
| Property | 42 Test Street, Richmond VIC 3121 |
| Type | Apartment, 2 bed / 1 bath |
| Move-out Date | 14 days from seed date |
| Services Requested | Removalist + End-of-Lease Cleaning |
| Status | Submitted |
| Access Notes | Key in lockbox. Code: 1234. No lift — ground floor. |

### Stripe Test Card

| Field | Value |
|---|---|
| Card Number | 4242 4242 4242 4242 |
| Expiry | Any future date |
| CVC | Any 3 digits |
| ZIP/Postcode | Any 5 digits |

---

## 3. Test Flows

### Flow P — Public Discovery, Provider Acquisition, and Auth Entry

**Covers:** `PUB-01`, `PUB-02`, `PUB-03`, `PUB-04`

| Step | Action | Expected Result |
|---|---|---|
| P1 | Open `/` | Home page renders and public navigation is visible |
| P2 | Navigate to `/how-it-works`, `/services`, and `/faq` using visible nav or footer links | Each public route loads without auth errors or dead links |
| P3 | Open `/for-providers` | Provider acquisition page renders with working CTA surfaces |
| P4 | Click the provider CTA to open `/provider-signup` | Provider signup route loads and does not blank-screen |
| P5 | When signed out, confirm the signup page shows the sign-in continuation path | Public signup entry stays usable before auth |
| P6 | Open `/login` and use either a quick user or the role form | Local auth entry works and routes the user to the selected role surface |

### Flow A — Customer: Submit a Move Request

**Covers:** `CUS-01`, `CUS-02`, `CUS-03`, `CUS-04`

**Persona:** Customer (Alex Chen)

| Step | Action | Expected Result |
|---|---|---|
| A1 | Open `/login` and sign in as Alex Chen | Customer Dashboard shown |
| A2 | Click "New Cart" | Move-Out Cart wizard opens |
| A3 | Enter property details | Form validates; "Next" button enabled |
| A4 | Select services | Services added to cart |
| A5 | Review cart and click "Submit Request" | Request submitted; customer is redirected to `/requests/:id` |
| A6 | Navigate to "My Requests" | Submitted request appears and links back to the same `/requests/:id` route |
| A7 | Open the submitted request detail page | Customer-safe status labels render and backend workflow jargon is not exposed |

### Flow H — Customer: Cancel a Request

**Covers:** `CUS-05`

**Persona:** Customer (Alex Chen)

| Step | Action | Expected Result |
|---|---|---|
| H1 | Open a submitted or in-progress request at `/requests/:id` | Cancel action is visible while the request is still cancellable |
| H2 | Click "Cancel Request" and confirm | Mutation runs successfully and the request status changes to `Cancelled` |
| H3 | Return to the dashboard | The same request now shows the cancelled status there as well |

### Flow B — Provider: View and Accept an Opportunity

**Covers:** `PRO-05`, `PRO-06`, `PRO-07`, `PRO-10`, `SYS-07`

**Persona:** Provider (Jordan Smith)

| Step | Action | Expected Result |
|---|---|---|
| B1 | Sign in as Jordan Smith | Provider Dashboard shown |
| B1a | Confirm the provider status is `active` | Opportunities are available only after approval |
| B2 | Navigate to "Opportunities" | Pending invitations shown |
| B3 | Review a pending opportunity card | Suburb, property summary, countdown, and introduction fee render; full address remains hidden |
| B4 | Click "Accept & Pay" | Invitation is accepted and Stripe Checkout opens |
| B5 | Enter test card `4242 4242 4242 4242` | Payment succeeds; redirected back to the provider billing flow |
| B6 | Return to Opportunities and Billing | The opportunity leaves the pending list, billing history updates, and paid opportunities show address release state |

### Flow C — Provider: Decline an Opportunity

**Covers:** `PRO-08`

**Persona:** Provider (Jordan Smith)

| Step | Action | Expected Result |
|---|---|---|
| C1 | Navigate to "Opportunities" | Pending invitations listed |
| C2 | Use the "Decline" action on a pending opportunity card | Decline action is available inline |
| C3 | Click "Decline" | Mutation runs without leaving the dashboard |
| C4 | Confirm decline | Opportunity status updates to `declined` and leaves the pending list |

### Flow D — Operator: Review Requests and Manage Providers

**Covers:** `OPS-01`, `OPS-02`, `OPS-03`, `OPS-04`, `OPS-05`, `OPS-09`

**Persona:** Operator (LeaseMate Ops)

| Step | Action | Expected Result |
|---|---|---|
| D1 | Sign in as LeaseMate Ops | Ops Center shown |
| D2 | Navigate to "Requests" | Submitted move requests listed |
| D3 | Open a request | Property info and cart items shown |
| D4 | Change status to "in_progress" | Status badge updates |
| D5 | Navigate to "Providers" | Provider profiles listed |
| D6 | Re-check or manually approve a pending provider if needed | Approval state updates and audit trail records the action |
| D7 | Pause a provider | Reason captured; provider status changes to "paused" |
| D8 | Reactivate the provider | Provider status returns to "active" |
| D9 | Review "Exceptions", "System Health", and "Audit Log" | Data renders without auth or routing errors |

### Flow G — Provider: Complete Onboarding Approval

**Covers:** `PRO-01`, `PRO-02`, `PRO-03`, `PRO-04`

**Persona:** New Provider

| Step | Action | Expected Result |
|---|---|---|
| G1 | Sign in and create a provider profile | Provider status starts as `pending` |
| G2 | Add ABN, phone, contact email, and suburb if missing | Profile saves successfully |
| G3 | Add at least one product | Approval evaluation runs automatically |
| G4 | Return to the dashboard | Provider status changes to `active` once all requirements pass |

### Flow E — Operator: Handle an Exception

**Covers:** `OPS-06`, `OPS-07`, `OPS-08`

**Persona:** Operator

| Step | Action | Expected Result |
|---|---|---|
| E1 | Navigate to "Exceptions" | Open exceptions listed |
| E2 | Open an exception detail page | Resolution path and context render correctly |
| E3 | Apply either the general resolution path or the refund approve/reject path, depending on exception type | Status, audit trail, and related business state update correctly |

### Flow I — Provider: Request Refund Review

**Covers:** `PRO-09`

**Persona:** Provider

| Step | Action | Expected Result |
|---|---|---|
| I1 | Open `/provider/billing` for a provider with a recently paid introduction fee | Paid fee row is visible and still inside the 7-day review window |
| I2 | Click "Request Refund" | Refund dialog opens with contact-attempt requirements |
| I3 | Submit at least 3 contact attempts and a detailed reason | Refund request is accepted and dispute state is recorded |
| I4 | Re-open Billing or check the matching exception from Ops | The fee now shows a review state and the exception queue reflects the request |

### Flow F — Email Notifications

**Covers:** `CUS-06`, `SYS-03`, `SYS-07`

Verify receipt in the configured test inbox or Resend dashboard.

| Trigger | Email Template | Recipient |
|---|---|---|
| Customer submits move request | Request confirmed | Customer |
| Customer submits move request | New Cart Submission alert | Owner inbox (`OWNER_EMAIL`) |
| Provider accepts + pays | Payment confirmed | Provider |
| Provider accepts + pays | Provider matched | Customer |
| Critical exception / automation alert path | Owner alert notification | Owner inbox (`OWNER_EMAIL`) |

---

## 4. Operational Flow Maps

Use this section when the test flows above are not enough to explain why a route, state transition, or handoff behaved unexpectedly.

### Flow A — Customer: Build, Submit, and Track a Move-Out Cart

- Flow objective: let a customer create a move request, attach service selections, submit the request once, and track the status without seeing internal ops states.
- Step-by-step operational flow:
  1. Customer signs in at `/login`.
  2. Customer lands on `/dashboard` and starts a new cart.
  3. Customer completes property details in step 1 of `/move-out-cart`.
  4. Customer selects one or more services in step 2, which creates the draft request plus cart items.
  5. Customer reviews and submits in step 3.
  6. Customer is redirected to `/requests/:id`, where status is polled every 30 seconds and cancellation remains available until terminal states.
- All website parts touched: `/login`, `/dashboard`, `/move-out-cart`, `/requests/:id`, login form, cart stepper, suburb list, property type selectors, service tiles, review panel, status chips, cancel button.
- Dependencies and handoffs: local auth session, reference suburb/category data, `intake.createRequest`, `intake.addCartItem`, `intake.submitRequest`, audit log, customer email notification, downstream provider-routing automation not yet directly evidenced in this flow.
- Possible confusion or deviation points: request creation actually happens at `Review Cart`, not at final submit; customer-safe labels differ from backend states; submission success does not prove live provider invitation creation happened.

### Flow G — Provider: Onboard and Become Opportunity-Ready

- Flow objective: convert a signed-in user into an approved provider with a profile and at least one product so opportunity routing can succeed later.
- Step-by-step operational flow:
  1. User signs in at `/login`.
  2. User visits `/provider-signup` and creates a provider profile.
  3. System promotes the user role to `provider` and redirects to `/provider/dashboard`.
  4. Provider adds products at `/provider/products`.
  5. Provider maintains operating details at `/provider/profile`.
  6. Approval evaluation runs and the provider becomes `active` only after all requirements pass.
- All website parts touched: `/login`, `/provider-signup`, `/provider/dashboard`, `/provider/products`, `/provider/profile`, signup form, product form, profile form, status badge.
- Dependencies and handoffs: authenticated session, `provider.createProfile`, role update to `provider`, `provider.addProduct`, `provider.updateProfile`, approval reevaluation, audit event.
- Possible confusion or deviation points: signup alone does not guarantee routing readiness; dashboard access does not mean approval passed; product setup and approval state are separate dependencies.

### Flow B — Provider: Review, Accept, Pay, and Unlock Customer Details

- Flow objective: allow a provider to review a pending opportunity, accept it, pay the introduction fee, and receive customer details only after payment confirmation.
- Step-by-step operational flow:
  1. Provider signs in and lands on `/provider/dashboard`.
  2. Provider opens `/provider/opportunities`.
  3. Provider reviews a pending opportunity card with suburb, property type, countdown, and masked address notice.
  4. Provider clicks `Accept & Pay`, which first marks the invitation accepted, then creates a Stripe Checkout session.
  5. Provider completes payment in Stripe and returns to `/provider/billing`.
  6. Backend webhook marks payment paid, triggers customer detail release, updates item state, and sends confirmation emails.
  7. Provider reopens opportunities or billing to confirm paid state and released details.
- All website parts touched: `/provider/dashboard`, `/provider/opportunities`, `/provider/billing`, Stripe Checkout, opportunity cards, countdown timer, accept button, pay button, paid billing history.
- Dependencies and handoffs: approved provider profile, pending invitation row, `provider.acceptOpportunity`, `provider.createCheckoutSession`, Stripe Checkout, Stripe webhook, `triggerCustomerDetailsRelease`, audit log, email delivery.
- Possible confusion or deviation points: there is no invitation detail page; acceptance and payment are two linked backend steps; paid-state verification is split across opportunities, billing, and webhook-driven effects.

### Flow C — Provider: Decline or Time Out an Opportunity

- Flow objective: let a provider reject an opportunity or fail to respond, then ensure the platform records the deviation and exposes the operational consequence.
- Step-by-step operational flow:
  1. Provider opens `/provider/opportunities`.
  2. Provider clicks `Decline`, or the invitation reaches its expiry deadline without response.
  3. The invitation moves to a non-pending state and leaves the active queue.
  4. System writes audit data and, for timeout, creates an exception and may auto-pause repeated offenders.
- All website parts touched: `/provider/opportunities`, pending card, decline button, past opportunities list, `/ops/exceptions`, `/ops/health`, `/ops/audit`.
- Dependencies and handoffs: `provider.declineOpportunity`, invitation record, timeout job scheduling, exception creation, provider timeout log, ops review.
- Possible confusion or deviation points: the current UI has no explicit decline confirmation prompt; decline and timeout are not equivalent; backup-routing handoffs still need separate verification.

### Flow D — Operator: Review Requests and Manage Providers

- Flow objective: give the operator enough visibility to monitor submitted requests, change request states, approve providers, and pause or reactivate providers.
- Step-by-step operational flow:
  1. Operator signs in at `/login` and lands on `/ops`.
  2. Operator opens `/ops/requests` and drills into `/ops/requests/:id`.
  3. Operator reviews property details, cart items, and request status, then updates the request state if needed.
  4. Operator opens `/ops/providers` and reviews approval state, pause state, and re-check actions.
  5. Operator reviews `/ops/audit`, `/ops/health`, and `/ops/exceptions` for supporting context.
- All website parts touched: `/ops`, `/ops/requests`, `/ops/requests/:id`, `/ops/providers`, `/ops/audit`, `/ops/health`, `/ops/exceptions`, status buttons, provider action buttons, summary cards.
- Dependencies and handoffs: operator session, request list query, request detail query, provider approval actions, `ops.updateRequestStatus`, `ops.pauseProvider`, `ops.reactivateProvider`, audit event creation, system health task queue.
- Possible confusion or deviation points: the operator request detail screen is not yet a full process console; it lacks the full invitation, fee, and release timeline, so operators must cross-check audit and exceptions manually.

### Flow E — Operator: Handle an Exception

- Flow objective: let the operator inspect an exception, understand prevention and resolution guidance, and close or dismiss it with traceability.
- Step-by-step operational flow:
  1. Operator opens `/ops/exceptions`.
  2. Operator drills into `/ops/exceptions/:id`.
  3. Operator reads severity, affected party, entity reference, description, prevention strategy, and resolution path.
  4. Operator resolves, dismisses, approves refund, or rejects refund depending on the exception code.
  5. Audit events and exception status update immediately.
- All website parts touched: `/ops/exceptions`, `/ops/exceptions/:id`, open/resolved lists, exception detail cards, resolution buttons, refund controls.
- Dependencies and handoffs: exception rows, exception metadata, audit events, `ops.resolveException`, `ops.approveRefund`, `ops.rejectRefund`, optional customer flagging, provider refund email.
- Possible confusion or deviation points: refund handling has a different action set from general exceptions; operators must use the exception code to choose the correct branch.

### Flow F — System: Notifications, Payment-Gated Release, and Ops Visibility

- Flow objective: ensure the user-visible state changes caused by background work are treated as part of each website flow, not as invisible backend-only activity.
- Step-by-step operational flow:
  1. Customer submission sends a request-received email and writes audit history.
  2. Provider acceptance schedules a payment-deadline check.
  3. Stripe payment completion inserts a paid fee, triggers customer detail release, sends provider and customer emails, and writes audit history.
  4. Timeout and overdue jobs create exceptions and surface platform degradation in ops.
  5. Daily stale draft cleanup auto-cancels old draft requests and records audit history.
- All website parts touched: `/requests/:id`, `/provider/opportunities`, `/provider/billing`, `/ops/exceptions`, `/ops/health`, `/ops/audit`, Resend dashboard, Stripe dashboard.
- Dependencies and handoffs: Stripe webhook, QStash or local timers, automation task records, audit events, exception records, email delivery.
- Possible confusion or deviation points: many business outcomes are visible in the website only after asynchronous work completes; if a job or webhook fails, the UI may look stalled rather than explicitly broken.

---

## 5. Diagnostic Flow Tables

### Flow Table — Flow A: Customer Build, Submit, and Track

| Actor | Flow Name | Flow Objective | Step | Website Part Touched | Route/Page/Screen | Trigger or Input | Expected Outcome | Dependency / Handoff | Risk of Confusion or Deviation | Ops / Monitoring Visibility |
|---|---|---|---|---|---|---|---|---|---|---|
| Customer | Flow A - Build, submit, and track | Create and submit a move request, then follow status safely | A1 | Login form | `/login` | Select Alex Chen or submit customer login | Customer session created and routed to `/dashboard` | Local auth session cookie, `auth.localLogin` | Wrong role selection routes user to the wrong workspace | Audit exists indirectly through session-backed flows only |
| Customer | Flow A - Build, submit, and track | Create and submit a move request, then follow status safely | A2 | Dashboard CTA | `/dashboard` | Click `New Cart` | Customer lands on `/move-out-cart` | Customer must be authenticated | Dashboard can appear empty and still be healthy if no requests exist | Visible later through `/ops/requests` after submission |
| Customer | Flow A - Build, submit, and track | Create and submit a move request, then follow status safely | A3 | Property details form | `/move-out-cart` step 1 | Enter address, suburb, type, bedrooms, bathrooms | `Select Services` becomes available | Reference suburbs query, client-side validation | Users may assume nothing is saved yet; that is correct at this step | None yet |
| Customer | Flow A - Build, submit, and track | Create and submit a move request, then follow status safely | A4 | Service selector and review transition | `/move-out-cart` step 2 | Choose services and click `Review Cart` | Draft request plus cart items are created and review step opens | `intake.createRequest`, `intake.addCartItem`, audit event `move_request.created` | This is the true creation point, not final submit | Request becomes visible in data layer; audit log records creation |
| Customer | Flow A - Build, submit, and track | Create and submit a move request, then follow status safely | A5 | Review panel and submit CTA | `/move-out-cart` step 3 | Click `Submit Cart` | Request status becomes `submitted`; customer is redirected to `/requests/:id` | `intake.submitRequest`, owner alert, customer email | Submission success does not prove live provider invitation creation happened | `/ops/requests`, `/ops/audit`, email inbox |
| Customer | Flow A - Build, submit, and track | Create and submit a move request, then follow status safely | A6 | Request status page | `/requests/:id` | Automatic redirect or revisit from dashboard | Customer sees customer-safe status labels and can cancel when allowed | `intake.requestDetail`, 30-second polling, downstream automations | The visible page can look healthy even while downstream routing is still partial | `/ops/requests/:id`, `/ops/audit`, `/ops/exceptions` if the flow degrades |

### Flow Table — Flow G: Provider Onboarding and Readiness

| Actor | Flow Name | Flow Objective | Step | Website Part Touched | Route/Page/Screen | Trigger or Input | Expected Outcome | Dependency / Handoff | Risk of Confusion or Deviation | Ops / Monitoring Visibility |
|---|---|---|---|---|---|---|---|---|---|---|
| Provider | Flow G - Onboarding and readiness | Turn a signed-in user into an approved, routeable provider | G1 | Login form | `/login` | Sign in as Jordan Smith or create a new user intended to become a provider | Authenticated user can access provider signup | Local auth session | Signup is not a complete public path; auth still gates progression | Visible once a profile exists |
| Provider | Flow G - Onboarding and readiness | Turn a signed-in user into an approved, routeable provider | G2 | Provider signup form | `/provider-signup` | Submit business name and operating details | Provider profile created and user role set to `provider` | `provider.createProfile`, role update, audit event | Original flow sets often stop here even though approval is not complete | Provider appears in ops provider data and audit |
| Provider | Flow G - Onboarding and readiness | Turn a signed-in user into an approved, routeable provider | G3 | Product form | `/provider/products` | Add at least one product | Provider has at least one offer that can later be matched | `provider.addProduct`, categories reference data, approval reevaluation | Product readiness is separate from profile creation | Provider inventory visible indirectly to ops |
| Provider | Flow G - Onboarding and readiness | Turn a signed-in user into an approved, routeable provider | G4 | Profile form and status card | `/provider/profile` and `/provider/dashboard` | Save missing ABN, phone, email, suburb, or capacity details | Provider settings persist and approval state re-evaluates | `provider.updateProfile`, approval evaluator, optional operator override | Dashboard access does not mean approval passed; pending can still block opportunities | `/ops/providers`, `/ops/audit` |
| Provider | Flow G - Onboarding and readiness | Turn a signed-in user into an approved, routeable provider | G5 | Opportunities access | `/provider/opportunities` | Open opportunities after requirements pass | Pending approval lock clears and opportunities become accessible | Approved profile, product inventory, invitation data | An empty state may mean no invitations or an upstream routing gap | `/ops/providers`, `/ops/health`, `/ops/audit` |

### Flow Table — Flow B: Provider Accept, Pay, and Unlock Details

| Actor | Flow Name | Flow Objective | Step | Website Part Touched | Route/Page/Screen | Trigger or Input | Expected Outcome | Dependency / Handoff | Risk of Confusion or Deviation | Ops / Monitoring Visibility |
|---|---|---|---|---|---|---|---|---|---|---|
| Provider | Flow B - Accept and pay | Accept an opportunity and unlock customer details only after payment | B1 | Dashboard navigation | `/provider/dashboard` | Open `Opportunities` | Provider reaches invitation list | Provider role, approval state, existing profile | No opportunities may mean a healthy empty state or upstream routing failure | Check `/ops/health`, `/ops/audit`, invitation data |
| Provider | Flow B - Accept and pay | Accept an opportunity and unlock customer details only after payment | B2 | Opportunity card | `/provider/opportunities` | Review pending card | Provider sees suburb, property summary, countdown, and masked-address notice | Invitation row, request summary lookup | There is no separate detail page; the card is the primary surface | Invitation state visible indirectly through audit and exceptions |
| Provider | Flow B - Accept and pay | Accept an opportunity and unlock customer details only after payment | B3 | Accept action | `/provider/opportunities` | Click `Accept & Pay` | Invitation becomes `accepted`; checkout session creation begins | `provider.acceptOpportunity`, audit event, payment-deadline task scheduling | Acceptance and payment are separate; a failure between them strands the flow in payment-pending | `/ops/health`, `/ops/audit` |
| Provider | Flow B - Accept and pay | Accept an opportunity and unlock customer details only after payment | B4 | Stripe checkout | Stripe-hosted page | Complete test payment | Stripe sends webhook and returns provider to `/provider/billing` | Stripe Checkout, Stripe webhook | A successful card entry does not guarantee webhook completion | Stripe dashboard, `/ops/audit` |
| Provider | Flow B - Accept and pay | Accept an opportunity and unlock customer details only after payment | B5 | Billing history and post-payment state | `/provider/billing` and `/provider/opportunities` | Reopen provider pages after payment | Paid fee exists and released details can appear on the opportunity payload | `introduction_fees`, `customer_releases`, `triggerCustomerDetailsRelease`, confirmation emails | Website-visible success depends on webhook completion, not only on card success | `/ops/audit`, `/ops/health`, customer/provider inboxes |

### Flow Table — Flow C: Provider Decline or Time Out

| Actor | Flow Name | Flow Objective | Step | Website Part Touched | Route/Page/Screen | Trigger or Input | Expected Outcome | Dependency / Handoff | Risk of Confusion or Deviation | Ops / Monitoring Visibility |
|---|---|---|---|---|---|---|---|---|---|---|
| Provider | Flow C - Decline or time out | Remove a provider from an opportunity and surface the consequence | C1 | Opportunity card | `/provider/opportunities` | Click `Decline` | Invitation moves out of the pending queue | `provider.declineOpportunity`, audit event | No confirmation modal exists, so accidental decline is easy to miss | `/ops/audit`; fallback routing still requires direct verification |
| Provider | Flow C - Decline or time out | Remove a provider from an opportunity and surface the consequence | C2 | Opportunity history state | `/provider/opportunities` | Refresh after decline | Invitation appears as declined in history | Invitation state persistence | Decline does not itself prove backup routing fired | Audit only unless backup logic is separately surfaced |
| System / Provider | Flow C - Decline or time out | Remove a provider from an opportunity and surface the consequence | C3 | Background timeout path | No direct page; reflected in `/provider/opportunities`, `/ops/exceptions`, `/ops/health` | 48 hours elapse without response | Invitation expires, exception may open, provider timeout count may increase | Scheduled timeout job, timeout log, exception creation, auto-pause checks | Timeout is asynchronous and easy to miss if only the provider UI is checked | `/ops/exceptions`, `/ops/health`, `/ops/audit` |

### Flow Table — Flow D: Operator Review Requests and Manage Providers

| Actor | Flow Name | Flow Objective | Step | Website Part Touched | Route/Page/Screen | Trigger or Input | Expected Outcome | Dependency / Handoff | Risk of Confusion or Deviation | Ops / Monitoring Visibility |
|---|---|---|---|---|---|---|---|---|---|---|
| Operator | Flow D - Review requests and manage providers | Monitor request progress and control provider availability | D1 | Ops landing page | `/ops` | Sign in as operator | Ops Center loads with navigation to requests, exceptions, providers, audit, and health | Operator session | Landing page health does not guarantee downstream detail screens are complete | Native ops surface |
| Operator | Flow D - Review requests and manage providers | Monitor request progress and control provider availability | D2 | Request list | `/ops/requests` | Open requests queue | Submitted requests list renders | `ops.allRequests` | Request status labels here are raw backend states, not customer-safe labels | Native ops surface |
| Operator | Flow D - Review requests and manage providers | Monitor request progress and control provider availability | D3 | Request detail | `/ops/requests/:id` | Open a request | Operator sees property details, cart items, and status controls | `ops.requestDetail` | Screen does not yet expose the full invitation, fee, or release trace | Native ops surface; audit helps as a supplement |
| Operator | Flow D - Review requests and manage providers | Monitor request progress and control provider availability | D4 | Request status controls | `/ops/requests/:id` | Click a new status | Request status updates and persists | `ops.updateRequestStatus`, audit event | Manual status changes can diverge from underlying item-level reality if used casually | `/ops/audit` |
| Operator | Flow D - Review requests and manage providers | Monitor request progress and control provider availability | D5 | Provider management table | `/ops/providers` | Re-check, manually approve, pause, or reactivate a provider | Approval or availability state changes and action state flips | approval actions, `ops.pauseProvider`, `ops.reactivateProvider`, audit events | This page controls availability but not every downstream readiness dependency | `/ops/providers`, `/ops/audit` |
| Operator | Flow D - Review requests and manage providers | Monitor request progress and control provider availability | D6 | Supporting ops surfaces | `/ops/exceptions`, `/ops/health`, `/ops/audit` | Open supporting queues | Operator sees exceptions, automation task state, and event history | Exceptions, automation tasks, audit events | The operator still needs multiple screens to reconstruct one degraded flow | Native ops surfaces |

### Flow Table — Flow E: Operator Resolve an Exception

| Actor | Flow Name | Flow Objective | Step | Website Part Touched | Route/Page/Screen | Trigger or Input | Expected Outcome | Dependency / Handoff | Risk of Confusion or Deviation | Ops / Monitoring Visibility |
|---|---|---|---|---|---|---|---|---|---|---|
| Operator | Flow E - Resolve exception | Diagnose and close a degraded process path | E1 | Exception queue | `/ops/exceptions` | Open an exception | Open exceptions list renders with severity and timestamps | `ops.allExceptions` | Large queue volume can hide which flow is actually broken | Native ops surface |
| Operator | Flow E - Resolve exception | Diagnose and close a degraded process path | E2 | Exception detail | `/ops/exceptions/:id` | Drill into an exception | Operator sees description, metadata, prevention strategy, and resolution path | `ops.exceptionDetail`, `reference.exceptionMeta` | Operators must distinguish general resolution from refund handling | Native ops surface |
| Operator | Flow E - Resolve exception | Diagnose and close a degraded process path | E3 | Resolution controls | `/ops/exceptions/:id` | Resolve, dismiss, approve refund, or reject refund | Exception status updates and audit trail extends | exception mutation, audit event, refund email when applicable, customer flagging for approved refund | Wrong action path can close the exception without fully resolving the root cause | `/ops/audit`, updated exception status |

### Flow Table — Flow F: System Notifications and Backend-Visible Effects

| Actor | Flow Name | Flow Objective | Step | Website Part Touched | Route/Page/Screen | Trigger or Input | Expected Outcome | Dependency / Handoff | Risk of Confusion or Deviation | Ops / Monitoring Visibility |
|---|---|---|---|---|---|---|---|---|---|---|
| System | Flow F - Notifications and backend-visible effects | Reflect automation outcomes back into the website | F1 | Customer confirmation path | `/requests/:id` plus inbox | `intake.submitRequest` completes | Customer receives request email and sees submitted request status | Resend email delivery, request submission audit | Email success does not prove provider routing fired | `/ops/audit`, inbox, request row |
| System | Flow F - Notifications and backend-visible effects | Reflect automation outcomes back into the website | F2 | Payment deadline monitoring | `/ops/health`, `/ops/exceptions` | Provider accepts but does not pay in time | Payment deadline task appears and an overdue or unpaid exception may open | Scheduled automation task, fee state, exception creation | Process looks stalled in the provider UI unless ops checks queue and exceptions | `/ops/health`, `/ops/exceptions`, `/ops/audit` |
| System | Flow F - Notifications and backend-visible effects | Reflect automation outcomes back into the website | F3 | Stripe-paid release path | `/provider/billing`, `/provider/opportunities`, `/requests/:id` plus inboxes | Stripe sends `checkout.session.completed` | Fee is marked paid, customer details are released, provider and customer receive confirmation emails | Stripe webhook, customer release automation, audit event | A payment can succeed externally while UI stays stale if webhook or release fails | `/ops/audit`, Stripe dashboard, Resend dashboard |
| System | Flow F - Notifications and backend-visible effects | Reflect automation outcomes back into the website | F4 | Timeout and stale-draft cleanup | `/ops/exceptions`, `/ops/health`, `/requests/:id` | Time passes without response or a draft remains inactive for 7 days | Timeout exception or auto-cancelled draft state appears | QStash or local timers, cron auth, audit writes | These outcomes are time-based and easy to miss during ad hoc verification | `/ops/health`, `/ops/exceptions`, `/ops/audit` |

---

## 6. Cross-Flow Observations

- `/login` is a shared dependency for all human actors. Wrong role selection immediately sends the user into the wrong branch of the system.
- `/provider/opportunities` is a cross-flow hotspot. Accept, decline, payment handoff, address masking, timeout exposure, and post-payment detail release all depend on it.
- `/ops/audit`, `/ops/exceptions`, and `/ops/health` are the main reconstruction surfaces when a user-facing flow does not complete cleanly.
- The current operator request detail page is not yet a complete end-to-end trace screen. Operators must combine request detail with audit and exception views to reconstruct degraded paths.
- Multiple flows depend on asynchronous work that is not visible at the moment the user clicks a button: Stripe webhooks, timeout jobs, payment-deadline jobs, and stale-draft cleanup.
- The biggest shared ambiguity remains the handoff between customer submission and provider invitation routing. Product docs describe the intended behavior, but the current runtime still relies on seeded invitation data for UAT.
- Customer-safe status labels and backend raw statuses differ intentionally. Verification and debugging material must keep both views visible so teams do not mistake one for the other.

## 7. Instruction Use

Use this guide in two modes:

1. Use Section 3 to execute role-based verification.
2. Use Sections 4 to 6 to diagnose where a deviation, omission, or handoff failure occurred.

When a process is confusing or incomplete:

1. start from the relevant actor flow, not from an isolated page
2. follow the steps in order
3. confirm each route, action, expected outcome, and handoff
4. if visible state does not match expected state, check the listed dependency or ops surface next
5. treat a feature as verified only when every relevant row in its diagnostic flow table succeeds end to end, including async and ops-visible outcomes

Prioritise clarification of:

- Flow G, because onboarding and approval readiness are easy to over-assume
- Flow B and Flow C, because the opportunity surface carries the most user-visible and async dependencies
- Flow F, because invisible background failures can leave the UI looking only partially complete

---

## 8. Known Limitations

| Item | Status | Notes |
|---|---|---|
| Stripe payments | ✅ Sandbox | Use test card `4242 4242 4242 4242` |
| Resend emails | ✅ Active when configured | Verify in the Resend dashboard |
| Vercel deployment | ✅ Ready | Add all required env vars in Vercel |
| Delayed jobs | ✅ Local + QStash | Local uses in-process timers; production should use QStash |
| Object storage | ⚠️ Launch-like only when configured | Without S3-compatible storage, uploads stay on local disk |

---

## 9. Role Assignment Quick Reference

```sql
SELECT id, name, email, role FROM users WHERE email = 'tester@example.com';

UPDATE users SET role = 'customer' WHERE id = <id>;
UPDATE users SET role = 'provider' WHERE id = <id>;
UPDATE users SET role = 'operator' WHERE id = <id>;
```

Refresh the app after changing a role.

---

## 10. Ops Center Access

The Ops Center (`/ops`) is restricted to users with `role = 'operator'`.

---

## 11. Reporting Issues

When logging a UAT issue, capture:
- exact step
- current URL
- role in use
- visible error message
- whether the issue happened locally or on Vercel
