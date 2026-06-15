/**
 * LeaseMate Test Data Seed Script
 * Creates stable customer, provider, and operator data for local UAT.
 *
 * Run: node scripts/seed-test-data.mjs
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env", override: true });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DB_URL);

console.log("🌱 Seeding LeaseMate test data...\n");

const SEED_ADDRESS = "42 Test Street";
const SEED_EVENT_TYPES = [
  "seed.provider_invitations_created",
  "seed.exception_created",
];

function placeholders(count) {
  return Array.from({ length: count }, () => "?").join(",");
}

async function deleteByIds(table, column, ids) {
  if (ids.length === 0) return;
  await conn.query(
    `DELETE FROM \`${table}\` WHERE \`${column}\` IN (${placeholders(ids.length)})`,
    ids,
  );
}

const testUsers = [
  {
    openId: "test_customer_001",
    name: "Alex Chen",
    email: "alex.chen@test.leasemate.com.au",
    loginMethod: "local",
    role: "customer",
  },
  {
    openId: "test_provider_001",
    name: "Jordan Smith",
    email: "jordan.smith@test.leasemate.com.au",
    loginMethod: "local",
    role: "provider",
  },
  {
    openId: "test_operator_001",
    name: "LeaseMate Ops",
    email: "ops@test.leasemate.com.au",
    loginMethod: "local",
    role: "operator",
  },
];

const userIds = {};

for (const user of testUsers) {
  await conn.query(
    `INSERT INTO \`users\` (\`openId\`, \`name\`, \`email\`, \`loginMethod\`, \`role\`, \`isFlagged\`, \`lastSignedIn\`)
     VALUES (?, ?, ?, ?, ?, false, NOW())
     ON DUPLICATE KEY UPDATE \`name\` = ?, \`email\` = ?, \`role\` = ?, \`lastSignedIn\` = NOW()`,
    [
      user.openId,
      user.name,
      user.email,
      user.loginMethod,
      user.role,
      user.name,
      user.email,
      user.role,
    ],
  );

  const [rows] = await conn.query(
    "SELECT id FROM `users` WHERE `openId` = ?",
    [user.openId],
  );
  userIds[user.role] = rows[0].id;
  console.log(`✓ User: ${user.name} (${user.role}) — ID: ${userIds[user.role]}`);
}

const providerUserId = userIds.provider;
await conn.query(
  `INSERT INTO \`provider_profiles\`
     (\`userId\`, \`businessName\`, \`abn\`, \`phone\`, \`contactEmail\`, \`suburb\`, \`status\`, \`maxJobsPerWeek\`)
   VALUES (?, ?, ?, ?, ?, ?, 'active', 8)
   ON DUPLICATE KEY UPDATE
     \`businessName\` = VALUES(\`businessName\`),
     \`abn\` = VALUES(\`abn\`),
     \`phone\` = VALUES(\`phone\`),
     \`contactEmail\` = VALUES(\`contactEmail\`),
     \`suburb\` = VALUES(\`suburb\`),
     \`status\` = VALUES(\`status\`),
     \`maxJobsPerWeek\` = VALUES(\`maxJobsPerWeek\`)`,
  [
    providerUserId,
    "Smith & Co Removals",
    "51 824 753 556",
    "0412 345 678",
    "jordan.smith@test.leasemate.com.au",
    "Richmond",
  ],
);

const [providerRows] = await conn.query(
  "SELECT id FROM `provider_profiles` WHERE `userId` = ?",
  [providerUserId],
);
const providerProfileId = providerRows[0].id;
console.log(
  `✓ Provider profile: Smith & Co Removals — Profile ID: ${providerProfileId}`,
);

const [categoryRows] = await conn.query("SELECT id, slug FROM `service_categories`");
const categoryIdBySlug = {};
for (const category of categoryRows) {
  categoryIdBySlug[category.slug] = category.id;
}

for (const slug of ["removalist", "end-of-lease-cleaning"]) {
  if (!categoryIdBySlug[slug]) {
    throw new Error(
      `Required service category '${slug}' is missing. Run node scripts/seed.mjs first.`,
    );
  }
}

await conn.query(
  "DELETE FROM `service_products` WHERE `providerId` = ? AND `title` IN (?, ?)",
  [
    providerProfileId,
    "Standard Removalist Package",
    "End-of-Lease Clean (Standard)",
  ],
);

const products = [
  {
    categoryId: categoryIdBySlug["removalist"],
    title: "Standard Removalist Package",
    description:
      "2-person team, 4-hour minimum. Includes truck, blankets, and basic insurance.",
    priceType: "hourly",
    priceAmount: "145.00",
    priceLabel: "$145/hr (min 4hrs)",
    coverageZones: JSON.stringify(["inner", "middle"]),
    propertyTypes: JSON.stringify(["apartment", "house", "townhouse"]),
    maxBedrooms: 4,
    introductionFee: "39.00",
  },
  {
    categoryId: categoryIdBySlug["end-of-lease-cleaning"],
    title: "End-of-Lease Clean (Standard)",
    description:
      "Full property clean to real estate standard. Includes oven, windows, and bathrooms.",
    priceType: "fixed",
    priceAmount: "320.00",
    priceLabel: "From $320",
    coverageZones: JSON.stringify(["inner", "middle", "outer"]),
    propertyTypes: JSON.stringify(["apartment", "house", "townhouse", "unit"]),
    maxBedrooms: 4,
    introductionFee: "29.00",
  },
];

for (const product of products) {
  await conn.query(
    `INSERT INTO \`service_products\`
       (\`providerId\`, \`categoryId\`, \`title\`, \`description\`, \`priceType\`, \`priceAmount\`, \`priceLabel\`,
        \`coverageZones\`, \`propertyTypes\`, \`maxBedrooms\`, \`introductionFee\`, \`isActive\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
    [
      providerProfileId,
      product.categoryId,
      product.title,
      product.description,
      product.priceType,
      product.priceAmount,
      product.priceLabel,
      product.coverageZones,
      product.propertyTypes,
      product.maxBedrooms,
      product.introductionFee,
    ],
  );
  console.log(`✓ Product: ${product.title}`);
}

const customerId = userIds.customer;
const [existingMoveRequestRows] = await conn.query(
  "SELECT id FROM `move_requests` WHERE `customerId` = ? AND `propertyAddress` = ?",
  [customerId, SEED_ADDRESS],
);
const existingMoveRequestIds = existingMoveRequestRows.map((row) => row.id);

if (existingMoveRequestIds.length > 0) {
  const [existingItemRows] = await conn.query(
    `SELECT id FROM \`move_request_items\` WHERE \`moveRequestId\` IN (${placeholders(existingMoveRequestIds.length)})`,
    existingMoveRequestIds,
  );
  const existingItemIds = existingItemRows.map((row) => row.id);

  if (existingItemIds.length > 0) {
    await deleteByIds("provider_invitations", "moveRequestItemId", existingItemIds);
    await deleteByIds("customer_releases", "moveRequestItemId", existingItemIds);
    await deleteByIds("introduction_fees", "moveRequestItemId", existingItemIds);
    await deleteByIds("move_request_items", "id", existingItemIds);
  }

  await conn.query(
    `DELETE FROM \`exceptions\` WHERE \`entityType\` = 'seeded_uat' AND \`moveRequestId\` IN (${placeholders(existingMoveRequestIds.length)})`,
    existingMoveRequestIds,
  );
  await conn.query(
    `DELETE FROM \`audit_events\` WHERE \`eventType\` IN (${placeholders(SEED_EVENT_TYPES.length)}) AND \`entityType\` = 'move_request' AND \`entityId\` IN (${placeholders(existingMoveRequestIds.length)})`,
    [...SEED_EVENT_TYPES, ...existingMoveRequestIds],
  );
  await deleteByIds("move_requests", "id", existingMoveRequestIds);
}

await conn.query(
  `INSERT INTO \`move_requests\`
     (\`customerId\`, \`status\`, \`moveOutDate\`, \`propertyAddress\`, \`propertySuburb\`,
      \`propertyPostcode\`, \`propertyType\`, \`bedrooms\`, \`bathrooms\`, \`accessNotes\`, \`submittedAt\`)
   VALUES (?, 'submitted', DATE_ADD(NOW(), INTERVAL 14 DAY),
           ?, 'Richmond', '3121', 'apartment', 2, 1,
           'Key in lockbox. Code: 1234. No lift — ground floor.', NOW())`,
  [customerId, SEED_ADDRESS],
);

const [moveRequestRows] = await conn.query(
  "SELECT id FROM `move_requests` WHERE `customerId` = ? AND `propertyAddress` = ? ORDER BY id DESC LIMIT 1",
  [customerId, SEED_ADDRESS],
);
const moveRequestId = moveRequestRows[0].id;
console.log(`✓ Move request ID: ${moveRequestId} (customer: Alex Chen)`);

await conn.query(
  `INSERT INTO \`move_request_items\` (\`moveRequestId\`, \`categoryId\`, \`position\`, \`status\`)
   VALUES (?, ?, 'preferred', 'pending_match')`,
  [moveRequestId, categoryIdBySlug.removalist],
);
await conn.query(
  `INSERT INTO \`move_request_items\` (\`moveRequestId\`, \`categoryId\`, \`position\`, \`status\`)
   VALUES (?, ?, 'preferred', 'pending_match')`,
  [moveRequestId, categoryIdBySlug["end-of-lease-cleaning"]],
);
console.log("✓ Move request items: Removalist + End-of-Lease Cleaning");

const [itemRows] = await conn.query(
  "SELECT id, categoryId FROM `move_request_items` WHERE `moveRequestId` = ? ORDER BY `id` ASC",
  [moveRequestId],
);
const moveRequestItemIdByCategoryId = {};
for (const item of itemRows) {
  moveRequestItemIdByCategoryId[item.categoryId] = item.id;
}

const invitations = [
  moveRequestItemIdByCategoryId[categoryIdBySlug.removalist],
  moveRequestItemIdByCategoryId[categoryIdBySlug["end-of-lease-cleaning"]],
];

for (const moveRequestItemId of invitations) {
  await conn.query(
    `INSERT INTO \`provider_invitations\`
       (\`moveRequestItemId\`, \`providerId\`, \`status\`, \`invitedAt\`, \`expiresAt\`)
     VALUES (?, ?, 'pending', NOW(), DATE_ADD(NOW(), INTERVAL 48 HOUR))`,
    [moveRequestItemId, providerProfileId],
  );
}
console.log("✓ Provider invitations: 2 pending opportunities");

await conn.query(
  `INSERT INTO \`exceptions\`
     (\`code\`, \`severity\`, \`affectedParty\`, \`entityType\`, \`entityId\`, \`moveRequestId\`, \`providerId\`, \`customerId\`, \`description\`, \`status\`)
   VALUES ('EX-11', 'warning', 'Operator', 'seeded_uat', ?, ?, ?, ?, ?, 'open')`,
  [
    moveRequestId,
    moveRequestId,
    providerProfileId,
    customerId,
    "Seeded UAT exception for operator workflow review.",
  ],
);
console.log("✓ Open exception: EX-11 seeded for ops workflow");

await conn.query(
  `INSERT INTO \`audit_events\`
     (\`eventType\`, \`entityType\`, \`entityId\`, \`actorType\`, \`actorId\`, \`description\`)
   VALUES
     ('seed.provider_invitations_created', 'move_request', ?, 'system', NULL, ?),
     ('seed.exception_created', 'move_request', ?, 'system', NULL, ?)`,
  [
    moveRequestId,
    "Seeded two provider invitations for local UAT.",
    moveRequestId,
    "Seeded EX-11 operator workflow exception for local UAT.",
  ],
);

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                  LEASEMATE TEST ACCOUNTS                         ║
╠══════════════════════════════════════════════════════════════════╣
║  CUSTOMER                                                        ║
║  Name:    Alex Chen                                              ║
║  Email:   alex.chen@test.leasemate.com.au                        ║
║  Role:    customer                                               ║
║  DB ID:   ${String(userIds.customer).padEnd(52)}║
║  Login:   Open /login and sign in as Alex Chen                   ║
╠══════════════════════════════════════════════════════════════════╣
║  PROVIDER                                                        ║
║  Name:    Jordan Smith                                           ║
║  Business: Smith & Co Removals                                   ║
║  Email:   jordan.smith@test.leasemate.com.au                     ║
║  Role:    provider                                               ║
║  DB ID:   ${String(userIds.provider).padEnd(52)}║
║  ABN:     51 824 753 556                                         ║
║  Suburb:  Richmond                                               ║
╠══════════════════════════════════════════════════════════════════╣
║  OPERATOR                                                        ║
║  Name:    LeaseMate Ops                                          ║
║  Email:   ops@test.leasemate.com.au                              ║
║  Role:    operator                                               ║
║  DB ID:   ${String(userIds.operator).padEnd(52)}║
║  Login:   Open /login and sign in as LeaseMate Ops               ║
╠══════════════════════════════════════════════════════════════════╣
║  TEST DATA                                                       ║
║  Move Request ID: ${String(moveRequestId).padEnd(46)}║
║  Property: 42 Test Street, Richmond VIC 3121                     ║
║  Services: Removalist + End-of-Lease Cleaning                    ║
║  Invitations: 2 pending provider opportunities                   ║
║  Exception: EX-11 open for ops testing                           ║
║  Move-out: 14 days from now                                      ║
╠══════════════════════════════════════════════════════════════════╣
║  STRIPE TEST CARD                                                ║
║  Card:   4242 4242 4242 4242                                     ║
║  Expiry: Any future date (e.g. 12/28)                            ║
║  CVC:    Any 3 digits (e.g. 123)                                 ║
║  ZIP:    Any 5 digits (e.g. 12345)                               ║
╚══════════════════════════════════════════════════════════════════╝
`);

await conn.end();
console.log("✅ Seed complete.");
