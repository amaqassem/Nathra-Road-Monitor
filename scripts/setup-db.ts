#!/usr/bin/env bun
/**
 * سكريبت إعداد مزود قاعدة البيانات
 * يقرأ DB_PROVIDER من البيئة (sqlite | postgresql) ويعيد كتابة schema.prisma
 *
 * الاستخدام:
 *   DB_PROVIDER=postgresql bun run scripts/setup-db.ts   # لـ Vercel
 *   bun run scripts/setup-db.ts                          # افتراضي sqlite (Hostinger/محلي)
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const schemaPath = join(process.cwd(), "prisma", "schema.prisma");
const provider = (process.env.DB_PROVIDER || "sqlite").toLowerCase();

if (!existsSync(schemaPath)) {
  console.error("✗ schema.prisma not found at", schemaPath);
  process.exit(1);
}

const validProviders = ["sqlite", "postgresql"];
if (!validProviders.includes(provider)) {
  console.error(`✗ Invalid DB_PROVIDER "${provider}". Must be one of: ${validProviders.join(", ")}`);
  process.exit(1);
}

let schema = readFileSync(schemaPath, "utf-8");

// استبدال سطر provider في datasource
schema = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${provider}"`
);

// sqlite لا يدعم @db.Text أو بعض الميزات — نتركها كما هي (Prima متسامح)
writeFileSync(schemaPath, schema);

console.log(`✓ Database provider set to: ${provider}`);
console.log(`  Schema: ${schemaPath}`);

if (provider === "sqlite") {
  console.log("  → For local dev and Hostinger VPS (persistent filesystem)");
} else {
  console.log("  → For Vercel / serverless (requires DATABASE_URL=postgresql://...)");
}
