import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "customer", "provider", "operator"]).default("customer").notNull(),
  isFlagged: boolean("isFlagged").default(false).notNull(),
  flagReason: text("flagReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Suburbs (Greater Melbourne seed data) ────────────────────────────────
export const suburbs = mysqlTable("suburbs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  postcode: varchar("postcode", { length: 10 }).notNull(),
  lga: varchar("lga", { length: 100 }),
  zone: mysqlEnum("zone", ["inner", "middle", "outer"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

// ─── Service Categories (Big 6) ───────────────────────────────────────────
export const serviceCategories = mysqlTable("service_categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconName: varchar("iconName", { length: 64 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

// ─── Service Products ─────────────────────────────────────────────────────
export const serviceProducts = mysqlTable("service_products", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull(),
  categoryId: int("categoryId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  priceType: mysqlEnum("priceType", ["fixed", "hourly", "quote"]).notNull(),
  priceAmount: decimal("priceAmount", { precision: 10, scale: 2 }),
  priceLabel: varchar("priceLabel", { length: 100 }),
  coverageZones: json("coverageZones").$type<string[]>(),
  propertyTypes: json("propertyTypes").$type<string[]>(),
  maxBedrooms: int("maxBedrooms"),
  introductionFee: decimal("introductionFee", { precision: 8, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Provider Profiles ────────────────────────────────────────────────────
export const providerProfiles = mysqlTable("provider_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  businessName: varchar("businessName", { length: 200 }).notNull(),
  abn: varchar("abn", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  suburb: varchar("suburb", { length: 100 }),
  status: mysqlEnum("status", ["active", "paused", "suspended", "pending"]).default("pending").notNull(),
  pauseReason: text("pauseReason"),
  maxJobsPerWeek: int("maxJobsPerWeek").default(10).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 100 }),
  timeoutCount30Days: int("timeoutCount30Days").default(0).notNull(),
  lastTimeoutAt: timestamp("lastTimeoutAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Move Requests ────────────────────────────────────────────────────────
export const moveRequests = mysqlTable("move_requests", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  status: mysqlEnum("status", [
    "draft",
    "submitted",
    "in_progress",
    "partially_fulfilled",
    "fulfilled",
    "cancelled",
  ]).default("draft").notNull(),
  moveOutDate: timestamp("moveOutDate"),
  propertyAddress: text("propertyAddress").notNull(),
  propertySuburb: varchar("propertySuburb", { length: 100 }).notNull(),
  propertyPostcode: varchar("propertyPostcode", { length: 10 }),
  propertyType: mysqlEnum("propertyType", ["apartment", "house", "townhouse", "studio", "other"]).notNull(),
  bedrooms: int("bedrooms").notNull(),
  bathrooms: int("bathrooms").notNull(),
  accessNotes: text("accessNotes"),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Move Request Items ───────────────────────────────────────────────────
export const moveRequestItems = mysqlTable("move_request_items", {
  id: int("id").autoincrement().primaryKey(),
  moveRequestId: int("moveRequestId").notNull(),
  categoryId: int("categoryId").notNull(),
  productId: int("productId"),
  position: mysqlEnum("position", ["preferred", "backup"]).notNull(),
  status: mysqlEnum("status", [
    "pending_match",
    "invitation_sent",
    "provider_accepted",
    "details_released",
    "all_declined",
    "exception",
    "cancelled",
  ]).default("pending_match").notNull(),
  customerNotes: text("customerNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Provider Invitations ─────────────────────────────────────────────────
export const providerInvitations = mysqlTable("provider_invitations", {
  id: int("id").autoincrement().primaryKey(),
  moveRequestItemId: int("moveRequestItemId").notNull(),
  providerId: int("providerId").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "accepted",
    "declined",
    "expired",
    "cancelled",
  ]).default("pending").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  respondedAt: timestamp("respondedAt"),
  declineReason: text("declineReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Introduction Fees ────────────────────────────────────────────────────
export const introductionFees = mysqlTable("introduction_fees", {
  id: int("id").autoincrement().primaryKey(),
  invitationId: int("invitationId").notNull().unique(),
  providerId: int("providerId").notNull(),
  moveRequestItemId: int("moveRequestItemId").notNull(),
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  status: mysqlEnum("status", [
    "pending",
    "paid",
    "overdue",
    "refunded",
    "expired",
    "waived",
  ]).default("pending").notNull(),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 200 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 200 }),
  stripeChargeId: varchar("stripeChargeId", { length: 200 }),
  paidAt: timestamp("paidAt"),
  overdueAt: timestamp("overdueAt"),
  refundedAt: timestamp("refundedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Customer Releases ────────────────────────────────────────────────────
export const customerReleases = mysqlTable("customer_releases", {
  id: int("id").autoincrement().primaryKey(),
  introductionFeeId: int("introductionFeeId").notNull().unique(),
  moveRequestItemId: int("moveRequestItemId").notNull(),
  providerId: int("providerId").notNull(),
  customerId: int("customerId").notNull(),
  status: mysqlEnum("status", ["pending", "released", "failed"]).default("pending").notNull(),
  releasedAt: timestamp("releasedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Automation Tasks ─────────────────────────────────────────────────────
export const automationTasks = mysqlTable("automation_tasks", {
  id: int("id").autoincrement().primaryKey(),
  jobType: varchar("jobType", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  status: mysqlEnum("status", ["scheduled", "running", "completed", "failed", "retrying"]).default("scheduled").notNull(),
  payload: json("payload"),
  result: json("result"),
  errorMessage: text("errorMessage"),
  attemptCount: int("attemptCount").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Exceptions ───────────────────────────────────────────────────────────
export const exceptions = mysqlTable("exceptions", {
  id: int("id").autoincrement().primaryKey(),
  code: mysqlEnum("code", [
    "EX-01", "EX-02", "EX-03", "EX-04", "EX-05",
    "EX-06", "EX-07", "EX-08", "EX-09", "EX-10",
    "EX-11", "EX-12", "EX-13",
  ]).notNull(),
  severity: mysqlEnum("severity", ["critical", "warning", "informational"]).notNull(),
  affectedParty: varchar("affectedParty", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  moveRequestId: int("moveRequestId"),
  providerId: int("providerId"),
  customerId: int("customerId"),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "in_review", "resolved", "dismissed"]).default("open").notNull(),
  operatorNotes: text("operatorNotes"),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Audit Events ─────────────────────────────────────────────────────────
export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId").notNull(),
  actorType: mysqlEnum("actorType", ["customer", "provider", "operator", "system"]).notNull(),
  actorId: int("actorId"),
  description: text("description").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Provider Timeout Log ─────────────────────────────────────────────────
export const providerTimeoutLog = mysqlTable("provider_timeout_log", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull(),
  invitationId: int("invitationId").notNull(),
  timedOutAt: timestamp("timedOutAt").defaultNow().notNull(),
});

// ─── Type Exports ─────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Suburb = typeof suburbs.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type ServiceProduct = typeof serviceProducts.$inferSelect;
export type InsertServiceProduct = typeof serviceProducts.$inferInsert;
export type ProviderProfile = typeof providerProfiles.$inferSelect;
export type InsertProviderProfile = typeof providerProfiles.$inferInsert;
export type MoveRequest = typeof moveRequests.$inferSelect;
export type InsertMoveRequest = typeof moveRequests.$inferInsert;
export type MoveRequestItem = typeof moveRequestItems.$inferSelect;
export type ProviderInvitation = typeof providerInvitations.$inferSelect;
export type IntroductionFee = typeof introductionFees.$inferSelect;
export type CustomerRelease = typeof customerReleases.$inferSelect;
export type AutomationTask = typeof automationTasks.$inferSelect;
export type Exception = typeof exceptions.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
