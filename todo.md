# LeaseMate — Build TODO

## Phase 1: Foundation
- [x] Global design system — Charcoal/Slate Teal/Alabaster palette, Inter font, CSS variables
- [x] Global layout shells — PublicLayout (top nav + footer), DashboardLayout variants
- [x] App.tsx routing structure — all routes registered
- [x] index.html — Inter font loaded via Google Fonts CDN

## Phase 2: Database Schema
- [x] users table extended with role (customer/provider/operator)
- [x] suburbs table with Greater Melbourne seed data (151 suburbs)
- [x] service_categories table (Big 6 seeded)
- [x] service_products table
- [x] move_requests table
- [x] move_request_items table
- [x] provider_invitations table
- [x] introduction_fees table
- [x] customer_releases table
- [x] automation_tasks table
- [x] exceptions table (EX-01 to EX-13)
- [x] audit_events table
- [x] provider_profiles table
- [x] provider_category_coverage table
- [x] provider_coverage_zones table
- [x] Drizzle migration generated and applied

## Phase 3: Auth & Role Middleware
- [x] Role enum extended: user / admin (admin = operator)
- [x] protectedProcedure variants: customerProcedure, providerProcedure, operatorProcedure
- [x] Frontend route guards per role
- [x] Manus OAuth auth baked in via template

## Phase 4: Core tRPC Routers
- [x] reference router (suburbs, categories, exceptionMeta)
- [x] intake router (submit cart, get status, customer-safe labels)
- [x] provider router (opportunities, accept, decline, flag dispute, products, billing, profile)
- [x] ops router (dashboard, requests, exceptions, providers, audit, health, automation tasks)
- [x] CUSTOMER_STATUS_LABELS — safe labels, no internal exception codes exposed
- [x] EXCEPTION_META — all 13 exceptions with severity, affectedParty, prevention, resolution

## Phase 5: Public Marketing Site
- [x] Homepage — hero, Move-Out Cart preview, How It Works, Big 6 categories, trust signals
- [x] How It Works page — 4-step process, customer and provider flows
- [x] Services overview page — Big 6 category cards with detail
- [x] For Providers page — value proposition, how it works, pricing transparency
- [x] Provider Signup page — registration form with profile creation
- [x] FAQ page — customer and provider FAQs

## Phase 6: Customer Intake Flow
- [x] Customer Dashboard — request list with safe status labels
- [x] Move-Out Cart — multi-step form (property details, service selection, provider browsing)
- [x] Request Status tracking page — customer-safe status labels, no internal codes exposed

## Phase 7: Provider Dashboard
- [x] Provider Dashboard home — stats, quick links, status overview
- [x] Opportunities — countdown timers, accept/decline, address masked until payment
- [x] Products — add/delete service products by category
- [x] Billing — introduction fee history, 7-day refund request with 3-attempt requirement
- [x] Profile — business details, max jobs/week, status display
- [x] Auto-pause after 2 timeouts in 30 days — QStash stub created in server/lib/qstash.ts (post-launch)

## Phase 8: Operations Center
- [x] OpsCenter dashboard — stats, critical exception alerts, quick links
- [x] Requests queue — full pipeline table with status badges
- [x] Exceptions queue — all 13 types, open/resolved split, severity badges
- [x] ExceptionDetail — full detail with prevention strategy, resolution path, operator action buttons
- [x] Providers management — pause/reactivate with reason
- [x] AuditLog — immutable event log with actor type colour coding
- [x] SystemHealth — automation task queue, platform status banner, 30s refresh

## Phase 9: Integrations & Testing
- [x] Vitest coverage — 31 tests passing (auth, reference data, exception meta x13, role guards, customer-safe labels, refund window enforcement, address masking, exception creation guards)
- [x] Owner notifications on key events (via notifyOwner helper)
- [x] Stripe client placeholder — server/lib/stripe.ts created with typed function stubs
- [x] Resend email client placeholder — server/lib/resend.ts created with all 8 email template stubs
- [x] QStash automation job stubs — server/lib/qstash.ts created with all 6 job stubs
- [x] Manus API client placeholder — server/lib/manus.ts created with exception investigation task stub

## Phase 10: Polish & Delivery
- [x] robots.txt — disallow /ops and /provider
- [x] Checkpoint and delivery
