# LeaseMate — User Acceptance Testing (UAT) Guide

**Version:** 1.0 · **Environment:** Sandbox / Test  
**Prepared by:** Manus AI · **Date:** June 2026  
**App URL (Manus dev):** https://3000-iwvxc2hel4aone1eizzot-9dbc0779.sg1.manus.computer  
**Vercel URL:** https://lease-mate-carlitos-projects-a62ff78f.vercel.app *(disable deployment protection to make public)*  
**GitHub:** https://github.com/carlsuburbmates/LeaseMate

---

## Overview

This guide covers the three test personas, all pre-seeded test data, and the end-to-end test flows for human verification. The platform uses **Manus OAuth** for authentication — there are no passwords. Each tester logs in with their own Manus account and the operator assigns the correct role in the database.

---

## 1. Test Accounts

| Persona | Name | Email (placeholder) | Role | DB ID | Notes |
|---|---|---|---|---|---|
| **Customer** | Alex Chen | alex.chen@test.leasemate.com.au | `customer` | 30001 | Pre-seeded with a move request |
| **Provider** | Jordan Smith | jordan.smith@test.leasemate.com.au | `provider` | 30002 | Pre-seeded with business profile + 2 products |
| **Operator** | LeaseMate Ops | ops@test.leasemate.com.au | `operator` | 30003 | Manus project owner auto-gets `operator` role on first login |

### How Login Works

Because LeaseMate uses **Manus OAuth**, there are no usernames or passwords. To test as a specific persona:

1. The **Operator** (project owner) logs in first — their Manus account is automatically assigned the `operator` role.
2. For **Customer** and **Provider** testing, the tester logs in with any Manus account. The operator then updates their `role` in the database via the Ops Center or directly via SQL:
   ```sql
   UPDATE users SET role = 'customer' WHERE email = 'your-manus-email@example.com';
   -- or
   UPDATE users SET role = 'provider' WHERE email = 'your-manus-email@example.com';
   ```
3. After role assignment, the tester refreshes the app and will see the correct dashboard.

> **Note:** The pre-seeded user records (IDs 30001–30003) are placeholder records. Real testers will have their own DB IDs generated on first OAuth login.

---

## 2. Pre-Seeded Test Data

### Service Categories (6 Big Categories — already in DB)

| ID | Slug | Name |
|---|---|---|
| 1 | removalist | Removalist |
| 2 | end-of-lease-cleaning | End-of-Lease Cleaning |
| 3 | carpet-cleaning | Carpet Cleaning |
| 4 | pest-control | Pest Control |
| 5 | rubbish-removal | Rubbish Removal |
| 6 | handyman | Handyman |

### Provider Profile (Smith & Co Removals)

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

### Test Move Request (Move Request ID: 2)

| Field | Value |
|---|---|
| Customer | Alex Chen (ID: 30001) |
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
| Expiry | Any future date (e.g. 12/28) |
| CVC | Any 3 digits (e.g. 123) |
| ZIP/Postcode | Any 5 digits (e.g. 12345) |

> Use this card for all Stripe checkout flows. The sandbox Stripe account is pre-configured. Claim it at: https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVGhKZ2ZCSFhHaG9UUGExLDE3ODE4MzMxMzQv100Bycqc4z8

---

## 3. Test Flows

### Flow A — Customer: Submit a Move Request

**Persona:** Customer (Alex Chen)  
**Entry point:** `/` → Log In → Customer Dashboard

| Step | Action | Expected Result |
|---|---|---|
| A1 | Click "Log In" on the homepage | Redirected to Manus OAuth login |
| A2 | Complete OAuth login | Redirected back to app; Customer Dashboard shown |
| A3 | Click "New Move Request" | Move-Out Cart wizard opens |
| A4 | Enter property details (address, suburb, type, bedrooms, bathrooms, move-out date) | Form validates; "Next" button enabled |
| A5 | Select services (e.g. Removalist + End-of-Lease Cleaning) | Services added to cart |
| A6 | Review cart and click "Submit Request" | Request submitted; confirmation screen shown |
| A7 | Navigate to "My Requests" | Submitted request appears with status "submitted" |

---

### Flow B — Provider: View and Accept an Opportunity

**Persona:** Provider (Jordan Smith)  
**Entry point:** `/provider` → Provider Dashboard

| Step | Action | Expected Result |
|---|---|---|
| B1 | Log in as Provider | Provider Dashboard shown |
| B2 | Navigate to "Opportunities" | List of pending invitations shown |
| B3 | Click on an invitation | Invitation detail page opens |
| B4 | Click "Accept & Pay Introduction Fee" | Stripe Checkout opens in new tab |
| B5 | Enter test card: 4242 4242 4242 4242 | Payment processes; redirected back to app |
| B6 | Return to Opportunities | Invitation status updated to "accepted" |
| B7 | Navigate to "My Jobs" | Accepted job appears in active jobs list |

