import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditEvents,
  automationTasks,
  customerReleases,
  exceptions,
  introductionFees,
  InsertUser,
  moveRequestItems,
  moveRequests,
  providerInvitations,
  providerProfiles,
  serviceCategories,
  serviceProducts,
  suburbs,
  users,
  type InsertMoveRequest,
  type InsertProviderProfile,
  type InsertServiceProduct,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: db not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  for (const field of ["name", "email", "loginMethod"] as const) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "operator";
    updateSet.role = "operator";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function setUserRole(userId: number, role: "customer" | "provider" | "operator" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function flagUser(userId: number, reason: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isFlagged: true, flagReason: reason }).where(eq(users.id, userId));
}

// ─── Suburbs ──────────────────────────────────────────────────────────────

export async function getAllSuburbs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suburbs).where(eq(suburbs.isActive, true)).orderBy(suburbs.name);
}

export async function searchSuburbs(query: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suburbs)
    .where(and(eq(suburbs.isActive, true), sql`LOWER(${suburbs.name}) LIKE ${`%${query.toLowerCase()}%`}`))
    .limit(20);
}

// ─── Service Categories ───────────────────────────────────────────────────

export async function getServiceCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceCategories)
    .where(eq(serviceCategories.isActive, true))
    .orderBy(serviceCategories.sortOrder);
}

// ─── Service Products ─────────────────────────────────────────────────────

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceProducts)
    .where(and(eq(serviceProducts.categoryId, categoryId), eq(serviceProducts.isActive, true)));
}

export async function getProductsByProvider(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(serviceProducts).where(eq(serviceProducts.providerId, providerId));
}

export async function createProduct(data: InsertServiceProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(serviceProducts).values(data);
  return result;
}

export async function updateProduct(id: number, data: Partial<InsertServiceProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(serviceProducts).set(data).where(eq(serviceProducts.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(serviceProducts).set({ isActive: false }).where(eq(serviceProducts.id, id));
}

// ─── Provider Profiles ────────────────────────────────────────────────────

export async function getProviderProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(providerProfiles).where(eq(providerProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function getProviderProfileById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(providerProfiles).where(eq(providerProfiles.id, id)).limit(1);
  return result[0];
}

export async function createProviderProfile(data: InsertProviderProfile) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(providerProfiles).values(data);
  return result;
}

export async function updateProviderProfile(id: number, data: Partial<InsertProviderProfile>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(providerProfiles).set(data).where(eq(providerProfiles.id, id));
}

export async function pauseProvider(id: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(providerProfiles).set({ status: "paused", pauseReason: reason }).where(eq(providerProfiles.id, id));
}

export async function getActiveProviders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(providerProfiles).where(eq(providerProfiles.status, "active"));
}

// ─── Move Requests ────────────────────────────────────────────────────────

export async function getMoveRequestsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moveRequests)
    .where(eq(moveRequests.customerId, customerId))
    .orderBy(desc(moveRequests.createdAt));
}

export async function getMoveRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(moveRequests).where(eq(moveRequests.id, id)).limit(1);
  return result[0];
}

export async function createMoveRequest(data: InsertMoveRequest) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(moveRequests).values(data);
  return result;
}

export async function updateMoveRequest(id: number, data: Partial<InsertMoveRequest>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(moveRequests).set(data).where(eq(moveRequests.id, id));
}

export async function getMoveRequestItems(moveRequestId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moveRequestItems).where(eq(moveRequestItems.moveRequestId, moveRequestId));
}

export async function getMoveRequestItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(moveRequestItems).where(eq(moveRequestItems.id, id)).limit(1);
  return result[0];
}

export async function getAllMoveRequests(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moveRequests)
    .orderBy(desc(moveRequests.createdAt))
    .limit(limit).offset(offset);
}

// ─── Provider Invitations ─────────────────────────────────────────────────

export async function getInvitationsByProvider(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(providerInvitations)
    .where(eq(providerInvitations.providerId, providerId))
    .orderBy(desc(providerInvitations.invitedAt));
}

