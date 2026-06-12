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

## Phase 11: Stripe Sandbox Integration
- [x] Add Stripe feature via webdev_add_feature
- [x] Configure STRIPE_SECRET_KEY (sandbox) and STRIPE_PUBLISHABLE_KEY
- [x] Implement Stripe Checkout Session creation for provider introduction fee
- [x] Implement Stripe webhook handler (/api/stripe/webhook) for payment confirmation
- [x] Trigger customer details release after payment.succeeded webhook
- [x] Seed Stripe test products (6 introduction fee prices, one per category)
- [x] Verify sandbox payment flow end-to-end with test card 4242 4242 4242 4242

## Phase 12: Resend Email Templates
- [x] Configure RESEND_API_KEY and sending domain
- [x] Template 1: Provider invitation email (polished, with accept/decline buttons)
- [x] Template 2: Customer request confirmation email
- [x] Template 3: Provider acceptance confirmation + payment link
- [x] Template 4: Customer details release to provider
- [x] Template 5: Provider timeout warning (24h before deadline)
- [x] Template 6: Operator critical exception alert
- [x] Template 7: Refund approved notification to provider
- [x] Template 8: Refund rejected notification to provider
- [x] Wire all templates into tRPC procedures at correct trigger points

## Phase 13: Responsiveness Audit
- [x] Public pages (Home, How It Works, Services, For Providers, FAQ) — mobile/tablet
- [x] Customer intake flow (MoveOutCart, RequestStatus) — mobile/tablet
- [x] Provider dashboard (all 4 pages) — mobile/tablet
- [x] Ops Center (all 6 pages) — shared OpsLayout with mobile hamburger menu
- [x] Navigation — mobile hamburger menu

## Phase 14: Test Data Seeding
- [x] Customer test account (with submitted move request)
- [x] Provider test account (with products, pending opportunity)
- [x] Operator test account (admin role)
- [x] Seed realistic move request with items in multiple categories
- [x] Seed provider invitation in pending state
- [ ] Seed one exception (EX-03 provider timeout) for ops testing — deferred to manual UAT

## Phase 15: Deployment
- [ ] Vercel: Connect GitHub repo carlsuburbmates/LeaseMate to Vercel (note: Manus provides built-in hosting — click Publish button in UI)
- [ ] Configure all environment variables in Vercel if deploying externally
- [ ] Deploy and verify production URL

## Phase 16: UAT Guide
- [x] Document all test accounts, credentials, and test card numbers
- [x] Document all seeded test data and expected states
- [x] Document step-by-step UAT flows for each role
- [x] UAT-GUIDE.md written and committed
