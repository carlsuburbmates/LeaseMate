# LeaseMate — User Acceptance Testing (UAT) Guide

**Version:** 1.1 · **Environment:** Local / Vercel Test · **Date:** 2026-06-14  
**Local URL:** http://localhost:3000  
**Vercel URL:** https://lease-mate-carlitos-projects-a62ff78f.vercel.app  
**GitHub:** https://github.com/carlsuburbmates/LeaseMate

---

## Overview

This guide covers the three test personas, pre-seeded test data, and the end-to-end verification flows for LeaseMate. Authentication is local and database-backed through `/login`.

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

### Flow A — Customer: Submit a Move Request

**Persona:** Customer (Alex Chen)

| Step | Action | Expected Result |
|---|---|---|
| A1 | Open `/login` and sign in as Alex Chen | Customer Dashboard shown |
| A2 | Click "New Move Request" | Move-Out Cart wizard opens |
| A3 | Enter property details | Form validates; "Next" button enabled |
| A4 | Select services | Services added to cart |
| A5 | Review cart and click "Submit Request" | Request submitted; confirmation screen shown |
| A6 | Navigate to "My Requests" | Submitted request appears with status "submitted" |

### Flow B — Provider: View and Accept an Opportunity

**Persona:** Provider (Jordan Smith)

| Step | Action | Expected Result |
|---|---|---|
| B1 | Sign in as Jordan Smith | Provider Dashboard shown |
| B2 | Navigate to "Opportunities" | Pending invitations shown |
| B3 | Click an invitation | Invitation detail page opens |
| B4 | Click "Accept & Pay Introduction Fee" | Stripe Checkout opens |
| B5 | Enter test card `4242 4242 4242 4242` | Payment succeeds; redirected back to app |
| B6 | Return to Opportunities | Invitation status updates to "accepted" |

### Flow C — Provider: Decline an Opportunity

**Persona:** Provider (Jordan Smith)

| Step | Action | Expected Result |
|---|---|---|
| C1 | Navigate to "Opportunities" | Pending invitations listed |
| C2 | Click an invitation | Detail page opens |
| C3 | Click "Decline" | Confirmation prompt shown |
| C4 | Confirm decline | Status updates to "declined" |

### Flow D — Operator: Review Requests and Manage Providers

**Persona:** Operator (LeaseMate Ops)

| Step | Action | Expected Result |
|---|---|---|
| D1 | Sign in as LeaseMate Ops | Ops Center shown |
| D2 | Navigate to "Requests" | Submitted move requests listed |
| D3 | Open a request | Property info and cart items shown |
| D4 | Change status to "in_progress" | Status badge updates |
| D5 | Navigate to "Providers" | Provider profiles listed |
| D6 | Pause a provider | Reason captured; provider status changes to "paused" |
| D7 | Reactivate the provider | Provider status returns to "active" |
| D8 | Review "Exceptions", "System Health", and "Audit Log" | Data renders without auth or routing errors |

### Flow E — Operator: Handle an Exception

**Persona:** Operator

| Step | Action | Expected Result |
|---|---|---|
| E1 | Navigate to "Exceptions" | Open exceptions listed |
| E2 | Open an exception detail page | Resolution path and context render correctly |
| E3 | Apply the relevant action | Status and audit trail update |

### Flow F — Email Notifications

Verify receipt in the configured test inbox or Resend dashboard.

| Trigger | Email Template | Recipient |
|---|---|---|
| Customer submits move request | Move Request Submitted | Customer |
| Provider invited to job | New Opportunity Available | Provider |
| Provider accepts + pays | Introduction Fee Paid | Provider + Operator |
| Customer detail release | Contact Details Released | Customer |
| Exception raised | Exception Alert | Operator |

---

## 4. Known Limitations

| Item | Status | Notes |
|---|---|---|
| Stripe payments | ✅ Sandbox | Use test card `4242 4242 4242 4242` |
| Resend emails | ✅ Active when configured | Verify in the Resend dashboard |
| Vercel deployment | ✅ Ready | Add all required env vars in Vercel |
| Delayed jobs | ✅ Local + QStash | Local uses in-process timers; production should use QStash |
| Object storage | ⚠️ Launch-like only when configured | Without S3-compatible storage, uploads stay on local disk |

---

## 5. Role Assignment Quick Reference

```sql
SELECT id, name, email, role FROM users WHERE email = 'tester@example.com';

UPDATE users SET role = 'customer' WHERE id = <id>;
UPDATE users SET role = 'provider' WHERE id = <id>;
UPDATE users SET role = 'operator' WHERE id = <id>;
```

Refresh the app after changing a role.

---

## 6. Ops Center Access

The Ops Center (`/ops`) is restricted to users with `role = 'operator'`.

---

## 7. Reporting Issues

When logging a UAT issue, capture:
- exact step
- current URL
- role in use
- visible error message
- whether the issue happened locally or on Vercel