export async function getInvitationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(providerInvitations).where(eq(providerInvitations.id, id)).limit(1);
  return result[0];
}

export async function updateInvitation(id: number, data: Partial<typeof providerInvitations.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(providerInvitations).set(data).where(eq(providerInvitations.id, id));
}

// ─── Introduction Fees ────────────────────────────────────────────────────

export async function getFeeByInvitation(invitationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(introductionFees)
    .where(eq(introductionFees.invitationId, invitationId)).limit(1);
  return result[0];
}

export async function updateIntroductionFee(id: number, data: Partial<typeof introductionFees.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(introductionFees).set(data).where(eq(introductionFees.id, id));
}

export async function getProviderBillingHistory(providerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(introductionFees)
    .where(eq(introductionFees.providerId, providerId))
    .orderBy(desc(introductionFees.createdAt))
    .limit(50);
}

// ─── Exceptions ───────────────────────────────────────────────────────────

export async function getOpenExceptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exceptions)
    .where(and(eq(exceptions.status, "open")))
    .orderBy(desc(exceptions.createdAt));
}

export async function getAllExceptions(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exceptions)
    .orderBy(desc(exceptions.createdAt))
    .limit(limit);
}

export async function getExceptionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(exceptions).where(eq(exceptions.id, id)).limit(1);
  return result[0];
}

export async function createException(data: typeof exceptions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(exceptions).values(data);
  return result;
}

export async function updateException(id: number, data: Partial<typeof exceptions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(exceptions).set(data).where(eq(exceptions.id, id));
}

export async function getCriticalOpenExceptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exceptions)
    .where(and(eq(exceptions.severity, "critical"), eq(exceptions.status, "open")))
    .orderBy(desc(exceptions.createdAt));
}

// ─── Audit Events ─────────────────────────────────────────────────────────

export async function createAuditEvent(data: typeof auditEvents.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values(data);
}

export async function getAuditEvents(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditEvents)
    .where(and(eq(auditEvents.entityType, entityType), eq(auditEvents.entityId, entityId)))
    .orderBy(desc(auditEvents.createdAt))
    .limit(100);
}

export async function getRecentAuditEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(limit);
}

// ─── Automation Tasks ─────────────────────────────────────────────────────

export async function createAutomationTask(data: typeof automationTasks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(automationTasks).values(data);
  return result;
}

export async function getAutomationTasks(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(automationTasks).orderBy(desc(automationTasks.createdAt)).limit(limit);
}

export async function updateAutomationTask(id: number, data: Partial<typeof automationTasks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(automationTasks).set(data).where(eq(automationTasks.id, id));
}

// ─── Customer Releases ────────────────────────────────────────────────────

export async function createCustomerRelease(data: typeof customerReleases.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(customerReleases).values(data);
  return result;
}

export async function getCustomerRelease(introductionFeeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customerReleases)
    .where(eq(customerReleases.introductionFeeId, introductionFeeId)).limit(1);
  return result[0];
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────

export async function getOpsDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalRequests] = await db.select({ count: sql<number>`COUNT(*)` }).from(moveRequests);
  const [openExceptions] = await db.select({ count: sql<number>`COUNT(*)` }).from(exceptions).where(eq(exceptions.status, "open"));
  const [criticalExceptions] = await db.select({ count: sql<number>`COUNT(*)` }).from(exceptions)
    .where(and(eq(exceptions.severity, "critical"), eq(exceptions.status, "open")));
  const [activeProviders] = await db.select({ count: sql<number>`COUNT(*)` }).from(providerProfiles).where(eq(providerProfiles.status, "active"));
  const [paidFees] = await db.select({ count: sql<number>`COUNT(*)` }).from(introductionFees).where(eq(introductionFees.status, "paid"));

  return {
    totalRequests: Number(totalRequests?.count ?? 0),
    openExceptions: Number(openExceptions?.count ?? 0),
    criticalExceptions: Number(criticalExceptions?.count ?? 0),
    activeProviders: Number(activeProviders?.count ?? 0),
    paidFees: Number(paidFees?.count ?? 0),
  };
}
