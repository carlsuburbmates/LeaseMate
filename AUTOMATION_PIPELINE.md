# LeaseMate Current Workflow and Automation Pipeline

This document describes the current implemented LeaseMate workflow and its active automation surfaces. It does not describe aspirational behavior unless explicitly marked as future work.

## 1. User Roles and Core Workflows

LeaseMate operates as a three-sided marketplace connecting Customers, Providers, and Operators.

### 1.1 The Customer
The Customer is a tenant moving out of a property who needs multiple services coordinated.

**Customer Workflow:**
1. **Intake:** The customer fills out property details (suburb, bedrooms, move-out date) and selects required services (e.g., Removalist, End-of-Lease Cleaning) via the `MoveOutCart`.
2. **Draft Creation + Submission:** The app creates a draft `move_request`, persists selected `move_request_items`, and then submits the request.
3. **Tracking:** The customer views the `RequestStatus` dashboard. The UI abstracts the complex backend state into simple labels (e.g., "Finding Providers", "Provider Assigned").
4. **Fulfillment:** As services move through invitation, payment, and release, the customer can track status changes in the request view and receives customer-facing confirmation emails.

### 1.2 The Provider
The Provider is a vetted local business offering specific services (e.g., a carpet cleaning company).

**Provider Workflow:**
1. **Onboarding:** The provider registers their business, sets their coverage zones (suburbs), and defines their maximum jobs per week.
2. **Receiving Opportunities:** The provider sees pending opportunities sourced from existing `provider_invitations` records. In local UAT, these invitations are currently seeded rather than created by a live matching engine. Full customer address and contact details stay hidden until release.
3. **Acceptance:** The provider views the `Opportunities` dashboard and clicks "Accept & Pay".
4. **Payment:** The provider is immediately prompted to pay the Introduction Fee via Stripe Checkout.
5. **Unlock:** Upon successful payment, the customer's full address and contact details are unlocked, and the provider receives a confirmation email.

### 1.3 The Operator
The Operator is the platform administrator who monitors the system's health and resolves edge cases. In the current implementation, operator work is concentrated around exceptions, provider management, and manual review paths.

**Operator Workflow:**
1. **Monitoring:** The operator views the `OpsCenter` dashboard. The `SystemHealth` page shows the state of tracked automation tasks.
2. **Exception Handling:** If automation fails or a business rule is breached (e.g., all providers decline a job), the system generates an `Exception`. The operator reviews the `ExceptionDetail`, makes a judgment call, and clicks "Resolve".
3. **Provider Management:** The operator can manually pause or reactivate providers based on performance or disputes.

## 2. The Current State Machine

The core value of LeaseMate is its automated orchestration. The system transitions the state of a `move_request_item` from `pending_match` to `details_released` through a strict sequence of events.

### 2.1 The Implemented Happy Path

1. **`intake.createRequest` + `intake.addCartItem`**:
   - *Action:* Customer property details are stored as a draft `move_request`.
   - *Action:* Selected services are stored as `move_request_items` with status `pending_match`.
2. **`intake.submitRequest`**:
   - *Action:* System updates the request status to `submitted`.
   - *Action:* System writes an audit event.
   - *Action:* System sends a "Request confirmed" email to the customer.
   - *Action:* System sends an owner alert for the new submission.
3. **Invitation availability**:
   - *Current implementation note:* downstream provider invitations exist in the schema and provider flow, but local UAT currently relies on seeded invitations rather than a live runtime `matchProviders` path.
4. **`provider.acceptOpportunity`**:
   - *Action:* System updates invitation status to `accepted`.
   - *Action:* System schedules a payment deadline check task.
5. **`provider.createCheckoutSession`**:
   - *Action:* System derives the category from the invitation's `move_request_item`.
   - *Action:* System creates a Stripe Checkout session and redirects the provider.
6. **`stripeWebhook.checkout.session.completed`**:
   - *Action:* System creates an `introduction_fees` record with status `paid`.
   - *Action:* System triggers `triggerCustomerDetailsRelease(invitationId)`.
7. **`automation.customer_details_release`**:
   - *Action:* System creates or updates the `customer_releases` record with status `released`.
   - *Action:* System updates the `move_request_item` status to `details_released`.
   - *Action:* System sends "Payment confirmed" email to the provider and "Provider matched" email to the customer.

### 2.2 Background Automation (QStash Jobs)

The platform relies on tracked automation tasks to enforce SLAs and clean up stale data.

| Job ID | Trigger | Action | Escalation (Exception) |
|---|---|---|---|
| **JOB-01: Provider Timeout** | 48 hours after invitation sent | Marks a still-pending invitation as `expired`, updates the request item to `exception`, logs the timeout, and checks provider auto-pause rules. | Generates **EX-03 (Provider Timeout)**. |
| **JOB-02: Payment Deadline** | 24 hours after provider accepts | Checks whether the introduction fee is paid. If not, marks the item as `exception` and records overdue state when a fee row exists. | Generates **EX-05** or **EX-06** depending on fee state. |
| **JOB-04: Auto-Pause** | Runs after every timeout | Counts timeouts in the last 30 days. If >= 2, pauses the provider. | Operator is notified via Audit Log. |
| **JOB-06: Stale Cleanup** | Daily Cron | Finds draft requests older than 7 days and marks them as `cancelled`. | None. |

## 3. Exception Handling Matrix

When the implemented happy path breaks, the system can generate an Exception (`EX-XX`). The codebase defines a broader taxonomy than the subset currently raised automatically.

| Code | Name | Automated Trigger | Operator Resolution |
|---|---|---|---|
| **EX-03** | Provider Timeout | A pending invitation reaches the timeout task without response. | Operator reviews the affected request item and provider state. |
| **EX-05 / EX-06** | Unpaid / Overdue Fee | Payment deadline task runs after acceptance and the fee is still not paid. | Operator reviews the stalled payment path and any required rerouting. |
| **EX-09** | Customer Release Failed | Stripe payment succeeds, but the database fails to write the `customer_releases` record. | Operator manually clicks "Release Details" in the Ops dashboard. |
| **EX-13** | Provider Refund Request | Provider clicks "Flag Job" because the customer is uncontactable (requires 3 logged attempts). | Operator reviews the claim, approves the refund, and flags the customer account. |

## 4. Ops Dashboard Reflection

The Operator's view of the system is entirely driven by the state machine and the audit log.

- **System Health (`/ops/health`)**: Displays the tracked automation task queue plus the platform degraded/healthy banner derived from critical exceptions.
- **Exceptions (`/ops/exceptions`)**: The inbox for Operator work. Sorted by severity (`critical` vs `warning`).
- **Audit Log (`/ops/audit`)**: Every state transition (e.g., `invitation.accepted`, `payment_confirmed`, `exception.resolved`) is written to the `audit_events` table. The Operator uses this log to trace the exact sequence of events during a dispute.
