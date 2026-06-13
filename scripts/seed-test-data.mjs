/**
 * LeaseMate Test Data Seed Script
 * Creates 3 test user accounts (customer, provider, operator)
 * and associated data for UAT testing.
 *
 * Run: node scripts/seed-test-data.mjs
 */

import mysql from "mysql2/promise";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DB_URL);

console.log("🌱 Seeding LeaseMate test data...\n");

// ─── 1. Test Users ────────────────────────────────────────────────────────────
// These are pre-seeded with stable openIds for local or shared test environments.

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

for (const u of testUsers) {
  await conn.query(
    `INSERT INTO \`users\` (\`openId\`, \`name\`, \`email\`, \`loginMethod\`, \`role\`, \`isFlagged\`, \`lastSignedIn\`)
     VALUES (?, ?, ?, ?, ?, false, NOW())
     ON DUPLICATE KEY UPDATE \`name\` = ?, \`email\` = ?, \`role\` = ?`,
    [u.openId, u.name, u.email, u.loginMethod, u.role, u.name, u.email, u.role]
  );
  const [rows] = await conn.query("SELECT id FROM `users` WHERE `openId` = ?", [u.openId]);
  userIds[u.role] = rows[0].id;
  console.log(`✓ User: ${u.name} (${u.role}) — ID: ${userIds[u.role]}`);
}

// ─── 2. Provider Profile ─────────────────────────────────────────────────────
const providerId = userIds["provider"];
await conn.query(
  `INSERT INTO \`provider_profiles\`
     (\`userId\`, \`businessName\`, \`abn\`, \`phone\`, \`contactEmail\`, \`suburb\`, \`status\`, \`maxJobsPerWeek\`)
   VALUES (?, ?, ?, ?, ?, ?, 'active', 8)
   ON DUPLICATE KEY UPDATE \`businessName\` = VALUES(\`businessName\`)`,
  [
    providerId,
    "Smith & Co Removals",
    "51 824 753 556",
    "0412 345 678",
    "jordan.smith@test.leasemate.com.au",
    "Richmond",
  ]
);
const [provRows] = await conn.query("SELECT id FROM `provider_profiles` WHERE `userId` = ?", [providerId]);
const provProfileId = provRows[0].id;
console.log(`✓ Provider profile: Smith & Co Removals — Profile ID: ${provProfileId}`);

// ─── 3. Service Products (for the test provider) ─────────────────────────────
// Get category IDs
const [cats] = await conn.query("SELECT id, slug FROM `service_categories`");
const catMap = {};
for (const c of cats) catMap[c.slug] = c.id;

const products = [
  {
    categoryId: catMap["removalist"],
    title: "Standard Removalist Package",
    description: "2-person team, 4-hour minimum. Includes truck, blankets, and basic insurance.",
    priceType: "hourly",
    priceAmount: "145.00",
    priceLabel: "$145/hr (min 4hrs)",
    coverageZones: JSON.stringify(["inner", "middle"]),
    propertyTypes: JSON.stringify(["apartment", "house", "townhouse"]),
    maxBedrooms: 4,
    introductionFee: "39.00",
  },
  {
    categoryId: catMap["end-of-lease-cleaning"],
    title: "End-of-Lease Clean (Standard)",
    description: "Full property clean to real estate standard. Includes oven, windows, and bathrooms.",
    priceType: "fixed",
    priceAmount: "320.00",
    priceLabel: "From $320",
    coverageZones: JSON.stringify(["inner", "middle", "outer"]),
    propertyTypes: JSON.stringify(["apartment", "house", "townhouse", "unit"]),
    maxBedrooms: 4,
    introductionFee: "29.00",
  },
];

