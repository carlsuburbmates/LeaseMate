# LeaseMate Website Automation Pipeline

This document defines the fully automated operational state of the LeaseMate platform. It outlines the three primary user roles, the end-to-end workflows they trigger, and how the platform's state machine orchestrates these interactions without manual operator intervention.

## 1. User Roles and Core Workflows

LeaseMate operates as a three-sided marketplace connecting Customers, Providers, and Operators.

### 1.1 The Customer
The Customer is a tenant moving out of a property who needs multiple services coordinated.

**Customer Workflow:**
1. **Intake:** The customer fills out property details (suburb, bedrooms, move-out date) and selects required services (e.g., Removalist, End-of-Lease Cleaning) via the `MoveOutCart`.
2. **Submission:** The cart is submitted. The system generates a `move_request` and multiple `move_request_items` (one per service category).
3. **Tracking:** The customer views the `RequestStatus` dashboard. The UI abstracts the complex backend state into simple labels (e.g., "Finding Providers", "Provider Assigned").
4. **Fulfillment:** Once all services are matched and paid for by providers, the customer receives an automated email containing the providers' contact details.

### 1.2 The Provider
The Provider is a vetted local business offering specific services (e.g., a carpet cleaning company).

**Provider Workflow:**
1. **Onboarding:** The provider registers their business, sets their coverage zones (suburbs), and defines their maximum jobs per week.
2. **Receiving Opportunities:** The provider receives an email invitation when a customer requests their service in their zone. The invitation hides the customer's full address and contact details.
3. **Acceptance:** The provider views the `Opportunities` dashboard and clicks "Accept".
4. **Payment:** The provider is immediately prompted to pay the Introduction Fee via Stripe Checkout.
5. **Unlock:** Upon successful payment, the customer's full address and contact details are unlocked, and the provider receives a confirmation email.

### 1.3 The Operator
The Operator is the platform administrator who monitors the system's health and resolves edge cases. In a fully automated state, the Operator only intervenes when an "Exception" is raised.

**Operator Workflow:**
1. **Monitoring:** The operator views the `OpsCenter` dashboard. The `SystemHealth` page shows the status of the background automation queue.
2. **Exception Handling:** If automation fails or a business rule is breached (e.g., all providers decline a job), the system generates an `Exception`. The operator reviews the `ExceptionDetail`, makes a judgment call, and clicks "Resolve".
3. **Provider Management:** The operator can manually pause or reactivate providers based on performance or disputes.

## 2. The Automated State Machine

The core value of LeaseMate is its automated orchestration. The system transitions the state of a `move_request_item` from `pending_match` to `details_released` through a strict sequence of events.

### 2.1 The Happy Path (Zero Touch)

1. **`customer.submitRequest`**: Customer submits the cart.
   - *Action:* System sets request status to `submitted`.
   - *Action:* System sends "Request Received" email to Customer.
   - *Action:* Operator receives "New Cart Submission" alert.
2. **`system.matchProviders`** (Triggered via background job):
   - *Action:* System queries active providers matching the category and suburb, respecting their weekly capacity.
   - *Action:* System creates a `provider_invitation` with status `pending`.
   - *Action:* System sends "New Opportunity" email to Provider.
3. **`provider.acceptOpportunity`**: Provider clicks accept.
   - *Action:* System updates invitation status to `accepted`.
4. **`provider.payIntroductionFee`**: Provider completes Stripe Checkout.
   - *Action:* Stripe Webhook fires.
   - *Action:* System creates `introduction_fees` record (status: `paid`).
   - *Action:* System creates `customer_releases` record (status: `released`).
   - *Action:* System sends "Payment Confirmed" email to Provider (with full customer details).
   - *Action:* System sends "Provider Matched" email to Customer.
   - *Action:* System evaluates if all items in the request are now released. If yes, updates parent request to `fulfilled`.

### 2.2 Background Automation (QStash Jobs)

The platform relies on scheduled background jobs to enforce SLAs and clean up stale data.

| Job ID | Trigger | Action | Escalation (Exception) |
|---|---|---|---|
| **JOB-01: Provider Timeout** | 48 hours after invitation sent | Checks if provider responded. If not, auto-declines the invitation. | Generates **EX-03 (Provider Timeout)** if no backup provider exists. |
| **JOB-02: Payment Deadline** | 24 hours after provider accepts | Checks if the introduction fee is paid. If not, cancels the acceptance. | Generates **EX-05 (Provider Accepted But Unpaid)**. |
| **JOB-04: Auto-Pause** | Runs after every timeout | Counts timeouts in the last 30 days. If >= 2, pauses the provider. | Operator is notified via Audit Log. |
| **JOB-06: Stale Cleanup** | Daily Cron | Finds draft requests older than 7 days and marks them as `cancelled`. | None. |

## 3. Exception Handling Matrix

When the happy path breaks, the system generates an Exception (`EX-XX`). Exceptions are the only mechanism that requires Operator intervention.

| Code | Name | Automated Trigger | Operator Resolution |
|---|---|---|---|
| **EX-01** | No Provider Matched | Intake submitted, but zero active providers exist in that zone/category. | Operator manually assigns a provider or refunds/cancels the item. |
| **EX-04** | All Providers Declined | All invited providers click "Decline". | Operator manually finds an alternative provider off-platform. |
| **EX-08** | Automation Failed | QStash background job exhausts all retries. | Operator manually executes the stalled workflow step. |
| **EX-09** | Customer Release Failed | Stripe payment succeeds, but the database fails to write the `customer_releases` record. | Operator manually clicks "Release Details" in the Ops dashboard. |
| **EX-13** | Provider Refund Request | Provider clicks "Flag Job" because the customer is uncontactable (requires 3 logged attempts). | Operator reviews the claim, approves the refund, and flags the customer account. |

## 4. Ops Dashboard Reflection

The Operator's view of the system is entirely driven by the state machine and the audit log.

- **System Health (`/ops/health`)**: Displays the live QStash queue. If a job is marked `retrying` or `failed`, the dashboard turns amber.
- **Exceptions (`/ops/exceptions`)**: The inbox for Operator work. Sorted by severity (`critical` vs `warning`).
- **Audit Log (`/ops/audit`)**: Every state transition (e.g., `invitation.accepted`, `payment_confirmed`, `exception.resolved`) is written to the `audit_events` table. The Operator uses this log to trace the exact sequence of events during a dispute.