---

### Flow C — Provider: Decline an Opportunity

**Persona:** Provider (Jordan Smith)

| Step | Action | Expected Result |
|---|---|---|
| C1 | Navigate to "Opportunities" | Pending invitations listed |
| C2 | Click on an invitation | Detail page opens |
| C3 | Click "Decline" | Confirmation prompt shown |
| C4 | Confirm decline | Status updated to "declined"; removed from list |

---

### Flow D — Operator: Review Requests and Manage Providers

**Persona:** Operator (LeaseMate Ops)  
**Entry point:** `/ops` → Operations Center

| Step | Action | Expected Result |
|---|---|---|
| D1 | Log in as Operator (project owner) | Ops Center dashboard shown |
| D2 | Navigate to "Requests" | All submitted move requests listed |
| D3 | Click on Move Request #2 | Request detail page opens with property info and cart items |
| D4 | Change status to "in_progress" | Status badge updates |
| D5 | Navigate to "Providers" | All provider profiles listed |
| D6 | Click "Pause" on Smith & Co Removals | Enter reason; provider status changes to "paused" |
| D7 | Click "Reactivate" | Provider status returns to "active" |
| D8 | Navigate to "Exceptions" | Exceptions list shown (empty if no issues) |
| D9 | Navigate to "System Health" | Automation task queue shown; status banner green |
| D10 | Navigate to "Audit Log" | All operator actions logged with timestamps |

---

### Flow E — Operator: Handle an Exception (EX-13 Refund)

**Persona:** Operator  
**Precondition:** An EX-13 exception exists (provider accepted but customer cancelled)

| Step | Action | Expected Result |
|---|---|---|
| E1 | Navigate to "Exceptions" | EX-13 exception shown as "open" |
| E2 | Click on the exception | Detail page with description, prevention, and resolution path |
| E3 | Click "Approve Refund" | Stripe refund issued; exception resolved |
| E4 | Verify in Stripe Dashboard | Refund appears under the original payment |

---

### Flow F — Email Notifications (Resend)

The following emails are triggered automatically. Verify receipt in the test email inbox.

| Trigger | Email Template | Recipient |
|---|---|---|
| Customer submits move request | Move Request Submitted | Customer |
| Provider invited to job | New Opportunity Available | Provider |
| Provider accepts + pays | Introduction Fee Paid | Provider + Operator |
| Provider declines | Opportunity Declined | Internal log |
| Customer releases provider details | Contact Details Released | Customer |
| Exception raised | Exception Alert | Operator |
| Provider paused by ops | Account Paused | Provider |
| Welcome (first login) | Welcome to LeaseMate | New user |

> **Note:** Emails are sent to the address on the user's Manus account. For testing, verify in the Resend dashboard at https://resend.com/emails.

---

## 4. Known Limitations (Sandbox)

| Item | Status | Notes |
|---|---|---|
| OAuth login | ✅ Fixed | Role enum was missing `customer`/`provider`/`operator` — patched |
| Stripe payments | ✅ Sandbox | Use test card 4242 4242 4242 4242 |
| Resend emails | ✅ Active | Validated API key; emails send to real addresses |
| Vercel deployment | ✅ READY | Deployed at lease-mate-carlitos-projects-a62ff78f.vercel.app — disable deployment protection in Vercel dashboard to make public; add env vars in Vercel Settings |
| Provider timeout automation | 🔄 Scheduled | Heartbeat job runs every 24h |
| Suburb data | ✅ 151 suburbs | Greater Melbourne seed data loaded |

---

## 5. Role Assignment Quick Reference

To assign a role to a real tester after they log in for the first time:

```sql
-- Find the user by their Manus email
SELECT id, name, email, role FROM users WHERE email = 'tester@example.com';

-- Assign role
UPDATE users SET role = 'customer' WHERE id = <id>;
UPDATE users SET role = 'provider' WHERE id = <id>;
UPDATE users SET role = 'operator' WHERE id = <id>;
```

After role assignment, the tester must **refresh the page** for the new role to take effect.

---

## 6. Ops Center Access

The Ops Center (`/ops`) is restricted to users with `role = 'operator'`. The Manus project owner is automatically assigned `operator` on first login. Additional operators can be promoted via SQL as shown above.

---

## 7. Reporting Issues

During UAT, note:
- The exact step that failed
- The error message shown (if any)
- The URL at the time of failure
- Your role (customer / provider / operator)

Report to the project owner for triage.
