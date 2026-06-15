/**
 * LeaseMate Stripe Sandbox Setup Script
 * Creates products and prices for all 6 service categories.
 * Run: node scripts/setup-stripe.mjs
 */
import "dotenv/config";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const categories = [
  { slug: "removalist",       name: "Removalist Introduction Fee",          amount: 2500, description: "One-time fee for connecting with a vetted removalist in Greater Melbourne." },
  { slug: "end-of-lease-cleaning", name: "End-of-Lease Cleaning Introduction Fee", amount: 1500, description: "One-time fee for connecting with a vetted end-of-lease cleaner in Greater Melbourne." },
  { slug: "carpet-cleaning",  name: "Carpet Cleaning Introduction Fee",      amount: 1500, description: "One-time fee for connecting with a vetted carpet cleaner in Greater Melbourne." },
  { slug: "pest-control",     name: "Pest Control Introduction Fee",         amount: 1500, description: "One-time fee for connecting with a vetted pest control provider in Greater Melbourne." },
  { slug: "handyman",         name: "Handyman Introduction Fee",             amount: 1500, description: "One-time fee for connecting with a vetted handyman in Greater Melbourne." },
  { slug: "rubbish-removal",  name: "Rubbish Removal Introduction Fee",      amount: 1500, description: "One-time fee for connecting with a vetted rubbish removal provider in Greater Melbourne." },
];

async function setup() {
  console.log("🔑 Stripe account check...");
  const account = await stripe.accounts.retrieve();
  console.log(`✅ Account: ${account.id} | Mode: ${account.livemode ? "LIVE ⚠️" : "TEST ✅"}\n`);

  if (account.livemode) {
    console.error("❌ LIVE mode detected. This script is for sandbox only. Aborting.");
    process.exit(1);
  }

  const results = [];

  for (const cat of categories) {
    console.log(`Creating product: ${cat.name}...`);

    // Check if product already exists
    const existing = await stripe.products.search({
      query: `metadata['category_slug']:'${cat.slug}'`,
    }).catch(() => ({ data: [] }));

    let product;
    if (existing.data.length > 0) {
      product = existing.data[0];
      console.log(`  ↳ Already exists: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: cat.name,
        description: cat.description,
        metadata: {
          category_slug: cat.slug,
          platform: "leasemate",
        },
      });
      console.log(`  ↳ Created: ${product.id}`);
    }

    // Create price for this product
    const prices = await stripe.prices.list({ product: product.id, active: true });
    let price;
    if (prices.data.length > 0) {
      price = prices.data[0];
      console.log(`  ↳ Price already exists: ${price.id} ($${price.unit_amount / 100} AUD)`);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: cat.amount,
        currency: "aud",
        metadata: {
          category_slug: cat.slug,
          platform: "leasemate",
        },
      });
      console.log(`  ↳ Price created: ${price.id} ($${price.unit_amount / 100} AUD)`);
    }

    results.push({
      slug: cat.slug,
      productId: product.id,
      priceId: price.id,
      amount: cat.amount,
    });
  }

  console.log("\n✅ Stripe sandbox setup complete!\n");
  console.log("Copy these into your stripe.ts products file:");
  console.log(JSON.stringify(results, null, 2));
}

setup().catch(err => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});