for (const p of products) {
  await conn.query(
    `INSERT INTO \`service_products\`
       (\`providerId\`, \`categoryId\`, \`title\`, \`description\`, \`priceType\`, \`priceAmount\`, \`priceLabel\`,
        \`coverageZones\`, \`propertyTypes\`, \`maxBedrooms\`, \`introductionFee\`, \`isActive\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
     ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`)`,
    [
      provProfileId, p.categoryId, p.title, p.description,
      p.priceType, p.priceAmount, p.priceLabel,
      p.coverageZones, p.propertyTypes, p.maxBedrooms, p.introductionFee,
    ]
  );
  console.log(`✓ Product: ${p.title}`);
}

// ─── 4. Test Move Request ─────────────────────────────────────────────────────
const customerId = userIds["customer"];
await conn.query(
  `INSERT INTO \`move_requests\`
     (\`customerId\`, \`status\`, \`moveOutDate\`, \`propertyAddress\`, \`propertySuburb\`,
      \`propertyPostcode\`, \`propertyType\`, \`bedrooms\`, \`bathrooms\`, \`accessNotes\`, \`submittedAt\`)
   VALUES (?, 'submitted', DATE_ADD(NOW(), INTERVAL 14 DAY),
           '42 Test Street', 'Richmond', '3121', 'apartment', 2, 1,
           'Key in lockbox. Code: 1234. No lift — ground floor.', NOW())`,
  [customerId]
);
const [mrRows] = await conn.query(
  "SELECT id FROM `move_requests` WHERE `customerId` = ? ORDER BY id DESC LIMIT 1",
  [customerId]
);
const moveRequestId = mrRows[0].id;
console.log(`✓ Move request ID: ${moveRequestId} (customer: Alex Chen)`);

// ─── 5. Move Request Items ────────────────────────────────────────────────────
await conn.query(
  `INSERT INTO \`move_request_items\` (\`moveRequestId\`, \`categoryId\`, \`position\`, \`status\`)
   VALUES (?, ?, 'preferred', 'pending_match')
   ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`)`,
  [moveRequestId, catMap["removalist"]]
);
await conn.query(
  `INSERT INTO \`move_request_items\` (\`moveRequestId\`, \`categoryId\`, \`position\`, \`status\`)
   VALUES (?, ?, 'preferred', 'pending_match')
   ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`)`,
  [moveRequestId, catMap["end-of-lease-cleaning"]]
);
console.log(`✓ Move request items: Removalist + End-of-Lease Cleaning`);

// ─── 6. Summary ──────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                  LEASEMATE TEST ACCOUNTS                         ║
╠══════════════════════════════════════════════════════════════════╣
║  CUSTOMER                                                        ║
║  Name:    Alex Chen                                              ║
║  Email:   alex.chen@test.leasemate.com.au                        ║
║  Role:    customer                                               ║
║  DB ID:   ${String(userIds["customer"]).padEnd(52)}║
║  Login:   Open /login and sign in as Alex Chen                   ║
╠══════════════════════════════════════════════════════════════════╣
║  PROVIDER                                                        ║
║  Name:    Jordan Smith                                           ║
║  Business: Smith & Co Removals                                   ║
║  Email:   jordan.smith@test.leasemate.com.au                     ║
║  Role:    provider                                               ║
║  DB ID:   ${String(userIds["provider"]).padEnd(52)}║
║  ABN:     51 824 753 556                                         ║
║  Suburb:  Richmond                                               ║
╠══════════════════════════════════════════════════════════════════╣
║  OPERATOR                                                        ║
║  Name:    LeaseMate Ops                                          ║
║  Email:   ops@test.leasemate.com.au                              ║
║  Role:    operator                                               ║
║  DB ID:   ${String(userIds["operator"]).padEnd(52)}║
║  Login:   Open /login and sign in as LeaseMate Ops               ║
╠══════════════════════════════════════════════════════════════════╣
║  TEST DATA                                                       ║
║  Move Request ID: ${String(moveRequestId).padEnd(46)}║
║  Property: 42 Test Street, Richmond VIC 3121                     ║
║  Services: Removalist + End-of-Lease Cleaning                    ║
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
